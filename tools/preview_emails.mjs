// Preview every platform email exactly as the live code builds it, without sending anything.
// Runs the real handlers with the database, Stripe, Companies House and Resend mocked, then writes
// email-previews.html (one page, every email in an iframe). Usage: node tools/preview_emails.mjs
import fs from 'node:fs';
import { createHmac, generateKeyPairSync, createPrivateKey, sign } from 'node:crypto';

process.env.SUPABASE_SECRET_KEY = 'preview'; process.env.RESEND_API_KEY = 'preview'; process.env.STRIPE_WEBHOOK_SECRET = 'whsec_preview';
process.env.STRIPE_SECRET_KEY = 'sk_test_preview'; process.env.ENQUIRY_TO = 'you@leaflegal.co';

// Throwaway signing key so the handler accepts our test broker's sign-in token.
const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'preview', alg: 'ES256' };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const UID = '11111111-2222-4333-8444-555555555555';
const head = b64({ alg: 'ES256', kid: 'preview', typ: 'JWT' }), body = b64({ sub: UID, email: 'jo@acmefinance.co.uk', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 });
const token = `${head}.${body}.${sign('sha256', Buffer.from(`${head}.${body}`), { key: createPrivateKey(privateKey.export({ format: 'pem', type: 'pkcs8' })), dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;

const now = Date.now();
const broker = { id: UID, email: 'jo@acmefinance.co.uk', company: 'Acme Commercial Finance', contact_name: 'Jo Patel', phone: '07700 900123', fca_number: '912345',
  approved: true, is_admin: true, profile: { name: 'Acme Commercial Finance', person: 'Jo Patel', role: 'Director', about: 'Asset and working-capital finance for UK SMEs since 2009.', phone: '0161 496 0000', whatsapp: '07700 900123', email: 'jo@acmefinance.co.uk', website: 'https://acmefinance.co.uk/', logo: 'https://leaflegal.co/assets/Leaflegal_Logo_Deep_Green.svg', show: { person: true, phone: true, whatsapp: true, email: true, website: true } }, email_verified_at: new Date().toISOString(), mode: 'manual', notify: true, credits: 2340, filters: {}, stripe_customer: 'cus_preview', created_at: new Date(now - 864e5).toISOString() };
const lead = { id: 52, created_at: new Date(now - 36e5).toISOString(), bought_at: new Date(now - 18e5).toISOString(), buyer: UID, amount: 150000, purpose: 'Equipment or vehicles',
  timeline: 'Within 2 weeks', structure: 'Limited company', turnover: '£500k to £1m', trading: '5+ years', credit: 'No', debt: 'No', business: 'ACME TRADING LTD',
  full_name: 'John David Smith', email: 'john@acmetrading.co.uk', phone: '+447700900123', price: 120, checks: { phone: { reachable: true, carrier: 'EE' }, email: { result: 'valid' } },
  company: { number: '01234567', type: 'ltd', incorporated: '2015-06-01', directorListed: true, director: 'John David Smith', profile: { title: 'ACME TRADING LTD', locality: 'Leeds', industries: ['Construction'] } } };

const mails = [];
let label = '';
globalThis.fetch = async (url, o = {}) => {
  const u = String(url), m = o.method || 'GET';
  const J = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
  if (u.includes('resend.com/emails/batch')) { for (const b of JSON.parse(o.body)) mails.push({ label, to: b.to.join(', '), subject: b.subject, html: b.html, files: [] }); return J({ data: [] }); }
  if (u.includes('resend.com')) { const b = JSON.parse(o.body); mails.push({ label, to: b.to.join(', '), subject: b.subject, html: b.html, files: (b.attachments || []).map((a) => a.filename) }); return J({ id: 'x' }); }
  if (u.includes('jwks.json')) return J({ keys: [jwk] });
  if (u.includes('/rpc/')) return J(true);
  if (u.includes('/rest/v1/invites?alerts=')) return J([{ email: 'sam@newfirm.co.uk', name: 'Sam Lee', company: 'New Firm Ltd', token: 'eyJ0ZXN0Ijp0cnVlfQ.preview', alerts: true }]);
  if (u.includes('/rest/v1/brokers?email=eq.')) return J([]);
  if (u.includes('/rest/v1/brokers')) return J(m === 'GET' ? [broker] : []);
  if (u.includes('/rest/v1/leads') && m === 'POST') return J([lead]);
  if (u.includes('/rest/v1/leads') && u.includes('limit=200')) return J([ // sample enquiries for the cold invite's "Recent enquiries"
    { ...lead, id: 61, amount: 200000, purpose: 'Growth and expansion', turnover: '£250k to £500k', trading: '5+ years', credit: 'No', timeline: 'As soon as possible', checks: { phone: { reachable: true }, email: { result: 'valid' } } },
    { ...lead, id: 62, amount: 100000, purpose: 'Cash flow', turnover: '£100k to £250k', trading: '2 to 5 years', credit: 'No', timeline: 'As soon as possible', checks: { phone: { reachable: true }, email: { result: 'valid' } } },
    { ...lead, id: 63, amount: 125000, purpose: 'Equipment or vehicles', turnover: '£100k to £250k', trading: '1 to 2 years', credit: 'No', timeline: 'As soon as possible', checks: { phone: { allocated: true }, email: { result: 'valid' } } },
    { ...lead, id: 64, amount: 30000, purpose: 'Commercial property', turnover: '£50k to £100k', trading: '1 to 2 years', credit: 'No' }]);
  if (u.includes('/rest/v1/leads')) return J(u.includes('id=eq.') ? [lead] : []);
  if (u.includes('/rest/v1/returns?id=eq.')) return J([{ id: 9, lead_id: 52, broker: UID, status: 'pending', leads: { price: 120 }, brokers: { email: broker.email, company: broker.company } }]);
  if (u.includes('/rest/v1/agreements') && m === 'POST') return J([{ id: 6, version: JSON.parse(o.body).version, created_at: new Date().toISOString(), ...JSON.parse(o.body) }]);
  return J([]);
};

const P = await import('../api/_lib/platform.js');
const { default: handler } = await import('../api/platform.js');
const { TERMS_VERSION } = await import('../api/_lib/terms.js');
const call = (action, data, auth = true, extra = {}) => new Promise((done) => {
  const raw = typeof data === 'string' ? data : JSON.stringify(data || {});
  const res = { statusCode: 200, setHeader() { return this; }, status(c) { this.statusCode = c; return this; }, json(b) { done({ c: this.statusCode, b }); }, send(b) { done({ c: this.statusCode, b }); } };
  handler({ method: data ? 'POST' : 'GET', url: `/api/platform?action=${action}`, query: { action }, body: raw, headers: { ...(auth ? { authorization: `Bearer ${token}` } : {}), ...extra } }, res);
});
const stripe = (type, object, previous) => {
  const raw = JSON.stringify({ type, data: { object, ...(previous ? { previous_attributes: previous } : {}) } }), t = Math.floor(Date.now() / 1000);
  return call('stripe', raw, false, { 'stripe-signature': `t=${t},v1=${createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(`${t}.${raw}`).digest('hex')}` });
};
const run = async (name, fn) => { label = name; const r = await fn(); if (r && r.c >= 400) console.log('!', name, r.c, JSON.stringify(r.b)); };

const meta = { broker: UID, pack: 'Starter', credits: '2000', trial_credits: '1000' };
const invoice = (reason) => ({ customer: 'cus_preview', billing_reason: reason, amount_paid: reason === 'subscription_create' ? 120000 : 240000, total_taxes: [{ amount: reason === 'subscription_create' ? 20000 : 40000 }],
  number: 'LL-0001', hosted_invoice_url: 'https://invoice.stripe.com/i/preview', parent: { subscription_details: { metadata: meta } }, lines: { data: [{ period: { end: Math.floor(now / 1000) + 30 * 864e2 } }] } });
const sub = { customer: 'cus_preview', current_period_end: Math.floor(now / 1000) + 20 * 864e2, metadata: { pack: 'Starter' } };

await run('Signup (welcome + your approval email)', () => call('signup', { email: 'new@firm.co.uk', password: 'Long-enough-123', company: 'New Firm Ltd', contactName: 'Sam Lee', phone: '07700 900456', fca: '123456' }, false));
await run('Supplier invite (warm)', () => call('admin-invite', { name: 'Sam Lee', email: 'sam@newfirm.co.uk', company: 'New Firm Ltd', kind: 'warm' }));
await run('Supplier invite (cold: full introduction)', () => call('admin-invite', { name: 'Sam Lee', email: 'sam@newfirm.co.uk', company: 'New Firm Ltd', kind: 'cold' }));
await run('Approved', async () => { broker.approved = false; await P; const r = await call('admin-broker', { id: UID, approved: true }); broker.approved = true; return r; });
await run('Paused', () => call('admin-broker', { id: UID, approved: false }));
await run('Credits added by admin', () => call('admin-broker', { id: UID, credits: 250, reason: 'Goodwill credit' }));
await run('New lead alert (manual mode)', () => P.ingestLead({ amount: '£150,000', purpose: lead.purpose, timeline: lead.timeline, structure: lead.structure, turnover: lead.turnover, trading: lead.trading,
  credit: 'No', debt: 'No', business: lead.business, fullName: lead.full_name, email: lead.email, phone: lead.phone, company: lead.company, checks: lead.checks }));
await run('Lead bought (delivery)', () => P.deliver(broker, { ...lead, auto: false }));
await run('Low credits', () => P.lowCredits(broker, 150, 60));
await run('Refund requested', () => call('refund', { id: 52, reason: 'Phone number is not in service', details: 'Number unobtainable' }));
await run('Refund approved', () => call('admin-refund', { id: 9, approve: true }));
await run('Refund declined', () => call('admin-refund', { id: 9, approve: false }));
await run('Custom plan request', () => call('enterprise-request', { amount: 8000 }));
await run('Partner agreement (PDF attached)', () => call('sign', { version: TERMS_VERSION, accept: true, authority: true, signer_name: 'Jo Patel', signer_title: 'Director' }));
await run('First payment', () => stripe('invoice.paid', invoice('subscription_create')));
await run('Monthly renewal', () => stripe('invoice.paid', invoice('subscription_cycle')));
await run('Payment failed', () => stripe('invoice.payment_failed', { customer: 'cus_preview', amount_due: 240000, hosted_invoice_url: 'https://invoice.stripe.com/i/preview' }));
await run('Bank approval needed (3D Secure)', () => stripe('invoice.payment_action_required', { customer: 'cus_preview', amount_due: 240000, hosted_invoice_url: 'https://invoice.stripe.com/i/preview' }));
await run('Subscription cancelled', () => stripe('customer.subscription.updated', { ...sub, cancel_at_period_end: true }, { cancel_at_period_end: false }));
await run('Subscription resumed', () => stripe('customer.subscription.updated', { ...sub, cancel_at_period_end: false }, { cancel_at_period_end: true }));
await run('Subscription ended', () => stripe('customer.subscription.deleted', sub));

// Newer emails: leads outside criteria, the business's "you've been matched" email, invoiced plan credits, refunds/chargebacks.
const lead2 = { ...lead, id: 53, amount: 40000, purpose: 'Cash flow', turnover: '£100k to £250k', price: 60, created_at: new Date(now - 80 * 36e5).toISOString() };
await run('Lead outside their criteria (instant)', () => P.suggest({ ...broker, filters: { amountMin: 200000 } }, [lead]));
await run('Leads outside their criteria (daily summary)', () => P.suggest({ ...broker, filters: { amountMin: 200000 } }, [lead, lead2]));
await run('Leads auto-buy skipped (daily)', () => P.missedEmail({ ...broker, id: 'me', mode: 'auto', filters: { trading: ['2 to 5 years', '5+ years'], cleanCredit: true } }, [{ ...lead, trading: '1 to 2 years', credit: 'Not sure', buyer: 'someone-else' }, { ...lead2, trading: '1 to 2 years', credit: 'No', buyer: null }, { ...lead, id: 99, trading: '5+ years', credit: 'No', buyer: 'x' }]));
await run('You’ve been matched (to the business)', () => P.matchedEmail(broker, lead));
await run('Invoiced or commission plan: monthly credits', () => call('admin-plan', { broker: UID, name: 'Custom 10k', credits: 10000, price: 9000 }));
await run('Card payment refunded (to you)', () => stripe('charge.refunded', { customer: 'cus_preview', amount_refunded: 120000 }));
await run('Chargeback opened (account paused + alert to you)', () => stripe('charge.dispute.created', { customer: 'cus_preview', amount: 240000 }));
await run('Weekly lead round-up (firms invited by CSV)', async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async (u, x) => (String(u).includes('invites?alerts=eq.true&digest=is.true') ? new Response(JSON.stringify([{ email: 'sam@newfirm.co.uk', name: 'Sam Lee', company: 'New Firm Ltd', token: 'eyJ0ZXN0Ijp0cnVlfQ.preview' }]))
    : String(u).includes('/rest/v1/leads?buyer=is.null') ? new Response(JSON.stringify([lead, lead2])) : real(u, x));
  try { await P.inviteDigest(new Date('2026-11-16T09:00:00Z')); } finally { globalThis.fetch = real; }
});
await run('Matched in seconds (to invited firms on every-lead emails)', async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async (u, x) => (String(u).includes('invites?alerts=eq.true&digest=is.false') ? new Response(JSON.stringify([{ email: 'sam@newfirm.co.uk', name: 'Sam Lee', company: 'New Firm Ltd', token: 'eyJ0ZXN0Ijp0cnVlfQ.preview' }])) : String(u).includes('rate_events') && !(x && x.method === 'POST') ? new Response('[]') : real(u, x));
  try { await P.inviteLeadAlerts(lead, true); } finally { globalThis.fetch = real; }
});
await run('Resent confirmation link', async () => { const v = broker.email_verified_at; broker.email_verified_at = null; const r = await call('resend-verify', {}); broker.email_verified_at = v; return r; });

// CRM follow-up sequence to prospective brokers (sent from Admin → CRM flows; the live copy can be edited there).
{ const C = await import('../api/_lib/crm.js'), c = { id: 1, name: 'Sam Lee', email: 'sam@newfirm.co.uk', company: 'New Firm Ltd' };
  for (const f of C.FLOW_DEFAULTS) mails.push({ label: `CRM follow-up: ${C.stageName(f.stage)}, day ${f.day}`, to: c.email, subject: C.merge(f.subject, c), html: C.renderEmail(f.body, c, 'https://platform.leaflegal.co/unsubscribe').html, files: [] }); }

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Leaflegal email previews</title>
<style>body{margin:0;font:15px/1.5 Arial,sans-serif;background:#e8ecea;color:#14271f}header{padding:28px 24px 8px;max-width:760px;margin:auto}h1{margin:0 0 6px;font-size:24px}
nav{max-width:760px;margin:0 auto 8px;padding:0 24px;columns:2;font-size:14px}nav a{color:#244237;display:block;padding:2px 0}section{max-width:760px;margin:28px auto;padding:0 24px}
.m{background:#fff;border:1px solid #d3ddd8;padding:14px 16px;font-size:13px}.m b{font-size:15px}.m span{color:#5d7a6e;display:block}iframe{width:100%;height:900px;border:1px solid #d3ddd8;border-top:0;background:#f3f5f4}</style></head><body>
<header><h1>Leaflegal email previews</h1><p>${mails.length} emails, built by the live platform code on ${new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/London' })} with test data. Nothing was sent.</p></header>
<nav>${mails.map((m, i) => `<a href="#m${i}">${i + 1}. ${esc(m.label)}${mails.filter((x) => x.label === m.label).length > 1 ? ` (to ${esc(m.to)})` : ''}</a>`).join('')}</nav>
${mails.map((m, i) => `<section id="m${i}"><div class="m"><b>${i + 1}. ${esc(m.label)}</b><span>Subject: ${esc(m.subject)}</span><span>To: ${esc(m.to)}${m.files.length ? ` · Attached: ${esc(m.files.join(', '))}` : ''}</span></div>
<iframe loading="lazy" title="${esc(m.subject)}" srcdoc="${esc(m.html)}"></iframe></section>`).join('')}</body></html>`;
fs.writeFileSync(new URL('../email-previews.html', import.meta.url), page);
// Same emails for Admin → Emails (served to admins by /api/platform?action=admin-emails). Rebuilt on every Vercel deploy.
fs.writeFileSync(new URL('../api/_lib/email-previews.json', import.meta.url), JSON.stringify({ built: new Date().toISOString(), emails: mails }));
console.log(`${mails.length} emails →`, new URL('../email-previews.html', import.meta.url).pathname);
for (const m of mails) console.log(' -', m.label, '|', m.subject, '|', m.to);
