import { createHmac, createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { typeLabel, chUrl } from './ch.js';
import { AUDIENCES, areaLabel, matterLabel, allowedAreas, STAGES as TAX_STAGES } from './taxonomy.js';
// Shared logic for the Leaflegal law firm platform (platform.leaflegal.co): database access, lead pricing,
// auto-buy matching and lead delivery. Files under api/_lib are not deployed as endpoints. "brokers" is the firm table.
// Env: SUPABASE_SECRET_KEY (required; the project's secret or service_role key), SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY,
//      SITE_URL, PLATFORM_URL (optional), RESEND_API_KEY, ENQUIRY_FROM, ENQUIRY_TO (admin alerts).
export const SITE_URL = (process.env.SITE_URL || 'https://leaflegal.co').replace(/\/+$/, '');
export const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://qrdpvsqsfifmgkxinank.supabase.co').replace(/\/+$/, '');
export const PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_vZL7kU5KjOGWKSfcAAsnbg_9p9BBTUM';
export const PLATFORM_URL = (process.env.PLATFORM_URL || 'https://platform.leaflegal.co').replace(/\/+$/, '');
export const API_URL = `${SITE_URL}/api/platform`;
// Sign-up hand-off from the leaflegal.co partner form to the platform's register page. The details travel encrypted
// and expire after 30 days; nothing readable goes in the URL.
const handKey = () => createHash('sha256').update(`handoff:${key()}`).digest();
export const sealHandoff = (data) => {
  const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', handKey(), iv);
  const body = Buffer.concat([c.update(JSON.stringify({ ...data, x: Date.now() + 30 * 864e5 })), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString('base64url');
};
export const openHandoff = (t) => {
  try {
    const b = Buffer.from(String(t || ''), 'base64url'); if (b.length < 29 || b.length > 2000) return null;
    const d = createDecipheriv('aes-256-gcm', handKey(), b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28));
    const o = JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString()); return o.x > Date.now() ? o : null;
  } catch { return null; }
};
const key = () => (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
export const secretKey = key;
// Signed links (approve, confirm email, unsubscribe): HMAC with the server key, with an expiry.
export const linkSig = (kind, id, exp) => createHmac('sha256', key()).update(`${kind}:${id}:${exp}`).digest('hex').slice(0, 40);
export const signedUrl = (kind, id, days) => { const exp = Date.now() + days * 864e5; return `${API_URL}?action=${kind}&id=${id}&exp=${exp}&sig=${linkSig(kind, id, exp)}`; };
export const configured = () => !!key();

// PostgREST call with the server key. Throws on HTTP errors.
// Supabase returns at most 1,000 rows per request. A GET asking for more (limit=N over 1,000) is fetched in pages of
// 1,000 with offset, so lists like invites and CRM contacts never stop at 1,000.
// ponytail: offset paging; queries without an order are assumed stable enough page to page (add order= where it matters).
const PAGE = 1000;
export async function db(path, opts = {}) {
  const want = (opts.method || 'GET') === 'GET' && !/[?&]offset=/.test(path) ? Number((path.match(/[?&]limit=(\d+)/) || [])[1]) : 0;
  if (!(want > PAGE)) return dbOne(path, opts);
  const out = [], base = path.replace(/([?&])limit=\d+/, `$1limit=${PAGE}`);
  for (let off = 0; off < want; off += PAGE) {
    const rows = await dbOne(`${base}&offset=${off}`, opts);
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out.slice(0, want);
}
async function dbOne(path, { method = 'GET', body, prefer } = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: key(), 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`db ${method} ${path.split('?')[0]} ${r.status}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}
export const allow = (key, windowSec, max) => rpc('hit_rate', { p_key: key, p_window: windowSec, p_max: max }).catch(() => true); // fail open if the limiter itself errors
export const rpc = (fn, args) => db(`rpc/${fn}`, { method: 'POST', body: args });

// ---------------------------------------------------------------- pricing (credits per lead, 1 credit = £1 + VAT)
// price = clamp(round5(base × grade × urgency × business × value), min, max)
//  base:     matters['area/matter'] if set, else areas[area], else 50
//  grade:    the form's quality grade (A, B, C)
//  urgency:  'Urgently' leads cost more (urgent)
//  business: business clients cost more (business)
//  value:    value_min at or above a threshold gives that multiplier, first match wins (property price, debt, estate)
// Admin → Pricing edits these (settings.pricing). Keep in step with price() in public/assets/platform.js.
export const DEFAULT_PRICING = {
  min: 15, max: 400,
  areas: { conveyancing: 35, immigration: 60, 'family-law': 55, 'debt-recovery': 45, 'motoring-offences': 50, licensing: 55, 'lease-extensions': 60, trademarks: 50 },
  matters: { 'immigration/sponsor-licences': 120, 'family-law/financial-settlements': 75, 'motoring-offences/drink-driving': 70,
    'motoring-offences/dangerous-driving': 80, 'licensing/premises-licence-applications': 70, 'lease-extensions/collective-enfranchisement': 110,
    'trademarks/trademark-infringement': 75, 'trademarks/objections-and-oppositions': 65 },
  grade: { A: 1.3, B: 1, C: 0.7 }, urgent: 1.15, business: 1.1,
  value: [[1000000, 1.4], [500000, 1.25], [250000, 1.1]],
};
export const BASE_PRICE = 50; // an area with no price set
// Clients an admin has excused from the referral agreement (Admin → client → Agreement). They can buy and be auto-bought for
// without signing. Kept in settings (key agreement_waived), so it needs no column and firms can't change it.
export async function waivedIds() {
  try { const [r] = await db('settings?key=eq.agreement_waived&select=value'); return new Set(r?.value?.ids || []); } catch { return new Set(); }
}
// Saved pricing merged over the defaults. Saved matter overrides replace the default list (so one can be removed).
export function mergePricing(v) {
  if (!v || typeof v !== 'object' || !v.areas) return DEFAULT_PRICING;
  const D = DEFAULT_PRICING;
  return { ...D, ...v, areas: { ...D.areas, ...v.areas }, matters: { ...(v.matters && typeof v.matters === 'object' ? v.matters : D.matters) },
    grade: { ...D.grade, ...(v.grade || {}) }, value: Array.isArray(v.value) ? v.value : D.value };
}
export async function getPricing() {
  try { const [r] = await db('settings?key=eq.pricing&select=value'); return mergePricing(r?.value); } catch { return DEFAULT_PRICING; }
}
const num = (v, d) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : d);
export function priceParts(l, P = DEFAULT_PRICING) {
  const base = num(P.matters?.[`${l.area}/${l.matter}`], num(P.areas?.[l.area], BASE_PRICE));
  const grade = num(P.grade?.[l.grade], 1);
  const urgent = l.urgency === 'Urgently' ? num(P.urgent, 1) : 1;
  const business = l.audience === 'business' ? num(P.business, 1) : 1;
  const vm = Number(l.value_min) || 0, step = (P.value || []).find(([at]) => vm > 0 && vm >= at);
  const value = step ? num(step[1], 1) : 1;
  return { base, grade, urgent, business, value };
}
export function price(l, P = DEFAULT_PRICING) {
  const x = priceParts(l, P), raw = x.base * x.grade * x.urgent * x.business * x.value;
  return Math.min(P.max ?? 400, Math.max(P.min ?? 15, Math.round(raw / 5) * 5));
}
// Worked examples shown to firms on the Credits page.
export const PRICE_EXAMPLES = [
  { area: 'conveyancing', matter: 'buying-a-home', grade: 'B', urgency: 'Within a month', audience: 'individual', value_min: 250000 },
  { area: 'family-law', matter: 'divorce', grade: 'A', urgency: 'Urgently', audience: 'individual' },
  { area: 'family-law', matter: 'financial-settlements', grade: 'B', urgency: 'In the next few months', audience: 'individual', value_min: 500000 },
  { area: 'motoring-offences', matter: 'drink-driving', grade: 'A', urgency: 'Urgently', audience: 'individual' },
  { area: 'immigration', matter: 'sponsor-licences', grade: 'A', urgency: 'Within a month', audience: 'business' },
  { area: 'debt-recovery', matter: 'unpaid-invoices', grade: 'C', urgency: 'Just looking into it', audience: 'business' },
];

// Lead quality 0-100: the score the enquiry form worked out (stored on the lead with its grade).
export const quality = (l) => (Number.isFinite(l?.score) ? l.score : null);
export const STAGES = TAX_STAGES;

// Monthly plans (subscription only, prices exclude VAT). 1 credit = £1 of lead value. Unused credits roll over.
export const PACKS = {
  starter: { name: 'Starter', credits: 2500, pence: 250000, bonus: 0 },
  growth: { name: 'Growth', credits: 5000, pence: 500000, bonus: 0 },
};
// First-time offer: first month £1,000 + VAT for 1,000 credits, then Starter (£2,500 + VAT, 2,500 credits) monthly.
export const TRIAL = { pence: 100000, credits: 1000, then: 'starter' };
export const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
// Custom plans: more than £5,000 a month in £1,000 steps (e.g. £50,000), 1 credit per £1.
// Above maxCredits a month we talk to the firm instead of selling online.
export const CUSTOM = { min: 6000, max: 250000, step: 1000, bonus: 0, maxCredits: 20000, contact: 'hello@leaflegal.co' };
export function customPack(pounds) {
  const n = Math.round(Number(pounds));
  if (!(n >= CUSTOM.min && n <= CUSTOM.max && n % CUSTOM.step === 0)) return null;
  const credits = Math.round(n * (1 + CUSTOM.bonus / 100));
  if (credits > CUSTOM.maxCredits) return null; // larger plans: contact us
  return { name: 'Custom', credits, pence: n * 100, bonus: CUSTOM.bonus };
}

// ---------------------------------------------------------------- lead wording
export const matterName = (l) => l.matter_label || matterLabel(l.area, l.matter) || (l.matter && l.matter !== 'other' ? l.matter : null) || l.area_label || areaLabel(l.area) || 'Legal enquiry';
export const areaName = (l) => l.area_label || areaLabel(l.area) || 'Legal enquiry';
export const audienceLabel = (v) => (v === 'business' ? 'Business' : v === 'individual' ? 'Individual' : null);
export const privatePayLabel = (v) => (v === 'yes' ? 'Yes' : v === 'quote' ? 'If the cost is right' : null);
export const placeOf = (l) => [l.postcode_district, l.region].filter(Boolean).join(', ') || null;
export const dateLabel = (d) => (/^\d{4}-\d{2}-\d{2}/.test(String(d || '')) ? new Date(`${String(d).slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : null);
const valueText = (l) => l.value_band || (l.value_min ? gbp(l.value_min) : null);

// ---------------------------------------------------------------- firm criteria (brokers.filters) and matching
// filters: { areas[], matters{area: [matter]}, regions[], postcodeAreas[], audiences[], urgencies[], grades[], privatePayOnly,
//            valueMin, valueMax, tagsAny[], tagsNone[], maxPrice, dailyLeads, dailyCredits, suggest, digestAt, missed, missedAt }
// Empty list = any, except areas: no areas = no leads. matters missing or empty for an area = every matter in it.
// Hard rule (not a filter): a firm only gets areas its regulators allow (allowedAreas). Immigration needs SRA, CILEx or IAA.
const list = (v) => (Array.isArray(v) ? v : []);
export const regIds = (b) => list(b?.regulators).map((r) => r?.id).filter(Boolean);
export const canTake = (b, l) => allowedAreas(regIds(b)).includes(l.area);
// The checks as { k, v, label, why } so they can be counted and undone (k = the filter key, v = the value to allow).
export function missGroups(f = {}, l) {
  f = f || {};
  const out = [], aName = areaName(l), mName = matterName(l);
  if (!list(f.areas).includes(l.area)) out.push({ k: 'areas', v: l.area, label: aName, why: `${aName} is not one of the practice areas selected` });
  else {
    const ms = list(f.matters?.[l.area]);
    if (ms.length && !ms.includes(l.matter)) out.push({ k: 'matters', v: `${l.area}/${l.matter}`, label: `${mName} (${aName})`, why: `${mName} is not one of the ${aName.toLowerCase()} matters selected` });
  }
  if (list(f.regions).length && !list(f.regions).includes(l.region)) out.push({ k: 'regions', v: l.region || '', label: l.region || 'No region given', why: l.region ? `${l.region} is outside the regions selected` : 'The enquiry has no region' });
  if (list(f.postcodeAreas).length && !list(f.postcodeAreas).includes(l.postcode_area)) out.push({ k: 'postcodeAreas', v: l.postcode_area || '', label: l.postcode_area ? `Postcode area ${l.postcode_area}` : 'No postcode given', why: l.postcode_area ? `Postcode area ${l.postcode_area} is outside the postcode areas selected` : 'The enquiry has no postcode' });
  if (list(f.audiences).length && !list(f.audiences).includes(l.audience)) { const a = AUDIENCES.find(([k]) => k === l.audience)?.[1] || 'Unknown client type';
    out.push({ k: 'audiences', v: l.audience || '', label: a, why: `${a} are not selected` }); }
  if (list(f.urgencies).length && !list(f.urgencies).includes(l.urgency)) out.push({ k: 'urgencies', v: l.urgency || '', label: l.urgency ? `Needed ${l.urgency.toLowerCase()}` : 'No urgency given', why: l.urgency ? `Urgency ${l.urgency.toLowerCase()} is not selected` : 'The enquiry has no urgency' });
  if (list(f.grades).length && !list(f.grades).includes(l.grade)) out.push({ k: 'grades', v: l.grade || '', label: l.grade ? `Grade ${l.grade} leads` : 'Ungraded leads', why: l.grade ? `Grade ${l.grade} is not selected` : 'The lead has no grade' });
  if (f.privatePayOnly && l.private_pay === 'quote') out.push({ k: 'privatePayOnly', v: false, label: 'Will pay if the cost is right', why: 'The client will only pay privately if the cost is right' });
  const hasValue = l.value_min != null || l.value_max != null, top = l.value_max ?? l.value_min, bottom = l.value_min ?? l.value_max;
  if (f.valueMin && hasValue && top < f.valueMin) out.push({ k: 'valueMin', label: `Value under ${gbp(f.valueMin)}`, why: `${valueText(l) || gbp(top)} is below the ${gbp(f.valueMin)} minimum value` });
  if (f.valueMax && hasValue && bottom > f.valueMax) out.push({ k: 'valueMax', label: `Value over ${gbp(f.valueMax)}`, why: `${valueText(l) || gbp(bottom)} is above the ${gbp(f.valueMax)} maximum value` });
  const tags = list(l.tags);
  if (list(f.tagsAny).length && !list(f.tagsAny).some((t) => tags.includes(t))) out.push({ k: 'tagsAny', v: '', label: 'Without the tags required', why: `None of the tags required (${list(f.tagsAny).join(', ')})` });
  for (const t of list(f.tagsNone).filter((x) => tags.includes(x))) out.push({ k: 'tagsNone', v: t, label: `Tagged ${t}`, why: `Tagged ${t}, which is excluded` });
  return out;
}
// misses: why a lead falls outside a firm's criteria, in plain words (empty = it matches).
export const misses = (f, l) => missGroups(f, l).map((g) => g.why);
export const matches = (f, l) => !missGroups(f, l).length;
// A firm and a lead: allowed by its regulators and inside its criteria.
export const fits = (b, l) => canTake(b, l) && matches(b?.filters || {}, l);
// Leads auto-buy skipped for a firm because of its criteria, and which criteria held them back. Leads its regulators
// don't allow are left out (widening the criteria couldn't change those).
// groups: n = leads that criterion blocked, only = leads it alone blocked (allowing it would have let auto-buy buy them).
export function missedSummary(b, leads) {
  const missed = [], G = {};
  for (const l of leads) {
    if (!canTake(b, l)) continue;
    const why = missGroups(b.filters || {}, l);
    if (!why.length) continue;
    missed.push({ l, why });
    for (const w of why) { const g = (G[w.label] ||= { ...w, n: 0, only: 0 }); g.n++; if (why.length === 1) g.only++; }
  }
  const status = (l) => (l.buyer === b.id ? 'mine' : l.buyer ? 'sold' : 'live');
  return { missed, groups: Object.values(G).sort((x, y) => y.only - x.only || y.n - x.n), status,
    sold: missed.filter((m) => status(m.l) === 'sold').length, mine: missed.filter((m) => status(m.l) === 'mine').length, live: missed.filter((m) => status(m.l) === 'live').length };
}
// Emails about leads outside a firm's criteria: 'instant' (default), 'daily' summary or 'off'.
// Kept in brokers.filters (suggest, digestAt) so it needs no extra column; matches() ignores those keys.
export const SUGGEST = ['instant', 'daily', 'off'];
export const suggestMode = (b) => (SUGGEST.includes(b.filters?.suggest) ? b.filters.suggest : 'instant');

// Fields a firm sees before buying (nothing that names or locates the person: no name, contact details, full postcode,
// business name or summary). postcode_area (letters only) is selected for matching.
export const PREVIEW = 'id,created_at,area,area_label,matter,matter_label,audience,urgency,deadline,postcode_district,postcode_area,region,country,location_source,value_band,value_label,value_min,value_max,private_pay,answers,tags,grade,score,price,list_price,price_fixed';
// Masked contact shown before purchase, e.g. J*** S****, a*****@*****.co.uk, +447******90. Raw values never leave the server.
const stars = (n) => '*'.repeat(Math.max(3, Math.min(n, 8)));
export function maskContact(l) {
  // First initial only, and no letters of the email domain.
  const name = String(l.full_name || '').trim().split(/\s+/).filter(Boolean).map((w, i) => (i ? '' : w[0].toUpperCase()) + stars(w.length - (i ? 0 : 1))).join(' ');
  const [local = '', domain = ''] = String(l.email || '').toLowerCase().split('@');
  const dot = domain.indexOf('.');
  const email = local && domain ? `${local[0]}${stars(local.length - 1)}@${stars(dot)}${domain.slice(dot)}` : '';
  const ph = String(l.phone || '').replace(/\s/g, '');
  const phone = ph.length > 6 ? `${ph.slice(0, 4)}${'*'.repeat(ph.length - 6)}${ph.slice(-2)}` : '';
  const c = l.checks || {};
  return { name, email, phone, phoneValid: /^\+447\d{9}$/.test(ph), emailChecked: !!email,
    phoneLive: c.phone?.reachable === true || c.verified?.phone === true, emailVerified: c.email?.result === 'valid' || c.verified?.email === true };
}
// Leads still unsold after DISCOUNT.hours cost DISCOUNT.pct% less (every lead, unless priced by hand). The charge itself
// happens in buy_lead (tools/platform-schema-legal.sql), which uses the same rule: keep the two in step.
export const DISCOUNT = { hours: 72, pct: 50 };
export const discountAt = (l) => new Date(new Date(l.created_at).getTime() + DISCOUNT.hours * 36e5);
// Ad cost of each lead. Leads carry their Meta campaign id (utm_campaign on the ad link): cost = that campaign's spend in the
// lead's week (Mon–Sun) ÷ that campaign's leads that week. Leads with no campaign, or a campaign with no spend that week,
// get the week's average instead: all spend ÷ all leads. rows = [{ date, campaign, spend }] from Meta at campaign level.
export const weekOf = (d) => { const x = new Date(`${String(d).slice(0, 10)}T00:00:00Z`); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
export function leadAdCosts(leads, rows) {
  const S = {}, N = {}, add = (o, k, v) => (o[k] = (o[k] || 0) + v);
  for (const r of rows) { const w = weekOf(r.date); add(S, `${r.campaign}|${w}`, r.spend); add(S, `*|${w}`, r.spend); }
  for (const l of leads) { const w = weekOf(l.created_at); add(N, `*|${w}`, 1); if (l.campaign) add(N, `${l.campaign}|${w}`, 1); }
  return Object.fromEntries(leads.map((l) => { const w = weekOf(l.created_at), k = `${l.campaign}|${w}`;
    return [l.id, l.campaign && S[k] ? { cost: S[k] / N[k], by: 'campaign' } : S[`*|${w}`] ? { cost: S[`*|${w}`] / N[`*|${w}`], by: 'week' } : { cost: 0, by: 'none' }]; }));
}

export function salePrice(l) {
  // Priced by hand (relisted): no automatic discount; show the old price struck through if it was cut.
  if (!l.buyer && l.price_fixed) return { price: l.price, list_price: l.list_price > l.price ? l.list_price : null, discounted: l.list_price > l.price };
  if (l.buyer || Date.now() < discountAt(l).getTime()) return { price: l.price, list_price: null, discounted: false };
  return { price: Math.max(1, Math.ceil(l.price * (100 - DISCOUNT.pct) / 100)), list_price: l.price, discounted: true };
}
// Companies House record of a business client. Before purchase: nothing that identifies the company (no name, number,
// address or exact date), so a firm can't find the business without buying the lead. After purchase: the full record and a link.
export function companyInfo(c, full) {
  if (!c?.number) return null;
  const p = c.profile || {};
  const info = { source: 'Companies House', type: typeLabel(c.type), status: c.status || null, incorporated: full ? c.incorporated || null : c.incorporated?.slice(0, 4) || null, // year only before purchase
    locality: p.locality || null, industries: p.industries || [], accounts_overdue: !!p.accounts_overdue, confirmation_overdue: !!p.confirmation_overdue,
    insolvency_history: !!p.insolvency_history, checked: !!c.profile };
  return full ? { ...info, name: p.title || null, number: c.number, address: c.address || null, sic: p.sic || [], url: chUrl(c.number) } : info;
}
// Unsold lead as firms see it: masked contact, Companies House preview (business clients), current price (after any
// discount) and when the discount starts. Firms not yet approved (anyone can sign up) only see the matter and the price.
export const withMask = ({ full_name, email, phone, checks, company, summary, postcode, business_name, company_number, consent, source, flags, ...rest }, trusted = true) => ({
  ...rest, ...salePrice(rest), has_summary: !!summary, discount_at: rest.price_fixed ? null : discountAt(rest).toISOString(),
  contact: trusted ? maskContact({ full_name, email, phone, checks }) : null,
  companies_house: trusted && rest.audience === 'business' ? companyInfo(company, false) : null });
export const PREVIEW_SELECT = PREVIEW + ',summary,full_name,email,phone,checks,company';

export const FULL = PREVIEW + ',full_name,email,phone,postcode,business_name,company_number,summary,company,consent,bought_at,auto,stage,stage_at,instructed_value,archived_at';
// ---------------------------------------------------------------- email + delivery
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const gbp = (n) => '£' + Number(n || 0).toLocaleString('en-GB');
// Resend allows 10 requests a second. New-lead alerts fan out to many firms at once, so space sends out
// (8 a second per instance) and retry a 429 once. ponytail: per-instance limiter; a shared queue if volume grows.
let sentAt = [];
export async function resendSlot() {
  for (;;) {
    const now = Date.now(); sentAt = sentAt.filter((t) => now - t < 1000);
    if (sentAt.length < 8) { sentAt.push(now); return; }
    await new Promise((ok) => setTimeout(ok, 1000 - (now - sentAt[0]) + 10));
  }
}
// Suppression list: people who unsubscribed from an invite or CRM email. Nothing from the platform or CRM goes to them again,
// unless they register an account (signup removes them). Registered firms are never added. Fails open if the table is missing.
const emailIn = (list) => list.map((e) => encodeURIComponent(`"${String(e).trim().toLowerCase().replace(/"/g, '')}"`)).join(',');
// LinkedIn (Campaign Manager account in LINKEDIN_AD_ACCOUNT). Conversions API events and ad spend. Tokens are added in Vercel:
// LINKEDIN_CAPI_TOKEN (Signals manager → Direct API → Generate access token) and LINKEDIN_ADS_TOKEN (Advertising API, r_ads_reporting;
// falls back to the CAPI token). LinkedIn member tokens expire, so failures are logged, never thrown.
const liAccount = () => process.env.LINKEDIN_AD_ACCOUNT || '';
// LinkedIn API versions are monthly (YYYYMM) and retire after about a year: use last month's, and if LinkedIn says a
// version isn't active (426), step back a month, up to 3 times. LINKEDIN_API_VERSION pins one.
const liVersions = () => { if (process.env.LINKEDIN_API_VERSION) return [process.env.LINKEDIN_API_VERSION];
  const d = new Date(); return [1, 2, 3, 4].map((k) => { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - k, 1)); return `${x.getUTCFullYear()}${String(x.getUTCMonth() + 1).padStart(2, '0')}`; }); };
const liHeaders = (token, v) => ({ Authorization: `Bearer ${token}`, 'LinkedIn-Version': v, 'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json' });
async function liFetch(url, token, opts = {}) {
  let r;
  for (const v of liVersions()) {
    r = await fetch(url, { ...opts, headers: liHeaders(token, v), signal: AbortSignal.timeout(opts.timeout || 6000) });
    if (r.status !== 426) return r;
  }
  return r;
}
// Server events with no browser moment (they happen on the platform or in Stripe), sent alongside the Meta event of the same name.
// Plus the browser-tag conversions, sent from the server too (same event id, so LinkedIn counts each once) for visitors whose browser blocks the tag.
// "Direct API" conversions in Campaign Manager. Sent from the server for every enquiry, whatever the visitor's cookie choice.
export const LI_SERVER = { PartnerRegistered: 30563980, Subscribe: 30563988, // "Partner signed up", "Partner subscribed"
  Lead: 30688924, CompleteRegistration: 30688932, // "Lead - business enquiry (server)", "Qualified Lead 500k+ (server)"
  PartnerInterest: 30688940, PartnerCallBooked: 30688948 }; // "Partner enquiry (server)", "Partner call booked (server)"
export async function linkedinEvent(name, { email, first, last, company, eventId, value }) {
  const token = process.env.LINKEDIN_CAPI_TOKEN, id = LI_SERVER[name];
  if (!token || !id || !email) return 'off';
  const body = { conversion: `urn:lla:llaPartnerConversion:${id}`, conversionHappenedAt: Date.now(), ...(eventId ? { eventId: String(eventId) } : {}),
    ...(value ? { conversionValue: { currencyCode: 'GBP', amount: Number(value).toFixed(2) } } : {}),
    user: { userIds: [{ idType: 'SHA256_EMAIL', idValue: createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex') }],
      ...(first || last ? { userInfo: { ...(first ? { firstName: String(first).slice(0, 35) } : {}), ...(last ? { lastName: String(last).slice(0, 35) } : {}), ...(company ? { companyName: String(company).slice(0, 50) } : {}), countryCode: 'GB' } } : {}) } };
  try {
    const r = await liFetch('https://api.linkedin.com/rest/conversionEvents', token, { method: 'POST', body: JSON.stringify(body), timeout: 4000 });
    if (!r.ok) console.error('linkedin', name, r.status, (await r.text()).slice(0, 300));
    return r.ok ? 'ok' : 'error';
  } catch (e) { console.error('linkedin', name, e.message); return 'error'; }
}
// Daily LinkedIn spend per ad set ("campaign" in the API) since a date: rows like metaSpend's { date, campaign, spend }.
export async function linkedinSpend(since) {
  // Needs its own token with r_ads_reporting: the Conversions API token can't read ad spend (every call was a 403).
  const token = process.env.LINKEDIN_ADS_TOKEN;
  if (!token) return { status: 'no token', rows: [] };
  if (!liAccount()) return { status: 'no account', rows: [] };
  const d = new Date(since), range = `(start:(year:${d.getUTCFullYear()},month:${d.getUTCMonth() + 1},day:${d.getUTCDate()}))`;
  const url = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY&dateRange=${range}&accounts=List(${encodeURIComponent(`urn:li:sponsoredAccount:${liAccount()}`)})&fields=costInLocalCurrency,dateRange,pivotValues`;
  try {
    const r = await liFetch(url, token, { timeout: 8000 }), j = await r.json().catch(() => ({}));
    if (!r.ok) { console.error('linkedin spend', r.status, JSON.stringify(j).slice(0, 300)); return { status: `error: ${String(j.message || r.status).slice(0, 120)}`, rows: [] }; }
    const pad = (n) => String(n).padStart(2, '0');
    return { status: 'ok', rows: (j.elements || []).map((x) => { const s0 = x.dateRange?.start || {}; return { date: `${s0.year}-${pad(s0.month)}-${pad(s0.day)}`,
      campaign: String(x.pivotValues?.[0] || '').split(':').pop(), spend: Number(x.costInLocalCurrency) || 0 }; }).filter((x) => x.spend > 0) };
  } catch (e) { return { status: 'error: ' + e.message, rows: [] }; }
}
// Server-side Meta event (Conversions API) for one person. Contact details are hashed. Needs META_CAPI_TOKEN. Never throws.
export async function metaEvent(name, { req, email, phone, first, last, page, eventId, fbc, fbp, company, custom = {} }) {
  const li = LI_SERVER[name] ? linkedinEvent(name, { email, first, last, company, eventId, value: custom.value }) : null; // same moment on LinkedIn
  const token = process.env.META_CAPI_TOKEN; if (!token) { await li; return 'off'; }
  const sha = (v) => (v ? createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined);
  const digits = String(phone || '').replace(/\D/g, '').replace(/^0/, '44');
  const user = { em: email ? [sha(email)] : undefined, ph: digits ? [sha(digits)] : undefined, fn: first ? [sha(first)] : undefined, ln: last ? [sha(last)] : undefined,
    country: [sha('gb')], external_id: email ? [sha(email)] : undefined, client_ip_address: String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim() || undefined,
    client_user_agent: req?.headers?.['user-agent'], ...(fbc ? { fbc: String(fbc).slice(0, 300) } : {}), ...(fbp ? { fbp: String(fbp).slice(0, 100) } : {}) };
  const body = { data: [{ event_name: name, event_time: Math.floor(Date.now() / 1000), event_id: eventId || undefined, action_source: 'website', event_source_url: page || undefined, user_data: user, custom_data: custom }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}) };
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(3000) });
    if (!r.ok) console.error('meta', name, r.status, await r.text());
    await li;
    return r.ok ? 'ok' : 'error';
  } catch (e) { console.error('meta', name, e.message); await li; return 'error'; }
}
export async function suppressedSet(emails) {
  const list = [...new Set((emails || []).filter(Boolean))];
  if (!list.length) return new Set();
  // In batches of 100: one request for thousands of addresses makes a URL too long for the database, which failed silently
  // (empty set = nobody blocked). A failed batch now throws, so a send never goes out without its suppression check.
  const out = new Set();
  for (let i = 0; i < list.length; i += 100) for (const r of await db(`email_suppressions?email=in.(${emailIn(list.slice(i, i + 100))})&select=email`)) out.add(r.email);
  return out;
}
export async function suppress(email, reason, source) {
  const e = String(email || '').trim().toLowerCase();
  if (!/@/.test(e)) return false;
  if ((await db(`brokers?email=eq.${encodeURIComponent(e)}&select=id`).catch(() => [])).length) return false; // account holders keep their account emails
  await db('email_suppressions', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: { email: e, reason, source } }).catch((x) => console.error('suppress', x.message));
  return true;
}
export const unsuppress = (email) => db(`email_suppressions?email=eq.${encodeURIComponent(String(email || '').trim().toLowerCase())}`, { method: 'DELETE' }).catch(() => {});

// Invites, round-ups and lead emails to invited firms go from BULK_FROM (alerts.leaflegal.co) when it's set, so cold-email
// complaints don't touch the reputation of leaflegal.co, which carries account and lead emails. Otherwise the usual address.
export const BULK_FROM = () => process.env.BULK_FROM || null;
// Senders: platform emails to firms (alerts, purchases, account) come from alerts.leaflegal.co; emails to the public
// (enquiry confirmations, matched-firm emails, contact and partner forms) from leaflegal.co. Both domains are verified in Resend.
export const ALERTS_FROM = () => `Leaflegal <${process.env.ALERTS_FROM || 'alerts@alerts.leaflegal.co'}>`;
export const MAIL_FROM = () => `Leaflegal <${process.env.ENQUIRY_FROM || 'hello@leaflegal.co'}>`;
export async function sendEmail(to, subject, html, replyTo, attachments, unsub, scheduledAt, retry = true, from = null) {
  if (!process.env.RESEND_API_KEY || !to?.length) return false;
  if (retry) { const blocked = await suppressedSet(to); if (blocked.size) to = to.filter((e) => !blocked.has(String(e).trim().toLowerCase())); if (!to.length) return 'suppressed'; }
  await resendSlot();
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: from || ALERTS_FROM(), to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}), ...(attachments ? { attachments } : {}), ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
      // One-click unsubscribe (RFC 8058): Gmail and Outlook show an Unsubscribe button and POST to this link.
      ...(unsub ? { headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}) }),
    signal: AbortSignal.timeout(6000),
  }).catch((e) => ({ ok: false, text: async () => e.message }));
  if (r.status === 429 && retry) { await new Promise((ok) => setTimeout(ok, 1100)); return sendEmail(to, subject, html, replyTo, attachments, unsub, scheduledAt, false, from); }
  if (!r.ok) { console.error('resend', r.status, await r.text()); return false; }
  return (await r.json().catch(() => ({}))).id || true; // the Resend email id (truthy), so scheduled sends can be cancelled
}

// ---------------------------------------------------------------- branded emails
// One layout for every platform email. rows: [[label, value]] (values are escaped); cta: { label, url }.
// Branded email. Every field but title is optional:
// preheader (inbox preview), greeting, intro, highlight {value, label}, rows [[k, v]], rowsTitle,
// steps [[title, text]], stepsTitle, tips [text], tipsTitle, cta {label, url}, link {label, url}, note, signoff.
// Look: logo above a plain bordered card, square corners throughout. highlight + rows form one summary panel,
// and when there is a panel the button sits inside it (like a listing card); otherwise it follows the content.
export function emailHtml({ title, preheader = '', greeting = '', intro = '', html = '', highlight, rows = [], rowsTitle = '', steps = [], stepsTitle = '', tips = [], tipsTitle = '', ticks = false, cta, cta2, after = '', link, note = '', signoff = true, footer = '', nav: showNav = true }) {
  // nav: false = first-contact emails (invites, invite alerts): only the button(s) and the unsubscribe link, no account, mailto or policy links.
  const G = '#244237', INK = '#14271f', TEXT = '#2b3f36', MUTED = '#62786f', LINE = '#dde5e1', SOFT = '#f7f9f8';
  const F = 'font-family:Arial,Helvetica,sans-serif;';
  const p = (html, extra = '') => `<p style="${F}margin:0 0 18px;font-size:15px;line-height:1.65;color:${TEXT};${extra}">${html}</p>`;
  const h2 = (t) => `<p style="${F}margin:30px 0 14px;font-size:16px;line-height:1.3;font-weight:bold;color:${INK}">${esc(t)}</p>`;
  // cta2: an optional second, outlined button beside the main one.
  const button = (c, center) => `<table role="presentation" class="${cta2 ? 'll-btns' : ''}" cellpadding="0" cellspacing="0" ${center ? 'align="center" ' : ''}style="margin:${center ? '4px auto 0' : '6px 0 22px'}"><tr><td style="background:${G}"><a href="${esc(c.url)}" style="${F}display:inline-block;padding:15px 30px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;letter-spacing:.2px;white-space:nowrap">${esc(c.label)}</a></td>${cta2 ? `<td class="ll-gap" style="width:10px"></td><td style="border:2px solid ${G}"><a href="${esc(cta2.url)}" style="${F}display:inline-block;padding:13px 26px;color:${G};text-decoration:none;font-weight:bold;font-size:15px;letter-spacing:.2px;white-space:nowrap">${esc(cta2.label)}</a></td>` : ''}</tr></table>`;
  const panel = highlight || rows.length;
  const rowHtml = rows.map(([k, v]) => `<tr><td style="${F}padding:13px 24px;border-top:1px solid #edf1ef;font-size:14px;color:${MUTED};width:42%;vertical-align:top">${esc(k)}</td><td style="${F}padding:13px 24px;border-top:1px solid #edf1ef;font-size:14px;font-weight:bold;color:${INK};vertical-align:top">${esc(v ?? '–')}</td></tr>`).join('');
  const panelHtml = !panel ? '' : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 26px;border:1px solid ${LINE};border-collapse:collapse">
${highlight ? `<tr><td colspan="2" style="${F}padding:22px 24px 20px"><div style="font-size:28px;line-height:1.15;font-weight:bold;color:${G}">${esc(highlight.value)}</div><div style="margin-top:6px;font-size:14px;line-height:1.5;color:${MUTED}">${esc(highlight.label)}</div></td></tr>` : ''}
${rowsTitle ? `<tr><td colspan="2" style="${F}padding:14px 24px 10px;${highlight ? `border-top:1px solid ${LINE};` : ''}font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${MUTED}">${esc(rowsTitle)}</td></tr>` : ''}
${rowHtml}
${cta ? `<tr><td colspan="2" style="padding:22px 24px 24px;border-top:1px solid ${LINE};text-align:center">${button(cta, true)}</td></tr>` : ''}</table>`;
  const step = ([t, d], i) => `<tr><td style="padding:0 16px 18px 0;vertical-align:top;width:28px"><div style="${F}width:28px;height:28px;line-height:28px;background:${G};color:#ffffff;font-weight:bold;font-size:13px;text-align:center">${i + 1}</div></td><td style="${F}padding:4px 0 18px;vertical-align:top"><div style="font-weight:bold;font-size:15px;color:${INK};margin:0 0 4px">${esc(t)}</div>${d ? `<div style="font-size:14px;line-height:1.6;color:${MUTED}">${d}</div>` : ''}</td></tr>`;
  // ticks: a green tick instead of the square bullet (text tick, so it shows in every email client)
  const tip = (t) => `<tr>${ticks ? `<td style="${F}padding:0 10px 9px 0;vertical-align:top;width:16px;font-size:16px;line-height:1.5;font-weight:bold;color:#1f8f4e">&#10003;</td>` : `<td style="padding:7px 12px 9px 0;vertical-align:top;width:7px"><div style="width:7px;height:7px;background:${G}"></div></td>`}<td style="${F}padding:0 0 9px;font-size:14px;line-height:1.6;color:${TEXT}">${t}</td></tr>`;
  const nav = [['Dashboard', 'dashboard'], ['Opportunities', 'opportunities'], ['My leads', 'leads'], ['Billing', 'billing']].map(([l, u]) => `<a href="${PLATFORM_URL}/${u}" style="color:${MUTED};text-decoration:underline">${l}</a>`).join(' &nbsp;&middot;&nbsp; ');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title>
<style>@media only screen and (max-width:520px){.ll-body{padding:30px 20px 26px!important}.ll-btns,.ll-btns tbody,.ll-btns tr{display:block!important;width:100%!important}.ll-btns td{display:block!important;width:100%!important;box-sizing:border-box;text-align:center!important}.ll-btns .ll-gap{height:10px!important;width:auto!important}.ll-btns a{display:block!important}.ll-cards{margin:0!important}.ll-card{display:block!important;max-width:none!important;width:auto!important;margin:0 0 10px!important}.ll-purpose{height:auto!important}}</style></head>
<body style="margin:0;padding:0;background:#f3f5f4">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}${'&#8203;&nbsp;'.repeat(40)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f4"><tr><td align="center" style="padding:36px 12px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td align="center" style="padding:0 0 28px">${showNav ? `<a href="${PLATFORM_URL}/dashboard"><img src="https://leaflegal.co/assets/Leaflegal_Logo_Deep_Green.svg" width="140" height="28" alt="Leaflegal" style="display:block;border:0"></a>` : `<img src="https://leaflegal.co/assets/Leaflegal_Logo_Deep_Green.svg" width="140" height="28" alt="Leaflegal" style="display:block;border:0">`}</td></tr>
<tr><td class="ll-body" style="background:#ffffff;border:1px solid ${LINE};padding:44px 40px 34px">
<h1 style="${F}margin:0 0 22px;font-size:26px;line-height:1.25;font-weight:bold;color:${INK}">${esc(title)}</h1>
${greeting ? p(greeting) : ''}${intro ? p(intro) : ''}${html}
${panelHtml}
${steps.length ? `${h2(stepsTitle || 'What happens next')}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px">${steps.map(step).join('')}</table>` : ''}
${tips.length ? `${tipsTitle ? h2(tipsTitle) : ''}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px">${tips.map(tip).join('')}</table>` : ''}
${cta && !panel ? button(cta, false) : ''}${after}
${link ? p(`<a href="${esc(link.url)}" style="color:${G};font-weight:bold">${esc(link.label)}</a>`, 'margin:-4px 0 24px;font-size:14px') : ''}
${note ? `<p style="${F}margin:0 0 24px;padding:15px 18px;background:${SOFT};border:1px solid ${LINE};font-size:13px;line-height:1.6;color:${MUTED}">${note}</p>` : ''}
${signoff ? p(`${signoff === true ? 'Best regards,' : signoff}<br><b style="color:${INK}">The Leaflegal team</b>`, 'margin:8px 0 0') : ''}
<div style="border-top:1px solid ${LINE};margin:30px 0 0;padding:20px 0 0;${F}font-size:14px;line-height:1.6;color:${MUTED}"><b style="color:${INK}">Need a hand?</b> Reply to this email${showNav ? ` or write to <a href="mailto:hello@leaflegal.co" style="color:${G}">hello@leaflegal.co</a>` : ''} and the team will get back to you.</div>
</td></tr>
${showNav ? `<tr><td align="center" style="${F}padding:26px 24px 6px;font-size:13px;color:${MUTED}">${nav}</td></tr>` : '<tr><td style="padding:16px 0 0"></td></tr>'}
<tr><td align="center" style="padding:14px 24px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px"><tr><td align="center" style="${F}font-size:12px;line-height:1.6;color:#86998f">
<p style="margin:0 0 12px">${footer || `You're receiving this because your firm has a Leaflegal Platform account. Change which emails you get under <a href="${PLATFORM_URL}/notifications" style="color:#86998f">Notifications</a>.`}</p>
<p style="margin:0 0 12px">Leaflegal is a trading name of Vertical Brands Ltd, company number 14254961<br>20-22 Wenlock Road, London N1 7GU</p>
${showNav ? `<p style="margin:0"><a href="https://leaflegal.co/privacy-policy" style="color:${G};text-decoration:none;font-weight:bold">Privacy Policy</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="https://leaflegal.co/terms-conditions" style="color:${G};text-decoration:none;font-weight:bold">Terms of Service</a></p>` : ''}
</td></tr></table></td></tr>
</table></td></tr></table></body></html>`;
}
// Many different emails in as few Resend calls as possible (batch API: up to 100 per call, no scheduling or attachments).
// items: [{ to, subject, opts }]. Returns how many Resend accepted. Used for invite alerts and round-ups, which can run to thousands.
export async function sendBatch(items, fromOverride = null) {
  if (!process.env.RESEND_API_KEY || !items.length) return 0;
  const blocked = await suppressedSet(items.flatMap((x) => x.to));
  items = items.filter((x) => !x.to.some((e) => blocked.has(String(e).trim().toLowerCase())));
  if (!items.length) return 0;
  const from = fromOverride || ALERTS_FROM();
  let ok = 0;
  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100).map(({ to, subject, opts }) => ({ from, to, subject, html: emailHtml(opts), ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      ...(opts.unsub ? { headers: { 'List-Unsubscribe': `<${opts.unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}) }));
    for (let attempt = 0; attempt < 2; attempt++) {
      await resendSlot();
      const r = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk), signal: AbortSignal.timeout(15000) }).catch((e) => ({ ok: false, status: 0, text: async () => e.message }));
      if (r.ok) { ok += chunk.length; break; }
      if (r.status !== 429 || attempt) { console.error('resend batch', r.status, await r.text()); break; }
      await new Promise((w) => setTimeout(w, 1100));
    }
  }
  return ok;
}
export const notify = (to, subject, opts, attachments) => sendEmail(to, subject, emailHtml(opts), opts.replyTo, attachments, opts.unsub, opts.scheduledAt, true, opts.from || null);
export const LOW_CREDITS = 200;
// Warn once when a balance drops below LOW_CREDITS.
export async function lowCredits(b, before, after) {
  if (!(before >= LOW_CREDITS && after < LOW_CREDITS)) return;
  await notify([b.email], `Your Leaflegal credits are running low (${after} left)`, {
    title: 'Your credits are running low',
    preheader: `${after} credits left. Top up your plan so you don't miss matching leads.`,
    intro: `${esc(b.company)} has dropped below ${LOW_CREDITS} credits. Leads cost between ${DEFAULT_PRICING.min} and ${DEFAULT_PRICING.max} credits each, so some of the leads that match your criteria may now be out of reach${b.mode === 'auto' ? ', and auto-buy will skip any lead you can’t afford' : ''}.`,
    highlight: { value: `${after.toLocaleString('en-GB')} credits`, label: 'left on your account' },
    tipsTitle: 'Your options',
    tips: ['<b>Upgrade your plan.</b> The new plan starts today and its credits are added straight away.',
      '<b>Wait for your renewal.</b> Your plan adds its monthly credits automatically on your renewal date.',
      '<b>Tighten your criteria.</b> If you’d rather spend less, set a lower maximum per lead under Auto-buy.'],
    cta: { label: 'Upgrade your plan', url: `${PLATFORM_URL}/billing` },
    link: { label: 'Review auto-buy settings', url: `${PLATFORM_URL}/autobuy` } });
}
// Facts about a lead that are safe before purchase (nothing that names or locates the person), as [label, value] rows.
export const leadRows = (l) => [['Practice area', areaName(l)], ['Matter', matterName(l)], ['Client', audienceLabel(l.audience)], ['Urgency', l.urgency],
  ['Deadline', dateLabel(l.deadline)], ['Location', placeOf(l)], [l.value_label || 'Value', l.value_band], ['Paying privately', privatePayLabel(l.private_pay)],
  ['Grade', l.grade ? `${l.grade}${Number.isFinite(l.score) ? ` (${l.score} out of 100)` : ''}` : null]].filter(([, v]) => v != null && v !== '');
// A plain two-column table for email bodies (labels without colons).
export function factsTable(rows, title = '') {
  const F = 'font-family:Arial,Helvetica,sans-serif;';
  rows = rows.filter(([, v]) => v != null && v !== '');
  if (!rows.length) return '';
  return `${title ? `<p style="${F}margin:30px 0 14px;font-size:16px;line-height:1.3;font-weight:bold;color:#14271f">${esc(title)}</p>` : ''}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #dde5e1;border-collapse:collapse">${rows.map(([k, v], i) =>
    `<tr><td style="${F}padding:11px 18px;${i ? 'border-top:1px solid #edf1ef;' : ''}font-size:14px;color:#62786f;width:42%;vertical-align:top">${esc(k)}</td><td style="${F}padding:11px 18px;${i ? 'border-top:1px solid #edf1ef;' : ''}font-size:14px;color:#14271f;vertical-align:top">${esc(v)}</td></tr>`).join('')}</table>`;
}
// What the client answered on the form, as rows (firm emails after purchase only).
export const answerRows = (answers) => (Array.isArray(answers) ? answers : []).filter((a) => a && a.q && a.a != null && a.a !== '').slice(0, 40).map((a) => [String(a.q), Array.isArray(a.a) ? a.a.join(', ') : String(a.a)]);
// Where emails go: alerts (new matching lead) and delivery (a bought lead) have their own lists; both fall back to the account email.
export const recipients = (b, kind = 'deliver') => String((kind === 'alert' ? b.notify_emails : b.deliver_emails) || b.email).split(/[,;\s]+/).filter((e) => /@/.test(e)).slice(0, 10);
export const webhooksOf = (b) => (b.webhook_urls?.length ? b.webhook_urls : b.webhook_url ? [b.webhook_url] : []).slice(0, 5);

// Clean lead object for CRMs (webhook body, HubSpot, Pipedrive) and the CSV export.
export const leadOut = (l) => ({
  id: l.id, received_at: l.created_at, purchased_at: l.bought_at || null, auto_bought: !!l.auto, price_credits: l.price,
  practice_area: l.area || null, practice_area_label: areaName(l), matter: l.matter || null, matter_label: matterName(l),
  audience: l.audience || null, urgency: l.urgency || null, deadline: l.deadline || null,
  contact_name: l.full_name || null, email: l.email || null, phone: l.phone || null, postcode: l.postcode || null, region: l.region || null,
  business_name: l.business_name || null, company_number: l.company_number || l.company?.number || null,
  value_band: l.value_band || null, value_label: l.value_label || null, private_pay: l.private_pay || null,
  grade: l.grade || null, quality_score: quality(l), tags: l.tags || [], summary: l.summary || null, answers: Array.isArray(l.answers) ? l.answers : [],
  consent: l.consent ? { version: l.consent.version || null, at: l.consent.at || null, text: l.consent.text || null } : null,
  stage: l.stage || 'new', stage_at: l.stage_at || null, instructed_value: l.instructed_value ?? null, archived_at: l.archived_at || null,
});

// Webhooks may only go to public internet addresses (no localhost, private networks or cloud metadata endpoints).
const PRIVATE = [/^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^0\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, /^(::1|::|fc|fd|fe80)/i];
export async function safeWebhookUrl(raw) {
  let u; try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return false;
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(u.hostname)) return false;
  try {
    const { promises: dns } = await import('node:dns');
    const addrs = (await dns.lookup(u.hostname, { all: true })).map((a) => a.address);
    return addrs.length > 0 && !addrs.some((a) => PRIVATE.some((re) => re.test(a.replace(/^::ffff:/, ''))));
  } catch { return false; }
}
// With a signing secret: X-Leaflegal-Timestamp (unix seconds) and X-Leaflegal-Signature: t=<timestamp>,v1=<hex HMAC-SHA256 of "<timestamp>.<raw body>">.
export const signWebhook = (secret, body, t = Math.floor(Date.now() / 1000)) => ({ 'X-Leaflegal-Timestamp': String(t), 'X-Leaflegal-Signature': `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}` });
export async function postWebhook(url, payload, secret) {
  if (!(await safeWebhookUrl(url))) return 'blocked: not a public https address';
  try {
    const body = JSON.stringify(payload);
    const r = await fetch(url, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Leaflegal-Platform', ...(secret ? signWebhook(secret, body) : {}) }, body, signal: AbortSignal.timeout(5000) });
    return r.ok ? 'ok' : `HTTP ${r.status}`;
  } catch (e) { return e.name === 'TimeoutError' ? 'timed out' : 'failed'; }
}

// HubSpot: each bought lead is submitted to the partner's own HubSpot form (Forms API, works on every HubSpot plan,
// creates or updates the contact by email). Settings take the form's embed code or editor link.
export function parseHubspot(text) {
  const t = String(text || '');
  const portal = (t.match(/portal-?id["'\s:=]+["']?(\d{3,12})/i) || t.match(/embed\/(\d{3,12})\.js/) || t.match(/\/forms\/(\d{3,12})\//) || t.match(/\/(\d{3,12})\/[0-9a-f]{8}-/i) || [])[1];
  const form = (t.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) || [])[0];
  const region = (t.match(/region["'\s:=]+["']?(eu1|na1|na2|ap1)/i) || [])[1]?.toLowerCase();
  return portal && form ? { portal, form: form.toLowerCase(), ...(region && region !== 'na1' ? { region } : {}) } : null;
}
// o = leadOut(l). Standard HubSpot contact properties only, so any form with these fields works; the rest goes in "message".
const leadLines = (o) => [['Leaflegal lead', `#${o.id}${o.test ? ' (test)' : ''}`], ['Practice area', o.practice_area_label], ['Matter', o.matter_label], ['Client', audienceLabel(o.audience)],
    ['Urgency', o.urgency], ['Deadline', dateLabel(o.deadline)], ['Postcode', o.postcode], ['Region', o.region], ['Business', o.business_name], ['Company number', o.company_number],
    [o.value_label || 'Value', o.value_band], ['Paying privately', privatePayLabel(o.private_pay)], ['Grade', o.grade], ['Quality score', o.quality_score], ['Summary', o.summary],
    ...answerRows(o.answers), ['Credits used', o.price_credits]].filter(([, v]) => v != null && v !== '');
export const hubspotFields = (o) => {
  const [first, ...rest] = String(o.contact_name || '').trim().split(/\s+/);
  const lines = leadLines(o);
  return [['email', o.email], ['firstname', first], ['lastname', rest.join(' ')], ['phone', o.phone], ['company', o.business_name], ['zip', o.postcode],
    ['message', lines.map(([k, v]) => `${k}: ${v}`).join('\n')]].filter(([, v]) => v).map(([name, value]) => ({ name, value: String(value) }));
};
export async function postHubspot(h, o) {
  if (!h?.portal || !h?.form) return 'not set up';
  const host = h.region ? `api-${h.region}.hsforms.com` : 'api.hsforms.com';
  try {
    const r = await fetch(`https://${host}/submissions/v3/integration/submit/${h.portal}/${h.form}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: hubspotFields(o), context: { pageName: 'Leaflegal lead', pageUri: `${PLATFORM_URL}/leads` } }), signal: AbortSignal.timeout(8000) });
    if (r.ok) return 'ok';
    const j = await r.json().catch(() => ({}));
    return (j.errors || []).map((e) => e.message).filter(Boolean).join('; ').slice(0, 300) || j.message || `HTTP ${r.status}`;
  } catch (e) { return e.name === 'TimeoutError' ? 'timed out' : 'failed'; }
}

// Pipedrive: the firm pastes its personal API token (Settings → Personal preferences → API). Each bought lead becomes a
// person (and an organisation for business clients), a deal and a note on the deal with everything else.
export const parsePipedrive = (t) => { const m = String(t || '').trim().match(/^[0-9a-f]{40}$/i); return m ? { token: m[0].toLowerCase() } : null; };
export async function postPipedrive(p, o) {
  if (!p?.token) return 'not set up';
  const call = async (path, body) => {
    const r = await fetch(`https://api.pipedrive.com/v1/${path}?api_token=${p.token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.success) throw new Error(r.status === 401 ? 'the API token was not accepted' : String(j.error || `HTTP ${r.status}`).slice(0, 200));
    return j.data.id;
  };
  try {
    const org_id = o.business_name ? await call('organizations', { name: o.business_name }) : undefined;
    const person_id = await call('persons', { name: o.contact_name || o.email || 'Leaflegal lead', org_id,
      ...(o.email ? { email: [{ value: o.email, primary: true, label: 'work' }] } : {}), ...(o.phone ? { phone: [{ value: o.phone, primary: true, label: 'work' }] } : {}) });
    const deal_id = await call('deals', { title: `${o.business_name || o.contact_name || 'Leaflegal lead'}, ${o.matter_label}${o.test ? ' (test)' : ''}`, value: o.instructed_value || 0, currency: 'GBP', person_id, org_id });
    await call('notes', { deal_id, content: leadLines(o).map(([k, v]) => `<b>${esc(k)}</b> ${esc(v)}`).join('<br>') });
    return 'ok';
  } catch (e) { return e.name === 'TimeoutError' ? 'timed out' : e.message || 'failed'; }
}

// Send a purchased lead to the firm: email, the "you've been matched" email and message to the client, and the firm's
// webhooks and CRMs. Never throws.
export async function deliver(b, l) {
  const mName = matterName(l), first = String(l.full_name || '').trim().split(/\s+/)[0] || 'The client';
  const tasks = [b.deliver_on === false ? null : notify(recipients(b), `New lead: ${l.full_name}, ${mName}`, {
    title: `New lead: ${l.full_name}`,
    preheader: `${mName}${l.region ? ` in ${l.region}` : ''}. ${first} is expecting to hear from you.`,
    intro: `${l.auto ? 'Auto-buy has picked up' : 'You’ve bought'} lead #${l.id}. <b>${esc(l.full_name)}</b> asked to be put in touch with a law firm about ${esc(mName.toLowerCase())} and is expecting to hear from you. The lead is yours alone and nobody else can buy it.`,
    highlight: { value: mName, label: [areaName(l), l.urgency].filter(Boolean).join(' · ') },
    rowsTitle: 'Contact details', rows: [['Name', l.full_name], ['Mobile', l.phone], ['Email', l.email], ['Postcode', l.postcode],
      ...(l.business_name ? [['Business', l.business_name]] : []), ...(l.company_number || l.company?.number ? [['Company number', l.company_number || l.company.number]] : [])],
    stepsTitle: 'Make the most of it',
    steps: [['Call quickly', 'Enquiries called within the hour turn into instructions far more often. They have just told us what they need.'],
      ['Check for conflicts first', 'Run your conflict check before you discuss the matter in any detail.'],
      ['Disclose the referral fee', 'Tell the client in writing that Leaflegal introduced them and that your firm pays Leaflegal a fee for the introduction, before or when you take instructions.'],
      ['Update the stage', 'Move the lead through New, Contacted, Consultation and Instructed on the platform so you can see what converts.']],
    after: factsTable([...leadRows(l), ['Summary', l.summary], ...answerRows(l.answers), ['Credits used', l.price]], 'What they told us'),
    cta: { label: 'Open lead on the platform', url: `${PLATFORM_URL}/leads` },
    ...(l.company?.number ? { link: { label: 'View the business on Companies House', url: chUrl(l.company.number) } } : {}),
    note: `If the phone number is not in service or belongs to someone else, or the email address doesn’t exist, you can request a refund on the platform within 72 hours. Reply to this email to contact ${esc(l.full_name)} directly.`, replyTo: l.email })];
  tasks.push(matchedEmail(b, l), matchedMessage(b, l));
  if (b.webhook_on !== false) for (const u of webhooksOf(b)) tasks.push(postWebhook(u, { event: 'lead.purchased', lead: leadOut(l) }, b.webhook_secret).then((s) => console.log('webhook', b.id, new URL(u).hostname, s)));
  if (b.hubspot?.on !== false && b.hubspot?.form) tasks.push(postHubspot(b.hubspot, leadOut(l)).then((s) => console.log('hubspot', b.id, s)));
  if (b.pipedrive?.on !== false && b.pipedrive?.token) tasks.push(postPipedrive(b.pipedrive, leadOut(l)).then((s) => console.log('pipedrive', b.id, s)));
  await Promise.allSettled(tasks.filter(Boolean));
}

// "Checked for you" lines in new-lead emails: contact details masked as on Opportunities (raw values only after purchase),
// plus what our live checks and Companies House confirmed. Nothing that names the person or the business.
export function checkTips(l) {
  const m = maskContact(l), c = l.checks || {}, ch = l.audience === 'business' ? companyInfo(l.company, false) : null, ok = (t) => `<b style="color:#1f8a55">&#10003;</b> ${t}`, no = (t) => `<b style="color:#b26a00">!</b> ${t}`;
  const tips = [];
  if (m.name) tips.push(`Contact <b>${esc(m.name)}</b>`);
  if (m.phone) tips.push(c.phone?.reachable === false ? no(`Mobile <b>${esc(m.phone)}</b> was switched off when checked, the client confirmed it is right`) : ok(`Mobile <b>${esc(m.phone)}</b> checked`));
  if (m.email) tips.push(m.emailVerified ? ok(`Email <b>${esc(m.email)}</b> verified`) : `Email <b>${esc(m.email)}</b>`);
  if (ch) {
    tips.push(ok(`Business verified on Companies House${ch.status ? `, ${esc(ch.status)}` : ''}${ch.incorporated ? `, incorporated ${esc(ch.incorporated)}` : ''}`));
    if (ch.checked) tips.push(ch.insolvency_history ? no('Has insolvency history') : ok('No insolvency history'));
  }
  return tips;
}
// For people who haven't signed up (invited firms): only what was verified, no contact details or place.
export function inviteCheckTips(l) {
  const c = l.checks || {}, ch = l.audience === 'business' ? companyInfo(l.company, false) : null, ok = (t) => `<b style="color:#1f8a55">&#10003;</b> ${t}`, tips = [];
  if (c.phone?.reachable === true || c.phone?.allocated === true || c.verified?.phone === true) tips.push(ok('Phone number verified'));
  if (c.email?.result === 'valid' || c.verified?.email === true) tips.push(ok('Email address verified'));
  if (ch) tips.push(ok('Business verified on Companies House'));
  return tips;
}
const q = (v) => encodeURIComponent(`"${String(v ?? '').replace(/["\\]/g, '')}"`);
// Same phone or email in the last 7 days = a repeat enquiry: not sold again.
// After 7 days it's a new lead, but never for a firm that bought this person before (exclude_brokers).
export const REPEAT_DAYS = 7;
export async function duplicateOf({ phone, email } = {}) {
  const since = new Date(Date.now() - REPEAT_DAYS * 864e5).toISOString();
  const or = [phone && `phone.eq.${q(phone)}`, email && `email.eq.${q(String(email).toLowerCase())}`].filter(Boolean);
  if (!or.length) return null;
  const dupe = await db(`leads?created_at=gte.${since}&hidden_at=is.null&or=(${or.join(',')})&select=id&order=created_at.desc&limit=1`);
  return dupe[0]?.id || null;
}
// A repeat enquiry (within REPEAT_DAYS) from someone already matched: remind them who their firm is (with a link to be
// matched with a different firm instead), and tell the firm they've followed up. At most once a day per lead.
// row = the new enquiry as a leads row (see toRow in leads.js), for what changed.
export async function followUp(id, row = {}) {
  const [l] = await db(`leads?id=eq.${id}&select=*`);
  if (!l?.buyer) return {};
  const [x] = await db(`brokers?id=eq.${l.buyer}&select=*`);
  if (!x) return {};
  const rematch = signedUrl('rematch', l.id, REPEAT_DAYS); // only offered on a repeat within 7 days, and only usable for 7 days
  if (await allow(`followup:${l.id}`, 86400, 1)) {
    const bits = [row.matter && (row.matter !== l.matter || row.area !== l.area) ? ['Matter this time', matterName(row)] : null,
      row.urgency && row.urgency !== l.urgency ? ['Urgency this time', row.urgency] : null].filter(Boolean);
    await Promise.allSettled([
      notify([l.email], `You've already been matched with ${publicProfile(x).company}`, matchedOpts(x, l, rematch)),
      notify(recipients(x), `${l.full_name} has followed up (lead #${l.id})`, {
        title: `${l.full_name} has been in touch again`,
        preheader: `${l.full_name} sent another enquiry. A good moment to call.`,
        greeting: `Hello ${esc(x.company)},`,
        intro: `<b>${esc(l.full_name)}</b>, lead #${l.id} which you have had since ${new Date(l.bought_at || l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'Europe/London' })}, has just sent another enquiry through Leaflegal. We've reminded them that your firm has their enquiry and sent them your details again. They're still looking, so now is a good time to call.`,
        rowsTitle: 'Contact details', rows: [['Name', l.full_name], ['Matter', matterName(l)], ['Mobile', l.phone], ['Email', l.email], ...bits],
        cta: { label: 'Open lead on the platform', url: `${PLATFORM_URL}/leads` },
        note: `This doesn't use any credits. Reply to this email to contact ${esc(l.full_name)} directly.`, replyTo: l.email }),
    ]);
  }
  return { match: publicProfile(x), again: true, rematch };
}
// A leads row back in the shape storeLead takes (used to relist a person with a different firm).
export const rowToLead = (l) => ({ area: l.area, areaLabel: l.area_label, matter: l.matter, matterLabel: l.matter_label, audience: l.audience, urgency: l.urgency,
  deadline: l.deadline, postcode: l.postcode, postcodeDistrict: l.postcode_district, postcodeArea: l.postcode_area, region: l.region, country: l.country, location_source: l.location_source || null,
  value: l.value_band || l.value_min || l.value_max ? { band: l.value_band, min: l.value_min, max: l.value_max } : null, valueLabel: l.value_label,
  privatePay: l.private_pay, business: l.business_name || l.company_number ? { name: l.business_name, number: l.company_number } : null, company: l.company,
  answers: l.answers, tags: l.tags, quality: { score: l.score, grade: l.grade }, summary: l.summary,
  contact: { fullName: l.full_name, email: l.email, phone: l.phone }, consent: l.consent, source: l.source, checks: l.checks, flags: [], formVersion: l.form_version });
// "Match me with a different firm" (from the follow-up email or thank-you page): a new lead with the same details,
// never offered to any firm that had this person before. Once per lead.
export async function rematchLead(id) {
  const [l] = await db(`leads?id=eq.${id}&select=*`);
  if (!l?.buyer) return { error: 'gone' };
  const done = await db(`leads?source->>rematch_of=eq.${l.id}&select=id&limit=1`);
  if (done.length) return { error: 'done' };
  const { storeLead } = await import('./leads.js');
  return storeLead({ ...rowToLead(l), rematchOf: l.id });
}
// Old name, kept for tools that still call it.
export const ingestLead = async (lead) => (await import('./leads.js')).storeLead(lead);
// First page of the visit (nav.js ll_src: utm_*, click IDs, external referrer, landing path), kept to known keys and short strings.
const FIRST_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'li_fat_id', 'referrer', 'landing'];
export const firstTouch = (f) => { if (!f || typeof f !== 'object') return null;
  const o = Object.fromEntries(FIRST_KEYS.filter((k) => typeof f[k] === 'string' && f[k]).map((k) => [k, f[k].slice(0, 200)])); return Object.keys(o).length ? o : null; };

const fmtWhen = (d) => new Date(d || Date.now()).toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
const whereOf = (l) => l.region || l.postcode_district || 'the UK';
// "A new lead fits your criteria" to a firm that would have to buy it by hand. cost = the price in credits.
export function newLeadAlert(x, lead, cost = lead.price) {
  const unsub = signedUrl('alerts-off', x.id, 365), cr = `${cost} credits`, mName = matterName(lead), ch = lead.audience === 'business' ? companyInfo(lead.company, false) : null;
  return notify(recipients(x, 'alert'), `New lead: ${mName}, ${whereOf(lead)} (${cr})`, {
    title: 'A new lead fits your criteria', preheader: `${mName} in ${whereOf(lead)}, ${cr}. Exclusive to the first firm that buys it.`,
    greeting: `Hello ${esc(x.company)},`,
    intro: 'Someone has just asked for a law firm and the enquiry fits what you’re looking for. Each lead is sold to one firm only, so once someone buys it, it’s gone.',
    highlight: { value: mName, label: `Received ${fmtWhen(lead.created_at)} · ${cr}` },
    rows: leadRows(lead).filter(([k]) => k !== 'Matter'),
    tipsTitle: 'Checked for you', tips: checkTips(lead),
    cta: { label: 'View this lead', url: `${PLATFORM_URL}/opportunities` },
    note: `Full contact details${lead.audience === 'business' ? ' and the business name' : ''} unlock the moment you buy.${ch ? ' Company details come from Companies House.' : ''} Want leads like this bought for you automatically? <a href="${PLATFORM_URL}/autobuy" style="color:#244237">Set up auto-buy</a>.`,
    unsub, footer: `You're receiving this because ${esc(x.company)} has new-lead emails switched on in Leaflegal Platform. <a href="${unsub}" style="color:#86998f">Unsubscribe from new-lead emails</a> or change them under <a href="${PLATFORM_URL}/notifications" style="color:#86998f">Notifications</a>.` });
}

// Every new lead to invited firms on "every new lead" (not the weekly round-up), including ones auto-matched to a firm
// straight away (shown as matched, to show how fast leads go). At most INVITE_DAILY of these per person in any 24 hours,
// counted in rate_events (2 queries per lead however many invitees). Sent in batches from the bulk address. Never throws.
export const INVITE_DAILY = 3;
// Invitees whose firm is already on the platform (their own email, or a colleague's at the same company domain) get no more
// lead alerts or round-ups: someone at the firm has joined. Personal mail domains only match the exact address.
const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'live.co.uk', 'yahoo.com', 'yahoo.co.uk', 'icloud.com', 'me.com', 'aol.com', 'msn.com', 'btinternet.com']);
export const notJoined = async (people) => {
  const taken = new Set((await db('brokers?select=email&limit=10000')).flatMap((b) => { const e = String(b.email).trim().toLowerCase(), d = e.split('@')[1]; return FREE_MAIL.has(d) ? [e] : [e, `@${d}`]; }));
  return people.filter((v) => { const e = String(v.email).trim().toLowerCase(); return !taken.has(e) && !taken.has(`@${e.split('@')[1]}`); });
};
const inviteStop = (v) => `${API_URL}?action=invite-stop&t=${encodeURIComponent(v.token)}`;
export async function inviteLeadAlerts(lead, matched) {
  try {
    const iso = new Date().toISOString();
    const people = await notJoined(await db(`invites?alerts=eq.true&digest=is.false&expires_at=gt.${iso}&and=(or(email_id.is.null,email_id.not.in.(queued,paused,accepted)),or(send_at.is.null,send_at.lte.${iso}))&select=*&order=email.asc&limit=20000`));
    if (!people.length) return 0;
    const keys = people.map((v) => `invlead:${v.email}`), used = {};
    for (let i = 0; i < keys.length; i += 200) for (const r of await db(`rate_events?key=in.(${keys.slice(i, i + 200).map((k) => encodeURIComponent(`"${k}"`)).join(',')})&at=gt.${new Date(Date.now() - 864e5).toISOString()}&select=key&limit=20000`)) used[r.key] = (used[r.key] || 0) + 1;
    const due = people.filter((v) => (used[`invlead:${v.email}`] || 0) < INVITE_DAILY);
    if (!due.length) return 0;
    const mName = matterName(lead), what = `${mName}, ${whereOf(lead)}`;
    const sent = await sendBatch(due.map((v) => ({ to: [v.email], subject: matched ? `Matched in seconds: ${what}` : `New lead: ${what} (${lead.price} credits)`, opts: {
      title: matched ? 'This lead was matched within seconds' : 'A new lead has just come in',
      preheader: matched ? `${mName} in ${whereOf(lead)}. It went straight to a firm whose criteria it fitted. Set yours up so the next one comes to you.` : `${mName} in ${whereOf(lead)}. Finish setting up your account to buy leads like this.`,
      greeting: `Hi ${esc(String(v.name || '').split(' ')[0] || 'there')},`,
      intro: matched
        ? `Someone has just asked for help with ${esc(mName.toLowerCase())}. The enquiry fitted a firm’s auto-buy criteria, so it went to them straight away, before anyone else saw it. Your account${v.company ? ` for <b>${esc(v.company)}</b>` : ''} is ready. Finish setting up and set your own criteria, and leads like this come to you instead.`
        : `Someone has just asked for a law firm on Leaflegal. Your account${v.company ? ` for <b>${esc(v.company)}</b>` : ''} is ready. Finish setting up and you can buy leads like this one. Each lead is sold to one firm only.`,
      highlight: { value: mName, label: matched ? `Received ${fmtWhen(lead.created_at)} · matched to a firm within seconds` : `Received ${fmtWhen(lead.created_at)} · ${lead.price} credits` },
      rows: leadRows(lead).filter(([k]) => k !== 'Matter'),
      tipsTitle: 'Checked for you', ticks: true, tips: inviteCheckTips(lead).map((t) => t.replace(/^<b[^>]*>&#10003;<\/b> /, '')),
      cta: { label: matched ? 'Set up auto-buy' : 'Finish setting up', url: `${PLATFORM_URL}/register?invite=${v.token}` },
      note: matched ? 'This lead is no longer available. Firms with auto-buy switched on get first pick of every lead that fits their criteria.' : 'Contact details unlock when a firm buys the lead.',
      nav: false, replyTo: 'hello@leaflegal.co', unsub: inviteStop(v), footer: inviteFooter(v) } })), BULK_FROM());
    if (sent) await db('rate_events', { method: 'POST', body: due.map((v) => ({ key: `invlead:${v.email}` })) });
    return sent;
  } catch (e) { console.error('invite alerts', e.message); return 0; }
}

const inviteFooter = (v) => `You're receiving this because the Leaflegal team invited ${esc(v.email)} to join Leaflegal Platform. <a href="${esc(inviteStop(v))}" style="color:#86998f">Unsubscribe from these emails</a>.`;

// Weekly round-up for firms invited in bulk: the best unsold leads from the last 7 days, one email each, sent in batches.
// Runs from the daily job on Mondays; the settings row makes it once a week however often the job runs.
export async function inviteDigest(now = new Date()) {
  if (now.getUTCDay() !== 1) return 0;
  const week = now.toISOString().slice(0, 10);
  const [done] = await db('settings?key=eq.invite_digest&select=value').catch(() => []);
  if (done?.value?.week === week) return 0;
  const iso = now.toISOString();
  let [people, fresh] = await Promise.all([
    db(`invites?alerts=eq.true&digest=is.true&expires_at=gt.${iso}&and=(or(email_id.is.null,email_id.not.in.(queued,paused)),or(send_at.is.null,send_at.lte.${iso}))&select=email,name,company,token&order=email.asc&limit=20000`),
    db(`leads?buyer=is.null&hidden_at=is.null&created_at=gte.${new Date(now - 7 * 864e5).toISOString()}&select=${PREVIEW}&order=price.desc&limit=6`),
  ]);
  people = await notJoined(people);
  await db('settings', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { key: 'invite_digest', value: { week, people: people.length, leads: fresh.length } } });
  if (!people.length || !fresh.length) return 0;
  const cards = fresh.map((l) => leadCard(l)).join('');
  return sendBatch(people.map((v) => ({ to: [v.email], subject: `${fresh.length} new lead${fresh.length === 1 ? '' : 's'} on Leaflegal this week`, opts: {
    title: 'This week’s leads on Leaflegal', preheader: `${fresh.length} lead${fresh.length === 1 ? ' is' : 's are'} still available. Finish setting up to buy.`,
    greeting: `Hi ${esc(String(v.name || '').split(' ')[0] || 'there')},`,
    intro: `Here are the best leads that came in on Leaflegal over the last week and are still available. Your account${v.company ? ` for <b>${esc(v.company)}</b>` : ''} is ready. Finish setting up and you can buy them. Each lead is sold to one firm only.`,
    html: cards, cta: { label: 'Finish setting up', url: `${PLATFORM_URL}/register?invite=${v.token}` },
    note: 'Contact details unlock when a firm buys the lead.', replyTo: 'hello@leaflegal.co',
    nav: false, unsub: inviteStop(v), footer: inviteFooter(v) } })), BULK_FROM());
}

// Email version of an Opportunities card: practice area, time, matter, four facts, why it's outside the criteria, price.
// Tables and inline styles only (email clients), square corners like the other emails.
function leadCard(l, why = [], { plain = false } = {}) {
  const F = 'font-family:Arial,Helvetica,sans-serif;', s = salePrice(l), m = (Date.now() - new Date(l.created_at)) / 6e4;
  const ago = m < 60 ? `${Math.max(1, m | 0)} min ago` : m < 1440 ? `${(m / 60) | 0} hr ago` : `${(m / 1440) | 0} day${m < 2880 ? '' : 's'} ago`;
  const fact = (k, v) => `<td width="50%" style="${F}padding:9px 0 0;vertical-align:top"><div style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:#86998f">${k}</div><div style="margin-top:2px;font-size:14px;font-weight:bold;color:#14271f">${esc(v || '–')}</div></td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border:1px solid #dde5e1;border-collapse:collapse;background:#fff">
<tr><td style="${F}padding:16px 20px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="${F}font-size:14px;font-weight:bold;color:#244237">${esc(areaName(l))}${plain ? '' : `<span style="font-weight:normal;color:#86998f"> · ${ago}</span>`}</td>
${s.discounted && !plain ? `<td align="right" style="${F}"><span style="display:inline-block;white-space:nowrap;padding:3px 8px;background:#ffa630;color:#14271f;font-size:11px;font-weight:bold">50% OFF</span></td>` : ''}</tr></table></td></tr>
<tr><td style="${F}padding:6px 20px 2px;font-size:22px;line-height:1.2;font-weight:bold;color:#14271f">${esc(matterName(l))}</td></tr>
<tr><td style="padding:0 20px 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${fact('Location', placeOf(l))}${fact('Urgency', l.urgency)}</tr><tr>${fact('Client', audienceLabel(l.audience))}${fact(l.value_band ? l.value_label || 'Value' : 'Grade', l.value_band || l.grade)}</tr></table></td></tr>
${why.length ? `<tr><td style="${F}padding:10px 20px;background:#fff6e8;border-top:1px solid #f3e2c4;font-size:13px;line-height:1.5;color:#6b4a12"><b>Outside your criteria</b><br>${why.map(esc).join('<br>')}</td></tr>` : ''}
${plain ? '' : `<tr><td style="padding:12px 20px;border-top:1px solid #dde5e1;background:#f7f9f8"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="${F}font-size:14px"><a href="${PLATFORM_URL}/opportunities" style="color:#244237;font-weight:bold">View lead</a></td>
<td align="right" style="${F}font-size:20px;font-weight:bold;color:#244237">${s.discounted ? `<s style="font-size:14px;font-weight:normal;color:#86998f">${s.list_price}</s> ` : ''}${s.price}<span style="font-size:12px;font-weight:normal;color:#62786f"> credits</span></td></tr></table></td></tr>`}
</table>`;
}
// "Recent enquiries" for cold invites: the three strongest verified leads from the last 3 weeks (grade, score, live checks;
// best of each practice area first), as three compact cards. Contact details are shown only as fixed dots: nothing real
// is in the email, not even a letter. Cached for 10 minutes.
let recentCache = { t: 0, html: '' };
export async function recentEnquiries() {
  if (Date.now() - recentCache.t < 6e5) return recentCache.html;
  const rows = await db(`leads?created_at=gte.${new Date(Date.now() - 21 * 864e5).toISOString()}&hidden_at=is.null&select=${PREVIEW},checks&order=created_at.desc&limit=200`).catch(() => []);
  const ok = (l) => ({ phone: l.checks?.phone?.reachable === true || l.checks?.phone?.allocated === true || l.checks?.verified?.phone === true, email: l.checks?.email?.result === 'valid' || l.checks?.verified?.email === true });
  const score = (l) => { const v = ok(l); return (Number(l.score) || 0) + ({ A: 20, B: 10 }[l.grade] || 0) + (v.phone + v.email) * 15; }; // fully verified leads first
  const ranked = rows.filter((l) => l.area && l.grade !== 'C').sort((a, b) => score(b) - score(a)), pick = [];
  for (const l of ranked) if (pick.length < 3 && !pick.some((x) => x.area === l.area)) pick.push(l); // best of each practice area first
  for (const l of ranked) if (pick.length < 3 && !pick.includes(l)) pick.push(l); // then the best of the rest
  const F = 'font-family:Arial,Helvetica,sans-serif;';
  const tick = (on, label, masked) => `<tr><td style="${F}padding:7px 0 0;font-size:12px;line-height:1.35;color:#2b3f36"><span style="color:${on ? '#1f8f4e' : '#a7b5ae'};font-weight:bold">${on ? '&#10003;' : '&#8211;'}</span>&nbsp;${label}<br><span style="color:#a7b5ae;letter-spacing:1px">${masked}</span></td></tr>`;
  const card = (l) => { const v = ok(l);
    return `<!--[if mso]><td width="33%" valign="top" style="padding:0 5px"><![endif]--><div class="ll-card" style="display:inline-block;width:100%;max-width:166px;vertical-align:top;margin:0 3px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde5e1;background:#ffffff;border-collapse:collapse"><tr><td style="padding:14px 14px 13px;text-align:left">
<div class="ll-purpose" style="${F}height:26px;overflow:hidden;font-size:10px;line-height:13px;letter-spacing:.7px;text-transform:uppercase;font-weight:bold;color:#62786f">${esc(areaName(l))}</div>
<div style="${F}margin-top:4px;height:44px;overflow:hidden;font-size:17px;line-height:22px;font-weight:bold;color:#14271f">${esc(matterName(l))}</div>
<div style="${F}margin-top:6px;font-size:12px;line-height:1.5;color:#2b3f36">${esc(l.region || 'UK')}<br>${esc(l.urgency || 'Timing not given')}<br>${l.grade ? `Grade ${esc(l.grade)} lead` : 'New lead'}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:9px;border-top:1px solid #edf1ef">
${tick(true, 'Name given', '&#9679;&#9679;&#9679;&#9679; &#9679;&#9679;&#9679;&#9679;&#9679;')}${tick(v.phone, 'Phone verified', '07&#9679;&#9679;&#9679; &#9679;&#9679;&#9679;&#9679;&#9679;&#9679;')}${tick(v.email, 'Email verified', '&#9679;&#9679;&#9679;&#9679;@&#9679;&#9679;&#9679;&#9679;&#9679;')}
</table></td></tr></table></div><!--[if mso]></td><![endif]-->`; };
  const html = pick.length ? `<h2 style="${F}margin:32px 0 4px;font-size:17px;line-height:1.3;font-weight:bold;color:#14271f">Recent enquiries</h2>
<p style="${F}margin:0 0 14px;font-size:14px;line-height:1.6;color:#62786f">People and businesses who asked for a law firm on Leaflegal in the last few weeks. Contact details unlock when a firm buys the lead.</p>
<div class="ll-cards" style="text-align:center;font-size:0;margin:0 -3px"><!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><![endif]-->${pick.map(card).join('')}<!--[if mso]></tr></table><![endif]--></div>
<p style="${F}margin:6px 0 26px;text-align:center;font-size:15px"><a href="{{more}}" style="color:#244237;font-weight:bold;text-decoration:underline">View more opportunities &rarr;</a></p>` : ''; // {{more}}: each email fills in its own link
  recentCache = { t: Date.now(), html };
  return html;
}

// "Outside your criteria" email: one lead (instant) or several (daily summary). Says why each one doesn't fit.
// Only leads the firm's regulators allow it to take.
export function suggest(b, leads) {
  leads = leads.filter((l) => canTake(b, l));
  if (!leads.length) return Promise.resolve(null);
  const unsub = signedUrl('suggest-off', b.id, 365), one = leads.length === 1, l = leads[0], f = b.filters || {};
  const what = (x) => `${matterName(x)}, ${whereOf(x)}`;
  const cost = (x) => { const s = salePrice(x); return s.discounted ? `${s.price} credits, was ${s.list_price}` : `${s.price} credits`; };
  return notify(recipients(b, 'alert'), one ? `Outside your criteria: ${what(l)} (${cost(l)})` : `${leads.length} leads outside your criteria are still available`, {
    title: one ? 'A lead outside your criteria' : `${leads.length} leads outside your criteria`,
    preheader: one ? `${what(l)}. It doesn’t fit your settings, but it’s still available.` : 'They don’t fit your settings, but they’re still available to buy.',
    greeting: `Hello ${esc(b.company)},`,
    intro: one ? `This lead doesn’t fit the criteria in your settings, so ${b.mode === 'auto' ? 'auto-buy didn’t buy it and ' : ''}we wouldn’t normally send it. It might still be worth a look. Each lead is sold to one firm only.`
      : `These leads came in over the last day. They don’t fit the criteria in your settings, so ${b.mode === 'auto' ? 'auto-buy didn’t buy them, but ' : ''}they might still be worth a look. Each lead is sold to one firm only.`,
    ...(one ? { highlight: { value: matterName(l), label: `Outside your criteria · ${cost(l)}` },
      rows: leadRows(l).filter(([k]) => k !== 'Matter'),
      tipsTitle: 'Why it’s outside your criteria', tips: misses(f, l).map(esc) }
      : { html: `<p style="font-family:Arial,Helvetica,sans-serif;margin:26px 0 14px;font-size:16px;font-weight:bold;color:#14271f">Still available</p>${leads.slice(0, 10).map((x) => leadCard(x, misses(f, x))).join('')}${leads.length > 10 ? `<p style="font-family:Arial,Helvetica,sans-serif;margin:0 0 18px;font-size:14px;color:#62786f">And ${leads.length - 10} more on the platform.</p>` : ''}` }),
    cta: { label: one ? 'View this lead' : 'View leads', url: `${PLATFORM_URL}/opportunities` },
    note: `Not interested in leads like ${one ? 'this' : 'these'}? You can get them as a daily summary instead, or switch them off, under <a href="${PLATFORM_URL}/notifications" style="color:#244237">Notifications</a>.`,
    unsub, footer: `You're receiving this because ${esc(b.company)} gets emails about leads outside its criteria. <a href="${unsub}" style="color:#86998f">Unsubscribe from these emails</a> or change them under <a href="${PLATFORM_URL}/notifications" style="color:#86998f">Notifications</a>.` });
}
// Daily (cron-plans): unsold leads from the last day that sit outside each 'daily' firm's criteria.
export async function suggestDigest() {
  const since = new Date(Date.now() - 864e5).toISOString(), cut = new Date(Date.now() - 20 * 36e5).toISOString();
  const [brokers, leads] = await Promise.all([db('brokers?approved=eq.true&suspended_at=is.null&filters->>suggest=eq.daily&select=*'),
    db(`leads?buyer=is.null&hidden_at=is.null&created_at=gte.${since}&select=${PREVIEW},exclude_brokers&order=created_at.desc`)]);
  let sent = 0;
  for (const b of brokers) {
    if (missedEmailOn(b)) continue; // the missed-leads email covers these
    if (b.filters.digestAt > cut) continue; // already sent today (cron reruns)
    const list = leads.filter((l) => canTake(b, l) && !matches(b.filters, l) && !excluded(l, b.id));
    if (!list.length) continue;
    await db(`brokers?id=eq.${b.id}`, { method: 'PATCH', body: { filters: { ...b.filters, digestAt: new Date().toISOString() } } });
    await suggest(b, list).then(() => sent++, (e) => console.error('digest', b.id, e.message));
  }
  return sent;
}

// Daily (cron-plans): to firms with auto-buy on, the leads from the last day that auto-buy skipped because of their criteria,
// sold or not, and which criteria held them back. Nudges them to widen their criteria. Off with filters.missed = 'off'.
// They get this instead of the "outside your criteria" daily summary, which would repeat the unsold ones.
export const excluded = (l, id) => (l.exclude_brokers || []).includes(id); // bought this person before
export const missedEmailOn = (b) => b.mode === 'auto' && b.filters?.missed !== 'off';
export function missedEmail(b, leads) {
  const S = missedSummary(b, leads), n = S.missed.length, s = n === 1 ? '' : 's', F = 'font-family:Arial,Helvetica,sans-serif;';
  if (!n) return null;
  const unsub = signedUrl('missed-off', b.id, 365);
  return notify(recipients(b, 'alert'), `${n} lead${s} just outside your auto-buy criteria yesterday`, {
    title: `${n} lead${s} just outside your criteria`,
    preheader: 'Firms with wider auto-buy criteria get first pick of more leads.',
    greeting: `Hello ${esc(b.company)},`,
    intro: `Over the last day, ${n === 1 ? 'a lead' : `${n} leads`} came in just outside the auto-buy criteria for <b>${esc(b.company)}</b>, so auto-buy let ${n === 1 ? 'it' : 'them'} pass.`,
    html: `<p style="${F}margin:0 0 18px;font-size:15px;line-height:1.65;color:#2b3f36">The firms who do best on Leaflegal keep their auto-buy criteria wide. They get first pick of more leads, and because each lead goes to one firm only, the first to auto-buy it is the one who gets to call. Often a single setting makes the difference.</p>`,
    tipsTitle: 'What held them back', ticks: false,
    tips: S.groups.slice(0, 6).map((g) => `${esc(g.label)}, <b>${g.n} lead${g.n === 1 ? '' : 's'}</b>${g.only ? ` (allowing this alone would have picked up ${g.only === g.n ? (g.n === 1 ? 'it' : 'all of them') : g.only})` : ''}`),
    cta: { label: 'Widen auto-buy criteria', url: `${PLATFORM_URL}/autobuy` },
    // The best first: ranked by lead price (higher value matters cost more), price itself never shown.
    after: `<p style="${F}margin:30px 0 14px;font-size:16px;font-weight:bold;color:#14271f">${n > 5 ? 'The best of them' : 'The leads'}</p>${[...S.missed].sort((x, y) => (y.l.price || 0) - (x.l.price || 0)).slice(0, 5).map((m) => leadCard(m.l, misses(b.filters || {}, m.l), { plain: true })).join('')}${n > 5 ? `<p style="${F}margin:0 0 18px;font-size:14px;color:#62786f">And ${n - 5} more.</p>` : ''}`,
    note: 'The Auto-buy page shows what your criteria let pass over the last 30 days, and lets you allow each one in a click.',
    unsub, footer: `You're receiving this because ${esc(b.company)} has auto-buy switched on. <a href="${unsub}" style="color:#86998f">Unsubscribe from these emails</a> or change them under <a href="${PLATFORM_URL}/notifications" style="color:#86998f">Notifications</a>.` });
}
export async function missedDigest() {
  const since = new Date(Date.now() - 864e5).toISOString(), cut = new Date(Date.now() - 20 * 36e5).toISOString();
  const [brokers, leads] = await Promise.all([db('brokers?approved=eq.true&suspended_at=is.null&mode=eq.auto&select=*'),
    db(`leads?created_at=gte.${since}&hidden_at=is.null&select=${PREVIEW},buyer,exclude_brokers&order=created_at.desc`)]);
  let sent = 0;
  for (const b of brokers.filter(missedEmailOn)) {
    if (b.filters?.missedAt > cut) continue; // already sent today (cron reruns)
    const mail = missedEmail(b, leads.filter((l) => !excluded(l, b.id)));
    if (!mail) continue;
    await db(`brokers?id=eq.${b.id}`, { method: 'PATCH', body: { filters: { ...b.filters, missedAt: new Date().toISOString() } } });
    await mail.then(() => sent++, (e) => console.error('missed', b.id, e.message));
  }
  return sent;
}

// ---------------------------------------------------------------- public firm profile
// What a client sees about the firm it's matched with (confirmation page + "you've been matched" email).
// Stored on brokers.profile; each contact line has a show switch. Company name always shows.
const SHOWABLE = ['person', 'website', 'phone', 'whatsapp', 'sms', 'email'];
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
export function cleanProfile(p = {}, old = {}) {
  const url = (v) => { v = clip(v, 200); if (!v) return ''; if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
    try { const u = new URL(v); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') && !u.username ? u.href : ''; } catch { return ''; } };
  const tel = (v) => clip(v, 30).replace(/[^\d+ ()-]/g, '');
  const mail = (v) => { v = clip(v, 120); return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? v : ''; };
  return { name: clip(p.name, 120), person: clip(p.person, 80), role: clip(p.role, 80), about: clip(p.about, 240),
    website: url(p.website), phone: tel(p.phone), whatsapp: tel(p.whatsapp), sms: tel(p.sms), email: mail(p.email),
    logo: p.removeLogo ? '' : old.logo || '', logoW: p.removeLogo ? 0 : old.logoW || 0, logoH: p.removeLogo ? 0 : old.logoH || 0, // only set by the logo upload
    show: Object.fromEntries(SHOWABLE.map((k) => [k, p.show?.[k] !== false])) };
}
export function publicProfile(b) {
  const p = b.profile || {}, on = (k) => p.show?.[k] !== false && p[k] ? p[k] : null;
  return { company: p.name || b.company, person: on('person'), role: on('person') ? p.role || null : null, about: p.about || null, logo: p.logo || null,
    website: on('website'), phone: on('phone'), whatsapp: on('whatsapp'), email: on('email'),
    // Text button: its own number if set, otherwise a mobile from WhatsApp or phone (as before). Switched off = no Text button.
    sms: p.show?.sms === false ? null : p.sms || (isMobile(on('whatsapp')) ? on('whatsapp') : isMobile(on('phone')) ? on('phone') : null) };
}
export const waLink = (n) => `https://wa.me/${String(n).replace(/\D/g, '').replace(/^0/, '44')}`;
const telLink = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;
const siteLabel = (u) => String(u).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

// Ready-made first message from the client to the firm (WhatsApp, text and email buttons open with it filled in).
// No matter details: it travels in links inside the client's email. Keep in step with matchMessage() in the front end.
export function matchMessage(m, l) {
  const hi = String(m.person || '').split(' ')[0] || m.company;
  return [`Hi ${hi}, I found you through Leaflegal and was matched with your firm. Could we arrange a time to talk?`, '', `Thanks, ${l.full_name || ''}`.trim()].join('\n');
}
const isMobile = (n) => /^(\+?44\s?7|07)/.test(String(n || '').replace(/[\s()-]/g, ''));
// The contact buttons, in order: Call, WhatsApp, Text, Email, Website.
export function contactActions(m, l) {
  const msg = matchMessage(m, l), enc = encodeURIComponent, text = 'sms' in m ? m.sms : isMobile(m.whatsapp) ? m.whatsapp : isMobile(m.phone) ? m.phone : null;
  return [m.phone && { k: 'call', label: 'Call', sub: m.phone, href: telLink(m.phone) },
    m.whatsapp && { k: 'whatsapp', label: 'WhatsApp', sub: 'Message on WhatsApp', href: `${waLink(m.whatsapp)}?text=${enc(msg)}` },
    text && { k: 'sms', label: 'Text', sub: text, href: `sms:${String(text).replace(/[^\d+]/g, '')}?&body=${enc(msg)}` },
    m.email && { k: 'email', label: 'Email', sub: m.email, href: `mailto:${m.email}?subject=${enc(`Enquiry from ${l.full_name || 'a Leaflegal client'} (via Leaflegal)`)}&body=${enc(msg)}` },
    m.website && { k: 'web', label: 'Website', sub: siteLabel(m.website), href: m.website }].filter(Boolean);
}

// "You've been matched" email to the client, sent whenever a firm buys (or is given) its lead. Never throws.
// Logo shown at most 180×64 in emails; explicit width/height so Outlook doesn't blow it up to full size.
const logoFit = (p, W = 180, H = 64) => { const w = p.logoW || W, h = p.logoH || H, k = Math.min(W / w, H / h, 1); return [Math.round(w * k), Math.round(h * k)]; };
// "You've been matched" message to the client's phone, alongside the email. WhatsApp first (template below, from
// BIRD_WA_FROM, once Meta approves it), otherwise a text from BIRD_SMS_FROM. Does nothing until one is set up. Never throws.
// Two templates: one for firms whose profile shows a WhatsApp number (adds that line), one without. Meta templates can't
// have optional lines, so the choice is made per send. No matter details in either.
export const MATCH_WA_TEMPLATE = 'leaflegal_firm_matched', MATCH_WA_TEMPLATE_WA = 'leaflegal_firm_matched_wa';
// Companies House names arrive in capitals ("AUTOMOVER LOGISTICS LTD"): show them as "Automover Logistics Ltd".
export const niceBusiness = (n) => { const v = String(n || '').trim(); if (!v || v !== v.toUpperCase()) return v;
  return v.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\b(Llp|Plc|Uk|Cic)\b/g, (w) => w.toUpperCase()).replace(/\b(T\/a|And|Of|The)\b/g, (w, x, i) => (i ? w.toLowerCase() : w)); };
export function matchedText(b, l) {
  const m = publicProfile(b), first = String(l.full_name || '').trim().split(/\s+/)[0] || 'there', who = m.person ? m.person.split(' ')[0] : m.company;
  const reach = [m.phone && `Call ${m.phone}`, m.whatsapp && `WhatsApp ${m.whatsapp}`, m.email && `Email ${m.email}`].filter(Boolean);
  return {
    sms: `Hi ${first}, thanks for your enquiry with Leaflegal. We've matched you with ${m.company}, a law firm, and ${who} will be in touch shortly.${reach.length ? `\n\n${reach.join('\n')}` : ''}\n\nThe firm will explain its fees before you agree to anything. Leaflegal receives a fee from the firm for the introduction. Leaflegal`,
    template: m.whatsapp ? MATCH_WA_TEMPLATE_WA : MATCH_WA_TEMPLATE,
    wa: { first_name: first, firm: m.company, contact: m.person || 'Their team', phone: m.phone || m.whatsapp || 'in your email', email: m.email || 'in your email', ...(m.whatsapp ? { whatsapp: m.whatsapp } : {}) },
  };
}
// Sending (SMS and WhatsApp) uses BIRD_API_KEY_WHATSAPPSMS when set; BIRD_API_KEY (lookups) otherwise.
export const birdMsgKey = () => process.env.BIRD_API_KEY_WHATSAPPSMS || process.env.BIRD_API_KEY;
// One WhatsApp template message through Bird (BIRD_API_KEY_WHATSAPPSMS, else BIRD_API_KEY, + BIRD_WA_FROM). UK numbers in any common format. Never throws.
export const e164 = (n) => { const d = String(n || '').replace(/[^\d+]/g, ''); return /^\+\d{8,15}$/.test(d) ? d : /^0044\d{9,10}$/.test(d) ? '+' + d.slice(2) : /^0\d{9,10}$/.test(d) ? '+44' + d.slice(1) : /^44\d{9,10}$/.test(d) ? '+' + d : null; };
export async function waTemplate(to, slug, parameters, reference) {
  const key = birdMsgKey(), num = e164(to);
  if (!key || !process.env.BIRD_WA_FROM || !num) return null;
  const region = (String(key).match(/^b[km]_([a-z]+\d)_/) || [])[1] || process.env.BIRD_REGION || 'eu1';
  try {
    const r = await fetch(`https://${region}.platform.bird.com/v1/whatsapp/messages`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: num, from: process.env.BIRD_WA_FROM, reference, template: { slug, language: 'en', parameters } }), signal: AbortSignal.timeout(8000) });
    if (!r.ok) console.error('whatsapp', slug, r.status, (await r.text()).slice(0, 900));
    return r.ok ? 'whatsapp' : null;
  } catch (e) { console.error('whatsapp', slug, e.message); return null; }
}
// A plain SMS through Bird (BIRD_SMS_FROM). Fallback when a WhatsApp can't go. Never throws.
export async function smsText(to, text, reference) {
  const key = birdMsgKey(), num = e164(to);
  if (!key || !process.env.BIRD_SMS_FROM || !num) return null;
  const region = (String(key).match(/^b[km]_([a-z]+\d)_/) || [])[1] || process.env.BIRD_REGION || 'eu1';
  try {
    const r = await fetch(`https://${region}.platform.bird.com/v1/sms/messages`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: num, from: process.env.BIRD_SMS_FROM, text: String(text).slice(0, 640), category: 'marketing', reference }), signal: AbortSignal.timeout(8000) });
    if (!r.ok) console.error('sms', reference, r.status, (await r.text()).slice(0, 900));
    return r.ok ? 'sms' : null;
  } catch (e) { console.error('sms', reference, e.message); return null; }
}
// WhatsApp template, or the same message by SMS if the WhatsApp can't go (template pending, no WhatsApp on the number, error).
export const waOrSms = async (to, slug, parameters, text, reference) => (await waTemplate(to, slug, parameters, reference)) || smsText(to, text, reference);
export async function matchedMessage(b, l) {
  const key = birdMsgKey(), to = /^\+\d{8,15}$/.test(String(l.phone || '').replace(/\s/g, '')) ? String(l.phone).replace(/\s/g, '') : null;
  if (!key || !to) return null;
  const region = (String(key).match(/^b[km]_([a-z]+\d)_/) || [])[1] || process.env.BIRD_REGION || 'eu1';
  const bird = (path, body) => fetch(`https://${region}.platform.bird.com/v1/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(8000) }).catch((e) => ({ ok: false, status: 0, text: async () => e.message }));
  const t = matchedText(b, l), ref = `match-${l.id}`;
  if (process.env.BIRD_WA_FROM) {
    const r = await bird('whatsapp/messages', { to, from: process.env.BIRD_WA_FROM, reference: ref, template: { slug: t.template, language: 'en', parameters: t.wa } });
    if (r.ok) return 'whatsapp';
    console.error('match whatsapp', r.status, (await r.text()).slice(0, 300)); // e.g. not on WhatsApp: fall back to a text
  }
  if (process.env.BIRD_SMS_FROM) {
    const r = await bird('sms/messages', { to, from: process.env.BIRD_SMS_FROM, text: t.sms, category: 'transactional', reference: ref });
    if (r.ok) return 'sms';
    console.error('match sms', r.status, (await r.text()).slice(0, 300));
  }
  return null;
}

export function matchedEmail(b, l) {
  if (!l?.email) return null;
  return notify([l.email], `You've been matched with ${publicProfile(b).company}`, matchedOpts(b, l));
}
const EMOJI = { call: '&#128222;', whatsapp: '&#128172;', sms: '&#128241;', email: '&#9993;&#65039;', web: '&#127760;' };
// The client email. No matter details or answers: only the firm, how to reach it, and what happens next.
export function matchedOpts(b, l, rematch) { // rematch: link to a different firm = the "already matched" version
  const m = publicProfile(b), first = String(l.full_name || '').split(' ')[0], who = m.person || m.company;
  const F = 'font-family:Arial,Helvetica,sans-serif;', G = '#244237', MUTED = '#62786f', LINE = '#dde5e1';
  const card = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 26px;border:1px solid ${LINE};border-collapse:collapse"><tr><td style="${F}padding:22px 24px 14px">
${m.logo ? (([w, h]) => `<img src="${esc(m.logo)}" alt="${esc(m.company)}" width="${w}" height="${h}" style="display:block;width:${w}px;height:${h}px;max-width:100%;border:0;margin:0 0 14px">`)(logoFit(b.profile || {})) : ''}
<div style="font-size:20px;line-height:1.25;font-weight:bold;color:#14271f">${esc(m.company)}</div>
${m.person ? `<div style="margin-top:4px;font-size:14px;color:${MUTED}">${esc(m.person)}${m.role ? `, ${esc(m.role)}` : ''}</div>` : ''}
${m.about ? `<div style="margin-top:10px;font-size:14px;line-height:1.6;color:#2b3f36">${esc(m.about)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">${contactActions(m, l).map((a) => `<tr><td style="padding:0 0 8px">
<a href="${esc(a.href)}" style="${F}display:block;padding:13px 16px;background:${a.k === 'whatsapp' ? '#1f8f4e' : G};color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold">${EMOJI[a.k]}&nbsp;&nbsp;${esc(a.label)}<span style="font-weight:normal;opacity:.85">&nbsp;&nbsp;${esc(a.sub)}</span></a></td></tr>`).join('')}</table></td></tr></table>`;
  return {
    title: `You've ${rematch ? 'already ' : ''}been matched with ${m.company}`, preheader: rematch ? `${who} has your details and we've told them you're still looking.` : `${who} will be in touch shortly.`,
    greeting: `Hi ${esc(first)},`,
    ...(rematch ? { link: { label: 'Match me with a different firm', url: rematch } } : {}),
    intro: rematch ? `Thanks for getting in touch again. You're already matched with <b>${esc(m.company)}</b>, so we've let them know you're still looking. ${m.person ? esc(m.person) : 'They'} should be in touch shortly, or you can contact them using the details below.<br><br>Would you rather speak to someone else? Use the link at the bottom of this email and we'll match you with a different firm.`
      : `Thanks for your enquiry. We've matched you with <b>${esc(m.company)}</b>, a law firm that can help. ${m.person ? esc(m.person) : 'They'} will be in touch shortly, usually by phone.`,
    html: card,
    stepsTitle: 'What happens next', steps: [['They contact you', `Expect a call from ${esc(who)}${m.phone ? ` on ${esc(m.phone)}` : ''}. Save their number so you know it's them.`],
      ['They explain their fees', 'The firm will tell you how they work and what they charge before you agree to anything.'],
      ['You decide', 'You choose whether to instruct them. There is no obligation.']],
    note: 'Leaflegal receives a fee from the firm for introducing you. It does not change what the firm charges you.',
    footer: `Leaflegal introduces people and businesses to law firms. Leaflegal is not a law firm and does not give legal advice. Any arrangement is between you and the firm, which is responsible for the advice it gives you.</p><p style="margin:0 0 12px">You're receiving this because you asked Leaflegal to put you in touch with a law firm.`, nav: false, replyTo: 'hello@leaflegal.co', from: MAIL_FROM() };
}

// Previews for the Profile tab: the real email, and the form's thank-you page as the client sees it.
// The page markup mirrors the match card on the enquiry forms. Change both together.
const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const MATCH_ICON = { call: icon('<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
  whatsapp: icon('<path d="M3 21l1.7-4.9A8.6 8.6 0 1 1 8 19.6z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.2-1.8-.9-.8.8a4 4 0 0 1-2.3-2.3l.8-.8-.9-1.8z"/>'),
  sms: icon('<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 18h4"/>'), email: icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  web: icon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>') };
export function matchedPreviews(b) {
  const l = { email: 'preview@example.com', full_name: 'Sam Taylor', area: 'family-law', matter: 'divorce', urgency: 'Within a month', region: 'London' };
  const m = publicProfile(b), btns = contactActions(m, l).map((x) => `<a class="ap-mb ap-mb-${x.k}" href="#">${MATCH_ICON[x.k]}<span><b>${x.label}</b><em>${esc(x.sub)}</em></span></a>`);
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank">
<link href="/assets/base.css" rel="stylesheet"><link href="/assets/site.css?v=28" rel="stylesheet"><link href="/assets/apply.css?v=31" rel="stylesheet">
<style>body{margin:0;background:#f4f7f5}a{pointer-events:none}.sec{padding:56px 24px 72px}.w{max-width:680px;margin:0 auto;padding:44px 40px 48px;background:#fff;border-radius:28px;box-shadow:0 24px 60px rgba(20,39,31,.08)}</style></head><body>
<div class="sec"><div class="w"><div class="ap-step on ap-done">
<div class="ap-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
<h2 class="ap-q">Thanks, Sam. We've matched you with ${esc(m.company)}.</h2><p class="ap-done-lead">${esc(m.person || 'They')} will be in touch shortly, usually by phone. We've emailed you their details too.</p>
<div class="ap-match"><span class="ap-match-tag">Your law firm</span>${m.logo ? `<img class="ap-match-logo" src="${esc(m.logo)}" alt="">` : ''}<b class="ap-match-name">${esc(m.company)}</b>
${m.person ? `<span class="ap-match-who">${esc(m.person)}${m.role ? `, ${esc(m.role)}` : ''}</span>` : ''}${m.about ? `<p class="ap-match-about">${esc(m.about)}</p>` : ''}${btns.length ? `<div class="ap-match-btns">${btns.join('')}</div>` : ''}</div>
<dl class="ap-summary"><div><dt>Help with</dt><dd>Divorce</dd></div><div><dt>Practice area</dt><dd>Family law</dd></div><div><dt>Timing</dt><dd>Within a month</dd></div></dl>
</div></div></div></body></html>`;
  return { email: emailHtml(matchedOpts(b, l)), subject: `You've been matched with ${m.company}`, page, ...phonePreviews(b, l) };
}
// The wording of the two matched WhatsApp templates (Bird). They need Meta approval under these names. Keep in step if edited.
const MATCH_WA_BODY = {
  [MATCH_WA_TEMPLATE]: "Hi {{first_name}}, thanks for your enquiry with Leaflegal ✅\n\nWe've matched you with *{{firm}}*, a law firm. {{contact}} will be in touch shortly.\n\n📞 {{phone}}\n✉️ {{email}}\n\nThe firm will explain its fees before you agree to anything. Leaflegal receives a fee from the firm for the introduction. There's no obligation to go ahead.",
  [MATCH_WA_TEMPLATE_WA]: "Hi {{first_name}}, thanks for your enquiry with Leaflegal ✅\n\nWe've matched you with *{{firm}}*, a law firm. {{contact}} will be in touch shortly.\n\n📞 {{phone}}\n💬 WhatsApp {{whatsapp}}\n✉️ {{email}}\n\nThe firm will explain its fees before you agree to anything. Leaflegal receives a fee from the firm for the introduction. There's no obligation to go ahead.",
};
// WhatsApp and text previews for Profile: the same matchedText the real send uses, drawn as a phone chat.
function phonePreviews(b, l) {
  const t = matchedText(b, l);
  const wa = MATCH_WA_BODY[t.template].replace(/{{(\w+)}}/g, (_, k) => t.wa[k] ?? '');
  const fmt = (x) => esc(x).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const doc = (bg, bubble, head, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font:15px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:${bg};color:#111b21}
.top{display:flex;align-items:center;gap:10px;padding:12px 16px;background:${head};color:#fff;font-weight:600}.top i{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.25)}
.top span{display:block;font-size:12px;font-weight:400;opacity:.8}.c{padding:22px 16px 40px}
.b{max-width:82%;padding:9px 12px 8px;border-radius:12px;border-top-left-radius:3px;background:${bubble};box-shadow:0 1px 1px rgba(0,0,0,.12);word-wrap:break-word}
.f{margin-top:8px;font-size:12.5px;color:#667781}.tm{display:block;text-align:right;font-size:11px;color:#667781;margin-top:4px}</style></head><body>${body}</body></html>`;
  return {
    whatsapp: doc('#efeae2', '#fff', '#075e54', `<div class="top"><i></i><div>Leaflegal<span>Business account</span></div></div><div class="c"><div class="b">${fmt(wa)}<div class="f">Leaflegal · leaflegal.co</div><span class="tm">09:41</span></div></div>`),
    sms: doc('#fff', '#e9e9eb', '#3a3a3c', `<div class="top"><i></i><div>Leaflegal<span>Text message</span></div></div><div class="c"><div class="b" style="border-radius:18px;border-bottom-left-radius:4px">${fmt(t.sms)}</div></div>`),
  };
}

// "Fill in from my website": reads the public home page for name, description, phone, WhatsApp, email and logo.
async function fetchPublic(url, max) {
  let u = url;
  for (let i = 0; i < 4; i++) {
    if (!(await safeWebhookUrl(u))) return null;
    const r = await fetch(u, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeaflegalBot/1.0; +https://leaflegal.co)', Accept: 'text/html,image/*;q=0.9,*/*;q=0.5' }, signal: AbortSignal.timeout(6000) }).catch(() => null);
    if (!r) return null;
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { u = new URL(r.headers.get('location'), u).href; continue; }
    if (!r.ok || Number(r.headers.get('content-length')) > max) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    return buf.length > max ? null : { buf, type: r.headers.get('content-type') || '', url: u };
  }
  return null;
}
const unent = (s) => String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).trim();
const tagsOf = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => Object.fromEntries([...m[0].matchAll(/([a-z:_-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi)].map((a) => [a[1].toLowerCase(), unent(a[3] ?? a[4])])));
export async function scanSite(input) {
  let start = String(input || '').trim(); if (!start) return null;
  start = start.replace(/^http:\/\//i, 'https://'); if (!/^https:\/\//i.test(start)) start = `https://${start}`;
  const page = await fetchPublic(start, 3e6);
  if (!page || !/html/i.test(page.type)) return null;
  const html = page.buf.toString('utf8'), abs = (v) => { try { return new URL(v, page.url).href; } catch { return null; } };
  const metas = tagsOf(html, 'meta'), meta = (k) => metas.find((x) => (x.property || x.name || '').toLowerCase() === k)?.content;
  const title = unent(html.match(/<title[^>]*>([^<]*)/i)?.[1] || '');
  const hrefs = tagsOf(html, 'a').map((a) => a.href || '').filter(Boolean);
  const phone = hrefs.find((h) => /^tel:/i.test(h)), mail = hrefs.find((h) => /^mailto:/i.test(h));
  const wa = hrefs.map((h) => h.match(/wa\.me\/\+?(\d{8,15})|whatsapp\.com\/send\?(?:[^#]*&)?phone=\+?(\d{8,15})/i)).find(Boolean);
  const imgs = tagsOf(html, 'img'), links = tagsOf(html, 'link');
  const dec = (v) => { try { return decodeURIComponent(v); } catch { return v; } };
  // Structured data (schema.org Organization / LocalBusiness), when the site has it, is the most reliable source.
  let org = {};
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const walk = (o) => { if (!o || typeof o !== 'object' || org.name) return; if (/Organization|Business|LegalService|Attorney|Corporation|ProfessionalService/i.test([].concat(o['@type'] || []).join(' ')) && typeof o.name === 'string') org = o; else Object.values(o).forEach(walk); }; walk(JSON.parse(m[1])); } catch {}
  }
  // Company name: the part of the page title that matches the web address ("Vertical Brands - Brand & ..." on verticalbrands.co),
  // or what the site's own logo is labelled, before falling back to the first part of the title.
  const host = new URL(page.url).hostname.replace(/^www\./, '').split('.')[0], norm = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const likeHost = (v) => { const n = norm(v); return n.length > 2 && (host.includes(n) || n.includes(host)); };
  const segs = title.split(/\s[|–—-]\s|\s·\s|:\s/).map((x) => x.trim()).filter(Boolean);
  const label = (t) => String(t.match(/aria-label="([^"]+)"/i)?.[1] || t.match(/<title>([^<]+)/i)?.[1] || '').replace(/\s*(logo|home(page)?)\s*$/i, '').trim();
  const svgs = [...html.matchAll(/<svg\b[\s\S]*?<\/svg>/gi)].map((m) => ({ t: m[0], at: m.index }));
  const inLogoLink = (at) => /<a\b[^>]*(logo|brand|href="\/")[^>]*>\s*(<[^a][^>]*>\s*)*$/i.test(html.slice(Math.max(0, at - 400), at));
  const svgLogo = svgs.find((x) => likeHost(label(x.t)) || /class="[^"]*logo/i.test(x.t.slice(0, 300))) || svgs.find((x) => inLogoLink(x.at) && x.t.length > 300);
  const notOurs = (i) => /client|partner|customer|trusted|press|award|testimonial|case|review|payment|badge/i.test(`${i.src || ''} ${i.alt || ''} ${i.class || ''}`); // other companies' logos
  const imgLogos = imgs.filter((i) => (i.src || i['data-src']) && !notOurs(i) && /logo/i.test(`${i.src || ''} ${i.alt || ''} ${i.class || ''} ${i.id || ''}`));
  const light = (i) => /white|light|reverse|negative|inverse/i.test(`${i.src || ''} ${i.class || ''}`); // made for dark headers: invisible on our white cards
  const logoImg = [...imgLogos.filter((i) => !light(i)), ...imgLogos.filter(light)].find((i) => likeHost(i.alt) || likeHost((i.src || '').split('/').pop())) || imgLogos.find((i) => !light(i)) || imgLogos[0];
  const name = clip(unent(org.name || meta('og:site_name') || meta('application-name') || segs.find(likeHost) || (svgLogo && label(svgLogo.t)) ||
    (logoImg?.alt && !/^logo$/i.test(logoImg.alt) ? logoImg.alt.replace(/\s*logo$/i, '') : '') || (segs.length > 1 ? segs[0] : '') || host.charAt(0).toUpperCase() + host.slice(1)), 120);
  // Logo: the site's own header logo (inline SVG or image), then its app icon.
  let logo = null;
  if (svgLogo) {
    const vb = svgLogo.t.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (vb) { // give it a fixed size (sites often use width="auto"), drop CSS classes, and colour currentColor dark
      let t = svgLogo.t.replace(/^<svg\b([^>]*)>/i, (_, at) => `<svg${at.replace(/\s(width|height|class|style)="[^"]*"/gi, '')} width="${vb[1]}" height="${vb[2]}">`).replace(/currentColor/g, '#1b3329');
      if (!/xmlns=/.test(t.slice(0, 400))) t = t.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
      if (t.length < 4e5) logo = `data:image/svg+xml;base64,${Buffer.from(t).toString('base64')}`;
    }
  }
  const logoUrl = !logo && abs(logoImg?.src || logoImg?.['data-src'] || meta('og:logo') || links.find((l) => /apple-touch-icon/i.test(l.rel || ''))?.href || links.find((l) => /(^|\s)icon/i.test(l.rel || '') && l.href)?.href || '');
  if (logoUrl && !/^data:/i.test(logoUrl)) {
    const img = await fetchPublic(logoUrl, 2e6);
    if (img && /^image\/(png|jpe?g|webp|gif|svg\+xml)/i.test(img.type)) logo = `data:${img.type.split(';')[0]};base64,${img.buf.toString('base64')}`;
  }
  return {
    website: new URL(page.url).origin + '/',
    name,
    about: clip(unent(meta('description') || meta('og:description') || ''), 240),
    phone: phone ? clip(dec(phone.slice(4)), 30) : clip(typeof org.telephone === 'string' ? org.telephone : '', 30),
    whatsapp: wa ? `+${wa[1] || wa[2]}` : '',
    email: mail ? clip(dec(mail.slice(7)).split('?')[0], 120) : clip(typeof org.email === 'string' ? org.email.replace(/^mailto:/i, '') : '', 120),
    logo,
  };
}
