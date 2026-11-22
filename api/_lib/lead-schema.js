// The normalised Leaflegal lead, built on the server from the form's raw answers (public/assets/form-options.js).
// The browser's own question text and derived fields are not trusted: everything here is rebuilt from the form data,
// and any answer that should have ended the form (an exit) is refused.
//
// Lead shape handed to storeLead(lead) in api/_lib/leads.js (the lawyer platform):
// {
//   area, areaLabel, matter, matterLabel, matterPage (true if /<area>/<matter> exists), audience: 'individual'|'business',
//   urgency (one of URGENCY), deadline 'YYYY-MM-DD'|null, postcode ('' when outside the UK), postcodeArea, region, country,
//   value { band, min, max }|null, valueLabel, privatePay (one of PRIVATE_PAY), business { name, number }|null,
//   answers [{ id, q, a }] (every qualifying question and answer, in order), tags [string], quality { score, grade },
//   summary, contact { fullName, firstName, lastName, email, phone, phoneVerified, emailVerified },
//   consent { terms, share, version, at, text, marketing }, source { page, referrer, utm, first },
//   checks { phone, email } (raw Bird results or null), flags [string], formVersion, createdAt
// }
export {
  AREAS, AREA_SLUGS, MATTERS, URGENCY, PRIVATE_PAY, REGIONS, POSTCODE_REGIONS, TAGS, VALUE_BANDS, FORMS, FORM_VERSION,
  areaOf, matterOf, regionOf, postcodeArea, countryOf,
} from '../../public/assets/form-options.js';
import { AREAS, FORMS, URGENCY, PRIVATE_PAY, SHARED_STEPS, POSTCODE_RE, NOT_EW, areaOf, matterOf, regionOf, postcodeArea, countryOf, pathOf, derive, FORM_VERSION } from '../../public/assets/form-options.js';

export const UNSURE = 'not-sure';
const t = (v, n) => (v == null ? '' : String(v).trim().slice(0, n));
const SHARED_IDS = new Set(Object.keys(SHARED_STEPS));

// Check the raw answers against the form. Returns { error } or { answers, derived, company }.
export function checkAnswers(area, ans) {
  if (area === UNSURE) return { answers: [], derived: { audience: 'individual', matter: null, tags: [], value: null, valueLabel: null, deadline: null } };
  if (!FORMS[area]) return { error: 'Please go back and choose what you need help with.' };
  const raw = ans && typeof ans === 'object' ? ans : {};
  const path = pathOf(area, raw), answers = [];
  let company = '';
  for (const s of path) {
    if (SHARED_IDS.has(s.id)) continue;
    const v = raw[s.id];
    if (s.options) {
      const picked = [].concat(v ?? []).map((x) => s.options.find((o) => o.v === x));
      if (!picked.length || picked.some((o) => !o)) return { error: 'Please go back and answer every question.' };
      if (s.type === 'single' && picked.length !== 1) return { error: 'Please go back and answer every question.' };
      if (picked.some((o) => o.exit)) return { error: 'Sorry, the firms we work with can’t help with this kind of enquiry.' };
      answers.push({ id: s.id, q: s.q, a: picked.map((o) => o.label).join(', ') });
    } else if (s.type === 'date') {
      if (v === 'none' || (!v && s.optional)) { answers.push({ id: s.id, q: s.q, a: 'Not sure' }); continue; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return { error: 'Please go back and check the date.' };
      answers.push({ id: s.id, q: s.q, a: new Date(v + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) });
    } else {
      const x = t(v, 160);
      if (x.length < 2 && !s.optional) return { error: 'Please go back and answer every question.' };
      if (s.type === 'company') company = x;
      if (x) answers.push({ id: s.id, q: s.q, a: x });
    }
  }
  return { answers: answers.slice(0, 40), derived: derive(area, raw), company };
}

// Quality score for sorting and pricing: urgency, readiness to instruct, money at stake, verified contact details.
export function quality(lead) {
  let s = 40;
  s += { Urgently: 20, 'Within a month': 14, 'In the next few months': 6 }[lead.urgency] || 0;
  s += lead.privatePay === 'Yes' ? 15 : 6;
  if (lead.value?.min >= 500000) s += 10; else if (lead.value?.min >= 100000) s += 6; else if (lead.value) s += 3;
  if (lead.deadline) s += 4;
  if (lead.contact.phoneVerified) s += 6;
  if (lead.checks?.email && lead.checks.email.result === 'valid') s += 3;
  if (lead.summary) s += 2;
  if (lead.flags.length) s = Math.min(s, 20);
  s = Math.max(0, Math.min(100, s));
  return { score: s, grade: s >= 75 ? 'A' : s >= 55 ? 'B' : 'C' };
}

// Validate the posted body and build the lead. Returns { error, field? } or { lead }.
export function buildLead(raw, extra = {}) {
  const ar = raw.area === UNSURE ? UNSURE : areaOf(t(raw.area, 60))?.slug;
  if (!ar) return { error: 'Please go back and choose what you need help with.' };
  const info = AREAS.find((x) => x.slug === ar);
  const chk = checkAnswers(ar, raw.ans);
  if (chk.error) return chk;
  const d = chk.derived;

  const urgency = t(raw.urgency, 40), privatePay = t(raw.privatePay, 40);
  const urgencyOpt = SHARED_STEPS.urgency.options.find((o) => o.v === urgency);
  if (!urgencyOpt || urgencyOpt.exit) return { error: 'Please go back and tell us how soon you need help.' };
  if (!PRIVATE_PAY.includes(privatePay)) return { error: 'The firms we work with charge privately for their work.' };

  const outside = raw.outsideUK === true && info?.scope === 'uk';
  const postcode = outside ? '' : t(raw.postcode, 10).toUpperCase().replace(/\s+/g, '').replace(/(\d[A-Z]{2})$/, ' $1');
  if (!outside && !POSTCODE_RE.test(postcode)) return { error: 'Please go back and enter a full UK postcode.' };
  if (info?.scope === 'ew' && NOT_EW.test(postcode)) return { error: 'For this area of law we can only help with matters in England and Wales.' };
  if (info?.businessOnly && d.audience !== 'business') return { error: 'We can only help businesses recover money owed by other businesses.' };

  const summary = t(raw.summary, 500);
  if (ar === UNSURE && summary.length < 5) return { error: 'Please go back and tell us briefly what you need help with.' };
  const businessName = t(raw.business, 160) || chk.company || '';
  if (d.audience === 'business' && businessName.length < 2) return { error: 'Please go back and enter the business name.' };

  const m = d.matter ? matterOf(ar, d.matter) : null;
  const fullName = t(raw.fullName, 140).replace(/\s+/g, ' ');
  const lead = {
    area: ar, areaLabel: info?.label || 'Not sure yet', matter: m?.slug || null, matterLabel: m?.label || null, matterPage: !!m?.page,
    audience: d.audience, urgency, deadline: d.deadline || null,
    postcode, postcodeArea: postcodeArea(postcode), region: outside ? 'Outside the UK' : regionOf(postcode), country: outside ? 'outside' : countryOf(postcode),
    value: d.value || null, valueLabel: d.valueLabel || null, privatePay,
    business: d.audience === 'business' ? { name: businessName, number: t(raw.companyNumber, 12).toUpperCase() || null } : null,
    answers: chk.answers, tags: [...new Set([...(d.tags || []), ...(urgencyOpt.tags || []), ...(privatePay === 'Yes' ? ['ready'] : []), ...(outside ? ['outside-uk'] : [])])],
    summary,
    contact: { fullName, firstName: t(raw.firstName, 60) || fullName.split(' ')[0], lastName: t(raw.lastName, 80) || fullName.split(' ').slice(1).join(' '),
      email: t(raw.email, 200).toLowerCase(), phone: t(raw.phone, 20), phoneVerified: false, emailVerified: false },
    consent: { terms: raw.consentTerms === true, share: raw.consentShare === true, version: t(raw.consentVersion, 20), at: t(raw.consentAt, 40), text: t(raw.consentText, 1000), marketing: raw.marketing === true },
    source: { page: t(raw.page, 500), referrer: t(raw.referrer, 500), utm: extra.utm || {}, first: raw.first && typeof raw.first === 'object' ? raw.first : null },
    checks: { phone: null, email: null }, flags: [], formVersion: t(raw.formVersion, 20) || FORM_VERSION, createdAt: new Date().toISOString(),
  };
  return { lead };
}

// Fill in the live check results and flags, then score the lead.
export function finishLead(lead, { pc = null, ec = null, flags = [], phoneConfirmed = false, emailConfirmed = false } = {}) {
  lead.checks = { phone: pc, email: ec };
  lead.flags = flags;
  lead.contact.phoneVerified = !!(pc && pc.reachable === true);
  lead.contact.emailVerified = !!(ec && ec.result === 'valid');
  if (pc && pc.reachable === false && phoneConfirmed) lead.tags.push('phone-unconfirmed');
  if (ec && ec.result !== 'valid' && emailConfirmed) lead.tags.push('email-unconfirmed');
  lead.quality = quality(lead);
  return lead;
}
