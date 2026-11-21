import { createHmac, createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { typeLabel, chUrl, dobLabel } from './ch.js';
// Shared logic for the broker platform (platform.loanleaf.co): database access, lead pricing,
// auto-buy matching and lead delivery. Files under api/_lib are not deployed as endpoints.
// Env: SUPABASE_SECRET_KEY (required; the project's secret or service_role key), SUPABASE_URL (optional),
//      RESEND_API_KEY, ENQUIRY_FROM, ENQUIRY_TO (admin alerts).
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tefpljuzuvdchczcfjlz.supabase.co';
export const PUBLISHABLE_KEY = 'sb_publishable_xkOwkkbg3qYYJukThYnHDw_Q_oqo-hm';
export const PLATFORM_URL = (process.env.PLATFORM_URL || 'https://platform.loanleaf.co').replace(/\/platform\/?$/, '');
// Sign-up hand-off from the loanleaf.co partner form to platform.loanleaf.co/register (different origins, so no shared
// browser storage). The details travel encrypted and expire after 30 days; nothing readable goes in the URL.
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
export const signedUrl = (kind, id, days) => { const exp = Date.now() + days * 864e5; return `https://platform.loanleaf.co/api/platform?action=${kind}&id=${id}&exp=${exp}&sig=${linkSig(kind, id, exp)}`; };
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

// ---------------------------------------------------------------- pricing (credits per lead)
// Bigger loans and bigger businesses are worth more to a broker. Edit these two tables to re-price.
// Bands brokers can buy. Under £50k revenue goes to Aureum, not the marketplace. Under 6 months trading is opt-in (see checks()).
export const TURNOVERS = ['£50k to £100k', '£100k to £250k', '£250k to £500k', '£500k to £1m', '£1m to £5m', '£5m+'];
export const TRADING = ['Under 6 months', '6 to 12 months', '1 to 2 years', '2 to 5 years', '5+ years'];
export const PROPERTY = ['Homeowner', 'Tenant'];
export const STRUCTURES = ['Limited company', 'Limited liability partnership (LLP)'];
export const PURPOSES = ['Growth and expansion', 'Cash flow', 'Equipment or vehicles', 'Stock and inventory', 'Commercial property', 'Refinance existing debt', 'Tax or VAT bill', 'Something else'];
// ---------------------------------------------------------------- lead pricing algorithm (1 credit = £1)
// price = min + (max - min) × size × affordability × age × revenue × credit, rounded to £5.
//  size:          bigger loans are worth more (log scale: ~£10k → 0.1, £100k → 0.45, £1m → 0.9, £1.6m+ → 1)
//  affordability: how realistic the ask is versus revenue. Asking for up to ~half a year's revenue is normal;
//                 asking for many times revenue is unfundable and worth almost nothing (smooth fall-off around 1× revenue).
//  age / revenue: older, bigger businesses are easier to place.
// e.g. 6–12 months old, £100k–£250k revenue, wants £5m → £40 (the floor for £100k+ revenue; under £100k revenue the minimum is £20). 2–5 years old, £1m–£5m revenue, wants £1m → about £230. Everything at the top → £250.
export const REVENUE_MID = { 'Under £50k': 35000, '£50k to £100k': 75000, '£100k to £250k': 175000, '£250k to £500k': 375000, '£500k to £1m': 750000, '£1m to £5m': 2500000, '£5m+': 10000000 }; // £5m+ is open-ended, so its midpoint is set high
export const DEFAULT_PRICING = {
  min: 20, max: 300,
  age: { 'Under 6 months': 0.3, '6 to 12 months': 0.5, '1 to 2 years': 0.75, '2 to 5 years': 1, '5+ years': 1 },
  revenue: { 'Under £50k': 0.25, '£50k to £100k': 0.33, '£100k to £250k': 0.7, '£250k to £500k': 0.8, '£500k to £1m': 0.9, '£1m to £5m': 1, '£5m+': 1 },
  adverse: 0.75, unsure: 1, // 'Not sure' counts as clean credit (user, 18 Nov 2026)
  floor100k: 40, // leads from businesses with £100k+ revenue never cost less than this
  // Loan size matters much less from £50k up (user, 17 Nov 2026): the size score is at least sizeFloor at £50k, rising to 1 by £2m.
  sizeFrom: 50000, sizeFloor: 0.4,
  // £500k+ revenue, trading 5+ years, clean credit: never less than this (0 = off; 150 was tried and judged too pricey).
  floorPrime: 0,
};
// Clients an admin has excused from the partner agreement (Admin → client → Agreement). They can buy and be auto-bought for
// without signing. Kept in settings (key agreement_waived), so it needs no column and brokers can't change it.
export async function waivedIds() {
  try { const [r] = await db('settings?key=eq.agreement_waived&select=value'); return new Set(r?.value?.ids || []); } catch { return new Set(); }
}

export async function getPricing() {
  try { const [r] = await db('settings?key=eq.pricing&select=value'); return r?.value?.age ? { ...DEFAULT_PRICING, ...r.value } : DEFAULT_PRICING; } catch { return DEFAULT_PRICING; }
}
const AFF_FULL = 1 + Math.pow(0.5, 2.2);
export function priceParts(l, P = DEFAULT_PRICING) {
  const amount = Math.max(1000, l.amount || 0), rev = REVENUE_MID[l.turnover] || 100000, ratio = amount / rev;
  let size = Math.min(1, Math.max(0, (Math.log10(amount) - 4) / 2.2)); // £10k or less scores 0 on size (user, 18 Nov 2026: a £5k loan at £50k–£100k revenue should be about 20)
  const from = P.sizeFrom ?? 50000, sf = P.sizeFloor ?? 0.4;
  if (amount >= from) size = Math.max(size, sf + (1 - sf) * Math.min(1, (Math.log10(amount) - Math.log10(from)) / (Math.log10(2e6) - Math.log10(from))));
  const affordability = Math.min(1, AFF_FULL / (1 + Math.pow(ratio, 2.2))); // full marks up to half a year's revenue
  const age = P.age[l.trading] ?? 0.6, revenue = P.revenue[l.turnover] ?? 0.7;
  const credit = l.credit === 'Yes' ? P.adverse : l.credit === 'Not sure' ? P.unsure : 1;
  return { size, affordability, age, revenue, credit, ratio, score: size * affordability * age * revenue * credit };
}
export function price(l, P = DEFAULT_PRICING) {
  const p = P.min + (P.max - P.min) * priceParts(l, P).score;
  const rev = REVENUE_MID[l.turnover] || 0, prime = rev >= 750000 && l.trading === '5+ years' && l.credit !== 'Yes';
  const floor = Math.max(P.min, rev >= 100000 ? P.floor100k ?? 40 : 0, prime ? P.floorPrime ?? 0 : 0);
  return Math.min(P.max, Math.max(floor, Math.round(p / 5) * 5));
}
// Worked examples shown to brokers on the Credits page.
export const PRICE_EXAMPLES = [
  { amount: 25000, turnover: '£100k to £250k', trading: '1 to 2 years', credit: 'No' },
  { amount: 100000, turnover: '£250k to £500k', trading: '2 to 5 years', credit: 'No' },
  { amount: 250000, turnover: '£1m to £5m', trading: '5+ years', credit: 'No' },
  { amount: 1000000, turnover: '£1m to £5m', trading: '2 to 5 years', credit: 'No' },
  { amount: 2000000, turnover: '£5m+', trading: '5+ years', credit: 'No' },
  { amount: 5000000, turnover: '£100k to £250k', trading: '6 to 12 months', credit: 'No' },
];

// ---------------------------------------------------------------- lead tiers (brokers with pricing = 'tier')
// Each lead's tier and tier_price are set in the database (trigger leads_tier, tools/platform-schema-17.sql) from its revenue,
// trading age and homeownership. Brokers on 'credit' pricing (paid before Nov 2026) pay leads.price as before; brokers on
// 'tier' pricing pay leads.tier_price, choose tiers instead of detailed criteria, and give each tier a monthly auto-buy budget.
export const TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Platinum+'];
export const DEFAULT_TIER_PRICES = { Bronze: 25, Silver: 50, Gold: 80, Platinum: 150, 'Platinum+': 220 };
export async function getTierPrices() {
  try { const [r] = await db('settings?key=eq.tier_prices&select=value'); return { ...DEFAULT_TIER_PRICES, ...(r?.value || {}) }; } catch { return DEFAULT_TIER_PRICES; }
}
// Same rule as lead_tier() in SQL (tools/platform-schema-18.sql); used for examples and checks only (the database is the record).
const TIER_BASE = { '£50k to £100k': 0, '£100k to £250k': 1, '£250k to £500k': 2, '£500k to £1m': 3, '£1m to £5m': 4, '£5m+': 4 };
const DECLARED_AGE = { 'Under 6 months': 0.25, '6 to 12 months': 0.75, '1 to 2 years': 1.5, '2 to 5 years': 3, '5+ years': 6 };
export function leadTier(l, at = l.created_at || Date.now()) {
  const base = TIER_BASE[l.turnover];
  if (base == null) return null;
  const inc = /^\d{4}-\d{2}-\d{2}/.test(l.company?.incorporated || '') ? Date.parse(l.company.incorporated.slice(0, 10)) : null;
  const age = inc != null ? (new Date(at).setUTCHours(0, 0, 0, 0) - inc) / 864e5 / 365.25 : DECLARED_AGE[l.trading];
  const drop = (age != null && (age < 1 || (age < 2 && l.property !== 'Homeowner')) ? 1 : 0) + (l.credit === 'Yes' ? 1 : 0); // missed payments / CCJs: one more
  return TIER_NAMES[Math.max(0, base - drop)];
}
export const onTiers = (b) => b?.pricing === 'tier';
// A tier broker's choices: on = wanted (alerts, "fits your criteria"), credits = monthly auto-buy budget for that tier (0 = none).
export const tierPlanOf = (b) => Object.fromEntries(TIER_NAMES.map((t) => { const p = b?.filters?.tierPlan?.[t] || {};
  return [t, { on: p.on !== false, credits: Math.max(0, Math.round(Number(p.credits) || 0)) }]; }));
// What a broker's criteria are for matching: tiers for tier brokers, the detailed filters for everyone else.
// A saved tierPlan stays in filters after a broker leaves tier pricing (settings always writes it); drop it, or missGroups would match on tiers and skip the real criteria.
export const critOf = (b) => { if (onTiers(b)) return { tierPlan: tierPlanOf(b) }; const { tierPlan, ...f } = b?.filters || {}; return f; };
// An unsold lead priced for this broker: tier brokers see the tier price (prices set by hand don't apply; the 72-hour discount does).
export const asPriced = (l, b) => (onTiers(b) && !l.buyer ? { ...l, price: l.tier_price ?? null, price_fixed: false, list_price: null } : l);
// Auto-buy spend on one tier this calendar month.
export async function tierSpendOf(b, tier) {
  const from = new Date(); from.setUTCDate(1); from.setUTCHours(0, 0, 0, 0);
  const rows = await db(`leads?buyer=eq.${b.id}&auto=is.true&tier=eq.${encodeURIComponent(tier)}&bought_at=gte.${from.toISOString()}&select=price`);
  return rows.reduce((a, r) => a + (r.price || 0), 0);
}

// Lead quality 0-100: clean credit, time trading, urgency, no existing debt, revenue.
export function quality(l) {
  let s = 40;
  s += l.credit === 'Yes' ? 0 : 20;
  s += { '5+ years': 15, '2 to 5 years': 12, '1 to 2 years': 8, '6 to 12 months': 3 }[l.trading] || 0;
  s += { 'As soon as possible': 10, 'Within 2 weeks': 10, 'Within a month': 6, 'Just exploring options': 0 }[l.timeline] ?? 4;
  s += l.debt === 'No' ? 5 : 0;
  s += ['£250k to £500k', '£500k to £1m', '£1m to £5m', '£5m+'].includes(l.turnover) ? 10 : 0;
  return Math.min(100, s);
}
export const STAGES = ['new', 'contacted', 'application', 'funded', 'lost'];

// Monthly plans (subscription only, prices exclude VAT). 1 credit = £1 of lead value. Unused credits roll over.
export const PACKS = {
  starter: { name: 'Starter', credits: 2500, pence: 250000, bonus: 0 },
  growth: { name: 'Growth', credits: 5000, pence: 500000, bonus: 0 },
};
// First-time offer: first month £1,000 + VAT for 1,000 credits, then Starter (£2,500 + VAT, 2,500 credits) monthly.
export const TRIAL = { pence: 100000, credits: 1000, then: 'starter' };
export const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
// Custom plans: more than £5,000 a month in £1,000 steps (e.g. £50,000), 1 credit per £1.
// Above maxCredits a month we talk to the broker instead of selling online.
export const CUSTOM = { min: 6000, max: 250000, step: 1000, bonus: 0, maxCredits: 20000, contact: 'hello@loanleaf.co' };
export function customPack(pounds) {
  const n = Math.round(Number(pounds));
  if (!(n >= CUSTOM.min && n <= CUSTOM.max && n % CUSTOM.step === 0)) return null;
  const credits = Math.round(n * (1 + CUSTOM.bonus / 100));
  if (credits > CUSTOM.maxCredits) return null; // larger plans: contact us
  return { name: 'Custom', credits, pence: n * 100, bonus: CUSTOM.bonus };
}

// ---------------------------------------------------------------- filters
// filters: { amountMin, amountMax, turnovers[], purposes[], trading[], cleanCredit, structures[], property[], tenant }. Empty list = any.
// tenant: optional separate criteria (same keys) for tenant leads; the main criteria then cover homeowners. Leads without an answer use the main ones.
// Under 6 months trading and £50k to £100k revenue are opt-in (user, 18 Nov 2026): never matched unless the broker ticks them.
// 'Not sure' about missed payments / CCJs counts as clean credit and is shown as a dash (user, 18 Nov 2026).
export const creditShown = (v) => (v === 'Not sure' ? '–' : v);
export const OPT_IN = ['Under 6 months', '£50k to £100k'];
// £50k–£100k revenue leads are only emailed to brokers whose criteria they match: never in invite alerts, round-ups,
// "outside your criteria" or missed-lead emails (user, 20 Nov 2026).
export const unmatchedOk = (l) => l.turnover !== '£50k to £100k';
export const TENANT_KEYS = ['amountMin', 'amountMax', 'turnovers', 'purposes', 'trading', 'cleanCredit'];
const forLead = (f, l) => (l.property === 'Tenant' && f.tenant ? [{ ...f, ...f.tenant }, 't_', 'Tenants: '] : [f, '', '']);
// One criteria set's checks as { k, v, label, why }; p = form field prefix, t = label prefix.
function checks(c, l, p = '', t = '') {
  // Opt-in values: an empty list ("any") doesn't include them, the broker has to tick them.
  const out = (list, v) => (OPT_IN.includes(v) ? !(list || []).includes(v) : Array.isArray(list) && list.length && !list.includes(v));
  return [out(c.structures, l.structure) && { k: p + 'structures', v: l.structure, label: t + (l.structure === 'Limited company' ? 'Limited companies' : 'LLPs'), why: `${t}Business type: ${l.structure}` },
    l.property && out(c.property, l.property) && { k: p + 'property', v: l.property, label: `${t}${l.property}s`, why: `${t}${l.property}s not accepted` },
    c.amountMin && l.amount < c.amountMin && { k: p + 'amountMin', label: `${t}Loans under ${gbp(c.amountMin)}`, why: `${t}${gbp(l.amount)} is below the ${gbp(c.amountMin)} minimum loan` },
    c.amountMax && l.amount > c.amountMax && { k: p + 'amountMax', label: `${t}Loans over ${gbp(c.amountMax)}`, why: `${t}${gbp(l.amount)} is above the ${gbp(c.amountMax)} maximum loan` },
    c.cleanCredit && l.credit === 'Yes' && { k: p + 'cleanCredit', v: l.credit, label: t + 'Missed payments or CCJs', why: `${t}Missed payments or CCJs: ${l.credit || 'not given'}` },
    out(c.turnovers, l.turnover) && { k: p + 'turnovers', v: l.turnover, label: `${t}Revenue ${l.turnover}`, why: `${t}Annual revenue of ${l.turnover}` },
    out(c.purposes, l.purpose) && { k: p + 'purposes', v: l.purpose, label: `${t}Purpose: ${l.purpose}`, why: `${t}Purpose: ${l.purpose}` },
    out(c.trading, l.trading) && { k: p + 'trading', v: l.trading, label: `${t}Trading ${l.trading}`, why: `${t}Trading for ${l.trading}` }].filter(Boolean);
}
// Budget tiers (filters.tiers, optional): each tier is a full criteria set with a share of monthly_cap. A lead fits if any tier fits.
// Credits auto-buy has spent on each budget tier this calendar month.
export async function tierSpend(b) {
  const from = new Date(); from.setUTCDate(1); from.setUTCHours(0, 0, 0, 0);
  const rows = await db(`leads?buyer=eq.${b.id}&auto=is.true&auto_tier=not.is.null&bought_at=gte.${from.toISOString()}&select=auto_tier,price`);
  return (b.filters?.tiers || []).map((_, i) => rows.filter((r) => r.auto_tier === i).reduce((a, r) => a + (r.price || 0), 0));
}
export const tierMatches = (f, l) => (f?.tiers || []).map((t, i) => (checks(t, l).length ? -1 : i)).filter((i) => i >= 0);
// The checks as { k, v, label } so they can be counted and undone (k = the form field, v = the value to allow).
export function missGroups(f = {}, l) {
  if (f.tierPlan) return f.tierPlan[l.tier]?.on ? [] : [{ k: 'tierOn', v: l.tier || '', label: l.tier ? `${l.tier} leads` : 'Leads under £50k revenue', why: l.tier ? `${l.tier} lead: not one of your tiers` : 'Under £50k revenue, so it has no tier' }];
  if (f.tiers?.length) { // nearest tier's reasons
    if (tierMatches(f, l).length) return [];
    return f.tiers.map((t, i) => checks(t, l, `x${i}_`, `${t.name || `Tier ${i + 1}`}: `)).sort((a, b) => a.length - b.length)[0];
  }
  const [c, p, t] = forLead(f, l);
  const own = checks(c, l, p, t);
  return [...checks({ structures: f.structures, property: f.property }, l).filter((g) => /(structures|property)$/.test(g.k)), ...own.filter((g) => !/(structures|property)$/.test(g.k))];
}
// misses: why a lead falls outside a broker's criteria, in plain words (empty = it matches).
export const misses = (f, l) => missGroups(f, l).map((g) => g.why);
export const matches = (f, l) => !misses(f, l).length;
// Leads auto-buy skipped for a broker because of its criteria, and which criteria held them back.
// groups: n = leads that criterion blocked, only = leads it alone blocked (allowing it would have let auto-buy buy them).
export function missedSummary(b, leads) {
  const missed = [], G = {};
  for (const l of leads) {
    const why = missGroups(critOf(b), l);
    if (!why.length) continue;
    missed.push({ l, why });
    for (const w of why) { const g = (G[w.label] ||= { ...w, n: 0, only: 0 }); g.n++; if (why.length === 1) g.only++; }
  }
  const status = (l) => (l.buyer === b.id ? 'mine' : l.buyer ? 'sold' : 'live');
  return { missed, groups: Object.values(G).sort((x, y) => y.only - x.only || y.n - x.n), status,
    sold: missed.filter((m) => status(m.l) === 'sold').length, mine: missed.filter((m) => status(m.l) === 'mine').length, live: missed.filter((m) => status(m.l) === 'live').length };
}
// Emails about leads outside a broker's criteria: 'instant' (default), 'daily' summary or 'off'.
// Kept in brokers.filters (suggest, digestAt) so it needs no extra column; matches() ignores those keys.
export const SUGGEST = ['instant', 'daily', 'off'];
export const suggestMode = (b) => (SUGGEST.includes(b.filters?.suggest) ? b.filters.suggest : 'instant');

// Fields a broker sees before buying (no names or contact details).
export const PREVIEW = 'id,created_at,amount,purpose,timeline,structure,turnover,trading,property,credit,debt,debt_left,debt_monthly,price,list_price,price_fixed,tier,tier_price';
// Masked contact shown before purchase, e.g. J*** S****, a*****@b****.co.uk, +447******90. Raw values never leave the server.
const stars = (n) => '*'.repeat(Math.max(3, Math.min(n, 8)));
export function maskContact(l) {
  // First initial only, and no letters of the email domain: together with the Companies House preview, more would let someone identify the business.
  const name = String(l.full_name || '').trim().split(/\s+/).filter(Boolean).map((w, i) => (i ? '' : w[0].toUpperCase()) + stars(w.length - (i ? 0 : 1))).join(' ');
  const [local = '', domain = ''] = String(l.email || '').toLowerCase().split('@');
  const dot = domain.indexOf('.');
  const email = local && domain ? `${local[0]}${stars(local.length - 1)}@${stars(dot)}${domain.slice(dot)}` : '';
  const ph = String(l.phone || '').replace(/\s/g, '');
  const phone = ph.length > 6 ? `${ph.slice(0, 4)}${'*'.repeat(ph.length - 6)}${ph.slice(-2)}` : '';
  const c = l.checks || {};
  return { name, email, phone, phoneValid: /^\+447\d{9}$/.test(ph), emailChecked: !!email,
    phoneLive: c.phone?.reachable === true, emailVerified: c.email?.result === 'valid' };
}
// Leads still unsold after DISCOUNT.hours cost DISCOUNT.pct% less. The charge itself happens in buy_lead
// (tools/platform-schema-8.sql), which uses the same rule: keep the two in step.
export const DISCOUNT = { hours: 72, pct: 50 };
// Leads from businesses with £250k+ revenue are never discounted (buy_lead in tools/platform-schema-8.sql matches this).
export const NO_DISCOUNT_TURNOVERS = ['£250k to £500k', '£500k to £1m', '£1m to £5m', '£5m+'];
export const discountable = (l) => !NO_DISCOUNT_TURNOVERS.includes(l.turnover);
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
  if (l.buyer || !discountable(l) || Date.now() < discountAt(l).getTime()) return { price: l.price, list_price: null, discounted: false };
  return { price: Math.max(1, Math.ceil(l.price * (100 - DISCOUNT.pct) / 100)), list_price: l.price, discounted: true };
}
// Unsold lead as brokers see it: masked contact, current price (after any discount) and when the discount starts.
// Companies House record for brokers. Before purchase: nothing that identifies the company (no name, number or address),
// so a broker can't find the business without buying the lead. After purchase: the full record and a link.
export function companyInfo(c, full) {
  if (!c?.number) return null;
  const p = c.profile || {};
  const info = { source: 'Companies House', type: typeLabel(c.type), status: c.status || null, incorporated: full ? c.incorporated || null : c.incorporated?.slice(0, 4) || null, // year only before purchase
    locality: p.locality || null, industries: p.industries || [], accounts_overdue: !!p.accounts_overdue, confirmation_overdue: !!p.confirmation_overdue,
    insolvency_history: !!p.insolvency_history, charges: !!p.charges, director_listed: !!c.directorListed, listed_as: c.directorListed ? (c.role === 'Secretary' ? 'company secretary' : 'director') : null, director_dob: c.directorDob || null, checked: !!c.profile }; // dob (month/year) shown before purchase too
  return full ? { ...info, name: p.title || null, number: c.number, address: c.address || null, sic: p.sic || [], director: c.director || null, url: chUrl(c.number) } : info;
}
// Unsold lead as brokers see it: masked contact, Companies House preview, current price (after any discount) and when the discount starts.
// Brokers not yet approved (anyone can sign up) only see the loan, the business profile and the price.
export const withMask = ({ full_name, email, phone, business, checks, company, ...rest }, trusted = true) => ({ ...rest, ...salePrice(rest), discount_at: discountable(rest) ? discountAt(rest).toISOString() : null,
  contact: trusted ? maskContact({ full_name, email, phone, checks }) : null, companies_house: trusted ? companyInfo(company, false) : null });
export const PREVIEW_SELECT = PREVIEW + ',full_name,email,phone,checks,company';

export const FULL = PREVIEW + ',business,full_name,email,phone,bought_at,auto,stage,stage_at,funded_amount,company,archived_at';

// ---------------------------------------------------------------- email + delivery
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const gbp = (n) => '£' + Number(n || 0).toLocaleString('en-GB');
// Resend allows 10 requests a second. New-lead alerts fan out to many brokers at once, so space sends out
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
// unless they register an account (signup removes them). Registered brokers are never added. Fails open if the table is missing.
const emailIn = (list) => list.map((e) => encodeURIComponent(`"${String(e).trim().toLowerCase().replace(/"/g, '')}"`)).join(',');
// LinkedIn (Campaign Manager account 560716965). Conversions API events and ad spend. Tokens are added in Vercel:
// LINKEDIN_CAPI_TOKEN (Signals manager → Direct API → Generate access token) and LINKEDIN_ADS_TOKEN (Advertising API, r_ads_reporting;
// falls back to the CAPI token). LinkedIn member tokens expire, so failures are logged, never thrown.
export const LI_ACCOUNT = process.env.LINKEDIN_AD_ACCOUNT || '560716965';
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
  const d = new Date(since), range = `(start:(year:${d.getUTCFullYear()},month:${d.getUTCMonth() + 1},day:${d.getUTCDate()}))`;
  const url = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY&dateRange=${range}&accounts=List(${encodeURIComponent(`urn:li:sponsoredAccount:${LI_ACCOUNT}`)})&fields=costInLocalCurrency,dateRange,pivotValues`;
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
    const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.META_PIXEL_ID || '658905286613269'}/events?access_token=${encodeURIComponent(token)}`,
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

// Invites, round-ups and lead emails to invited firms go from BULK_FROM (alerts.loanleaf.co) when it's set, so cold-email
// complaints don't touch the reputation of loanleaf.co, which carries account and lead emails. Otherwise the usual address.
export const BULK_FROM = () => process.env.BULK_FROM || null;
export async function sendEmail(to, subject, html, replyTo, attachments, unsub, scheduledAt, retry = true, from = null) {
  if (!process.env.RESEND_API_KEY || !to?.length) return false;
  if (retry) { const blocked = await suppressedSet(to); if (blocked.size) to = to.filter((e) => !blocked.has(String(e).trim().toLowerCase())); if (!to.length) return 'suppressed'; }
  await resendSlot();
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: from || `Loanleaf <${process.env.ENQUIRY_FROM || 'onboarding@resend.dev'}>`, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}), ...(attachments ? { attachments } : {}), ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
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
<tr><td align="center" style="padding:0 0 28px">${showNav ? `<a href="${PLATFORM_URL}/dashboard"><img src="https://loanleaf.co/assets/Loanleaf_Logo_Deep_Green_PNG_500x100_72DPI.png" width="140" height="28" alt="Loanleaf" style="display:block;border:0"></a>` : `<img src="https://loanleaf.co/assets/Loanleaf_Logo_Deep_Green_PNG_500x100_72DPI.png" width="140" height="28" alt="Loanleaf" style="display:block;border:0">`}</td></tr>
<tr><td class="ll-body" style="background:#ffffff;border:1px solid ${LINE};padding:44px 40px 34px">
<h1 style="${F}margin:0 0 22px;font-size:26px;line-height:1.25;font-weight:bold;color:${INK}">${esc(title)}</h1>
${greeting ? p(greeting) : ''}${intro ? p(intro) : ''}${html}
${panelHtml}
${steps.length ? `${h2(stepsTitle || 'What happens next')}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px">${steps.map(step).join('')}</table>` : ''}
${tips.length ? `${tipsTitle ? h2(tipsTitle) : ''}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px">${tips.map(tip).join('')}</table>` : ''}
${cta && !panel ? button(cta, false) : ''}${after}
${link ? p(`<a href="${esc(link.url)}" style="color:${G};font-weight:bold">${esc(link.label)}</a>`, 'margin:-4px 0 24px;font-size:14px') : ''}
${note ? `<p style="${F}margin:0 0 24px;padding:15px 18px;background:${SOFT};border:1px solid ${LINE};font-size:13px;line-height:1.6;color:${MUTED}">${note}</p>` : ''}
${signoff ? p(`${signoff === true ? 'Best regards,' : signoff}<br><b style="color:${INK}">The Loanleaf team</b>`, 'margin:8px 0 0') : ''}
<div style="border-top:1px solid ${LINE};margin:30px 0 0;padding:20px 0 0;${F}font-size:14px;line-height:1.6;color:${MUTED}"><b style="color:${INK}">Need a hand?</b> Reply to this email${showNav ? ` or write to <a href="mailto:hello@loanleaf.co" style="color:${G}">hello@loanleaf.co</a>` : ''} and the team will get back to you.</div>
</td></tr>
${showNav ? `<tr><td align="center" style="${F}padding:26px 24px 6px;font-size:13px;color:${MUTED}">${nav}</td></tr>` : '<tr><td style="padding:16px 0 0"></td></tr>'}
<tr><td align="center" style="padding:14px 24px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px"><tr><td align="center" style="${F}font-size:12px;line-height:1.6;color:#86998f">
<p style="margin:0 0 12px">${footer || `You're receiving this because your firm has a Loanleaf Platform account. Change which emails you get under <a href="${PLATFORM_URL}/notifications" style="color:#86998f">Notifications</a>.`}</p>
<p style="margin:0 0 12px">Loanleaf is a trading name of Vertical Brands Ltd, company number 14254961<br>20-22 Wenlock Road, London N1 7GU</p>
${showNav ? `<p style="margin:0"><a href="https://loanleaf.co/privacy-policy" style="color:${G};text-decoration:none;font-weight:bold">Privacy Policy</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="https://loanleaf.co/terms-conditions" style="color:${G};text-decoration:none;font-weight:bold">Terms of Service</a></p>` : ''}
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
  const from = fromOverride || `Loanleaf <${process.env.ENQUIRY_FROM || 'onboarding@resend.dev'}>`;
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
  await notify([b.email], `Your Loanleaf credits are running low (${after} left)`, {
    title: 'Your credits are running low',
    preheader: `${after} credits left. Top up your plan so you don't miss matching leads.`,
    intro: `${esc(b.company)} has dropped below ${LOW_CREDITS} credits. Leads cost between ${onTiers(b) ? `${DEFAULT_TIER_PRICES.Bronze} and ${DEFAULT_TIER_PRICES['Platinum+']}` : `${DEFAULT_PRICING.min} and ${DEFAULT_PRICING.max}`} credits each, so some of the leads that match your criteria may now be out of reach${b.mode === 'auto' ? ', and auto-buy will skip any lead you can’t afford' : ''}.`,
    highlight: { value: `${after.toLocaleString('en-GB')} credits`, label: 'left on your account' },
    tipsTitle: 'Your options',
    tips: ['<b>Upgrade your plan.</b> The new plan starts today and its credits are added straight away.',
      '<b>Wait for your renewal.</b> Your plan adds its monthly credits automatically on your renewal date.',
      '<b>Tighten your criteria.</b> If you’d rather spend less, set a lower maximum per lead under Auto-buy.'],
    cta: { label: 'Upgrade your plan', url: `${PLATFORM_URL}/billing` },
    link: { label: 'Review auto-buy settings', url: `${PLATFORM_URL}/autobuy` } });
}
const table = (rows) => `<table style="border-collapse:collapse;font-family:Arial,sans-serif">${rows.map(([k, v]) =>
  `<tr><td style="padding:6px 12px;color:#579e84">${k}</td><td style="padding:6px 12px;font-weight:700;color:#244237">${esc(v) || '–'}</td></tr>`).join('')}</table>`;
const leadRows = (l) => [['Amount', gbp(l.amount)], ['Purpose', l.purpose], ['Needed', l.timeline], ['Structure', l.structure], ['Annual revenue', l.turnover],
  ['Trading for', l.trading], ['Homeowner or tenant', l.property], ['Missed payments / CCJs', creditShown(l.credit)], ['Existing finance', l.debt], ['Left to repay', l.debt_left], ['Monthly repayments', l.debt_monthly]];
// Where emails go: alerts (new matching lead) and delivery (a bought lead) have their own lists; both fall back to the account email.
export const recipients = (b, kind = 'deliver') => String((kind === 'alert' ? b.notify_emails : b.deliver_emails) || b.email).split(/[,;\s]+/).filter((e) => /@/.test(e)).slice(0, 10);
export const webhooksOf = (b) => (b.webhook_urls?.length ? b.webhook_urls : b.webhook_url ? [b.webhook_url] : []).slice(0, 5);

// Clean lead object for CRMs (webhook body) and the portal.
export const leadOut = (l) => ({
  id: l.id, received_at: l.created_at, purchased_at: l.bought_at, auto_bought: l.auto, price_credits: l.price, tier: l.tier || null,
  business: l.business, company_number: l.company?.number || null, director_listed: l.company ? !!l.company.directorListed : null, contact_name: l.full_name, email: l.email, phone: l.phone,
  amount: l.amount, purpose: l.purpose, timeline: l.timeline, structure: l.structure, annual_revenue: l.turnover,
  trading_for: l.trading, property: l.property || null, adverse_credit: l.credit, existing_finance: l.debt, left_to_repay: l.debt_left, monthly_repayments: l.debt_monthly,
  quality: quality(l), stage: l.stage, stage_at: l.stage_at, funded_amount: l.funded_amount, archived_at: l.archived_at || null, companies_house: companyInfo(l.company, true),
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
// With a signing secret: X-Loanleaf-Timestamp (unix seconds) and X-Loanleaf-Signature: t=<timestamp>,v1=<hex HMAC-SHA256 of "<timestamp>.<raw body>">.
export const signWebhook = (secret, body, t = Math.floor(Date.now() / 1000)) => ({ 'X-Loanleaf-Timestamp': String(t), 'X-Loanleaf-Signature': `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}` });
export async function postWebhook(url, payload, secret) {
  if (!(await safeWebhookUrl(url))) return 'blocked: not a public https address';
  try {
    const body = JSON.stringify(payload);
    const r = await fetch(url, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Loanleaf-Platform', ...(secret ? signWebhook(secret, body) : {}) }, body, signal: AbortSignal.timeout(5000) });
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
const leadLines = (o) => [['Loanleaf lead', `#${o.id}${o.test ? ' (test)' : ''}`], ['Loan amount', o.amount != null ? gbp(o.amount) : ''], ['Purpose', o.purpose], ['Needed', o.timeline], ['Business type', o.structure],
    ['Company number', o.company_number], ['Annual revenue', o.annual_revenue], ['Trading for', o.trading_for], ['Homeowner or tenant', o.property], ['Missed payments / CCJs', creditShown(o.adverse_credit)],
    ['Existing finance', o.existing_finance], ['Left to repay', o.left_to_repay], ['Monthly repayments', o.monthly_repayments], ['Quality score', o.quality], ['Credits used', o.price_credits]].filter(([, v]) => v != null && v !== '');
export const hubspotFields = (o) => {
  const [first, ...rest] = String(o.contact_name || '').trim().split(/\s+/);
  const lines = leadLines(o);
  return [['email', o.email], ['firstname', first], ['lastname', rest.join(' ')], ['phone', o.phone], ['company', o.business],
    ['message', lines.map(([k, v]) => `${k}: ${v}`).join('\n')]].filter(([, v]) => v).map(([name, value]) => ({ name, value: String(value) }));
};
export async function postHubspot(h, o) {
  if (!h?.portal || !h?.form) return 'not set up';
  const host = h.region ? `api-${h.region}.hsforms.com` : 'api.hsforms.com';
  try {
    const r = await fetch(`https://${host}/submissions/v3/integration/submit/${h.portal}/${h.form}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: hubspotFields(o), context: { pageName: 'Loanleaf lead', pageUri: 'https://platform.loanleaf.co/leads' } }), signal: AbortSignal.timeout(8000) });
    if (r.ok) return 'ok';
    const j = await r.json().catch(() => ({}));
    return (j.errors || []).map((e) => e.message).filter(Boolean).join('; ').slice(0, 300) || j.message || `HTTP ${r.status}`;
  } catch (e) { return e.name === 'TimeoutError' ? 'timed out' : 'failed'; }
}

// Pipedrive: the partner pastes their personal API token (Settings → Personal preferences → API). Each bought lead
// becomes an organisation, a person, a deal (value = loan amount) and a note on the deal with everything else.
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
    const org_id = o.business ? await call('organizations', { name: o.business }) : undefined;
    const person_id = await call('persons', { name: o.contact_name || o.email || 'Loanleaf lead', org_id,
      ...(o.email ? { email: [{ value: o.email, primary: true, label: 'work' }] } : {}), ...(o.phone ? { phone: [{ value: o.phone, primary: true, label: 'work' }] } : {}) });
    const deal_id = await call('deals', { title: `${o.business || o.contact_name} – ${gbp(o.amount)}${o.test ? ' (test)' : ''}`, value: o.amount || 0, currency: 'GBP', person_id, org_id });
    await call('notes', { deal_id, content: leadLines(o).map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`).join('<br>') });
    return 'ok';
  } catch (e) { return e.name === 'TimeoutError' ? 'timed out' : e.message || 'failed'; }
}

// Send a purchased lead to the broker: email + their CRM webhook. Never throws.
export async function deliver(b, l) {
  const tasks = [b.deliver_on === false ? null : notify(recipients(b), `New lead: ${l.business} – ${gbp(l.amount)}`, {
    title: `New lead: ${l.business}`,
    preheader: `${gbp(l.amount)} for ${String(l.purpose || 'business finance').toLowerCase()}. ${l.full_name} is expecting your call.`,
    intro: `${l.auto ? 'Auto-buy has picked up' : 'You’ve bought'} lead #${l.id}. <b>${esc(l.full_name)}</b> at ${esc(l.business)} asked to be contacted about business finance and is expecting a call from a broker. The lead is yours alone: nobody else can buy it.`,
    highlight: { value: gbp(l.amount), label: `${l.purpose || 'Business finance'} · needed ${String(l.timeline || '').toLowerCase() || 'soon'}` },
    rowsTitle: 'Contact details', rows: [['Business', l.business], ...(l.company?.number ? [['Company number', l.company.number]] : []), ['Name', l.full_name + (l.company?.directorListed ? ` (listed ${l.company.role === 'Secretary' ? 'company secretary' : 'director'})` : '')], ...(dobLabel(l.company?.directorDob) ? [['Date of birth', dobLabel(l.company.directorDob)]] : []), ['Mobile', l.phone], ['Email', l.email]],
    stepsTitle: 'Make the most of it',
    steps: [['Call within the hour', 'Leads called quickly convert far better. They have just told us what they need and are often still at their desk.'],
      ['Confirm the basics', 'Check the business, the amount and what it’s for, then qualify anything the form doesn’t ask, such as sector, card takings or security.'],
      ['Update the stage', 'Move the lead through New, Contacted, Application and Funded on the platform so you can see what converts.']],
    tipsTitle: 'What they told us', tips: [...leadRows(l), ['Credits used', l.price]].filter(([, v]) => v != null && v !== '').map(([k, v]) => `${esc(k)}: <b>${esc(v)}</b>`),
    cta: { label: 'Open lead on the platform', url: `${PLATFORM_URL}/leads` },
    ...(l.company?.number ? { link: { label: `View ${l.business} on Companies House`, url: chUrl(l.company.number) } } : {}),
    note: `If the phone number is not in service or belongs to someone else, or the email address doesn’t exist, you can request a refund on the platform within 72 hours. Reply to this email to contact ${esc(l.full_name)} directly.`, replyTo: l.email })];
  tasks.push(matchedEmail(b, l), matchedMessage(b, l));
  if (b.webhook_on !== false) for (const u of webhooksOf(b)) tasks.push(postWebhook(u, { event: 'lead.purchased', lead: leadOut(l) }, b.webhook_secret).then((s) => console.log('webhook', b.id, new URL(u).hostname, s)));
  if (b.hubspot?.on !== false && b.hubspot?.form) tasks.push(postHubspot(b.hubspot, leadOut(l)).then((s) => console.log('hubspot', b.id, s)));
  if (b.pipedrive?.on !== false && b.pipedrive?.token) tasks.push(postPipedrive(b.pipedrive, leadOut(l)).then((s) => console.log('pipedrive', b.id, s)));
  await Promise.allSettled(tasks.filter(Boolean));
}

// ---------------------------------------------------------------- new enquiry → platform
// Stores the lead, auto-buys it for the first matching broker (fair rotation: whoever auto-bought longest ago),
// otherwise emails matching manual-mode brokers that a new opportunity is live.
// PostgREST value quoted, so commas or brackets in user input can't change the filter.
// "Checked for you" lines in new-lead emails: contact details masked as on Opportunities (raw values only after purchase),
// plus what our live checks and Companies House confirmed. Nothing that names the business.
export function checkTips(l) {
  const m = maskContact(l), c = l.checks || {}, ch = companyInfo(l.company, false), ok = (t) => `<b style="color:#1f8a55">&#10003;</b> ${t}`, no = (t) => `<b style="color:#b26a00">!</b> ${t}`;
  const tips = [];
  if (m.name) tips.push(`Contact: <b>${esc(m.name)}</b>`);
  if (m.phone) tips.push(c.phone?.reachable === false ? no(`Mobile <b>${esc(m.phone)}</b>: switched off when checked, the applicant confirmed it's right`) : ok(`Mobile <b>${esc(m.phone)}</b>: checked`));
  if (m.email) tips.push(ok(`Email <b>${esc(m.email)}</b>: checked`));
  if (ch) {
    tips.push(ok(`Verified on Companies House: ${esc(ch.status ? `${ch.status[0].toUpperCase()}${ch.status.slice(1)} ` : '')}${esc((ch.type || 'company').toLowerCase())}${ch.incorporated ? `, incorporated ${esc(ch.incorporated)}` : ''}${ch.locality ? `, registered in ${esc(ch.locality)}` : ''}`));
    if (ch.industries.length) tips.push(`Industry: <b>${esc(ch.industries.join(', '))}</b>`);
    if (ch.director_listed) tips.push(ok(`Applicant is a listed ${ch.listed_as}`));
    if (ch.checked) tips.push(ch.accounts_overdue || ch.confirmation_overdue ? no('Filings overdue at Companies House') : ok('Filings up to date'),
      ch.insolvency_history ? no('Has insolvency history') : ok('No insolvency history'));
  } else tips.push('Company typed in by hand, not matched on Companies House');
  return tips;
}
// For people who haven't signed up (invited firms): only what was verified, no contact details, place or industry.
export function inviteCheckTips(l) {
  const c = l.checks || {}, ch = companyInfo(l.company, false), ok = (t) => `<b style="color:#1f8a55">&#10003;</b> ${t}`, tips = [];
  if (c.phone?.reachable === true || c.phone?.allocated === true) tips.push(ok('Phone number verified'));
  if (c.email?.result === 'valid') tips.push(ok('Email address verified'));
  if (ch) { tips.push(ok(`Verified on Companies House${ch.incorporated ? `, trading since ${String(ch.incorporated).slice(0, 4)}` : ''}`));
    if (ch.director_listed) tips.push(ok(`Applicant is a listed ${ch.listed_as}`));
    if (ch.checked && !ch.insolvency_history) tips.push(ok('No insolvency history')); }
  return tips;
}
const q = (v) => encodeURIComponent(`"${String(v ?? '').replace(/["\\]/g, '')}"`);
// Same phone or email in the last 7 days = a repeat enquiry: not sold again, and no new Meta conversion.
// After 7 days it's a new lead, but never for a broker who bought this business before (exclude_brokers).
export const REPEAT_DAYS = 7;
export async function duplicateOf(b) {
  const since = new Date(Date.now() - REPEAT_DAYS * 864e5).toISOString();
  const dupe = await db(`leads?created_at=gte.${since}&or=(phone.eq.${q(b.phone)},email.eq.${q(String(b.email).toLowerCase())})&select=id&order=created_at.desc&limit=1`);
  return dupe[0]?.id || null;
}
// A repeat enquiry (within REPEAT_DAYS) from a business already matched: remind the business who its broker is (with a
// link to be matched with someone else instead), and tell the broker they've followed up. At most once a day per lead.
export async function followUp(id, b) {
  const [l] = await db(`leads?id=eq.${id}&select=*`);
  if (!l?.buyer) return {};
  const [x] = await db(`brokers?id=eq.${l.buyer}&select=*`);
  if (!x) return {};
  const rematch = signedUrl('rematch', l.id, REPEAT_DAYS); // only offered on a repeat within 7 days, and only usable for 7 days
  if (await allow(`followup:${l.id}`, 86400, 1)) {
    const bits = [b.amount && Number(String(b.amount).replace(/[^\d]/g, '')) !== l.amount ? ['Amount this time', gbp(Number(String(b.amount).replace(/[^\d]/g, '')))] : null,
      b.purpose && b.purpose !== l.purpose ? ['Purpose this time', b.purpose] : null, b.timeline && b.timeline !== l.timeline ? ['Needed this time', b.timeline] : null].filter(Boolean);
    await Promise.allSettled([
      notify([l.email], `You've already been matched with ${publicProfile(x).company}`, matchedOpts(x, l, rematch)),
      notify(recipients(x), `${l.business} has followed up: lead #${l.id}`, {
        title: `${l.business} has been in touch again`,
        preheader: `${l.full_name} sent another enquiry. A good moment to call.`,
        greeting: `Hello ${esc(x.company)},`,
        intro: `<b>${esc(l.full_name)}</b> at ${esc(l.business)}, lead #${l.id} which you have from ${new Date(l.bought_at || l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'Europe/London' })}, has just sent another enquiry through Loanleaf. We've reminded them that you're their broker and sent them your details again. They're still looking, so now is a good time to call.`,
        rowsTitle: 'Contact details', rows: [['Business', l.business], ['Name', l.full_name], ['Mobile', l.phone], ['Email', l.email], ...bits],
        cta: { label: 'Open lead on the platform', url: `${PLATFORM_URL}/leads` },
        note: `This doesn't use any credits. Reply to this email to contact ${esc(l.full_name)} directly.`, replyTo: l.email }),
    ]);
  }
  return { match: publicProfile(x), again: true, rematch };
}
// "Match me with a different broker" (from the follow-up email or thank-you page): a new lead with the same details,
// never offered to any broker who had this business before. Once per lead.
export async function rematchLead(id) {
  const [l] = await db(`leads?id=eq.${id}&select=*`);
  if (!l?.buyer) return { error: 'gone' };
  const done = await db(`leads?source->>rematch_of=eq.${l.id}&select=id&limit=1`);
  if (done.length) return { error: 'done' };
  const s = l.source || {};
  return ingestLead({ amount: l.amount, purpose: l.purpose, timeline: l.timeline, structure: l.structure, turnover: l.turnover, trading: l.trading, credit: l.credit, property: l.property,
    debt: l.debt, debtLeft: l.debt_left, debtMonthly: l.debt_monthly, business: l.business, fullName: l.full_name, email: l.email, phone: l.phone,
    consentAt: l.consent?.at, consentVersion: l.consent?.version, consentText: l.consent?.text, page: s.page, referrer: s.referrer, utm: s.utm, variant: s.landing_variant,
    premium: s.premium_tier, checks: l.checks, company: l.company, rematchOf: l.id });
}
// First page of the visit (nav.js ll_src: utm_*, click IDs, external referrer, landing path), kept to known keys and short strings.
const FIRST_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'li_fat_id', 'referrer', 'landing'];
export const firstTouch = (f) => { if (!f || typeof f !== 'object') return null;
  const o = Object.fromEntries(FIRST_KEYS.filter((k) => typeof f[k] === 'string' && f[k]).map((k) => [k, f[k].slice(0, 200)])); return Object.keys(o).length ? o : null; };
// Smaller or newer businesses: under £50k revenue or under 6 months trading. Accepted from homeowners and tenants, and sent straight to Aureum Finance (Daniel McCaffrey, commission client) free of charge:
// not sold or offered to other brokers. Falls back to the normal flow if that account can't take it.
export const STARTER_BROKER = '76efaa60-7aa5-4e71-84b7-922b8ffa09d0';
export const UNDER6 = 'Under 6 months';
export const isStarter = (l) => l.turnover === 'Under £50k' || l.trading === UNDER6;
// Homeowners trading under 6 months with £250k+ revenue skip Aureum and go on the marketplace (auto-buy or manual buy).
export const starterToMarket = (l) => l.trading === UNDER6 && l.property === 'Homeowner' && REVENUE_MID[l.turnover] >= 250000;
// Counted as a Lead on Meta/LinkedIn: everything except smaller/newer businesses, though under 6 months still counts for a homeowner or £100k+ revenue.
export const countsAsLead = (l) => !isStarter(l) || (l.trading === UNDER6 && (l.property === 'Homeowner' || REVENUE_MID[l.turnover] >= 100000));
export async function ingestLead(b) {
  const amount = Number(String(b.amount || '').replace(/[^\d]/g, '')) || 0;
  const row = {
    amount, purpose: b.purpose, timeline: b.timeline, structure: b.structure, turnover: b.turnover, trading: b.trading, credit: b.credit, property: PROPERTY.includes(b.property) ? b.property : null,
    debt: b.debt, debt_left: b.debtLeft || null, debt_monthly: b.debtMonthly || null,
    business: b.business, full_name: b.fullName, email: b.email, phone: b.phone,
    consent: { at: b.consentAt, version: b.consentVersion, text: b.consentText },
    source: { page: b.page, referrer: b.referrer, utm: b.utm || {}, landing_variant: b.variant || null, premium_tier: !!b.premium, ...(b.rematchOf ? { rematch_of: b.rematchOf } : {}), ...(firstTouch(b.first) ? { first: firstTouch(b.first) } : {}) }, // premium_tier: £500k+ revenue; first: where the visit started (nav.js)
    checks: b.checks || null,
    company: b.company || null,
  };
  const dupeOf = b.rematchOf ? null : await duplicateOf(b);
  if (dupeOf) return { duplicateOf: dupeOf, ...(await followUp(dupeOf, b)) }; // repeat enquiry: not sold again
  row.email = String(row.email || '').toLowerCase();
  row.exclude_brokers = [...new Set((await db(`leads?buyer=not.is.null&or=(phone.eq.${q(b.phone)},email.eq.${q(row.email)})&select=buyer&limit=200`)).map((l) => l.buyer).filter(Boolean))];
  row.price = price(row, await getPricing());
  const [lead] = await db('leads', { method: 'POST', body: row, prefer: 'return=representation' });
  const before = new Set(lead.exclude_brokers || row.exclude_brokers); // bought this business before: never offered it again
  if (isStarter(lead) && !starterToMarket(lead) && !before.has(STARTER_BROKER)) {
    const [d] = await db(`brokers?id=eq.${STARTER_BROKER}&approved=eq.true&suspended_at=is.null&select=*`).catch(() => []);
    const done = d && await db(`leads?id=eq.${lead.id}&buyer=is.null`, { method: 'PATCH', body: { buyer: d.id, bought_at: new Date().toISOString(), auto: true }, prefer: 'return=representation' }).catch(() => null);
    if (done?.length) {
      await db('ledger', { method: 'POST', body: { broker: d.id, delta: 0, reason: 'Lead assigned by Loanleaf (no charge)', lead_id: lead.id } }).catch(() => {});
      await Promise.allSettled([deliver(d, done[0])]);
      return { id: lead.id, price: 0, buyer: d.id, match: publicProfile(d) };
    }
  }
  const brokers = (await db('brokers?approved=eq.true&suspended_at=is.null&select=*')).filter((x) => !before.has(x.id));

  const cost = (x) => asPriced(lead, x).price; // what this broker pays: tier price or the original price
  const underMax = (x) => onTiers(x) || !x.filters?.maxPrice || lead.price <= x.filters.maxPrice; // pricier leads are left for manual buying
  // Never auto-buy a lead whose contact details failed the live checks, even if the applicant said they were right.
  const c = lead.checks || {}, doubtful = c.phone?.allocated === false || c.phone?.reachable === false || c.email?.result === 'undeliverable';
  const agreed = new Set(doubtful ? [] : [...(await db(`agreements?select=broker&broker=in.(${brokers.map((x) => x.id).join(',') || '00000000-0000-0000-0000-000000000000'})`)).map((a) => a.broker), ...(await waivedIds())]);
  const auto = doubtful ? [] : brokers.filter((x) => x.mode === 'auto' && agreed.has(x.id) && cost(x) != null && x.credits >= cost(x) && matches(critOf(x), lead) && underMax(x))
    .sort((x, y) => (x.last_auto_at || '').localeCompare(y.last_auto_at || ''));
  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0); // ponytail: UTC day; switch to Europe/London midnight if brokers notice the hour offset in summer
  for (const x of auto) {
    const p = cost(x);
    if (x.monthly_cap && (await rpc('auto_spend_this_month', { p_broker: x.id })) + p > x.monthly_cap) continue;
    const f = x.filters || {};
    let tier = null;
    if (onTiers(x)) { // each tier has its own monthly auto-buy budget
      const budget = tierPlanOf(x)[lead.tier]?.credits || 0;
      if (!budget || (await tierSpendOf(x, lead.tier)) + p > budget) continue;
    } else if (f.tiers?.length) { // first matching tier with budget left this month
      const spent = await tierSpend(x);
      tier = tierMatches(f, lead).find((i) => spent[i] + lead.price <= Math.floor((x.monthly_cap * (f.tiers[i].share || 0)) / 100));
      if (tier == null) continue;
    }
    if (!onTiers(x) && (f.dailyLeads || f.dailyCredits)) {
      const today = await db(`ledger?broker=eq.${x.id}&reason=eq.Auto-bought%20lead&created_at=gte.${dayStart.toISOString()}&select=delta`);
      if (f.dailyLeads && today.length >= f.dailyLeads) continue;
      if (f.dailyCredits && -today.reduce((a, r) => a + r.delta, 0) + lead.price > f.dailyCredits) continue;
    }
    if (await rpc('buy_lead', { p_lead: lead.id, p_broker: x.id, p_auto: true })) {
      if (tier != null) await db(`leads?id=eq.${lead.id}`, { method: 'PATCH', body: { auto_tier: tier } }).catch(() => {});
      await Promise.allSettled([deliver(x, { ...lead, price: p, bought_at: new Date().toISOString(), auto: true }), lowCredits(x, x.credits, x.credits - p), inviteLeadAlerts(lead, true)]);
      return { id: lead.id, price: p, buyer: x.id, match: publicProfile(x) };
    }
  }
  const fans = brokers.filter((x) => x.notify && cost(x) != null && matches(critOf(x), lead) && (x.mode === 'manual' || !underMax(x)));
  const ch = companyInfo(lead.company, false);
  const when = new Date(lead.created_at || Date.now()).toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
  await Promise.allSettled(fans.map((x) => { const unsub = signedUrl('alerts-off', x.id, 365), cr = `${cost(x)} credits${onTiers(x) ? ` · ${lead.tier}` : ''}`; return notify(recipients(x, 'alert'), `New lead: ${gbp(lead.amount)} for ${String(lead.purpose || 'business finance').toLowerCase()} (${cr})`, {
    title: 'A new lead fits your criteria', preheader: `${gbp(lead.amount)} for ${String(lead.purpose || 'business finance').toLowerCase()}, ${cr}. Exclusive to the first broker who buys it.`,
    greeting: `Hello ${esc(x.company)},`,
    intro: 'A business has just asked for finance that fits what you’re looking for. Each lead is sold to one broker only, so once someone buys it, it’s gone.',
    highlight: { value: `${gbp(lead.amount)} for ${String(lead.purpose || 'business finance').toLowerCase()}`, label: `Received ${when} · ${cr}` },
    rows: leadRows(lead).filter(([k, v]) => v != null && v !== '' && k !== 'Amount' && k !== 'Purpose'),
    tipsTitle: 'Checked for you', tips: checkTips(lead),
    cta: { label: 'View this lead', url: `${PLATFORM_URL}/opportunities` },
    note: `Full contact details and the company name unlock the moment you buy.${ch ? ' Company details come from Companies House.' : ''} Want leads like this bought for you automatically? <a href="${PLATFORM_URL}/autobuy" style="color:#244237">Set up auto-buy</a>.`,
    unsub, footer: `You're receiving this because ${esc(x.company)} has new-lead emails switched on in Loanleaf Platform. <a href="${unsub}" style="color:#86998f">Unsubscribe from new-lead emails</a> or change them under <a href="${PLATFORM_URL}/notifications" style="color:#86998f">Notifications</a>.` }); }));
  // Leads outside a broker's criteria: suggested anyway, saying so, to brokers who want them straight away.
  await Promise.allSettled(brokers.filter((x) => suggestMode(x) === 'instant' && cost(x) != null && !matches(critOf(x), lead)).map((x) => suggest(x, [lead])));
  // Invited firms who haven't signed up yet: same lead, but the button finishes their signup.
  const invited = await inviteLeadAlerts(lead, false);
  return { id: lead.id, price: lead.price, buyer: null, alerted: fans.length, invited };
}

// Every new lead to invited firms on "every new lead" (not the weekly round-up), including ones auto-matched to a broker
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
export async function inviteLeadAlerts(lead, matched) {
  if (!unmatchedOk(lead)) return 0;
  try {
    const iso = new Date().toISOString();
    const people = await notJoined(await db(`invites?alerts=eq.true&digest=is.false&expires_at=gt.${iso}&and=(or(email_id.is.null,email_id.not.in.(queued,paused,accepted)),or(send_at.is.null,send_at.lte.${iso}))&select=*&order=email.asc&limit=20000`));
    if (!people.length) return 0;
    const keys = people.map((v) => `invlead:${v.email}`), used = {};
    for (let i = 0; i < keys.length; i += 200) for (const r of await db(`rate_events?key=in.(${keys.slice(i, i + 200).map((k) => encodeURIComponent(`"${k}"`)).join(',')})&at=gt.${new Date(Date.now() - 864e5).toISOString()}&select=key&limit=20000`)) used[r.key] = (used[r.key] || 0) + 1;
    const due = people.filter((v) => (used[`invlead:${v.email}`] || 0) < INVITE_DAILY);
    if (!due.length) return 0;
    const what = `${gbp(lead.amount)} for ${String(lead.purpose || 'business finance').toLowerCase()}`;
    const when = new Date(lead.created_at || Date.now()).toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
    const sent = await sendBatch(due.map((v) => ({ to: [v.email], subject: matched ? `Matched in seconds: ${what}` : `New lead: ${what} (${lead.price} credits)`, opts: {
      title: matched ? 'This lead was matched within seconds' : 'A new lead has just come in',
      preheader: matched ? `${what}. It went straight to a broker whose criteria it fitted. Set yours up so the next one comes to you.` : `${what}. Finish setting up your account to buy leads like this.`,
      greeting: `Hi ${esc(String(v.name || '').split(' ')[0] || 'there')},`,
      intro: matched
        ? `A business has just asked for ${esc(what)}. It fitted a broker’s auto-buy criteria, so it went to them straight away, before anyone else saw it. Your account${v.company ? ` for <b>${esc(v.company)}</b>` : ''} is already approved: finish setting up and set your own criteria, and leads like this come to you instead.`
        : `A business has just asked for finance on Loanleaf. Your account${v.company ? ` for <b>${esc(v.company)}</b>` : ''} is already approved: finish setting up and you can buy leads like this one. Each lead is sold to one broker only.`,
      highlight: { value: what, label: matched ? `Received ${when} · matched to a broker within seconds` : `Received ${when} · ${lead.price} credits` },
      rows: leadRows(lead).filter(([k, val]) => val != null && val !== '' && k !== 'Amount' && k !== 'Purpose'),
      tipsTitle: 'Checked for you', ticks: true, tips: inviteCheckTips(lead).map((t) => t.replace(/^<b[^>]*>&#10003;<\/b> /, '')),
      cta: { label: matched ? 'Set up auto-buy' : 'Finish setting up', url: `${PLATFORM_URL}/signup?invite=${v.token}` },
      note: matched ? 'This lead is no longer available. Brokers with auto-buy switched on get first pick of every lead that fits their criteria.' : 'Contact details and the company name unlock when a broker buys the lead.',
      nav: false, replyTo: 'hello@loanleaf.co', unsub: `https://platform.loanleaf.co/api/platform?action=invite-stop&t=${encodeURIComponent(v.token)}`, footer: inviteFooter(v) } })), BULK_FROM());
    if (sent) await db('rate_events', { method: 'POST', body: due.map((v) => ({ key: `invlead:${v.email}` })) });
    return sent;
  } catch (e) { console.error('invite alerts', e.message); return 0; }
}

const inviteFooter = (v) => `You're receiving this because the Loanleaf team invited ${esc(v.email)} to join Loanleaf Platform. <a href="https://platform.loanleaf.co/api/platform?action=invite-stop&amp;t=${encodeURIComponent(v.token)}" style="color:#86998f">Unsubscribe from these emails</a>.`;

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
    db(`leads?buyer=is.null&hidden_at=is.null&turnover=neq.${encodeURIComponent('£50k to £100k')}&created_at=gte.${new Date(now - 7 * 864e5).toISOString()}&select=${PREVIEW}&order=price.desc&limit=6`),
  ]);
  people = await notJoined(people);
  await db('settings', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { key: 'invite_digest', value: { week, people: people.length, leads: fresh.length } } });
  if (!people.length || !fresh.length) return 0;
  const cards = fresh.map((l) => leadCard(l)).join('');
  return sendBatch(people.map((v) => ({ to: [v.email], subject: `${fresh.length} new lead${fresh.length === 1 ? '' : 's'} on Loanleaf this week`, opts: {
    title: 'This week’s leads on Loanleaf', preheader: `${fresh.length} lead${fresh.length === 1 ? ' is' : 's are'} still available. Finish setting up to buy.`,
    greeting: `Hi ${esc(String(v.name || '').split(' ')[0] || 'there')},`,
    intro: `Here are the best leads that came in on Loanleaf over the last week and are still available. Your account${v.company ? ` for <b>${esc(v.company)}</b>` : ''} is already approved: finish setting up and you can buy them. Each lead is sold to one broker only.`,
    html: cards, cta: { label: 'Finish setting up', url: `${PLATFORM_URL}/signup?invite=${v.token}` },
    note: 'Contact details and the company name unlock when a broker buys the lead.', replyTo: 'hello@loanleaf.co',
    nav: false, unsub: `https://platform.loanleaf.co/api/platform?action=invite-stop&t=${encodeURIComponent(v.token)}`, footer: inviteFooter(v) } })), BULK_FROM());
}

// Email version of an Opportunities card: purpose, time, amount, four facts, why it's outside the criteria, price.
// Tables and inline styles only (email clients), square corners like the other emails.
function leadCard(l, why = [], { plain = false } = {}) {
  const F = 'font-family:Arial,Helvetica,sans-serif;', s = salePrice(l), m = (Date.now() - new Date(l.created_at)) / 6e4;
  const ago = m < 60 ? `${Math.max(1, m | 0)} min ago` : m < 1440 ? `${(m / 60) | 0} hr ago` : `${(m / 1440) | 0} day${m < 2880 ? '' : 's'} ago`;
  const short = (n) => (n >= 1e6 ? `£${+(n / 1e6).toFixed(2)}m` : n >= 1e3 ? `£${Math.round(n / 1e3)}k` : gbp(n));
  const fact = (k, v) => `<td width="50%" style="${F}padding:9px 0 0;vertical-align:top"><div style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:#86998f">${k}</div><div style="margin-top:2px;font-size:14px;font-weight:bold;color:#14271f">${esc(v || '–')}</div></td>`;
  const credit = l.credit === 'Yes' ? 'Adverse' : l.credit === 'Not sure' ? '–' : 'Clean';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border:1px solid #dde5e1;border-collapse:collapse;background:#fff">
<tr><td style="${F}padding:16px 20px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="${F}font-size:14px;font-weight:bold;color:#244237">${esc(l.purpose || 'Business finance')}${plain ? '' : `<span style="font-weight:normal;color:#86998f"> · ${ago}</span>`}</td>
${s.discounted && !plain ? `<td align="right" style="${F}"><span style="display:inline-block;white-space:nowrap;padding:3px 8px;background:#ffa630;color:#14271f;font-size:11px;font-weight:bold">50% OFF</span></td>` : ''}</tr></table></td></tr>
<tr><td style="${F}padding:6px 20px 2px;font-size:30px;line-height:1.15;font-weight:bold;color:#14271f">${short(l.amount)}</td></tr>
<tr><td style="padding:0 20px 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${fact('Revenue', l.turnover)}${fact('Trading', l.trading)}</tr><tr>${fact('Needed', l.timeline)}${fact('Credit', credit)}</tr></table></td></tr>
${why.length ? `<tr><td style="${F}padding:10px 20px;background:#fff6e8;border-top:1px solid #f3e2c4;font-size:13px;line-height:1.5;color:#6b4a12"><b>Outside your criteria:</b> ${why.map(esc).join('; ')}</td></tr>` : ''}
${plain ? '' : `<tr><td style="padding:12px 20px;border-top:1px solid #dde5e1;background:#f7f9f8"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="${F}font-size:14px"><a href="${PLATFORM_URL}/opportunities" style="color:#244237;font-weight:bold">View lead</a></td>
<td align="right" style="${F}font-size:20px;font-weight:bold;color:#244237">${s.discounted ? `<s style="font-size:14px;font-weight:normal;color:#86998f">${s.list_price}</s> ` : ''}${s.price}<span style="font-size:12px;font-weight:normal;color:#62786f"> credits</span></td></tr></table></td></tr>`}
</table>`;
}
// "Recent enquiries" for cold invites: the three strongest verified leads from the last 3 weeks (revenue, time trading, clean
// credit, size; best of each purpose first), as three compact cards. Contact details are shown only as fixed dots: nothing real
// is in the email, not even a letter. Cached for 10 minutes.
let recentCache = { t: 0, html: '' };
export async function recentEnquiries() {
  if (Date.now() - recentCache.t < 6e5) return recentCache.html;
  const rows = await db(`leads?created_at=gte.${new Date(Date.now() - 21 * 864e5).toISOString()}&select=${PREVIEW},checks,company&order=created_at.desc&limit=200`).catch(() => []);
  const ok = (l) => ({ ch: !!l.company?.number, phone: l.checks?.phone?.reachable === true || l.checks?.phone?.allocated === true, email: l.checks?.email?.result === 'valid' });
  const score = (l) => { const v = ok(l); return TURNOVERS.indexOf(l.turnover) * 3 + TRADING.indexOf(l.trading) * 2 + (l.credit !== 'Yes' ? 4 : 0) + Math.min(Number(l.amount) || 0, 1e6) / 2e5 + (v.ch + v.phone + v.email) * 12; }; // fully verified leads first
  const ranked = rows.filter((l) => l.amount >= 25000 && TURNOVERS.indexOf(l.turnover) >= 1).sort((a, b) => score(b) - score(a)), pick = [];
  for (const l of ranked) if (pick.length < 3 && !pick.some((x) => x.purpose === l.purpose)) pick.push(l); // best of each purpose first
  for (const l of ranked) if (pick.length < 3 && !pick.includes(l)) pick.push(l); // then the best of the rest
  const F = 'font-family:Arial,Helvetica,sans-serif;', short = (n) => (n >= 1e6 ? `£${+(n / 1e6).toFixed(2)}m` : `£${Math.round(n / 1e3)}k`);
  const tick = (on, label, masked) => `<tr><td style="${F}padding:7px 0 0;font-size:12px;line-height:1.35;color:#2b3f36"><span style="color:${on ? '#1f8f4e' : '#a7b5ae'};font-weight:bold">${on ? '&#10003;' : '&#8211;'}</span>&nbsp;${label}<br><span style="color:#a7b5ae;letter-spacing:1px">${masked}</span></td></tr>`;
  const card = (l) => { const v = ok(l), credit = l.credit === 'Yes' ? 'Adverse credit' : l.credit === 'Not sure' ? 'Credit –' : 'Clean credit';
    return `<!--[if mso]><td width="33%" valign="top" style="padding:0 5px"><![endif]--><div class="ll-card" style="display:inline-block;width:100%;max-width:166px;vertical-align:top;margin:0 3px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde5e1;background:#ffffff;border-collapse:collapse"><tr><td style="padding:14px 14px 13px;text-align:left">
<div class="ll-purpose" style="${F}height:26px;overflow:hidden;font-size:10px;line-height:13px;letter-spacing:.7px;text-transform:uppercase;font-weight:bold;color:#62786f">${esc(l.purpose || 'Business finance')}</div>
<div style="${F}margin-top:4px;font-size:26px;line-height:1.1;font-weight:bold;color:#14271f">${short(l.amount)}</div>
<div style="${F}margin-top:6px;font-size:12px;line-height:1.5;color:#2b3f36">${esc(l.turnover)} revenue<br>${esc(l.trading)} trading<br>${credit}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:9px;border-top:1px solid #edf1ef">
${tick(v.ch, 'Companies House', '&#9679;&#9679;&#9679;&#9679;&#9679;&#9679; LTD')}${tick(v.phone, 'Phone verified', '07&#9679;&#9679;&#9679; &#9679;&#9679;&#9679;&#9679;&#9679;&#9679;')}${tick(v.email, 'Email verified', '&#9679;&#9679;&#9679;&#9679;@&#9679;&#9679;&#9679;&#9679;&#9679;')}
</table></td></tr></table></div><!--[if mso]></td><![endif]-->`; };
  const html = pick.length ? `<h2 style="${F}margin:32px 0 4px;font-size:17px;line-height:1.3;font-weight:bold;color:#14271f">Recent enquiries</h2>
<p style="${F}margin:0 0 14px;font-size:14px;line-height:1.6;color:#62786f">Businesses that asked for finance on Loanleaf in the last few weeks. Contact details unlock when a broker buys the lead.</p>
<div class="ll-cards" style="text-align:center;font-size:0;margin:0 -3px"><!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><![endif]-->${pick.map(card).join('')}<!--[if mso]></tr></table><![endif]--></div>
<p style="${F}margin:6px 0 26px;text-align:center;font-size:15px"><a href="{{more}}" style="color:#244237;font-weight:bold;text-decoration:underline">View more opportunities &rarr;</a></p>` : ''; // {{more}}: each email fills in its own link
  recentCache = { t: Date.now(), html };
  return html;
}

// "Outside your criteria" email: one lead (instant) or several (daily summary). Says why each one doesn't fit.
export function suggest(b, leads) {
  leads = leads.filter(unmatchedOk).map((x) => asPriced(x, b));
  if (!leads.length) return Promise.resolve(null);
  const unsub = signedUrl('suggest-off', b.id, 365), one = leads.length === 1, l = leads[0];
  const what = (x) => `${gbp(x.amount)} for ${String(x.purpose || 'business finance').toLowerCase()}`;
  const cost = (x) => { const s = salePrice(x); return s.discounted ? `${s.price} credits (was ${s.list_price})` : `${s.price} credits`; };
  return notify(recipients(b, 'alert'), one ? `Outside your criteria: ${what(l)} (${cost(l)})` : `${leads.length} leads outside your criteria are still available`, {
    title: one ? 'A lead outside your criteria' : `${leads.length} leads outside your criteria`,
    preheader: one ? `${what(l)}. It doesn’t fit your settings, but it’s still available.` : 'They don’t fit your settings, but they’re still available to buy.',
    greeting: `Hello ${esc(b.company)},`,
    intro: one ? `This lead doesn’t fit the criteria in your settings, so ${b.mode === 'auto' ? 'auto-buy didn’t buy it and ' : ''}we wouldn’t normally send it. It might still be worth a look. Each lead is sold to one broker only.`
      : `These leads came in over the last day. They don’t fit the criteria in your settings, so ${b.mode === 'auto' ? 'auto-buy didn’t buy them, but' : ''} they might still be worth a look. Each lead is sold to one broker only.`,
    ...(one ? { highlight: { value: what(l), label: `Outside your criteria · ${cost(l)}` },
      rows: leadRows(l).filter(([k, v]) => v != null && v !== '' && k !== 'Amount' && k !== 'Purpose'),
      tipsTitle: 'Why it’s outside your criteria', tips: misses(critOf(b), l).map(esc) }
      : { html: `<p style="font-family:Arial,Helvetica,sans-serif;margin:26px 0 14px;font-size:16px;font-weight:bold;color:#14271f">Still available</p>${leads.slice(0, 10).map((x) => leadCard(x, misses(critOf(b), x))).join('')}${leads.length > 10 ? `<p style="font-family:Arial,Helvetica,sans-serif;margin:0 0 18px;font-size:14px;color:#62786f">And ${leads.length - 10} more on the platform.</p>` : ''}` }),
    cta: { label: one ? 'View this lead' : 'View leads', url: `${PLATFORM_URL}/opportunities` },
    note: `Not interested in leads like ${one ? 'this' : 'these'}? You can get them as a daily summary instead, or switch them off, under <a href="${PLATFORM_URL}/notifications" style="color:#244237">Notifications</a>.`,
    unsub, footer: `You're receiving this because ${esc(b.company)} gets emails about leads outside its criteria. <a href="${unsub}" style="color:#86998f">Unsubscribe from these emails</a> or change them under <a href="${PLATFORM_URL}/notifications" style="color:#86998f">Notifications</a>.` });
}
// Daily (cron-plans): unsold leads from the last day that sit outside each 'daily' broker's criteria.
export async function suggestDigest() {
  const since = new Date(Date.now() - 864e5).toISOString(), cut = new Date(Date.now() - 20 * 36e5).toISOString();
  const [brokers, leads] = await Promise.all([db('brokers?approved=eq.true&suspended_at=is.null&filters->>suggest=eq.daily&select=*'),
    db(`leads?buyer=is.null&hidden_at=is.null&created_at=gte.${since}&select=${PREVIEW},turnover,exclude_brokers&order=created_at.desc`)]);
  let sent = 0;
  for (const b of brokers) {
    if (missedEmailOn(b)) continue; // the missed-leads email covers these
    if (b.filters.digestAt > cut) continue; // already sent today (cron reruns)
    const list = leads.filter((l) => unmatchedOk(l) && !matches(critOf(b), l) && !excluded(l, b.id) && asPriced(l, b).price != null);
    if (!list.length) continue;
    await db(`brokers?id=eq.${b.id}`, { method: 'PATCH', body: { filters: { ...b.filters, digestAt: new Date().toISOString() } } });
    await suggest(b, list).then(() => sent++, (e) => console.error('digest', b.id, e.message));
  }
  return sent;
}

// Daily (cron-plans): to brokers with auto-buy on, the leads from the last day that auto-buy skipped because of their criteria,
// sold or not, and which criteria held them back. Nudges them to widen their criteria. Off with filters.missed = 'off'.
// They get this instead of the "outside your criteria" daily summary, which would repeat the unsold ones.
export const excluded = (l, id) => (l.exclude_brokers || []).includes(id); // bought this business before
export const missedEmailOn = (b) => b.mode === 'auto' && b.filters?.missed !== 'off';
export function missedEmail(b, leads) {
  const S = missedSummary(b, leads.filter(unmatchedOk)), n = S.missed.length, s = n === 1 ? '' : 's', F = 'font-family:Arial,Helvetica,sans-serif;';
  if (!n) return null;
  const unsub = signedUrl('missed-off', b.id, 365);
  return notify(recipients(b, 'alert'), `${n} lead${s} just outside your auto-buy criteria yesterday`, {
    title: `${n} lead${s} just outside your criteria`,
    preheader: 'Brokers with wider auto-buy criteria get first pick of more leads.',
    greeting: `Hello ${esc(b.company)},`,
    intro: `Over the last day, ${n === 1 ? 'a lead' : `${n} leads`} came in just outside the auto-buy criteria for <b>${esc(b.company)}</b>, so auto-buy let ${n === 1 ? 'it' : 'them'} pass.`,
    html: `<p style="${F}margin:0 0 18px;font-size:15px;line-height:1.65;color:#2b3f36">The brokers who do best on Loanleaf keep their auto-buy criteria wide. They get first pick of more leads, and because each lead goes to one broker only, the first to auto-buy it is the one who gets to call. Often a single setting makes the difference.</p>`,
    tipsTitle: 'What held them back', ticks: false,
    tips: S.groups.slice(0, 6).map((g) => `${esc(g.label)}: <b>${g.n} lead${g.n === 1 ? '' : 's'}</b>${g.only ? ` (allowing this alone would have picked up ${g.only === g.n ? (g.n === 1 ? 'it' : 'all of them') : g.only})` : ''}`),
    cta: { label: 'Widen auto-buy criteria', url: `${PLATFORM_URL}/autobuy` },
    // The best first: ranked by lead price (bigger, better-qualified businesses cost more), price itself never shown.
    after: `<p style="${F}margin:30px 0 14px;font-size:16px;font-weight:bold;color:#14271f">${n > 5 ? 'The best of them' : 'The leads'}</p>${[...S.missed].sort((x, y) => (y.l.price || 0) - (x.l.price || 0)).slice(0, 5).map((m) => leadCard(m.l, misses(critOf(b), m.l), { plain: true })).join('')}${n > 5 ? `<p style="${F}margin:0 0 18px;font-size:14px;color:#62786f">And ${n - 5} more.</p>` : ''}`,
    note: 'The Auto-buy page shows what your criteria let pass over the last 30 days, and lets you allow each one in a click.',
    unsub, footer: `You're receiving this because ${esc(b.company)} has auto-buy switched on. <a href="${unsub}" style="color:#86998f">Unsubscribe from these emails</a> or change them under <a href="${PLATFORM_URL}/notifications" style="color:#86998f">Notifications</a>.` });
}
export async function missedDigest() {
  const since = new Date(Date.now() - 864e5).toISOString(), cut = new Date(Date.now() - 20 * 36e5).toISOString();
  const [brokers, leads] = await Promise.all([db('brokers?approved=eq.true&suspended_at=is.null&mode=eq.auto&select=*'),
    db(`leads?created_at=gte.${since}&select=${PREVIEW},buyer,exclude_brokers&order=created_at.desc`)]);
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

// ---------------------------------------------------------------- public broker profile
// What a business sees about the broker it's matched with (confirmation page + "you've been matched" email).
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

// Ready-made first message from the business to its broker (WhatsApp, text and email buttons open with it filled in).
// Keep in step with matchMessage() in public/assets/apply.js.
export function matchMessage(m, l) {
  const hi = String(m.person || '').split(' ')[0] || m.company, amt = typeof l.amount === 'number' ? gbp(l.amount) : l.amount;
  const lines = [`Hi ${hi}, I found you through Loanleaf and was matched with you for business finance. Here's a quick summary:`, '',
    l.business && `Business: ${l.business}`, amt && `Looking for: ${amt}${l.purpose ? ` for ${String(l.purpose).toLowerCase()}` : ''}`,
    l.timeline && `Needed: ${l.timeline}`, l.turnover && `Annual revenue: ${l.turnover}`, l.trading && `Trading for: ${l.trading}`, '', `Thanks, ${l.full_name || ''}`.trim()];
  return lines.filter((x) => x !== false && x !== null && x !== undefined).join('\n');
}
const isMobile = (n) => /^(\+?44\s?7|07)/.test(String(n || '').replace(/[\s()-]/g, ''));
// The contact buttons, in order: Call, WhatsApp, Text, Email, Website.
export function contactActions(m, l) {
  const msg = matchMessage(m, l), enc = encodeURIComponent, text = 'sms' in m ? m.sms : isMobile(m.whatsapp) ? m.whatsapp : isMobile(m.phone) ? m.phone : null;
  return [m.phone && { k: 'call', label: 'Call', sub: m.phone, href: telLink(m.phone) },
    m.whatsapp && { k: 'whatsapp', label: 'WhatsApp', sub: 'Message on WhatsApp', href: `${waLink(m.whatsapp)}?text=${enc(msg)}` },
    text && { k: 'sms', label: 'Text', sub: text, href: `sms:${String(text).replace(/[^\d+]/g, '')}?&body=${enc(msg)}` },
    m.email && { k: 'email', label: 'Email', sub: m.email, href: `mailto:${m.email}?subject=${enc(`Business finance enquiry from ${l.business || l.full_name || 'Loanleaf'} (via Loanleaf)`)}&body=${enc(msg)}` },
    m.website && { k: 'web', label: 'Website', sub: siteLabel(m.website), href: m.website }].filter(Boolean);
}

// "You've been matched" email to the business, sent whenever a broker buys (or is given) its lead. Never throws.
// Logo shown at most 180×64 in emails; explicit width/height so Outlook doesn't blow it up to full size.
const logoFit = (p, W = 180, H = 64) => { const w = p.logoW || W, h = p.logoH || H, k = Math.min(W / w, H / h, 1); return [Math.round(w * k), Math.round(h * k)]; };
// "You've been matched" message to the business's phone, alongside the email. WhatsApp first (template loanleaf_matched,
// from BIRD_WA_FROM, once Meta approves it), otherwise a text from BIRD_SMS_FROM. Does nothing until one is set up. Never throws.
// Two templates: one for brokers whose profile shows a WhatsApp number (adds that line), one without. Meta templates can't
// have optional lines, so the choice is made per send.
export const MATCH_WA_TEMPLATE = 'loanleaf_matched_v2', MATCH_WA_TEMPLATE_WA = 'loanleaf_matched_wa';
// Companies House names arrive in capitals ("AUTOMOVER LOGISTICS LTD"): show them as "Automover Logistics Ltd".
export const niceBusiness = (n) => { const v = String(n || '').trim(); if (!v || v !== v.toUpperCase()) return v;
  return v.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\b(Llp|Plc|Uk|Cic)\b/g, (w) => w.toUpperCase()).replace(/\b(T\/a|And|Of|The)\b/g, (w, x, i) => (i ? w.toLowerCase() : w)); };
export function matchedText(b, l) {
  const m = publicProfile(b), first = String(l.full_name || '').trim().split(/\s+/)[0] || 'there', who = m.person ? m.person.split(' ')[0] : m.company;
  const reach = [m.phone && `Call: ${m.phone}`, m.whatsapp && `WhatsApp: ${m.whatsapp}`, m.email && `Email: ${m.email}`].filter(Boolean), biz = niceBusiness(l.business);
  return {
    sms: `Hi ${first}, thanks for your business finance enquiry with Loanleaf${biz ? ` for ${biz}` : ''}. We've matched you with ${m.company}, one of our recommended brokers, and ${who} will be in touch shortly about your ${gbp(l.amount)} request.${reach.length ? `\n\n${reach.join('\n')}` : ''}\n\nNo obligation to go ahead. Loanleaf`,
    template: m.whatsapp ? MATCH_WA_TEMPLATE_WA : MATCH_WA_TEMPLATE,
    wa: { first_name: first, business: biz || 'your business', broker: m.company, contact: m.person || 'Their team', amount: gbp(l.amount), phone: m.phone || m.whatsapp || 'in your email', email: m.email || 'in your email', ...(m.whatsapp ? { whatsapp: m.whatsapp } : {}) },
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
export function matchedOpts(b, l, rematch) { // rematch: link to a new broker = the "already matched" version
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
    title: `You've ${rematch ? 'already ' : ''}been matched with ${m.company}`, preheader: rematch ? `${who} has your details and we've told them you're still looking.` : `${who} will be in touch about your ${gbp(l.amount)} enquiry.`,
    greeting: `Hi ${esc(first)},`,
    ...(rematch ? { link: { label: 'Match me with a different broker', url: rematch } } : {}),
    intro: rematch ? `Thanks for getting in touch again. ${esc(l.business)} is already matched with <b>${esc(m.company)}</b>, so we've let them know you're still looking. ${m.person ? esc(m.person) : 'They'} should be in touch shortly, or you can contact them using the details below.<br><br>Would you rather speak to someone else? Use the link at the bottom of this email and we'll match you with a different broker.` : `Thanks for your enquiry. We've matched ${esc(l.business)} with <b>${esc(m.company)}</b>, a business finance broker who can help with the ${gbp(l.amount)} you asked about. ${m.person ? esc(m.person) : 'They'} will be in touch shortly, usually by phone.`,
    html: card,
    stepsTitle: 'What happens next', steps: [['They contact you', `Expect a call from ${esc(who)}${m.phone ? ` on ${esc(m.phone)}` : ''}. Save their number so you know it's them.`],
      ['Talk through your options', "They'll ask a few questions about your business and what you need the money for."],
      ['You decide', "You choose whether to go ahead. There's no obligation."]],
    footer: `Loanleaf introduces businesses to finance brokers. Any arrangement is between you and your broker, and Loanleaf isn't involved in it. Your broker will explain how they work and any fees before you go ahead.</p><p style="margin:0 0 12px">You're receiving this because you asked Loanleaf to match ${esc(l.business)} with a business finance broker.`, nav: false, replyTo: 'hello@loanleaf.co' };
}

// Previews for the Profile tab: the real email, and the form's thank-you page as the business sees it.
// The page markup mirrors brokerCard() in public/assets/apply.js — change both together.
const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
// Same icons as brokerCard() in apply.js.
const MATCH_ICON = { call: icon('<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
  whatsapp: icon('<path d="M3 21l1.7-4.9A8.6 8.6 0 1 1 8 19.6z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.2-1.8-.9-.8.8a4 4 0 0 1-2.3-2.3l.8-.8-.9-1.8z"/>'),
  sms: icon('<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 18h4"/>'), email: icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  web: icon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>') };
export function matchedPreviews(b) {
  const l = { email: 'preview@example.com', full_name: 'Sam Taylor', business: 'Taylor Joinery Ltd', amount: 75000, purpose: 'Equipment or vehicles', timeline: 'Within 2 weeks', turnover: '£250k to £500k', trading: '5+ years' };
  const m = publicProfile(b), btns = contactActions(m, l).map((x) => `<a class="ap-mb ap-mb-${x.k}" href="#">${MATCH_ICON[x.k]}<span><b>${x.label}</b><em>${esc(x.sub)}</em></span></a>`);
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank">
<link href="/assets/base.css" rel="stylesheet"><link href="/assets/site.css?v=28" rel="stylesheet"><link href="/assets/apply.css?v=31" rel="stylesheet">
<style>body{margin:0;background:#f4f7f5}a{pointer-events:none}.sec{padding:56px 24px 72px}.w{max-width:680px;margin:0 auto;padding:44px 40px 48px;background:#fff;border-radius:28px;box-shadow:0 24px 60px rgba(20,39,31,.08)}</style></head><body>
<div class="sec"><div class="w"><div class="ap-step on ap-done">
<div class="ap-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
<h2 class="ap-q">Thanks, Sam. We've matched you with ${esc(m.company)}.</h2><p class="ap-done-lead">${esc(m.person || 'They')} will be in touch shortly, usually by phone. We've emailed you their details too.</p>
<div class="ap-match"><span class="ap-match-tag">Your broker</span>${m.logo ? `<img class="ap-match-logo" src="${esc(m.logo)}" alt="">` : ''}<b class="ap-match-name">${esc(m.company)}</b>
${m.person ? `<span class="ap-match-who">${esc(m.person)}${m.role ? `, ${esc(m.role)}` : ''}</span>` : ''}${m.about ? `<p class="ap-match-about">${esc(m.about)}</p>` : ''}${btns.length ? `<div class="ap-match-btns">${btns.join('')}</div>` : ''}</div>
<dl class="ap-summary"><div><dt>Amount</dt><dd>£75,000</dd></div><div><dt>Purpose</dt><dd>Equipment or vehicles</dd></div><div><dt>Needed</dt><dd>Within 2 weeks</dd></div><div><dt>Business</dt><dd>Taylor Joinery Ltd</dd></div></dl>
</div></div></div></body></html>`;
  return { email: emailHtml(matchedOpts(b, l)), subject: `You've been matched with ${m.company}`, page, ...phonePreviews(b, l) };
}
// The approved Meta wording of the two matched templates (Bird: loanleaf_matched_v2 / loanleaf_matched_wa). Keep in step if a template is edited.
const MATCH_WA_BODY = {
  [MATCH_WA_TEMPLATE]: "Hi {{first_name}}, thanks for your business finance enquiry with Loanleaf for {{business}} ✅\n\nWe've matched you with *{{broker}}*, one of our recommended brokers. {{contact}} will be in touch shortly about your {{amount}} request.\n\n📞 {{phone}}\n✉️ {{email}}\n\nSave their number so you know it's them when they call. There's no obligation to go ahead.",
  [MATCH_WA_TEMPLATE_WA]: "Hi {{first_name}}, thanks for your business finance enquiry with Loanleaf for {{business}} ✅\n\nWe've matched you with *{{broker}}*, one of our recommended brokers. {{contact}} will be in touch shortly about your {{amount}} request.\n\n📞 {{phone}}\n💬 WhatsApp: {{whatsapp}}\n✉️ {{email}}\n\nSave their number so you know it's them when they get in touch. There's no obligation to go ahead.",
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
    whatsapp: doc('#efeae2', '#fff', '#075e54', `<div class="top"><i></i><div>Loanleaf<span>Business account</span></div></div><div class="c"><div class="b">${fmt(wa)}<div class="f">Loanleaf · loanleaf.co</div><span class="tm">09:41</span></div></div>`),
    sms: doc('#fff', '#e9e9eb', '#3a3a3c', `<div class="top"><i></i><div>Loanleaf<span>Text message</span></div></div><div class="c"><div class="b" style="border-radius:18px;border-bottom-left-radius:4px">${fmt(t.sms)}</div></div>`),
  };
}

// "Fill in from my website": reads the public home page for name, description, phone, WhatsApp, email and logo.
async function fetchPublic(url, max) {
  let u = url;
  for (let i = 0; i < 4; i++) {
    if (!(await safeWebhookUrl(u))) return null;
    const r = await fetch(u, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LoanleafBot/1.0; +https://loanleaf.co)', Accept: 'text/html,image/*;q=0.9,*/*;q=0.5' }, signal: AbortSignal.timeout(6000) }).catch(() => null);
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
    try { const walk = (o) => { if (!o || typeof o !== 'object' || org.name) return; if (/Organization|Business|FinancialService|Corporation|ProfessionalService/i.test([].concat(o['@type'] || []).join(' ')) && typeof o.name === 'string') org = o; else Object.values(o).forEach(walk); }; walk(JSON.parse(m[1])); } catch {}
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
