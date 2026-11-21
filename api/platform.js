import { createHmac, timingSafeEqual, createPublicKey, verify as cryptoVerify, randomBytes } from 'node:crypto';
import {
  db, rpc, configured, secretKey, SUPABASE_URL, PUBLISHABLE_KEY, PACKS, PREVIEW, FULL, TURNOVERS, TRADING, PURPOSES, PROPERTY, STRUCTURES, tierSpend, parseHubspot, postHubspot, parsePipedrive, postPipedrive,
  onTiers, critOf, asPriced, tierPlanOf, tierSpendOf, getTierPrices, TIER_NAMES, DEFAULT_TIER_PRICES, leadTier, deliver, sendEmail, notify, openHandoff, cleanProfile, scanSite, matchedPreviews, webhooksOf, lowCredits, esc, postWebhook, leadOut, quality, matches, suggestMode, SUGGEST, suggestDigest, missedDigest, missedSummary, excluded, rematchLead, linkedinSpend, STAGES, getPricing, DEFAULT_PRICING, gbp, price, PRICE_EXAMPLES, CUSTOM, customPack, REVENUE_MID, withMask, PREVIEW_SELECT, DISCOUNT, salePrice, discountable, BULK_FROM, resendSlot, waivedIds, recentEnquiries, metaEvent, suppress, unsuppress, suppressedSet, leadAdCosts, weekOf, inviteDigest,
} from './_lib/platform.js';
import { waOrSms, emailHtml } from './_lib/platform.js';
import { whatsNew } from './_lib/whats-new.js';
import { TRIAL, LOW_CREDITS, isUuid, allow, safeWebhookUrl, PLATFORM_URL, linkSig, signedUrl } from './_lib/platform.js';
import { gh, ghReady, listKeys, createKey, revokeKey, DIR as BLOG_DIR } from './_lib/blog.js';
import { TERMS_VERSION, termsHtml, termsHash } from './_lib/terms.js';
import { capture as crmCapture, markNotInterested, sourceFrom } from './_lib/crm.js';
import { signedPdf } from './_lib/agreement-pdf.js';
import { human, turnstileSiteKey } from './_lib/turnstile.js';
const pounds2 = (pence) => '£' + (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CANCEL_REASONS = ['Lead quality wasn’t good enough', 'Leads didn’t turn into deals', 'Not enough leads matching my criteria', 'Too expensive', 'Taking a break for now', 'Moving to another lead source', 'Something else'];
const ADMIN_TO = () => (process.env.ENQUIRY_TO || 'aran@verticalbrands.co').split(',');
// Refunds only for invalid contact details (partner agreement clause 7).
// Refund reasons brokers can pick. ok: refunded once we confirm it. review: they can ask, not guaranteed. no: not refundable (note says why).
const RETURN_REASONS = [
  { reason: 'Phone number is not in service', kind: 'ok', note: 'If we confirm the number isn’t in service, we’ll refund the lead in full.' },
  { reason: 'Phone number belongs to someone else', kind: 'ok', note: 'If we confirm the number belongs to someone else, we’ll refund the lead in full.' },
  { reason: 'Email address bounces or does not exist', kind: 'ok', note: 'If we confirm the email address doesn’t exist, we’ll refund the lead in full.' },
  { reason: 'Revenue or trading figures don’t match', kind: 'review', note: 'Tell us what the business told you. We’ll look into it, but a refund isn’t guaranteed.' },
  { reason: 'Something else', kind: 'review', note: 'Tell us what happened. We’ll look into it, but a refund isn’t guaranteed.' },
  { reason: 'They’re no longer interested', kind: 'no', note: 'Sorry, we can’t refund this. Every lead is a real inbound enquiry, but not every business will go ahead. That’s the nature of lead generation.' },
  { reason: 'They’ve changed what they need or no longer want funding', kind: 'no', note: 'Sorry, we can’t refund this. Plans change after a business enquires, and that’s outside our control.' },
];
// Why an admin declined a refund: shown to the broker in the decision email.
const DECLINE_REASONS = {
  valid: 'We checked the phone number and email address and both are valid. Refunds are for leads we can’t reach because the contact details are wrong.',
  interest: 'The business is no longer interested. Every lead is a real inbound enquiry, but not every business will go ahead, so we can’t refund leads that change their mind.',
  brief: 'The business has changed what it needs or no longer wants funding. Plans change after an enquiry and that’s outside our control, so we can’t refund it.',
  figures: 'We checked the business’s revenue and trading time and they match what was given in the enquiry.',
  attempts: 'The contact details look right, so the business may just be busy. Please make a few more attempts by phone, text and email over the next few days.',
  late: 'The request came in after the 72-hour refund window.',
};
const RETURN_HOURS = 72;

// Broker platform API. One endpoint, routed by ?action= (keeps the function count low).
// Env: SUPABASE_SECRET_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, ENQUIRY_TO (admin alerts).
export const config = { api: { bodyParser: false } }; // raw body needed for Stripe signatures

// The exact bytes the caller sent (Stripe signs these). Read the stream before touching req.body: on Vercel,
// reading req.body parses the JSON, and the `config.api.bodyParser` switch above only applies to Next.js.
const readRaw = async (req) => {
  if (req.readable && !req.readableEnded) {
    const chunks = []; for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
    if (chunks.length) return Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  return '';
};
const fail = (res, code, error) => res.status(code).json({ error });
// Password rule, mirrored in public/assets/platform.js. 72 = bcrypt's limit in Supabase Auth.
const pwProblem = (p) => (p = String(p || ''), p.length < 12 ? 'at least 12 characters' : p.length > 72 ? '72 characters or fewer' : !/[A-Z]/.test(p) ? 'an upper-case letter'
  : !/[a-z]/.test(p) ? 'a lower-case letter' : !/[0-9]/.test(p) ? 'a number' : !/[^A-Za-z0-9]/.test(p) ? 'a special character, like ! ? # or @' : null);

// Supabase signs access tokens with ES256; verify them here (keys cached per instance) instead of a network call per request.
let jwks = null, jwksAt = 0;
async function verifyJwt(token) {
  const [h64, p64, s64] = token.split('.');
  if (!s64) return null;
  const head = JSON.parse(Buffer.from(h64, 'base64url').toString());
  if (head.alg !== 'ES256') return undefined; // unknown algorithm: fall back to asking Supabase
  if (!jwks || Date.now() - jwksAt > 3600e3 || !jwks.find((k) => k.kid === head.kid)) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`, { signal: AbortSignal.timeout(4000) });
    jwks = (await r.json()).keys || []; jwksAt = Date.now();
  }
  const jwk = jwks.find((k) => k.kid === head.kid);
  if (!jwk) return null;
  const ok = cryptoVerify('sha256', Buffer.from(`${h64}.${p64}`), { key: createPublicKey({ key: jwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' }, Buffer.from(s64, 'base64url'));
  if (!ok) return null;
  const claims = JSON.parse(Buffer.from(p64, 'base64url').toString());
  if (!claims.sub || !claims.exp || claims.exp * 1000 < Date.now() || claims.role !== 'authenticated') return null;
  return { id: claims.sub, email: claims.email };
}

// The signed-in Supabase user for this request, or null.
async function authUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try { const v = await verifyJwt(token); if (v !== undefined) return v; } catch { return null; }
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) });
  return r.ok ? r.json() : null;
}

// Team members: extra sign-ins on a broker account. Everyone can see and work leads; these permissions unlock the rest.
const PERMS = { buy: 'Buy leads and request refunds', settings: 'Change auto-buy, delivery, profile and notifications', billing: 'Manage billing, plans and the partner agreement', team: 'Add and remove users' };
const NEED = { buy: 'buy', refund: 'buy', backlog: 'buy', settings: 'settings', 'test-webhook': 'settings', profile: 'settings', 'profile-logo': 'settings', 'profile-preview': 'settings', 'profile-scan': 'settings',
  billing: 'billing', ledger: 'billing', checkout: 'billing', 'change-plan': 'billing', 'cancel-plan': 'billing', 'resume-plan': 'billing', coupon: 'billing', invoices: 'billing', subscription: 'billing',
  'enterprise-request': 'billing', sign: 'billing', onboard: 'billing', team: 'team', 'team-invite': 'team', 'team-update': 'team', 'team-remove': 'team' };
const cleanPerms = (p = {}) => Object.fromEntries(Object.keys(PERMS).map((k) => [k, !!p[k]]));
const INVITE_DAYS = 14;
const teamInviteEmail = (m, owner, by) => notify([m.email], `${owner.company} has added you to Leaflegal Platform`, {
  title: `Join ${owner.company} on Leaflegal`, preheader: `${by} has given you a sign-in to ${owner.company}’s Leaflegal Platform account.`,
  intro: `${esc(by)} has added you to <b>${esc(owner.company)}</b>’s account on Leaflegal Platform, where the team buys and manages business finance leads. Choose a password to get started.`,
  rows: Object.entries(PERMS).map(([k, label]) => [label, m.perms?.[k] ? 'Yes' : 'No']).concat([['See leads and update their stages', 'Yes']]), rowsTitle: 'What you can do',
  cta: { label: 'Accept and choose a password', url: `${PLATFORM_URL}/join?t=${m.token}` },
  note: `This link works for ${INVITE_DAYS} days. If you weren’t expecting it, you can ignore this email.` });

// UK VAT at 20%, added on top of plan prices. Reuses an existing matching tax rate in Stripe, else creates one.
let vatRate = null;
async function ukVat() {
  if (vatRate) return vatRate;
  const { data } = await stripe('tax_rates', { active: 'true', limit: '100' }, 'GET');
  const hit = data.find((t) => t.percentage === 20 && !t.inclusive && /vat/i.test(t.display_name) && (t.country || 'GB') === 'GB');
  vatRate = hit?.id || (await stripe('tax_rates', { display_name: 'VAT', percentage: '20', inclusive: 'false', country: 'GB', description: 'UK VAT (Leaflegal Platform)' })).id;
  return vatRate;
}

// The broker's live subscription in Stripe (active, trialing or past due), or null.
// Admin: what the buyer actually paid for each sold lead, in credits (their buys minus refunds). Commission clients (Aureum)
// and leads given free are 0, since we made no credits from them. Adds paid and paid_why ('commission' | 'free') to sold rows.
async function withPaid(rows, commission) {
  const sold = rows.filter((l) => l.buyer);
  if (!sold.length) return rows;
  // Refund rows don't always carry lead_id, only "Refund for lead #N" in the reason, so fetch those too.
  const ids = sold.map((l) => l.id), moves = await db(`ledger?or=(lead_id.in.(${ids}),reason.like.Refund for lead*)&select=lead_id,broker,delta,reason&limit=50000`).catch(() => []);
  const by = {};
  for (const m of moves) { const lead = m.lead_id ?? (Number(/#(\d+)/.exec(m.reason || '')?.[1]) || null);
    if (lead && (m.delta < 0 || /^Refund/.test(m.reason || ''))) (by[`${lead}|${m.broker}`] ||= []).push(m); }
  for (const l of sold) {
    const mine = by[`${l.id}|${l.buyer}`] || [], got = mine.reduce((a, m) => a - m.delta, 0);
    l.paid = commission.has(l.buyer) ? 0 : Math.max(0, got);
    l.paid_why = commission.has(l.buyer) ? 'commission' : l.paid ? null : mine.some((m) => m.delta > 0) ? 'refunded' : 'free';
  }
  return rows;
}
// Daily Meta ad spend (account currency, excludes VAT). Env: META_ADS_TOKEN (needs ads_read; falls back to META_CAPI_TOKEN), META_AD_ACCOUNT.
async function metaSpend(since) {
  const token = (process.env.META_ADS_TOKEN || process.env.META_CAPI_TOKEN || '').trim();
  if (!token) return { status: 'no token', days: [] };
  const acct = String(process.env.META_AD_ACCOUNT || '957353369466280').replace(/^act_/, '');
  const range = encodeURIComponent(JSON.stringify({ since: since.toISOString().slice(0, 10), until: new Date().toISOString().slice(0, 10) }));
  let url = `https://graph.facebook.com/v21.0/act_${acct}/insights?level=campaign&fields=campaign_id,spend,clicks&time_increment=1&time_range=${range}&limit=500&access_token=${encodeURIComponent(token)}`;
  const rows = [], by = {};
  const out = () => ({ days: Object.values(by).sort((a, b) => a.date.localeCompare(b.date)), rows });
  try {
    for (let i = 0; url && i < 30; i++) {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) }), d = await r.json();
      if (!r.ok) { console.error('meta spend', d.error?.message); return { status: `error: ${String(d.error?.message || r.status).slice(0, 120)}`, ...out() }; }
      for (const x of d.data || []) {
        const spend = Number(x.spend) || 0, day = (by[x.date_start] ||= { date: x.date_start, spend: 0, clicks: 0 });
        day.spend += spend; day.clicks += Number(x.clicks) || 0; rows.push({ date: x.date_start, campaign: x.campaign_id, spend });
      }
      url = d.paging?.next || null;
    }
    return { status: 'ok', ...out() };
  } catch (e) { return { status: 'error: ' + e.message, ...out() }; }
}
// Where a lead came from: where the visit started (source.first, from nav.js) wins over the form page's own URL and referrer.
// Query params of one of our own URLs (the ad's utm tags survive there when the page that submitted had lost them).
const ownParams = (url) => { try { const x = new URL(url, 'https://leaflegal.co'); return /(^|\.)leaflegal\.co$/i.test(x.hostname) ? Object.fromEntries(x.searchParams) : {}; } catch { return {}; } };
function leadOrigin(src = {}) {
  const f = src.first || {}, u = src.utm || {}, ref = f.referrer || src.referrer || '';
  // Tags from the URL we were sent, else from our own referrer/landing page; an internal referrer isn't where they came from.
  const own = { ...ownParams(f.landing || f.page || ''), ...ownParams(src.referrer || '') };
  const m = { ...own, ...u, ...f, referrer: Object.keys(ownParams(ref)).length || /leaflegal\.co/i.test(ref) ? '' : ref };
  let channel = sourceFrom(m, '');
  if (!channel && /facebook\.|instagram\./i.test(m.referrer)) channel = 'Meta ads';
  if (!channel) channel = /leaflegal\.co/i.test(m.referrer) || !m.referrer ? 'Direct or unknown' : 'Other website';
  // Meta tags campaign/ad set/ad IDs as utm_campaign/utm_term/utm_content; LinkedIn the campaign name, ad set id (utm_id) and ad (utm_content).
  const ad = { campaign_name: m.utm_campaign || null, adset: (channel === 'LinkedIn' ? m.utm_id : m.utm_term) || null, ad: m.utm_content || null };
  return { channel, campaign: (channel === 'LinkedIn' ? m.utm_id || m.utm_campaign : m.utm_campaign) || null, ...ad }; // LinkedIn tags links with the ad set as utm_id
}
// Admin only: swap Meta campaign / ad set / ad IDs for their names (Graph batch API, 50 IDs a call). Unknown IDs stay as they are.
const metaNames = new Map(); // ponytail: per-instance cache, fine at this volume
async function withAdNames(rows) {
  const token = (process.env.META_ADS_TOKEN || process.env.META_CAPI_TOKEN || '').trim();
  const keys = ['campaign_name', 'adset', 'ad'], meta = rows.filter((l) => l.channel === 'Meta ads');
  const ids = [...new Set(meta.flatMap((l) => keys.map((k) => l[k])).filter((v) => /^\d{6,}$/.test(v || '') && !metaNames.has(v)))];
  if (token) for (let i = 0; i < ids.length; i += 50) {
    try {
      const batch = ids.slice(i, i + 50).map((id) => ({ method: 'GET', relative_url: `${id}?fields=id,name` }));
      const r = await fetch('https://graph.facebook.com/v21.0/', { method: 'POST', signal: AbortSignal.timeout(8000),
        body: new URLSearchParams({ access_token: token, batch: JSON.stringify(batch) }) });
      const d = await r.json();
      if (!r.ok || !Array.isArray(d)) { console.error('meta names', d.error?.message || r.status); break; }
      for (const x of d) { try { const o = JSON.parse(x?.body || '{}'); if (o.id && o.name) metaNames.set(o.id, o.name); else if (o.error) console.error('meta names', o.error.message); } catch {} }
    } catch (e) { console.error('meta names', e.message); break; }
  }
  for (const l of meta) for (const k of keys) if (metaNames.has(l[k])) l[k] = metaNames.get(l[k]);
  return rows;
}
// Cost per lead for the admin list, per ad platform: each lead's campaign (Meta) or ad set (LinkedIn) spend that week ÷ its leads
// from that platform that week, else that platform's weekly average. Leads from other sources have no ad cost.
async function adLeadCosts(leads) {
  const by = { 'Meta ads': metaSpend, LinkedIn: linkedinSpend }, costs = {}, status = {};
  await Promise.all(Object.entries(by).map(async ([ch, spendOf]) => {
    const mine = leads.filter((l) => l.channel === ch);
    if (!mine.length) return;
    const spend = await spendOf(new Date(Math.min(...mine.map((l) => new Date(l.created_at).getTime())) - 7 * 864e5)).catch((e) => ({ status: 'error: ' + e.message, rows: [] }));
    status[ch] = spend.status;
    if (spend.rows?.length) Object.assign(costs, leadAdCosts(mine.map((l) => ({ id: l.id, created_at: l.created_at, campaign: l.campaign })), spend.rows));
  }));
  return { status, costs };
}
// Ad cost of every lead since a date (see leadAdCosts), keyed by lead id.
async function adCostsSince(since) {
  const [spend, leads] = await Promise.all([metaSpend(since), db(`leads?created_at=gte.${since.toISOString()}&select=id,created_at,campaign:source->utm->>utm_campaign&limit=50000`)]);
  return { status: spend.status, costs: leadAdCosts(leads, spend.rows) };
}
const audit = (admin, action, target, detail) => db('audit_log', { method: 'POST', body: { admin, action, target: String(target ?? ''), detail } }).catch(() => {});
const signed = async (uid) => (await waivedIds()).has(uid) || (await db(`agreements?broker=eq.${uid}&version=eq.${TERMS_VERSION}&select=id&limit=1`)).length > 0; // or excused by an admin
// Leads already waiting that fit a broker's criteria, picked as auto-buy would (good contact checks, under their per-lead max), newest first at today's price.
async function backlogOf(b) {
  const since = new Date(Date.now() - 30 * 864e5).toISOString(), f = b.filters || {};
  const rows = await db(`leads?buyer=is.null&hidden_at=is.null&exclude_brokers=not.cs.{${b.id}}&or=(created_at.gte.${since},price_fixed.is.true)&select=${PREVIEW_SELECT}&order=created_at.desc&limit=200`);
  return rows.map((l) => asPriced(l, b)).filter((l) => { const c = l.checks || {};
    return l.price != null && matches(critOf(b), l) && !(c.phone?.allocated === false || c.phone?.reachable === false || c.email?.result === 'undeliverable')
      && (onTiers(b) || !f.maxPrice || salePrice(l).price <= f.maxPrice); }).map((l) => ({ id: l.id, price: salePrice(l).price }));
}
const canBuy = async (b) => b.approved && !b.suspended_at && !b.plan?.commission && (await signed(b.id));
// "Yes, match me with these": buys the waiting leads within the broker's credits and monthly auto-buy limit, then clears the request.
// ponytail: daily limits and tier budgets aren't applied here (the broker said yes to this batch); add them if a client asks.
async function claimBacklog(b) {
  if (!(await canBuy(b)) || b.credits <= 0) return null; // asked during onboarding: kept until the account can buy
  let credits = b.credits, used = b.monthly_cap ? await rpc('auto_spend_this_month', { p_broker: b.id }) : 0, bought = 0, spent = 0;
  const list = await backlogOf(b);
  for (const x of list) {
    if (x.price > credits || (b.monthly_cap && used + x.price > b.monthly_cap)) continue;
    if (!(await rpc('buy_lead', { p_lead: x.id, p_broker: b.id, p_auto: true }))) continue;
    const [l] = await db(`leads?id=eq.${x.id}&select=${FULL}`);
    await deliver(b, l).catch((e) => console.error('backlog deliver', l.id, e.message));
    bought++; spent += l.price; credits -= l.price; used += l.price;
  }
  await db(`brokers?id=eq.${b.id}`, { method: 'PATCH', body: { backlog_at: null } });
  if (spent) await lowCredits(b, b.credits, credits).catch(() => {});
  return { bought, spent, left: list.length - bought };
}
const pendingBacklog = async (id) => { const [b] = await db(`brokers?id=eq.${id}&backlog_at=not.is.null&select=*`); return b ? claimBacklog(b) : null; };
// Stripe coupon for the first month offer: the Starter price less £1,000, off the first invoice (before VAT). Created once per
// amount (the id carries it), so changing the Starter price never reuses a coupon with the wrong discount.
async function trialCoupon() {
  const id = `LEAFLEGAL_FIRST_MONTH_${(PACKS[TRIAL.then].pence - TRIAL.pence) / 100}`;
  try { await stripe(`coupons/${id}`, null, 'GET'); } catch {
    await stripe('coupons', { id, name: 'First month: £1,000 + VAT', amount_off: String((PACKS[TRIAL.then].pence - TRIAL.pence)), currency: 'gbp', duration: 'once' });
  }
  return id;
}
// A live promotion code (created in the Stripe dashboard under Products → Coupons), or null.
async function findPromo(code) {
  const c = String(code || '').trim().slice(0, 40);
  if (!/^[A-Za-z0-9_-]+$/.test(c)) return null;
  const { data } = await stripe('promotion_codes', { code: c, active: 'true', limit: '1' }, 'GET');
  const p = data[0];
  if (!p) return null;
  // Only codes made for Leaflegal: tag the promotion code or its coupon with metadata leaflegal = true in Stripe.
  // Stops an unrelated discount in the same Stripe account buying full credit packs at a fraction of the price.
  if (p.metadata?.leaflegal === 'true') return p;
  let coupon = p.coupon ?? p.promotion?.coupon; // older API versions inline the coupon; newer ones give its id
  if (typeof coupon === 'string') coupon = await stripe(`coupons/${encodeURIComponent(coupon)}`, null, 'GET').catch(() => null);
  return coupon?.metadata?.leaflegal === 'true' ? p : null;
}
async function currentSub(customer) {
  if (!customer) return null;
  const { data } = await stripe('subscriptions', { customer, status: 'all', limit: '10' }, 'GET');
  return data.find((x) => ['active', 'trialing', 'past_due'].includes(x.status)) || null;
}
const subOut = (x) => x && ({
  plan: x.metadata?.pack || 'Plan', credits: Number(x.metadata?.credits) || 0, pounds: Math.round((x.items?.data?.[0]?.price?.unit_amount || 0) / 100),
  status: x.status, renews: (x.current_period_end || x.items?.data?.[0]?.current_period_end) ? new Date((x.current_period_end || x.items.data[0].current_period_end) * 1000).toISOString() : null,
  cancelling: !!x.cancel_at_period_end,
  trial: onTrial(x), // still in the £1,000 first month: can move to the full plan now
});
// First month offer: started on the offer and hasn't renewed or changed plan since (each of those starts a new period).
const onTrial = (x) => x?.metadata?.trial === '1' && Math.abs((x.current_period_start || x.items?.data?.[0]?.current_period_start || 0) - (x.start_date || 0)) < 120;

async function stripe(path, params, method = 'POST') {
  const r = await fetch(`https://api.stripe.com/v1/${path}${method === 'GET' && params ? '?' + new URLSearchParams(params) : ''}`, {
    method, headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : new URLSearchParams(params).toString(),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`stripe ${path}: ${d.error?.message}`);
  return d;
}

// Resend signs webhooks the Svix way: base64 HMAC-SHA256 of "id.timestamp.body", key = base64 part of whsec_… secret.
function verifyResend(raw, h, secret) {
  secret = String(secret || '').trim().replace(/^whsec_/, '');
  const id = h['svix-id'], ts = h['svix-timestamp'], sigs = String(h['svix-signature'] || '').split(' ').map((s) => s.split(',')[1]).filter(Boolean);
  if (!secret || !id || !ts || !sigs.length || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  let bodies = [raw]; try { bodies.push(JSON.stringify(JSON.parse(raw))); } catch {} // in case the platform already parsed the body
  return bodies.some((b) => { const want = createHmac('sha256', Buffer.from(secret, 'base64')).update(`${id}.${ts}.${b}`).digest('base64');
    return sigs.some((g) => g.length === want.length && timingSafeEqual(Buffer.from(g), Buffer.from(want))); });
}
function verifyStripe(raw, header, secret) {
  secret = String(secret || '').trim();
  const parts = Object.fromEntries(String(header || '').split(',').map((p) => p.split('=')));
  if (!secret || !parts.t || !parts.v1 || Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const got = String(header).split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  // If the platform already parsed the body, rebuild it the way Stripe formats events (2-space indent) as well as compact.
  let alt = [];
  try { const o = JSON.parse(raw); alt = [JSON.stringify(o, null, 2), JSON.stringify(o)]; } catch {}
  return [raw, ...alt].some((body) => {
    const want = createHmac('sha256', secret).update(`${parts.t}.${body}`).digest('hex');
    return got.some((g) => g.length === want.length && timingSafeEqual(Buffer.from(g), Buffer.from(want)));
  });
}

const sub = (list, allowed) => (Array.isArray(list) ? list.filter((v) => allowed.includes(v)) : []);
const money = (v) => { const n = Math.round(Number(String(v ?? '').replace(/[^\d.]/g, ''))); return n > 0 ? n : null; };


// Approve or pause a broker, and email them. Shared by Admin → Clients and the approve link in the signup email.
// Invoiced (manual) plans: credits are added on each due date. The ledger ref makes each month's grant happen once,
// however often the job runs. Catches up at most 2 missed months.
const addMonth = (iso) => { const d = new Date(iso); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString(); };
async function grantPlan(b, now = Date.now()) {
  let plan = b.plan, given = 0;
  if (!plan?.credits) return { given, plan }; // commission flag only: no monthly credits
  for (let i = 0; i < 2 && plan?.next_at && new Date(plan.next_at) <= now; i++) {
    const ref = `plan-${b.id}-${plan.next_at.slice(0, 10)}`;
    if (await rpc('add_credits', { p_broker: b.id, p_delta: plan.credits, p_reason: `Monthly credits: ${plan.name}`, p_ref: ref })) {
      given += plan.credits;
      if (plan.price) await db(`ledger?ref=eq.${encodeURIComponent(ref)}`, { method: 'PATCH', body: { invoiced: plan.price } });
    }
    plan = { ...plan, next_at: addMonth(plan.next_at) };
  }
  if (plan !== b.plan) await db(`brokers?id=eq.${b.id}`, { method: 'PATCH', body: { plan } });
  if (given) await notify([b.email], `${given.toLocaleString('en-GB')} credits added to your account`, {
    title: 'Your monthly credits are in', preheader: `${given.toLocaleString('en-GB')} credits from your ${plan.name} plan.`,
    intro: `We've added this month's ${given.toLocaleString('en-GB')} credits from ${esc(b.company)}'s <b>${esc(plan.name)}</b> plan.`,
    highlight: { value: `+${given.toLocaleString('en-GB')} credits`, label: `Next credits on ${new Date(plan.next_at).toLocaleDateString('en-GB', { dateStyle: 'long' })}` },
    cta: { label: 'Go to opportunities', url: `${PLATFORM_URL}/opportunities` } }).catch(() => {});
  if (given) await pendingBacklog(b.id).catch((e) => console.error('backlog', e.message));
  return { given, plan };
}

// Commission payments and ad spend logged by admins. Empty (not an error) until the commission_entries table exists.
const commissionEntries = (filter) => db(`commission_entries?${filter}&select=id,broker,kind,amount,date,note,channel,created_at&order=date.desc,id.desc&limit=5000`)
  .then((r) => r.map((e) => ({ ...e, amount: Number(e.amount) }))).catch(() => []);

// Average lead price (credits) over the last 90 days, for plan suggestions. Cached per instance for 10 minutes.
let avgCache = { t: 0, v: 45 };
async function avgLeadPrice() {
  if (Date.now() - avgCache.t < 6e5) return avgCache.v;
  const rows = await db(`leads?created_at=gte.${new Date(Date.now() - 90 * 864e5).toISOString()}&select=price,list_price&limit=5000`).catch(() => []);
  avgCache = { t: Date.now(), v: rows.length ? Math.round(rows.reduce((a, r) => a + (r.list_price || r.price || 0), 0) / rows.length) : avgCache.v };
  return avgCache.v;
}

async function setApproved(b, approved, by) {
  if (approved === b.approved) return false;
  await db(`brokers?id=eq.${b.id}`, { method: 'PATCH', body: { approved } });
  await audit(by, 'broker', b.id, { approved });
  if (approved) await pendingBacklog(b.id).catch((e) => console.error('backlog', e.message));
  await notify([b.email], approved ? 'Your Leaflegal Platform account is approved' : 'Your Leaflegal Platform account has been paused', approved ? {
    title: 'You’re approved', preheader: `${b.company} can now buy exclusive leads on Leaflegal Platform.`,
    intro: `Good news: ${esc(b.company)} is approved on Leaflegal Platform. You can now buy leads${b.mode === 'auto' ? ', and auto-buy will start picking up leads that match your criteria the moment they arrive' : ''}.`,
    ...(b.credits ? { highlight: { value: `${b.credits.toLocaleString('en-GB')} credits`, label: 'ready to spend' } } : {}),
    stepsTitle: 'Start here',
    steps: [['Browse live opportunities', 'See every live lead with its amount, purpose, revenue, trading time and price before you buy.'],
      [b.mode === 'auto' ? 'Check your auto-buy limits' : 'Try auto-buy', 'Set the leads you want and your daily, monthly and per-lead limits, and we’ll buy them for you.'],
      ['Call every lead quickly', 'Leads are delivered instantly by email and on the platform. The faster you call, the better they convert.']],
    cta: { label: 'Go to opportunities', url: `${PLATFORM_URL}/opportunities` } } : {
    title: 'Your account has been paused', preheader: 'Lead buying is paused on your account. Reply and we’ll help sort it out.',
    intro: `We've paused lead buying for ${esc(b.company)} on Leaflegal Platform. You can still sign in and see the leads you've already bought, but auto-buy has stopped and you can't buy new leads for now.`,
    note: 'This is usually something quick to sort out, like a missing detail or a billing question. Reply to this email and we’ll help.', replyTo: 'hello@leaflegal.co' });
  return true;
}

// One-time-style approve link for the admin signup email: signed with the server key, expires after 14 days.
// The link opens a confirmation page; only its button (a POST) approves, so email scanners that open links can't.
const approveUrl = (id) => signedUrl('approve', id, 14);
const verifyUrl = (id) => signedUrl('verify-email', id, 7);
const sigOk = (id, exp, sig, kind = 'approve') => {
  if (!(isUuid(id) || /^\d{1,12}$/.test(id || '')) || !(Number(exp) > Date.now()) || !/^[0-9a-f]{40}$/.test(sig || '')) return false;
  const want = Buffer.from(linkSig(kind, id, exp)), got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
};
// Supplier invite: the link carries the invitee's name, email and firm, signed so it can't be edited. Valid 30 days.
// The signup page reads the (unsecret) payload to prefill the form; the server re-checks the signature.
const inviteSig = (d) => createHmac('sha256', secretKey()).update(`invite:${d}`).digest('base64url');
const inviteToken = (p) => { const d = Buffer.from(JSON.stringify({ ...p, x: Date.now() + 30 * 864e5 })).toString('base64url'); return `${d}.${inviteSig(d)}`; };
const readInvite = (t) => {
  const [d, s] = String(t || '').split('.'), want = d && Buffer.from(inviteSig(d));
  if (!s || want.length !== Buffer.from(s).length || !timingSafeEqual(want, Buffer.from(s))) return null;
  try { const p = JSON.parse(Buffer.from(d, 'base64url')); return p.x > Date.now() ? p : null; } catch { return null; }
};
// When the i-th invite of a bulk upload goes out: perDay a day, evenly between 08:00 and 17:00 UTC, from `start`.
// ponytail: fixed UTC window (09:00–18:00 in UK summer time); use a proper Europe/London offset if that matters.
export function bulkSendTime(start, perDay, i) {
  const day0 = new Date(start); day0.setUTCHours(0, 0, 0, 0);
  const open = (d) => new Date(+day0 + d * 864e5 + 8 * 36e5), shut = (d) => new Date(+day0 + d * 864e5 + 17 * 36e5);
  const first = start >= shut(0) ? 1 : 0, d = first + Math.floor(i / perDay), k = i % perDay;
  const from = d === 0 ? new Date(Math.max(+start, +open(0))) : open(d), span = shut(d) - from;
  return new Date(+from + (span * k) / perDay);
}
const sendInvite = (p, link) => {
  const first = String(p.n || '').split(' ')[0], tok = link.split('invite=')[1] || '';
  const unsub = `${PLATFORM_URL}/api/platform?action=invite-stop&t=${encodeURIComponent(tok)}`;
  if (p.k === 'cold') return sendColdInvite(p, link, first, unsub);
  if (p.k === 'partner') return notify([p.e], first ? `${first}, your invitation to Leaflegal Platform` : 'Your invitation to Leaflegal Platform', {
    title: 'Your invitation to Leaflegal Platform',
    preheader: 'Your details are filled in. Setting up takes about five minutes.',
    greeting: first ? `Hi ${esc(first)},` : 'Hello,',
    intro: `Here’s your invitation to Leaflegal Platform${p.c ? ` for <b>${esc(String(p.c).replace(/\.+$/, ''))}</b>` : ''}. Leaflegal brings you UK limited companies and LLPs that have asked to speak to a broker about business finance, and every lead goes to one firm only.`,
    highlight: { value: 'About five minutes', label: 'To set up. Your details are filled in, and we check every new account, usually within one working day.' },
    cta: { label: 'Join Leaflegal Platform', url: link },
    stepsTitle: 'What happens next',
    steps: [['Choose a password', 'Your name, company, email and mobile are already filled in.'],
      ['Tell us what you fund', 'The loan sizes, purposes and types of business you want to hear about.'],
      ['We check your account', 'Usually within one working day. Then you can buy leads or switch on auto-buy.']],
    tipsTitle: 'While you wait',
    tips: ['<b>New leads by email.</b> We\'ll send you new leads as they come in, so you can see what\'s on offer.',
      '<b>Exclusive leads.</b> Each enquiry goes to one firm, never a shared list.',
      '<b>Full details before you buy.</b> Amount, purpose, revenue, trading time and Companies House checks.'],
    note: `This invitation is for ${esc(p.e)} and works until ${new Date(p.x).toLocaleDateString('en-GB', { dateStyle: 'long' })}. Questions? Just reply to this email.`,
    footer: `You're receiving this because ${esc(p.e)} asked about becoming a Leaflegal partner on leaflegal.co. <a href="${unsub}" style="color:#86998f">Don't want these emails?</a>`, unsub, nav: false, replyTo: 'hello@leaflegal.co' }); // no account links yet: fewer links reads less like bulk mail
  return notify([p.e], first ? `${first}, you're invited to join Leaflegal as an approved supplier` : 'You’re invited to join Leaflegal as an approved supplier', {
    title: 'You’re invited to join Leaflegal',
    preheader: `Your account is already approved. Setting up takes about five minutes.`,
    greeting: first ? `Hi ${esc(first)},` : 'Hello,',
    intro: `We'd like ${p.c ? `<b>${esc(p.c)}</b>` : 'you'} to join Leaflegal as an approved supplier. Leaflegal brings you UK limited companies and LLPs that have asked to speak to someone about business finance today, and every lead is sold to one firm only. When you buy it, it's yours.`,
    highlight: { value: 'Already approved', label: 'No waiting for a review. You can start as soon as your account is set up.' },
    rowsTitle: 'Your invitation', rows: [...(p.n ? [['Name', p.n]] : []), ['Email', p.e], ...(p.c ? [['Firm', p.c]] : []), ['Valid until', new Date(p.x).toLocaleDateString('en-GB', { dateStyle: 'long' })]],
    cta: { label: 'Accept your invitation', url: link },
    stepsTitle: 'Getting set up takes about five minutes',
    steps: [['Choose a password', 'Your name and email are already filled in.'],
      ['Tell us what you fund', 'The loan sizes, purposes and types of business you want to hear about.'],
      ['Pick a monthly plan', 'Plans start at £2,500 + VAT a month, and new partners can take their first month for £1,000 + VAT.'],
      ['Accept the partner agreement', 'Tick two boxes to accept online. We email you a copy and keep one in your account.']],
    tipsTitle: 'What you get',
    tips: ['<b>Exclusive leads.</b> Each enquiry goes to one firm, never a shared list.',
      '<b>Full details before you buy.</b> Amount, purpose, revenue, trading time and Companies House checks.',
      '<b>Auto-buy.</b> Set your criteria and limits, and we pick up matching leads the moment they arrive.',
      '<b>Straight into your workflow.</b> Leads land in your inbox, on the platform and in your CRM.',
      ...(p.alerts ? ['<b>See leads straight away.</b> We\'ll email you new leads as they come in, so you can see what\'s on offer while you set up.'] : [])],
    note: `This invitation is for ${esc(p.e)} and works until ${new Date(p.x).toLocaleDateString('en-GB', { dateStyle: 'long' })}. If you weren't expecting it, you can ignore this email.`,
    footer: `You're receiving this because the Leaflegal team invited ${esc(p.e)} to join Leaflegal Platform. <a href="${unsub}" style="color:#86998f">Don't want these emails?</a>`, unsub, nav: false, from: BULK_FROM(), replyTo: 'hello@leaflegal.co', scheduledAt: p.at });
};
// Cold invite: for firms who haven't heard of Leaflegal. Explains what it is, how it works and how to join.
const sendColdInvite = async (p, link, first, unsub) => notify([p.e], p.c ? `${p.c} is invited to join Leaflegal` : 'You’re invited to join Leaflegal', {
  title: p.c ? `${p.c} is invited to join Leaflegal` : 'You’re invited to join Leaflegal', // title is escaped by emailHtml
  preheader: 'Exclusive business finance leads, sold to one broker only. Your account is already approved.',
  greeting: first ? `Hi ${esc(first)},` : 'Hello,',
  intro: 'You’ve been invited to join Leaflegal. UK businesses come to us looking for finance, and we pass each enquiry to one approved broker only.',
  tipsTitle: 'What you get', ticks: true,
  tips: ['<b>Inbound, genuine enquiries</b> from UK businesses looking for finance.',
    '<b>Verified details.</b> Every company is checked on Companies House, and phone numbers and email addresses are checked live.',
    '<b>The full picture up front.</b> Revenue, loan amount, CCJs and existing finance are declared before you buy.',
    '<b>Pay per lead.</b> Only for the leads you take, using credits from a monthly plan you can cancel any time.',
    '<b>Auto-match.</b> Set your criteria and leads that fit are bought for you the moment they arrive.',
    '<b>Straight to your inbox and CRM.</b> Every lead you buy is sent to your email, your CRM, or both, the moment it’s yours.',
    '<b>One lead, one broker.</b> Never a shared list. When you buy a lead, it’s yours alone.'],
  cta: { label: 'Accept invite', url: link }, after: (await recentEnquiries()).replace('{{more}}', esc(link)), // their invite link: accepting it opens the live opportunities
  note: `Joining takes about five minutes, and your account is already approved. This invitation is for ${esc(p.e)} and works until ${new Date(p.x).toLocaleDateString('en-GB', { dateStyle: 'long' })}. Questions? Just reply to this email.`,
  footer: `You're receiving this because we think Leaflegal could help ${esc(p.c || 'your firm')} find new clients. <a href="${unsub}" style="color:#86998f">Unsubscribe</a> and we won't email you again.`,
  unsub, nav: false, from: BULK_FROM(), replyTo: 'hello@leaflegal.co', scheduledAt: p.at });

// Bulk invites wait in the invites table (email_id 'queued') until they're within FLUSH_AHEAD of their send time, then go to
// Resend scheduled for that time with a fresh 30-day link. Run after each upload and by the daily job, within a time budget.
// ponytail: one daily job + 72h look-ahead covers ~300 sends per run; add a more frequent cron if lists get much bigger.
const FLUSH_AHEAD = 72 * 36e5;
// Settings of each CSV upload (pace, warm/cold, lead emails, paused), for the Invites tab. settings key invite_batches.
async function saveBatch(batch, patch) {
  const [r] = await db('settings?key=eq.invite_batches&select=value').catch(() => []);
  const all = r?.value || {}; all[batch] = { ...all[batch], ...patch };
  await db('settings', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { key: 'invite_batches', value: all } });
}
const tokenData = (t) => { try { return JSON.parse(Buffer.from(String(t).split('.')[0], 'base64url')); } catch { return null; } };
// Website partner form (api/partner.js): an invite to Leaflegal Platform that is NOT pre-approved (token na=1), with new-lead
// emails switched on. Returns 'has-account', 'unsubscribed', or { sent, token } (the sign-up link token). Never throws.
// Thank-you for a website partner enquiry: the two next steps. The platform invite follows as its own email.
export function partnerThanks({ email, name, company, join, call }) {
  const first = String(name || '').trim().split(' ')[0], co = String(company || '').trim().replace(/\.+$/, '');
  return notify([String(email).trim()], first ? `Thanks for your enquiry, ${first}` : 'Thanks for your enquiry', {
    title: 'Thanks for your enquiry', preheader: 'Join Leaflegal Platform now, or book a call with the team.',
    greeting: first ? `Hi ${esc(first)},` : 'Hello,',
    intro: `Thanks for your interest in becoming a Leaflegal partner${co ? ` with <b>${esc(co)}</b>` : ''}. We’ve got your details, and there are two ways to get going.`,
    tips: ['<b>Join Leaflegal Platform.</b> Your details are filled in, so setting up takes about five minutes.', '<b>Book a call.</b> Pick a time and the team will call your mobile, or meet on Google Meet.'],
    cta: { label: 'Join Leaflegal Platform', url: join }, cta2: { label: 'Book a call', url: call },
    note: 'Your platform invitation is in a separate email, so you have the link to hand.',
    footer: `You’re receiving this because ${esc(String(email).trim())} asked about becoming a Leaflegal partner on leaflegal.co.`, nav: false, replyTo: 'hello@leaflegal.co' });
}
export async function partnerInvite({ email, name, company, phone, call }) {
  try {
    const e = String(email || '').trim().toLowerCase();
    if ((await db(`brokers?email=eq.${encodeURIComponent(e)}&select=id`)).length) return 'has-account';
    if ((await suppressedSet([e])).size) return 'unsubscribed';
    const p = { e, n: String(name || '').trim().slice(0, 120), ...(company ? { c: String(company).trim().slice(0, 120) } : {}), ...(phone ? { m: String(phone).trim().slice(0, 20) } : {}), k: 'partner', na: 1 };
    const t = inviteToken(p), x = tokenData(t).x, link = `${PLATFORM_URL}/register?invite=${t}`;
    await partnerThanks({ email: e, name: p.n, company: p.c, join: link, call }).catch((err) => console.error('partner thanks', err.message));
    const sent = await sendInvite({ ...p, x, alerts: true }, link);
    await db('invites', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { email: e, name: p.n, company: p.c || null, token: t, expires_at: new Date(x).toISOString(), alerts: true, digest: false, send_at: null, email_id: typeof sent === 'string' ? sent : sent ? 'sent' : null } });
    await audit(null, 'invite-partner-form', e, { name: p.n, company: p.c });
    return { sent, token: t };
  } catch (err) { console.error('partner invite', err.message); return null; }
}
async function flushInvites(budgetMs = 40000) {
  const t0 = Date.now(), due = await db(`invites?email_id=eq.queued&send_at=lte.${new Date(Date.now() + FLUSH_AHEAD).toISOString()}&select=email,token,send_at,alerts&order=send_at.asc&limit=400`);
  let n = 0;
  for (const v of due) {
    if (Date.now() - t0 > budgetMs) break;
    const d = tokenData(v.token); if (!d) continue;
    const p = { e: d.e, n: d.n, ...(d.c ? { c: d.c } : {}), ...(d.k ? { k: d.k } : {}) }, t = inviteToken(p), x = tokenData(t).x;
    const later = new Date(v.send_at) - Date.now() > 2 * 6e4;
    const sent = await sendInvite({ ...p, x, alerts: v.alerts, at: later ? v.send_at : undefined }, `${PLATFORM_URL}/register?invite=${t}`);
    if (sent === 'suppressed') { await db(`invites?email=eq.${encodeURIComponent(v.email)}`, { method: 'DELETE' }); continue; } // unsubscribed since upload
    if (!sent) continue; // stays queued; tried again next run
    await db(`invites?email=eq.${encodeURIComponent(v.email)}`, { method: 'PATCH', body: { token: t, expires_at: new Date(x).toISOString(), email_id: typeof sent === 'string' ? sent : 'sent', ...(later ? {} : { send_at: null }) } });
    n++;
  }
  return n;
}
// "Confirm your email" (sent at signup, and again on request).
const sendVerify = (b, first = true) => notify([b.email], first ? 'Confirm your email to start using Leaflegal Platform' : 'Your Leaflegal confirmation link', {
  title: first ? `Welcome to Leaflegal, ${esc(String(b.contact_name || '').split(' ')[0] || b.company)}` : 'Confirm your email address',
  preheader: 'Confirm your email address to finish setting up your broker account.',
  intro: `${first ? `Thanks for signing up. ` : ''}Please confirm this is your email address so we know it's really you. Your broker account for <b>${esc(b.company)}</b> is ready once you do.`,
  cta: { label: 'Confirm my email address', url: verifyUrl(b.id) },
  ...(first ? { stepsTitle: 'Then finish setting up (about five minutes)',
    steps: [['Tell us what you fund', 'Add your company details and the loan sizes, purposes and business types you want.'],
      ['Choose a monthly plan', 'Plans start at £2,500 + VAT a month. New partners can take their first month for £1,000 + VAT.'],
      ['Accept the partner agreement', 'Tick the boxes to accept online. We email you a copy and keep it in your account.']] } : {}),
  note: `The link works for 7 days. If you didn't create a Leaflegal account, you can ignore this email.`, replyTo: 'hello@leaflegal.co' });
const page = (res, status, title, inner) => res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8').setHeader('Cache-Control', 'no-store').setHeader('X-Robots-Tag', 'noindex')
  .send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Leaflegal</title>
<style>body{margin:0;background:#eef3f1;font:16px/1.55 Arial,Helvetica,sans-serif;color:#1b3329}.w{max-width:560px;margin:32px auto;padding:0 16px}.c{background:#fff;border-radius:18px;overflow:hidden}
.h{background:#244237;padding:20px 28px}.b{padding:28px}h1{margin:0 0 14px;font-size:23px;color:#14271f}table{width:100%;border-collapse:collapse;background:#f4f8f6;border-radius:12px;margin:6px 0 20px}
td{padding:10px 14px;font-size:14px;vertical-align:top}td:first-child{color:#5d7a6e;width:40%}tr+tr td{border-top:1px solid #e2ebe7}a{color:#3d6656}
button{border:0;border-radius:999px;background:#244237;color:#fff;font:700 16px Arial,sans-serif;padding:14px 30px;cursor:pointer}.ok{color:#1f8a55;font-weight:700}.m{color:#5d7a6e;font-size:14px}</style></head>
<body><div class="w"><div class="c"><div class="h"><img src="https://leaflegal.co/assets/Leaflegal_Logo_White.svg" width="128" height="26" alt="Leaflegal"></div><div class="b">${inner}</div></div></div></body></html>`);
const brokerRows = (b, agreed) => `<table>${[['Firm', esc(b.company)], ['Contact', esc(b.contact_name || '–')], ['Email', `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`],
  ['Phone', esc(b.phone || '–')], ['FCA number', b.fca_number ? `${esc(b.fca_number)} · <a href="https://register.fca.org.uk/s/search?q=${encodeURIComponent(b.fca_number)}&type=Companies">check the FCA register</a>` : 'Not given'],
  ['Company number', b.company_number ? `<a href="https://find-and-update.company-information.service.gov.uk/company/${encodeURIComponent(b.company_number)}">${esc(b.company_number)}</a>` : `Not given yet · <a href="https://find-and-update.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(b.company)}">search Companies House</a>`],
  ['Email confirmed', b.email_verified_at ? 'Yes' : '<b>Not yet</b>'],
  ['Signed up', new Date(b.created_at || Date.now()).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London' })],
  ['Partner agreement', agreed === undefined ? '–' : agreed ? 'Accepted' : 'Not accepted yet'], ['Status', b.approved ? '<span class="ok">Approved</span>' : 'Waiting for approval']]
  .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;

export default async function handler(req, res) {
  if (!configured()) return fail(res, 503, 'Platform not configured');
  const action = String(req.query?.action || new URL(req.url, 'http://x').searchParams.get('action') || '');
  const raw = req.method === 'POST' ? await readRaw(req) : '';
  let body = {};
  if (action !== 'stripe' && action !== 'resend' && action !== 'approve' && action !== 'alerts-off' && action !== 'suggest-off' && action !== 'missed-off' && action !== 'invite-stop' && action !== 'rematch') { try { body = raw ? JSON.parse(raw) : {}; } catch { return fail(res, 400, 'Bad JSON'); } }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (body.id !== undefined && action !== 'admin-broker' && !(Number.isInteger(Number(body.id)) && Number(body.id) > 0)) return fail(res, 400, 'Bad id');
  if (action === 'admin-broker' && !isUuid(body.id)) return fail(res, 400, 'Bad id');
  try {
    const LIMITS = { signup: [3600, 5], coupon: [600, 15], sign: [3600, 10], checkout: [600, 20], 'test-webhook': [600, 10], 'change-plan': [600, 10] };
    if (LIMITS[action] && !(await allow(`${action}:${ip}`, ...LIMITS[action]))) return fail(res, 429, 'Too many attempts. Please wait a few minutes and try again.');
    // ------------------------------------------------ public
    // Approve link from the admin signup email (GET = confirmation page, POST = approve).
    // Public settings the pages need (the Turnstile site key is public by design).
    if (action === 'config') { res.setHeader('Cache-Control', 'public, max-age=300'); return res.json({ turnstile: turnstileSiteKey() }); }
    // Lead pricing settings for the public cost per lead calculator (/partners/cost-per-lead-calculator).
    if (action === 'pricing') { res.setHeader('Cache-Control', 'public, max-age=300'); return res.json({ pricing: await getPricing(), revenueMid: REVENUE_MID }); }

    // Unsubscribe link (and Gmail/Outlook one-click POST) in new-lead emails to brokers: turns off "Email me when a matching lead arrives".
    if (action === 'alerts-off') {
      const q = new URL(req.url, 'http://x').searchParams, id = q.get('id');
      if (!sigOk(id, q.get('exp'), q.get('sig'), 'alerts-off')) return page(res, 403, 'Link expired', `<h1>This link has expired</h1><p>Sign in to <a href="${PLATFORM_URL}/autobuy">Leaflegal Platform</a> and switch off new-lead emails under Notifications.</p>`);
      await db(`brokers?id=eq.${id}`, { method: 'PATCH', body: { notify: false } });
      await audit(id, 'alerts-off', id, { via: req.method === 'POST' ? 'one-click' : 'link' }).catch(() => {});
      return page(res, 200, 'Unsubscribed', `<h1>You're unsubscribed</h1><p>We won't email you about new leads any more. Leads you buy are still emailed to you, and new leads still appear on the platform.</p><p class="m">Changed your mind? Turn new-lead emails back on under <a href="${PLATFORM_URL}/notifications">Notifications</a>.</p>`);
    }
    if (action === 'suggest-off') {
      const q = new URL(req.url, 'http://x').searchParams, id = q.get('id');
      if (!sigOk(id, q.get('exp'), q.get('sig'), 'suggest-off')) return page(res, 403, 'Link expired', `<h1>This link has expired</h1><p>Sign in to <a href="${PLATFORM_URL}/notifications">Leaflegal Platform</a> and switch these emails off under Notifications.</p>`);
      const [b] = await db(`brokers?id=eq.${id}&select=filters`);
      if (b) await db(`brokers?id=eq.${id}`, { method: 'PATCH', body: { filters: { ...b.filters, suggest: 'off' } } });
      await audit(id, 'suggest-off', id, { via: req.method === 'POST' ? 'one-click' : 'link' }).catch(() => {});
      return page(res, 200, 'Unsubscribed', `<h1>You're unsubscribed</h1><p>We won't email you about leads outside your criteria any more. Leads that fit your criteria are handled as before.</p><p class="m">Changed your mind? Turn these emails back on under <a href="${PLATFORM_URL}/notifications">Notifications</a>.</p>`);
    }

    // "Match me with a different broker" link for a business already matched (follow-up email, thank-you page).
    // GET = confirmation page; only its button (a POST) re-matches, so email scanners that open links can't.
    if (action === 'rematch') {
      const q = new URL(req.url, 'http://x').searchParams, id = q.get('id');
      if (!sigOk(id, q.get('exp'), q.get('sig'), 'rematch')) return page(res, 403, 'Link expired', `<h1>This link has expired</h1><p>Email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a> and we'll match you with a different broker.</p>`);
      if (req.method !== 'POST') return page(res, 200, 'A different broker', `<h1>Match me with a different broker</h1><p>We'll pass your enquiry to another of our brokers, using the details you gave us. Your current broker won't be sent it again.</p><form method="post"><button type="submit">Match me with someone else</button></form><p class="m">No obligation, as before.</p>`);
      const r = await rematchLead(Number(id));
      if (r.error === 'done') return page(res, 200, 'Already done', `<h1>We're already on it</h1><p>You've already asked for a different broker. If nobody has been in touch, email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a>.</p>`);
      if (r.error || r.duplicateOf) return page(res, 200, 'Something went wrong', `<h1>We couldn't do that automatically</h1><p>Please email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a> and we'll match you with a different broker.</p>`);
      await audit(null, 'lead-rematch', String(id), { lead: r.id, buyer: r.buyer || undefined }).catch(() => {});
      return page(res, 200, 'Done', r.match
        ? `<h1>You've been matched with ${esc(r.match.company)}</h1><p>${esc(r.match.person || 'They')} will be in touch shortly, usually by phone. We've emailed you their details.</p>`
        : `<h1>Thanks, we're on it</h1><p>We're passing your enquiry to a different broker. They'll be in touch shortly, usually by phone, and we'll email you their details.</p>`);
    }
    if (action === 'missed-off') {
      const q = new URL(req.url, 'http://x').searchParams, id = q.get('id');
      if (!sigOk(id, q.get('exp'), q.get('sig'), 'missed-off')) return page(res, 403, 'Link expired', `<h1>This link has expired</h1><p>Sign in to <a href="${PLATFORM_URL}/notifications">Leaflegal Platform</a> and switch these emails off under Notifications.</p>`);
      const [b] = await db(`brokers?id=eq.${id}&select=filters`);
      if (b) await db(`brokers?id=eq.${id}`, { method: 'PATCH', body: { filters: { ...b.filters, missed: 'off' } } });
      await audit(id, 'missed-off', id, { via: req.method === 'POST' ? 'one-click' : 'link' }).catch(() => {});
      return page(res, 200, 'Unsubscribed', `<h1>You're unsubscribed</h1><p>We won't email you a daily list of leads auto-buy skipped any more. Auto-buy carries on as before.</p><p class="m">Changed your mind? Turn these emails back on under <a href="${PLATFORM_URL}/notifications">Notifications</a>.</p>`);
    }

    // Daily job (vercel.json crons): adds credits for invoiced plans that are due. Idempotent, so it needs no secret.
    if (action === 'cron-plans') {
      const due = await db(`brokers?plan->>next_at=lte.${new Date().toISOString()}&suspended_at=is.null&select=id,email,company,plan`);
      let n = 0; for (const b of due) n += (await grantPlan(b).catch((e) => (console.error('plan', b.id, e.message), { given: 0 }))).given;
      const digests = await suggestDigest().catch((e) => (console.error('digest', e.message), 0)); // daily summaries of leads outside criteria
      const missed = await missedDigest().catch((e) => (console.error('missed', e.message), 0)); // auto-buy brokers: leads their criteria skipped
      const roundups = await inviteDigest().catch((e) => (console.error('invite digest', e.message), 0)); // Mondays: weekly leads for bulk invitees
      const invited = await flushInvites().catch((e) => (console.error('invite queue', e.message), 0)); // queued bulk invites due in the next 72h
      return res.json({ ok: true, brokers: due.length, credits: n, digests, missed, roundups, invited });
    }

    // Partner form → platform sign-up: decrypts the hand-off token so /register can prefill the form.
    if (action === 'handoff') {
      const o = openHandoff(new URL(req.url, 'http://x').searchParams.get('h'));
      res.setHeader('Cache-Control', 'no-store');
      return res.json(o ? { company: o.company || '', contactName: o.contactName || '', email: o.email || '', phone: o.phone || '', volume: o.volume || '' } : {});
    }

    // "Stop these emails" link in the new-lead emails sent to invited firms who haven't signed up yet.
    if (action === 'invite-stop') {
      const t = new URL(req.url, 'http://x').searchParams.get('t') || '';
      const [v] = t.length > 20 ? await db(`invites?token=eq.${encodeURIComponent(t)}&select=email`) : [];
      const email = v?.email || (readInvite(t) || tokenData(t) || {}).e; // still works after the invite is deleted or has expired
      if (v) await db(`invites?token=eq.${encodeURIComponent(t)}`, { method: 'PATCH', body: { alerts: false } });
      if (email) { await suppress(email, req.method === 'POST' ? 'One-click unsubscribe' : 'Unsubscribe link', 'invite'); await audit(null, 'unsubscribe', email, { from: 'invite' });
        await markNotInterested(email).catch((x) => console.error('crm not interested', x.message)); }
      return page(res, email ? 200 : 404, 'Unsubscribed', email ? '<h1>You’re unsubscribed</h1><p>We won’t email you again. If you ever decide to join Leaflegal, you’re welcome to sign up at <a href="https://platform.leaflegal.co/register">platform.leaflegal.co</a>.</p>'
        : '<h1>We couldn\'t find that invitation</h1><p>If you\'re still getting emails, reply to one and we\'ll stop them.</p>');
    }

    // Confirm-your-email link: marks the address as confirmed, then opens the platform.
    if (action === 'verify-email') {
      const q = new URL(req.url, 'http://x').searchParams, id = q.get('id');
      if (!sigOk(id, q.get('exp'), q.get('sig'), 'verify-email')) return page(res, 403, 'Link expired', `<h1>This link has expired</h1><p>Sign in to <a href="${PLATFORM_URL}/signin">Leaflegal Platform</a> and we'll send you a new one.</p>`);
      await db(`brokers?id=eq.${id}&email_verified_at=is.null`, { method: 'PATCH', body: { email_verified_at: new Date().toISOString() } });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(302).setHeader('Location', `${PLATFORM_URL}/onboarding?verified=1`).end();
    }

    if (action === 'approve') {
      const q = new URL(req.url, 'http://x').searchParams, id = q.get('id'), exp = q.get('exp'), sig = q.get('sig');
      if (!sigOk(id, exp, sig)) return page(res, 403, 'Link expired', `<h1>This link has expired</h1><p>Approve the firm from Admin → Clients on <a href="${PLATFORM_URL}/admin">Leaflegal Platform</a> instead.</p>`);
      const [b] = await db(`brokers?id=eq.${id}&select=*`);
      if (!b) return page(res, 404, 'Not found', '<h1>Firm not found</h1><p>This account may have been deleted.</p>');
      const agreed = await signed(id).catch(() => false);
      if (req.method === 'POST') {
        if (!(await allow(`approve:${ip}`, 600, 20))) return page(res, 429, 'Too many attempts', '<h1>Too many attempts</h1><p>Please wait a few minutes.</p>');
        const changed = await setApproved(b, true, null);
        return page(res, 200, 'Approved', `<h1>${esc(b.company)} is approved</h1><p class="ok">${changed ? `We've emailed ${esc(b.email)} to let them know they can start buying leads.` : 'They were already approved.'}</p>${brokerRows({ ...b, approved: true }, agreed)}<p class="m"><a href="${PLATFORM_URL}/admin">Open the Admin panel</a></p>`);
      }
      return page(res, 200, `Approve ${b.company}`, `<h1>Approve ${esc(b.company)}?</h1>${brokerRows(b, agreed)}${b.approved ? '<p class="ok">Already approved. Nothing to do.</p>'
        : `<form method="post"><button type="submit">Approve and email them</button></form><p class="m">They'll be able to buy leads straight away${agreed ? '' : ' once they accept the partner agreement'}.</p>`}`);
    }

    // Resend → hard bounces and spam complaints go on the suppression list, so nothing is sent to them again.
    if (action === 'resend') {
      if (!verifyResend(raw, req.headers, process.env.RESEND_WEBHOOK_SECRET)) return fail(res, 400, 'Bad signature');
      const ev = JSON.parse(raw), d = ev.data || {};
      const hard = ev.type === 'email.bounced' && !/transient|undetermined/i.test(d.bounce?.type || '');
      const why = hard ? `Bounced: ${String(d.bounce?.message || d.bounce?.subType || 'hard bounce').slice(0, 200)}`
        : ev.type === 'email.complained' ? 'Marked as spam' : ev.type === 'email.suppressed' ? 'On Resend’s suppression list (earlier bounce or complaint)' : '';
      if (why) for (const e of [].concat(d.to || [])) await suppress(e, why, 'resend');
      return res.status(200).json({ received: true });
    }

    if (action === 'stripe') {
      if (!verifyStripe(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET || '')) return fail(res, 400, 'Bad signature');
      const ev = JSON.parse(raw), o = ev.data.object;
      if (ev.type === 'checkout.session.completed') {
        const broker = o.metadata?.broker;
        if (isUuid(broker) && o.customer) await db(`brokers?id=eq.${broker}`, { method: 'PATCH', body: { stripe_customer: o.customer, ...(o.metadata?.trial ? { trial_used: true } : {}) } });
      }
      if (ev.type === 'invoice.paid') {
        const m = o.parent?.subscription_details?.metadata || o.subscription_details?.metadata || o.lines?.data?.[0]?.metadata || {};
        const first = o.billing_reason === 'subscription_create';
        const credits = first && m.trial_credits ? Number(m.trial_credits) : Number(m.credits);
        if (isUuid(m.broker) && credits && o.amount_paid > 0) {
          if (first) db(`brokers?id=eq.${m.broker}&select=email,company,contact_name`).then(([x]) => x && crmCapture({ email: x.email, name: x.contact_name, company: x.company, brokerId: m.broker, stage: 'won', note: `Started the ${m.pack || 'monthly'} plan` })).catch((e) => console.error('crm won', e.message));
          const added = await rpc('add_credits', { p_broker: m.broker, p_delta: credits, p_reason: first && m.trial_credits ? 'First month offer' : `${m.pack} monthly plan`, p_ref: o.id });
          if (added) await pendingBacklog(m.broker).catch((e) => console.error('backlog', e.message));
          const [b] = added ? await db(`brokers?id=eq.${m.broker}&select=email,company,credits,contact_name,phone`) : [];
          if (b) {
            const tax = Array.isArray(o.total_taxes) ? o.total_taxes.reduce((a, t) => a + (t.amount || 0), 0) : o.tax || 0;
            const next = o.lines?.data?.[0]?.period?.end;
            const kind = first ? 'first' : o.billing_reason === 'subscription_update' ? 'change' : 'renewal';
            // First ever paid invoice for this firm (a resubscribe after cancelling doesn't count).
            const prior = await db(`ledger?broker=eq.${m.broker}&ref=like.in_*&ref=neq.${encodeURIComponent(o.id)}&select=id&limit=1`).catch(() => [1]);
            if (!prior?.length) await notify(ADMIN_TO(), `First payment: ${b.company} (${pounds2(o.amount_paid)})`, {
              title: `${b.company} just paid for the first time`, signoff: false,
              intro: `${esc(b.contact_name || b.email)} started the ${esc(first && m.trial_credits ? 'first month offer' : m.pack || 'monthly')} plan.`,
              highlight: { value: pounds2(o.amount_paid), label: 'paid (inc VAT)' },
              rows: [['Firm', b.company], ['Contact', b.contact_name || '–'], ['Email', b.email], ['Phone', b.phone || '–'], ['Plan', first && m.trial_credits ? 'First month offer' : m.pack], ['Credits added', credits.toLocaleString('en-GB')], ['Invoice', o.number || '–']],
              cta: { label: 'Open Admin', url: `${PLATFORM_URL}/admin` }, replyTo: b.email }).catch((e) => console.error('first pay alert', e.message));
            if (first) { const [fn, ...ln] = String(b.contact_name || '').trim().split(/\s+/);
              await metaEvent('Subscribe', { email: b.email, company: b.company, phone: b.phone, first: fn, last: ln.join(' '), page: `${PLATFORM_URL}/billing`, eventId: `sub-${o.id}`,
                custom: { value: (o.amount_paid - tax) / 100, currency: 'GBP', content_name: m.trial_credits ? 'First month offer' : m.pack } }); }
            await notify([b.email], kind === 'first' ? `Welcome to Leaflegal: ${credits.toLocaleString('en-GB')} credits added` : kind === 'change' ? `Plan updated: ${credits.toLocaleString('en-GB')} credits added` : `Your Leaflegal plan has renewed: ${credits.toLocaleString('en-GB')} credits added`, {
              title: kind === 'first' ? 'Payment received: you’re ready to buy leads' : kind === 'change' ? 'Your plan change is complete' : 'Your plan has renewed',
              preheader: `${credits.toLocaleString('en-GB')} credits added. Your new balance is ${b.credits.toLocaleString('en-GB')} credits.`,
              intro: kind === 'first' ? `Thanks for your payment. Your credits are on ${esc(b.company)}'s account and you can start buying leads as soon as your firm is approved, usually within one working day.`
                : kind === 'change' ? `Thanks for your payment. Your new plan is active and its credits have been added to ${esc(b.company)}'s account.`
                : `Your monthly payment has gone through and this month's credits have been added to ${esc(b.company)}'s account. Unused credits roll over while you stay subscribed.`,
              highlight: { value: `${credits.toLocaleString('en-GB')} credits added`, label: `New balance: ${b.credits.toLocaleString('en-GB')} credits` },
              rowsTitle: 'Payment details',
              ...(kind === 'first' ? { stepsTitle: 'Getting your first leads', steps: [
                ['Check your lead criteria', 'Set the loan sizes, revenue, purposes and trading time you want under Auto-buy.'],
                ['Choose manual or auto-buy', 'Buy leads yourself from Opportunities, or let auto-buy take matching leads the moment they arrive, within your daily and monthly limits.'],
                ['Connect your CRM (optional)', 'Add a webhook under Auto-buy to send every lead straight to HubSpot, Pipedrive, Zapier, Make or your own system.']] } : {}),
              rows: [['Plan', first && m.trial_credits ? 'First month offer (then Starter)' : m.pack], ['Credits added', credits.toLocaleString('en-GB')], ['New balance', `${b.credits.toLocaleString('en-GB')} credits`],
                ['Amount (ex VAT)', pounds2(o.amount_paid - tax)], ['VAT', pounds2(tax)], ['Total paid', pounds2(o.amount_paid)],
                ['Invoice', o.number || '–'], ...(next ? [['Next renewal', new Date(next * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })]] : [])],
              cta: o.hosted_invoice_url ? { label: 'View or download invoice', url: o.hosted_invoice_url } : { label: 'Go to Billing', url: `${PLATFORM_URL}/billing` },
              note: 'You can see all invoices, change your plan or cancel any time under Billing on the platform.' });
          }
        }
      }
      // Card declined at renewal or upgrade.
      if (ev.type === 'invoice.payment_failed') {
        const [b] = o.customer ? await db(`brokers?stripe_customer=eq.${encodeURIComponent(o.customer)}&select=email,company`) : [];
        if (b) await notify([b.email], 'Action needed: your Leaflegal payment failed', {
          title: 'We couldn’t take your payment',
          preheader: `Your payment of ${pounds2(o.amount_due)} didn't go through. Update your card to keep receiving leads.`,
          intro: `Your monthly payment for ${esc(b.company)} didn't go through, so this month's credits haven't been added yet. This usually happens when a card has expired, been replaced or hit its limit.`,
          highlight: { value: pounds2(o.amount_due), label: 'payment due' },
          stepsTitle: 'How to fix it',
          steps: [['Pay the invoice or update your card', 'Use the button below, or go to Billing and choose “Update card or billing details”.'],
            ['Your credits are added straight away', 'As soon as the payment goes through, your credits land on your account and auto-buy picks up where it left off.']],
          cta: { label: o.hosted_invoice_url ? 'Pay this invoice' : 'Update card', url: o.hosted_invoice_url || `${PLATFORM_URL}/billing` },
          note: 'Stripe will also retry the payment automatically over the next few days. If it keeps failing, your subscription will end and any unused credits will expire.' });
      }
      const byCustomer = async (cus, cols = 'id,email,company,credits') => (cus ? (await db(`brokers?stripe_customer=eq.${encodeURIComponent(cus)}&select=${cols}`))[0] : null);
      // Cancel / un-cancel, from our Billing page or Stripe's customer portal: the one place these emails are sent.
      if (ev.type === 'customer.subscription.updated' && 'cancel_at_period_end' in (ev.data.previous_attributes || {})) {
        const b = await byCustomer(o.customer, 'id,email,company,credits,contact_name,phone');
        const end = (o.current_period_end || o.items?.data?.[0]?.current_period_end) ? new Date((o.current_period_end || o.items.data[0].current_period_end) * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'the end of your billing month';
        if (b) {
          await notify([b.email], o.cancel_at_period_end ? 'Your Leaflegal subscription has been cancelled' : 'Your Leaflegal subscription will continue', o.cancel_at_period_end
            ? { title: 'Your subscription has been cancelled', preheader: `Your plan stays active until ${end}. You won't be charged again.`,
                intro: `We're sorry to see ${esc(b.company)} go. Your plan stays active until the end of the current period, so you can keep buying leads with your remaining credits until then.`,
                highlight: { value: end, label: 'your plan ends on this date' },
                tipsTitle: 'What this means', tips: [`You won't be charged again.`, `You can use your ${b.credits.toLocaleString('en-GB')} remaining credits until ${esc(end)}. Any left after that expire.`, 'Your account, lead history and notes are kept, so you can restart any time.'],
                cta: { label: 'Keep my plan', url: `${PLATFORM_URL}/billing` },
                note: 'If something wasn’t working for you, we’d genuinely like to hear about it. Just reply to this email.' }
            : { title: 'Your subscription will continue', preheader: `Good news: your plan will renew on ${end}.`,
                intro: `Your plan for ${esc(b.company)} is no longer cancelled. Nothing changes: you keep your credits, settings and lead history, and your plan renews as normal.`,
                highlight: { value: end, label: 'next renewal date' },
                cta: { label: 'View billing', url: `${PLATFORM_URL}/billing` } });
          // Their reason, if they cancelled from our Billing page in the last hour (none from Stripe's portal).
          const [fb] = o.cancel_at_period_end ? await db(`audit_log?action=eq.cancel-feedback&target=eq.${b.id}&at=gte.${new Date(Date.now() - 36e5).toISOString()}&select=detail&order=at.desc&limit=1`).catch(() => []) : [];
          const why = fb?.detail?.reason ? `${fb.detail.reason}${fb.detail.feedback ? `. ${fb.detail.feedback}` : ''}` : 'Not given (cancelled outside the platform)';
          if (o.cancel_at_period_end) await Promise.allSettled(String(process.env.ADMIN_WHATSAPP || '').split(',').filter(Boolean).map((to) => waOrSms(to, 'leaflegal_cancel_alert',
            { name: b.contact_name || '–', company: b.company, mobile: b.phone || '–', email: b.email, ends: end, reason: why.slice(0, 500) },
            `Leaflegal: ${b.company} cancelled their subscription. ${b.contact_name || ''} ${b.phone || ''} ${b.email}. Ends ${end}. Reason: ${why}`.replace(/\s+/g, ' ').slice(0, 600), `cancel-${b.id}-${Date.now()}`)));
          await notify(ADMIN_TO(), `Subscription ${o.cancel_at_period_end ? 'cancelled' : 'resumed'}: ${b.company}`, {
            title: `${b.company} ${o.cancel_at_period_end ? 'cancelled their plan' : 'resumed their plan'}`, signoff: false,
            intro: o.cancel_at_period_end ? 'They cancelled from Billing or the Stripe customer portal. Their plan stays active until the end of the paid period.' : 'They took back their cancellation, so their plan will renew as normal.',
            highlight: { value: end, label: o.cancel_at_period_end ? 'plan ends' : 'next renewal' },
            rows: [['Firm', b.company], ['Contact', b.contact_name || '–'], ['Phone', b.phone || '–'], ['Email', b.email], ['Credits left', `${b.credits.toLocaleString('en-GB')}`],
              ...(o.cancel_at_period_end ? [['Reason', fb?.detail?.reason || 'Not given'], ...(fb?.detail?.feedback ? [['Feedback', fb.detail.feedback]] : [])] : [])],
            cta: { label: 'Open Admin', url: `${PLATFORM_URL}/admin` }, replyTo: b.email });
        }
      }
      // Bank needs extra approval (3D Secure) for a renewal or upgrade.
      if (ev.type === 'invoice.payment_action_required') {
        const b = await byCustomer(o.customer);
        if (b) await notify([b.email], 'Action needed: approve your Leaflegal payment', {
          title: 'Your bank needs you to approve this payment', preheader: `Approve your ${pounds2(o.amount_due)} payment so your credits can be added.`,
          intro: `Your bank has asked you to confirm the latest payment for ${esc(b.company)}. This is a standard security check (sometimes called 3D Secure) and only takes a moment.`,
          highlight: { value: pounds2(o.amount_due), label: 'waiting for your approval' },
          steps: [['Open the payment page', 'Use the button below. You may be asked to confirm in your banking app or with a code.'], ['Your credits are added', 'As soon as your bank approves the payment, your credits land on your account.']],
          stepsTitle: 'What to do',
          cta: { label: 'Approve payment', url: o.hosted_invoice_url || `${PLATFORM_URL}/billing` } });
      }
      // Money back or a chargeback: tell the admin (credits are adjusted by hand in Admin → Clients).
      if (ev.type === 'charge.refunded' || ev.type === 'charge.dispute.created') {
        let cus = o.customer || (o.charge && typeof o.charge === 'object' ? o.charge.customer : null);
        if (!cus && typeof o.charge === 'string') cus = (await stripe(`charges/${encodeURIComponent(o.charge)}`, null, 'GET').catch(() => ({}))).customer;
        const b = cus ? await byCustomer(cus, 'id,email,company,credits,approved,mode,stripe_customer') : null;
        // A chargeback pauses the account straight away, so disputed credits can't be spent on leads.
        if (b && ev.type === 'charge.dispute.created' && b.approved) await setApproved(b, false, null);
        const amt = ev.type === 'charge.refunded' ? o.amount_refunded : o.amount;
        await notify(ADMIN_TO(), `${ev.type === 'charge.refunded' ? 'Refund issued' : 'CHARGEBACK opened'}: ${b?.company || 'unknown client'} (${pounds2(amt)})`, {
          title: ev.type === 'charge.refunded' ? 'A refund was issued in Stripe' : 'A payment has been disputed (chargeback)', signoff: false,
          intro: `${esc(b?.company || 'An unknown customer')}${b ? ` (${esc(b.email)})` : ''}. Their credits were <b>not</b> changed automatically.`,
          highlight: { value: pounds2(amt), label: ev.type === 'charge.refunded' ? 'refunded' : 'disputed' },
          ...(b ? { rows: [['Firm', b.company], ['Email', b.email], ['Credits now', `${b.credits.toLocaleString('en-GB')}`]] } : {}),
          tips: ['Adjust their credits in Admin → Clients if needed.', ...(ev.type === 'charge.dispute.created' ? ['Their account has been paused automatically, so they can’t buy leads. Re-approve them in Admin → Clients once it’s resolved.', 'Respond to the dispute in Stripe before the deadline.'] : [])],
          cta: { label: 'Open Admin', url: `${PLATFORM_URL}/admin` } });
      }
      // Subscription has fully ended: unused credits expire (partner agreement clause 4.3).
      if (ev.type === 'customer.subscription.deleted') {
        const [b] = o.customer ? await db(`brokers?stripe_customer=eq.${encodeURIComponent(o.customer)}&select=id,email,company,credits`) : [];
        if (b) {
          if (b.credits > 0) await rpc('add_credits', { p_broker: b.id, p_delta: -b.credits, p_reason: 'Unused credits expired: plan ended', p_ref: `expire-${o.id}` });
          await notify([b.email], 'Your Leaflegal subscription has ended', {
            title: 'Your subscription has ended', preheader: `Your Leaflegal plan has ended. You can restart any time.`,
            intro: `The ${esc(o.metadata?.pack || '')} plan for ${esc(b.company)} has now ended${b.credits > 0 ? ` and the ${b.credits.toLocaleString('en-GB')} unused credits have expired` : ''}. You won't be charged again, and auto-buy has stopped.`,
            tipsTitle: 'What we’ve kept for you', tips: ['Every lead you bought, with contact details, notes and stages.', 'Your lead criteria, auto-buy limits and CRM settings.', 'Your partner agreement and invoices.'],
            cta: { label: 'Restart your plan', url: `${PLATFORM_URL}/billing` },
            note: 'Restarting takes a minute and your credits are added as soon as you pay. Thanks for working with us.' });
          await notify(ADMIN_TO(), `Subscription ended: ${b.company}`, {
            title: `${b.company}'s subscription has ended`, signoff: false, intro: 'Their plan has finished, auto-buy has stopped and any unused credits have expired.',
            rows: [['Firm', b.company], ['Email', b.email], ['Credits expired', `${b.credits.toLocaleString('en-GB')}`]],
            cta: { label: 'Open Admin', url: `${PLATFORM_URL}/admin` }, replyTo: b.email });
        }
      }
      return res.status(200).json({ received: true });
    }

    if (action === 'terms') return res.json({ version: TERMS_VERSION, html: termsHtml() });

    // Team invite link (/join?t=…): GET shows who invited them, POST creates their sign-in.
    if (action === 'join') {
      const t = String(body.t || new URL(req.url, 'http://x').searchParams.get('t') || '');
      const [m] = /^[a-f0-9]{48}$/.test(t) ? await db(`team_members?token=eq.${t}&removed_at=is.null&joined_at=is.null&select=*`) : [];
      if (!m || Date.now() - new Date(m.invited_at) > INVITE_DAYS * 864e5) return fail(res, 404, 'This invite has expired or was already used. Ask for a new one.');
      const [owner] = await db(`brokers?id=eq.${m.broker}&select=company`);
      if (req.method !== 'POST') return res.json({ email: m.email, name: m.name, company: owner?.company || '' });
      const weak = pwProblem(body.password); if (weak) return fail(res, 400, `Your password needs ${weak}`);
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { method: 'POST', headers: { apikey: secretKey(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: m.email, password: body.password, email_confirm: true }) });
      const u = await r.json();
      if (!r.ok) return fail(res, 400, /already/i.test(u.msg || u.message || '') ? 'This email already has a Leaflegal sign-in. Ask for the invite to go to a different email.' : 'Could not create the sign-in');
      await db(`team_members?id=eq.${m.id}`, { method: 'PATCH', body: { user_id: u.id, joined_at: new Date().toISOString(), token: null, name: String(body.name || m.name || '').trim().slice(0, 120) || null } });
      await audit(null, 'team-joined', m.broker, { email: m.email });
      return res.json({ ok: true, email: m.email });
    }

    if (action === 'signup') {
      if (body.website) return res.status(200).json({ ok: true }); // honeypot: bots get a fake success
      const email = String(body.email || '').trim().toLowerCase(), company = String(body.company || '').trim().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return fail(res, 400, 'Please enter a valid email address');
      const weak = pwProblem(body.password); if (weak) return fail(res, 400, `Your password needs ${weak}`);
      if (!company) return fail(res, 400, 'Please enter your firm name');
      if (!/^(\+44|0044|0)7\d{9}$/.test(String(body.phone || '').replace(/[\s()-]/g, ''))) return fail(res, 400, 'Please enter your mobile number, e.g. 07700 900123');
      const inv = readInvite(body.invite);
      // Invited firms are pre-approved (their email is already proven), as long as the invite hasn't been deleted in Admin.
      const invited = !!inv && inv.e === email && (await db(`invites?email=eq.${encodeURIComponent(email)}&select=token`).catch(() => [])).some((v) => v.token === body.invite);
      const approve = invited && !inv.na; // website partner-form invites (na=1) still need approving
      if (!invited && !(await human(body.turnstile, ip))) return fail(res, 400, 'Please confirm you’re not a robot, then try again.');
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST', headers: { apikey: secretKey(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: body.password, email_confirm: true }),
      });
      const u = await r.json();
      if (!r.ok) console.error('signup', r.status, JSON.stringify(u).slice(0, 300));
      if (!r.ok) return fail(res, 400, /already/i.test(u.msg || u.message || '') ? 'An account with this email already exists. Please sign in.' : 'Could not create the account');
      await unsuppress(email); // registering overrides an earlier unsubscribe
      const [fn, ...ln] = String(body.contactName || '').trim().split(/\s+/);
      await metaEvent('PartnerInterest', { req, email, phone: body.phone, first: fn, last: ln.join(' '), page: 'https://platform.leaflegal.co/register', fbp: body.fbp,
        custom: { content_name: invited ? 'Platform signup (invited)' : 'Platform signup' } });
      await metaEvent('PartnerRegistered', { req, email, company, phone: body.phone, first: fn, last: ln.join(' '), page: 'https://platform.leaflegal.co/register', fbp: body.fbp, eventId: `reg-${u.id}`,
        custom: { content_name: invited ? 'Platform signup (invited)' : 'Platform signup' } });
      await db('brokers', { method: 'POST', body: {
        id: u.id, email, company, contact_name: String(body.contactName || '').slice(0, 120), phone: String(body.phone || '').slice(0, 40),
        fca_number: String(body.fca || '').slice(0, 20) || null, ...(invited ? { email_verified_at: new Date().toISOString() } : {}), ...(approve ? { approved: true } : {}),
      } });
      const fca = String(body.fca || '').slice(0, 20), contact = String(body.contactName || '').slice(0, 120), phone = String(body.phone || '').slice(0, 40);
      await crmCapture({ email, name: contact, company, phone, brokerId: u.id, stage: 'onboarding', source: invited ? 'Invited to platform' : 'Platform sign-up',
        note: invited ? 'Accepted their platform invite and created an account' : 'Created a Leaflegal Platform account' }).catch((e) => console.error('crm signup', e.message));
      if (invited) {
        await audit(null, 'invite-accepted', u.id, { email });
        await db(`invites?email=eq.${encodeURIComponent(email)}`, { method: 'PATCH', body: { email_id: 'accepted', alerts: false } }).catch(() => {}); // kept so Admin → Invites can track who joined
      }
      if (approve) {
        await notify(ADMIN_TO(), `${company} accepted your invite`, { title: `${company} has joined`, preheader: `${contact || email} accepted your supplier invite and is setting up.`,
          intro: 'They accepted your invitation, so their account is already approved. They still need to choose a plan and accept the partner agreement before they can buy.',
          rows: [['Firm', company], ['Contact', contact || '–'], ['Email', email], ['Phone', phone || '–'], ['FCA number', fca || 'Not given']], cta: { label: 'Open Admin → Clients', url: `${PLATFORM_URL}/admin` }, replyTo: email });
        return res.status(200).json({ ok: true });
      }
      await notify(ADMIN_TO(), `New broker signup to approve: ${company}`, {
        title: `${company} has signed up`, preheader: `${contact || email} · ${fca ? `FCA ${fca}` : 'no FCA number'} · waiting for your approval`,
        intro: 'A new broker firm has created a Leaflegal Platform account. Check them over, then approve them so they can buy leads.',
        rowsTitle: 'Their details',
        rows: [['Firm', company], ['Contact', contact || '–'], ['Email', email], ['Phone', phone || '–'], ['FCA number', fca || 'Not given'],
          ['Signed up', new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London' })]],
        tipsTitle: 'Quick checks',
        tips: [fca ? `<a href="https://register.fca.org.uk/s/search?q=${encodeURIComponent(fca)}&type=Companies" style="color:#3d6656">Look up FCA ${esc(fca)} on the FCA register</a>` : 'No FCA number given: ask them if their work needs authorisation.',
          `<a href="https://find-and-update.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(company)}" style="color:#3d6656">Search for ${esc(company)} on Companies House</a>`,
          'They still need to choose a plan and accept the partner agreement before they can buy.'],
        cta: { label: 'Review and approve', url: approveUrl(u.id) },
        link: { label: 'Or open Admin → Clients', url: `${PLATFORM_URL}/admin` },
        note: 'The button opens a confirmation page showing their latest details, with an Approve button. The link works for 14 days.', replyTo: email });
      if (!invited) await sendVerify({ id: u.id, email, company, contact_name: String(body.contactName || '') }); // invite links already proved the email
      return res.status(200).json({ ok: true });
    }

    // ------------------------------------------------ signed in
    const user = await authUser(req);
    if (!user) return fail(res, 401, 'Please sign in');
    let [me] = await db(`brokers?id=eq.${user.id}&select=*`), member = null;
    if (!me) { // a team member: works on the owner's account, never with admin rights
      [member] = await db(`team_members?user_id=eq.${user.id}&removed_at=is.null&select=*`);
      if (member) { const [owner] = await db(`brokers?id=eq.${member.broker}&select=*`); me = owner && { ...owner, is_admin: false }; }
    }
    if (!me) return fail(res, 403, 'No broker account');
    const can = (p) => !member || !!member.perms?.[p];
    if (NEED[action] && !can(NEED[action])) return fail(res, 403, 'Your sign-in doesn’t have permission for this. Ask the account owner.');
    // Admins can edit a broker's own profile, settings and team for them (?as=<broker id>). Only these actions, always logged.
    const asId = new URL(req.url, 'http://x').searchParams.get('as');
    if (asId) {
      if (!me.is_admin) return fail(res, 403, 'Admins only');
      if (!['profile', 'profile-logo', 'profile-preview', 'profile-scan', 'settings', 'team', 'team-invite', 'team-update', 'team-remove'].includes(action) || !isUuid(asId)) return fail(res, 400, 'Not allowed');
      const [target] = await db(`brokers?id=eq.${asId}&select=*`);
      if (!target) return fail(res, 404, 'Broker not found');
      if (action !== 'profile-preview' && action !== 'profile-scan') await audit(me.id, `edit-${action}`, asId, { company: target.company });
      me = target;
    }
    const uid = me.id;
    // Commission clients: Leaflegal assigns their leads and sets their auto-buy rules. Admins editing for them (?as=) are not restricted.
    const restricted = !!me.plan?.commission && !asId;
    if (!me.email_verified_at && action !== 'me') {
      if (action === 'resend-verify' && req.method === 'POST') {
        if (!(await allow(`verify:${uid}`, 3600, 3))) return fail(res, 429, 'We’ve sent a few already. Please check your inbox and spam folder.');
        await sendVerify(me, false); return res.json({ ok: true });
      }
      return res.status(403).json({ error: 'Please confirm your email address first. We’ve sent you a link.', code: 'unverified' });
    }

    if (action === 'me') {
      const { stripe_customer, ...pub } = me;
      if (pub.plan?.commission) { const { commission, ...plan } = pub.plan; pub.plan = plan; } // admin-only flag
      const [P, [ag], avgLead] = await Promise.all([getPricing(), db(`agreements?broker=eq.${uid}&select=id,version,created_at&order=created_at.desc&limit=1`), avgLeadPrice()]);
      pub.agreement = ag || null; pub.agreementWaived = (await waivedIds()).has(uid); pub.agreementCurrent = ag?.version === TERMS_VERSION || pub.agreementWaived;
      if (me.filters?.tiers?.length) pub.tierSpend = await tierSpend(me).catch(() => null);
      if (onTiers(me)) pub.tierUsed = Object.fromEntries(await Promise.all(TIER_NAMES.map(async (t) => [t, await tierSpendOf(me, t).catch(() => 0)])));
      pub.restricted = restricted;
      pub.member = member ? { id: member.id, email: member.email, name: member.name, perms: cleanPerms(member.perms) } : null;
      pub.trialEligible = !me.trial_used && !me.stripe_customer; // anyone who has ever paid has a Stripe customer
      return res.json({ broker: { ...pub, billing: !!stripe_customer }, tiers: { names: TIER_NAMES, prices: await getTierPrices() }, lowCredits: LOW_CREDITS, packs: PACKS, custom: CUSTOM, trial: TRIAL, termsVersion: TERMS_VERSION, pricing: { ...P, revenueMid: REVENUE_MID, avgLead }, options: { turnovers: TURNOVERS, trading: TRADING, purposes: PURPOSES, property: PROPERTY, structures: STRUCTURES, returnReasons: RETURN_REASONS, cancelReasons: CANCEL_REASONS, returnHours: RETURN_HOURS } });
    }

    if (action === 'opportunities') {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const leads = await db(`leads?buyer=is.null&hidden_at=is.null&exclude_brokers=not.cs.{${uid}}&or=(created_at.gte.${since},price_fixed.is.true)&select=${PREVIEW_SELECT}&order=created_at.desc&limit=200`);
      return res.json({ discount: DISCOUNT, preview: !me.approved, leads: leads.map((l) => asPriced(l, me)).filter((l) => l.price != null).map((l) => { const v = withMask(l, me.approved); return { ...v, quality: quality(l), match: matches(critOf(me), v) }; }) });
    }

    // Auto-buy page: leads from the last 30 days that the saved criteria would have skipped, and what held them back.
    if (action === 'missed') {
      const since = new Date(Math.max(Date.now() - 30 * 864e5, new Date(me.created_at).getTime())).toISOString();
      const leads = (await db(`leads?created_at=gte.${since}&select=${PREVIEW},buyer,exclude_brokers&order=created_at.desc&limit=2000`)).filter((l) => !excluded(l, uid));
      const S = missedSummary(me, leads);
      return res.json({ days: 30, total: leads.length, missed: S.missed.length, sold: S.sold, mine: S.mine, live: S.live, groups: S.groups.slice(0, 8) });
    }

    if (action === 'leads') {
      const leads = await db(`leads?buyer=eq.${uid}&select=${FULL}&order=bought_at.desc&limit=5000`);
      const ids = leads.map((l) => l.id).join(',');
      const [notes, rets] = ids ? await Promise.all([
        db(`lead_notes?lead_id=in.(${ids})&select=lead_id,body,created_at&order=created_at.asc`),
        db(`returns?lead_id=in.(${ids})&broker=eq.${uid}&select=lead_id,status,reason,decision,created_at`),
      ]) : [[], []];
      return res.json({ leads: leads.map((l) => ({ ...leadOut(l),
        notes: notes.filter((n) => n.lead_id === l.id).map(({ body, created_at }) => ({ body, created_at })),
        refund: rets.find((r) => r.lead_id === l.id) || null,
        refundable: !rets.some((r) => r.lead_id === l.id) && Date.now() - new Date(l.bought_at) < RETURN_HOURS * 36e5 })) });
    }

    // My leads → Export: remembers when, so the next export can be "since last export".
    if (action === 'leads-exported' && req.method === 'POST') {
      const at = new Date().toISOString();
      await db(`brokers?id=eq.${uid}`, { method: 'PATCH', body: { leads_exported_at: at } });
      return res.json({ ok: true, at });
    }

    if (action === 'dashboard') {
      const month = new Date(); month.setUTCDate(1); month.setUTCHours(0, 0, 0, 0);
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const [mine, live, recent, autoSpend] = await Promise.all([
        db(`leads?buyer=eq.${uid}&select=id,bought_at,price,stage,funded_amount,amount,auto&order=bought_at.desc&limit=2000`),
        db(`leads?buyer=is.null&hidden_at=is.null&exclude_brokers=not.cs.{${uid}}&or=(created_at.gte.${since},price_fixed.is.true)&select=${PREVIEW_SELECT}&order=created_at.desc&limit=200`).then((x) => x.map((l) => asPriced(l, me)).filter((l) => l.price != null).map((l) => withMask(l, me.approved))),
        db(`ledger?broker=eq.${uid}&select=created_at,delta,reason,lead_id&order=created_at.desc&limit=8`),
        rpc('auto_spend_this_month', { p_broker: uid }),
      ]);
      const thisMonth = mine.filter((l) => new Date(l.bought_at) >= month);
      const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(Date.now() - (29 - i) * 864e5); return { day: d.toISOString().slice(0, 10), n: 0 }; });
      for (const l of mine) { const d = days.find((x) => x.day === String(l.bought_at).slice(0, 10)); if (d) d.n++; }
      const stages = Object.fromEntries(STAGES.map((k) => [k, mine.filter((l) => l.stage === k).length]));
      const matching = live.filter((l) => matches(critOf(me), l)).map((l) => ({ ...l, quality: quality(l), match: true }));
      return res.json({
        credits: me.credits, mode: me.mode, monthly_cap: me.monthly_cap, auto_spend: autoSpend,
        month: { leads: thisMonth.length, spent: thisMonth.reduce((a, l) => a + l.price, 0), auto: thisMonth.filter((l) => l.auto).length },
        total: { leads: mine.length, funded: stages.funded, funded_value: mine.reduce((a, l) => a + (l.stage === 'funded' ? l.funded_amount || l.amount || 0 : 0), 0) },
        live: live.length, matching: matching.length, top: matching.concat(live.filter((l) => !matches(critOf(me), l)).map((l) => ({ ...l, quality: quality(l), match: false }))).slice(0, 3),
        days, stages, recent,
      });
    }

    if (action === 'stage' && req.method === 'POST') {
      if (!STAGES.includes(body.stage)) return fail(res, 400, 'Unknown stage');
      const patch = { stage: body.stage, stage_at: new Date().toISOString(), ...(body.stage === 'funded' ? { funded_amount: Math.max(0, Math.round(Number(body.funded_amount) || 0)) || null } : {}) };
      const r = await db(`leads?id=eq.${Number(body.id)}&buyer=eq.${uid}`, { method: 'PATCH', body: patch, prefer: 'return=representation' });
      if (!r.length) return fail(res, 404, 'Lead not found');
      return res.json({ ok: true, stage: r[0].stage, funded_amount: r[0].funded_amount });
    }

    if (action === 'archive' && req.method === 'POST') {
      const r = await db(`leads?id=eq.${Number(body.id)}&buyer=eq.${uid}`, { method: 'PATCH', body: { archived_at: body.archived ? new Date().toISOString() : null }, prefer: 'return=representation' });
      if (!r.length) return fail(res, 404, 'Lead not found');
      return res.json({ ok: true, archived_at: r[0].archived_at });
    }

    if (action === 'note' && req.method === 'POST') {
      const text = String(body.body || '').trim().slice(0, 2000);
      if (!text) return fail(res, 400, 'Write a note first');
      const [l] = await db(`leads?id=eq.${Number(body.id)}&buyer=eq.${uid}&select=id`);
      if (!l) return fail(res, 404, 'Lead not found');
      const [n] = await db('lead_notes', { method: 'POST', body: { lead_id: l.id, broker: uid, body: text }, prefer: 'return=representation' });
      return res.json({ note: { body: n.body, created_at: n.created_at } });
    }

    if (action === 'refund' && req.method === 'POST') {
      const rr = RETURN_REASONS.find((x) => x.reason === body.reason);
      if (!rr) return fail(res, 400, 'Choose a reason');
      if (rr.kind === 'review' && String(body.details || '').trim().length < 10) return fail(res, 400, 'Tell us what happened so we can look into it');
      const [l] = await db(`leads?id=eq.${Number(body.id)}&buyer=eq.${uid}&select=id,bought_at,business,price`);
      if (!l) return fail(res, 404, 'Lead not found');
      if (Date.now() - new Date(l.bought_at) > RETURN_HOURS * 36e5) return fail(res, 400, `Refunds must be requested within ${RETURN_HOURS} hours of purchase`);
      // Reasons we never refund (no longer interested, changed plans): logged as an automatic decline so admins still see the feedback.
      if (rr.kind === 'no') {
        try { await db('returns', { method: 'POST', body: { lead_id: l.id, broker: uid, reason: body.reason, details: String(body.details || '').slice(0, 1000) || null, status: 'rejected', decision: 'Declined automatically: not a refundable reason', decided_at: new Date().toISOString() } }); }
        catch { return fail(res, 409, 'A refund has already been requested for this lead'); }
        return res.json({ ok: true, declined: true, note: rr.note });
      }
      try {
        await db('returns', { method: 'POST', body: { lead_id: l.id, broker: uid, reason: body.reason, details: String(body.details || '').slice(0, 1000) || null } });
      } catch { return fail(res, 409, 'A refund has already been requested for this lead'); }
      await notify(ADMIN_TO(), `Refund request: lead #${l.id} (${l.price} credits)`, {
        title: `Refund request for lead #${l.id}`, signoff: false, intro: `${esc(me.company)} has asked for a refund. Check the contact details, then approve or decline in Admin → Refunds.`,
        rows: [['Broker', me.company], ['Lead', `#${l.id} ${l.business}`], ['Credits', `${l.price}`], ['Reason', body.reason], ...(body.details ? [['Details', String(body.details).slice(0, 300)]] : [])],
        cta: { label: 'Review refund', url: `${PLATFORM_URL}/admin` }, replyTo: me.email });
      await notify([me.email], `Refund request received: lead #${l.id}`, {
        title: 'We’ve received your refund request', preheader: `We'll review lead #${l.id} within one working day.`,
        intro: rr.kind === 'ok' ? `Thanks for letting us know. We'll check the contact details on lead #${l.id} and email you the outcome within one working day. You don't need to do anything else.`
          : `Thanks for letting us know. We'll look into lead #${l.id} and email you the outcome within one working day. A refund for this reason isn't guaranteed, but we'll check everything you've told us.`,
        rowsTitle: 'Your request', rows: [['Lead', `#${l.id} ${l.business}`], ['Reason', body.reason], ['Credits', l.price]],
        steps: [['We check the details', 'We test the phone number and email address the business gave us.'], ['You hear back', 'If the number isn’t in service or belongs to someone else, or the email doesn’t exist, the credits go straight back on your balance.']],
        cta: { label: 'Go to My leads', url: `${PLATFORM_URL}/leads` },
        note: 'Refunds are available within 72 hours of purchase, only when the phone number is not in service or belongs to someone else, or the email address doesn’t exist.' });
      return res.json({ ok: true });
    }

    if (action === 'ledger') {
      return res.json({ entries: await db(`ledger?broker=eq.${uid}&select=created_at,delta,reason,lead_id&order=created_at.desc&limit=200`) });
    }

    if (action === 'buy' && req.method === 'POST') {
      const id = Number(body.id);
      if (restricted) return fail(res, 403, 'Leads for this account are assigned by Leaflegal. Contact hello@leaflegal.co if one here looks right for you.');
      if (me.suspended_at) return fail(res, 403, 'Your account is suspended. Please contact hello@leaflegal.co.');
      if (!me.approved) return fail(res, 403, 'Your account is waiting for approval');
      if (!(await signed(uid))) return fail(res, 403, 'Please sign the partner agreement first (Account → Partner agreement)');
      const [hid] = await db(`leads?id=eq.${id}&select=hidden_at,exclude_brokers`);
      if (hid?.hidden_at || hid?.exclude_brokers?.includes(uid)) return fail(res, 409, 'Sorry, this lead is no longer available');
      if (!(await rpc('buy_lead', { p_lead: id, p_broker: uid, p_auto: false }))) {
        const [l] = await db(`leads?id=eq.${id}&select=${PREVIEW},buyer`);
        if (!l || l.buyer) return fail(res, 409, 'Sorry, this lead has just been taken');
        const p = asPriced(l, me);
        if (p.price == null) return fail(res, 409, 'Sorry, this lead isn’t available on your plan');
        return fail(res, 402, `You need ${salePrice(p).price} credits for this lead. Upgrade your plan under Billing to get more credits.`);
      }
      const [l] = await db(`leads?id=eq.${id}&select=${FULL}`);
      await Promise.allSettled([deliver(me, l), lowCredits(me, me.credits, me.credits - l.price)]);
      return res.json({ lead: leadOut(l) });
    }

    // Matching leads already waiting (asked after changing auto-buy, or during onboarding).
    if (action === 'backlog') {
      if (restricted) return fail(res, 403, 'Leads for this account are assigned by Leaflegal.');
      if (req.method !== 'POST') { const list = await backlogOf(me);
        return res.json({ count: list.length, credits: list.reduce((a, x) => a + x.price, 0), have: me.credits, now: (await canBuy(me)) && me.credits > 0 }); }
      if (!body.want) { await db(`brokers?id=eq.${uid}`, { method: 'PATCH', body: { backlog_at: null } }); return res.json({ ok: true }); }
      const r = await claimBacklog(me);
      if (r) return res.json(r);
      await db(`brokers?id=eq.${uid}`, { method: 'PATCH', body: { backlog_at: new Date().toISOString() } });
      return res.json({ pending: true });
    }

    // Public profile: what a business sees when it's matched with this broker.
    if (action === 'profile' && req.method === 'POST') {
      const profile = cleanProfile(body, me.profile || {});
      await db(`brokers?id=eq.${uid}`, { method: 'PATCH', body: { profile } });
      return res.json({ profile });
    }
    if (action === 'profile-logo' && req.method === 'POST') {
      // The browser resizes the logo and sends a PNG; we check it really is one and store it in the public "logos" bucket.
      const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || '')), buf = m && Buffer.from(m[1], 'base64');
      if (!buf || buf.length < 100 || buf.readUInt32BE(0) !== 0x89504e47) return fail(res, 400, 'Please choose a PNG, JPG, SVG or WebP image');
      if (buf.length > 512 * 1024) return fail(res, 400, 'That logo is too large. Please try a smaller image.');
      const path = `${uid}/${Date.now()}.png`;
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/logos/${path}`, { method: 'POST', headers: { apikey: secretKey(), 'Content-Type': 'image/png', 'x-upsert': 'true', 'cache-control': 'max-age=31536000' }, body: buf });
      if (!r.ok) { console.error('logo upload', r.status, (await r.text()).slice(0, 200)); return fail(res, 500, 'Could not save your logo. Please try again.'); }
      const profile = { ...(me.profile || {}), logo: `${SUPABASE_URL}/storage/v1/object/public/logos/${path}`, logoW: buf.readUInt32BE(16), logoH: buf.readUInt32BE(20) };
      await db(`brokers?id=eq.${uid}`, { method: 'PATCH', body: { profile } });
      return res.json({ profile });
    }
    if (action === 'profile-preview' && req.method === 'POST') return res.json(matchedPreviews({ ...me, profile: cleanProfile(body, me.profile || {}) }));
    if (action === 'profile-scan' && req.method === 'POST') {
      if (!(await allow(`scan:${uid}`, 3600, 20))) return fail(res, 429, 'Too many website look-ups. Please try again later.');
      const site = await scanSite(body.url).catch((e) => { console.error('scan', e.message); return null; });
      if (!site) return fail(res, 400, "We couldn't read that website. Check the address, or fill in the details yourself.");
      return res.json(site);
    }

    if (action === 'team') {
      const rows = await db(`team_members?broker=eq.${uid}&removed_at=is.null&select=id,email,name,perms,invited_at,joined_at&order=created_at.asc`);
      return res.json({ owner: { email: me.email, name: me.contact_name }, members: rows.map((m) => ({ ...m, perms: cleanPerms(m.perms), expired: !m.joined_at && Date.now() - new Date(m.invited_at) > INVITE_DAYS * 864e5 })), perms: PERMS });
    }
    if (action === 'team-invite' && req.method === 'POST') {
      if (!(await allow(`team-invite:${uid}`, 3600, 20))) return fail(res, 429, 'Too many invites. Please wait a while and try again.');
      const email = String(body.email || '').trim().toLowerCase(), name = String(body.name || '').trim().slice(0, 120) || null;
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return fail(res, 400, 'Please enter a valid email address');
      if (email === String(me.email).toLowerCase()) return fail(res, 400, 'That’s the account owner’s email');
      if ((await db(`brokers?email=eq.${encodeURIComponent(email)}&select=id`)).length) return fail(res, 400, 'That email has its own Leaflegal account. Use a different email.');
      const live = await db(`team_members?broker=eq.${uid}&removed_at=is.null&select=id,email,joined_at`);
      const same = live.find((m) => m.email.toLowerCase() === email);
      if (same?.joined_at) return fail(res, 400, 'That person is already on the team');
      if (!same && live.length >= 25) return fail(res, 400, 'Up to 25 users per account. Contact hello@leaflegal.co for more.');
      const row = { email, name, perms: cleanPerms(body.perms), token: randomBytes(24).toString('hex'), invited_at: new Date().toISOString() };
      const [m] = same ? await db(`team_members?id=eq.${same.id}`, { method: 'PATCH', body: row, prefer: 'return=representation' })
        : await db('team_members', { method: 'POST', body: { ...row, broker: uid }, prefer: 'return=representation' });
      await teamInviteEmail(m, me, asId ? 'The Leaflegal team' : member?.name || me.contact_name || me.company);
      await audit(member ? null : uid, 'team-invite', uid, { email, by: member?.email || me.email, perms: m.perms });
      return res.json({ ok: true });
    }
    if (action === 'team-update' && req.method === 'POST') {
      const [m] = await db(`team_members?id=eq.${Number(body.id) || 0}&broker=eq.${uid}&removed_at=is.null&select=id,email`);
      if (!m) return fail(res, 404, 'User not found');
      if (member && m.id === member.id && !body.perms?.team) return fail(res, 400, 'You can’t remove your own team permission');
      await db(`team_members?id=eq.${m.id}`, { method: 'PATCH', body: { perms: cleanPerms(body.perms) } });
      await audit(member ? null : uid, 'team-update', uid, { email: m.email, by: member?.email || me.email, perms: cleanPerms(body.perms) });
      return res.json({ ok: true });
    }
    if (action === 'team-remove' && req.method === 'POST') {
      const [m] = await db(`team_members?id=eq.${Number(body.id) || 0}&broker=eq.${uid}&removed_at=is.null&select=id,email,user_id`);
      if (!m) return fail(res, 404, 'User not found');
      if (member && m.id === member.id) return fail(res, 400, 'You can’t remove yourself');
      await db(`team_members?id=eq.${m.id}`, { method: 'PATCH', body: { removed_at: new Date().toISOString(), token: null, user_id: null } });
      if (m.user_id) await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${m.user_id}`, { method: 'DELETE', headers: { apikey: secretKey() } }).catch(() => {}); // their sign-in stops working at once
      await audit(member ? null : uid, 'team-remove', uid, { email: m.email, by: member?.email || me.email });
      return res.json({ ok: true });
    }

    if (action === 'settings' && req.method === 'POST') {
      if (restricted) { // keep the rules Leaflegal set; delivery and email choices still save
        body.mode = me.mode; body.monthly_cap = me.monthly_cap;
        body.filters = { ...(me.filters || {}), suggest: body.filters?.suggest ?? body.suggest, missed: body.filters?.missed ?? body.missed };
      }
      const f = body.filters || {};
      // Email lists: up to 10 each, every entry must be a real address. Webhooks: up to 5, public https only.
      const emails = (v, what) => {
        if (v === undefined) return undefined;
        const list = [...new Set((Array.isArray(v) ? v : String(v || '').split(/[,;\s]+/)).map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
        const bad = list.find((e) => !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e));
        if (bad) throw Object.assign(new Error(`${bad} isn’t a valid email address`), { status: 400 });
        if (list.length > 10) throw Object.assign(new Error(`Add up to 10 ${what} emails`), { status: 400 });
        return list.join(', ') || null;
      };
      const hooks = body.webhook_urls !== undefined ? body.webhook_urls : body.webhook_url !== undefined ? [body.webhook_url] : undefined;
      let webhookList;
      if (hooks !== undefined) {
        webhookList = [...new Set((Array.isArray(hooks) ? hooks : [hooks]).map((w) => String(w || '').trim()).filter(Boolean))];
        if (webhookList.length > 5) return fail(res, 400, 'Add up to 5 webhooks');
        for (const w of webhookList) if (w.length > 500 || !(await safeWebhookUrl(w))) return fail(res, 400, `${w.slice(0, 80)} isn’t a public https:// address`);
      }
      let tiers = null;
      if (Array.isArray(f.tiers) && f.tiers.length) {
        tiers = f.tiers.slice(0, 4).map((t, i) => ({ name: String(t.name || '').trim().slice(0, 40) || `Tier ${i + 1}`, share: Math.max(0, Math.min(100, Math.round(Number(t.share) || 0))),
          amountMin: money(t.amountMin), amountMax: money(t.amountMax), turnovers: sub(t.turnovers, TURNOVERS), purposes: sub(t.purposes, PURPOSES), trading: sub(t.trading, TRADING),
          cleanCredit: !!t.cleanCredit, structures: sub(t.structures, STRUCTURES), property: sub(t.property, PROPERTY) }));
        const total = tiers.reduce((a, t) => a + t.share, 0);
        if (tiers.some((t) => !t.share) || total > 100) return fail(res, 400, `Tier shares must each be above 0% and add up to 100% at most (now ${total}%)`);
        if (!(Math.round(Number(body.monthly_cap) || 0) > 0)) return fail(res, 400, 'Set a monthly auto-buy limit so the tiers have a budget to split');
      }
      let webhookSecret;
      if (body.webhook_secret !== undefined) {
        webhookSecret = String(body.webhook_secret || '').trim() || null;
        if (webhookSecret && (webhookSecret.length < 16 || webhookSecret.length > 200 || /\s/.test(webhookSecret))) return fail(res, 400, 'The signing secret must be 16 to 200 characters with no spaces');
      }
      let hubspot;
      if (body.hubspot !== undefined) {
        const t = String(body.hubspot?.form || '').trim();
        hubspot = t ? parseHubspot(t) : null;
        if (t && !hubspot) return fail(res, 400, 'Paste the HubSpot form’s embed code or its editor link (it contains the account ID and form ID)');
        if (hubspot) hubspot.on = body.hubspot.on !== false;
      }
      let pipedrive;
      if (body.pipedrive !== undefined) {
        const t = String(body.pipedrive?.token || '').trim();
        pipedrive = t ? parsePipedrive(t) : null;
        if (t && !pipedrive) return fail(res, 400, 'The Pipedrive API token is 40 letters and numbers. Find it in Pipedrive under Settings, Personal preferences, API');
        if (pipedrive) pipedrive.on = body.pipedrive.on !== false;
      }
      let notifyEmails, deliverEmails;
      try { notifyEmails = emails(body.notify_emails, 'alert'); deliverEmails = emails(body.deliver_emails, 'delivery'); } catch (e) { return fail(res, e.status || 400, e.message); }
      const patch = {
        mode: body.mode === 'auto' ? 'auto' : 'manual',
        monthly_cap: Math.max(0, Math.round(Number(body.monthly_cap) || 0)),
        ...(body.notify !== undefined ? { notify: body.notify !== false } : {}),
        ...(notifyEmails !== undefined ? { notify_emails: notifyEmails } : {}),
        ...(body.deliver_on !== undefined ? { deliver_on: body.deliver_on !== false } : {}),
        ...(deliverEmails !== undefined ? { deliver_emails: deliverEmails } : {}),
        ...(body.webhook_on !== undefined ? { webhook_on: body.webhook_on !== false } : {}),
        ...(webhookList !== undefined ? { webhook_urls: webhookList, webhook_url: webhookList[0] || null } : {}),
        ...(hubspot !== undefined ? { hubspot } : {}),
        ...(pipedrive !== undefined ? { pipedrive } : {}),
        ...(webhookSecret !== undefined ? { webhook_secret: webhookSecret } : {}),
        filters: { dailyLeads: money(f.dailyLeads), dailyCredits: money(f.dailyCredits), maxPrice: money(f.maxPrice), amountMin: money(f.amountMin), amountMax: money(f.amountMax), turnovers: sub(f.turnovers, TURNOVERS), purposes: sub(f.purposes, PURPOSES), trading: sub(f.trading, TRADING), cleanCredit: !!f.cleanCredit, property: sub(f.property, PROPERTY), structures: sub(f.structures, STRUCTURES), tiers,
          tenant: f.tenant && typeof f.tenant === 'object' ? { amountMin: money(f.tenant.amountMin), amountMax: money(f.tenant.amountMax), turnovers: sub(f.tenant.turnovers, TURNOVERS), purposes: sub(f.tenant.purposes, PURPOSES), trading: sub(f.tenant.trading, TRADING), cleanCredit: !!f.tenant.cleanCredit } : null,
          tierPlan: tierPlanOf(f.tierPlan ? { filters: { tierPlan: f.tierPlan } } : me),
          suggest: SUGGEST.includes(body.suggest) ? body.suggest : suggestMode(me), ...(me.filters?.digestAt ? { digestAt: me.filters.digestAt } : {}),
          missed: body.missed === 'off' || (body.missed === undefined && me.filters?.missed === 'off') ? 'off' : 'on', ...(me.filters?.missedAt ? { missedAt: me.filters.missedAt } : {}) },
        ...(body.company ? { company: String(body.company).slice(0, 120) } : {}),
        ...(body.phone !== undefined ? { phone: String(body.phone).slice(0, 40) } : {}),
      };
      const [b] = await db(`brokers?id=eq.${uid}`, { method: 'PATCH', body: patch, prefer: 'return=representation' });
      return res.json({ ok: true, filters: b.filters, hubspot: b.hubspot, pipedrive: b.pipedrive });
    }

    if (action === 'test-webhook' && req.method === 'POST') {
      const urls = webhooksOf(me);
      const sample = { id: 0, received_at: new Date().toISOString(), business: 'Sample Trading Ltd', contact_name: 'Sam Sample', email: 'sam@example.com', phone: '+447700900123', amount: 100000, purpose: 'Cash flow', timeline: 'Within 2 weeks', structure: 'Limited company', annual_revenue: '£500k to £1m', trading_for: '2 to 5 years', adverse_credit: 'No', test: true };
      if (body.to === 'hubspot') {
        if (!me.hubspot?.form) return fail(res, 400, 'Save your HubSpot form first');
        const result = await postHubspot(me.hubspot, { ...sample, quality: 80, price_credits: 0 });
        return res.json({ result, results: [{ url: 'hubspot', result }] });
      }
      if (body.to === 'pipedrive') {
        if (!me.pipedrive?.token) return fail(res, 400, 'Save your Pipedrive API token first');
        const result = await postPipedrive(me.pipedrive, { ...sample, test: true, quality: 80, price_credits: 0 });
        return res.json({ result, results: [{ url: 'pipedrive', result }] });
      }
      if (!urls.length) return fail(res, 400, 'Save a webhook URL first');
      const results = await Promise.all(urls.map((u) => postWebhook(u, { event: 'lead.test', lead: sample }, me.webhook_secret).then((result) => ({ url: u, result }))));
      return res.json({ result: results.every((r) => r.result === 'ok') ? 'ok' : results.filter((r) => r.result !== 'ok').map((r) => `${new URL(r.url).hostname}: ${r.result}`).join(', '), results });
    }

    if (action === 'checkout' && req.method === 'POST') {
      if (me.suspended_at) return fail(res, 403, 'Your account is suspended. Please contact hello@leaflegal.co.');
      const trial = body.pack === 'trial';
      const pack = trial ? PACKS[TRIAL.then] : body.pack === 'custom' ? customPack(body.amount) : PACKS[body.pack];
      if (!pack) return fail(res, 400, body.pack === 'custom' ? `Custom plans run from £${CUSTOM.min.toLocaleString('en-GB')} a month in £1,000 steps, up to ${CUSTOM.maxCredits.toLocaleString('en-GB')} credits. For more, contact ${CUSTOM.contact}.` : 'Unknown plan');
      if (!(await signed(uid))) return fail(res, 403, 'Please sign the partner agreement first');
      if (trial && (me.trial_used || await currentSub(me.stripe_customer))) return fail(res, 400, 'The first month offer is only for new partners');
      if (!process.env.STRIPE_SECRET_KEY) return fail(res, 503, 'Payments are not switched on yet');
      if (await currentSub(me.stripe_customer)) return fail(res, 409, 'You already have a subscription. Change your plan instead.');
      const host = String(req.headers.host || ''), here = /(^|\.)leaflegal\.co$/.test(host) ? PLATFORM_URL : `https://${host}/platform`; // previews keep the /platform path
      const meta = { broker: uid, credits: String(pack.credits), pack: pack.name, ...(trial ? { trial: '1', trial_credits: String(TRIAL.credits) } : {}) };
      // One discount per checkout: a promotion code the partner entered, else the first month offer.
      let discount = {};
      if (body.coupon) {
        const promo = await findPromo(body.coupon);
        if (!promo) return fail(res, 400, 'That code isn’t valid');
        discount = { 'discounts[0][promotion_code]': promo.id };
        if (trial) { delete meta.trial; delete meta.trial_credits; }
      } else if (trial) discount = { 'discounts[0][coupon]': await trialCoupon() };
      const p = {
        ...discount,
        mode: 'subscription', // subscriptions only
        success_url: `${here}/billing?paid=1`, cancel_url: `${here}/billing`,
        client_reference_id: uid,
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': 'gbp',
        'line_items[0][price_data][unit_amount]': String(pack.pence),
        'line_items[0][price_data][product_data][name]': `Leaflegal ${pack.name}: ${pack.credits.toLocaleString('en-GB')} credits a month`,
        'line_items[0][price_data][recurring][interval]': 'month',
        'line_items[0][tax_rates][0]': await ukVat(),
        billing_address_collection: 'required',
        'adaptive_pricing[enabled]': 'false', // always charge in GBP, never convert to the visitor's local currency
        'tax_id_collection[enabled]': 'true',
        ...(me.stripe_customer ? { customer: me.stripe_customer, 'customer_update[name]': 'auto', 'customer_update[address]': 'auto' } : { customer_email: me.email }),
      };
      for (const [k, v] of Object.entries(meta)) { p[`metadata[${k}]`] = v; p[`subscription_data[metadata][${k}]`] = v; }
      // Embedded checkout (payment form inside the platform) when the publishable key is set; otherwise Stripe's hosted page.
      const pk = String(process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
      if (body.embedded && pk) {
        delete p.success_url; delete p.cancel_url;
        Object.assign(p, { ui_mode: 'embedded_page', return_url: `${here}/billing?paid=1` });
        const sess = await stripe('checkout/sessions', p);
        return res.json({ clientSecret: sess.client_secret, publishableKey: pk });
      }
      return res.json({ url: (await stripe('checkout/sessions', p)).url });
    }

    if (action === 'subscription') {
      if (!process.env.STRIPE_SECRET_KEY) return res.json({ subscription: null });
      return res.json({ subscription: subOut(await currentSub(me.stripe_customer)) });
    }

    if (action === 'coupon' && req.method === 'POST') {
      const promo = await findPromo(body.code).catch(() => null);
      if (!promo) return fail(res, 404, 'That code isn’t valid or has expired');
      const c = promo.coupon || promo.promotion?.coupon || {};
      const off = c.percent_off ? `${c.percent_off}% off` : c.amount_off ? `£${(c.amount_off / 100).toLocaleString('en-GB')} off` : 'Discount';
      const dur = c.duration === 'once' ? 'your first month' : c.duration === 'repeating' ? `${c.duration_in_months} months` : 'every month';
      return res.json({ ok: true, code: promo.code, label: `${off} ${dur}` });
    }

    // Large custom plans (over CUSTOM.maxCredits a month) are agreed with the team, not sold online.
    if (action === 'enterprise-request' && req.method === 'POST') {
      const pounds = Math.round(Number(body.amount) || 0);
      if (pounds < CUSTOM.min) return fail(res, 400, 'Enter a monthly amount');
      const credits = Math.round(pounds * (1 + CUSTOM.bonus / 100));
      await audit(uid, 'enterprise-request', uid, { pounds, credits });
      await notify(ADMIN_TO(), `Custom plan request: ${me.company} (£${pounds.toLocaleString('en-GB')} a month)`, {
        title: `${me.company} wants a custom plan`, signoff: false, intro: 'Get in touch to agree the details, then set up their plan and credits from the Admin panel.',
        highlight: { value: `£${pounds.toLocaleString('en-GB')} + VAT a month`, label: `${credits.toLocaleString('en-GB')} credits a month` },
        rows: [['Contact', me.contact_name || '–'], ['Email', me.email], ['Phone', me.phone || '–'], ['Partner agreement', (await signed(uid)) ? 'Accepted' : 'Not accepted yet']],
        cta: { label: 'Open Admin', url: `${PLATFORM_URL}/admin` }, replyTo: me.email });
      await notify([me.email], 'We’ve received your custom plan request', {
        title: 'Thanks, we’ll be in touch', preheader: 'We’ve received your custom plan request and will contact you shortly.',
        intro: `Thanks for your interest in a larger plan for ${esc(me.company)}. A member of our team will contact you shortly to talk through your volumes and switch on your credits. There's nothing to pay until we've agreed the details.`,
        rowsTitle: 'What you asked for', rows: [['Monthly amount', `£${pounds.toLocaleString('en-GB')} + VAT`], ['Credits a month', credits.toLocaleString('en-GB')]],
        steps: [['We call you', 'Usually within one working day, to understand the lead types and volumes you want.'], ['We agree your plan', 'We confirm the monthly amount, credits and any lead criteria.'], ['Your credits go live', 'We set up billing and add your credits, and you can start buying straight away.']],
        replyTo: 'hello@leaflegal.co' });
      return res.json({ ok: true });
    }

    if (action === 'onboard' && req.method === 'POST') {
      const t = (v, n) => String(v ?? '').trim().slice(0, n);
      const patch = { company: t(body.company, 120) || me.company, company_number: body.company_number === undefined ? me.company_number : t(body.company_number, 12).toUpperCase() || null, address: t(body.address, 300) || null,
        contact_name: t(body.contact_name, 120) || me.contact_name, signer_title: t(body.signer_title, 80) || null, phone: t(body.phone, 40) || me.phone, fca_number: t(body.fca_number, 20) || me.fca_number };
      if (patch.company_number && !/^[A-Z0-9]{6,10}$/.test(patch.company_number)) return fail(res, 400, 'Enter a valid Companies House number');
      await db(`brokers?id=eq.${uid}`, { method: 'PATCH', body: patch });
      return res.json({ ok: true });
    }

    if (action === 'sign' && req.method === 'POST') {
      if (body.version !== TERMS_VERSION) return fail(res, 409, 'The agreement has been updated. Please reload and read the latest version.');
      if (body.accept !== true || body.authority !== true) return fail(res, 400, 'Please tick both boxes to confirm');
      const name = String(body.signer_name || '').trim().slice(0, 120), title = String(body.signer_title || '').trim().slice(0, 80);
      if (name.split(/\s+/).length < 2) return fail(res, 400, 'Type your full name');
      if (!title) return fail(res, 400, 'Enter your position at the company');
      const sig = 'Accepted online (tick boxes)'; // click-to-accept: no drawn signature
      const [fresh] = await db(`brokers?id=eq.${uid}&select=*`);
      const [a] = await db('agreements', { method: 'POST', prefer: 'return=representation', body: {
        broker: uid, version: TERMS_VERSION, terms_hash: termsHash(), company: fresh.company, company_number: fresh.company_number, address: fresh.address,
        signer_name: name, signer_title: title, signer_email: me.email,
        ip: String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null, user_agent: String(req.headers['user-agent'] || '').slice(0, 300), signature: sig } });
      await db(`brokers?id=eq.${uid}`, { method: 'PATCH', body: { onboarded_at: new Date().toISOString(), signer_title: title } });
      await pendingBacklog(uid).catch((e) => console.error('backlog', e.message));
      const copy = Buffer.from(await signedPdf(a)), ref = `LL-PA-${String(a.id).padStart(5, '0')}`;
      await notify([me.email], `Your Leaflegal Partner Agreement (${ref})`, { // admins see signed agreements in Admin → Agreements, not by email
        title: 'Your partner agreement', preheader: `Your copy of the Leaflegal Partner Agreement (${ref}) is attached.`,
        intro: `Thanks, ${esc(name.split(' ')[0])}. Your copy of the Leaflegal Partner Agreement for <b>${esc(fresh.company)}</b> is attached. Please keep it for your records. You can also view it any time under Account on the platform.`,
        rowsTitle: 'Acceptance record',
        rows: [['Reference', ref], ['Version', TERMS_VERSION], ['Accepted by', `${name}, ${title}`], ['Date', new Date(a.created_at).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/London' })]],
        cta: { label: 'Open Leaflegal Platform', url: `${PLATFORM_URL}/account` } },
        [{ filename: `${ref}-leaflegal-partner-agreement.pdf`, content: copy.toString('base64') }]);
      return res.json({ ok: true, agreement: { id: a.id, version: a.version, created_at: a.created_at } });
    }

    if (action === 'agreement') {
      const id = Number(new URL(req.url, 'http://x').searchParams.get('id')) || null;
      const [a] = await db(`agreements?broker=eq.${uid}${id ? `&id=eq.${id}` : ''}&select=*&order=created_at.desc&limit=1`);
      if (!a) return fail(res, 404, 'No signed agreement yet');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="LL-PA-${String(a.id).padStart(5, '0')}-leaflegal-partner-agreement.pdf"`);
      return res.status(200).send(Buffer.from(await signedPdf(a)));
    }

    // Upgrade: charged the new plan today, its credits arrive now, renews monthly from today.
    // Downgrade: takes effect at the next renewal, no charge today.
    if (action === 'change-plan' && req.method === 'POST') {
      const pack = body.pack === 'custom' ? customPack(body.amount) : PACKS[body.pack];
      if (!pack) return fail(res, 400, 'Unknown plan');
      const sub = await currentSub(me.stripe_customer);
      if (!sub) return fail(res, 400, 'You don’t have a subscription yet');
      const item = sub.items.data[0], now = item.price.unit_amount, trial = onTrial(sub);
      if (pack.pence === now && !trial) return fail(res, 400, 'That’s already your plan');
      const up = pack.pence > now || (trial && pack.pence === now); // first month offer → full plan: charged and credited today
      const p = {
        'items[0][id]': item.id,
        'items[0][price_data][currency]': 'gbp',
        'items[0][price_data][unit_amount]': String(pack.pence),
        'items[0][price_data][product]': typeof item.price.product === 'string' ? item.price.product : item.price.product.id,
        'items[0][price_data][recurring][interval]': 'month',
        'items[0][tax_rates][0]': await ukVat(),
        'metadata[broker]': uid, 'metadata[credits]': String(pack.credits), 'metadata[pack]': pack.name,
        ...(trial && up ? { 'metadata[trial]': '', 'metadata[trial_credits]': '' } : {}),
        proration_behavior: 'none', cancel_at_period_end: 'false',
        ...(up ? { billing_cycle_anchor: 'now', payment_behavior: 'error_if_incomplete' } : {}),
      };
      const productId = p['items[0][price_data][product]'];
      try {
        await stripe(`products/${productId}`, { name: `Leaflegal ${pack.name}: ${pack.credits.toLocaleString('en-GB')} credits a month` }).catch(() => {});
        await stripe(`subscriptions/${sub.id}`, p);
      } catch (e) {
        console.error('change-plan', e.message);
        return fail(res, 402, up ? 'Your card was declined for the upgrade. Update your card under Manage billing and try again.' : 'Could not change your plan. Please try again.');
      }
      const after = subOut(await currentSub(me.stripe_customer));
      if (!up) await notify([me.email], `Your plan will change to ${pack.name}`, {
        title: `Switching to ${pack.name} at renewal`, preheader: `Your plan changes to ${pack.name} at your next renewal. Nothing is charged today.`,
        intro: `Your current plan stays as it is until your next renewal, then changes to <b>${pack.name}</b>. Nothing is charged today, and you keep all your current credits.`,
        rowsTitle: 'Your new plan',
        rows: [['New plan', `${pack.name}: £${(pack.pence / 100).toLocaleString('en-GB')} + VAT a month`], ['Credits a month', pack.credits.toLocaleString('en-GB')], ...(after?.renews ? [['Changes on', new Date(after.renews).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })]] : [])],
        cta: { label: 'View billing', url: `${PLATFORM_URL}/billing` } });
      return res.json({ ok: true, upgraded: up, subscription: after }); // upgrades get the payment email from the webhook
    }

    // Cancel at the end of the paid month (keeps credits and access until then), or undo that.
    if ((action === 'cancel-plan' || action === 'resume-plan') && req.method === 'POST') {
      const sub = await currentSub(me.stripe_customer);
      if (!sub) return fail(res, 400, 'You don’t have a subscription');
      if (action === 'cancel-plan') { // why they left: saved before cancelling so the webhook's alerts can include it
        const reason = CANCEL_REASONS.includes(body.reason) ? body.reason : null, feedback = String(body.feedback || '').trim().slice(0, 2000) || null;
        if (!reason) return fail(res, 400, 'Choose a reason');
        await audit(uid, 'cancel-feedback', uid, { reason, feedback });
      }
      const x = await stripe(`subscriptions/${sub.id}`, { cancel_at_period_end: action === 'cancel-plan' ? 'true' : 'false' });
      // Broker and admin emails for this are sent from the customer.subscription.updated webhook.
      return res.json({ ok: true, subscription: subOut(x) });
    }

    if (action === 'invoices') {
      if (!me.stripe_customer || !process.env.STRIPE_SECRET_KEY) return res.json({ invoices: [] });
      const { data } = await stripe('invoices', { customer: me.stripe_customer, limit: '24' }, 'GET');
      return res.json({ invoices: data.filter((i) => i.status !== 'draft').map((i) => ({
        number: i.number, date: new Date(i.created * 1000).toISOString(), total: i.total / 100, status: i.status,
        url: i.hosted_invoice_url, pdf: i.invoice_pdf, plan: i.lines?.data?.[0]?.description || '' })) });
    }

    if (action === 'billing' && req.method === 'POST') {
      if (!me.stripe_customer) return fail(res, 400, 'No billing account yet');
      return res.json({ url: (await stripe('billing_portal/sessions', { customer: me.stripe_customer, return_url: `${PLATFORM_URL}/billing` })).url });
    }

    // ------------------------------------------------ admin console
    if (action.startsWith('admin')) {
      if (!me.is_admin) return fail(res, 403, 'Admins only');

      if (action === 'admin') {
        let adStatus = null; // Meta spend lookup for cost per lead
        const [brokers, returns, leads, pricing] = await Promise.all([
          db('brokers?select=id,email,company,contact_name,phone,fca_number,approved,credits,mode,is_admin,created_at,suspended_at,plan,stripe_customer,pricing&order=created_at.desc'),
          db('returns?select=id,lead_id,broker,reason,details,status,decision,created_at,leads!returns_lead_id_fkey(business,price,amount),brokers!returns_broker_fkey(company)&order=created_at.desc&limit=100'),
          db('leads?select=id,created_at,amount,purpose,turnover,trading,price,list_price,price_fixed,tier,tier_price,business,bought_at,auto,stage,archived_at,buyer,email,hidden_at,source,brokers!leads_buyer_fkey(company,pricing)&order=created_at.desc&limit=500')
            .then(async (x) => { const off = new Set((await db('email_suppressions?select=email&limit=20000').catch(() => [])).map((r) => r.email)); // only a suppressed flag goes to the browser, not the email
              const rows = x.map(({ email, source, ...l }) => ({ ...l, ...(l.buyer ? {} : salePrice(l)), ...leadOrigin(source || {}), suppressed: off.has(String(email || '').trim().toLowerCase()) }));
              const [ad] = await Promise.all([adLeadCosts(rows).catch((e) => ({ status: { error: e.message }, costs: {} })), withAdNames(rows)]);
              adStatus = ad.status;
              return rows.map((l) => (ad.costs[l.id]?.by && ad.costs[l.id].by !== 'none' ? { ...l, ad_cost: Math.round(ad.costs[l.id].cost * 100) / 100, ad_by: ad.costs[l.id].by } : l)); }),
          getPricing(),
        ]);
        await withPaid(leads, new Set(brokers.filter((b) => b.plan?.commission).map((b) => b.id)));
        const auditLog = await db('audit_log?select=at,action,target,detail,brokers(company)&order=at.desc&limit=60').catch(() => []);
        // Invites not yet accepted (accepting one deletes it).
        const invites = (await db('invites?select=email,name,company,send_at,expires_at,alerts,digest,batch,created_at,email_id,token&order=created_at.desc,email.asc&limit=20000').catch(() => []))
          .map(({ token, ...v }) => ({ ...v, kind: tokenData(token)?.k === 'cold' ? 'cold' : 'warm', queued: v.email_id === 'queued', paused: v.email_id === 'paused', accepted: v.email_id === 'accepted' }));
        const accepted = (await db('audit_log?action=eq.invite-accepted&select=at,target,detail&order=at.desc&limit=5000').catch(() => [])).map((a) => ({ email: String(a.detail?.email || '').toLowerCase(), at: a.at, broker: a.target }));
        const clients = brokers.filter((b) => !b.is_admin); // admin accounts aren't brokers: left out of counts and the Clients list
        const agreements = await db('agreements?select=id,broker,version,created_at,signer_name,signer_title,signer_email,company&order=created_at.desc&limit=500').catch(() => []);
        // Leads for sale = unsold and still listed on Opportunities (last 30 days), at today's price (after any 72h discount). 1 credit = £1.
        const listed = await db(`leads?buyer=is.null&hidden_at=is.null&created_at=gte.${new Date(Date.now() - 30 * 864e5).toISOString()}&select=created_at,price,buyer&limit=10000`);
        const forSale = { leads: listed.length, credits: listed.reduce((a, l) => a + salePrice(l).price, 0), full: listed.reduce((a, l) => a + l.price, 0) };
        const sold = leads.filter((l) => l.buyer);
        // All-time money: credits spent net of approved refunds, credits still on balances, MRR and cash from Stripe.
        const all = async (path, params) => { const out = []; let after; for (let i = 0; i < 50; i++) {
          const r = await stripe(path, { ...params, limit: '100', ...(after ? { starting_after: after } : {}) }, 'GET'); out.push(...r.data);
          if (!r.has_more) break; after = r.data[r.data.length - 1].id; } return out; };
        const stripeOn = !!process.env.STRIPE_SECRET_KEY;
        const [boughtAll, refundedAll, subs, paid, cashRefunds] = await Promise.all([
          db('leads?buyer=not.is.null&select=price,buyer&limit=100000'),
          db('returns?status=eq.approved&select=broker,credits,leads!returns_lead_id_fkey(price,buyer)&limit=100000'),
          stripeOn ? all('subscriptions', { status: 'all' }).catch(() => null) : null,
          stripeOn ? all('invoices', { status: 'paid' }).catch(() => null) : null,
          stripeOn ? all('refunds', {}).catch(() => null) : null,
        ]);
        const live = (subs || []).filter((x) => ['active', 'past_due'].includes(x.status));
        const monthly = (x) => x.items.data.reduce((a, it) => { const pr = it.price || {}, n = pr.recurring?.interval_count || 1;
          const per = { day: 30.44, week: 4.345, month: 1, year: 1 / 12 }[pr.recurring?.interval] ?? 1; return a + ((pr.unit_amount || 0) * (it.quantity || 1) * per) / n; }, 0) / 100;
        const taxOf = (i) => (Array.isArray(i.total_taxes) ? i.total_taxes.reduce((a, t) => a + (t.amount || 0), 0) : (i.tax || 0));
        const gross = (paid || []).reduce((a, i) => a + i.amount_paid, 0) / 100, vatIn = (paid || []).reduce((a, i) => a + taxOf(i), 0) / 100;
        const back = (cashRefunds || []).filter((r) => r.status === 'succeeded').reduce((a, r) => a + r.amount, 0) / 100;
        // Commission clients don't buy credits, so they're left out of credit spend and unspent credits.
        const payers = clients.filter((b) => !b.plan?.commission), comm = new Set(clients.filter((b) => b.plan?.commission).map((b) => b.id));
        const money = {
          spent: boughtAll.filter((l) => !comm.has(l.buyer)).reduce((a, l) => a + (l.price || 0), 0) - refundedAll.filter((r) => r.leads?.buyer === r.broker && !comm.has(r.broker)).reduce((a, r) => a + (r.credits ?? r.leads?.price ?? 0), 0),
          unspent: payers.reduce((a, b) => a + (b.credits || 0), 0), holders: payers.filter((b) => b.credits > 0).length,
          mrr: subs ? live.reduce((a, x) => a + monthly(x), 0) : null, subs: live.length, cancelling: live.filter((x) => x.cancel_at_period_end).length,
          cash: paid ? gross - back : null, cash_ex_vat: paid ? gross - vatIn - back / 1.2 : null, refunded: back,
        };
        return res.json({
          uploads: (await db('settings?key=eq.invite_batches&select=value').catch(() => []))[0]?.value || {},
          suppressed: await db('email_suppressions?select=email,reason,source,created_at&order=created_at.desc,email.asc&limit=5000').catch(() => []),
          accepted, brokers, invites, agreements, waived: [...(await waivedIds())], termsVersion: TERMS_VERSION, returns, leads, adStatus, pricing, audit: auditLog, defaults: DEFAULT_PRICING, turnovers: TURNOVERS, ages: TRADING, examples: PRICE_EXAMPLES.map((e) => ({ ...e, price: price(e, pricing) })), tierPrices: await getTierPrices(), tierNames: TIER_NAMES,
          stats: { brokers: clients.length, pending: clients.filter((b) => !b.approved).length,
            active: clients.filter((b) => !b.suspended_at && !b.plan?.commission && (b.plan || (b.stripe_customer && (live || []).some((x) => x.customer === b.stripe_customer)))).length,
            commission: clients.filter((b) => !b.suspended_at && b.plan?.commission).length, leads: leads.length, sold: sold.length,
            credits_sold: sold.reduce((a, l) => a + (l.paid ?? l.price), 0), for_sale: forSale, refunds: returns.filter((r) => r.status === 'pending').length, money },
        });
      }

      // Ads performance: Meta spend and stats per ad for a date range, creative thumbnails, and which campaign / ad set / ad
      // each Meta lead came from (utm tags carry the IDs). Revenue per lead is worked out on the page from Finance's ledger.
      if (action === 'admin-ads') {
        const day = (v, d) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : d);
        const q = (k) => req.query?.[k] ?? new URL(req.url, 'http://x').searchParams.get(k);
        const until = day(q('to'), new Date().toISOString().slice(0, 10)), from = day(q('from'), new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10));
        const token = (process.env.META_ADS_TOKEN || process.env.META_CAPI_TOKEN || '').trim(), acct = String(process.env.META_AD_ACCOUNT || '957353369466280').replace(/^act_/, '');
        const leads = await db(`leads?created_at=gte.${from}T00:00:00Z&created_at=lte.${until}T23:59:59Z&select=id,source,business,created_at,buyer,stage,brokers!leads_buyer_fkey(company)&order=created_at.desc&limit=50000`);
        const attrib = {}, metaLeads = [];
        for (const l of leads) { const o = leadOrigin(l.source || {}); if (o.channel !== 'Meta ads') continue; attrib[l.id] = [o.campaign_name, o.adset, o.ad]; metaLeads.push({ id: l.id, business: l.business, created_at: l.created_at, buyer: l.brokers?.company || null, stage: l.stage }); }
        if (!token) return res.json({ status: 'no token', ads: [], campaigns: [], attrib, leads: metaLeads, from, to: until });
        const G = `https://graph.facebook.com/v21.0/`, tk = `access_token=${encodeURIComponent(token)}`;
        // Every campaign (live, paused or off) with budgets and when it last changed, so live ones show even with no spend
        // and ones turned off recently stay on the page; the page also lists any campaign that spent in the period.
        const campaigns = await fetch(`${G}act_${acct}/campaigns?fields=id,name,effective_status,daily_budget,lifetime_budget,updated_time&limit=500&${tk}`, { signal: AbortSignal.timeout(9000) })
          .then((r) => r.json()).then((d) => (d.data || []).map((c) => ({ id: c.id, name: c.name, status: c.effective_status, updated: c.updated_time || null, daily: c.daily_budget ? Number(c.daily_budget) / 100 : null, lifetime: c.lifetime_budget ? Number(c.lifetime_budget) / 100 : null }))).catch(() => []);
        const ads = [];
        let status = 'ok', url = `https://graph.facebook.com/v21.0/act_${acct}/insights?level=ad&fields=ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,spend,impressions,clicks,actions&time_range=${encodeURIComponent(JSON.stringify({ since: from, until }))}&limit=500&access_token=${encodeURIComponent(token)}`;
        try {
          for (let i = 0; url && i < 20; i++) {
            const r = await fetch(url, { signal: AbortSignal.timeout(9000) }), d = await r.json();
            if (!r.ok) { status = `error: ${String(d.error?.message || r.status).slice(0, 140)}`; break; }
            for (const x of d.data || []) ads.push({ ad_id: x.ad_id, ad: x.ad_name, adset_id: x.adset_id, adset: x.adset_name, campaign_id: x.campaign_id, campaign: x.campaign_name,
              spend: Number(x.spend) || 0, impressions: Number(x.impressions) || 0, clicks: Number(x.clicks) || 0,
              meta_leads: (x.actions || []).filter((a) => /lead/i.test(a.action_type) && !/view/i.test(a.action_type)).reduce((m, a) => Math.max(m, Number(a.value) || 0), 0) });
            url = d.paging?.next || null;
          }
          // Thumbnails for the ads that spent most (Graph batch, 50 a call).
          const top = [...ads].sort((a, b) => b.spend - a.spend).slice(0, 100);
          for (let i = 0; i < top.length; i += 50) {
            const r = await fetch('https://graph.facebook.com/v21.0/', { method: 'POST', signal: AbortSignal.timeout(9000), body: new URLSearchParams({ access_token: token,
              batch: JSON.stringify(top.slice(i, i + 50).map((a) => ({ method: 'GET', relative_url: `${a.ad_id}?fields=effective_status,creative.thumbnail_width(600).thumbnail_height(600){thumbnail_url,image_url,title,body}` }))) }) });
            const d = await r.json().catch(() => null);
            if (Array.isArray(d)) d.forEach((x, j) => { try { const o = JSON.parse(x?.body || '{}'), c = o.creative || {}; Object.assign(top[i + j], { live: o.effective_status === 'ACTIVE', thumb: c.image_url || c.thumbnail_url || null, title: c.title || null, body: c.body ? String(c.body).slice(0, 200) : null }); } catch {} });
          }
        } catch (e) { status = 'error: ' + e.message; }
        return res.json({ status, ads, campaigns, attrib, leads: metaLeads, from, to: until });
      }

      // Finance: last 12 months of raw figures; the admin page aggregates by period.
      if (action === 'admin-finance') {
        const since = new Date(); since.setUTCMonth(since.getUTCMonth() - 11, 1); since.setUTCHours(0, 0, 0, 0);
        const sec = Math.floor(since / 1000), day = (t) => new Date(t * 1000).toISOString().slice(0, 10);
        const pages = async (path, params) => { const out = []; let after; for (let i = 0; i < 20; i++) {
          const r = await stripe(path, { ...params, limit: '100', ...(after ? { starting_after: after } : {}) }, 'GET'); out.push(...r.data);
          if (!r.has_more) break; after = r.data[r.data.length - 1].id; } return out; };
        const stripeOn = !!process.env.STRIPE_SECRET_KEY;
        const [invoices, txns, leads, brokers, manual, spend, topups, returned, moves] = await Promise.all([
          stripeOn ? pages('invoices', { status: 'paid', 'created[gte]': String(sec) }) : [],
          stripeOn ? pages('balance_transactions', { 'created[gte]': String(sec) }) : [],
          db(`leads?created_at=gte.${since.toISOString()}&select=id,created_at,price,list_price,buyer,bought_at,auto,campaign:source->utm->>utm_campaign&order=created_at.asc&limit=50000`),
          db('brokers?select=id,company,email,stripe_customer,credits,approved,created_at,plan&is_admin=is.false'),
          db(`ledger?invoiced=gt.0&created_at=gte.${since.toISOString()}&select=created_at,broker,invoiced`),
          metaSpend(since),
          // Every credit top-up (all time), so a lead's revenue can be valued at what that broker actually paid per credit.
          db('ledger?delta=gt.0&select=broker,delta,ref,invoiced,reason&limit=50000'),
          db(`returns?status=eq.approved&created_at=gte.${since.toISOString()}&select=created_at,broker,credits,leads!returns_lead_id_fkey(price,buyer)`),
          // Lead P&L comes from the ledger: paid buys (delta < 0), free assignments (no charge) and refunds, each dated when it happened.
          db(`ledger?created_at=gte.${since.toISOString()}&or=(delta.lt.0,reason.like.Lead assigned*,reason.like.Refund for lead*)&select=created_at,broker,delta,reason,lead_id&order=created_at.asc&limit=50000`),
        ]);
        const taxOf = (i) => (Array.isArray(i.total_taxes) ? i.total_taxes.reduce((a, t) => a + (t.amount || 0), 0) : (i.tax || 0));
        const priceOf = Object.fromEntries(leads.map((l) => [l.id, l.price]));
        const ledgerOut = moves.map((m) => ({ date: m.created_at, broker: m.broker, lead: m.lead_id ?? (Number(/#(\d+)/.exec(m.reason)?.[1]) || null),
          kind: m.delta < 0 ? 'sale' : /^Refund/.test(m.reason) ? 'refund' : 'free', credits: m.delta < 0 ? -m.delta : m.delta > 0 ? m.delta : priceOf[m.lead_id] || 0, auto: /^Auto/.test(m.reason) }));
        return res.json({
          since: since.toISOString(), meta: spend.status, ledger: ledgerOut,
          topups, returned: returned.filter((r) => r.leads?.buyer === r.broker).map((r) => ({ date: r.created_at, broker: r.broker, price: r.credits ?? r.leads?.price ?? 0 })) /* relisted leads: old sale and its refund both drop out */, invoices: invoices.map((i) => ({ id: i.id, date: day(i.status_transitions?.paid_at || i.created), customer: i.customer, gross: i.amount_paid / 100, vat: taxOf(i) / 100, exVat: (i.amount_paid - taxOf(i)) / 100 })),
          // Stripe fees as Stripe books them: card processing on each payment, plus standalone fee lines (Stripe Billing usage etc.).
          fees: [...txns.filter((t) => t.fee).map((t) => ({ date: day(t.created), fee: t.fee / 100, kind: 'Card processing' })),
            ...txns.filter((t) => t.reporting_category === 'fee' || t.type === 'stripe_fee').map((t) => ({ date: day(t.created), fee: -t.amount / 100, kind: /billing/i.test(t.description || '') ? 'Stripe Billing' : (t.description || 'Stripe fee').replace(/\s*\(.*\)$/, '') }))],
          refunds: txns.filter((t) => t.type === 'refund').map((t) => ({ date: day(t.created), amount: -t.amount / 100 })),
          spend: spend.days, leads: ((c) => leads.map(({ campaign, ...l }) => ({ ...l, ad_cost: c[l.id].cost, ad_by: c[l.id].by })))(leadAdCosts(leads, spend.rows)), brokers, commission: await commissionEntries(`date=gte.${since.toISOString().slice(0, 10)}`),
          manual: manual.map((m) => ({ date: m.created_at.slice(0, 10), broker: m.broker, exVat: Number(m.invoiced) })),
        });
      }

      // One client in detail: subscription, ledger, agreement.
      if (action === 'admin-client') {
        const id = new URL(req.url, 'http://x').searchParams.get('id');
        if (!isUuid(id)) return fail(res, 400, 'Bad id');
        const [[b], ledger, bought, [ag]] = await Promise.all([
          db(`brokers?id=eq.${id}&select=*`),
          db(`ledger?broker=eq.${id}&select=created_at,delta,reason,lead_id&order=created_at.desc&limit=100`),
          db(`leads?buyer=eq.${id}&select=id,price,stage,bought_at,auto,created_at&order=bought_at.desc&limit=1000`),
          db(`agreements?broker=eq.${id}&select=id,version,created_at,signer_name,signer_title&order=created_at.desc&limit=1`),
        ]);
        if (!b) return fail(res, 404, 'Not found');
        const first = bought.reduce((m, l) => (l.created_at < m ? l.created_at : m), new Date().toISOString());
        const since = new Date(Math.max(new Date(weekOf(first)), Date.now() - 400 * 864e5));
        const [sub, entries, ads] = await Promise.all([currentSub(b.stripe_customer).catch(() => null), commissionEntries(`broker=eq.${id}`),
          bought.length ? adCostsSince(since).catch(() => ({ status: 'error', costs: {} })) : { status: 'ok', costs: {} }]);
        const withCost = bought.map((l) => ({ ...l, ad_cost: ads.costs[l.id]?.cost ?? null, ad_by: ads.costs[l.id]?.by ?? 'none' }));
        return res.json({ broker: b, subscription: subOut(sub), ledger, bought: withCost, agreement: ag || null, waived: (await waivedIds()).has(id), commission: entries, meta: ads.status });
      }

      if (action === 'admin-agreement') {
        const id = Number(new URL(req.url, 'http://x').searchParams.get('id'));
        const [a] = await db(`agreements?id=eq.${id || 0}&select=*`);
        if (!a) return fail(res, 404, 'Not found');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="LL-PA-${String(a.id).padStart(5, '0')}-leaflegal-partner-agreement.pdf"`);
        return res.status(200).send(Buffer.from(await signedPdf(a)));
      }

      if (action === 'admin-update' && req.method === 'POST') {
        if (!isUuid(body.broker)) return fail(res, 400, 'Bad id');
        const t = (v, n) => (v === undefined ? undefined : String(v).trim().slice(0, n) || null);
        const patch = Object.fromEntries(Object.entries({ company: t(body.company, 120), contact_name: t(body.contact_name, 120), phone: t(body.phone, 40), fca_number: t(body.fca_number, 20),
          company_number: t(body.company_number, 12), address: t(body.address, 300), signer_title: t(body.signer_title, 80),
          ...(typeof body.is_admin === 'boolean' && body.broker !== uid ? { is_admin: body.is_admin } : {}) }).filter(([, v]) => v !== undefined));
        if (patch.company === null) delete patch.company;
        // Login email: change it in Supabase Auth first (it must be unique there), then on the broker record.
        const email = body.email === undefined ? null : String(body.email).trim().toLowerCase();
        if (email) {
          if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return fail(res, 400, 'Enter a valid email address');
          const [cur] = await db(`brokers?id=eq.${body.broker}&select=email`);
          if (cur && cur.email !== email) {
            const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${body.broker}`, { method: 'PUT', headers: { apikey: secretKey(), 'Content-Type': 'application/json' }, body: JSON.stringify({ email, email_confirm: true }) });
            if (!r.ok) { const u = await r.json().catch(() => ({})); return fail(res, 400, /already|exists|registered/i.test(u.msg || u.message || '') ? `${email} is already used by another account` : 'Could not change the email'); }
            patch.email = email;
          }
        }
        await db(`brokers?id=eq.${body.broker}`, { method: 'PATCH', body: patch });
        await audit(uid, 'broker-edit', body.broker, patch);
        if (body.cancel === true) {
          const [b] = await db(`brokers?id=eq.${body.broker}&select=stripe_customer`);
          const sub = await currentSub(b?.stripe_customer);
          if (sub) { await stripe(`subscriptions/${sub.id}`, { cancel_at_period_end: 'true' }); await audit(uid, 'cancel-subscription', body.broker, { sub: sub.id }); }
        }
        return res.json({ ok: true });
      }

      // Suspend: they can still sign in, but can't buy, aren't auto-bought for and get no lead alerts.
      if (action === 'admin-suspend' && req.method === 'POST') {
        if (!isUuid(body.broker) || body.broker === uid) return fail(res, 400, 'You can’t suspend your own account');
        const on = body.suspend !== false, reason = String(body.reason || '').trim().slice(0, 200) || null;
        await db(`brokers?id=eq.${body.broker}`, { method: 'PATCH', body: on ? { suspended_at: new Date().toISOString(), suspend_reason: reason } : { suspended_at: null, suspend_reason: null } });
        await audit(uid, on ? 'suspend' : 'unsuspend', body.broker, reason ? { reason } : {});
        return res.json({ ok: true });
      }

      // Delete: only accounts that never bought a lead (deleting a buyer would put their leads back on sale). Suspend the rest.
      if (action === 'admin-delete' && req.method === 'POST') {
        if (!isUuid(body.broker) || body.broker === uid) return fail(res, 400, 'You can’t delete your own account');
        const [[b], bought] = await Promise.all([db(`brokers?id=eq.${body.broker}&select=id,company,email,stripe_customer`), db(`leads?buyer=eq.${body.broker}&select=id&limit=1`)]);
        if (!b) return fail(res, 404, 'Broker not found');
        if (bought.length) return fail(res, 409, `${b.company} has bought leads, so their account can’t be deleted. Suspend it instead.`);
        if (String(body.confirm || '').trim().toLowerCase() !== String(b.company).trim().toLowerCase()) return fail(res, 400, 'Type the company name exactly to confirm');
        const sub = await currentSub(b.stripe_customer).catch(() => null);
        if (sub) await stripe(`subscriptions/${sub.id}`, {}, 'DELETE');
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${b.id}`, { method: 'DELETE', headers: { apikey: secretKey() } });
        if (!r.ok && r.status !== 404) return fail(res, 502, 'Could not delete the login. Nothing was changed.');
        await db(`brokers?id=eq.${b.id}`, { method: 'DELETE' }).catch(() => {}); // normally already gone via the auth cascade
        await audit(uid, 'delete', b.email, { company: b.company, subscription: sub?.id });
        return res.json({ ok: true });
      }

      // Invoiced plan, set up by hand: name, monthly price (ex VAT, for Finance) and monthly credits.
      if (action === 'admin-plan' && req.method === 'POST') {
        if (!isUuid(body.broker)) return fail(res, 400, 'Bad id');
        const [b] = await db(`brokers?id=eq.${body.broker}&select=id,email,company,plan`);
        if (!b) return fail(res, 404, 'Broker not found');
        if (body.remove) { await db(`brokers?id=eq.${b.id}`, { method: 'PATCH', body: { plan: null } }); await audit(uid, 'plan-remove', b.id, { plan: b.plan?.name }); return res.json({ ok: true }); }
        const name = String(body.name || '').trim().slice(0, 60), credits = Math.round(Number(body.credits)), price = Math.round(Number(body.price || 0) * 100) / 100;
        if (!name) return fail(res, 400, 'Give the plan a name');
        const commission = body.commission === true; // commission client: pays Leaflegal commission, not a plan price
        // Commission clients can have 0 monthly credits: flagged only, credits added by hand (worth £0 in Finance either way).
        if (!((commission ? credits >= 0 : credits > 0) && credits <= 1e6)) return fail(res, 400, 'Monthly credits must be a positive number');
        if (!(price >= 0 && price <= 1e7)) return fail(res, 400, 'Enter the monthly price in pounds');
        const start = body.start ? new Date(body.start) : new Date();
        if (isNaN(start)) return fail(res, 400, 'Pick a valid start date');
        const plan = { name, credits, price: commission ? 0 : price, ...(commission ? { commission: true } : {}), started_at: start.toISOString(), next_at: start.toISOString() };
        // Editing a running plan keeps its schedule unless a new start date is given.
        if (b.plan && !body.start) Object.assign(plan, { started_at: b.plan.started_at, next_at: b.plan.next_at });
        await db(`brokers?id=eq.${b.id}`, { method: 'PATCH', body: { plan } });
        await audit(uid, b.plan ? 'plan-edit' : 'plan-create', b.id, plan);
        const out = await grantPlan({ ...b, plan }); // starts today → first month's credits now
        return res.json({ ok: true, plan: out.plan, given: out.given });
      }

      // Every email the platform sends, built from the live code with test data (tools/preview_emails.mjs, rebuilt on deploy).
      if (action === 'admin-emails') {
        const fs = await import('node:fs');
        try { return res.json(JSON.parse(fs.readFileSync(new URL('./_lib/email-previews.json', import.meta.url), 'utf8'))); }
        catch { return fail(res, 404, 'Email previews haven’t been built yet'); }
      }

      // Excuse a client from the partner agreement (or require it again). They can then buy without signing.
      if (action === 'admin-agreement-waive' && req.method === 'POST') {
        if (!isUuid(body.broker)) return fail(res, 400, 'Bad id');
        const [b] = await db(`brokers?id=eq.${body.broker}&select=id,company`);
        if (!b) return fail(res, 404, 'Broker not found');
        const ids = await waivedIds(), on = body.waive !== false;
        on ? ids.add(b.id) : ids.delete(b.id);
        await db('settings', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { key: 'agreement_waived', value: { ids: [...ids] } } });
        await audit(uid, on ? 'agreement-waive' : 'agreement-require', b.id, { company: b.company });
        return res.json({ ok: true, waived: on });
      }

      // Commission clients: log a commission payment received, or ad spend on their leads (admin only, never shown to the broker).
      // One-off "What's new" email (17 Nov 2026): platform accounts get the account version, invited firms (not joined, not
      // unsubscribed, first invite already sent) the invite version with Accept your invite + one-click unsubscribe.
      // Scheduled with Resend (scheduledAt), 120 per call: the page calls again until done. dry: true (default) only counts.
      // cancel: true cancels every scheduled email not yet sent. Progress and email ids live in settings (whats_new_2026_11).
      if (action === 'admin-whats-new' && req.method === 'POST') {
        const KEY = 'whats_new_2026_11';
        const [row] = await db(`settings?key=eq.${KEY}&select=value`).catch(() => []);
        const st = row?.value || {};
        const save = (v) => db('settings', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { key: KEY, value: v } });
        if (body.cancel) {
          let n = 0;
          for (const id of st.ids || []) { await resendSlot(); const r = await fetch(`https://api.resend.com/emails/${id}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }).catch(() => null); if (r?.ok) n++; }
          await save({ ...st, cancelled_at: new Date().toISOString(), cancelled: n });
          await audit(uid, 'whats-new-cancelled', 'email', { cancelled: n });
          return res.json({ ok: true, cancelled: n });
        }
        const iso = new Date().toISOString();
        const [accounts, invited, all] = await Promise.all([
          db('brokers?is_admin=is.false&approved=is.true&suspended_at=is.null&select=id,email,contact_name&order=id.asc&limit=5000'),
          db(`invites?alerts=eq.true&expires_at=gt.${iso}&and=(or(email_id.is.null,email_id.not.in.(queued,paused)),or(send_at.is.null,send_at.lte.${iso}))&select=email,name,token&order=email.asc&limit=20000`),
          db('brokers?select=email&limit=10000'),
        ]);
        const onPlatform = new Set(all.map((b) => String(b.email).trim().toLowerCase()));
        const blocked = await suppressedSet([...accounts.map((b) => b.email), ...invited.map((v) => v.email)]);
        const ok = (e) => !blocked.has(String(e).trim().toLowerCase());
        const list = [...accounts.filter((b) => ok(b.email)).map((b) => ({ kind: 'account', email: b.email, name: b.contact_name })),
          ...invited.filter((v) => ok(v.email) && !onPlatform.has(String(v.email).trim().toLowerCase())).map((v) => ({ kind: 'invite', email: v.email, name: v.name, token: v.token }))];
        const counts = { accounts: list.filter((x) => x.kind === 'account').length, invited: list.filter((x) => x.kind === 'invite').length };
        if (body.dry !== false) return res.json({ dry: true, state: st.at ? { at: st.at, for: st.for, next: st.next, scheduled: st.scheduled, cancelled_at: st.cancelled_at } : null, ...counts });
        const when = new Date(body.schedule || st.for || 0);
        if (!(when > Date.now() + 60e3) || when > Date.now() + 70 * 36e5) return fail(res, 400, 'Pick a send time between 1 minute and 70 hours from now');
        if (st.for && st.for !== when.toISOString()) return fail(res, 409, `Already scheduled for ${st.for}`);
        if (st.cancelled_at) return fail(res, 409, 'This send was cancelled');
        const from = st.next || 0, chunk = list.slice(from, from + 120), ids = st.ids || [];
        const first = (n) => esc(String(n || '').trim().split(/\s+/)[0] || '');
        const subject = 'What’s new on Leaflegal';
        let scheduled = st.scheduled || 0;
        for (const x of chunk) {
          const opts = x.kind === 'invite' ? whatsNew(first(x.name), { token: x.token, email: x.email }) : { ...whatsNew(first(x.name)), replyTo: 'hello@leaflegal.co' };
          const id = await sendEmail([x.email], subject, emailHtml(opts), opts.replyTo, null, opts.unsub, when.toISOString(), true, x.kind === 'invite' ? BULK_FROM() : null);
          if (id && id !== 'suppressed') { scheduled++; if (typeof id === 'string') ids.push(id); }
        }
        const next = from + chunk.length, done = next >= list.length;
        await save({ at: st.at || iso, for: when.toISOString(), next, total: list.length, scheduled, ids, ...counts, ...(done ? { done_at: new Date().toISOString() } : {}) });
        if (done) await audit(uid, 'whats-new-scheduled', 'email', { for: when.toISOString(), scheduled, ...counts });
        return res.json({ ok: true, done, next, total: list.length, scheduled, for: when.toISOString() });
      }

      if (action === 'admin-commission' && req.method === 'POST') {
        if (body.remove) {
          const [e] = await db(`commission_entries?id=eq.${Number(body.remove) || 0}&select=*`);
          if (!e) return fail(res, 404, 'Entry not found');
          await db(`commission_entries?id=eq.${e.id}`, { method: 'DELETE' });
          await audit(uid, 'commission-remove', e.broker || e.channel || 'business', { kind: e.kind, amount: Number(e.amount), date: e.date });
          return res.json({ ok: true });
        }
        const kind = body.kind === 'spend' ? 'spend' : body.kind === 'commission' ? 'commission' : null;
        const wide = kind === 'spend' && !body.broker; // business-wide ad spend (LinkedIn, Google…), not tied to a client
        if (!wide && !isUuid(body.broker)) return fail(res, 400, 'Bad id');
        const amount = Math.round(Number(String(body.amount ?? '').replace(/[^\d.]/g, '')) * 100) / 100;
        const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : null;
        if (!kind) return fail(res, 400, 'Unknown entry type');
        if (!(amount > 0 && amount <= 1e7)) return fail(res, 400, 'Enter an amount in pounds');
        if (!date || new Date(date) > Date.now() + 864e5) return fail(res, 400, 'Pick a date, today or earlier');
        const [b] = wide ? [{ id: null }] : await db(`brokers?id=eq.${body.broker}&select=id`);
        if (!b) return fail(res, 404, 'Broker not found');
        const note = String(body.note || '').trim().slice(0, 200) || null, channel = String(body.channel || '').trim().slice(0, 40) || null;
        try { await db('commission_entries', { method: 'POST', body: { broker: b.id, kind, amount, date, note, channel } }); }
        catch (e) { console.error('commission', e.message); return fail(res, 503, 'Commission tracking isn’t switched on yet (the database table is missing).'); }
        await audit(uid, kind === 'spend' ? 'ad-spend-add' : 'commission-add', b.id || channel || 'business', { amount, date, channel: channel || undefined, note: note || undefined });
        return res.json({ ok: true });
      }

      // Delete invites (sent or scheduled): by email list or a whole CSV upload (batch). Scheduled emails are cancelled at Resend;
      // a deleted invite no longer pre-approves (signup checks the row) and gets no more lead emails. 100 per call; the page loops on `left`.
      if (action === 'admin-invite-delete' && req.method === 'POST') {
        const emails = Array.isArray(body.emails) ? body.emails.map((e) => String(e).trim().toLowerCase()).filter((e) => /@/.test(e)).slice(0, 100) : [];
        const batch = typeof body.batch === 'string' ? body.batch.slice(0, 60) : '';
        if (!emails.length && !batch) return fail(res, 400, 'Nothing to delete');
        const where = emails.length ? `email=in.(${emails.map((e) => `"${e.replace(/"/g, '')}"`).map(encodeURIComponent).join(',')})` : `batch=eq.${encodeURIComponent(batch)}`;
        const rows = await db(`invites?${where}&select=email,email_id,send_at&limit=100`);
        let cancelled = 0;
        for (const v of rows) {
          if (v.email_id && !['queued', 'paused', 'sent', 'accepted'].includes(v.email_id) && v.send_at && new Date(v.send_at) > Date.now() + 3e4) {
            await resendSlot();
            const r = await fetch(`https://api.resend.com/emails/${encodeURIComponent(v.email_id)}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }).catch(() => null);
            if (r?.ok) cancelled++; else console.error('resend cancel', v.email, r?.status);
          }
        }
        if (rows.length) await db(`invites?email=in.(${rows.map((v) => encodeURIComponent(`"${v.email}"`)).join(',')})`, { method: 'DELETE' });
        const left = batch && rows.length === 100 ? (await db(`invites?batch=eq.${encodeURIComponent(batch)}&select=email&limit=1`)).length : 0;
        await audit(uid, 'invite-delete', batch || emails.join(', ').slice(0, 200), { deleted: rows.length, cancelled, batch: batch || undefined });
        return res.json({ ok: true, deleted: rows.length, cancelled, left });
      }

      // Bulk invites from a CSV: the page sends up to 25 rows per call. Sends are spread out (perDay a day, 08:00–17:00 UTC,
      // from `start`) using Resend scheduling, so a big list never floods Resend or the domain's reputation. Firms that already
      // have an account or an invite are skipped. Bulk invitees get a weekly round-up of leads (digest) unless lead emails are off.
      if (action === 'admin-invite-bulk' && req.method === 'POST') {
        const rows = Array.isArray(body.rows) ? body.rows.slice(0, 200) : [];
        const batch = String(body.batch || '').slice(0, 60), perDay = Math.round(Number(body.perDay)), offset = Math.max(0, Math.round(Number(body.offset) || 0));
        const alerts = body.leads !== 'off', digest = body.leads !== 'instant', cold = body.kind === 'cold', start = body.start ? new Date(body.start) : new Date();
        if (!batch || !rows.length) return fail(res, 400, 'Nothing to upload');
        if (!(perDay >= 1 && perDay <= 2000)) return fail(res, 400, 'Choose how many invites to send a day');
        if (isNaN(start) || start < Date.now() - 6e4) return fail(res, 400, 'Pick a start time that isn’t in the past');
        const clean = rows.map((r) => ({ e: String(r.email || '').trim().toLowerCase(), n: String(r.name || '').trim().slice(0, 120), c: String(r.company || '').trim().slice(0, 120) }));
        const valid = clean.filter((r) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(r.e));
        const list = valid.map((r) => encodeURIComponent(`"${r.e.replace(/"/g, '')}"`)).join(',');
        const [brokersHad, invitesHad, unsubbed] = list ? await Promise.all([db(`brokers?email=in.(${list})&select=email`), db(`invites?email=in.(${list})&select=email`), suppressedSet(valid.map((r) => r.e))]) : [[], [], new Set()];
        const taken = new Set([...brokersHad, ...invitesHad].map((x) => x.email)); // existing accounts and invites are never touched
        const out = { queued: 0, skipped: 0, unsubscribed: 0, invalid: clean.length - valid.length, failed: [] }, add = [];
        let i = offset;
        for (const r of valid) {
          if (taken.has(r.e)) { out.skipped++; continue; }
          if (unsubbed.has(r.e)) { out.unsubscribed++; taken.add(r.e); continue; }
          taken.add(r.e);
          const at = bulkSendTime(start, perDay, i++), p = { e: r.e, n: r.n, ...(r.c ? { c: r.c } : {}), ...(cold ? { k: 'cold' } : {}) };
          add.push({ email: r.e, name: r.n || '', company: r.c || null, token: inviteToken(p), expires_at: new Date(+at + 30 * 864e5).toISOString(),
            alerts, digest, batch, send_at: at.toISOString(), email_id: 'queued' });
        }
        if (add.length) await db('invites', { method: 'POST', body: add });
        out.queued = add.length;
        for (const v of add) await crmCapture({ email: v.email, name: v.name, company: v.company, source: 'Invited to platform', stage: 'contacted', tags: ['Platform invite', 'CSV upload', cold ? 'Cold invite' : 'Warm invite'], flowsPaused: true,
          note: `Invited to Leaflegal Platform from a CSV upload (${cold ? 'cold' : 'warm'}), sending ${new Date(v.send_at).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' })}` }).catch((err) => console.error('crm invite', err.message));
        if (!offset) await saveBatch(batch, { perDay, kind: cold ? 'cold' : 'warm', leads: body.leads || 'weekly', paused: false });
        await audit(uid, 'invite-bulk', batch, { queued: out.queued, skipped: out.skipped, invalid: out.invalid, kind: cold ? 'cold' : 'warm', perDay });
        return res.json({ ok: true, ...out, next: i });
      }

      // Change lead emails for chosen invites (any invite: single, CSV, sent or not): weekly round-up, every new lead, or none.
      if (action === 'admin-invite-leads' && req.method === 'POST') {
        const emails = Array.isArray(body.emails) ? body.emails.map((e) => String(e).trim().toLowerCase()).filter((e) => /@/.test(e)).slice(0, 500) : [];
        if (!emails.length) return fail(res, 400, 'Choose some invites first');
        if (!['weekly', 'instant', 'off'].includes(body.leads)) return fail(res, 400, 'Choose weekly, every lead or none');
        await db(`invites?email=in.(${emails.map((e) => encodeURIComponent(`"${e.replace(/"/g, '')}"`)).join(',')})`, { method: 'PATCH', body: { alerts: body.leads !== 'off', digest: body.leads !== 'instant' } });
        await audit(uid, 'invite-leads', `${emails.length} invite${emails.length === 1 ? '' : 's'}`, { leads: body.leads });
        return res.json({ ok: true, changed: emails.length });
      }

      // Control a CSV upload that's still going out: pause, resume, change the daily pace, or change its lead emails.
      // Invites already handed to Resend but not yet sent are cancelled there first (25 per call; the page repeats while `more`),
      // then everything still to go is re-timed from `start` at the new pace. Sent invites aren't touched (except lead emails).
      if (action === 'admin-invite-batch' && req.method === 'POST') {
        const batch = String(body.batch || '').slice(0, 60), op = body.op;
        if (!batch || !['pause', 'resume', 'pace', 'leads'].includes(op)) return fail(res, 400, 'Unknown change');
        const enc = encodeURIComponent(batch);
        if (op === 'leads') {
          if (!['weekly', 'instant', 'off'].includes(body.leads)) return fail(res, 400, 'Choose weekly, every lead or none');
          await db(`invites?batch=eq.${enc}`, { method: 'PATCH', body: { alerts: body.leads !== 'off', digest: body.leads !== 'instant' } });
          await saveBatch(batch, { leads: body.leads });
          await audit(uid, 'invite-batch-leads', batch, { leads: body.leads });
          return res.json({ ok: true });
        }
        const perDay = Math.round(Number(body.perDay)), start = body.start ? new Date(body.start) : new Date();
        if (op !== 'pause' && !(perDay >= 1 && perDay <= 2000)) return fail(res, 400, 'Choose between 1 and 2,000 invites a day');
        if (op !== 'pause' && (isNaN(start) || start < Date.now() - 6e4)) return fail(res, 400, 'Pick a start time that isn’t in the past');
        // 1. Take back invites waiting at Resend (scheduled, not sent yet).
        const heldQ = `invites?batch=eq.${enc}&email_id=not.in.(queued,paused,sent,accepted)&send_at=gt.${new Date(Date.now() + 2 * 6e4).toISOString()}`;
        const atResend = await db(`${heldQ}&select=email,email_id&limit=25`); // 25 per call keeps each call well inside the function time limit
        let cancelled = 0;
        for (const v of atResend) {
          await resendSlot();
          const r = await fetch(`https://api.resend.com/emails/${encodeURIComponent(v.email_id)}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }).catch(() => null);
          // Resend won't cancel (too late, or the key can't): stop trying, those keep their time and the rest is paced around them.
          if (!r?.ok) { console.error('invite cancel failed', r?.status, await r?.text().catch(() => '')); break; }
          await db(`invites?email=eq.${encodeURIComponent(v.email)}`, { method: 'PATCH', body: { email_id: 'queued' } });
          cancelled++;
        }
        if (atResend.length === 25 && cancelled === 25) return res.json({ ok: true, more: true });
        // 2. Pause, or re-time everything still to go.
        if (op === 'pause') {
          await db(`invites?batch=eq.${enc}&email_id=eq.queued`, { method: 'PATCH', body: { email_id: 'paused' } });
          await saveBatch(batch, { paused: true });
        } else {
          // Invites still scheduled at Resend take the first slots of the new pace, so the daily total stays about right.
          // ponytail: counts slots, not exact times; a day can run a little over while the held ones drain.
          const [{ count: held = 0 } = {}] = await db(`${heldQ}&send_at=gte.${start.toISOString()}&select=count`).catch(() => []);
          const left = await db(`invites?batch=eq.${enc}&email_id=in.(queued,paused)&select=*&order=send_at.asc,email.asc&limit=20000`);
          const rows = left.map((v, i) => { const at = bulkSendTime(start, perDay, i + held); return { ...v, email_id: 'queued', send_at: at.toISOString(), expires_at: new Date(+at + 30 * 864e5).toISOString() }; });
          for (let i = 0; i < rows.length; i += 500) await db('invites', { method: 'POST', prefer: 'resolution=merge-duplicates', body: rows.slice(i, i + 500) });
          await saveBatch(batch, { perDay, paused: false });
        }
        const [{ count: kept = 0 } = {}] = await db(`${heldQ}&select=count`).catch(() => []);
        await audit(uid, `invite-batch-${op}`, batch, op === 'pause' ? { kept } : { perDay, start: start.toISOString(), kept });
        return res.json({ ok: true, more: false, kept });
      }

      // Hands queued invites due soon to Resend (the upload page calls this until nothing is left, the daily job does the rest).
      // One-off catch-up: walk Resend's sent history (100 a call, newest first) and suppress past hard bounces and complaints.
      if (action === 'admin-resend-backfill' && req.method === 'POST') {
        await resendSlot();
        const after = /^[\w-]{1,64}$/.test(body.after || '') ? `&after=${body.after}` : '';
        const r = await fetch(`https://api.resend.com/emails?limit=100${after}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
        if (!r.ok) return fail(res, 502, `Resend said ${r.status}: ${(await r.text()).slice(0, 200)}`);
        const { data = [], has_more } = await r.json();
        let added = 0;
        for (const m of data) if (m.last_event === 'bounced' || m.last_event === 'complained')
          for (const e of [].concat(m.to || [])) if (await suppress(e, m.last_event === 'bounced' ? 'Bounced (earlier send)' : 'Marked as spam (earlier send)', 'resend')) added++;
        return res.json({ ok: true, seen: data.length, added, next: has_more && data.length ? data[data.length - 1].id : null });
      }

      // Blog publishing (scheduled runs): keys and the posts they published. Keys are shown once, only hashes are kept.
      if (action === 'admin-blog') {
        const keys = (await listKeys()).map(({ hash, ...k }) => k);
        if (!ghReady()) return res.json({ ready: false, keys, posts: [] });
        const dir = await gh(BLOG_DIR);
        const files = (dir.ok ? dir.data : []).filter((f) => f.name.endsWith('.json')).slice(0, 100);
        const posts = (await Promise.all(files.map(async (f) => { const r = await gh(f.path); if (!r.ok) return null;
          const p = JSON.parse(Buffer.from(r.data.content, 'base64').toString('utf8')); return { slug: p.slug, title: p.title, category: p.category, date: p.date }; })))
          .filter(Boolean).sort((a, b) => b.date.localeCompare(a.date));
        return res.json({ ready: true, keys, posts });
      }
      if (action === 'admin-blog-key' && req.method === 'POST') {
        const name = String(body.name || '').trim();
        if (!name) return fail(res, 400, 'Give the key a name, e.g. Weekly blog run');
        const key = await createKey(name);
        await audit(me.id, 'blog-key-create', name, {});
        return res.json({ ok: true, key });
      }
      if (action === 'admin-blog-key-revoke' && req.method === 'POST') {
        await revokeKey(String(body.id || ''));
        await audit(me.id, 'blog-key-revoke', String(body.id || ''), {});
        return res.json({ ok: true });
      }
      if (action === 'admin-blog-unpublish' && req.method === 'POST') {
        const slug = String(body.slug || '');
        if (!/^[a-z0-9-]{3,80}$/.test(slug)) return fail(res, 400, 'Bad slug');
        const cur = await gh(`${BLOG_DIR}/${slug}.json`);
        if (!cur.ok) return fail(res, 404, 'Post not found');
        const del = await gh(`${BLOG_DIR}/${slug}.json`, { method: 'DELETE', body: { message: `Blog: unpublish ${slug}`, sha: cur.data.sha, branch: 'main' } });
        if (!del.ok) return fail(res, 502, `GitHub refused (${del.status})`);
        await audit(me.id, 'blog-unpublish', slug, {});
        return res.json({ ok: true });
      }

      if (action === 'admin-invite-flush' && req.method === 'POST') {
        const n = await flushInvites(20000);
        const [{ count } = {}] = await db(`invites?email_id=eq.queued&send_at=lte.${new Date(Date.now() + FLUSH_AHEAD).toISOString()}&select=count`).catch(() => []);
        return res.json({ ok: true, handed: n, left: Number(count) || 0 });
      }

      // Cancel a scheduled invite before it goes out: cancels the email at Resend and removes the invite (no lead emails either).
      if (action === 'admin-invite-cancel' && req.method === 'POST') {
        const e = String(body.email || '').trim().toLowerCase();
        const [v] = await db(`invites?email=eq.${encodeURIComponent(e)}&select=email,email_id,send_at`);
        if (!v) return fail(res, 404, 'Invite not found');
        if (!v.email_id || !v.send_at || new Date(v.send_at) <= Date.now()) return fail(res, 400, 'This invite has already been sent, or was queued before cancelling was possible');
        const r = await fetch(`https://api.resend.com/emails/${encodeURIComponent(v.email_id)}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
        if (!r.ok) { console.error('resend cancel', r.status, await r.text()); return fail(res, 502, 'Couldn’t cancel the email. It may already be sending.'); }
        await db(`invites?email=eq.${encodeURIComponent(e)}`, { method: 'DELETE' });
        await audit(uid, 'invite-cancel', e, {});
        return res.json({ ok: true });
      }

      // Change an invite's email, name or firm. The email and name live inside the signed invite link, so the link is re-made:
      // queued/paused ones just get the new link; ones scheduled at Resend are cancelled and rescheduled for the same time;
      // already-sent ones go out again now if the email changed (the first one went to the wrong address). Upload, lead-email
      // settings and created date are kept.
      if (action === 'admin-invite-edit' && req.method === 'POST') {
        const low = (x) => String(x || '').trim().toLowerCase(), old = low(body.email), e = low(body.newEmail || body.email);
        const [v] = await db(`invites?email=eq.${encodeURIComponent(old)}&select=*`);
        if (!v) return fail(res, 404, 'Invite not found');
        if (v.email_id === 'accepted') return fail(res, 400, 'They have already joined. Change their email under Clients instead.');
        const n = String(body.name ?? v.name ?? '').trim().slice(0, 120), c = String(body.company ?? v.company ?? '').trim().slice(0, 120);
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) return fail(res, 400, 'Please enter a valid email address');
        if (!n) return fail(res, 400, 'Please enter their name');
        const moved = e !== old, renamed = n !== (v.name || '') || c !== (v.company || '');
        if (!moved && !renamed) return res.json({ ok: true, changed: false });
        if (moved) {
          const [had] = await db(`brokers?email=eq.${encodeURIComponent(e)}&select=company`);
          if (had) return fail(res, 400, `${e} already has an account (${had.company})`);
          if ((await db(`invites?email=eq.${encodeURIComponent(e)}&select=email`)).length) return fail(res, 400, `${e} already has an invite`);
          if ((await suppressedSet([e])).size) return fail(res, 400, `${e} has unsubscribed from Leaflegal emails, so they can’t be invited`);
        }
        const k = tokenData(v.token)?.k, P = { e, n, ...(c ? { c } : {}), ...(k ? { k } : {}) };
        const waiting = ['queued', 'paused'].includes(v.email_id);
        const held = !waiting && v.email_id && v.email_id !== 'sent' && v.send_at && new Date(v.send_at) > Date.now() + 6e4; // scheduled at Resend
        let row = { ...v, email: e, name: n, company: c || null }, outcome = 'saved';
        if (waiting || held || moved) { const t = inviteToken(P); row = { ...row, token: t, expires_at: new Date(tokenData(t).x).toISOString() }; }
        if (held) {
          await resendSlot();
          const r = await fetch(`https://api.resend.com/emails/${encodeURIComponent(v.email_id)}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }).catch(() => null);
          if (!r?.ok) return fail(res, 502, 'Couldn’t take back the scheduled email. It may be sending now; try again in a minute.');
        }
        if (held || (moved && !waiting)) {
          const sent = await sendInvite({ ...P, x: tokenData(row.token).x, alerts: v.alerts, at: held ? v.send_at : undefined }, `${PLATFORM_URL}/register?invite=${row.token}`);
          if (!sent || sent === 'suppressed') return fail(res, 502, 'Couldn’t send the invite to the new address. Please try again.');
          row = { ...row, email_id: typeof sent === 'string' ? sent : 'sent', send_at: held ? v.send_at : null };
          outcome = held ? 'rescheduled' : 'resent';
        } else if (waiting) outcome = 'queued';
        await db('invites', { method: 'POST', prefer: 'resolution=merge-duplicates', body: row });
        if (moved) await db(`invites?email=eq.${encodeURIComponent(old)}`, { method: 'DELETE' });
        await audit(uid, 'invite-edit', old, { ...(moved ? { to: e } : {}), name: n, company: c || undefined, outcome });
        return res.json({ ok: true, changed: true, outcome, at: row.send_at || null });
      }

      if (action === 'admin-invite' && req.method === 'POST') {
        const e = String(body.email || '').trim().toLowerCase(), n = String(body.name || '').trim().slice(0, 120), c = String(body.company || '').trim().slice(0, 120);
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) return fail(res, 400, 'Please enter a valid email address');
        if (!n) return fail(res, 400, 'Please enter their name');
        const [had] = await db(`brokers?email=eq.${encodeURIComponent(e)}&select=company`);
        if (had) return fail(res, 400, `${e} already has an account (${had.company})`);
        if ((await suppressedSet([e])).size) return fail(res, 400, `${e} has unsubscribed from Leaflegal emails, so they can’t be invited. They can still sign up themselves.`);
        const p = { e, n, ...(c ? { c } : {}), ...(body.kind === 'cold' ? { k: 'cold' } : {}) }, t = inviteToken(p);
        const x = JSON.parse(Buffer.from(t.split('.')[0], 'base64url')).x, alerts = body.alerts !== false;
        // Optional later send: Resend holds the email until then, and lead alerts wait for it too.
        const at = body.sendAt ? new Date(body.sendAt) : null;
        if (at && !(at > Date.now() + 6e4 && at < Date.now() + 7 * 864e5)) return fail(res, 400, 'Pick a send time in the next 7 days');
        const sent = await sendInvite({ ...p, x, alerts, at: at?.toISOString() }, `${PLATFORM_URL}/register?invite=${t}`);
        if (!sent && at) return fail(res, 502, 'Couldn’t schedule the email. Please try again.');
        // Kept so new-lead emails reach them while they finish signing up. Deleted when they accept.
        await db('invites', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { email: e, name: n, company: c || null, token: t, expires_at: new Date(x).toISOString(), alerts, send_at: at?.toISOString() || null, email_id: typeof sent === 'string' ? sent : null } });
        await crmCapture({ email: e, name: n, company: c, source: 'Invited to platform', stage: 'contacted', tags: ['Platform invite', body.kind === 'cold' ? 'Cold invite' : 'Warm invite'], flowsPaused: true, note: `Invited to Leaflegal Platform (${body.kind === 'cold' ? 'cold' : 'warm'})${at ? ` (sending ${at.toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' })})` : ''}` }).catch((err) => console.error('crm invite', err.message));
        await audit(uid, at ? 'invite-scheduled' : 'invite', e, { name: n, company: c || undefined, ...(at ? { at: at.toISOString() } : {}) });
        return res.json({ ok: true, at: at?.toISOString() || null });
      }

      if (action === 'admin-broker' && req.method === 'POST') {
        const [b] = await db(`brokers?id=eq.${encodeURIComponent(body.id)}&select=*`);
        if (!b) return fail(res, 404, 'Broker not found');
        // Pricing system: 'credit' (original calculated price per lead) or 'tier' (flat price per tier, tier-based auto-buy).
        if ((body.pricing === 'credit' || body.pricing === 'tier') && body.pricing !== b.pricing) {
          await db(`brokers?id=eq.${b.id}`, { method: 'PATCH', body: { pricing: body.pricing } });
          await audit(uid, 'broker-pricing', b.id, { company: b.company, from: b.pricing, to: body.pricing });
          return res.json({ ok: true, pricing: body.pricing });
        }
        if (typeof body.approved === 'boolean') await setApproved(b, body.approved, uid);
        const delta = Math.round(Number(body.credits) || 0);
        await audit(uid, 'broker', b.id, { approved: body.approved, credits: delta || undefined, reason: body.reason, invoiced: Number(body.invoiced) || undefined });
        if (delta) {
          if (b.credits + delta < 0) return fail(res, 400, `They only have ${b.credits} credits`);
          const why = String(body.reason || (delta > 0 ? 'Credits added by Leaflegal' : 'Credits removed by Leaflegal')).slice(0, 120);
          const ref = `admin-${Date.now()}-${b.id}`, invoiced = Math.round(Number(body.invoiced || 0) * 100) / 100;
          await rpc('add_credits', { p_broker: b.id, p_delta: delta, p_reason: why, p_ref: ref });
          if (delta > 0) await pendingBacklog(b.id).catch((e) => console.error('backlog', e.message));
          if (invoiced > 0) await db(`ledger?ref=eq.${encodeURIComponent(ref)}`, { method: 'PATCH', body: { invoiced } });
          await notify([b.email], delta > 0 ? `${delta.toLocaleString('en-GB')} credits added to your account` : 'Your credit balance has been adjusted', {
            title: delta > 0 ? 'Credits added to your account' : 'Your credit balance has been adjusted', preheader: `${delta > 0 ? '+' : '-'}${Math.abs(delta).toLocaleString('en-GB')} credits. New balance: ${(b.credits + delta).toLocaleString('en-GB')}.`,
            intro: `We've ${delta > 0 ? 'added' : 'removed'} ${Math.abs(delta).toLocaleString('en-GB')} credits ${delta > 0 ? 'to' : 'from'} ${esc(b.company)}'s account. The change shows in your credit history under Billing.`,
            highlight: { value: `${delta > 0 ? '+' : '−'}${Math.abs(delta).toLocaleString('en-GB')} credits`, label: `New balance: ${(b.credits + delta).toLocaleString('en-GB')} credits` },
            rows: [['Reason', why], ['New balance', `${(b.credits + delta).toLocaleString('en-GB')} credits`]], cta: { label: 'View credit history', url: `${PLATFORM_URL}/billing` } });
        }
        return res.json({ ok: true });
      }

      if (action === 'admin-refund' && req.method === 'POST') {
        const [r] = await db(`returns?id=eq.${Number(body.id)}&status=eq.pending&select=*,leads!returns_lead_id_fkey(price,buyer),brokers!returns_broker_fkey(email,company)`);
        if (!r) return fail(res, 404, 'Refund already decided');
        const approve = !!body.approve, why = approve ? '' : [DECLINE_REASONS[body.why] || '', String(body.note || '').trim().slice(0, 1000)].filter(Boolean).join('\n\n');
        if (!approve && !why) return fail(res, 400, 'Choose a reason or write one');
        if (approve && r.leads.buyer && r.leads.buyer !== r.broker) return fail(res, 409, 'This lead has moved to another broker since. Add credits by hand instead.');
        await audit(uid, approve ? 'refund-approve' : 'refund-decline', r.id, { lead: r.lead_id, credits: r.leads.price, ...(approve ? {} : { why: body.why || 'custom' }) });
        if (approve) await rpc('add_credits', { p_broker: r.broker, p_delta: r.leads.price, p_reason: `Refund for lead #${r.lead_id}`, p_ref: `return-${r.id}` });
        await db(`returns?id=eq.${r.id}`, { method: 'PATCH', body: { status: approve ? 'approved' : 'rejected', decided_at: new Date().toISOString(), ...(approve ? { credits: r.leads.price } : { decision: why }) } });
        await notify([r.brokers.email], `Refund ${approve ? 'approved' : 'declined'}: lead #${r.lead_id}`, {
          title: approve ? 'Refund approved' : 'Refund declined',
          preheader: approve ? `${r.leads.price} credits are back on your balance.` : `We've looked into lead #${r.lead_id}.`,
          intro: approve ? `We've looked into lead #${r.lead_id} and agree it should be refunded. Sorry about that. The credits are back on your balance and ready to use.`
            : `We've looked into your refund request for lead #${r.lead_id} and can't refund it this time.<br><br>${esc(why).replace(/\n/g, '<br>')}<br><br>If you think we've got this wrong, just reply to this email and we'll take another look.`,
          ...(approve ? { highlight: { value: `+${r.leads.price} credits`, label: 'returned to your balance' } } : {
            tipsTitle: 'Tips for hard-to-reach leads', tips: ['Try calling at a different time of day, and leave a short voicemail saying you’re following up their Leaflegal enquiry.', 'Send a text and an email as well. Many business owners reply in writing first.', 'Make three or four attempts over a few days before marking the lead as lost.'] }),
          cta: { label: 'Go to My leads', url: `${PLATFORM_URL}/leads` }, replyTo: 'hello@leaflegal.co' });
        return res.json({ ok: true, lead: r.lead_id });
      }

      // One lead in full (contact details, consent and source), plus the brokers it can be assigned to.
      if (action === 'admin-lead' && req.method === 'GET') {
        const id = Number(req.query?.id ?? new URL(req.url, 'http://x').searchParams.get('id'));
        if (!Number.isInteger(id) || id < 1) return fail(res, 400, 'Bad id');
        const [[l], brokers] = await Promise.all([
          db(`leads?id=eq.${id}&select=*,brokers!leads_buyer_fkey(company,email,pricing)`),
          db('brokers?select=id,company,contact_name,email,credits,approved,plan&order=company.asc'),
        ]);
        if (!l) return fail(res, 404, 'Lead not found');
        await withPaid([l], new Set(brokers.filter((b) => b.plan?.commission).map((b) => b.id)));
        const [notes, rets] = l.buyer ? await Promise.all([db(`lead_notes?lead_id=eq.${l.id}&select=body,created_at&order=created_at.asc`).catch(() => []),
          db(`returns?lead_id=eq.${l.id}&select=reason,details,status,decision,created_at,brokers!returns_broker_fkey(company)&order=created_at.desc`).catch(() => [])]) : [[], []];
        const [off] = l.email ? await db(`email_suppressions?email=eq.${encodeURIComponent(l.email.trim().toLowerCase())}&select=reason,source,created_at`).catch(() => []) : [];
        const [origin] = await withAdNames([leadOrigin(l.source || {})]);
        return res.json({ notes, refunds: rets, lead: { ...l, ...origin, quality: quality(l), suppressed: off || null, ...(l.buyer ? {} : { ...salePrice(l), discount_at: discountable(l) && !l.price_fixed ? new Date(new Date(l.created_at).getTime() + DISCOUNT.hours * 36e5).toISOString() : null }) },
          brokers, turnovers: TURNOVERS, trading: TRADING, pricing: await getPricing() });
      }

      // Change a lead's price, assign it to a broker, or delete it.
      if (action === 'admin-lead' && req.method === 'POST') {
        const id = Number(body.id);
        if (!Number.isInteger(id) || id < 1) return fail(res, 400, 'Bad id');
        const [l] = await db(`leads?id=eq.${id}&select=${FULL},buyer`);
        if (!l) return fail(res, 404, 'Lead not found');

        if (body.op === 'price') {
          const p = Math.round(Number(body.price));
          if (!(p >= 1 && p <= 1000)) return fail(res, 400, 'Price must be between 1 and 1,000 credits');
          if (l.buyer) return fail(res, 409, 'This lead has already been sold');
          await db(`leads?id=eq.${id}&buyer=is.null`, { method: 'PATCH', body: { price: p } });
          await audit(uid, 'lead-price', String(id), { from: l.price, to: p });
          return res.json({ ok: true });
        }

        // Take a lead back (after a refund, or to correct it): fix its figures, set a new price, and either put it back in
        // Opportunities or hand it straight to another broker (falls through to 'assign' below).
        if (body.op === 'relist') {
          const turnover = body.turnover || l.turnover, trading = body.trading || l.trading;
          if (turnover !== l.turnover && !TURNOVERS.includes(turnover)) return fail(res, 400, 'Choose a revenue band');
          if (trading !== l.trading && !TRADING.includes(trading)) return fail(res, 400, 'Choose a trading time');
          const full = l.list_price || l.price, next = { ...l, turnover, trading };
          const p = body.price === 'half' ? Math.max(1, Math.ceil(full / 2)) : body.price === 'recalc' ? price(next, await getPricing()) : body.price === 'full' || body.price == null ? full : Math.round(Number(body.price));
          if (!(p >= 1 && p <= 1000)) return fail(res, 400, 'Price must be between 1 and 1,000 credits');
          const patch = { turnover, trading, price: p, list_price: body.price === 'half' ? full : null, price_fixed: true,
            ...(l.buyer ? { buyer: null, bought_at: null, auto: false, stage: 'new', stage_at: null, funded_amount: null } : {}) };
          let refunded = 0;
          if (body.refund && l.buyer) { // credit the buyer back what they paid for it, less anything already refunded
            const rows = await db(`ledger?broker=eq.${l.buyer}&or=(lead_id.eq.${id},reason.eq.${encodeURIComponent(`"Refund for lead #${id}"`)})&select=delta`);
            refunded = -rows.reduce((a, r) => a + r.delta, 0);
            if (refunded > 0) {
              await rpc('add_credits', { p_broker: l.buyer, p_delta: refunded, p_reason: `Refund for lead #${id}`, p_ref: `relist-${id}-${Date.now()}` });
              const [rb] = await db(`brokers?id=eq.${l.buyer}&select=email`);
              if (rb) await notify([rb.email], `Refund approved: lead #${id}`, {
                title: 'Refund approved', preheader: `${refunded} credits are back on your balance.`,
                intro: `We've refunded lead #${id}. The credits are back on your balance and ready to use.`,
                highlight: { value: `+${refunded} credits`, label: 'returned to your balance' },
                cta: { label: 'Go to My leads', url: `${PLATFORM_URL}/leads` }, replyTo: 'hello@leaflegal.co' }).catch((e) => console.error('refund email', e.message));
            } else refunded = 0;
          }
          await db(`leads?id=eq.${id}`, { method: 'PATCH', body: patch });
          await audit(uid, 'lead-relist', String(id), { from: { buyer: l.buyer || undefined, price: l.price, turnover: l.turnover, trading: l.trading }, to: { price: p, turnover, trading }, broker: body.broker || undefined, refunded: refunded || undefined });
          if (!body.broker) return res.json({ ok: true, price: p, refunded });
          Object.assign(l, patch);
          body.op = 'assign';
        }

        if (body.op === 'assign') {
          if (!isUuid(body.broker)) return fail(res, 400, 'Choose a broker');
          if (l.buyer) return fail(res, 409, 'This lead has already been sold');
          const [b] = await db(`brokers?id=eq.${body.broker}&select=*`);
          if (!b) return fail(res, 404, 'Broker not found');
          if (body.charge) {
            if (!(await signed(b.id))) return fail(res, 400, `${b.company} hasn't accepted the partner agreement yet. Assign it free instead, or ask them to accept it.`);
            if (!(await rpc('buy_lead', { p_lead: id, p_broker: b.id, p_auto: false }))) {
              return fail(res, 402, b.approved ? `${b.company} doesn't have enough credits (${b.credits}). Assign it free instead, or add credits first.` : `${b.company} isn't approved yet`);
            }
          } else {
            const done = await db(`leads?id=eq.${id}&buyer=is.null`, { method: 'PATCH', body: { buyer: b.id, bought_at: new Date().toISOString(), auto: false }, prefer: 'return=representation' });
            if (!done?.length) return fail(res, 409, 'This lead has just been taken');
            await db('ledger', { method: 'POST', body: { broker: b.id, delta: 0, reason: 'Lead assigned by Leaflegal (no charge)', lead_id: id } });
          }
          const [sold] = await db(`leads?id=eq.${id}&select=${FULL}`);
          await audit(uid, 'lead-assign', String(id), { broker: b.id, company: b.company, charged: !!body.charge, price: body.charge ? sold.price : 0 });
          await Promise.allSettled([deliver(b, sold), ...(body.charge ? [lowCredits(b, b.credits, b.credits - sold.price)] : [])]);
          return res.json({ ok: true });
        }

        // Send the lead to its buyer again (email, webhook, CRM), e.g. after a change made outside the admin screens.
        if (body.op === 'redeliver') {
          if (!l.buyer) return fail(res, 400, 'This lead hasn’t been sold');
          const [[b], [full]] = await Promise.all([db(`brokers?id=eq.${l.buyer}&select=*`), db(`leads?id=eq.${id}&select=${FULL}`)]);
          await deliver(b, full);
          await audit(uid, 'lead-redeliver', String(id), { broker: b.id });
          return res.json({ ok: true });
        }

        // Tell a broker the credits for this lead are back on their balance (when the refund was made by hand).
        if (body.op === 'refund-notice') {
          if (!isUuid(body.broker)) return fail(res, 400, 'Choose a broker');
          const credits = Math.round(Number(body.credits));
          if (!(credits >= 1 && credits <= 1000)) return fail(res, 400, 'Credits must be between 1 and 1,000');
          const [b] = await db(`brokers?id=eq.${body.broker}&select=email`);
          if (!b) return fail(res, 404, 'Broker not found');
          const ids = [id, ...(Array.isArray(body.also) ? body.also.map(Number).filter((n) => Number.isInteger(n) && n > 0 && n !== id) : [])], names = ids.map((n) => `#${n}`).join(', ').replace(/, ([^,]*)$/, ' and $1'), one = ids.length === 1;
          await notify([b.email], `Refund approved: lead${one ? '' : 's'} ${names}`, {
            title: 'Refund approved', preheader: `${credits} credits are back on your balance.`,
            intro: `${body.note ? `${esc(String(body.note).trim().slice(0, 2000)).replace(/\n/g, '<br>')}<br><br>` : ''}We've refunded lead${one ? '' : 's'} ${names}. The credits are back on your balance and ready to use.`,
            highlight: { value: `+${credits} credits`, label: 'returned to your balance' },
            cta: { label: 'Go to My leads', url: `${PLATFORM_URL}/leads` }, replyTo: 'hello@leaflegal.co' });
          await audit(uid, 'refund-notice', String(id), { broker: body.broker, credits, note: !!body.note });
          return res.json({ ok: true });
        }

        // Suppression list: no more emails to this business from Leaflegal or any broker's CRM. Takes effect on the next send.
        if (body.op === 'suppress') {
          if (!l.email) return fail(res, 400, 'This lead has no email address');
          if (!(await suppress(l.email, String(body.why || 'Suppressed by Leaflegal').slice(0, 200), 'admin'))) return fail(res, 400, `${l.email} belongs to a broker account, so it can’t be suppressed`);
          await audit(uid, 'lead-suppress', String(id), { email: l.email });
          return res.json({ ok: true });
        }
        if (body.op === 'hide' || body.op === 'unhide') {
          await db(`leads?id=eq.${id}`, { method: 'PATCH', body: { hidden_at: body.op === 'hide' ? new Date().toISOString() : null } });
          await audit(uid, `lead-${body.op}`, String(id), {});
          return res.json({ ok: true });
        }
        if (body.op === 'unsuppress') {
          if (l.email) await unsuppress(l.email);
          await audit(uid, 'lead-unsuppress', String(id), { email: l.email });
          return res.json({ ok: true });
        }

        if (body.op === 'delete') {
          if (body.confirm !== id) return fail(res, 400, 'Confirm the lead number to delete it');
          await db(`leads?id=eq.${id}`, { method: 'DELETE' });
          await audit(uid, 'lead-delete', String(id), { business: l.business, price: l.price, buyer: l.buyer });
          return res.json({ ok: true });
        }
        return fail(res, 400, 'Unknown action');
      }

      // Tier prices (credits per lead). Unsold leads take the new price straight away; sold leads keep what was paid.
      if (action === 'admin-tier-prices' && req.method === 'POST') {
        const value = Object.fromEntries(TIER_NAMES.map((t) => [t, Math.round(Number(body.prices?.[t]))]));
        if (Object.values(value).some((v) => !(v >= 1 && v <= 1000))) return fail(res, 400, 'Each tier price must be between 1 and 1,000 credits');
        await db('settings', { method: 'POST', body: { key: 'tier_prices', value, updated_at: new Date().toISOString() }, prefer: 'resolution=merge-duplicates' });
        await Promise.all(TIER_NAMES.map((t) => db(`leads?buyer=is.null&tier=eq.${encodeURIComponent(t)}`, { method: 'PATCH', body: { tier_price: value[t] } })));
        await audit(uid, 'tier-prices', 'tier_prices', value);
        return res.json({ ok: true, prices: value });
      }

      if (action === 'admin-pricing' && req.method === 'POST') {
        const n = (v, lo, hi, d) => { const x = Number(v); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };
        const min = Math.round(n(body.min, 1, 1000, DEFAULT_PRICING.min)), max = Math.round(n(body.max, min, 5000, 250));
        const value = {
          min, max,
          age: Object.fromEntries(TRADING.map((t) => [t, n(body.age?.[t], 0, 1.5, DEFAULT_PRICING.age[t])])),
          revenue: Object.fromEntries(TURNOVERS.map((t) => [t, n(body.revenue?.[t], 0, 1.5, DEFAULT_PRICING.revenue[t])])),
          adverse: n(body.adverse, 0, 1.5, 0.75), unsure: n(body.unsure, 0, 1.5, 1),
          sizeFrom: 50000, sizeFloor: n(body.sizeFloor, 0, 1, DEFAULT_PRICING.sizeFloor), floorPrime: Math.round(n(body.floorPrime, 0, 1000, DEFAULT_PRICING.floorPrime)),
        };
        await audit(uid, 'pricing', 'pricing', value);
        await db('settings', { method: 'POST', body: { key: 'pricing', value, updated_at: new Date().toISOString() }, prefer: 'resolution=merge-duplicates' });
        return res.json({ ok: true, pricing: value });
      }
    }

    return fail(res, 404, 'Unknown action');
  } catch (e) {
    console.error('platform', action, e.message);
    return fail(res, 500, 'Something went wrong. Please try again.');
  }
}
