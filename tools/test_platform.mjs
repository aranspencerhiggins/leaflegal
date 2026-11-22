// Checks the lead pricing, auto-buy matching, regulator rules and CRM helpers. Run: node tools/test_platform.mjs
import assert from 'node:assert/strict';
import { price, priceParts, matches, misses, fits, canTake, PRICE_EXAMPLES, DEFAULT_PRICING, mergePricing } from '../api/_lib/platform.js';
import { allowedAreas, AREA_SLUGS } from '../api/_lib/taxonomy.js';

// Pricing: area or matter base x grade x urgency x business x value, rounded to 5 and clamped to min..max.
{
  const L = (o) => ({ area: 'family-law', matter: 'divorce', grade: 'B', urgency: 'Within a month', audience: 'individual', ...o });
  assert.equal(price(L()), 55, 'family law base price');
  assert.equal(price(L({ area: 'immigration', matter: 'sponsor-licences' })), 120, 'matter override beats the area price');
  assert.equal(price(L({ area: 'nowhere', matter: null })), 50, 'unknown area uses the base price');
  assert.ok(price(L({ grade: 'A' })) > price(L()) && price(L({ grade: 'C' })) < price(L()), 'grade A costs more, grade C less');
  assert.ok(price(L({ urgency: 'Urgently' })) > price(L()), 'urgent costs more');
  assert.ok(price(L({ audience: 'business' })) > price(L()), 'business clients cost more');
  assert.ok(price(L({ value_min: 1000000 })) > price(L({ value_min: 500000 })) && price(L({ value_min: 500000 })) > price(L({ value_min: 100000 })), 'higher value, higher price');
  assert.equal(price(L({ value_min: 100000 })), price(L()), 'value under the first threshold changes nothing');
  assert.equal(price(L({ area: 'immigration', matter: 'sponsor-licences', grade: 'A', urgency: 'Urgently', audience: 'business', value_min: 2e6 })), 275, 'everything at the top');
  assert.equal(price(L({ area: 'immigration', matter: 'sponsor-licences', grade: 'A', urgency: 'Urgently' }), { ...DEFAULT_PRICING, max: 100 }), 100, 'clamped to max');
  assert.equal(price(L({ area: 'conveyancing', matter: 'x', grade: 'C' }), { ...DEFAULT_PRICING, min: 40 }), 40, 'clamped to min');
  for (const e of PRICE_EXAMPLES) { const p = price(e); assert.ok(p % 5 === 0 && p >= DEFAULT_PRICING.min && p <= DEFAULT_PRICING.max, `example ${e.area}/${e.matter} = ${p}`); }
  const parts = priceParts(L({ grade: 'A', urgency: 'Urgently', audience: 'business', value_min: 600000 }));
  assert.deepEqual(parts, { base: 55, grade: 1.3, urgent: 1.15, business: 1.1, value: 1.25 });
  console.log('examples', PRICE_EXAMPLES.map((e) => `${e.area}/${e.matter}=£${price(e)}`).join(' | '));
  // Saved pricing merges over the defaults; saved matter overrides replace the default list.
  const P = mergePricing({ areas: { 'family-law': 80 }, matters: {}, grade: { A: 2 } });
  assert.equal(P.areas.conveyancing, DEFAULT_PRICING.areas.conveyancing);
  assert.equal(price(L(), P), 80); assert.equal(price(L({ area: 'immigration', matter: 'sponsor-licences' }), P), 60, 'matter override removed');
  assert.equal(mergePricing(null), DEFAULT_PRICING);
  console.log('pricing ok');
}

// Criteria: practice areas are opt-in; matters, regions, urgency, grade, value and tags narrow it down.
{
  const l = { area: 'family-law', matter: 'divorce', region: 'London', postcode_area: 'N', audience: 'individual', urgency: 'Urgently', grade: 'A', private_pay: 'yes', value_min: 300000, value_max: 500000, tags: ['children'] };
  assert.ok(!matches({}, l), 'no practice areas chosen = nothing');
  const f = { areas: ['family-law'] };
  assert.ok(matches(f, l));
  assert.ok(matches({ ...f, matters: { 'family-law': ['divorce'] } }, l) && !matches({ ...f, matters: { 'family-law': ['child-arrangements'] } }, l));
  assert.ok(!matches({ ...f, regions: ['Wales'] }, l) && matches({ ...f, regions: ['London'] }, l));
  assert.ok(!matches({ ...f, postcodeAreas: ['E'] }, l) && matches({ ...f, postcodeAreas: ['N'] }, l));
  assert.ok(!matches({ ...f, audiences: ['business'] }, l));
  assert.ok(!matches({ ...f, urgencies: ['Within a month'] }, l));
  assert.ok(!matches({ ...f, grades: ['B', 'C'] }, l) && matches({ ...f, grades: ['A'] }, l));
  assert.ok(!matches({ ...f, privatePayOnly: true }, { ...l, private_pay: 'quote' }) && matches({ ...f, privatePayOnly: true }, l));
  assert.ok(!matches({ ...f, valueMin: 600000 }, l) && !matches({ ...f, valueMax: 200000 }, l) && matches({ ...f, valueMin: 400000, valueMax: 400000 }, l));
  assert.ok(matches({ ...f, valueMin: 600000 }, { ...l, value_min: null, value_max: null }), 'no value given is not held back by value limits');
  assert.ok(matches({ ...f, tagsAny: ['children'] }, l) && !matches({ ...f, tagsNone: ['children'] }, l) && !matches({ ...f, tagsAny: ['urgent-hearing'] }, l));
  assert.ok(misses({ areas: ['immigration'] }, l)[0].includes('Family law'), 'misses explain in words');
  // Immigration from abroad: no postcode, region "Outside the UK".
  const abroad = { area: 'immigration', matter: 'visitor-visas', region: 'Outside the UK', postcode_area: null, country: 'outside', audience: 'individual' };
  assert.ok(matches({ areas: ['immigration'] }, abroad));
  assert.ok(matches({ areas: ['immigration'], regions: ['Outside the UK'] }, abroad) && !matches({ areas: ['immigration'], regions: ['London'] }, abroad));
  assert.ok(!matches({ areas: ['immigration'], postcodeAreas: ['N'] }, abroad), 'postcode filter skips leads with no postcode');
  console.log('criteria ok');
}

// Regulators: immigration only for SRA, CILEx or IAA firms. CLC firms only get conveyancing and lease extensions.
{
  assert.deepEqual(allowedAreas(['IAA']), ['immigration']);
  assert.ok(!allowedAreas(['CLC']).includes('immigration') && allowedAreas(['CLC']).includes('conveyancing'));
  assert.deepEqual([...allowedAreas(['SRA'])].sort(), [...AREA_SLUGS].sort());
  const imm = { area: 'immigration', matter: 'spouse-visas' };
  const clc = { regulators: [{ id: 'CLC', number: '1234' }], filters: { areas: AREA_SLUGS } };
  const sra = { regulators: [{ id: 'SRA', number: '612345' }], filters: { areas: ['immigration'] } };
  const iaa = { regulators: [{ id: 'IAA', number: 'F201900123' }], filters: { areas: ['immigration'] } };
  assert.ok(!canTake(clc, imm) && !fits(clc, imm), 'CLC firm never gets immigration, even if it ticks it');
  assert.ok(fits(sra, imm) && fits(iaa, imm));
  assert.ok(!canTake({ regulators: [] }, imm), 'no regulator = nothing');
  assert.ok(!fits(iaa, { area: 'family-law', matter: 'divorce' }));
  console.log('regulator rules ok');
}

// Dead mailbox / non-existent number: no "it's right" override.
{ const { problem } = await import('../api/_lib/verify.js');
  const e = problem(null, { result: 'undeliverable', reason: 'invalid_recipient' }, { emailConfirmed: true });
  const p = problem({ allocated: false }, null, { phoneConfirmed: true });
  assert.ok(e && !e.confirm && p && !p.confirm, 'failed checks block even when confirmed');
  assert.ok(problem({ allocated: true, reachable: false }, null, { phoneConfirmed: true }) === null, 'switched-off phone can still be confirmed');
  console.log('verify ok'); }

// Unsold leads drop to half price after 72 hours, unless priced by hand.
{
  const P = await import('../api/_lib/platform.js'), old = new Date(Date.now() - 100 * 36e5).toISOString(), fresh = new Date().toISOString();
  assert.deepEqual(P.salePrice({ price: 125, created_at: old }), { price: 63, list_price: 125, discounted: true });
  assert.equal(P.salePrice({ price: 125, created_at: fresh }).discounted, false);
  assert.equal(P.salePrice({ price: 125, created_at: old, buyer: 'x' }).price, 125, 'sold leads keep their price');
  assert.deepEqual(P.salePrice({ price: 60, list_price: 120, price_fixed: true, created_at: old }), { price: 60, list_price: 120, discounted: true }, 'hand price shows the old one struck through');
  assert.equal(P.withMask({ price: 125, created_at: old, price_fixed: true }).discount_at, null);
  // Masked lead: no name, email, phone, postcode or summary before purchase.
  const m = P.withMask({ id: 1, price: 60, created_at: fresh, full_name: 'Sam Taylor', email: 's@x.co', phone: '+447700900123', postcode: 'N1 7GU', summary: 'secret', area: 'family-law', matter: 'divorce', consent: {}, source: {}, flags: [] });
  for (const k of ['full_name', 'email', 'phone', 'postcode', 'summary', 'consent', 'source', 'flags']) assert.ok(!(k in m), `${k} hidden before purchase`);
  assert.equal(m.has_summary, true); assert.equal(m.area, 'family-law');
  console.log('discount and masking ok');
}

// Ad cost per lead: its campaign's spend that week ÷ that campaign's leads; no campaign → the week's average.
{
  const { leadAdCosts } = await import('../api/_lib/platform.js');
  const rows = [{ date: '2026-11-03', campaign: 'A', spend: 300 }, { date: '2026-11-05', campaign: 'A', spend: 300 }, { date: '2026-11-04', campaign: 'B', spend: 100 }, { date: '2026-11-10', campaign: 'A', spend: 50 }];
  const leads = [{ id: 1, created_at: '2026-11-04T10:00:00Z', campaign: 'A' }, { id: 2, created_at: '2026-11-08T22:00:00Z', campaign: 'A' }, { id: 3, created_at: '2026-11-06T09:00:00Z', campaign: 'B' },
    { id: 4, created_at: '2026-11-05T09:00:00Z', campaign: null }, { id: 5, created_at: '2026-11-06T09:00:00Z', campaign: 'Z' }, { id: 6, created_at: '2026-11-11T09:00:00Z', campaign: 'A' }, { id: 7, created_at: '2026-11-20T09:00:00Z' }];
  const c = leadAdCosts(leads, rows);
  assert.deepEqual(c[1], { cost: 300, by: 'campaign' }, 'A week 1: £600 ÷ 2 leads');
  assert.equal(c[2].cost, 300, 'Sunday is the same week');
  assert.deepEqual(c[3], { cost: 100, by: 'campaign' });
  assert.deepEqual(c[4], { cost: 140, by: 'week' }, 'no campaign: £700 ÷ 5 leads that week');
  assert.equal(c[5].by, 'week', 'unknown campaign falls back');
  assert.equal(c[6].cost, 50, 'next week separate');
  assert.deepEqual(c[7], { cost: 0, by: 'none' }, 'no spend that week');
  console.log('lead ad cost ok');
}

// HubSpot: embed code / editor link parsing and the fields sent.
{
  const { parseHubspot, hubspotFields } = await import('../api/_lib/platform.js');
  assert.deepEqual(parseHubspot('hbspt.forms.create({ region: "eu1", portalId: "1234567", formId: "ABCDEF12-1234-1234-1234-1234567890AB" })'), { portal: '1234567', form: 'abcdef12-1234-1234-1234-1234567890ab', region: 'eu1' });
  assert.deepEqual(parseHubspot('https://app.hubspot.com/forms/9876543/editor/abcdef12-1234-1234-1234-1234567890ab/edit/form'), { portal: '9876543', form: 'abcdef12-1234-1234-1234-1234567890ab' });
  assert.deepEqual(parseHubspot('<script src="https://js-eu1.hsforms.net/forms/embed/1234567.js" defer></script><div class="hs-form-frame" data-region="eu1" data-form-id="abcdef12-1234-1234-1234-1234567890ab" data-portal-id="1234567"></div>'), { portal: '1234567', form: 'abcdef12-1234-1234-1234-1234567890ab', region: 'eu1' });
  assert.equal(parseHubspot('hello'), null);
  const f = Object.fromEntries(hubspotFields({ id: 5, contact_name: 'Sam de Souza', email: 's@x.co', phone: '+447700900123', business_name: 'Acme Ltd', postcode: 'N1 7GU', practice_area_label: 'Family law', matter_label: 'Divorce', value_band: '£500,000', answers: [{ q: 'Are there children?', a: 'Yes' }] }).map((x) => [x.name, x.value]));
  assert.equal(f.firstname, 'Sam'); assert.equal(f.lastname, 'de Souza'); assert.equal(f.company, 'Acme Ltd'); assert.equal(f.zip, 'N1 7GU');
  assert.ok(f.message.includes('Matter: Divorce') && f.message.includes('Practice area: Family law') && f.message.includes('£500,000') && f.message.includes('Are there children?'));
  console.log('hubspot ok');
}
// Pipedrive: token parsing and the org → person → deal → note calls.
{
  const { parsePipedrive, postPipedrive } = await import('../api/_lib/platform.js');
  assert.deepEqual(parsePipedrive(' ' + 'A1'.repeat(20) + ' '), { token: 'a1'.repeat(20) });
  assert.equal(parsePipedrive('short'), null);
  const calls = [], real = globalThis.fetch;
  globalThis.fetch = async (url, o) => { calls.push([new URL(url).pathname, JSON.parse(o.body)]); return { ok: true, status: 201, json: async () => ({ success: true, data: { id: calls.length } }) }; };
  const r = await postPipedrive({ token: 'a1'.repeat(20) }, { id: 9, business_name: 'Acme <Ltd>', contact_name: 'Sam Sample', email: 's@x.co', phone: '+447700900123', matter_label: 'Unpaid invoices', practice_area_label: 'Recovering a business debt', value_band: '£40,000' });
  assert.equal(r, 'ok');
  assert.deepEqual(calls.map((c) => c[0]), ['/v1/organizations', '/v1/persons', '/v1/deals', '/v1/notes']);
  assert.equal(calls[1][1].org_id, 1); assert.equal(calls[2][1].person_id, 2); assert.equal(calls[2][1].value, 0); assert.equal(calls[3][1].deal_id, 3);
  assert.equal(calls[2][1].title, 'Acme <Ltd>, Unpaid invoices');
  assert.ok(calls[3][1].content.includes('Acme &lt;Ltd&gt;') && calls[3][1].content.includes('£40,000'), 'note escaped and complete');
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ success: false, error: 'unauthorized' }) });
  assert.equal(await postPipedrive({ token: 'x' }, { contact_name: 'A', matter_label: 'B' }), 'the API token was not accepted');
  globalThis.fetch = real;
  console.log('pipedrive ok');
}
{
  const { signWebhook } = await import('../api/_lib/platform.js');
  const { createHmac } = await import('node:crypto');
  const body = '{"event":"lead.test"}', h = signWebhook('whsec_test_secret_123', body, 1700000000);
  assert.equal(h['X-Leaflegal-Timestamp'], '1700000000');
  assert.equal(h['X-Leaflegal-Signature'], `t=1700000000,v1=${createHmac('sha256', 'whsec_test_secret_123').update(`1700000000.${body}`).digest('hex')}`);
  console.log('webhook signature ok');
}
// Meta click ID is rebuilt from the URL/referrer when the browser lost it (so Ads Manager can attribute the lead).
{
  const { fbcOf } = await import('../api/enquiry.js');
  assert.equal(fbcOf({ fbc: 'fb.1.1.KEEP' }), 'fb.1.1.KEEP', 'browser click ID kept');
  assert.match(fbcOf({ utm: { fbclid: 'Iw_A-1' } }), /^fb\.1\.\d+\.Iw_A-1$/, 'from URL params');
  assert.match(fbcOf({ referrer: 'https://leaflegal.co/apply?fbclid=PAZ_9&utm_source=ig' }), /\.PAZ_9$/, 'from referrer');
  assert.equal(fbcOf({ page: 'https://leaflegal.co/apply', referrer: 'https://google.com' }), '', 'none when not from an ad');
  console.log('meta click id fallback ok');
}
{ // Invitees at a firm that's already joined get no more lead alerts.
  const { notJoined } = await import('../api/_lib/platform.js');
  const real = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify([{ email: 'Rob.Smith@smithlaw.co.uk' }, { email: 'jo@gmail.com' }]), { status: 200, headers: { 'content-type': 'application/json' } });
  const left = (await notJoined([{ email: 'peter.nolan@smithlaw.co.uk' }, { email: 'sam@gmail.com' }, { email: 'jo@gmail.com' }, { email: 'a@other.co.uk' }])).map((v) => v.email);
  globalThis.fetch = real;
  assert.deepEqual(left, ['sam@gmail.com', 'a@other.co.uk'], `colleague/own-email invitees should be dropped (got ${left})`);
  console.log('joined firms get no invite alerts ok');
}
// Defaults point at Leaflegal, never the old project or the old platform domain.
{
  const P = await import('../api/_lib/platform.js');
  if (!process.env.SUPABASE_URL) assert.equal(P.SUPABASE_URL, 'https://qrdpvsqsfifmgkxinank.supabase.co');
  if (!process.env.PLATFORM_URL && !process.env.SITE_URL) assert.equal(P.PLATFORM_URL, 'https://platform.leaflegal.co');
  assert.ok(!/tefplj/.test(`${P.SUPABASE_URL} ${P.PLATFORM_URL} ${P.API_URL}`));
  const { termsHtml, TERMS_VERSION } = await import('../api/_lib/terms.js');
  assert.equal(TERMS_VERSION, '2026-11-22');
  const t = termsHtml();
  for (const w of ['not a law firm', 'section 56', 'Immigration Advice Authority', 'referral fee', 'Legal Ombudsman', 'special category']) assert.ok(t.includes(w), `agreement mentions ${w}`);
  assert.ok(!/\b(loan|lender|broker|funded)\b/i.test(t), 'no finance words in the agreement');
  console.log('defaults and agreement ok');
}
console.log('platform ok');
