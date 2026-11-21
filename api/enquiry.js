import { promises as dns } from 'node:dns';
import { createHash } from 'node:crypto';
import { configured as platformOn, allow, resendSlot } from './_lib/platform.js';
import { checkPhone, checkEmail, problem } from './_lib/verify.js';
import { human } from './_lib/turnstile.js';

// POST /api/enquiry: a legal enquiry from the form (assets/apply.js). Emailed to the team (ENQUIRY_TO), who pick one regulated
// firm by hand; the person gets a short confirmation. No platform yet, so nothing is stored here beyond the email.
// Matter details are special category or criminal offence data (UK GDPR Art. 9/10): they go in the team email only,
// never to Meta or LinkedIn, and never in the confirmation to the person (a mistyped address must not leak them).
// Env: RESEND_API_KEY (required), ENQUIRY_TO (default aran@verticalbrands.co), ENQUIRY_FROM (default onboarding@resend.dev).
// Meta Conversions API (only with marketing consent): META_CAPI_TOKEN, META_PIXEL_ID, META_TEST_EVENT_CODE (optional).

// Must match the form's options (assets/apply.js).
export const AREAS = ['Buying or selling a home', 'Immigration', 'Family law', 'Recovering a business debt', 'A motoring offence', 'Licensing', 'Extending a lease', 'Not sure yet'];
const URGENCY = ['Urgently', 'Within a month', 'In the next few months', 'Just looking into it'];
const PAY = ['Yes', 'Yes, if the cost is right'];
const EW_ONLY = ['Buying or selling a home', 'Family law', 'Recovering a business debt', 'A motoring offence', 'Licensing', 'Extending a lease'];
const NOT_EW = /^(AB|DD|DG|EH|FK|G|HS|IV|KA|KW|KY|ML|PA|PH|ZE|BT)\d/i;
const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const FIELDS = [
  ['area', 'Help with'], ['matter', 'Matter'], ['audience', 'For'], ['debtor', 'Owed by'], ['urgency', 'Urgency'], ['postcode', 'Postcode'],
  ['privatePay', 'Can pay privately'], ['business', 'Business'], ['summary', 'Summary'],
  ['fullName', 'Full name'], ['email', 'Email'], ['phone', 'Mobile'],
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
    + `<tr><td style="padding:6px 12px;color:#579e83">Checks</td><td style="padding:6px 12px">${esc(checkLine)}</td></tr>`;
  const notes = [b.area === 'Immigration' && 'Immigration: refer only to an SRA, CILEx or IAA regulated adviser.', 'Introduce to one regulated firm only. The firm must tell the client about the referral fee in writing.'].filter(Boolean);
  return {
    to: (process.env.ENQUIRY_TO || 'aran@verticalbrands.co').split(','),
    reply_to: b.email,
    subject: `New enquiry: ${b.area}${b.matter ? ` (${b.matter})` : ''}, ${b.urgency}`.slice(0, 200),
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

  // Only the fields we expect, trimmed and capped.
  const b = {
    area: t(raw.area, 60), matter: t(raw.matter, 80), audience: raw.audience === 'business' ? 'business' : 'individual', debtor: t(raw.debtor, 40),
    urgency: t(raw.urgency, 40), postcode: t(raw.postcode, 10).toUpperCase(), privatePay: t(raw.privatePay, 40), summary: t(raw.summary, 500),
    business: t(raw.business, 160), firstName: t(raw.firstName, 60), lastName: t(raw.lastName, 80), fullName: t(raw.fullName, 140),
    email: t(raw.email, 200), phone: t(raw.phone, 20), phoneConfirmed: !!raw.phoneConfirmed, emailConfirmed: !!raw.emailConfirmed,
    consentTerms: raw.consentTerms === true, consentShare: raw.consentShare === true, consentVersion: t(raw.consentVersion, 20), consentAt: t(raw.consentAt, 40), consentText: t(raw.consentText, 1000),
    marketing: raw.marketing === true, fbc: t(raw.fbc, 300), fbp: t(raw.fbp, 120), eventId: t(raw.eventId, 80),
    website: t(raw.website, 200), _ms: Number(raw._ms) || 0, page: t(raw.page, 500), referrer: t(raw.referrer, 500),
    utm: raw.utm && typeof raw.utm === 'object' ? Object.fromEntries(Object.entries(raw.utm).slice(0, 20).map(([k, v]) => [t(k, 40), t(v, 200)])) : {}, first: raw.first && typeof raw.first === 'object' ? raw.first : null,
  };

  if (!b.firstName || !b.lastName) return res.status(400).json({ field: 'fullName', error: 'Please enter your first and last name' });
  if (!b.consentTerms || !b.consentShare) return res.status(400).json({ error: 'Please tick both boxes so we can pass your enquiry to a law firm.' });
  if (!AREAS.includes(b.area) || !URGENCY.includes(b.urgency)) return res.status(400).json({ error: 'Please go back and answer every question.' });
  if (!POSTCODE.test(b.postcode)) return res.status(400).json({ error: 'Please go back and enter a full UK postcode.' });
  // Out of scope: the form stops these first, so these only catch tampered requests.
  if (b.area === 'Recovering a business debt' && (b.audience !== 'business' || b.debtor !== 'Another business')) return res.status(400).json({ error: 'We can only help businesses recover money owed by other businesses.' });
  if (EW_ONLY.includes(b.area) && NOT_EW.test(b.postcode)) return res.status(400).json({ error: 'For this area of law we can only help with matters in England and Wales.' });
  if (b.audience === 'individual' && !PAY.includes(b.privatePay)) return res.status(400).json({ error: 'The firms we work with charge privately for their work.' });
  if (b.area === 'Not sure yet' && !b.summary) return res.status(400).json({ error: 'Please go back and tell us briefly what you need help with.' });
  if (!/^\+447\d{9}$/.test(b.phone)) return res.status(400).json({ field: 'phone', error: 'Please enter a UK mobile number, e.g. 07700 900123' });
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(b.email)) return res.status(400).json({ field: 'email', error: 'Please enter a valid email address' });
  if (!(await canReceiveMail(b.email.split('@')[1]))) return res.status(400).json({ field: 'email', error: "That email domain doesn't seem to accept mail. Please check it." });

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

  try {
    const team = teamEmail(b, checkLine);
    if (flags.length) team.subject = `[${test ? 'TEST' : 'CHECK'}] ${team.subject}`;
    await send(team);
  } catch (e) {
    console.error('enquiry email', e.message);
    return res.status(500).json({ error: 'Sorry, something went wrong sending your details.' });
  }
  if (!flags.length) await send(confirmEmail(b)).catch((e) => console.error('confirmation email', e.message));
  return res.status(200).json({ ok: true, meta: { lead: !flags.length } });
}
