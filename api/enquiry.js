import { promises as dns } from 'node:dns';
import { createHash } from 'node:crypto';
import { configured as platformOn, allow, resendSlot } from './_lib/platform.js';
import { checkPhone, checkEmail, problem } from './_lib/verify.js';
import { human } from './_lib/turnstile.js';
import { buildLead, finishLead } from './_lib/lead-schema.js';

// POST /api/enquiry: a legal enquiry from the qualifying form (assets/enquire.js). Stored in the lawyer platform, emailed to
// the team only if that fails, and the person gets a short confirmation.
// Matter details are special category or criminal offence data (UK GDPR Art. 9/10): they go in the team email only,
// never to Meta or LinkedIn, and never in the confirmation to the person (a mistyped address must not leak them).
// Env: RESEND_API_KEY (required), ENQUIRY_TO (default aran@verticalbrands.co), ENQUIRY_FROM (default onboarding@resend.dev).
// Meta Conversions API (only with marketing consent): META_CAPI_TOKEN, META_PIXEL_ID, META_TEST_EVENT_CODE (optional).

// The form's areas, matters and questions live in public/assets/form-options.js. The lead is rebuilt and checked from
// them in api/_lib/lead-schema.js, handed to the lawyer platform (storeLead in api/_lib/leads.js), and emailed to the
// team as a fallback when the platform is missing or fails, so nothing is lost.
const FIELDS = [
  ['areaLabel', 'Help with'], ['matterLabel', 'Matter'], ['audience', 'For'], ['urgency', 'Urgency'], ['deadline', 'Key date'], ['postcode', 'Postcode'], ['region', 'Region'],
  ['valueText', 'Value'], ['privatePay', 'Ready to instruct'], ['businessText', 'Business'], ['summary', 'Summary'],
  ['fullName', 'Full name'], ['email', 'Email'], ['phone', 'Mobile'], ['grade', 'Quality'], ['tagsText', 'Tags'],
  ['consentAt', 'Consent given at'], ['consentVersion', 'Consent wording version'], ['consentText', 'Consent wording'],
  ['page', 'Page'], ['referrer', 'Referrer'],
];
const esc = (s) => String(s ?? '').slice(0, 1000).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const t = (v, n) => (v == null ? '' : String(v).trim().slice(0, n));

// True unless DNS clearly says the domain has no mail server. Timeouts and other DNS errors pass, so a DNS hiccup never blocks a real lead.
async function canReceiveMail(domain) {
  const check = async () => {
    try { return (await dns.resolveMx(domain)).length > 0; }
    catch (err) {
      if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') return true;
      try { return (await dns.resolve(domain)).length > 0; } catch { return false; } // no MX: mail falls back to the A record
    }
  };
  return Promise.race([check(), new Promise((r) => setTimeout(() => r(true), 2500))]);
}

// Meta ad click ID, rebuilt from the landing URL when the browser lost it (in-app browsers, reloads, new tabs).
export function fbcOf(b) {
  if (b.fbc && /^fb\.1\.\d+\..+/.test(String(b.fbc))) return String(b.fbc);
  const direct = b.utm && typeof b.utm === 'object' ? b.utm.fbclid : null;
  const found = direct || (JSON.stringify([b.page, b.referrer, b.first]).match(/fbclid=([A-Za-z0-9_-]+)/) || [])[1];
  if (!found) return '';
  const at = Number(new Date(b.first?.at || b.first?.t || 0)) || Date.now();
  return `fb.1.${at}.${String(found).slice(0, 250)}`;
}

// A generic Lead for Meta, only when the person accepted marketing cookies. Hashed email and phone, nothing about the matter.
const sha = (v) => (v ? createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined);
export function metaLeadBody(b, req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined;
  return {
    data: [{
      event_name: 'Lead', event_time: Math.floor(Date.now() / 1000), event_id: b.eventId || undefined, action_source: 'website',
      event_source_url: String(b.page || '').split('?')[0], // no query string: it can carry the ?area= preselect
      user_data: { em: [sha(b.email)], ph: [sha(String(b.phone).replace(/\D/g, ''))], country: [sha('gb')], client_ip_address: ip, client_user_agent: req.headers['user-agent'],
        ...(fbcOf(b) ? { fbc: fbcOf(b) } : {}), ...(b.fbp ? { fbp: b.fbp } : {}) },
      custom_data: { content_name: 'Enquiry' },
    }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };
}
async function sendMetaLead(b, req) {
  const token = process.env.META_CAPI_TOKEN, pixel = process.env.META_PIXEL_ID;
  if (!token || !pixel) return 'skipped: not set up';
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metaLeadBody(b, req)), signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) console.error('meta capi', r.status, await r.text());
    return r.ok ? 'sent' : `error ${r.status}`;
  } catch (err) { console.error('meta capi', err.message); return 'error'; }
}

async function send(msg) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not set');
  await resendSlot();
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `Leaflegal <${process.env.ENQUIRY_FROM || 'onboarding@resend.dev'}>`, ...msg }),
  });
  if (!r.ok) throw new Error(`resend ${r.status} ${await r.text()}`);
}

export function teamEmail(b, checkLine) {
  const utm = Object.entries(b.utm || {}).map(([k, v]) => `${esc(k)}=${esc(v)}`).join(', ');
  const rows = FIELDS.filter(([k]) => b[k]).map(([k, l]) => `<tr><td style="padding:6px 12px;color:#579e83;vertical-align:top">${l}</td><td style="padding:6px 12px;font-weight:700;color:#244237;white-space:pre-wrap">${esc(b[k])}</td></tr>`).join('')
    + (utm ? `<tr><td style="padding:6px 12px;color:#579e83">UTM</td><td style="padding:6px 12px">${utm}</td></tr>` : '')
    + `<tr><td style="padding:6px 12px;color:#579e83">Checks</td><td style="padding:6px 12px">${esc(checkLine)}</td></tr>`
    + (b.answers || []).map((x) => `<tr><td style="padding:6px 12px;color:#579e83;vertical-align:top">${esc(x.q)}</td><td style="padding:6px 12px;color:#244237">${esc(x.a)}</td></tr>`).join('');
  const notes = [b.area === 'immigration' && 'Immigration: refer only to an SRA, CILEx or IAA regulated adviser.', 'Introduce to one regulated firm only. The firm must tell the client about the referral fee in writing.'].filter(Boolean);
  return {
    to: (process.env.ENQUIRY_TO || 'aran@verticalbrands.co').split(','),
    reply_to: b.email,
    subject: `New enquiry: ${b.areaLabel}${b.matterLabel ? ` (${b.matterLabel})` : ''}, ${b.urgency}`.slice(0, 200),
    html: `<div style="font-family:Arial,sans-serif"><h2 style="color:#244237">New Leaflegal enquiry</h2><table style="border-collapse:collapse">${rows}</table>`
      + `<p style="color:#5a6f66;font-size:13px">${notes.join('<br>')}<br>This email contains special category or criminal offence data. Do not forward it beyond the firm you introduce.</p></div>`,
  };
}
export function confirmEmail(b) {
  return {
    to: [b.email], reply_to: process.env.ENQUIRY_TO?.split(',')[0] || 'hello@leaflegal.co',
    subject: 'We’ve got your enquiry',
    html: `<div style="font-family:Arial,sans-serif;color:#244237;max-width:560px"><p>Hi ${esc(b.firstName)},</p>`
      + '<p>Thanks for your enquiry. We’re now looking for one regulated law firm that handles this kind of matter in your area. The firm will contact you, usually by phone, to see if they can help. They will explain their fees before you agree to anything.</p>'
      + '<p>If you didn’t make this enquiry, or you’d like us to stop, just reply to this email.</p>'
      + '<p>The Leaflegal team</p><p style="color:#5a6f66;font-size:12px">Leaflegal is a trading name of Vertical Brands Ltd. We are not a law firm and do not give legal advice.</p></div>',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const raw = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

  const utm = raw.utm && typeof raw.utm === 'object' ? Object.fromEntries(Object.entries(raw.utm).slice(0, 20).map(([k, v]) => [t(k, 40), t(v, 200)])) : {};
  const hdr = (k) => { try { return decodeURIComponent(String(req.headers[k] || '')); } catch { return ''; } };
  const built = buildLead(raw, { utm, geo: { country: hdr('x-vercel-ip-country'), postal: hdr('x-vercel-ip-postal-code') } });
  if (built.error) return res.status(400).json(built);
  const lead = built.lead, c = lead.contact;
  // Fields the email and Meta helpers use.
  const b = {
    ...c, area: lead.area, areaLabel: lead.areaLabel, matterLabel: lead.matterLabel, audience: lead.audience, urgency: lead.urgency, deadline: lead.deadline,
    postcode: lead.postcode || (lead.locationSource === 'ip' ? 'Not asked' : 'Outside the UK'), region: lead.region, privatePay: lead.privatePay, summary: lead.summary, answers: lead.answers,
    valueText: lead.value ? `${lead.valueLabel}: ${lead.value.band}` : '', businessText: lead.business ? [lead.business.name, lead.business.number].filter(Boolean).join(', ') : '',
    tagsText: lead.tags.join(', '), consentAt: lead.consent.at, consentVersion: lead.consent.version, consentText: lead.consent.text, consentTerms: lead.consent.terms, consentShare: lead.consent.share,
    phoneConfirmed: !!raw.phoneConfirmed, emailConfirmed: !!raw.emailConfirmed, marketing: lead.consent.marketing,
    fbc: t(raw.fbc, 300), fbp: t(raw.fbp, 120), eventId: t(raw.eventId, 80), website: t(raw.website, 200), _ms: Number(raw._ms) || 0,
    page: lead.source.page, referrer: lead.source.referrer, utm, first: lead.source.first,
  };

  if (!c.firstName || !c.lastName) return res.status(400).json({ field: 'fullName', error: 'Please enter your first and last name' });
  if (!b.consentTerms || !b.consentShare) return res.status(400).json({ error: 'Please refresh the page and try again.' });
  if (!/^\+447\d{9}$/.test(c.phone)) return res.status(400).json({ field: 'phone', error: 'Please enter a UK mobile number, for example 07700 900123' });
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(c.email)) return res.status(400).json({ field: 'email', error: 'Please enter a valid email address' });
  if (!(await canReceiveMail(c.email.split('@')[1]))) return res.status(400).json({ field: 'email', error: "That email domain doesn't seem to accept mail. Please check it." });

  // Bot check first, before any paid lookups (Bird).
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (!(await human(raw.turnstile, ip))) return res.status(400).json({ error: 'Please tick the box to confirm you’re not a robot, then try again.' });
  if (platformOn() && !(await allow(`enquiry:${ip}`, 3600, 8))) return res.status(429).json({ error: 'Too many enquiries from this connection. Please try again later.' });

  // Flag, don't drop: a human can judge borderline cases.
  const flags = [];
  if (b.website) flags.push('honeypot filled');
  if (b._ms < 5000) flags.push(`completed in ${b._ms}ms`);
  // Our own tests: open any form page with ?test=1. No paid checks, no Conversions API, subject marked [TEST].
  const test = 'test' in b.utm;
  if (test) flags.push('test submission');

  // Live checks (Bird): is the mobile reachable, does the mailbox exist. Skipped for likely spam to save the cost.
  const [pc, ec] = flags.length ? [null, null] : await Promise.all([checkPhone(b.phone), checkEmail(b.email)]);
  const ask = problem(pc, ec, b);
  if (ask) return res.status(400).json(ask);
  const checkLine = [pc ? `phone ${pc.reachable === true ? 'reachable' : pc.reachable === false ? 'NOT reachable (confirmed by applicant)' : 'unknown'}${pc.carrier ? ` (${pc.carrier})` : ''}` : 'phone not checked',
    ec ? `email ${ec.result}${b.emailConfirmed ? ' (confirmed by applicant)' : ''}` : 'email not checked', flags.length ? `FLAGGED: ${flags.join('; ')}` : ''].filter(Boolean).join('; ');

  const meta = flags.length ? 'skipped: flagged' : !b.marketing ? 'skipped: no marketing consent' : await sendMetaLead(b, req);
  console.log('meta lead', meta);

  finishLead(lead, { pc, ec, flags, phoneConfirmed: b.phoneConfirmed, emailConfirmed: b.emailConfirmed });
  b.grade = `${lead.quality.grade} (${lead.quality.score})`;

  // The lawyer platform stores, prices and routes the lead. Flagged leads are stored hidden for review, never sold.
  let stored = null;
  try {
    const mod = await import('./_lib/leads.js').catch((e) => { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; return null; });
    if (mod?.storeLead) stored = await mod.storeLead(lead);
  } catch (e) { console.error('storeLead', e.message); }

  if (!stored) {
    try {
      const team = teamEmail(b, checkLine);
      if (flags.length) team.subject = `[${test ? 'TEST' : 'CHECK'}] ${team.subject}`;
      await send(team);
    } catch (e) {
      console.error('enquiry email', e.message);
      return res.status(500).json({ error: 'Sorry, something went wrong sending your details.' });
    }
  }
  if (!flags.length) await send(confirmEmail(b)).catch((e) => console.error('confirmation email', e.message));
  return res.status(200).json({ ok: true, id: stored?.id || null, meta: { lead: !flags.length } });
}
