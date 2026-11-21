import { promises as dns } from 'node:dns';
import { createHash } from 'node:crypto';
import { configured as platformOn, ingestLead, duplicateOf, allow, resendSlot, linkedinEvent, isStarter, countsAsLead } from './_lib/platform.js';
import { checkPhone, checkEmail, problem } from './_lib/verify.js';
import { chProfile, tradingBand, directorDob } from './_lib/ch.js';
import { human } from './_lib/turnstile.js';

// POST /api/enquiry: saves a business finance enquiry to the broker platform (emails admin only if that fails).
// Meta Conversions API: META_CAPI_TOKEN (required to send), META_PIXEL_ID (default LoanLeaf dataset), META_TEST_EVENT_CODE (optional).
// Env: RESEND_API_KEY (required), ENQUIRY_TO (default aran@verticalbrands.co), ENQUIRY_FROM (default onboarding@resend.dev).
const FIELDS = [
  ['amount', 'Amount'], ['purpose', 'Purpose'], ['timeline', 'Needed'], ['structure', 'Structure'],
  ['trading', 'Trading for'], ['turnover', 'Annual revenue'], ['property', 'Homeowner or tenant'], ['credit', 'Missed payments / CCJs (6 yrs)'], ['debt', 'Existing loans or finance'], ['debtLeft', 'Left to repay'], ['debtMonthly', 'Monthly repayments'], ['business', 'Business'], ['companyNumber', 'Company number'], ['directorMatch', 'Listed director'],
  ['fullName', 'Full name'], ['email', 'Email'], ['phone', 'Mobile'],
  ['consentAt', 'Consent given at'], ['consentVersion', 'Consent wording version'], ['consentText', 'Consent wording'],
  ['page', 'Page'], ['referrer', 'Referrer'],
];
const esc = (s) => String(s ?? '').slice(0, 1000).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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

// Enquiries in these revenue bands (from any page) also send CompleteRegistration (a standard event, so Meta doesn't hold it for custom-event review) for that campaign to optimise towards. Bands = the form's options (assets/apply.js).
const REVENUE = ['Under £50k', '£50k to £100k', '£100k to £250k', '£250k to £500k', '£500k to £1m', '£1m to £5m', '£5m+']; // the form's options, in order
export const PREMIUM_REVENUE = ['£500k to £1m', '£1m to £5m', '£5m+'];
export function metaEvents(b) {
  const premium = PREMIUM_REVENUE.includes(b.turnover);
  // Every enquiry is a Lead, except smaller/newer businesses (under £50k revenue or under 6 months trading, sent to Aureum free):
  // not counted as a Lead on Meta or LinkedIn, so ads don't optimise towards them. £500k+ revenue also CompleteRegistration.
  // Custom revenue events for campaigns to optimise towards, only for businesses trading 1 year or more. They stack:
  // TierCLead = £100k+ revenue, TierBLead = £250k+, TierALead = £500k+ (a £1m business sends all three). Neutral names: Meta's financial-services rules bar money figures in event names.
  const lead = countsAsLead(b), i = REVENUE.indexOf(b.turnover), year = ['1 to 2 years', '2 to 5 years', '5+ years'].includes(b.trading);
  const revenue = lead && year ? [[2, 'TierCLead'], [3, 'TierBLead'], [4, 'TierALead']].filter(([min]) => i >= min).map(([, n]) => n) : [];
  return { premium, lead, qualified: premium, revenue };
}

// Send a Lead event to Meta's Conversions API for every genuine enquiry (owner's decision, with legal advice, 2026-11-04).
// Personal data is SHA-256 hashed before it leaves our server, as Meta requires. Never throws or delays the response for long.
const sha = (v) => (v ? createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined);
// Same Lead (and £500k+ CompleteRegistration) to LinkedIn's Conversions API. Meta's result is what's reported back.
async function sendLeadEvents(b, req, qualified, extra = []) {
  const li = { email: b.email, first: b.firstName, last: b.lastName, company: b.business };
  const [meta] = await Promise.all([sendMetaLead(b, req, qualified, extra), linkedinEvent('Lead', { ...li, eventId: b.eventId }),
    qualified ? linkedinEvent('CompleteRegistration', { ...li, eventId: b.eventId ? `${b.eventId}-q` : undefined }) : null]);
  return meta;
}

// Meta ad click ID. The browser keeps it for the visit (sessionStorage), but in-app browsers, reloads and new tabs lose it.
// The ?fbclid= is nearly always still in the URL params, page, referrer or first landing page we were sent, so rebuild it
// from those: without it Meta can't tie the lead to the ad click, and Ads Manager under-reports leads.
export function fbcOf(b) {
  if (b.fbc && /^fb\.1\.\d+\..+/.test(String(b.fbc))) return String(b.fbc);
  const direct = b.utm && typeof b.utm === 'object' ? b.utm.fbclid : null;
  const found = direct || (JSON.stringify([b.page, b.referrer, b.first]).match(/fbclid=([A-Za-z0-9_-]+)/) || [])[1];
  if (!found) return '';
  const at = Number(new Date(b.first?.at || b.first?.t || 0)) || Date.now();
  return `fb.1.${at}.${String(found).slice(0, 250)}`;
}
async function sendMetaLead(b, req, qualified, extra = []) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return 'skipped: no token';
  const pixel = process.env.META_PIXEL_ID || '658905286613269';
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined;
  const user = {
    em: [sha(b.email)], ph: [sha(String(b.phone).replace(/\D/g, ''))], fn: [sha(b.firstName)], ln: [sha(b.lastName)],
    country: [sha('gb')], external_id: [sha(b.email)], client_ip_address: ip, client_user_agent: req.headers['user-agent'],
    ...(fbcOf(b) ? { fbc: fbcOf(b) } : {}), ...(b.fbp ? { fbp: b.fbp } : {}),
  };
  const ev = (name, id) => ({
    event_name: name, event_time: Math.floor(Date.now() / 1000), event_id: id, action_source: 'website',
    event_source_url: b.page, user_data: user,
    custom_data: { currency: 'GBP', content_name: 'Business finance enquiry', content_category: b.purpose, loan_amount: b.amount, lead_type: b.structure },
  });
  const body = {
    data: [ev('Lead', b.eventId || undefined), ...(qualified ? [ev('CompleteRegistration', b.eventId ? `${b.eventId}-q` : undefined)] : []),
      ...extra.map((n) => ev(n, b.eventId ? `${b.eventId}-${n}` : undefined))], // ids match the pixel's (apply.js done())
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(3000),
    });
    const out = await r.text();
    if (!r.ok) console.error('meta capi', r.status, out);
    return r.ok ? 'sent' : `error ${r.status}`;
  } catch (err) { console.error('meta capi', err.message); return 'error'; }
}

// Only used when saving to the platform fails, so the enquiry still reaches a person.
async function fallbackEmail(b, checkLine) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const utm = Object.entries(b.utm || {}).map(([k, v]) => `${esc(k)}=${esc(v)}`).join(', ');
  const rows = FIELDS.map(([k, l]) => `<tr><td style="padding:6px 12px;color:#579e84">${l}</td><td style="padding:6px 12px;font-weight:700;color:#244237">${esc(b[k]) || '–'}</td></tr>`).join('')
    + (utm ? `<tr><td style="padding:6px 12px;color:#579e84">UTM</td><td style="padding:6px 12px">${utm}</td></tr>` : '')
    + `<tr><td style="padding:6px 12px;color:#579e84">Checks</td><td style="padding:6px 12px">${esc(checkLine)}</td></tr>`;
  await resendSlot();
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Loanleaf <${process.env.ENQUIRY_FROM || 'onboarding@resend.dev'}>`,
      to: (process.env.ENQUIRY_TO || 'aran@verticalbrands.co').split(','),
      reply_to: b.email,
      subject: `[Not saved to platform] Finance enquiry: ${b.business} – ${b.amount || ''}`.slice(0, 200),
      html: `<div style="font-family:Arial,sans-serif"><h2 style="color:#244237">Enquiry not saved to the platform</h2><p>Add it by hand.</p><table style="border-collapse:collapse">${rows}</table></div>`,
    }),
  }).catch((e) => ({ ok: false, status: e.message, text: async () => '' }));
  if (!r.ok) console.error('fallback email', r.status, await r.text());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

  if (!b.firstName || !b.lastName || !b.business) return res.status(400).json({ error: 'Missing fields' }); // the form splits Full name into first/last
  if (b.consentTerms !== true || b.consentShare !== true) return res.status(400).json({ error: 'Consent required' });
  if (!/^\+447\d{9}$/.test(b.phone || '')) return res.status(400).json({ field: 'phone', error: 'Please enter a UK mobile number, e.g. 07700 900123' });
  const email = String(b.email || '').trim();
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(email)) return res.status(400).json({ field: 'email', error: 'Please enter a valid email address' });
  if (!(await canReceiveMail(email.split('@')[1]))) return res.status(400).json({ field: 'email', error: "That email domain doesn't seem to accept mail. Please check it." });

  // Bot check first, before any paid lookups (Bird, Companies House).
  const ip0 = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined;
  if (!(await human(b.turnstile, ip0))) return res.status(400).json({ error: 'Please tick the box to confirm you’re not a robot, then try again.' });

  // Company picked from Companies House on the form (null when typed in by hand). Strings only, trimmed.
  const t = (v, n) => (v == null ? null : String(v).slice(0, n));
  const co = b.company && /^[A-Z0-9]{8}$/i.test(b.company.number || '') ? b.company : null;
  b.company = co ? { number: co.number.toUpperCase(), status: t(co.status, 40), type: t(co.type, 60), incorporated: t(co.incorporated, 10), address: t(co.address, 300),
    director: t(co.director, 120), directorListed: !!co.directorListed, ...(co.directorListed && co.role === 'Secretary' ? { role: 'Secretary' } : {}) } : null;
  if (!b.company) return res.status(400).json({ error: 'We can only help limited companies and LLPs registered at Companies House.' });
  // A director picked from the list only counts if the name given matches it (the name field can be changed or autofilled after).
  const words = (v) => String(v || '').toLowerCase().normalize('NFKD').replace(/[^a-z\s'-]/g, '').split(/[\s-]+/).filter(Boolean);
  if (b.company.directorListed && !words(b.lastName).some((w) => words(b.company.director).includes(w))) b.company.directorListed = false;
  // The official record wins over what the browser sent: name, status, dates, address, plus industry and filing flags.
  if (b.company) {
    // Director picked from the list: their month/year of birth from the register (never from the browser).
    const [p, dob] = await Promise.all([chProfile(b.company.number).catch((e) => { console.error('ch profile', e.message); return null; }),
      b.company.directorListed && !b.company.role ? directorDob(b.company.number, b.company.director).catch((e) => { console.error('ch officers', e.message); return null; }) : null]);
    if (dob) b.company.directorDob = dob;
    if (p) {
      Object.assign(b.company, { status: p.status, type: p.type, incorporated: p.incorporated, address: p.address, profile: p });
      if (p.title) b.business = p.title;
      const band = p.incorporated && tradingBand(p.incorporated);
      if (band) b.trading = band;
    }
  }
  b.companyNumber = b.company?.number || '';
  b.variant = b.variant === '500k' ? '500k' : null;
  const ev = metaEvents(b);
  b.premium = ev.premium;
  const metaOut = { lead: ev.lead, qualified: ev.qualified, revenue: ev.revenue }; // tells the browser which pixel events to fire
  b.directorMatch = b.company ? (b.company.directorListed ? `Yes${b.company.role ? ' (company secretary)' : ''}: ${b.company.director}${b.company.directorDob ? ` (born ${b.company.directorDob})` : ''}` : (b.company.director ? `No: picked ${b.company.director} from the list, but gave a different name` : 'Not listed as a director')) : 'Company entered by hand';

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (platformOn() && !(await allow(`enquiry:${ip}`, 3600, 8))) return res.status(429).json({ error: 'Too many enquiries from this connection. Please try again later.' });
  // Flag, don't drop: a human can judge borderline cases.
  const flags = [];
  if (b.website) flags.push('honeypot filled');
  if (Number(b._ms) < 5000) flags.push(`completed in ${b._ms}ms`);
  // Our own tests: open any form page with ?test=1. Never saved, matched or sent to brokers; no paid checks or Conversions API (the pixel still fires).
  if (b.utm && typeof b.utm === 'object' && 'test' in b.utm) flags.push('test submission');

  // Live checks (Bird): is the mobile reachable, does the mailbox exist. Skipped for likely spam to save the cost.
  const [pc, ec] = flags.length ? [null, null] : await Promise.all([checkPhone(b.phone), checkEmail(email)]);
  const ask = problem(pc, ec, b);
  if (ask) return res.status(400).json(ask);
  b.checks = { at: new Date().toISOString(), phone: pc, email: ec, phoneConfirmed: !!b.phoneConfirmed, emailConfirmed: !!b.emailConfirmed };
  const checkLine = [pc ? `phone ${pc.reachable === true ? 'reachable' : pc.reachable === false ? 'NOT reachable (confirmed by applicant)' : 'unknown'}${pc.carrier ? ` (${pc.carrier})` : ''}` : 'phone not checked',
    ec ? `email ${ec.result}${b.emailConfirmed ? ' (confirmed by applicant)' : ''}` : 'email not checked'].join('; ');

  // Lead conversion for Meta ads: sent for every enquiry regardless of cookie choice (server-side, sets no cookies),
  // but never for flagged (possible spam) enquiries.
  // Repeat enquiries (same phone or email, 90 days) were already counted, so they send no Meta events, server or pixel.
  const repeat = !flags.length && platformOn() ? await duplicateOf(b).catch(() => null) : null;
  if (repeat) Object.assign(metaOut, { lead: false, qualified: false, revenue: [] });
  const meta = flags.length ? 'skipped: flagged' : repeat ? `skipped: repeat of ${repeat}` : !ev.lead ? 'skipped: smaller/newer business (not a Lead)' : await sendLeadEvents(b, req, ev.qualified, ev.revenue);
  console.log('meta lead', meta);
  // Leads live in the platform only (Admin → All leads); no email per lead. Flagged (possible spam) enquiries are never listed.
  if (flags.length) { console.log('enquiry flagged, not listed', flags.join('; '), b.business); return res.status(200).json({ ok: true, meta: metaOut }); }
  let match = null, again = null; // auto-bought: the broker's public profile, shown on the confirmation page
  try { if (!platformOn()) throw new Error('platform not configured'); const r = await ingestLead(b); match = r.match || null; again = r.again ? { rematch: r.rematch } : null; delete r.match; delete r.rematch; console.log('platform lead', JSON.stringify(r)); }
  catch (e) { console.error('platform ingest', e.message); await fallbackEmail(b, checkLine); } // never lose a lead: email only if the platform failed
  return res.status(200).json({ ok: true, match, ...(again ? { again: true, rematch: again.rematch } : {}), meta: metaOut });
}
