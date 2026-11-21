// End-to-end checks of the platform code at every step (sign-in, onboarding, payments, buying, leads coming in,
// refunds, admin) plus the security gates around them. Runs the real handlers with Supabase, Stripe, Companies House,
// Bird and Resend mocked, so nothing touches live data. Usage: node tools/test_flows.mjs  (exits 1 on any failure)
import assert from 'node:assert/strict';
import { createHmac, generateKeyPairSync, createPrivateKey, sign } from 'node:crypto';

Object.assign(process.env, { SUPABASE_SECRET_KEY: 'test', RESEND_API_KEY: 'test', STRIPE_WEBHOOK_SECRET: 'whsec_test', BLOG_GITHUB_TOKEN: 'ghp_test', RESEND_WEBHOOK_SECRET: 'whsec_' + Buffer.from('resend-test').toString('base64'), STRIPE_SECRET_KEY: 'sk_test', STRIPE_PUBLISHABLE_KEY: 'pk_test', ENQUIRY_TO: 'admin@test' });

// ---- sign-in tokens from a throwaway key (and one from a key the server doesn't trust)
const kp = () => generateKeyPairSync('ec', { namedCurve: 'P-256' });
const good = kp(), evil = kp();
const jwk = { ...good.publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'ES256' };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, { key = good, exp = 3600, role = 'authenticated', kid = 'k1' } = {}) => {
  const h = b64({ alg: 'ES256', kid, typ: 'JWT' }), p = b64({ sub, role, email: 'x@test', exp: Math.floor(Date.now() / 1000) + exp });
  return `${h}.${p}.${sign('sha256', Buffer.from(`${h}.${p}`), { key: createPrivateKey(key.privateKey.export({ format: 'pem', type: 'pkcs8' })), dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
};

// ---- mock world
const ADMIN = 'aaaaaaaa-0000-4000-8000-000000000001', BROKER = 'bbbbbbbb-0000-4000-8000-000000000002', NEWB = 'cccccccc-0000-4000-8000-000000000003', UNV = 'eeeeeeee-0000-4000-8000-000000000005';
const V = new Date().toISOString();
const people = {
  [ADMIN]: { id: ADMIN, email_verified_at: V, email: 'admin@test', company: 'Leaflegal', approved: true, is_admin: true, credits: 0, filters: {} },
  [BROKER]: { id: BROKER, email_verified_at: V, email: 'jo@broker.test', company: 'Broker Ltd', approved: true, is_admin: false, credits: 500, mode: 'manual', notify: true, filters: {}, stripe_customer: 'cus_1' },
  [NEWB]: { id: NEWB, email_verified_at: V, email: 'new@broker.test', company: 'New Ltd', approved: false, is_admin: false, credits: 0, filters: {} },
  [UNV]: { id: UNV, email: 'unv@broker.test', company: 'Unconfirmed Ltd', approved: true, is_admin: false, credits: 900, filters: {} },
};
const leadRow = (o = {}) => ({ id: 7, created_at: new Date().toISOString(), amount: 50000, purpose: 'Cash flow', timeline: 'Within 2 weeks', structure: 'Limited company', turnover: '£250k to £500k',
  trading: '2 to 5 years', credit: 'No', debt: 'No', business: 'SECRET TRADING LTD', full_name: 'Secret Person', email: 'secret@trading.test', phone: '+447700900999', price: 95, buyer: null,
  company: { number: '01234567', type: 'ltd', incorporated: '2015-01-01', address: '1 Secret Street', director: 'Secret Person', directorListed: true, profile: { title: 'SECRET TRADING LTD', locality: 'Leeds', industries: ['Construction'] } }, ...o });
const storedInvites = {};
let patches = [], returnRow = null;
let waived = null;
const suppressedEmails = new Set();
let blogKeys = null; const ghFiles = { 'public/blog/planning-for-a-vat-bill.html': { sha: 'x', content: '' } }, ghPuts = [];
let team = [], chOfficers = [], liPosts = [], liGets = [], liSpendRows = [], metaPosts = [], leadPosts = [], invitePosts = [], inviteRow = null, signedAgreement = true, buyResult = true, leads = [leadRow()], calls = [], mails = [], rpcCalls = [], stripeCalls = [], posts = [], stripeSubs = [];
const reset = () => { metaPosts = []; leadPosts = []; calls = []; mails = []; rpcCalls = []; stripeCalls = []; posts = []; };
globalThis.fetch = async (url, o = {}) => {
  const u = decodeURIComponent(String(url)), m = o.method || 'GET';
  calls.push(`${m} ${u}`);
  if (u.includes('/rest/v1/settings?key=eq.blog_keys')) return new Response(JSON.stringify(blogKeys ? [{ value: blogKeys }] : []), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (m === 'POST' && u.includes('/rest/v1/settings') && JSON.parse(o.body || '{}').key === 'blog_keys') { blogKeys = JSON.parse(o.body).value; return new Response('[]', { status: 201 }); }
  if (u.startsWith('https://api.github.com/repos/')) {
    const path = u.split('/contents/')[1];
    if (m === 'PUT') { ghFiles[path] = { sha: 's1', content: JSON.parse(o.body).content }; ghPuts.push({ path, body: JSON.parse(o.body) }); return new Response('{}', { status: 201 }); }
    if (m === 'DELETE') { delete ghFiles[path]; return new Response('{}', { status: 200 }); }
    if (path === 'tools/blog_posts') return new Response(JSON.stringify(Object.keys(ghFiles).filter((k) => k.startsWith('tools/blog_posts/')).map((k) => ({ name: k.split('/').pop(), path: k }))), { status: 200 });
    return ghFiles[path] ? new Response(JSON.stringify(ghFiles[path]), { status: 200 }) : new Response('{"message":"Not Found"}', { status: 404 });
  }
  if (m === 'POST' && u.includes('/rest/v1/brokers')) posts.push(JSON.parse(o.body || '{}'));
  if (u.includes('graph.facebook.com')) metaPosts.push(JSON.parse(o.body || '{}'));
  if (u.includes('api.linkedin.com/rest/conversionEvents')) { liPosts.push({ body: JSON.parse(o.body || '{}'), headers: o.headers }); return new Response('', { status: 201 }); }
  if (u.includes('api.linkedin.com/rest/adAnalytics')) { liGets.push(u); return new Response(JSON.stringify({ elements: liSpendRows }), { status: 200 }); }
  if (m === 'POST' && u.includes('/rest/v1/leads')) leadPosts.push(JSON.parse(o.body || '{}'));
  if (m === 'POST' && u.includes('/rest/v1/invites')) { const b = JSON.parse(o.body || '{}'); for (const v of [].concat(b)) { invitePosts.push(v); if (v.email) storedInvites[v.email] = v; } }
  if (m === 'PATCH' && u.includes('/rest/v1/invites?email=eq.')) { const e = u.match(/email=eq\.([^&]+)/)[1]; if (storedInvites[e]) Object.assign(storedInvites[e], JSON.parse(o.body || '{}')); }
  if (m === 'GET' && u.includes('/rest/v1/invites?email_id=eq.queued')) return new Response(JSON.stringify(u.includes('select=count') ? [{ count: Object.values(storedInvites).filter((v) => v.email_id === 'queued').length }] : Object.values(storedInvites).filter((v) => v.email_id === 'queued')), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (m === 'DELETE' && u.includes('/rest/v1/invites?email=')) for (const e of Object.keys(storedInvites)) if (u.includes(e)) delete storedInvites[e];
  if (u.includes('/rest/v1/email_suppressions')) {
    if (m === 'POST') { const v = JSON.parse(o.body || '{}'); suppressedEmails.add(v.email); return new Response('[]', { status: 201 }); }
    if (m === 'DELETE') { const e = u.match(/email=eq\.([^&]+)/)?.[1]; if (e) suppressedEmails.delete(e); return new Response('[]', { status: 200 }); }
    const want = u.match(/email=in\.\(([^)]*)\)/)?.[1]?.split(',').map((x) => x.replace(/"/g, '')) || [...suppressedEmails];
    return new Response(JSON.stringify(want.filter((e) => suppressedEmails.has(e)).map((email) => ({ email }))), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (u.includes('/rest/v1/settings?key=eq.agreement_waived')) return new Response(JSON.stringify(waived ? [{ value: { ids: waived } }] : []), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (m === 'POST' && u.includes('/rest/v1/settings')) { const v = JSON.parse(o.body || '{}'); if (v.key === 'agreement_waived') waived = v.value.ids; }
  if (u.includes('/rest/v1/invites?batch=eq.') && (m === 'PATCH' || /email_id=/.test(u))) {
    const b = u.match(/batch=eq\.([^&]+)/)[1], idf = u.match(/email_id=([^&]+)/)?.[1] || '';
    const list = (idf.match(/\(([^)]*)\)/)?.[1] || '').split(',');
    const keep = (v) => !idf ? true : idf.startsWith('eq.') ? v.email_id === idf.slice(3) : idf.startsWith('in.') ? list.includes(v.email_id) : idf.startsWith('not.in.') ? !list.includes(v.email_id) && v.email_id != null : true;
    const rows = Object.values(storedInvites).filter((v) => v.batch === b && keep(v) && (!u.includes('send_at=gt.') || new Date(v.send_at) > Date.now()));
    if (m === 'PATCH') { for (const v of rows) Object.assign(v, JSON.parse(o.body || '{}')); return new Response('[]', { status: 200 }); }
    return new Response(JSON.stringify(rows.sort((a, z) => String(a.send_at).localeCompare(String(z.send_at)))), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (m === 'GET' && u.includes('/rest/v1/invites?batch=eq.')) { const b = u.match(/batch=eq\.([^&]+)/)[1]; return new Response(JSON.stringify(Object.values(storedInvites).filter((v) => v.batch === b)), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
  if (m === 'GET' && u.includes('/rest/v1/invites?email=eq.')) { const e = u.match(/email=eq\.([^&]+)/)[1]; const v = storedInvites[e] || inviteRow; return new Response(JSON.stringify(v ? [v] : []), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
  const J = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
  if (u.includes('jwks.json')) return J({ keys: [jwk] });
  if (u.includes('/auth/v1/user')) return J({}, 401);
  if (u.includes('/rest/v1/team_members')) {
    if (m === 'POST') { const r = { id: team.length + 1, invited_at: new Date().toISOString(), joined_at: null, removed_at: null, user_id: null, ...JSON.parse(o.body) }; team.push(r); return J([r]); }
    const f = (k) => u.match(new RegExp(`[?&]${k}=eq\\.([^&]+)`))?.[1];
    let rows = team.filter((r) => (!u.includes('removed_at=is.null') || !r.removed_at) && (!u.includes('joined_at=is.null') || !r.joined_at));
    for (const k of ['token', 'user_id', 'broker', 'id']) { const v = f(k); if (v) rows = rows.filter((r) => String(r[k]) === v); }
    if (m === 'PATCH') { rows.forEach((r) => Object.assign(r, JSON.parse(o.body))); }
    return J(rows);
  }
  if (u.includes('/auth/v1/admin/users')) return J({ id: JSON.parse(o.body || '{}').email === 'mem@team.test' ? MEMBER : NEWB });
  if (u.includes('resend.com')) { if (o.body) mails.push(JSON.parse(o.body)); return J({ id: 'm' }); }
  if (u.includes('api.stripe.com')) { stripeCalls.push({ u, body: String(o.body || '') }); return J(u.includes('/subscriptions?') ? { data: stripeSubs } : u.includes('promotion_codes') ? { data: [] } : u.includes('tax_rates') ? { data: [{ id: 'txr_1', percentage: 20, active: true, inclusive: false, country: 'GB' }] } : { id: 'cs_1', url: 'https://checkout.stripe.com/x', client_secret: 'sec' }); }
  if ((u.includes('company-information')) && u.includes('/officers')) return J({ items: chOfficers });
  if (u.includes('companieshouse') || u.includes('company-information')) return J({ items: [] });
  if (u.includes('platform.bird.com')) return J({}, 500);
  if (u.includes('turnstile/v0/siteverify')) return J({ success: String(o.body).includes('response=good-token') });
  if (u.includes('/rest/v1/rpc/')) { const fn = u.split('/rpc/')[1]; rpcCalls.push({ fn, args: JSON.parse(o.body || '{}') }); return J(fn === 'buy_lead' ? buyResult : fn === 'auto_spend_this_month' ? 0 : true); }
  if (u.includes('/rest/v1/brokers?id=eq.')) { const id = u.match(/id=eq\.([0-9a-f-]+)/)[1]; return J(people[id] ? [m === 'PATCH' ? { ...people[id], ...JSON.parse(o.body || '{}') } : people[id]] : []); }
  if (u.includes('/rest/v1/brokers?stripe_customer=eq.')) { const cus = u.match(/stripe_customer=eq\.([^&]+)/)[1]; return J(Object.values(people).filter((p) => p.stripe_customer === cus)); }
  if (u.includes('/rest/v1/brokers?approved=eq.true')) return J(Object.values(people).filter((p) => p.approved && !p.is_admin));
  if (u.includes('/rest/v1/agreements')) return J(m === 'POST' ? [{ id: 1, created_at: new Date().toISOString(), version: 'v', ...JSON.parse(o.body) }] : signedAgreement ? [{ id: 1, broker: BROKER }] : []);
  if (u.includes('/rest/v1/returns')) { if (m !== 'GET') patches.push({ u, b: JSON.parse(o.body || '{}') }); return J(m === 'GET' && returnRow ? [returnRow] : m === 'POST' ? [{}] : []); }
  if (u.includes('/rest/v1/leads') && m === 'PATCH') {
    patches.push({ u, b: JSON.parse(o.body || '{}') });
    // Like PostgREST: updating a lead that only exists as just-inserted (not in `leads`) still returns it.
    const pid = u.match(/[?&]id=eq\.(\d+)/)?.[1];
    if (pid && !leads.some((l) => String(l.id) === pid)) return J([leadRow({ ...JSON.parse(o.body || '{}'), id: Number(pid) })]);
  }
  if (u.includes('/rest/v1/leads') && m === 'POST') return J([leadRow({ ...JSON.parse(o.body || '{}'), id: 99 })]);
  if (u.includes('/rest/v1/leads')) {
    let rows = leads;
    const buyer = u.match(/buyer=eq\.([0-9a-f-]+)/)?.[1], id = u.match(/[?&]id=eq\.(\d+)/)?.[1];
    if (u.includes('buyer=is.null')) rows = rows.filter((l) => !l.buyer);
    if (u.includes('buyer=not.is.null')) rows = rows.filter((l) => l.buyer);
    const rm = u.match(/rematch_of=eq\.(\d+)/)?.[1]; if (rm) rows = rows.filter((l) => String(l.source?.rematch_of) === rm);
    const gte = u.match(/created_at=gte\.([^&]+)/)?.[1]; if (gte && u.includes('or=(phone.eq')) rows = rows.filter((l) => !l.created_at || l.created_at >= decodeURIComponent(gte));
    if (buyer) rows = rows.filter((l) => l.buyer === buyer);
    if (id) rows = rows.filter((l) => l.id === Number(id));
    return J(m === 'PATCH' && !rows.length ? [] : rows);
  }
  return J([]);
};

const { default: handler } = await import('../api/platform.js');
const { default: enquiry } = await import('../api/enquiry.js');
const P = await import('../api/_lib/platform.js');
const req = (h, { action, method = 'GET', body, token, headers = {}, query = {} }) => new Promise((done) => {
  const raw = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  const qs = new URLSearchParams({ ...(action ? { action } : {}), ...query }).toString();
  const res = { c: 200, setHeader() { return this; }, status(c) { this.c = c; return this; }, json(b) { done({ c: this.c, b }); }, send(b) { done({ c: this.c, b }); } };
  h({ method, url: `/api/x?${qs}`, query: { action, ...query }, body: raw || (h === enquiry ? body : ''), headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'x-forwarded-for': '9.9.9.9', ...headers } }, res);
});
const api = (action, o = {}) => req(handler, { action, ...o });
const stripeEvent = (type, object, { secret = process.env.STRIPE_WEBHOOK_SECRET, age = 0, extra } = {}) => {
  const raw = JSON.stringify({ type, data: { object, ...extra } }), t = Math.floor(Date.now() / 1000) - age;
  return api('stripe', { method: 'POST', body: raw, headers: { 'stripe-signature': `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex')}` } });
};

let pass = 0, fail = 0;
const t = async (name, fn) => { reset(); try { await fn(); pass++; console.log('  ok  ', name); } catch (e) { fail++; console.log('  FAIL', name, '\n       ', e.message.split('\n')[0]); } };
const MEMBER = 'dddddddd-0000-4000-8000-000000000004';
const tok = { admin: jwt(ADMIN), broker: jwt(BROKER), newb: jwt(NEWB), member: jwt(MEMBER) };

console.log('\nSign-in and access');
await t('no token → 401 on every signed-in action', async () => { for (const a of ['me', 'opportunities', 'leads', 'ledger', 'dashboard', 'admin']) assert.equal((await api(a)).c, 401, a); });
await t('token signed by an unknown key → 401', async () => assert.equal((await api('me', { token: jwt(BROKER, { key: evil }) })).c, 401));
await t('expired token → 401', async () => assert.equal((await api('me', { token: jwt(BROKER, { exp: -60 }) })).c, 401));
await t('token for a non-user role (anon) → 401', async () => assert.equal((await api('me', { token: jwt(BROKER, { role: 'anon' }) })).c, 401));
await t('valid token, but no broker record → 403', async () => assert.equal((await api('me', { token: jwt('dddddddd-0000-4000-8000-000000000009') })).c, 403));
await t('broker cannot use any admin action', async () => {
  for (const [a, m, b] of [['admin'], ['admin-finance'], ['admin-client', 'GET'], ['admin-broker', 'POST', { id: BROKER, credits: 5000 }], ['admin-refund', 'POST', { id: 1, approve: true }],
    ['admin-lead', 'POST', { id: 7, op: 'assign', broker: BROKER, charge: false }], ['admin-pricing', 'POST', { min: 1 }], ['admin-update', 'POST', { broker: BROKER, is_admin: true }], ['admin-invite', 'POST', { name: 'Eve', email: 'eve@x.co' }],
    ['admin-suspend', 'POST', { broker: NEWB }], ['admin-delete', 'POST', { broker: NEWB, confirm: 'New Ltd' }], ['admin-plan', 'POST', { broker: BROKER, name: 'X', credits: 9999 }], ['admin-commission', 'POST', { broker: BROKER, kind: 'commission', amount: 500, date: '2026-11-01' }], ['admin-emails']])
    assert.equal((await api(a, { method: m || 'GET', body: b, token: tok.broker })).c, 403, a);
  assert.ok(!rpcCalls.some((r) => r.fn === 'add_credits'), 'credits were added');
});

console.log('\nEmail confirmation and bot checks');
await t('unconfirmed email: can load me, everything else refused', async () => {
  const tk = jwt(UNV);
  assert.equal((await api('me', { token: tk })).c, 200);
  for (const [a, m, b] of [['opportunities'], ['dashboard'], ['leads'], ['buy', 'POST', { id: 7 }], ['checkout', 'POST', { pack: 'starter' }], ['settings', 'POST', { mode: 'auto' }]])
    assert.equal((await api(a, { method: m || 'GET', body: b, token: tk })).c, 403, a);
  assert.ok(!rpcCalls.some((c) => c.fn === 'buy_lead'));
});
await t('unconfirmed email: can ask for the link again', async () => {
  const r = await api('resend-verify', { method: 'POST', body: {}, token: jwt(UNV) });
  assert.equal(r.c, 200); assert.ok(mails.some((m) => m.html.includes('action=verify-email')));
});
await t('confirm link: forged refused, genuine one confirms and opens onboarding', async () => {
  assert.equal((await api('verify-email', { query: { id: UNV, exp: String(Date.now() + 864e5), sig: 'b'.repeat(40) } })).c, 403);
  const exp = String(Date.now() + 864e5), sig = createHmac('sha256', 'test').update(`verify-email:${UNV}:${exp}`).digest('hex').slice(0, 40);
  const r = await new Promise((done) => { const res = { c: 200, h: {}, setHeader(k, v) { this.h[k] = v; return this; }, status(c) { this.c = c; return this; }, end() { done(this); }, json(b) { done({ c: this.c, b }); }, send(b) { done({ c: this.c, b }); } };
    handler({ method: 'GET', url: `/api/x?action=verify-email&id=${UNV}&exp=${exp}&sig=${sig}`, query: { action: 'verify-email' }, body: '', headers: {} }, res); });
  assert.equal(r.c, 302); assert.match(r.h.Location, /onboarding/);
  assert.ok(calls.some((c) => c.startsWith('PATCH') && c.includes(`brokers?id=eq.${UNV}&email_verified_at=is.null`)));
});
await t('Turnstile: off until both keys are set', async () => {
  assert.equal((await api('config')).b.turnstile, null);
  assert.equal((await api('signup', { method: 'POST', body: { email: 'n1@b.co', password: 'Long-enough-123', company: 'N1', phone: '07700 900123' } })).c, 200);
});
await t('Turnstile: when on, signup and enquiry without a valid token are refused', async () => {
  Object.assign(process.env, { TURNSTILE_SITE_KEY: 'site', TURNSTILE_SECRET_KEY: 'secret' });
  try {
    assert.equal((await api('config')).b.turnstile, 'site');
    assert.equal((await api('signup', { method: 'POST', body: { email: 'n2@b.co', password: 'Long-enough-123', company: 'N2' } })).c, 400);
    assert.equal((await api('signup', { method: 'POST', body: { email: 'n3@b.co', password: 'Long-enough-123', company: 'N3', turnstile: 'bad' } })).c, 400);
    assert.equal((await api('signup', { method: 'POST', body: { email: 'n4@b.co', password: 'Long-enough-123', company: 'N4', phone: '+447700900124', turnstile: 'good-token' } })).c, 200);
    const { default: enquiry2 } = await import('../api/enquiry.js');
    assert.equal((await req(enquiry2, { method: 'POST', body: { firstName: 'A', lastName: 'B', business: 'C', consentTerms: true, consentShare: true, phone: '+447700900123', email: 'a@gmail.com' } })).c, 400);
    assert.ok(!calls.some((c) => c.includes('company-information')), 'paid lookups ran before the bot check');
  } finally { delete process.env.TURNSTILE_SITE_KEY; delete process.env.TURNSTILE_SECRET_KEY; }
});

console.log('\nSignup and onboarding');
await t('signup: weak password and bad email refused', async () => {
  assert.equal((await api('signup', { method: 'POST', body: { email: 'm@y.co', password: 'Long-enough-123', company: 'A', phone: '01612 345678' } })).c, 400, 'landline refused');
  assert.equal((await api('signup', { method: 'POST', body: { email: 'x@y.co', password: 'short', company: 'A' } })).c, 400);
  assert.equal((await api('signup', { method: 'POST', body: { email: 'x@y.co', password: 'longenough-123', company: 'A' } })).c, 400, 'longenough-123');
  assert.equal((await api('signup', { method: 'POST', body: { email: 'x@y.co', password: 'LONGENOUGH-123', company: 'A' } })).c, 400, 'LONGENOUGH-123');
  assert.equal((await api('signup', { method: 'POST', body: { email: 'x@y.co', password: 'Long-enough-abc', company: 'A' } })).c, 400, 'Long-enough-abc');
  assert.equal((await api('signup', { method: 'POST', body: { email: 'x@y.co', password: 'Longenough1234', company: 'A' } })).c, 400, 'Longenough1234');
  assert.equal((await api('signup', { method: 'POST', body: { email: 'x@y.co', password: 'Short-1a', company: 'A' } })).c, 400, 'Short-1a');
  assert.equal((await api('signup', { method: 'POST', body: { email: 'nope', password: 'Long-enough-123', company: 'A' } })).c, 400);
});
await t('signup: bot honeypot gets a fake success, no account made', async () => {
  const r = await api('signup', { method: 'POST', body: { email: 'bot@x.co', password: 'Long-enough-123', company: 'Bot', website: 'spam' } });
  assert.equal(r.c, 200); assert.ok(!calls.some((c) => c.includes('/auth/v1/admin/users')));
});
await t('signup: new broker is created unapproved, you get the approve email', async () => {
  const r = await api('signup', { method: 'POST', body: { email: 'new@broker.test', password: 'Long-enough-123', company: 'New Ltd', contactName: 'Sam Lee', phone: '07700 900125', approved: true, is_admin: true, credits: 9999 } });
  assert.equal(r.c, 200);
  const insert = calls.find((c) => c.startsWith('POST') && c.includes('/rest/v1/brokers'));
  assert.ok(insert, 'broker row inserted');
  assert.ok(mails.some((m) => m.subject.includes('signup to approve') && m.html.includes('action=approve')), 'approve email');
  assert.ok(mails.some((m) => m.to.includes('new@broker.test') && m.html.includes('action=verify-email')), 'confirm-your-email email');
});
await t('signup ignores approved / is_admin / credits sent by the browser', async () => {
  // the insert body is built field by field on the server
  const src = (await import('node:fs')).readFileSync(new URL('../api/platform.js', import.meta.url), 'utf8');
  const block = src.slice(src.indexOf("await db('brokers', { method: 'POST', body: {"), src.indexOf('} });', src.indexOf("await db('brokers', { method: 'POST', body: {")));
  assert.ok(!/body\.(approved|is_admin|credits)/.test(block), block);
});
await t('invite: can be scheduled; Resend holds it and the send time must be within 7 days', async () => {
  reset();
  const at = new Date(Date.now() + 864e5).toISOString();
  const r = await api('admin-invite', { method: 'POST', token: tok.admin, body: { name: 'Sam Lee', email: 'sam@later.test', sendAt: at } });
  assert.equal(r.c, 200, JSON.stringify(r.b)); assert.equal(r.b.at, at);
  assert.equal(mails.find((m) => m.to.includes('sam@later.test'))?.scheduled_at, at);
  assert.equal((await api('admin-invite', { method: 'POST', token: tok.admin, body: { name: 'Sam Lee', email: 'sam@later.test', sendAt: new Date(Date.now() - 6e4).toISOString() } })).c, 400);
  assert.equal((await api('admin-invite', { method: 'POST', token: tok.admin, body: { name: 'Sam Lee', email: 'sam@later.test', sendAt: new Date(Date.now() + 9 * 864e5).toISOString() } })).c, 400);
});
await t('invite: admin sends a signed link; invited signup is approved and confirmed, no review email', async () => {
  assert.equal((await api('admin-invite', { method: 'POST', token: tok.admin, body: { name: 'Pat Jones', email: 'not-an-email' } })).c, 400);
  const r = await api('admin-invite', { method: 'POST', token: tok.admin, body: { name: 'Pat Jones', email: 'Pat@Lender.test', company: 'Lender Ltd' } });
  assert.equal(r.c, 200, JSON.stringify(r.b));
  const mail = mails.find((m) => m.to.includes('pat@lender.test'));
  assert.ok(mail && /approved supplier/.test(mail.subject), 'invite email');
  const token = mail.html.match(/register\?invite=([\w.-]+)/)[1];
  const kept = { ...storedInvites['pat@lender.test'] };
  // deleted in Admin → the link no longer pre-approves
  delete storedInvites['pat@lender.test']; reset();
  await api('signup', { method: 'POST', body: { email: 'pat@lender.test', password: 'Long-enough-123', company: 'Lender Ltd', contactName: 'Pat Jones', phone: '07700 900126', invite: token } });
  assert.ok(!posts[0].approved, 'deleted invite still pre-approved');
  storedInvites['pat@lender.test'] = kept; reset();
  assert.equal((await api('signup', { method: 'POST', body: { email: 'pat@lender.test', password: 'Long-enough-123', company: 'Lender Ltd', contactName: 'Pat Jones', phone: '07700 900126', invite: token } })).c, 200);
  assert.equal(posts[0].approved, true); assert.ok(posts[0].email_verified_at, 'email confirmed');
  assert.ok(!mails.some((m) => m.html.includes('action=verify-email') || m.html.includes('action=approve')), 'no confirm or approve email');
  assert.ok(mails.some((m) => /accepted your invite/.test(m.subject)), 'admin told');
  assert.equal(storedInvites['pat@lender.test']?.email_id, 'accepted', 'accepted invite not kept for tracking'); assert.equal(storedInvites['pat@lender.test']?.alerts, false, 'accepted invitee still gets invite lead emails');
  // same token, different email → ordinary unapproved signup
  reset();
  await api('signup', { method: 'POST', body: { email: 'other@x.test', password: 'Long-enough-123', company: 'O', phone: '07700 900127', invite: token } });
  assert.ok(!posts[0].approved && mails.some((m) => m.html.includes('action=approve')));
  // edited payload → signature fails → ordinary signup
  reset();
  const [d, sig] = token.split('.'), forged = `${Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(d, 'base64url')), e: 'evil@x.test' })).toString('base64url')}.${sig}`;
  await api('signup', { method: 'POST', body: { email: 'evil@x.test', password: 'Long-enough-123', company: 'E', phone: '07700 900128', invite: forged } });
  assert.ok(!posts[0].approved, 'forged invite approved');
});
await t('agreement: needs both boxes, full name and position', async () => {
  const { TERMS_VERSION } = await import('../api/_lib/terms.js');
  assert.equal((await api('sign', { method: 'POST', token: tok.broker, body: { version: TERMS_VERSION, accept: true, signer_name: 'Jo Patel', signer_title: 'Director' } })).c, 400);
  assert.equal((await api('sign', { method: 'POST', token: tok.broker, body: { version: TERMS_VERSION, accept: true, authority: true, signer_name: 'Jo', signer_title: 'Director' } })).c, 400);
  assert.equal((await api('sign', { method: 'POST', token: tok.broker, body: { version: 'old', accept: true, authority: true, signer_name: 'Jo Patel', signer_title: 'Director' } })).c, 409);
  const ok = await api('sign', { method: 'POST', token: tok.broker, body: { version: TERMS_VERSION, accept: true, authority: true, signer_name: 'Jo Patel', signer_title: 'Director' } });
  assert.equal(ok.c, 200, JSON.stringify(ok.b)); assert.ok(mails.some((m) => m.attachments?.[0]?.filename.endsWith('.pdf')), 'PDF attached');
});

console.log('\nPayments');
await t('checkout needs the agreement signed first', async () => { signedAgreement = false; const r = await api('checkout', { method: 'POST', token: tok.broker, body: { pack: 'starter' } }); signedAgreement = true; assert.equal(r.c, 403); });
await t('checkout: price and credits come from the server, not the browser', async () => {
  const r = await api('checkout', { method: 'POST', token: tok.broker, body: { pack: 'starter', credits: 999999, pence: 1, amount: 1 } });
  assert.equal(r.c, 200, JSON.stringify(r.b));
  const s = decodeURIComponent(stripeCalls.find((c) => c.u.includes('checkout/sessions')).body);
  assert.ok(s.includes('unit_amount]=250000') && s.includes('metadata[credits]=2500') && s.includes(`metadata[broker]=${BROKER}`), s.slice(0, 300));
});
await t('custom plan outside £6k to £20k credits refused', async () => {
  assert.equal((await api('checkout', { method: 'POST', token: tok.broker, body: { pack: 'custom', amount: 100 } })).c, 400);
  assert.equal((await api('checkout', { method: 'POST', token: tok.broker, body: { pack: 'custom', amount: 9999999 } })).c, 400);
});
await t('webhook: forged signature refused, no credits', async () => {
  const r = await stripeEvent('invoice.paid', { amount_paid: 1, parent: { subscription_details: { metadata: { broker: BROKER, credits: '99999', pack: 'x' } } } }, { secret: 'whsec_guess' });
  assert.equal(r.c, 400); assert.ok(!rpcCalls.some((c) => c.fn === 'add_credits'));
});
await t('webhook: replayed old event (over 5 minutes) refused', async () => {
  assert.equal((await stripeEvent('invoice.paid', { amount_paid: 1 }, { age: 600 })).c, 400);
});
await t('webhook: real paid invoice adds the plan credits once, keyed to the invoice', async () => {
  const r = await stripeEvent('invoice.paid', { id: 'in_1', billing_reason: 'subscription_cycle', amount_paid: 240000, parent: { subscription_details: { metadata: { broker: BROKER, credits: '2000', pack: 'Starter' } } } });
  assert.equal(r.c, 200); const add = rpcCalls.find((c) => c.fn === 'add_credits');
  assert.deepEqual([add.args.p_broker, add.args.p_delta, add.args.p_ref], [BROKER, 2000, 'in_1']);
});
await t('meta: first subscription payment sends Subscribe with the ex-VAT value; renewals do not', async () => {
  process.env.META_CAPI_TOKEN = 'test'; const before = metaPosts.length;
  try {
    await stripeEvent('invoice.paid', { id: 'in_s1', billing_reason: 'subscription_create', amount_paid: 120000, total_taxes: [{ amount: 20000 }], parent: { subscription_details: { metadata: { broker: BROKER, credits: '1000', pack: 'Starter' } } } });
    const subs = metaPosts.slice(before).flatMap((p) => p.data).filter((d) => d.event_name === 'Subscribe');
    assert.equal(subs.length, 1); assert.equal(subs[0].custom_data.value, 1000); assert.equal(subs[0].custom_data.currency, 'GBP'); assert.equal(subs[0].event_id, 'sub-in_s1');
    const mid = metaPosts.length;
    await stripeEvent('invoice.paid', { id: 'in_s2', billing_reason: 'subscription_cycle', amount_paid: 120000, parent: { subscription_details: { metadata: { broker: BROKER, credits: '1000', pack: 'Starter' } } } });
    assert.ok(!metaPosts.slice(mid).flatMap((p) => p.data).some((d) => d.event_name === 'Subscribe'));
  } finally { delete process.env.META_CAPI_TOKEN; }
});
await t('webhook: admin is emailed on a firm’s first ever payment only', async () => {
  const real = globalThis.fetch; let prior = [];
  globalThis.fetch = (u, o) => (String(u).includes('/rest/v1/ledger?broker=') ? Promise.resolve(new Response(JSON.stringify(prior))) : real(u, o));
  try {
    reset(); await stripeEvent('invoice.paid', { id: 'in_f1', billing_reason: 'subscription_create', amount_paid: 120000, parent: { subscription_details: { metadata: { broker: BROKER, credits: '1000', pack: 'Starter' } } } });
    assert.ok(mails.some((m) => /^First payment: /.test(m.subject)), 'first payment alert sent');
    reset(); prior = [{ id: 1 }];
    await stripeEvent('invoice.paid', { id: 'in_f2', billing_reason: 'subscription_create', amount_paid: 120000, parent: { subscription_details: { metadata: { broker: BROKER, credits: '1000', pack: 'Starter' } } } });
    assert.ok(!mails.some((m) => /^First payment: /.test(m.subject)), 'no alert when they have paid before');
  } finally { globalThis.fetch = real; }
});
await t('webhook: £0 invoice (100% coupon) adds no credits', async () => {
  await stripeEvent('invoice.paid', { id: 'in_2', billing_reason: 'subscription_cycle', amount_paid: 0, parent: { subscription_details: { metadata: { broker: BROKER, credits: '2000', pack: 'Starter' } } } });
  assert.ok(!rpcCalls.some((c) => c.fn === 'add_credits'));
});

await t('chargeback pauses the broker automatically', async () => {
  people[BROKER].approved = true;
  await stripeEvent('charge.dispute.created', { amount: 240000, charge: { customer: 'cus_1' } });
  assert.ok(calls.some((c) => c.startsWith('PATCH') && c.includes(`brokers?id=eq.${BROKER}`)), 'not paused');
});
await t('promo codes not tagged leaflegal=true are refused', async () => {
  const r = await api('checkout', { method: 'POST', token: tok.broker, body: { pack: 'starter', coupon: 'HALFOFF' } });
  assert.equal(r.c, 400);
});

console.log('\nBuying leads');
await t('opportunities never include name, email, phone, business or company number', async () => {
  const r = await api('opportunities', { token: tok.broker }); assert.equal(r.c, 200);
  const s = JSON.stringify(r.b);
  for (const secret of ['Secret Person', 'secret@trading.test', '+447700900999', 'SECRET TRADING', '01234567', '1 Secret Street']) assert.ok(!s.includes(secret), `leaked ${secret}`);
  assert.ok(r.b.leads[0].companies_house?.type, 'Companies House preview present');
});
await t('preview gives only the incorporation year, first initial, no email domain letters', async () => {
  const l = (await api('opportunities', { token: tok.broker })).b.leads[0];
  assert.equal(l.companies_house.incorporated, '2015'); assert.match(l.contact.name, /^S\*+ \*+$/); assert.match(l.contact.email, /^s\*+@\*+\.test$/);
});
await t('brokers not yet approved see no contact hints or company details', async () => {
  const l = (await api('opportunities', { token: tok.newb })).b.leads[0];
  assert.equal(l.contact, null); assert.equal(l.companies_house, null); assert.ok(l.amount && l.price);
});
await t('dashboard top leads are masked too', async () => {
  const s = JSON.stringify((await api('dashboard', { token: tok.broker })).b);
  for (const secret of ['Secret Person', 'secret@trading.test', '+447700900999', 'SECRET TRADING', '01234567']) assert.ok(!s.includes(secret), `leaked ${secret}`);
});
await t('unapproved broker cannot buy', async () => assert.equal((await api('buy', { method: 'POST', token: tok.newb, body: { id: 7 } })).c, 403));
await t('no agreement, no buying', async () => { signedAgreement = false; const r = await api('buy', { method: 'POST', token: tok.broker, body: { id: 7 } }); signedAgreement = true; assert.equal(r.c, 403); });
await t('buy goes through the database function with the signed-in broker (not a browser-chosen one)', async () => {
  leads = [leadRow({ buyer: null })];
  await api('buy', { method: 'POST', token: tok.broker, body: { id: 7, broker: ADMIN, price: 1 } });
  const b = rpcCalls.find((c) => c.fn === 'buy_lead'); assert.deepEqual([b.args.p_lead, b.args.p_broker, b.args.p_auto], [7, BROKER, false]);
});
await t('buy refused by the database (sold / not enough credits) → no lead data returned', async () => {
  buyResult = false; leads = [leadRow({ buyer: null })];
  const r = await api('buy', { method: 'POST', token: tok.broker, body: { id: 7 } }); buyResult = true;
  assert.ok(r.c === 402 || r.c === 409, String(r.c)); assert.ok(!JSON.stringify(r.b).includes('secret@trading.test'));
});
await t('bad lead id rejected', async () => assert.equal((await api('buy', { method: 'POST', token: tok.broker, body: { id: '7&buyer=is.null' } })).c, 400));
await t('My leads only queries the signed-in broker\'s leads', async () => {
  leads = [leadRow({ buyer: ADMIN })];
  const r = await api('leads', { token: tok.broker }); assert.equal(r.b.leads.length, 0);
  assert.ok(calls.some((c) => c.includes(`buyer=eq.${BROKER}`)));
});
await t('notes, stages and refunds only work on your own leads', async () => {
  leads = [leadRow({ buyer: ADMIN, bought_at: new Date().toISOString() })];
  assert.equal((await api('note', { method: 'POST', token: tok.broker, body: { id: 7, body: 'hi' } })).c, 404);
  assert.equal((await api('stage', { method: 'POST', token: tok.broker, body: { id: 7, stage: 'funded' } })).c, 404);
  assert.equal((await api('refund', { method: 'POST', token: tok.broker, body: { id: 7, reason: 'Phone number is not in service' } })).c, 404);
});
await t('refund: only the allowed reasons, only within 72 hours', async () => {
  leads = [leadRow({ buyer: BROKER, bought_at: new Date().toISOString() })];
  assert.equal((await api('refund', { method: 'POST', token: tok.broker, body: { id: 7, reason: 'Not interested' } })).c, 400);
  leads = [leadRow({ buyer: BROKER, bought_at: new Date(Date.now() - 73 * 36e5).toISOString() })];
  assert.equal((await api('refund', { method: 'POST', token: tok.broker, body: { id: 7, reason: 'Phone number is not in service' } })).c, 400);
  leads = [leadRow({ buyer: BROKER, bought_at: new Date().toISOString() })];
  assert.equal((await api('refund', { method: 'POST', token: tok.broker, body: { id: 7, reason: 'Phone number is not in service' } })).c, 200);
  assert.ok(!rpcCalls.some((c) => c.fn === 'add_credits'), 'a request must not refund by itself');
});
await t('refund reasons: not-interested is logged as auto-declined feedback, figures need details', async () => {
  leads = [leadRow({ buyer: BROKER, bought_at: new Date().toISOString() })];
  const no = await api('refund', { method: 'POST', token: tok.broker, body: { id: 7, reason: 'They’re no longer interested', details: 'Went with their bank' } });
  assert.equal(no.c, 200, JSON.stringify(no.b)); assert.equal(no.b.declined, true); assert.match(no.b.note, /nature of lead generation/);
  assert.equal((await api('refund', { method: 'POST', token: tok.broker, body: { id: 7, reason: 'Revenue or trading figures don’t match' } })).c, 400);
  assert.equal((await api('refund', { method: 'POST', token: tok.broker, body: { id: 7, reason: 'Revenue or trading figures don’t match', details: 'They said revenue is £40k, not £250k+' } })).c, 200);
});
await t('decline a refund: needs a reason, emails it, no credits', async () => {
  returnRow = { id: 3, lead_id: 7, broker: BROKER, status: 'pending', reason: 'x', leads: { price: 95, buyer: BROKER }, brokers: { email: 'b@x.co', company: 'B Ltd' } };
  assert.equal((await api('admin-refund', { method: 'POST', token: tok.admin, body: { id: 3, approve: false } })).c, 400);
  reset(); patches = [];
  const r = await api('admin-refund', { method: 'POST', token: tok.admin, body: { id: 3, approve: false, why: 'interest', note: 'Spoke to them on Tuesday.' } });
  assert.equal(r.c, 200, JSON.stringify(r.b));
  assert.ok(!rpcCalls.some((c) => c.fn === 'add_credits'));
  const p = patches.find((x) => x.u.includes('returns?id=eq.3')).b;
  assert.equal(p.status, 'rejected'); assert.match(p.decision, /no longer interested[\s\S]*Tuesday/);
  reset(); patches = [];
  assert.equal((await api('admin-refund', { method: 'POST', token: tok.admin, body: { id: 3, approve: true } })).c, 200);
  assert.equal(rpcCalls.find((c) => c.fn === 'add_credits').args.p_delta, 95);
  assert.equal(patches.find((x) => x.u.includes('returns?id=eq.3')).b.credits, 95);
  returnRow = { ...returnRow, leads: { price: 95, buyer: ADMIN } };
  assert.equal((await api('admin-refund', { method: 'POST', token: tok.admin, body: { id: 3, approve: true } })).c, 409, 'lead already moved on');
  returnRow = null;
});
await t('relist: takes a sold lead back, fixes figures, 50% off, no auto-discount', async () => {
  leads = [leadRow({ buyer: BROKER, bought_at: new Date().toISOString(), price: 95 })]; patches = [];
  const r = await api('admin-lead', { method: 'POST', token: tok.admin, body: { id: 7, op: 'relist', turnover: '£50k to £100k', trading: '1 to 2 years', price: 'half' } });
  assert.equal(r.c, 200, JSON.stringify(r.b)); assert.equal(r.b.price, 48);
  const p = patches.find((x) => x.u.includes('leads?id=eq.7')).b;
  assert.equal(p.buyer, null); assert.equal(p.turnover, '£50k to £100k'); assert.equal(p.price, 48); assert.equal(p.list_price, 95); assert.equal(p.price_fixed, true); assert.equal(p.stage, 'new');
  assert.equal((await api('admin-lead', { method: 'POST', token: tok.admin, body: { id: 7, op: 'relist', turnover: '£9bn', price: 'full' } })).c, 400);
});
await t('suppress a lead’s email, then remove it', async () => {
  leads = [leadRow({})]; const e = leads[0].email.toLowerCase();
  const r = await api('admin-lead', { method: 'POST', token: tok.admin, body: { id: 7, op: 'suppress', why: 'Asked not to be contacted' } });
  assert.equal(r.c, 200, JSON.stringify(r.b)); assert.ok(suppressedEmails.has(e), 'on the list');
  const { sendEmail } = await import('../api/_lib/platform.js');
  assert.equal(await sendEmail([e], 'x', 'x'), 'suppressed', 'no more emails');
  assert.equal((await api('admin-lead', { method: 'POST', token: tok.admin, body: { id: 7, op: 'unsuppress' } })).c, 200);
  assert.ok(!suppressedEmails.has(e), 'off the list');
});
await t('hide a lead, then unhide it', async () => {
  leads = [leadRow({})]; patches = [];
  assert.equal((await api('admin-lead', { method: 'POST', token: tok.admin, body: { id: 7, op: 'hide' } })).c, 200);
  assert.ok(patches.some((x) => x.u.includes('leads?id=eq.7') && x.b.hidden_at), 'hidden_at set');
  assert.equal((await api('admin-lead', { method: 'POST', token: tok.admin, body: { id: 7, op: 'unhide' } })).c, 200);
  assert.ok(patches.some((x) => x.u.includes('leads?id=eq.7') && x.b.hidden_at === null), 'hidden_at cleared');
});
await t('relist straight to another broker, free', async () => {
  leads = [leadRow({ buyer: ADMIN, bought_at: new Date().toISOString(), price: 95 })]; patches = [];
  // mock leaves the row unchanged, so release it as the PATCH would
  const orig = leads[0]; const r0 = api('admin-lead', { method: 'POST', token: tok.admin, body: { id: 7, op: 'relist', price: 'full', broker: BROKER, charge: false } });
  queueMicrotask(() => { orig.buyer = null; });
  const r = await r0; assert.equal(r.c, 200, JSON.stringify(r.b));
  assert.ok(patches.some((x) => x.u.includes('buyer=is.null') && x.b.buyer === BROKER), 'assigned to the new broker');
});
await t('sale price: relisted leads aren’t discounted again', async () => {
  const { salePrice } = await import('../api/_lib/platform.js');
  const old = new Date(Date.now() - 10 * 864e5).toISOString();
  assert.deepEqual(salePrice({ price: 48, list_price: 95, price_fixed: true, created_at: old, turnover: '£50k to £100k' }), { price: 48, list_price: 95, discounted: true });
  assert.equal(salePrice({ price: 95, price_fixed: false, created_at: old, turnover: '£50k to £100k' }).price, 48);
});
await t('CRM webhook to internal addresses refused (SSRF)', async () => {
  for (const w of ['http://localhost:3000', 'https://127.0.0.1/x', 'https://169.254.169.254/latest', 'https://10.0.0.1/', 'file:///etc/passwd'])
    assert.equal((await api('settings', { method: 'POST', token: tok.broker, body: { mode: 'manual', webhook_url: w } })).c, 400, w);
});
await t('settings: several alert/delivery emails and webhooks; bad ones refused', async () => {
  const ok = await api('settings', { method: 'POST', token: tok.broker, body: { mode: 'auto', notify: true, notify_emails: ['a@x.co', 'b@x.co'], deliver_on: true, deliver_emails: ['c@x.co', 'd@x.co', 'c@x.co'], webhook_on: true, webhook_urls: ['https://example.com/a', 'https://example.org/b'] } });
  assert.equal(ok.c, 200, JSON.stringify(ok.b));
  assert.equal((await api('settings', { method: 'POST', token: tok.broker, body: { mode: 'auto', deliver_emails: ['good@x.co', 'not-an-email'] } })).c, 400);
  assert.equal((await api('settings', { method: 'POST', token: tok.broker, body: { mode: 'auto', notify_emails: Array.from({ length: 11 }, (_, i) => `p${i}@x.co`) } })).c, 400);
  assert.equal((await api('settings', { method: 'POST', token: tok.broker, body: { mode: 'auto', webhook_urls: ['https://example.com/a', 'https://127.0.0.1/x'] } })).c, 400);
});
await t('delivery: emails and every webhook, each with its own on/off switch', async () => {
  const b = { id: BROKER, email: 'jo@broker.test', deliver_emails: 'c@x.co, d@x.co', notify_emails: 'a@x.co', webhook_urls: ['https://example.com/a', 'https://example.org/b'] };
  const hooks = () => calls.filter((c) => c.startsWith('POST https://example.')).length;
  const toBroker = () => mails.filter((m) => !/matched with/.test(m.subject));
  await P.deliver(b, leadRow({ buyer: BROKER }));
  assert.deepEqual(toBroker()[0].to, ['c@x.co', 'd@x.co']); assert.equal(hooks(), 2);
  reset(); await P.deliver({ ...b, deliver_on: false }, leadRow({ buyer: BROKER }));
  assert.equal(toBroker().length, 0); assert.equal(hooks(), 2);
  reset(); await P.deliver({ ...b, webhook_on: false }, leadRow({ buyer: BROKER }));
  assert.equal(toBroker().length, 1); assert.equal(hooks(), 0);
  reset(); await P.deliver({ ...b, mode: 'manual' }, leadRow({ buyer: BROKER, auto: false }));
  assert.equal(hooks(), 2, 'manual buys go to the webhooks too');
  assert.deepEqual(P.recipients(b, 'alert'), ['a@x.co']); assert.deepEqual(P.recipients({ email: 'jo@broker.test' }, 'alert'), ['jo@broker.test']);
});
await t('matched business is emailed the broker profile, hidden lines left out', async () => {
  reset();
  const b = { id: BROKER, email: 'jo@broker.test', company: 'Acme Ltd', deliver_on: false, profile: { name: 'Acme Finance', person: 'Jo Patel', phone: '0161 496 0000', whatsapp: '07700 900123', email: 'jo@acme.test', show: { person: true, phone: true, whatsapp: false, email: true } } };
  const l = leadRow({ buyer: BROKER }); await P.deliver(b, l);
  const m = mails.find((x) => /matched with Acme Finance/.test(x.subject));
  assert.ok(m, 'matched email sent'); assert.deepEqual(m.to, [l.email]);
  assert.ok(m.html.includes('Jo Patel') && m.html.includes('0161 496 0000') && !m.html.includes('wa.me'), 'shows chosen lines only');
  assert.deepEqual(P.publicProfile({ company: 'Plain Ltd' }), { company: 'Plain Ltd', person: null, role: null, about: null, logo: null, website: null, phone: null, whatsapp: null, email: null, sms: null });
  const c = P.cleanProfile({ name: 'X', website: 'javascript:alert(1)', email: 'nope', show: { phone: false } }, { logo: 'https://l/x.png' });
  assert.equal(c.website, ''); assert.equal(c.email, ''); assert.equal(c.show.phone, false); assert.equal(c.logo, 'https://l/x.png');
});
await t('settings cannot change credits, approval or admin', async () => {
  await api('settings', { method: 'POST', token: tok.broker, body: { mode: 'manual', credits: 99999, approved: true, is_admin: true } });
  const r = await api('settings', { method: 'POST', token: tok.broker, body: { mode: 'manual', credits: 99999, approved: true, is_admin: true } });
  assert.equal(r.c, 200, JSON.stringify(r.b));
  const src = (await import('node:fs')).readFileSync(new URL('../api/platform.js', import.meta.url), 'utf8');
  const block = src.slice(src.indexOf("if (action === 'settings'"), src.indexOf("if (action === 'test-webhook'"));
  assert.ok(!/\b(credits|approved|is_admin|stripe_customer)\s*:/.test(block), 'settings can write a protected field');
});

await t('LinkedIn: broker sign-up, subscription and enquiry go to the Conversions API (hashed email), nothing without a token', async () => {
  liPosts = [];
  await P.metaEvent('PartnerRegistered', { email: 'Li@B.co', first: 'Li', last: 'Ng', company: 'LiCo', eventId: 'reg-1' });
  assert.equal(liPosts.length, 0, 'sent without a token');
  process.env.LINKEDIN_CAPI_TOKEN = 'li-test';
  try {
    await P.metaEvent('PartnerRegistered', { email: 'Li@B.co', first: 'Li', last: 'Ng', company: 'LiCo', eventId: 'reg-1' });
    await P.metaEvent('Subscribe', { email: 'li@b.co', eventId: 'sub-1', custom: { value: 2500 } });
    await P.metaEvent('ViewContent', { email: 'li@b.co' }); // not a LinkedIn conversion
    await P.metaEvent('PartnerInterest', { email: 'li@b.co', eventId: 'e-pi' });
    assert.equal(liPosts.length, 3, 'wrong number of LinkedIn events');
    assert.equal(liPosts[2].body.conversion, 'urn:lla:llaPartnerConversion:30688940'); assert.equal(liPosts[2].body.eventId, 'e-pi');
    const [reg, sub] = liPosts.map((x) => x.body);
    assert.equal(reg.conversion, 'urn:lla:llaPartnerConversion:30563980'); assert.equal(sub.conversion, 'urn:lla:llaPartnerConversion:30563988');
    assert.equal(reg.user.userIds[0].idValue, (await import('node:crypto')).createHash('sha256').update('li@b.co').digest('hex'));
    assert.ok(!JSON.stringify(reg).includes('li@b.co'), 'plain email sent');
    assert.deepEqual(reg.user.userInfo, { firstName: 'Li', lastName: 'Ng', companyName: 'LiCo', countryCode: 'GB' });
    assert.deepEqual(sub.conversionValue, { currencyCode: 'GBP', amount: '2500.00' });
    assert.equal(liPosts[0].headers.Authorization, 'Bearer li-test');
    assert.match(liPosts[0].headers['LinkedIn-Version'], /^20\d{4}$/);
  } finally { delete process.env.LINKEDIN_CAPI_TOKEN; }
});
await t('admin: LinkedIn leads get a cost per lead from LinkedIn spend for their ad set', async () => {
  const keep = leads, day = new Date().toISOString().slice(0, 10), [y, mo, d] = day.split('-').map(Number);
  leads = [leadRow({ id: 1, source: { utm: { utm_source: 'linkedin', utm_id: '777' } } }), leadRow({ id: 2, source: { utm: { utm_source: 'linkedin', utm_id: '777' } } }), leadRow({ id: 3, source: { utm: {} } })];
  liSpendRows = [{ costInLocalCurrency: '90.00', dateRange: { start: { year: y, month: mo, day: d } }, pivotValues: ['urn:li:sponsoredCampaign:777'] }];
  process.env.LINKEDIN_ADS_TOKEN = 'li-ads';
  try {
    const r = await api('admin', { token: tok.admin });
    assert.deepEqual(r.b.leads.map((l) => [l.id, l.channel, l.ad_cost ?? null]), [[1, 'LinkedIn', 45], [2, 'LinkedIn', 45], [3, 'Direct or unknown', null]]);
    assert.equal(r.b.adStatus.LinkedIn, 'ok');
    assert.ok(/sponsoredAccount(:|%3A)560716965/.test(liGets[0]), liGets[0]);
  } finally { delete process.env.LINKEDIN_ADS_TOKEN; leads = keep; liSpendRows = []; }
});
await t('admin: each lead shows where it came from (first page of the visit wins over the form page)', async () => {
  const keep = leads;
  leads = [leadRow({ id: 1, source: { utm: { purpose: 'x' }, referrer: 'https://leaflegal.co/', first: { utm_source: 'linkedin', utm_campaign: 'c9', landing: '/' } } }),
    leadRow({ id: 2, source: { utm: { fbclid: 'abc', utm_campaign: '123' }, referrer: 'https://facebook.com/' } }),
    leadRow({ id: 3, source: { utm: {}, referrer: 'https://www.google.com/' } }), leadRow({ id: 4, source: { utm: {}, referrer: '' } })];
  const r = await api('admin', { token: tok.admin }); leads = keep;
  assert.deepEqual(r.b.leads.map((l) => [l.id, l.channel, l.campaign]), [[1, 'LinkedIn', 'c9'], [2, 'Meta ads', '123'], [3, 'Google search', null], [4, 'Direct or unknown', null]]);
  assert.ok(!r.b.leads.some((l) => 'source' in l), 'raw source sent to the list');
});
await t('admin: leads for sale totalled at today’s price (1 credit = £1)', async () => {
  const keep = leads;
  leads = [leadRow({ id: 1, price: 95 }), leadRow({ id: 2, price: 100, turnover: '£100k to £250k', created_at: new Date(Date.now() - 4 * 864e5).toISOString() }), leadRow({ id: 3, price: 80, buyer: BROKER })];
  const r = await api('admin', { token: tok.admin }); leads = keep;
  assert.equal(r.c, 200, JSON.stringify(r.b)); assert.deepEqual(r.b.stats.for_sale, { leads: 2, credits: 145, full: 195 });
});
console.log('\nLeads coming in');
const enq = (b) => req(enquiry, { method: 'POST', body: b });
const form = { firstName: 'Sam', lastName: 'Lee', fullName: 'Sam Lee', business: 'Lee Ltd', consentTerms: true, consentShare: true, phone: '+447700900123', email: 'sam@gmail.com', amount: '£50,000', purpose: 'Cash flow',
  timeline: 'Within 2 weeks', structure: 'Limited company', turnover: '£250k to £500k', trading: '2 to 5 years', credit: 'No', debt: 'No', _ms: 60000, company: { number: '01234567', status: 'active', type: 'ltd', incorporated: '2015-01-01', director: 'Sam Lee', directorListed: true } };
await t('enquiry: consent boxes required', async () => assert.equal((await enq({ ...form, consentShare: false })).c, 400));
await t('enquiry: non-UK-mobile and bad email refused', async () => {
  assert.equal((await enq({ ...form, phone: '+441234567890' })).c, 400); assert.equal((await enq({ ...form, email: 'sam@' })).c, 400);
});
await t('enquiry: bot (honeypot or under 5 seconds) is flagged and never sold', async () => {
  await enq({ ...form, website: 'spam' });
  assert.ok(!calls.some((c) => c.startsWith('POST') && c.includes('/rest/v1/leads')), 'spam lead listed');
});
await t('enquiry: genuine lead is listed with a server-set price', async () => {
  leads = [];
  const r = await enq({ ...form, price: 1 }); assert.equal(r.c, 200, JSON.stringify(r.b));
  assert.ok(calls.some((c) => c.startsWith('POST') && c.includes('/rest/v1/leads')), 'lead listed');
  assert.ok(!mails.some((m) => /enquiry/i.test(m.subject) && [].concat(m.to).includes('admin@test')), 'admin emailed per lead');
});
await t('£500k page: CompleteRegistration for £500k+ revenue on any page, Lead for all, variant tagged on the lead', async () => {
  process.env.META_CAPI_TOKEN = 'test';
  const sent = () => metaPosts.flatMap((p) => p.data.map((d) => `${d.event_name}:${d.event_id}`));
  try {
    for (const [i, [variant, turnover, want, premium]] of [
      ['500k', '£250k to £500k', ['Lead:e0', 'TierCLead:e0-TierCLead', 'TierBLead:e0-TierBLead'], false], // £250k to £500k: Lead + TierBLead
      ['500k', '£1m to £5m', ['Lead:e1', 'CompleteRegistration:e1-q', 'TierCLead:e1-TierCLead', 'TierBLead:e1-TierBLead', 'TierALead:e1-TierALead'], true],
      [undefined, '£250k to £500k', ['Lead:e2', 'TierCLead:e2-TierCLead', 'TierBLead:e2-TierBLead'], false], // homepage: Lead as before
      [undefined, '£5m+', ['Lead:e3', 'CompleteRegistration:e3-q', 'TierCLead:e3-TierCLead', 'TierBLead:e3-TierBLead', 'TierALead:e3-TierALead'], true], // homepage £500k+: both too
    ].entries()) {
      reset(); leads = [];
      const r = await enq({ ...form, variant, turnover, eventId: `e${i}`, email: `v${i}@gmail.com`, phone: `+44770090020${i}` });
      assert.equal(r.c, 200, JSON.stringify(r.b));
      assert.deepEqual(sent(), want.map((w) => w.replace(/e\d/g, `e${i}`)), `${variant} ${turnover}`);
      assert.deepEqual(r.b.meta, { lead: true, qualified: premium, revenue: premium ? ['TierCLead', 'TierBLead', 'TierALead'] : ['TierCLead', 'TierBLead'] });
      assert.equal(leadPosts[0].source.landing_variant, variant || null);
      assert.equal(leadPosts[0].source.premium_tier, premium);
      assert.equal(leadPosts[0].turnover, turnover);
    }
    reset(); await enq({ ...form, variant: 'evil', turnover: '£5m+', email: 'v9@gmail.com', phone: '+447700900209' });
    assert.equal(leadPosts[0].source.landing_variant, null, 'unknown variant stored');
  } finally { delete process.env.META_CAPI_TOKEN; }
});
await t('enquiry: a repeat enquiry sends no Meta events (server or pixel) and is not listed again', async () => {
  process.env.META_CAPI_TOKEN = 'test';
  try {
    reset(); leads = [{ id: 65 }]; // the mock returns this for the duplicate lookup
    const r = await enq({ ...form, turnover: '£1m to £5m', eventId: 'r1', email: 'r1@gmail.com', phone: '+447700900401' });
    assert.equal(r.c, 200, JSON.stringify(r.b));
    assert.deepEqual(r.b.meta, { lead: false, qualified: false, revenue: [] });
    assert.equal(metaPosts.length, 0, 'meta sent for a repeat');
    assert.equal(leadPosts.length, 0, 'repeat listed');
  } finally { delete process.env.META_CAPI_TOKEN; leads = []; }
});
await t('enquiry: where the visit started is stored, known keys only', async () => {
  reset(); leads = [];
  await req(enquiry, { method: 'POST', body: { ...form, email: 'ft@gmail.com', phone: '+447700900701', first: { utm_source: 'linkedin', utm_campaign: 'c9', landing: '/', evil: 'x', gclid: 5 } } });
  assert.deepEqual(leadPosts[0].source.first, { utm_source: 'linkedin', utm_campaign: 'c9', landing: '/' });
});
await t('enquiry: a director picked from the list gets their month/year of birth from Companies House (not the browser), shown to the buyer', async () => {
  const had = process.env.COMPANIESHOUSE_API; process.env.COMPANIESHOUSE_API = 'ch-test';
  chOfficers = [{ name: 'LEE, Sam', officer_role: 'director', date_of_birth: { month: 3, year: 1978 } }, { name: 'OLD, Gone', officer_role: 'director', resigned_on: '2020-01-01', date_of_birth: { month: 1, year: 1950 } }];
  try {
    reset(); leads = [];
    await enq({ ...form, email: 'dob@gmail.com', phone: '+447700900801', company: { number: '01234567', director: 'Sam Lee', directorListed: true, directorDob: '1999-01' } });
    assert.equal(leadPosts[0].company.directorDob, '1978-03');
    reset(); leads = [];
    await enq({ ...form, email: 'dob2@gmail.com', phone: '+447700900802', company: { number: '01234567', director: '', directorListed: false, directorDob: '1999-01' } });
    assert.equal(leadPosts[0].company.directorDob, undefined, 'dob taken from the browser');
    const out = P.leadOut({ ...leadRow(), company: { number: '01234567', director: 'Sam Lee', directorListed: true, directorDob: '1978-03' } });
    assert.equal(out.companies_house.director_dob, '1978-03');
    assert.equal(P.companyInfo({ number: '01234567', directorListed: true, directorDob: '1978-03' }, false).director_dob, '1978-03', 'not in the pre-purchase preview');
  } finally { chOfficers = []; if (had === undefined) delete process.env.COMPANIESHOUSE_API; else process.env.COMPANIESHOUSE_API = had; leads = []; }
});
await t('enquiry: ?test=1 submissions are never saved or matched', async () => {
  leads = [];
  const r = await enq({ ...form, utm: { test: '1' }, email: 't1@gmail.com', phone: '+447700900301' });
  assert.equal(r.c, 200);
  assert.ok(!leadPosts.length && !rpcCalls.some((c) => c.fn === 'buy_lead'), 'test lead saved or bought');
});
await t('auto-buy: skips brokers over their per-lead maximum or without enough credits', async () => {
  people[BROKER] = { ...people[BROKER], mode: 'auto', credits: 500, filters: { maxPrice: 10 } };
  await P.ingestLead({ ...form, email: 'a@b.co', phone: '+447700900111' });
  assert.ok(!rpcCalls.some((c) => c.fn === 'buy_lead'), 'bought over max');
  people[BROKER] = { ...people[BROKER], filters: {}, credits: 5 };
  await P.ingestLead({ ...form, email: 'a2@b.co', phone: '+447700900112' });
  assert.ok(!rpcCalls.some((c) => c.fn === 'buy_lead'), 'bought without credits');
  people[BROKER] = { ...people[BROKER], mode: 'manual', credits: 500 };
});
await t('smaller/newer businesses (under £50k or under 6 months) go straight to Aureum (Daniel) free, never sold', async () => {
  const D = P.STARTER_BROKER; people[D] = { ...people[BROKER], id: D, company: 'Aureum Finance', mode: 'manual', credits: 0 };
  const keep = leads; leads = []; patches = []; rpcCalls.length = 0;
  const r = await P.ingestLead({ ...form, turnover: 'Under £50k', property: 'Homeowner', email: 'starter@b.co', phone: '+447700900131' });
  assert.equal(r.buyer, D, 'not assigned to Daniel'); assert.equal(r.price, 0);
  assert.ok(patches.some((x) => x.u.includes('/leads?id=eq.') && x.b.buyer === D), 'lead not given to Daniel');
  assert.ok(!rpcCalls.some((c) => c.fn === 'buy_lead'), 'charged or sold to someone');
  assert.ok(P.isStarter({ trading: 'Under 6 months' }) && !P.isStarter({ turnover: '£50k to £100k', trading: '6 to 12 months' }));
  leads = keep; delete people[D];
});
await t('auto-buy: budget tiers buy only within each tier\'s share of the monthly limit', async () => {
  const tier = (share, turnovers) => ({ name: 'T', share, turnovers });
  people[BROKER] = { ...people[BROKER], mode: 'auto', credits: 5000, monthly_cap: 1000, filters: { tiers: [tier(75, [form.turnover])] } };
  const keep = leads; leads = []; // no earlier buys of this business
  rpcCalls.length = 0; await P.ingestLead({ ...form, email: 'tier1@b.co', phone: '+447700900121' });
  assert.ok(rpcCalls.some((c) => c.fn === 'buy_lead'), 'matching tier not bought');
  people[BROKER].filters = { tiers: [tier(75, ['£5m+'].filter((x) => x !== form.turnover))] };
  rpcCalls.length = 0; await P.ingestLead({ ...form, email: 'tier2@b.co', phone: '+447700900122' });
  assert.ok(!rpcCalls.some((c) => c.fn === 'buy_lead'), 'bought outside every tier');
  people[BROKER] = { ...people[BROKER], monthly_cap: 20, filters: { tiers: [tier(10, [form.turnover])] } }; // 2 credits for the tier
  rpcCalls.length = 0; await P.ingestLead({ ...form, email: 'tier3@b.co', phone: '+447700900123' });
  assert.ok(!rpcCalls.some((c) => c.fn === 'buy_lead'), 'bought over the tier budget');
  people[BROKER] = { ...people[BROKER], mode: 'manual', monthly_cap: 0, filters: {} }; leads = keep;
});
await t('commission clients: no manual buying and auto-buy rules stay as Leaflegal set them', async () => {
  const before = people[BROKER];
  people[BROKER] = { ...before, plan: { name: 'Commission', credits: 0, commission: true }, mode: 'auto', monthly_cap: 900, filters: { turnovers: ['£5m+'] } };
  try {
    const r = await api('buy', { method: 'POST', token: tok.broker, body: { id: 7 } });
    assert.equal(r.c, 403, 'commission client bought a lead');
    patches.length = 0;
    const s = await api('settings', { method: 'POST', token: tok.broker, body: { mode: 'manual', monthly_cap: 0, filters: { turnovers: [] }, deliver_on: true } });
    assert.equal(s.c, 200);
    assert.deepEqual(s.b.filters.turnovers, ['£5m+'], 'criteria changed');
    const sent = calls.filter((c) => c.startsWith('PATCH') && c.includes('/rest/v1/brokers?id=eq.')).length;
    assert.ok(sent, 'settings not saved');
    const me = await api('me', { token: tok.broker });
    assert.equal(me.b.broker.restricted, true);
  } finally { people[BROKER] = before; }
});
await t('team: owner invites a user, they join with the link, and permissions limit what they can do', async () => {
  team = [];
  const inv = await api('team-invite', { method: 'POST', token: tok.broker, body: { email: 'Mem@team.test', name: 'Mo Member', perms: { buy: false, team: false, bogus: true } } });
  assert.equal(inv.c, 200, JSON.stringify(inv.b));
  assert.deepEqual(team[0].perms, { buy: false, settings: false, billing: false, team: false });
  assert.ok(mails.some((x) => String(x.html).includes(`/join?t=${team[0].token}`)), 'invite email without link');
  assert.equal((await api('me', { token: tok.member })).c, 403, 'member signed in before joining');
  const g = await api('join', { query: { t: team[0].token } });
  assert.equal(g.b.email, 'mem@team.test');
  const j = await api('join', { method: 'POST', body: { t: team[0].token, name: 'Mo', password: 'Str0ng!Password1' } });
  assert.equal(j.c, 200, JSON.stringify(j.b)); assert.equal(team[0].user_id, MEMBER); assert.equal(team[0].token, null);
  assert.equal((await api('join', { query: { t: 'a'.repeat(48) } })).c, 404);
  const me = await api('me', { token: tok.member });
  assert.equal(me.c, 200); assert.equal(me.b.broker.id, BROKER); assert.equal(me.b.broker.member.email, 'mem@team.test'); assert.equal(me.b.broker.is_admin, false);
  assert.equal((await api('buy', { method: 'POST', token: tok.member, body: { id: 7 } })).c, 403, 'bought without permission');
  assert.equal((await api('settings', { method: 'POST', token: tok.member, body: { mode: 'auto' } })).c, 403, 'changed settings without permission');
  assert.equal((await api('team', { token: tok.member })).c, 403, 'saw team without permission');
  assert.equal((await api('leads', { token: tok.member })).c, 200, 'member can see leads');
  assert.equal((await api('team-update', { method: 'POST', token: tok.broker, body: { id: 1, perms: { buy: true } } })).c, 200);
  assert.equal(team[0].perms.buy, true);
  assert.equal((await api('team-remove', { method: 'POST', token: tok.broker, body: { id: 1 } })).c, 200);
  assert.equal((await api('me', { token: tok.member })).c, 403, 'removed member still signed in');
  team = [];
});
await t('auto-buy: never buys a lead whose phone or email failed checks', async () => {
  people[BROKER] = { ...people[BROKER], mode: 'auto', credits: 500, filters: {} };
  await P.ingestLead({ ...form, email: 'a3@b.co', phone: '+447700900113', checks: { phone: { allocated: false } } });
  assert.ok(!rpcCalls.some((c) => c.fn === 'buy_lead'));
  people[BROKER] = { ...people[BROKER], mode: 'manual' };
});
await t('auto-buy: only brokers who accepted the agreement', async () => {
  people[BROKER] = { ...people[BROKER], mode: 'auto', credits: 500, filters: {} }; signedAgreement = false;
  await P.ingestLead({ ...form, email: 'a4@b.co', phone: '+447700900114' });
  signedAgreement = true; assert.ok(!rpcCalls.some((c) => c.fn === 'buy_lead'));
  people[BROKER] = { ...people[BROKER], mode: 'manual' };
});
await t('repeat enquiry: within 7 days is a duplicate; after 7 days a new lead the earlier buyer never gets (auto-buy, opportunities, buying)', async () => {
  const old = (d) => new Date(Date.now() - d * 864e5).toISOString(), was = leads;
  reset(); leads = [leadRow({ id: 5, buyer: BROKER, created_at: old(2) })];
  assert.equal((await P.ingestLead({ ...form, email: 'rep@b.co', phone: '+447700900501' })).duplicateOf, 5);
  reset(); leads = [leadRow({ id: 5, buyer: BROKER, created_at: old(10) })];
  people[BROKER] = { ...people[BROKER], mode: 'auto', credits: 500, filters: {} };
  try {
    const r = await P.ingestLead({ ...form, email: 'rep@b.co', phone: '+447700900501' });
    assert.ok(!r.duplicateOf, 'still a duplicate after 7 days');
    assert.deepEqual(leadPosts[0].exclude_brokers, [BROKER]);
    assert.ok(!rpcCalls.some((c) => c.fn === 'buy_lead' && c.args.p_broker === BROKER), 'auto-bought by the earlier buyer');
  } finally { people[BROKER] = { ...people[BROKER], mode: 'manual' }; }
  reset(); leads = [leadRow({ buyer: null, exclude_brokers: [BROKER] })];
  const o = await api('opportunities', { token: tok.broker });
  assert.ok(calls.some((c) => c.includes(`exclude_brokers=not.cs.{${BROKER}}`)), 'opportunities not filtered');
  assert.equal(o.c, 200);
  const b = await api('buy', { method: 'POST', token: tok.broker, body: { id: 7 } });
  assert.equal(b.c, 409); assert.ok(!rpcCalls.some((c) => c.fn === 'buy_lead'), 'bought anyway');
  leads = was;
});
await t('repeat enquiry already matched: business told who its broker is (with a different-broker link), broker told they followed up; the link re-matches once, never to the same broker', async () => {
  const was = leads, mine = leadRow({ id: 5, email: 'rep2@gmail.com', phone: '+447700900601', buyer: BROKER, bought_at: new Date().toISOString(), created_at: new Date(Date.now() - 2 * 864e5).toISOString() });
  try {
    reset(); leads = [mine];
    const r = await enq({ ...form, email: mine.email, phone: mine.phone });
    assert.equal(r.c, 200, JSON.stringify(r.b));
    assert.ok(r.b.again && r.b.match?.company && /action=rematch&id=5&/.test(r.b.rematch), JSON.stringify(r.b));
    assert.equal(leadPosts.length, 0, 'listed again');
    const biz = mails.find((m) => [].concat(m.to).includes(mine.email)), brk = mails.find((m) => /followed up/.test(m.subject));
    assert.ok(biz && /already been matched/.test(biz.subject) && biz.html.includes('Match me with a different broker'), 'business email');
    assert.ok(brk && brk.html.includes(mine.phone), 'broker email');
    const Q = Object.fromEntries(new URL(r.b.rematch).searchParams);
    const get = await req(handler, { method: 'GET', query: Q });
    assert.ok(get.c === 200 && /<form method="post">/.test(get.b), 'confirmation page');
    assert.equal(leadPosts.length, 0, 'GET re-matched');
    const post = await req(handler, { method: 'POST', query: Q });
    assert.equal(post.c, 200);
    assert.equal(leadPosts.length, 1, 'no new lead'); assert.equal(leadPosts[0].source.rematch_of, 5);
    assert.deepEqual(leadPosts[0].exclude_brokers, [BROKER]);
    leads = [mine, { ...leadRow({ id: 9 }), source: { rematch_of: 5 } }];
    const again = await req(handler, { method: 'POST', query: Q });
    assert.ok(/already asked/.test(again.b), 'second re-match allowed');
    const bad = await req(handler, { method: 'GET', query: { ...Q, sig: '0'.repeat(40) } });
    assert.equal(bad.c, 403);
  } finally { leads = was; }
});
await t('duplicate check quotes input, so a crafted email cannot change the filter', async () => {
  await P.ingestLead({ ...form, email: 'a,email.like.*@gmail.com', phone: '+447700900115' });
  const dq = calls.find((c) => c.includes('or=(phone.eq.'));
  assert.ok(dq.includes('email.eq."a,email.like.*@gmail.com"'), dq);
});

await t('outside-criteria leads: emailed to brokers they don’t fit (saying why), not to ones they fit or who switched them off', async () => {
  const only = { turnovers: ['£1m to £5m'] }; // the form lead is £250k to £500k
  people[BROKER] = { ...people[BROKER], mode: 'auto', credits: 500, notify: true, filters: only };
  await P.ingestLead({ ...form, email: 'o1@b.co', phone: '+447700900121' });
  const m = mails.find((x) => /^Outside your criteria/.test(x.subject));
  assert.ok(m, 'no suggestion sent'); assert.match(m.html, /Annual revenue of £250k to £500k/); assert.match(m.html, /action=suggest-off/);
  assert.ok(!rpcCalls.some((c) => c.fn === 'buy_lead'), 'auto-bought a lead outside the criteria');
  reset(); people[BROKER] = { ...people[BROKER], filters: { ...only, suggest: 'off' } };
  await P.ingestLead({ ...form, email: 'o2@b.co', phone: '+447700900122' });
  assert.ok(!mails.some((x) => /Outside your criteria/.test(x.subject)), 'sent after switching off');
  reset(); people[BROKER] = { ...people[BROKER], mode: 'manual', filters: {} };
  await P.ingestLead({ ...form, email: 'o3@b.co', phone: '+447700900123' });
  assert.ok(!mails.some((x) => /Outside your criteria/.test(x.subject)), 'matching lead sent as a suggestion');
  assert.ok(mails.some((x) => /^New lead:/.test(x.subject)), 'matching alert missing');
});
await t('outside-criteria: daily summary lists unsold leads once, and the unsubscribe link needs a valid signature', async () => {
  leads = [leadRow({ id: 31 }), leadRow({ id: 32, turnover: '£1m to £5m' })];
  people[BROKER] = { ...people[BROKER], filters: { turnovers: ['£1m to £5m'], suggest: 'daily' } };
  const sent = await P.suggestDigest();
  assert.equal(sent, 1); const m = mails.find((x) => /outside your criteria are still available|^Outside your criteria/.test(x.subject)); assert.ok(m);
  assert.ok(calls.some((c) => c.startsWith('PATCH') && c.includes(`brokers?id=eq.${BROKER}`)), 'digestAt not saved');
  reset(); people[BROKER] = { ...people[BROKER], filters: { ...people[BROKER].filters, digestAt: new Date().toISOString() } };
  assert.equal(await P.suggestDigest(), 0, 'sent twice in a day');
  assert.equal((await api('suggest-off', { query: { id: BROKER, exp: String(Date.now() + 864e5), sig: 'b'.repeat(40) } })).c, 403);
  const exp = String(Date.now() + 864e5), sig = createHmac('sha256', 'test').update(`suggest-off:${BROKER}:${exp}`).digest('hex').slice(0, 40);
  assert.equal((await api('suggest-off', { query: { id: BROKER, exp, sig } })).c, 200);
  assert.ok(calls.some((c) => c.startsWith('PATCH') && c.includes(`brokers?id=eq.${BROKER}`)));
  people[BROKER] = { ...people[BROKER], filters: {} }; leads = [leadRow()];
});
await t('settings: suggestion choice saved without touching criteria; other saves keep it', async () => {
  people[BROKER] = { ...people[BROKER], filters: { purposes: ['Cash flow'], suggest: 'daily' } };
  const r = await api('settings', { method: 'POST', token: tok.broker, body: { mode: 'manual', monthly_cap: 0, filters: { purposes: ['Cash flow'] } } });
  assert.equal(r.b.filters.suggest, 'daily', 'auto-buy save dropped the choice');
  const r2 = await api('settings', { method: 'POST', token: tok.broker, body: { mode: 'manual', monthly_cap: 0, filters: { purposes: ['Cash flow'] }, suggest: 'off' } });
  assert.equal(r2.b.filters.suggest, 'off'); assert.deepEqual(r2.b.filters.purposes, ['Cash flow']);
  const r3 = await api('settings', { method: 'POST', token: tok.broker, body: { mode: 'manual', monthly_cap: 0, filters: {}, suggest: 'weekly' } });
  assert.equal(r3.b.filters.suggest, 'daily', 'accepted an unknown choice'); // falls back to the saved one (people[] isn't updated by the mock)
  people[BROKER] = { ...people[BROKER], filters: {} };
});

console.log('\nAdmin');
await t('admin can approve and adjust credits (audited)', async () => {
  assert.equal((await api('admin-broker', { method: 'POST', token: tok.admin, body: { id: NEWB, approved: true } })).c, 200);
  assert.equal((await api('admin-broker', { method: 'POST', token: tok.admin, body: { id: BROKER, credits: 100, reason: 'test' } })).c, 200);
  assert.ok(rpcCalls.some((c) => c.fn === 'add_credits' && c.args.p_delta === 100)); assert.ok(calls.some((c) => c.includes('/rest/v1/audit_log')));
});
await t('admin cannot remove their own admin access', async () => {
  await api('admin-update', { method: 'POST', token: tok.admin, body: { broker: ADMIN, is_admin: false } });
  const patch = calls.find((c) => c.startsWith('PATCH') && c.includes(`brokers?id=eq.${ADMIN}`));
  assert.ok(!patch || !patch.includes('is_admin'));
});
await t('approve link: forged signature refused', async () => {
  const r = await api('approve', { query: { id: NEWB, exp: String(Date.now() + 864e5), sig: 'a'.repeat(40) } }); assert.equal(r.c, 403);
});

console.log('\nAdmin: suspend, delete, invoiced plans');
await t('suspended broker cannot buy or pay; auto-buy skips suspended brokers', async () => {
  people[BROKER].suspended_at = new Date().toISOString();
  try {
    assert.equal((await api('buy', { method: 'POST', token: tok.broker, body: { id: 7 } })).c, 403);
    assert.equal((await api('checkout', { method: 'POST', token: tok.broker, body: { pack: 'starter' } })).c, 403);
    assert.ok(!rpcCalls.some((r) => r.fn === 'buy_lead'), 'lead bought while suspended');
  } finally { delete people[BROKER].suspended_at; }
  const src = (await import('node:fs')).readFileSync(new URL('../api/_lib/platform.js', import.meta.url), 'utf8');
  assert.ok(src.includes("brokers?approved=eq.true&suspended_at=is.null"), 'auto-buy query must exclude suspended brokers');
});
await t('suspend and lift; admin cannot suspend themselves', async () => {
  assert.equal((await api('admin-suspend', { method: 'POST', token: tok.admin, body: { broker: BROKER, reason: 'Unpaid invoice' } })).c, 200);
  assert.ok(calls.some((c) => c.startsWith(`PATCH`) && c.includes(`brokers?id=eq.${BROKER}`)));
  assert.equal((await api('admin-suspend', { method: 'POST', token: tok.admin, body: { broker: BROKER, suspend: false } })).c, 200);
  assert.equal((await api('admin-suspend', { method: 'POST', token: tok.admin, body: { broker: ADMIN } })).c, 400);
});
await t('delete: refused for a broker who bought leads, needs the exact company name, removes the login', async () => {
  const keep = leads; leads = [leadRow({ buyer: NEWB })];
  try { assert.equal((await api('admin-delete', { method: 'POST', token: tok.admin, body: { broker: NEWB, confirm: 'New Ltd' } })).c, 409); } finally { leads = keep; }
  assert.ok(!calls.some((c) => c.startsWith('DELETE')), 'deleted a buyer');
  assert.equal((await api('admin-delete', { method: 'POST', token: tok.admin, body: { broker: NEWB, confirm: 'wrong' } })).c, 400);
  reset();
  assert.equal((await api('admin-delete', { method: 'POST', token: tok.admin, body: { broker: NEWB, confirm: 'new ltd' } })).c, 200);
  assert.ok(calls.some((c) => c === `DELETE https://tefpljuzuvdchczcfjlz.supabase.co/auth/v1/admin/users/${NEWB}`), 'login not deleted');
  assert.equal((await api('admin-delete', { method: 'POST', token: tok.admin, body: { broker: ADMIN, confirm: 'Leaflegal' } })).c, 400);
});
await t('invoiced plan: starting today adds the first credits once per due date, keyed so reruns do nothing', async () => {
  const r = await api('admin-plan', { method: 'POST', token: tok.admin, body: { broker: BROKER, name: 'Custom 10k', credits: '10000', price: '9500' } });
  assert.equal(r.c, 200, JSON.stringify(r.b)); assert.equal(r.b.given, 10000);
  const add = rpcCalls.find((x) => x.fn === 'add_credits');
  assert.equal(add.args.p_delta, 10000); assert.match(add.args.p_ref, new RegExp(`^plan-${BROKER}-\\d{4}-\\d{2}-\\d{2}$`));
  assert.ok(calls.some((c) => c.startsWith('PATCH') && c.includes('ledger?ref=eq.plan-')), 'invoiced amount recorded');
  assert.ok(new Date(r.b.plan.next_at) > new Date(Date.now() + 25 * 864e5), 'next credits about a month away');
  assert.equal((await api('admin-plan', { method: 'POST', token: tok.admin, body: { broker: BROKER, name: '', credits: 10 } })).c, 400);
  assert.equal((await api('admin-plan', { method: 'POST', token: tok.admin, body: { broker: BROKER, name: 'X', credits: -5 } })).c, 400);
  const later = await api('admin-plan', { method: 'POST', token: tok.admin, body: { broker: BROKER, name: 'Later', credits: 100, start: new Date(Date.now() + 5 * 864e5).toISOString() } });
  assert.equal(later.b.given, 0, 'future start adds nothing now');
});
await t('commission client with 0 monthly credits: flagged, nothing granted, no invoiced revenue', async () => {
  rpcCalls.length = 0;
  const r = await api('admin-plan', { method: 'POST', token: tok.admin, body: { broker: BROKER, name: 'Commission', credits: 0, commission: true } });
  assert.equal(r.c, 200, JSON.stringify(r.b)); assert.equal(r.b.given, 0); assert.equal(r.b.plan.commission, true); assert.equal(r.b.plan.price, 0);
  assert.ok(!rpcCalls.some((x) => x.fn === 'add_credits'), 'no credits granted');
  assert.equal((await api('admin-plan', { method: 'POST', token: tok.admin, body: { broker: BROKER, name: 'X', credits: 0 } })).c, 400, 'non-commission plans still need credits');
});
await t('daily plan job runs without sign-in and only reads due plans', async () => {
  const r = await api('cron-plans'); assert.equal(r.c, 200); assert.equal(r.b.ok, true);
  assert.ok(calls.some((c) => c.includes('brokers?plan->>next_at=lte.') && c.includes('suspended_at=is.null')));
});
await t('one-off credits can record an invoiced amount for Finance', async () => {
  assert.equal((await api('admin-broker', { method: 'POST', token: tok.admin, body: { id: BROKER, credits: '5000', reason: 'Package', invoiced: '4500' } })).c, 200);
  assert.ok(calls.some((c) => c.startsWith('PATCH') && c.includes('ledger?ref=eq.admin-')));
});

console.log('\nClean platform addresses');
await t('sign-up hand-off token: round-trips, refuses tampering, readable only by the server', async () => {
  const tok = P.sealHandoff({ company: 'Acme Ltd', email: 'jo@acme.test' });
  assert.ok(!tok.includes('Acme') && !Buffer.from(tok, 'base64url').toString().includes('acme'), 'details readable in the token');
  assert.equal(P.openHandoff(tok).company, 'Acme Ltd');
  assert.equal(P.openHandoff(tok.slice(0, -2) + (tok.endsWith('A') ? 'BB' : 'AA')), null);
  const r = await api('handoff', { query: { h: tok } }); assert.equal(r.b.email, 'jo@acme.test');
  assert.deepEqual((await api('handoff', { query: { h: 'junk' } })).b, {});
});
await t('emails link to platform.leaflegal.co/<page>, never /platform/<page>', async () => {
  assert.equal(P.PLATFORM_URL, 'https://platform.leaflegal.co');
  const src = (await import('node:fs')).readFileSync(new URL('../api/platform.js', import.meta.url), 'utf8') + (await import('node:fs')).readFileSync(new URL('../api/_lib/platform.js', import.meta.url), 'utf8');
  assert.ok(!/platform\.leaflegal\.co\/platform/.test(src));
});

await t('scheduled invite: email id saved; can be cancelled before it sends, not after', async () => {
  invitePosts = [];
  await api('admin-invite', { method: 'POST', token: tok.admin, body: { name: 'Zoe Ray', email: 'zoe@later.test', sendAt: new Date(Date.now() + 864e5).toISOString() } });
  assert.equal(invitePosts[0]?.email_id, 'm', 'Resend id not stored');
  inviteRow = { email: 'zoe@later.test', email_id: 'm', send_at: new Date(Date.now() + 864e5).toISOString() };
  reset();
  assert.equal((await api('admin-invite-cancel', { method: 'POST', token: tok.admin, body: { email: 'zoe@later.test' } })).c, 200);
  assert.ok(calls.some((c) => c === 'POST https://api.resend.com/emails/m/cancel'), 'email not cancelled at Resend');
  assert.ok(calls.some((c) => c.startsWith('DELETE') && c.includes('invites?email=eq.zoe@later.test')), 'invite not removed');
  inviteRow = { ...inviteRow, send_at: new Date(Date.now() - 6e4).toISOString() };
  assert.equal((await api('admin-invite-cancel', { method: 'POST', token: tok.broker, body: { email: 'zoe@later.test' } })).c, 403, 'broker allowed');
  assert.equal((await api('admin-invite-cancel', { method: 'POST', token: tok.admin, body: { email: 'zoe@later.test' } })).c, 400, 'cancelled after sending');
  inviteRow = null;
});

await t('profile: separate text number; blank falls back to the mobile; switched off hides Text', async () => {
  const b = (profile) => ({ company: 'Acme', profile: { name: 'Acme', phone: '01234 567890', whatsapp: '07700 900111', ...profile } });
  const sms = (pr) => P.contactActions(P.publicProfile(b(pr)), { full_name: 'Sam' }).find((a) => a.k === 'sms');
  assert.equal(sms({}).sub, '07700 900111', 'falls back to the WhatsApp mobile');
  assert.equal(sms({ sms: '07700 900222' }).sub, '07700 900222', 'own text number');
  assert.equal(sms({ sms: '07700 900222', show: { sms: false } }), undefined, 'switched off');
  assert.equal(P.cleanProfile({ sms: '07700 900222<script>' }).sms, '07700 900222');
});

await t('plans: Starter £2,500, Growth £5,000, custom from £6,000, no bonus credits', async () => {
  assert.deepEqual(Object.keys(P.PACKS), ['starter', 'growth']);
  assert.equal(P.PACKS.starter.pence, 250000); assert.equal(P.PACKS.starter.credits, 2500);
  assert.equal(P.PACKS.growth.pence, 500000); assert.equal(P.PACKS.growth.credits, 5000);
  assert.equal(P.customPack(10000).credits, 10000); assert.equal(P.customPack(20000).credits, 20000); assert.equal(P.customPack(5000), null);
});

await t('admin approves a waiting broker from Admin → Clients', async () => {
  const r = await api('admin-broker', { method: 'POST', body: { id: NEWB, approved: true }, token: tok.admin });
  assert.equal(r.c, 200, JSON.stringify(r.d));
  assert.ok(calls.some((c) => c.startsWith('PATCH') && c.includes(`brokers?id=eq.${NEWB}`)), 'broker row updated');
  assert.ok(mails.some((m) => m.subject.includes('approved')), 'approval email sent');
});

await t('stripe webhook: signature checks out when Vercel has already parsed Stripe’s pretty-printed JSON', async () => {
  const ev = { id: 'evt_x', type: 'customer.created', data: { object: { id: 'cus_x' } } }, pretty = JSON.stringify(ev, null, 2), t = Math.floor(Date.now() / 1000);
  const sig = `t=${t},v1=${createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(`${t}.${pretty}`).digest('hex')}`;
  const r = await new Promise((done) => {
    const res = { c: 200, setHeader() { return this; }, status(c) { this.c = c; return this; }, json(b) { done({ c: this.c, b }); }, send(b) { done({ c: this.c, b }); } };
    handler({ method: 'POST', url: '/api/x?action=stripe', query: { action: 'stripe' }, body: JSON.parse(pretty), headers: { 'stripe-signature': sig, 'x-forwarded-for': '9.9.9.9' } }, res);
  });
  assert.equal(r.c, 200, JSON.stringify(r.b));
});

await t('invite edit: queued invite gets a new link for the new email; a sent one is resent to the new address; upload kept', async () => {
  inviteRow = null;
  const tokOf = (o) => Buffer.from(JSON.stringify(o)).toString('base64url') + '.sig';
  storedInvites['q@old.test'] = { email: 'q@old.test', name: 'Quinn Old', company: 'Q Ltd', email_id: 'queued', batch: 'csv-1', alerts: true, digest: true, send_at: new Date(Date.now() + 864e5).toISOString(), token: tokOf({ e: 'q@old.test', n: 'Quinn Old', k: 'cold' }) };
  let r = await api('admin-invite-edit', { method: 'POST', token: tok.admin, body: { email: 'q@old.test', newEmail: 'Q@New.test', name: 'Quinn New' } });
  assert.equal(r.c, 200, JSON.stringify(r.b)); assert.equal(r.b.outcome, 'queued');
  const q = storedInvites['q@new.test']; assert.ok(q && !storedInvites['q@old.test'], 'moved to the new email');
  assert.equal(q.batch, 'csv-1'); assert.equal(q.email_id, 'queued'); assert.equal(q.digest, true);
  const d = JSON.parse(Buffer.from(q.token.split('.')[0], 'base64url')); assert.equal(d.e, 'q@new.test'); assert.equal(d.n, 'Quinn New'); assert.equal(d.k, 'cold');
  storedInvites['s@old.test'] = { email: 's@old.test', name: 'Sam Sent', email_id: 'sent', alerts: true, token: tokOf({ e: 's@old.test', n: 'Sam Sent' }) };
  const before = mails.length;
  r = await api('admin-invite-edit', { method: 'POST', token: tok.admin, body: { email: 's@old.test', newEmail: 's@new.test' } });
  assert.equal(r.c, 200, JSON.stringify(r.b)); assert.equal(r.b.outcome, 'resent');
  assert.ok(mails.slice(before).some((m) => [].concat(m.to).includes('s@new.test')), 'invite emailed to the new address');
  assert.equal((await api('admin-invite-edit', { method: 'POST', token: tok.broker, body: { email: 's@new.test', newEmail: 'x@y.test' } })).c, 403, 'admins only');
  assert.equal((await api('admin-invite-edit', { method: 'POST', token: tok.admin, body: { email: 's@new.test', newEmail: 'nope' } })).c, 400, 'bad email refused');
  for (const e of ['q@new.test', 's@new.test']) delete storedInvites[e];
});

await t('meta: a platform sign-up sends PartnerInterest with hashed contact details', async () => {
  process.env.META_CAPI_TOKEN = 'test'; const before = metaPosts.length;
  try {
    assert.equal((await api('signup', { method: 'POST', body: { email: 'pi@broker.test', password: 'Long-enough-123', company: 'PI Ltd', contactName: 'Pat Ives', phone: '07700 900130', fbp: 'fb.1.1.2', turnstile: 'good-token' } })).c, 200);
    const ev = metaPosts.slice(before).flatMap((p) => p.data).find((d) => d.event_name === 'PartnerInterest');
    assert.ok(ev, 'PartnerInterest sent'); assert.equal(ev.custom_data.content_name, 'Platform signup'); assert.equal(ev.user_data.fbp, 'fb.1.1.2');
    assert.ok(metaPosts.slice(before).flatMap((p) => p.data).some((d) => d.event_name === 'PartnerRegistered'), 'PartnerRegistered sent');
    assert.ok(/^[a-f0-9]{64}$/.test(ev.user_data.em[0]) && !JSON.stringify(ev).includes('pi@broker.test'), 'email hashed, never sent plain');
  } finally { delete process.env.META_CAPI_TOKEN; }
});

await t('website partner invite: lead emails on, mobile prefilled, signup confirms the email but still needs approval', async () => {
  const { partnerInvite } = await import('../api/platform.js'); reset();
  const r = await partnerInvite({ email: 'Web@Broker.test', name: 'Wes Broker', company: 'Web Ltd', phone: '07700 900140', call: 'https://leaflegal.co/partners/apply?call=1' });
  assert.ok(r?.token, JSON.stringify(r));
  const inv = storedInvites['web@broker.test']; assert.ok(inv && inv.alerts === true && inv.digest === false, 'invite row with every-new-lead emails');
  const theirs = mails.filter((m) => m.to.includes('web@broker.test'));
  assert.ok(/Thanks for your enquiry/.test(theirs[0]?.subject) && /Book a call/.test(theirs[0].html) && /Join Leaflegal Platform/.test(theirs[0].html), 'thank-you email first, with both next steps');
  const mail = theirs.find((m) => /invitation to Leaflegal Platform/.test(m.subject)); assert.ok(mail && !/approved/i.test(mail.subject) && !/Book a call/.test(mail.html), 'separate invite email, not an approved-supplier one');
  const d = JSON.parse(Buffer.from(r.token.split('.')[0], 'base64url')); assert.equal(d.na, 1); assert.equal(d.m, '07700 900140');
  reset();
  assert.equal((await api('signup', { method: 'POST', body: { email: 'web@broker.test', password: 'Long-enough-123', company: 'Web Ltd', contactName: 'Wes Broker', phone: '07700 900140', invite: r.token } })).c, 200);
  assert.ok(!posts[0].approved, 'website invite must not approve'); assert.ok(posts[0].email_verified_at, 'email confirmed by the invite link');
  assert.ok(mails.some((m) => m.html.includes('action=approve')), 'admin asked to approve');
  assert.ok(!mails.some((m) => m.html.includes('action=verify-email')), 'no separate confirm-email');
  delete storedInvites['web@broker.test'];
});

await t('resend webhook: hard bounces and complaints are suppressed; soft bounces and bad signatures are not', async () => {
  const send = (ev, good = true) => { const raw = JSON.stringify(ev), id = 'msg_' + Math.random(), ts = String(Math.floor(Date.now() / 1000));
    const sig = createHmac('sha256', Buffer.from('resend-test')).update(`${id}.${ts}.${raw}`).digest('base64');
    return new Promise((done) => {
      const res = { c: 200, setHeader() { return this; }, status(c) { this.c = c; return this; }, json(b) { done({ c: this.c, b }); }, send(b) { done({ c: this.c, b }); } };
      handler({ method: 'POST', url: '/api/x?action=resend', query: { action: 'resend' }, body: raw, headers: { 'svix-id': id, 'svix-timestamp': ts, 'svix-signature': `v1,${good ? sig : 'bad'}`, 'x-forwarded-for': '9.9.9.9' } }, res);
    }); };
  assert.equal((await send({ type: 'email.bounced', data: { to: ['gone@dead.test'], bounce: { type: 'Permanent', message: 'No such user' } } })).c, 200);
  assert.equal((await send({ type: 'email.complained', data: { to: ['angry@x.test'] } })).c, 200);
  assert.equal((await send({ type: 'email.bounced', data: { to: ['full@box.test'], bounce: { type: 'Transient' } } })).c, 200);
  assert.equal((await send({ type: 'email.suppressed', data: { to: ['old@bounce.test'] } })).c, 200);
  assert.ok(suppressedEmails.has('old@bounce.test'), 'Resend-suppressed address added');
  assert.equal((await send({ type: 'email.bounced', data: { to: ['forged@x.test'], bounce: { type: 'Permanent' } } }, false)).c, 400);
  assert.ok(suppressedEmails.has('gone@dead.test') && suppressedEmails.has('angry@x.test'), 'hard bounce and complaint suppressed');
  assert.ok(!suppressedEmails.has('full@box.test') && !suppressedEmails.has('forged@x.test'), 'soft bounce and forged event ignored');
});

await t('admin edits a broker’s profile for them (?as=); brokers can’t, and only profile/settings are allowed', async () => {
  const r = await api('profile', { method: 'POST', token: tok.admin, query: { as: BROKER }, body: { name: 'Broker Ltd', about: 'Asset finance' } });
  assert.equal(r.c, 200, JSON.stringify(r.b));
  assert.ok(calls.some((c) => c.startsWith('PATCH') && c.includes(`brokers?id=eq.${BROKER}`)), 'saved to the broker');
  assert.ok(!calls.some((c) => c.startsWith('PATCH') && c.includes(`brokers?id=eq.${ADMIN}`)), 'not to the admin');
  assert.ok(posts.length >= 0 && calls.some((c) => c.startsWith('POST') && c.includes('audit_log')), 'edit logged');
  assert.equal((await api('profile', { method: 'POST', token: tok.broker, query: { as: NEWB }, body: { name: 'x' } })).c, 403, 'broker cannot act as another broker');
  assert.equal((await api('checkout', { method: 'POST', token: tok.admin, query: { as: BROKER }, body: { pack: 'starter' } })).c, 400, 'only profile/settings');
  const saved = team; team = []; mails.length = 0;
  const inv = await api('team-invite', { method: 'POST', token: tok.admin, query: { as: BROKER }, body: { email: 'boss@team.test', perms: { buy: true, settings: true, billing: true, team: true } } });
  assert.equal(inv.c, 200, JSON.stringify(inv.b)); assert.equal(team[0].broker, BROKER, 'invited to the broker, not the admin');
  assert.ok(mails.some((x) => String(x.html).includes('The Leaflegal team')), 'invite from Leaflegal');
  team = saved;
});

console.log('\nCommission clients');
await t('commission plan: credits monthly, £0 price, flag hidden from the broker', async () => {
  const r = await api('admin-plan', { method: 'POST', token: tok.admin, body: { broker: BROKER, name: 'Partner', credits: 2000, price: 900, commission: true } });
  assert.equal(r.c, 200, JSON.stringify(r.b));
  const patch = calls.find((c) => c.startsWith('PATCH') && c.includes(`brokers?id=eq.${BROKER}`));
  assert.ok(patch, 'plan saved');
  assert.ok(rpcCalls.some((x) => x.fn === 'add_credits' && x.args.p_delta === 2000), 'first month of credits added');
  assert.ok(!calls.some((c) => c.startsWith('PATCH') && c.includes('ledger?ref=')), 'nothing marked as invoiced');
  people[BROKER].plan = { name: 'Partner', credits: 2000, price: 0, commission: true, next_at: '2099-01-01T00:00:00Z' };
  const me = await api('me', { token: tok.broker });
  assert.equal(me.b.broker.plan.name, 'Partner'); assert.ok(!('commission' in me.b.broker.plan), 'broker can see the commission flag');
  delete people[BROKER].plan;
});
await t('admin logs commission and ad spend; bad input refused', async () => {
  const ok = await api('admin-commission', { method: 'POST', token: tok.admin, body: { broker: BROKER, kind: 'commission', amount: '£1,250.50', date: '2026-11-01', note: '3 deals' } });
  assert.equal(ok.c, 200, JSON.stringify(ok.b));
  assert.ok(calls.some((c) => c.startsWith('POST') && c.includes('commission_entries')), 'saved');
  assert.ok(calls.some((c) => c.startsWith('POST') && c.includes('audit_log')), 'logged');
  for (const b of [{ kind: 'x', amount: 5, date: '2026-11-01' }, { kind: 'spend', amount: 0, date: '2026-11-01' }, { kind: 'spend', amount: 5, date: '2099-01-01' }, { kind: 'spend', amount: 5 }])
    assert.equal((await api('admin-commission', { method: 'POST', token: tok.admin, body: { broker: BROKER, ...b } })).c, 400, JSON.stringify(b));
});
await t('client view still loads when the commission table is missing', async () => {
  const real = globalThis.fetch;
  globalThis.fetch = (url, o) => (String(url).includes('commission_entries') ? Promise.resolve(new Response('{"message":"relation does not exist"}', { status: 404 })) : real(url, o));
  try { const r = await api('admin-client', { token: tok.admin, query: { id: BROKER } }); assert.equal(r.c, 200, JSON.stringify(r.b)); assert.deepEqual(r.b.commission, []); }
  finally { globalThis.fetch = real; }
});

await t('admin sees every email preview', async () => {
  const r = await api('admin-emails', { token: tok.admin });
  assert.equal(r.c, 200); assert.ok(r.b.emails.length >= 40 && r.b.emails.every((m) => m.subject && m.html), 'previews missing');
});

console.log('\nBulk invites');
await t('bulk send times: N a day between 08:00 and 17:00 UTC, never in the past', async () => {
  const { bulkSendTime } = await import('../api/platform.js');
  const start = new Date('2026-11-16T10:00:00Z');
  assert.equal(bulkSendTime(start, 100, 0).toISOString(), '2026-11-16T10:00:00.000Z');
  assert.ok(bulkSendTime(start, 100, 99) < new Date('2026-11-16T17:00:00Z'));
  assert.equal(bulkSendTime(start, 100, 100).toISOString(), '2026-11-17T08:00:00.000Z', 'day 2 opens at 08:00');
  assert.equal(bulkSendTime(new Date('2026-11-16T19:00:00Z'), 10, 0).toISOString(), '2026-11-17T08:00:00.000Z', 'after hours → next morning');
  assert.equal(bulkSendTime(new Date('2026-11-16T05:00:00Z'), 10, 0).toISOString(), '2026-11-16T08:00:00.000Z', 'before hours → 08:00');
});
await t('bulk upload: queues cold invites at the chosen daily pace, never touches existing accounts', async () => {
  const start = new Date(Date.now() + 864e5).toISOString();
  people[BROKER].email = 'jo@broker.test';
  const r = await api('admin-invite-bulk', { method: 'POST', token: tok.admin, body: { batch: 'csv-1', perDay: 1, leads: 'weekly', kind: 'cold', start, offset: 0,
    rows: [{ email: 'a@firm1.test', name: 'Ann Lee', company: 'Firm 1' }, { email: 'nope', name: 'X' }, { email: 'a@firm1.test', name: 'Dup' }, { email: 'b@firm2.test', name: '' }] } });
  assert.equal(r.c, 200, JSON.stringify(r.b));
  assert.equal(r.b.queued, 2); assert.equal(r.b.invalid, 1); assert.equal(r.b.skipped, 1); assert.equal(r.b.next, 2);
  const a = storedInvites['a@firm1.test'], b = storedInvites['b@firm2.test'];
  assert.equal(a.email_id, 'queued'); assert.equal(a.digest, true); assert.equal(a.batch, 'csv-1');
  assert.ok(new Date(b.send_at) - new Date(a.send_at) >= 864e5 - 9 * 36e5, '1 a day: second invite goes out the next day');
  assert.equal(mails.length, 0, 'emails sent at upload instead of queued');
  const far = await api('admin-invite-bulk', { method: 'POST', token: tok.admin, body: { batch: 'csv-2', perDay: 1, start, offset: 30, rows: [{ email: 'z@far.test', name: 'Z' }] } });
  assert.equal(far.b.queued, 1, 'a send 30 days out was refused');
  delete storedInvites['z@far.test'];
  assert.equal((await api('admin-invite-bulk', { method: 'POST', token: tok.broker, body: { batch: 'x', perDay: 1, rows: [{ email: 'c@x.test' }] } })).c, 403);
  assert.equal((await api('admin-invite-bulk', { method: 'POST', token: tok.admin, body: { batch: 'x', perDay: 1, start: '2020-01-01', rows: [{ email: 'c@x.test' }] } })).c, 400, 'past start');
});
await t('queued invites go to Resend near their send time, with the cold email and an unsubscribe link', async () => {
  const r = await api('admin-invite-flush', { method: 'POST', token: tok.admin, body: {} });
  assert.equal(r.c, 200, JSON.stringify(r.b)); assert.equal(r.b.handed, 2);
  const m = mails.find((x) => x.to.includes('a@firm1.test'));
  assert.ok(m.scheduled_at, 'not scheduled for its time'); assert.match(m.subject, /^Firm 1 is invited to join Leaflegal/);
  assert.ok(/Inbound, genuine enquiries/.test(m.html) && /Accept invite/.test(m.html) && /invite-stop/.test(m.html), 'cold email content');
  assert.ok(m.headers?.['List-Unsubscribe'], 'one-click unsubscribe header');
  assert.notEqual(storedInvites['a@firm1.test'].email_id, 'queued');
  assert.equal((await api('admin-invite-flush', { method: 'POST', token: tok.broker, body: {} })).c, 403);
});
await t('warm single invite keeps the short email; cold single invite gets the full one', async () => {
  await api('admin-invite', { method: 'POST', token: tok.admin, body: { name: 'Wes Warm', email: 'wes@warm.test', kind: 'warm' } });
  await api('admin-invite', { method: 'POST', token: tok.admin, body: { name: 'Cal Cold', email: 'cal@cold.test', company: 'Cold Ltd', kind: 'cold' } });
  assert.match(mails.find((x) => x.to.includes('wes@warm.test')).subject, /invited to join Leaflegal/);
  assert.match(mails.find((x) => x.to.includes('cal@cold.test')).subject, /^Cold Ltd is invited to join Leaflegal/);
  const cold = mails.find((x) => x.to.includes('cal@cold.test')).html;
  assert.ok(/Recent enquiries/.test(cold), 'recent enquiries missing');
  assert.ok(!/SECRET TRADING|Secret Person|secret@trading|7700900999/.test(cold), 'contact details leaked into a cold invite');
});
await t('delete invites by email or whole upload; scheduled ones cancelled at Resend', async () => {
  const r = await api('admin-invite-delete', { method: 'POST', token: tok.admin, body: { batch: 'csv-1' } });
  assert.equal(r.c, 200, JSON.stringify(r.b));
  assert.ok(calls.some((c) => c.startsWith('DELETE') && c.includes('invites?')), 'deleted');
  assert.equal((await api('admin-invite-delete', { method: 'POST', token: tok.admin, body: {} })).c, 400);
  assert.equal((await api('admin-invite-delete', { method: 'POST', token: tok.broker, body: { emails: ['a@firm1.test'] } })).c, 403);
});
await t('new lead: bulk invitees are left to the weekly round-up, not emailed per lead', async () => {
  const was = leads; leads = [];
  try { await P.ingestLead({ amount: '£50,000', purpose: 'Cash flow', turnover: '£250k to £500k', trading: '2 to 5 years', credit: 'No', business: 'X LTD', fullName: 'A B', email: 'a@b.test', phone: '+447700900111' }); } finally { leads = was; }
  assert.ok(calls.some((c) => c.includes('invites?alerts=eq.true&digest=is.false')), 'per-lead invite alerts must exclude digest invitees: ' + calls.filter((c) => c.includes('invites')).join(' | '));
});
await t('weekly round-up: Mondays only, once a week, no contact details', async () => {
  assert.equal(await P.inviteDigest(new Date('2026-11-17T09:00:00Z')), 0, 'not on a Tuesday');
  await P.inviteDigest(new Date('2026-11-16T09:00:00Z'));
  const q = calls.find((c) => c.includes('/rest/v1/leads?buyer=is.null') && c.includes('order=price.desc'));
  assert.ok(q && !/full_name|email|phone/.test(q.split('select=')[1]), 'round-up must not load contact details');
});

console.log('\nAgreement waiver');
await t('admin can excuse a client from the agreement; they can then buy without signing', async () => {
  signedAgreement = false;
  try {
    assert.equal((await api('buy', { method: 'POST', token: tok.broker, body: { id: 7 } })).c, 403, 'unsigned broker bought');
    assert.equal((await api('admin-agreement-waive', { method: 'POST', token: tok.broker, body: { broker: BROKER } })).c, 403, 'broker waived own agreement');
    const r = await api('admin-agreement-waive', { method: 'POST', token: tok.admin, body: { broker: BROKER, waive: true } });
    assert.equal(r.c, 200, JSON.stringify(r.b)); assert.deepEqual(waived, [BROKER]);
    assert.notEqual((await api('buy', { method: 'POST', token: tok.broker, body: { id: 7 } })).c, 403, 'waived broker still blocked');
    const me = await api('me', { token: tok.broker });
    assert.equal(me.b.broker.agreementWaived, true); assert.equal(me.b.broker.agreementCurrent, true);
    await api('admin-agreement-waive', { method: 'POST', token: tok.admin, body: { broker: BROKER, waive: false } });
    assert.deepEqual(waived, []);
    assert.equal((await api('buy', { method: 'POST', token: tok.broker, body: { id: 7 } })).c, 403, 'requirement not restored');
  } finally { signedAgreement = true; waived = null; }
});

console.log('\nMatched message to the business');
await t('matched WhatsApp, else SMS, else nothing', async () => {
  const b = { company: 'Aureum Finance', profile: { name: 'Aureum Finance', person: 'Daniel McCaffrey', phone: '0161 496 0000', email: 'daniel@aureum.test', show: {} } };
  const l = { id: 9, full_name: 'Sam Taylor', amount: 150000, phone: '+447700900123' };
  const real = globalThis.fetch, env = { ...process.env }, sent = [];
  let waOk = true;
  globalThis.fetch = async (u, o) => { const url = String(u); if (!url.includes('platform.bird.com')) return real(u, o); sent.push({ url, body: JSON.parse(o.body) });
    return new Response('{}', { status: url.includes('whatsapp') && !waOk ? 422 : 202 }); };
  try {
    delete process.env.BIRD_API_KEY; assert.equal(await P.matchedMessage(b, l), null, 'sent with no Bird key');
    process.env.BIRD_API_KEY = 'bk_eu1_test'; delete process.env.BIRD_WA_FROM; delete process.env.BIRD_SMS_FROM;
    assert.equal(await P.matchedMessage(b, l), null, 'sent with nothing set up');
    process.env.BIRD_WA_FROM = '+442000000000'; process.env.BIRD_SMS_FROM = 'Leaflegal';
    assert.equal(await P.matchedMessage(b, l), 'whatsapp');
    const wa = sent.at(-1).body; assert.equal(wa.template.slug, 'leaflegal_matched_v2'); assert.equal(wa.template.parameters.broker, 'Aureum Finance'); assert.equal(wa.template.parameters.first_name, 'Sam'); assert.equal(wa.template.parameters.business, 'your business'); assert.ok(!('whatsapp' in wa.template.parameters));
    await P.matchedMessage({ ...b, profile: { ...b.profile, whatsapp: '07700 900999' } }, { ...l, business: 'ACME TRADING LTD' });
    const w2 = sent.at(-1).body.template; assert.equal(w2.slug, 'leaflegal_matched_wa'); assert.equal(w2.parameters.whatsapp, '07700 900999'); assert.equal(w2.parameters.business, 'Acme Trading Ltd');
    waOk = false; assert.equal(await P.matchedMessage(b, l), 'sms', 'no SMS fallback');
    const sms = sent.at(-1).body; assert.equal(sms.category, 'transactional'); assert.ok(/Hi Sam/.test(sms.text) && /Aureum Finance/.test(sms.text) && /Call: 0161 496 0000/.test(sms.text), sms.text);
    assert.equal(await P.matchedMessage(b, { ...l, phone: '' }), null, 'texted a lead with no number');
    console.log('\n' + sms.text.replace(/^/gm, '        ') + '\n');
  } finally { globalThis.fetch = real; process.env = env; }
});

console.log('\nUnsubscribe / suppression');
await t('unsubscribing from an invite stops every future email until they register', async () => {
  await api('admin-invite', { method: 'POST', token: tok.admin, body: { name: 'Una Sub', email: 'una@sub.test', company: 'Sub Ltd', kind: 'cold' } });
  const tokn = storedInvites['una@sub.test'].token;
  const r = await new Promise((done) => { const res = { c: 200, setHeader() { return this; }, status(c) { this.c = c; return this; }, json(b) { done({ c: this.c, b }); }, send(b) { done({ c: this.c, b }); } };
    handler({ method: 'POST', url: `/api/platform?action=invite-stop&t=${encodeURIComponent(tokn)}`, query: { action: 'invite-stop' }, body: 'List-Unsubscribe=One-Click', headers: {} }, res); });
  assert.equal(r.c, 200); assert.ok(suppressedEmails.has('una@sub.test'), 'one-click unsubscribe not recorded');
  assert.ok(calls.some((c) => c.startsWith('GET') && c.includes('crm_contacts?email=eq.una')), 'CRM contact not looked up to mark not interested');
  reset();
  assert.equal((await api('admin-invite', { method: 'POST', token: tok.admin, body: { name: 'Una Sub', email: 'una@sub.test' } })).c, 400, 'could invite again');
  const b = await api('admin-invite-bulk', { method: 'POST', token: tok.admin, body: { batch: 'csv-u', perDay: 10, start: new Date(Date.now() + 864e5).toISOString(), rows: [{ email: 'una@sub.test' }] } });
  assert.equal(b.b.unsubscribed, 1); assert.equal(b.b.queued, 0);
  assert.equal(await P.sendEmail(['una@sub.test'], 'x', '<p>x</p>'), 'suppressed'); assert.equal(mails.length, 0, 'email sent to an unsubscribed address');
  assert.equal(await P.sendBatch([{ to: ['una@sub.test'], subject: 'x', opts: { title: 'x' } }]), 0);
  // registering themselves lifts it
  delete storedInvites['una@sub.test'];
  await api('signup', { method: 'POST', body: { email: 'una@sub.test', password: 'Long-enough-123', company: 'Sub Ltd', contactName: 'Una Sub', phone: '07700 900129', turnstile: 'good-token' } });
  assert.ok(!suppressedEmails.has('una@sub.test'), 'registering did not lift the unsubscribe');
});
await t('registered brokers are never added to the list', async () => {
  people[BROKER].email = 'jo@broker.test';
  const realGet = globalThis.fetch;
  globalThis.fetch = (u, o) => (String(u).includes('/rest/v1/brokers?email=eq.jo%40broker.test') || String(u).includes('/rest/v1/brokers?email=eq.jo@broker.test') ? Promise.resolve(new Response(JSON.stringify([{ id: BROKER }]))) : realGet(u, o));
  try { assert.equal(await P.suppress('jo@broker.test', 'test', 'crm'), false); } finally { globalThis.fetch = realGet; }
  assert.ok(!suppressedEmails.has('jo@broker.test'));
});

console.log('\nPausing and re-pacing an upload');
await t('pause stops an upload, resume re-times what is left at the new pace, lead emails can change', async () => {
  const start = new Date(Date.now() + 864e5).toISOString();
  await api('admin-invite-bulk', { method: 'POST', token: tok.admin, body: { batch: 'csv-p', perDay: 1, leads: 'weekly', start, rows: [1, 2, 3, 4].map((n) => ({ email: `p${n}@pace.test`, name: `P ${n}` })) } });
  const mine = () => [1, 2, 3, 4].map((n) => storedInvites[`p${n}@pace.test`]);
  assert.equal((await api('admin-invite-batch', { method: 'POST', token: tok.broker, body: { batch: 'csv-p', op: 'pause' } })).c, 403);
  const p = await api('admin-invite-batch', { method: 'POST', token: tok.admin, body: { batch: 'csv-p', op: 'pause' } });
  assert.equal(p.c, 200, JSON.stringify(p.b)); assert.ok(mine().every((v) => v.email_id === 'paused'), 'not all paused');
  reset(); await api('admin-invite-flush', { method: 'POST', token: tok.admin, body: {} });
  assert.ok(!mails.some((x) => /pace\.test/.test(x.to.join())), 'paused invites were sent');
  const r = await api('admin-invite-batch', { method: 'POST', token: tok.admin, body: { batch: 'csv-p', op: 'resume', perDay: 2, start } });
  assert.equal(r.c, 200, JSON.stringify(r.b));
  const days = new Set(mine().map((v) => v.send_at.slice(0, 10)));
  assert.ok(mine().every((v) => v.email_id === 'queued') && days.size === 2, `2 a day should take 2 days, got ${[...days]}`);
  await api('admin-invite-batch', { method: 'POST', token: tok.admin, body: { batch: 'csv-p', op: 'leads', leads: 'off' } });
  assert.ok(mine().every((v) => v.alerts === false), 'lead emails not switched off');
  assert.equal((await api('admin-invite-batch', { method: 'POST', token: tok.admin, body: { batch: 'csv-p', op: 'pace', perDay: 0, start } })).c, 400);
  const sel = await api('admin-invite-leads', { method: 'POST', token: tok.admin, body: { emails: ['p1@pace.test'], leads: 'instant' } });
  assert.equal(sel.c, 200, JSON.stringify(sel.b));
  assert.ok(calls.some((c) => c.startsWith('PATCH') && c.includes('invites?email=in.') && c.includes('p1@pace.test')), 'selected invite not updated');
  assert.equal((await api('admin-invite-leads', { method: 'POST', token: tok.broker, body: { emails: ['p1@pace.test'], leads: 'off' } })).c, 403);
});

await t('invites come from BULK_FROM when set; account emails stay on the main address', async () => {
  const was = process.env.BULK_FROM; process.env.BULK_FROM = 'Leaflegal <invites@alerts.leaflegal.co>';
  try {
    await api('admin-invite', { method: 'POST', token: tok.admin, body: { name: 'Bea Bulk', email: 'bea@bulk.test', kind: 'cold' } });
    assert.equal(mails.find((m) => m.to.includes('bea@bulk.test')).from, 'Leaflegal <invites@alerts.leaflegal.co>');
    reset(); await P.lowCredits(people[BROKER], 400, 60);
    assert.ok(mails.length && !mails.some((m) => /alerts\.leaflegal/.test(m.from)), 'account email sent from the bulk address');
  } finally { if (was === undefined) delete process.env.BULK_FROM; else process.env.BULK_FROM = was; }
});

await t('invite unsubscriber is marked Not interested in the CRM (Lost, tagged, flows off)', async () => {
  const { markNotInterested } = await import('../api/_lib/crm.js');
  const real = globalThis.fetch, patches = [];
  globalThis.fetch = async (u, o = {}) => { const url = decodeURIComponent(String(u));
    if (url.includes('crm_contacts?email=eq.')) return new Response(JSON.stringify([{ id: 5, email: 'una@sub.test', stage: 'contacted', tags: ['Platform invite'] }]));
    if (url.includes('crm_contacts?id=eq.5') && o.method === 'PATCH') { patches.push(JSON.parse(o.body)); return new Response(JSON.stringify([{ id: 5 }])); }
    return real(u, o); };
  try { assert.equal(await markNotInterested('una@sub.test'), 5); } finally { globalThis.fetch = real; }
  assert.ok(patches.some((p) => p.tags?.includes('Not interested') && p.flows_paused === true && p.unsubscribed_at), 'not tagged / flows not off');
  assert.ok(patches.some((p) => p.stage === 'lost'), 'not moved to Lost');
});

await t('invited firms get every lead incl. matched ones, at most 3 a day each', async () => {
  const real = globalThis.fetch, sent = [], rateAdds = [];
  const ppl = [{ email: 'fresh@inv.test', name: 'Fay', token: 'tk1' }, { email: 'busy@inv.test', name: 'Bo', token: 'tk2' }];
  globalThis.fetch = async (u, o = {}) => { const url = decodeURIComponent(String(u));
    if (url.includes('/rest/v1/invites?alerts=eq.true&digest=is.false')) return new Response(JSON.stringify(ppl));
    if (url.includes('/rest/v1/rate_events') && (o.method || 'GET') === 'GET') return new Response(JSON.stringify([1, 2, 3].map(() => ({ key: 'invlead:busy@inv.test' }))));
    if (url.includes('/rest/v1/rate_events') && o.method === 'POST') { rateAdds.push(...JSON.parse(o.body)); return new Response('[]', { status: 201 }); }
    if (url.includes('/rest/v1/email_suppressions')) return new Response('[]');
    if (url.includes('resend.com/emails/batch')) { sent.push(...JSON.parse(o.body)); return new Response('{"data":[]}'); }
    return real(u, o); };
  try { assert.equal(await P.inviteLeadAlerts({ id: 1, amount: 150000, purpose: 'Equipment or vehicles', price: 120, turnover: '£500k to £1m', trading: '5+ years' }, true), 1); }
  finally { globalThis.fetch = real; }
  assert.deepEqual(sent.map((m) => m.to[0]), ['fresh@inv.test'], 'the person at 3 today was emailed again');
  assert.match(sent[0].subject, /^Matched in seconds: £150,000 for equipment/);
  assert.ok(/matched within seconds/.test(sent[0].html) && /no longer available/.test(sent[0].html), 'matched wording missing');
  const full = { id: 2, amount: 50000, purpose: 'Cash flow', price: 60, full_name: 'Secret Person', email: 'secret@trading.test', phone: '+447700900999', checks: { phone: { reachable: true }, email: { result: 'valid' } },
    company: { number: '01234567', incorporated: '2015-01-01', directorListed: true, profile: { title: 'SECRET TRADING LTD', locality: 'Leeds', industries: ['Construction'] } } };
  const tips = P.inviteCheckTips(full).join(' ');
  assert.ok(/Phone number verified/.test(tips) && /Companies House/.test(tips), tips);
  assert.ok(!/Secret|secret@|\*|Leeds|Construction|SECRET|7700/.test(tips), 'details leaked to invited firms: ' + tips);
  assert.deepEqual(rateAdds.map((r) => r.key), ['invlead:fresh@inv.test'], 'send not counted towards the daily cap');
});

await t('missed summary: counts what held auto-buy back, sole blockers and who got the lead', async () => {
  const b = { id: 'me', mode: 'auto', filters: { trading: ['2 to 5 years', '5+ years'], cleanCredit: true, amountMin: 30000 } };
  const L = [{ amount: 50000, trading: '1 to 2 years', credit: 'Yes', buyer: 'other' }, { amount: 50000, trading: '1 to 2 years', credit: 'No', buyer: 'me' },
    { amount: 50000, trading: '5+ years', credit: 'No', buyer: null }, { amount: 10000, trading: '5+ years', credit: 'No', buyer: null }];
  const S = P.missedSummary(b, L);
  assert.equal(S.missed.length, 3); assert.deepEqual([S.sold, S.mine, S.live], [1, 1, 1]);
  const tr = S.groups.find((g) => g.k === 'trading');
  assert.deepEqual([tr.n, tr.only, tr.v], [2, 1, '1 to 2 years']);
  assert.equal(S.groups.find((g) => g.k === 'cleanCredit').label, 'Missed payments or CCJs');
  assert.ok(P.missedEmailOn(b) && !P.missedEmailOn({ ...b, filters: { missed: 'off' } }) && !P.missedEmailOn({ ...b, mode: 'manual' }));
  assert.equal(P.missedEmail(b, [L[2]]), null, 'no email when nothing was missed');
  const sent0 = mails.length, many = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, amount: 50000, purpose: `P${i}`, trading: '1 to 2 years', credit: 'No', price: [40, 90, 30, 120, 60, 20, 75, 50][i], created_at: new Date().toISOString(), buyer: i % 2 ? 'other' : null }));
  await P.missedEmail({ ...b, email: 'b@x.test', company: 'B Ltd' }, many);
  const html = mails.at(-1).html, pos = (p) => html.indexOf(`>P${p}<`);
  assert.ok(mails.length > sent0, 'no email sent');
  assert.ok(pos(3) > 0 && pos(3) < pos(1) && pos(1) < pos(6) && pos(6) < pos(4) && pos(4) < pos(7), 'not ranked by price');
  assert.ok(pos(5) < 0, 'showed more than the top 5');
  assert.ok(!/credits/.test(html.split('The best of them')[1].split('And 3 more')[0]), 'showed a price');
});

console.log('\nBlog publishing API');
const { default: blogApi } = await import('../api/blog.js');
const B = await import('../api/_lib/blog.js');
const callBlog = (body, key) => new Promise((done) => {
  const res = { c: 200, setHeader() { return this; }, status(c) { this.c = c; return this; }, json(b) { done({ c: this.c, b }); } };
  blogApi({ method: 'POST', body, headers: { authorization: key ? `Bearer ${key}` : '' } }, res);
});
const words = (n) => Array.from({ length: n }, (_, i) => ['cash', 'flow', 'planning', 'helps', 'owners', 'see', 'pressure', 'early'][i % 8]).join(' ') + '.';
const goodPost = { title: 'How to plan for a quiet trading month', description: 'Simple steps UK owners can take to plan for a quiet trading month without a cash squeeze.',
  summary: 'Simple steps to plan for a quiet month before it arrives.', category: 'Cash flow', related_loans: ['invoice-finance'],
  body: [{ type: 'p', text: words(150) + ' Read [our guides](/guides) and **plan ahead**.' }, { type: 'h2', text: 'Know the dates' }, { type: 'p', text: words(150) }, { type: 'h2', text: 'Keep a buffer' }, { type: 'ul', items: ['Set money aside', 'Chase invoices'] }, { type: 'p', text: words(150) }] };
await t('blog: buildPost escapes HTML, keeps bold and safe links, enforces the rules', async () => {
  const r = B.buildPost({ ...goodPost, title: 'Planning <script>alert(1)</script> ahead well', body: [{ type: 'p', text: words(150) + ' <img src=x onerror=alert(1)> [bad](javascript:alert(1))' }, ...goodPost.body.slice(1)] });
  assert.ok(r.post, r.error);
  const html = JSON.stringify(r.post);
  assert.ok(!/<script|<img/.test(html), 'raw tags escaped'); assert.ok(!/href=\\"javascript/.test(html), 'javascript: link not made');
  assert.ok(B.buildPost(goodPost).post.body[0][1].includes('<a href="/guides">our guides</a> and <strong>plan ahead</strong>'), 'bold and internal link kept');
  assert.match(B.buildPost({ ...goodPost, body: goodPost.body.slice(0, 4) }).error, /400–2500 words/);
  assert.match(B.buildPost({ ...goodPost, related_loans: ['payday'] }).error, /related_loans/);
  assert.match(B.buildPost({ ...goodPost, body: [goodPost.body[1], ...goodPost.body] }).error, /introduction paragraph/);
});
await t('blog: no key or a wrong key is refused; a created key publishes to GitHub; duplicates need replace', async () => {
  assert.equal((await callBlog(goodPost)).c, 401);
  assert.equal((await callBlog(goodPost, 'llb_' + 'x'.repeat(32))).c, 401);
  const key = await B.createKey('Weekly run');
  assert.ok(!JSON.stringify(blogKeys).includes(key), 'only the hash is stored');
  const r = await callBlog(goodPost, key);
  assert.equal(r.c, 201, JSON.stringify(r.b)); assert.equal(r.b.url, 'https://leaflegal.co/blog/how-to-plan-for-a-quiet-trading-month');
  assert.equal(ghPuts.at(-1).path, 'tools/blog_posts/how-to-plan-for-a-quiet-trading-month.json'); assert.equal(ghPuts.at(-1).body.branch, 'main');
  assert.equal(blogKeys.keys[0].posts, 1, 'usage recorded');
  assert.equal((await callBlog(goodPost, key)).c, 409, 'same slug refused');
  assert.equal((await callBlog({ ...goodPost, replace: true }, key)).c, 200, 'replace allowed');
  assert.equal((await callBlog({ ...goodPost, slug: 'planning-for-a-vat-bill', replace: true }, key)).c, 409, 'hand-written post protected');
  await B.revokeKey(blogKeys.keys[0].id);
  assert.equal((await callBlog(goodPost, key)).c, 401, 'revoked key refused');
});
await t('blog: admin sees keys without hashes and can unpublish; brokers cannot', async () => {
  await B.createKey('Admin view');
  const r = await api('admin-blog', { token: tok.admin });
  assert.equal(r.c, 200, JSON.stringify(r.b)); assert.ok(r.b.keys.length && !('hash' in r.b.keys[0]), 'no hashes'); assert.equal(r.b.posts[0].slug, 'how-to-plan-for-a-quiet-trading-month');
  assert.equal((await api('admin-blog', { token: tok.broker })).c, 403);
  assert.equal((await api('admin-blog-unpublish', { method: 'POST', token: tok.admin, body: { slug: 'how-to-plan-for-a-quiet-trading-month' } })).c, 200);
  assert.ok(!ghFiles['tools/blog_posts/how-to-plan-for-a-quiet-trading-month.json'], 'file deleted');
});

await t('billing: first month offer can move to the full plan today; a normal plan cannot "upgrade" to itself', async () => {
  const sub = (trial) => ({ id: 'sub_1', status: 'active', start_date: 1000, current_period_start: 1000, metadata: trial ? { trial: '1', pack: 'Starter', credits: '2500' } : { pack: 'Starter', credits: '2500' },
    items: { data: [{ id: 'si_1', current_period_start: 1000, price: { unit_amount: 250000, product: 'prod_1' } }] } });
  const was = people[BROKER].stripe_customer; people[BROKER].stripe_customer = 'cus_1';
  try {
    stripeSubs = [sub(true)]; stripeCalls = [];
    const r = await api('change-plan', { method: 'POST', token: tok.broker, body: { pack: 'starter' } });
    assert.equal(r.c, 200, JSON.stringify(r.b));
    const up = decodeURIComponent(stripeCalls.find((c) => c.u.includes('subscriptions/sub_1')).body);
    assert.ok(up.includes('billing_cycle_anchor=now') && up.includes('metadata[trial]=&'), 'charged today and offer cleared');
    stripeSubs = [sub(false)];
    assert.equal((await api('change-plan', { method: 'POST', token: tok.broker, body: { pack: 'starter' } })).c, 400);
  } finally { stripeSubs = []; people[BROKER].stripe_customer = was; }
});

await t('partner WhatsApp falls back to SMS when the template can\'t send (pending, error)', async () => {
  const real = globalThis.fetch, sent = [], env = { ...process.env };
  Object.assign(process.env, { BIRD_API_KEY_WHATSAPPSMS: 'bk_eu1_test', BIRD_WA_FROM: '+447000000000', BIRD_SMS_FROM: 'Leaflegal' });
  globalThis.fetch = async (u, o) => { const url = String(u); if (!url.includes('platform.bird.com')) return real(u, o); sent.push(url);
    return new Response(url.includes('/whatsapp/') ? '{"error":{"code":"E15002"}}' : '{"id":"sms_1"}', { status: url.includes('/whatsapp/') ? 422 : 200 }); };
  try {
    assert.equal(await P.waOrSms('07700 900150', 'leaflegal_partner_welcome', {}, 'Hi', 'r1'), 'sms');
    assert.ok(sent[0].includes('/whatsapp/') && sent[1].includes('/sms/'), 'WhatsApp tried first, then SMS');
  } finally { globalThis.fetch = real; for (const k of ['BIRD_API_KEY_WHATSAPPSMS', 'BIRD_WA_FROM', 'BIRD_SMS_FROM']) { if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k]; } }
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
