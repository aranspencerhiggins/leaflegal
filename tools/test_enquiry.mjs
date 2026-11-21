// Checks /api/enquiry with fetch and DNS stubbed: valid enquiries email the team, out-of-scope ones are refused,
// and nothing about the matter ever reaches Meta.  Run: node tools/test_enquiry.mjs
import assert from 'node:assert/strict';
process.env.RESEND_API_KEY = 'test'; process.env.META_CAPI_TOKEN = 'tok'; process.env.META_PIXEL_ID = '123';
const sent = [];
globalThis.fetch = async (url, opt = {}) => { sent.push({ url: String(url), body: opt.body ? JSON.parse(opt.body) : null }); return { ok: true, status: 200, text: async () => '{}', json: async () => ({}) }; };
const dns = (await import('node:dns')).promises; dns.resolveMx = async () => [{ exchange: 'mx.example.com', priority: 10 }];
const { default: enquiry, metaLeadBody } = await import('../api/enquiry.js');

const base = {
  area: 'Family law', matter: 'Divorce or dissolution', audience: 'individual', urgency: 'Within a month', postcode: 'SW1A 1AA',
  privatePay: 'Yes', summary: 'Separated last year', fullName: 'Jane Smith', firstName: 'Jane', lastName: 'Smith',
  email: 'jane@example.com', phone: '+447700900123', consentTerms: true, consentShare: true, consentVersion: 'x', consentAt: 'now', consentText: 'x',
  marketing: true, eventId: 'e1', _ms: 60000, page: 'https://leaflegal.co/apply?area=Family%20law', utm: {}, turnstile: '',
};
const run = async (over) => {
  sent.length = 0; let code = 200, out;
  const res = { status(c) { code = c; return this; }, json(o) { out = o; return this; } };
  await enquiry({ method: 'POST', body: { ...base, ...over }, headers: { 'x-forwarded-for': '1.2.3.4', 'user-agent': 'test' } }, res);
  return { code, out };
};

let r = await run({});
assert.equal(r.code, 200, JSON.stringify(r.out));
const resend = sent.filter((s) => s.url.includes('resend'));
assert.equal(resend.length, 2, 'team email and confirmation');
assert.match(resend[0].body.subject, /Family law/);
assert.doesNotMatch(JSON.stringify(resend[1].body), /Family|Divorce|Separated/, 'confirmation must not carry matter details');
const meta = sent.find((s) => s.url.includes('graph.facebook.com'));
assert.ok(meta, 'meta lead sent with marketing consent');
assert.doesNotMatch(JSON.stringify(meta.body), /Family|Divorce|Separated|area=/, 'no matter details to Meta');

r = await run({ marketing: false });
assert.equal(r.code, 200); assert.ok(!sent.some((s) => s.url.includes('graph.facebook.com')), 'no Meta without consent');

for (const [name, over] of [
  ['consent box unticked', { consentShare: false }],
  ['Scottish postcode for family law', { postcode: 'EH1 1AA' }],
  ['legal aid only', { privatePay: 'No, I’m looking for legal aid' }],
  ['consumer debt', { area: 'Recovering a business debt', matter: 'Unpaid invoices', audience: 'business', debtor: 'A private individual' }],
  ['unknown area', { area: 'Personal injury' }],
]) { r = await run(over); assert.equal(r.code, 400, name); assert.equal(sent.filter((s) => s.url.includes('resend')).length, 0, name); }

r = await run({ area: 'Immigration', matter: 'A visa application', postcode: 'EH1 1AA' });
assert.equal(r.code, 200, 'immigration is UK-wide');
r = await run({ area: 'Recovering a business debt', matter: 'Unpaid invoices', audience: 'business', debtor: 'Another business', privatePay: '', business: 'Acme Ltd' });
assert.equal(r.code, 200, 'B2B debt ok');
assert.equal(metaLeadBody({ ...base, page: 'https://x/apply?area=Family' }, { headers: {} }).data[0].event_source_url, 'https://x/apply');
console.log('enquiry tests passed');
