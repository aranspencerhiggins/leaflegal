// Stores a legal enquiry on the platform and sells it: auto-buy for the first matching firm (fair rotation), otherwise
// new-lead emails to matching firms that buy by hand, "outside your criteria" emails and invite alerts.
// Called by api/enquiry.js with the normalised lead from api/_lib/lead-schema.js (shape in docs/PLATFORM-LEGAL-SPEC.md).
// Always returns a truthy object: { id, matched, firm? } plus details (duplicateOf, hidden, price, buyer, alerted, invited).
import { toAreaSlug, toUrgency, toPrivatePay, areaLabel, matterLabel, GRADES } from './taxonomy.js';
import {
  db, rpc, price, getPricing, duplicateOf, followUp, deliver, lowCredits, inviteLeadAlerts, publicProfile, fits, matches, canTake,
  waivedIds, suggest, suggestMode, newLeadAlert, firstTouch, gbp,
} from './platform.js';

const clip = (v, n) => (v == null ? '' : String(v).trim().slice(0, n));
const orNull = (v, n) => clip(v, n) || null;
const int = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) && v !== null && v !== '' ? n : null; };

// UK postcode tidied: upper case, one space before the inward code.
export const tidyPostcode = (p) => { const s = String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return s.length >= 5 ? `${s.slice(0, -3)} ${s.slice(-3)}` : s; };
export const outwardOf = (p) => { const t = tidyPostcode(p); return t.includes(' ') ? t.split(' ')[0] : t.length >= 2 && t.length <= 4 ? t : ''; };
export const lettersOf = (p) => (String(p || '').toUpperCase().match(/^[A-Z]{1,2}/) || [''])[0];

// The normalised lead as a leads row. Accepts area labels or slugs, urgency codes or labels, privatePay labels or codes,
// and value as { band, min, max } or a number.
export function toRow(lead = {}) {
  const area = toAreaSlug(lead.area) || toAreaSlug(lead.areaLabel) || orNull(lead.area, 60);
  const matter = orNull(lead.matter, 80);
  const c = lead.contact || {};
  const fullName = clip(c.fullName || [c.firstName, c.lastName].filter(Boolean).join(' ') || lead.fullName, 140).replace(/\s+/g, ' ');
  const postcode = tidyPostcode(lead.postcode).slice(0, 10);
  const district = clip(lead.postcodeDistrict, 5).toUpperCase() || outwardOf(postcode) || null;
  const pArea = clip(lead.postcodeArea, 2).toUpperCase() || lettersOf(district || postcode) || null;
  const v = lead.value;
  let value_band = null, value_min = null, value_max = null;
  if (typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v))) { value_min = value_max = int(v); value_band = value_min ? gbp(value_min) : null; }
  else if (v && typeof v === 'object') { value_min = int(v.min); value_max = int(v.max); value_band = orNull(v.band || v.label, 80) || (value_min ? gbp(value_min) : null); }
  const answers = (Array.isArray(lead.answers) ? lead.answers : []).filter((a) => a && a.q).slice(0, 40)
    .map((a) => ({ id: clip(a.id, 60), q: clip(a.q, 300), a: clip(Array.isArray(a.a) ? a.a.join(', ') : a.a, 300) }));
  const score = int(lead.quality?.score ?? lead.score);
  const grade = GRADES.includes(lead.quality?.grade ?? lead.grade) ? lead.quality?.grade ?? lead.grade : score == null ? null : score >= 75 ? 'A' : score >= 55 ? 'B' : 'C';
  const biz = lead.business && typeof lead.business === 'object' ? lead.business : null;
  const s = lead.source || {};
  const checks = lead.checks && (lead.checks.phone || lead.checks.email) ? { ...lead.checks } : {};
  if (c.phoneVerified || c.emailVerified) checks.verified = { phone: !!c.phoneVerified, email: !!c.emailVerified };
  return {
    area, area_label: orNull(lead.areaLabel, 80) || (area ? areaLabel(area) : null), matter, matter_label: orNull(lead.matterLabel, 120) || (matter ? matterLabel(area, matter) : null),
    audience: lead.audience === 'business' ? 'business' : 'individual', urgency: toUrgency(lead.urgency), deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(lead.deadline || '')) ? lead.deadline : null,
    postcode: postcode || null, postcode_district: district, postcode_area: pArea, region: orNull(lead.region, 60), country: orNull(lead.country, 20),
    location_source: lead.locationSource === 'ip' ? 'ip' : postcode ? 'postcode' : lead.locationSource === 'postcode' ? 'postcode' : null,
    value_band, value_label: orNull(lead.valueLabel || (v && typeof v === 'object' ? v.label : null), 80), value_min, value_max,
    private_pay: toPrivatePay(lead.privatePay), business_name: orNull(biz?.name, 160), company_number: orNull(biz?.number, 12)?.toUpperCase() || null,
    company: lead.company && typeof lead.company === 'object' ? lead.company : null,
    answers, tags: [...new Set((Array.isArray(lead.tags) ? lead.tags : []).map((t) => clip(t, 40)).filter(Boolean))].slice(0, 30),
    score: score == null ? null : Math.max(0, Math.min(100, score)), grade, summary: orNull(lead.summary, 2000),
    full_name: fullName || null, email: clip(c.email || lead.email, 200).toLowerCase() || null, phone: clip(c.phone || lead.phone, 20).replace(/\s/g, '') || null,
    checks: Object.keys(checks).length ? checks : null, flags: (Array.isArray(lead.flags) ? lead.flags : []).map((f) => clip(f, 60)).filter(Boolean).slice(0, 20),
    consent: lead.consent && typeof lead.consent === 'object' ? lead.consent : null,
    source: { page: orNull(s.page, 500), referrer: orNull(s.referrer, 500), utm: s.utm && typeof s.utm === 'object' ? s.utm : {},
      ...(firstTouch(s.first) ? { first: firstTouch(s.first) } : {}), ...(lead.rematchOf ? { rematch_of: lead.rematchOf } : {}) },
    form_version: orNull(lead.formVersion, 20),
  };
}

export async function storeLead(lead) {
  const row = toRow(lead);
  const flagged = row.flags.length > 0;
  if (!flagged && !lead.rematchOf) { // repeat enquiry within 7 days: not sold again
    const dupeOf = await duplicateOf(row);
    if (dupeOf) { const r = await followUp(dupeOf, row); return { id: dupeOf, matched: !!r.match, ...(r.match ? { firm: r.match } : {}), duplicateOf: dupeOf, again: !!r.again, rematch: r.rematch || null }; }
  }
  const or = [row.phone && `phone.eq.${encodeURIComponent(`"${row.phone.replace(/["\\]/g, '')}"`)}`, row.email && `email.eq.${encodeURIComponent(`"${row.email.replace(/["\\]/g, '')}"`)}`].filter(Boolean);
  row.exclude_brokers = or.length ? [...new Set((await db(`leads?buyer=not.is.null&or=(${or.join(',')})&select=buyer&limit=200`)).map((l) => l.buyer).filter(Boolean))] : [];
  row.price = price(row, await getPricing());
  if (flagged) row.hidden_at = new Date().toISOString(); // flagged: kept for the team to look at, never sold or auto-bought
  const [stored] = await db('leads', { method: 'POST', body: row, prefer: 'return=representation' });
  if (flagged) return { id: stored.id, matched: false, hidden: true };
  return route(stored);
}

// Sell a stored lead: auto-buy, otherwise alerts. Exported for tests and admin tools.
export async function route(lead) {
  const before = new Set(lead.exclude_brokers || []); // bought this person before: never offered it again
  const brokers = (await db('brokers?approved=eq.true&suspended_at=is.null&select=*')).filter((x) => !before.has(x.id));
  const underMax = (x) => !x.filters?.maxPrice || lead.price <= x.filters.maxPrice; // pricier leads are left for buying by hand
  // Never auto-buy a lead whose contact details failed the live checks, even if the client said they were right.
  const c = lead.checks || {}, doubtful = c.phone?.allocated === false || c.phone?.reachable === false || c.email?.result === 'undeliverable';
  const agreed = new Set(doubtful ? [] : [...(await db(`agreements?select=broker&broker=in.(${brokers.map((x) => x.id).join(',') || '00000000-0000-0000-0000-000000000000'})`)).map((a) => a.broker), ...(await waivedIds())]);
  const auto = doubtful ? [] : brokers.filter((x) => x.mode === 'auto' && agreed.has(x.id) && x.credits >= lead.price && fits(x, lead) && underMax(x))
    .sort((x, y) => (x.last_auto_at || '').localeCompare(y.last_auto_at || ''));
  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0); // ponytail: UTC day; switch to Europe/London midnight if firms notice the hour offset in summer
  for (const x of auto) {
    const p = lead.price, f = x.filters || {};
    if (x.monthly_cap && (await rpc('auto_spend_this_month', { p_broker: x.id })) + p > x.monthly_cap) continue;
    if (f.dailyLeads || f.dailyCredits) {
      const today = await db(`ledger?broker=eq.${x.id}&reason=eq.Auto-bought%20lead&created_at=gte.${dayStart.toISOString()}&select=delta`);
      if (f.dailyLeads && today.length >= f.dailyLeads) continue;
      if (f.dailyCredits && -today.reduce((a, r) => a + r.delta, 0) + p > f.dailyCredits) continue;
    }
    if (await rpc('buy_lead', { p_lead: lead.id, p_broker: x.id, p_auto: true })) {
      await Promise.allSettled([deliver(x, { ...lead, price: p, buyer: x.id, bought_at: new Date().toISOString(), auto: true }), lowCredits(x, x.credits, x.credits - p), inviteLeadAlerts(lead, true)]);
      return { id: lead.id, matched: true, firm: publicProfile(x), price: p, buyer: x.id };
    }
  }
  const fans = brokers.filter((x) => x.notify && fits(x, lead) && (x.mode === 'manual' || !underMax(x)));
  await Promise.allSettled(fans.map((x) => newLeadAlert(x, lead)));
  // Leads outside a firm's criteria (but allowed by its regulators): suggested anyway, saying so, to firms that want them straight away.
  await Promise.allSettled(brokers.filter((x) => suggestMode(x) === 'instant' && canTake(x, lead) && !matches(x.filters || {}, lead)).map((x) => suggest(x, [lead])));
  // Invited firms who haven't signed up yet: same lead, but the button finishes their signup.
  const invited = await inviteLeadAlerts(lead, false);
  return { id: lead.id, matched: false, price: lead.price, buyer: null, alerted: fans.length, invited };
}
