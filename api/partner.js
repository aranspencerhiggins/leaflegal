import { createHash } from 'node:crypto';
import { sealHandoff, db, metaEvent } from './_lib/platform.js';
import { teamNotice } from './_lib/email-layout.js';
import { capture, sourceFrom, describeSource, runFlows, REGISTER_URL } from './_lib/crm.js';

// POST /api/partner: emails a law firm partner enquiry (/partners/apply) to the team via Resend, adds the firm to the CRM
// and returns a sign-up link that prefills platform.leaflegal.co/register. Same env as api/enquiry.js.
const FIELDS = [
  ['form', 'Type'], ['route', 'Route'], ['model', 'Campaign model'], ['company', 'Firm'], ['budget', 'Monthly budget for leads'], ['areas', 'Practice areas'], ['regulator', 'Regulator'], ['coverage', 'Coverage'], ['regulatorRef', 'Regulator number'],
  ['volume', 'Plan / leads per month'], ['delivery', 'Delivery'], ['start', 'Start'],
  ['firstName', 'First name'], ['lastName', 'Last name'], ['role', 'Role'], ['email', 'Email'], ['phone', 'Phone'], ['site', 'Website'], ['notes', 'Notes'],
  ['consentText', 'Consent wording'], ['page', 'Page'], ['referrer', 'Referrer'],
];
const esc = (s) => String(Array.isArray(s) ? s.join(', ') : s ?? '').slice(0, 2000).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Team notification for the partner form, in the shared email shell. Bot checks show as a red note.
export const partnerEmailHtml = (b, kind, flags = []) => teamNotice({ heading: `New ${kind.toLowerCase()}`, preheader: `${b.company || ''}${b.volume ? `, ${b.volume} leads a month` : ''}`,
  rows: FIELDS.filter(([k]) => b[k] && (!Array.isArray(b[k]) || b[k].length)).map(([k, l]) => [l, (Array.isArray(b[k]) ? b[k].join(', ') : String(b[k])).slice(0, 2000)]),
  note: flags.length ? `<b style="color:#c0392b">Check</b> ${esc(flags.join(', '))}` : '' });

// ---------------------------------------------------------------- call booking (Google Calendar)
// Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN (from /api/google-auth), GOOGLE_CALENDAR_ID (default primary).
// Slots: 30 minutes, weekdays 12:00 to 17:00 UK time, next 14 days, at least 2 hours' notice, not on UK bank holidays or busy times.
const genv = (k) => String(process.env[k] || '').trim(); // pasted keys often carry a stray space or newline
const TZ = 'Europe/London', SLOT_MIN = 30, DAY_FROM = 12, DAY_TO = 17, DAYS_AHEAD = 14, NOTICE_MS = 2 * 36e5;
const gOn = () => !!(genv("GOOGLE_CLIENT_ID") && genv("GOOGLE_CLIENT_SECRET") && genv("GOOGLE_REFRESH_TOKEN"));
const CAL = () => encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || 'primary');
const REDIRECT = 'https://leaflegal.co/api/google-callback';
// Minutes London is ahead of UTC at a moment (0 in winter, 60 in summer).
const tzOff = (ms) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(ms / 6e4) * 6e4;
};
const londonMs = (y, m, d, h, mi) => { const g = Date.UTC(y, m, d, h, mi); return g - tzOff(g - tzOff(g)); };
const londonDay = (ms) => new Date(ms + tzOff(ms)).toISOString().slice(0, 10);
let bankHols = null;
async function holidays() {
  if (bankHols) return bankHols;
  try { const j = await fetch('https://www.gov.uk/bank-holidays.json', { signal: AbortSignal.timeout(3000) }).then((r) => r.json()); bankHols = new Set(j['england-and-wales'].events.map((e) => e.date)); }
  catch { bankHols = new Set(); }
  return bankHols;
}
async function gToken() {
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: genv("GOOGLE_CLIENT_ID"), client_secret: genv("GOOGLE_CLIENT_SECRET"),
    refresh_token: genv("GOOGLE_REFRESH_TOKEN"), grant_type: 'refresh_token' }), signal: AbortSignal.timeout(5000) });
  const j = await r.json(); if (!j.access_token) throw new Error(`google token ${r.status} ${j.error || ''}`); return j.access_token;
}
// Every allowed slot start (ms) in the window, before checking the calendar.
async function candidateSlots(now = Date.now()) {
  const hol = await holidays(), out = [];
  const [y, m, d] = londonDay(now).split('-').map(Number);
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const day = new Date(Date.UTC(y, m - 1, d + i)), dow = day.getUTCDay();
    if (dow === 0 || dow === 6 || hol.has(day.toISOString().slice(0, 10))) continue;
    for (let mins = DAY_FROM * 60; mins + SLOT_MIN <= DAY_TO * 60; mins += SLOT_MIN) {
      const t = londonMs(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), Math.floor(mins / 60), mins % 60);
      if (t >= now + NOTICE_MS) out.push(t);
    }
  }
  return out;
}
async function busy(token, from, to) {
  const r = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin: new Date(from).toISOString(), timeMax: new Date(to).toISOString(), timeZone: TZ, items: [{ id: process.env.GOOGLE_CALENDAR_ID || 'primary' }] }), signal: AbortSignal.timeout(6000) });
  const j = await r.json(); if (!r.ok) throw new Error(`google freebusy ${r.status}`);
  return Object.values(j.calendars || {})[0]?.busy?.map((x) => [Date.parse(x.start), Date.parse(x.end)]) || [];
}
const freeOf = (slots, b) => slots.filter((t) => !b.some(([s, e]) => t < e && t + SLOT_MIN * 6e4 > s));
const page = (res, code, body) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.status(code).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Leaflegal calendar</title><body style="font:16px/1.5 system-ui;max-width:640px;margin:48px auto;padding:0 20px;color:#244237">${body}</body>`); };

async function booking(action, req, res, b) {
  // One-off setup: connect the Google Calendar and show the refresh token to paste into Vercel.
  if (action === 'google-auth') {
    if (!genv("GOOGLE_CLIENT_ID")) return page(res, 503, '<h1>Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel first.</h1>');
    const q = new URLSearchParams({ client_id: genv("GOOGLE_CLIENT_ID"), redirect_uri: REDIRECT, response_type: 'code', access_type: 'offline', prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy' });
    res.setHeader('Location', `https://accounts.google.com/o/oauth2/v2/auth?${q}`); return res.status(302).send('');
  }
  if (action === 'google-callback') {
    const code = new URL(req.url, 'http://x').searchParams.get('code');
    if (!code) return page(res, 400, '<h1>Google didn’t send a code. Try /api/google-auth again.</h1>');
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ code, client_id: genv("GOOGLE_CLIENT_ID"), client_secret: genv("GOOGLE_CLIENT_SECRET"), redirect_uri: REDIRECT, grant_type: 'authorization_code' }) });
    const j = await r.json();
    if (!j.refresh_token) return page(res, 400, `<h1>No refresh token came back</h1><p>${esc(j.error_description || j.error || 'Remove Leaflegal from your Google account’s third-party access, then try /api/google-auth again.')}</p>`);
    return page(res, 200, `<h1>Calendar connected</h1><p>Copy this value into Vercel as <b>GOOGLE_REFRESH_TOKEN</b> (Production), then redeploy. Don't share it with anyone.</p><textarea readonly rows="4" style="width:100%;font:13px monospace" onclick="this.select()">${esc(j.refresh_token)}</textarea>`);
  }
  if (action === 'slots') {
    res.setHeader('Cache-Control', 'no-store');
    if (!gOn()) return res.json({ configured: false, slots: [] });
    try {
      const c = await candidateSlots(); if (!c.length) return res.json({ configured: true, slots: [] });
      const free = freeOf(c, await busy(await gToken(), c[0], c[c.length - 1] + SLOT_MIN * 6e4));
      return res.json({ configured: true, tz: TZ, minutes: SLOT_MIN, slots: free.map((t) => new Date(t).toISOString()) });
    } catch (e) { console.error('slots', e.message); return res.json({ configured: false, slots: [], error: 'unavailable' }); }
  }
  if (action === 'book' && req.method === 'POST') {
    if (!gOn()) return res.status(503).json({ error: 'Booking isn’t available right now' });
    const t = Date.parse(b.slot), name = `${b.firstName || ''} ${b.lastName || ''}`.trim(), meet = b.how === 'meet'; // default: we phone their mobile
    if (b.hp || !name || !b.company || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(b.email || '')) return res.status(400).json({ error: 'Missing details' });
    if (!(await candidateSlots()).includes(t)) return res.status(400).json({ error: 'That time isn’t available. Please pick another.' });
    try {
      const token = await gToken();
      if (!freeOf([t], await busy(token, t, t + SLOT_MIN * 6e4)).length) return res.status(409).json({ error: 'Sorry, that time has just been taken. Please pick another.' });
      const answers = [['Company', b.company], ['Name', name], ['Position', b.role], ['Email', b.email], ['Phone', b.phone], ['Website', b.site], ['Leads per month', b.volume], ['Monthly budget', b.budget],
        ['Practice areas', b.areas], ['Regulator', b.regulator], ['Lead delivery', b.delivery], ['Start', b.start], ['Notes', b.notes]]
        .filter(([, v]) => v && (!Array.isArray(v) || v.length)).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
      const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${CAL()}/events?conferenceDataVersion=1&sendUpdates=all`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ summary: `Leaflegal partner call (${meet ? 'Google Meet' : 'phone'}): ${String(b.company).slice(0, 80)}`,
          description: `${meet ? 'Google Meet call' : `Phone call: Leaflegal calls ${name} on ${b.phone}`}\nBooked from leaflegal.co/partners/apply\n\n${answers}`.slice(0, 7000),
          ...(meet ? {} : { location: `Phone: ${String(b.phone || '').slice(0, 30)}` }),
          start: { dateTime: new Date(t).toISOString(), timeZone: TZ }, end: { dateTime: new Date(t + SLOT_MIN * 6e4).toISOString(), timeZone: TZ },
          attendees: [{ email: String(b.email).trim(), displayName: name.slice(0, 80) }],
          ...(meet ? { conferenceData: { createRequest: { requestId: `ll-${t}-${Math.random().toString(36).slice(2, 10)}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } } } : {}),
          reminders: { useDefault: true } }),
      });
      const ev = await r.json();
      if (!r.ok) { console.error('book', r.status, JSON.stringify(ev).slice(0, 300)); return res.status(502).json({ error: 'We couldn’t book that time. Please try again.' }); }
      try { // CRM: the call is the next action on their record
        const r = await capture({ email: b.email, company: b.company, stage: 'call_booked', note: `Partner ${meet ? 'Google Meet' : 'phone'} call booked for ${new Date(t).toLocaleString('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${meet ? (ev.hangoutLink ? ` · ${ev.hangoutLink}` : '') : ` · call ${b.phone}`}` });
        if (r?.contact) await db(`crm_contacts?id=eq.${r.contact.id}`, { method: 'PATCH', body: { next_action: meet ? 'Partner call (Google Meet)' : `Partner call: phone ${String(b.phone || '').slice(0, 20)}`, next_action_at: new Date(t).toISOString() } });
      } catch (e) { console.error('crm book', e.message); }
      await metaEvent('PartnerCallBooked', { req, email: b.email, phone: b.phone, first: b.firstName, last: b.lastName, page: b.page,
        eventId: b.eventId ? `${b.eventId}-cb` : undefined, fbc: b.fbc, fbp: b.fbp, custom: { content_name: meet ? 'Google Meet call' : 'Phone call' } });
      return res.json({ ok: true, start: new Date(t).toISOString(), how: meet ? 'meet' : 'phone', meet: ev.hangoutLink || null });
    } catch (e) { console.error('book', e.message); return res.status(502).json({ error: 'We couldn’t book that time. Please try again.' }); }
  }
  return res.status(404).json({ error: 'Not found' });
}

// Bespoke campaign enquiries from /partners/bespoke-campaigns. No consent tick box (notice under the button, wording sent as consentText).
async function campaign(req, res, b) {
  b.form = 'Bespoke campaign';
  if (!b.firstName || !b.lastName || !b.company || !b.model || !b.budget || !b.regulator || !Array.isArray(b.areas) || !b.areas.length
    || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(b.email || '') || !/^(?:0|\+?44)\d{9,10}$/.test(String(b.phone || '').replace(/[\s()-]/g, '')))
    return res.status(400).json({ error: 'Missing or invalid fields' });
  const flags = [];
  if (b.hp) flags.push('honeypot filled');
  if (Number(b._ms) < 2000) flags.push(`completed in ${b._ms}ms`);
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ error: 'Email not configured' });
  const rows = FIELDS.filter(([k]) => b[k] && (!Array.isArray(b[k]) || b[k].length)).map(([k, l]) => `<tr><td style="padding:6px 12px;color:#579e84;vertical-align:top">${l}</td><td style="padding:6px 12px;font-weight:700;color:#244237;white-space:pre-wrap">${esc(b[k]) || '–'}</td></tr>`).join('')
    + (flags.length ? `<tr><td style="padding:6px 12px;color:#c0392b">Check</td><td style="padding:6px 12px;color:#c0392b">${flags.join(', ')}</td></tr>` : '');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Leaflegal <${process.env.ENQUIRY_FROM || 'hello@leaflegal.co'}>`,
      to: (process.env.ENQUIRY_TO || 'hello@leaflegal.co').split(','), reply_to: b.email,
      subject: `${flags.length ? '[Check] ' : ''}Bespoke campaign enquiry from ${b.company} (${b.model}, ${b.budget})`.slice(0, 200),
      html: `<div style="font-family:Arial,sans-serif"><h2 style="color:#244237">New bespoke campaign enquiry</h2><table style="border-collapse:collapse">${rows}</table></div>`,
    }),
  });
  if (!r.ok) { console.error('resend campaign', r.status, await r.text()); return res.status(502).json({ error: 'Send failed' }); }
  if (!flags.length) {
    try {
      const src = b.source && typeof b.source === 'object' ? b.source : {};
      await capture({ email: b.email, name: `${b.firstName} ${b.lastName}`.trim(), company: b.company, phone: b.phone, budget: b.budget, position: b.role, website: b.site,
        source: sourceFrom(src), sourceDetail: describeSource(src), utm: Object.keys(src).length ? src : null, stage: 'new', tags: ['Law firm', 'Bespoke campaign'],
        note: `Bespoke campaign enquiry on leaflegal.co · ${b.model} · ${[].concat(b.areas).join(', ')} · budget ${b.budget}` });
    } catch (e) { console.error('crm capture campaign', e.message); }
  }
  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  const action = new URL(req.url, 'http://x').searchParams.get('action');
  const b = req.method === 'POST' ? (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}) : {};
  if (action) return booking(action, req, res, b);
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  b.form = 'legal'; // every partner is a law firm
  if (b.kind === 'campaign') return campaign(req, res, b);
  if (!b.firstName || !b.lastName || !b.company || b.consent !== true
    || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(b.email || '') || !/^(?:0|\+?44)\d{9,10}$/.test(String(b.phone || '').replace(/[\s()-]/g, '')))
    return res.status(400).json({ error: 'Missing or invalid fields' });

  const kind = 'Law firm partner enquiry';
  const flags = [];
  if (b.hp) flags.push('honeypot filled');
  if (Number(b._ms) < 2000) flags.push(`completed in ${b._ms}ms`); // bots: well under 2s. People with autofill can finish in 3-5s.

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ error: 'Email not configured' });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Leaflegal <${process.env.ENQUIRY_FROM || 'hello@leaflegal.co'}>`,
      to: (process.env.ENQUIRY_TO || 'hello@leaflegal.co').split(','),
      reply_to: b.email,
      subject: `${flags.length ? '[Check] ' : ''}Law firm enquiry from ${b.company}${b.volume ? ` (${b.volume} leads a month)` : ''}`.slice(0, 200),
      html: partnerEmailHtml(b, kind, flags),
    }),
  });
  if (!r.ok) { console.error('resend', r.status, await r.text()); return res.status(502).json({ error: 'Send failed' }); }
  if (!flags.length && process.env.META_CAPI_TOKEN) {
    const sha = (v) => (v ? createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined);
    const digits = String(b.phone).replace(/\D/g, '').replace(/^0/, '44');
    const ev = { data: [{ event_name: 'SubmitApplication', event_time: Math.floor(Date.now() / 1000), event_id: b.eventId || undefined, action_source: 'website', event_source_url: b.page,
      user_data: { em: [sha(b.email)], ph: [sha(digits)], fn: [sha(b.firstName)], ln: [sha(b.lastName)], country: [sha('gb')], external_id: [sha(b.email)],
        client_ip_address: String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined, client_user_agent: req.headers['user-agent'], ...(b.fbc ? { fbc: b.fbc } : {}), ...(b.fbp ? { fbp: b.fbp } : {}) },
      custom_data: { content_name: kind, leads_per_month: b.volume } }],
      ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}) };
    try {
      const m = await fetch(`https://graph.facebook.com/v21.0/${process.env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(process.env.META_CAPI_TOKEN)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ev), signal: AbortSignal.timeout(3000) });
      if (!m.ok) console.error('meta capi partner', m.status, await m.text());
    } catch (err) { console.error('meta capi partner', err.message); }
  }
  // Into the CRM (spam-flagged submissions are left out). A plain enquiry gets the "new" flow's first email straight away.
  if (!flags.length) {
    try {
      const src = b.source && typeof b.source === 'object' ? b.source : {}, call = b.route === 'Booked a call';
      const r = await capture({ email: b.email, name: `${b.firstName} ${b.lastName}`.trim(), company: b.company, phone: b.phone, leadsPerMonth: b.volume, budget: b.budget,
        source: call ? 'Booked a call' : sourceFrom(src), sourceDetail: describeSource(src), utm: Object.keys(src).length ? src : null,
        stage: call ? 'call_booked' : 'new', tags: ['Law firm'], note: `Law firm ${call ? 'booked a call' : 'sent an enquiry'} on leaflegal.co${b.volume ? ` · ${b.volume} leads a month` : ''}${b.budget ? ` · budget ${b.budget}` : ''}` });
      if (r?.contact?.stage === 'new') await runFlows({ contactIds: [r.contact.id] });
    } catch (e) { console.error('crm capture', e.message); }
  }
  // Encrypted hand-off so platform.leaflegal.co/register?h=… can prefill the sign-up form (api/platform.js action=handoff).
  let handoff = null;
  try { if (!flags.length) handoff = sealHandoff({ company: b.company, contactName: `${b.firstName} ${b.lastName}`.trim(), email: b.email, phone: b.phone, volume: b.volume }); } catch {}
  return res.status(200).json({ ok: true, handoff, register: handoff ? `${REGISTER_URL}?h=${encodeURIComponent(handoff)}` : REGISTER_URL });
}
export const _test = { candidateSlots, londonMs, freeOf, tzOff };
