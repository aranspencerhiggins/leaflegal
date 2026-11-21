// Checks the lead pricing algorithm and auto-buy filter matching. Run: node tools/test_platform.mjs
import assert from 'node:assert/strict';
import { price, matches, PRICE_EXAMPLES, DEFAULT_PRICING, TURNOVERS, TRADING } from '../api/_lib/platform.js';
const L = (amount, turnover, trading, credit = 'No') => ({ amount, turnover, trading, credit });
const unrealistic = price(L(5000000, '£100k to £250k', '6 to 12 months'));
const strong = price(L(1000000, '£1m to £5m', '2 to 5 years'));
assert.equal(unrealistic, DEFAULT_PRICING.floor100k, 'young £100k+ firm asking for £5m is worth the £100k-revenue floor');
assert.ok(strong >= 265 && strong <= 285, `4-year-old £1m–£5m firm asking £1m ≈ £275 (got ${strong})`);
assert.equal(price({ amount: 5e6, turnover: "£5m+", trading: "5+ years", credit: "No" }), DEFAULT_PRICING.max, "everything at the top = max price");
assert.ok(price(L(10000000, '£5m+', '5+ years')) <= 300 && price(L(5000, 'Under £50k', 'Under 6 months')) >= 20, 'clamped to £20–£300');
assert.ok(price(L(100000, '£1m to £5m', '5+ years')) > price(L(100000, '£100k to £250k', '5+ years')), 'more revenue, more value');
assert.ok(price(L(100000, '£500k to £1m', '5+ years')) > price(L(100000, '£500k to £1m', '6 to 12 months')), 'older, more value');
assert.ok(price(L(500000, '£1m to £5m', '5+ years')) > price(L(50000, '£1m to £5m', '5+ years')), 'bigger sensible loan, more value');
assert.ok(price(L(100000, '£500k to £1m', '5+ years', 'Yes')) < price(L(100000, '£500k to £1m', '5+ years')), 'adverse credit costs less');
console.log('examples', PRICE_EXAMPLES.map((e) => `${e.amount}/${e.turnover}/${e.trading}=£${price(e)}`).join(' | '));
const big = L(100000, '£1m to £5m', '5+ years'), small = { ...big, turnover: '£50k to £100k' };
assert.ok(matches({}, big), 'no filters = everything');
assert.ok(matches({ turnovers: ['£50k to £100k', '£100k to £250k'] }, small) && !matches({ turnovers: ['£50k to £100k'] }, big));
assert.ok(!matches({ amountMin: 150000 }, big) && matches({ amountMax: 100000 }, big));
assert.ok(matches({ cleanCredit: true }, { ...big, credit: 'Not sure' }) && !matches({ cleanCredit: true }, { ...big, credit: 'Yes' }), 'Not sure counts as clean credit');
console.log('platform ok');
// Dead mailbox / non-existent number: no "it's right" override.
{ const { problem } = await import('../api/_lib/verify.js');
  const e = problem(null, { result: 'undeliverable', reason: 'invalid_recipient' }, { emailConfirmed: true });
  const p = problem({ allocated: false }, null, { phoneConfirmed: true });
  assert.ok(e && !e.confirm && p && !p.confirm, 'failed checks block even when confirmed');
  assert.ok(problem({ allocated: true, reachable: false }, null, { phoneConfirmed: true }) === null, 'switched-off phone can still be confirmed');
  console.log('verify ok'); }

// The public cost per lead calculator mirrors price(): check they agree across every band.
{
  const vm = await import('node:vm'), fs = await import('node:fs');
  vm.runInThisContext(fs.readFileSync(new URL('../public/assets/cpl-calculator.js', import.meta.url), 'utf8'));
  for (const amount of [5e3, 3e4, 1e5, 5e5, 2e6]) for (const turnover of TURNOVERS) for (const trading of TRADING) for (const credit of ['No', 'Not sure', 'Yes'])
    assert.equal(globalThis.leadPrice({ amount, turnover, trading, credit }), price({ amount, turnover, trading, credit }), `calculator mismatch ${amount}/${turnover}/${trading}/${credit}`);
  console.log('calculator matches platform pricing');
}

// £100k+ revenue leads never cost less than £40; smaller businesses can still go to the £20 minimum.
assert.equal(price({ amount: 20000, turnover: '£100k to £250k', trading: '6 to 12 months', credit: 'No' }), 40, '£100k+ revenue floor');
assert.equal(price({ amount: 15000, turnover: '£50k to £100k', trading: '1 to 2 years', credit: 'No' }), 25, 'under £100k keeps formula price');
console.log('£100k revenue floor ok');

// Leads from businesses with £250k+ revenue never get the 72-hour discount; smaller ones still do.
{
  const P = await import('../api/_lib/platform.js'), old = new Date(Date.now() - 100 * 36e5).toISOString();
  assert.equal(P.salePrice({ price: 125, created_at: old, turnover: '£250k to £500k' }).discounted, false, '£250k+ not discounted');
  assert.equal(P.salePrice({ price: 125, created_at: old, turnover: '£5m+' }).price, 125);
  assert.equal(P.salePrice({ price: 125, created_at: old, turnover: '£100k to £250k' }).price, 63, 'under £250k still half price');
  assert.equal(P.withMask({ price: 125, created_at: old, turnover: '£1m to £5m' }).discount_at, null);
  console.log('no discount for £250k+ revenue ok');
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

// Homeowner / tenant criteria: separate tenant rules, unanswered leads use the main ones.
{
  const { matches, misses } = await import('../api/_lib/platform.js');
  const f = { turnovers: ['£50k to £100k', '£100k to £250k'], property: [], tenant: { turnovers: ['£100k to £250k'] } };
  const lead = (property, turnover) => ({ amount: 50000, turnover, property, credit: 'No' });
  if (!matches(f, lead('Homeowner', '£50k to £100k'))) throw new Error('homeowner 50-100k should match');
  if (matches(f, lead('Tenant', '£50k to £100k'))) throw new Error('tenant 50-100k should not match');
  if (!matches(f, lead('Tenant', '£100k to £250k'))) throw new Error('tenant 100-250k should match');
  if (!matches(f, lead(null, '£50k to £100k'))) throw new Error('unanswered uses main criteria');
  if (!misses({ property: ['Homeowner'] }, lead('Tenant', '£50k to £100k'))[0]?.includes('Tenants')) throw new Error('tenants excluded');
  console.log('homeowner/tenant criteria ok');
}

// HubSpot: embed code / editor link parsing and the fields sent.
{
  const { parseHubspot, hubspotFields } = await import('../api/_lib/platform.js');
  assert.deepEqual(parseHubspot('hbspt.forms.create({ region: "eu1", portalId: "1234567", formId: "ABCDEF12-1234-1234-1234-1234567890AB" })'), { portal: '1234567', form: 'abcdef12-1234-1234-1234-1234567890ab', region: 'eu1' });
  assert.deepEqual(parseHubspot('https://app.hubspot.com/forms/9876543/editor/abcdef12-1234-1234-1234-1234567890ab/edit/form'), { portal: '9876543', form: 'abcdef12-1234-1234-1234-1234567890ab' });
  assert.equal(parseHubspot('hello'), null);
  const f = Object.fromEntries(hubspotFields({ id: 5, contact_name: 'Sam de Souza', email: 's@x.co', phone: '+447700900123', business: 'Acme Ltd', amount: 100000, property: 'Tenant' }).map((x) => [x.name, x.value]));
  assert.equal(f.firstname, 'Sam'); assert.equal(f.lastname, 'de Souza'); assert.equal(f.company, 'Acme Ltd');
  assert.ok(f.message.includes('Homeowner or tenant: Tenant') && f.message.includes('£100,000'));
  console.log('hubspot ok');
}
// Pipedrive: token parsing and the org → person → deal → note calls.
{
  const { parsePipedrive, postPipedrive } = await import('../api/_lib/platform.js');
  assert.deepEqual(parsePipedrive(' ' + 'A1'.repeat(20) + ' '), { token: 'a1'.repeat(20) });
  assert.equal(parsePipedrive('short'), null);
  const calls = [], real = globalThis.fetch;
  globalThis.fetch = async (url, o) => { calls.push([new URL(url).pathname, JSON.parse(o.body)]); return { ok: true, status: 201, json: async () => ({ success: true, data: { id: calls.length } }) }; };
  const r = await postPipedrive({ token: 'a1'.repeat(20) }, { id: 9, business: 'Acme <Ltd>', contact_name: 'Sam Sample', email: 's@x.co', phone: '+447700900123', amount: 100000, purpose: 'Cash flow' });
  assert.equal(r, 'ok');
  assert.deepEqual(calls.map((c) => c[0]), ['/v1/organizations', '/v1/persons', '/v1/deals', '/v1/notes']);
  assert.equal(calls[1][1].org_id, 1); assert.equal(calls[2][1].person_id, 2); assert.equal(calls[2][1].value, 100000); assert.equal(calls[3][1].deal_id, 3);
  assert.ok(calls[3][1].content.includes('Acme') === false && calls[3][1].content.includes('£100,000'));
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ success: false, error: 'unauthorized' }) });
  assert.equal(await postPipedrive({ token: 'x' }, { business: 'A', amount: 1 }), 'the API token was not accepted');
  globalThis.fetch = real;
  console.log('pipedrive ok');
}
{
  const { matches } = await import('../api/_lib/platform.js');
  assert.ok(!matches({ structures: ['Limited company'] }, { amount: 1, structure: 'Limited liability partnership (LLP)' }));
  assert.ok(matches({ structures: ['Limited company'] }, { amount: 1, structure: 'Limited company' }));
  console.log('business type ok');
}
{
  const { parseHubspot } = await import('../api/_lib/platform.js');
  assert.deepEqual(parseHubspot('<script src="https://js-eu1.hsforms.net/forms/embed/1234567.js" defer></script><div class="hs-form-frame" data-region="eu1" data-form-id="abcdef12-1234-1234-1234-1234567890ab" data-portal-id="1234567"></div>'), { portal: '1234567', form: 'abcdef12-1234-1234-1234-1234567890ab', region: 'eu1' });
  console.log('hubspot new embed ok');
}
{
  const { matches, tierMatches, misses } = await import('../api/_lib/platform.js');
  const f = { turnovers: ['£50k to £100k'], tiers: [
    { name: 'Higher tier', share: 75, turnovers: ['£500k to £1m', '£1m to £5m', '£5m+'], trading: ['2 to 5 years', '5+ years'], property: ['Homeowner'], cleanCredit: true },
    { name: 'Lower tier', share: 25, turnovers: ['£250k to £500k'], trading: ['1 to 2 years', '2 to 5 years', '5+ years'], property: ['Homeowner'], cleanCredit: true }] };
  const l = (turnover, trading, property, credit = 'No') => ({ amount: 100000, turnover, trading, property, credit });
  assert.deepEqual(tierMatches(f, l('£1m to £5m', '5+ years', 'Homeowner')), [0]);
  assert.deepEqual(tierMatches(f, l('£250k to £500k', '1 to 2 years', 'Homeowner')), [1]);
  assert.ok(!matches(f, l('£250k to £500k', '1 to 2 years', 'Tenant')));
  assert.ok(!matches(f, l('£50k to £100k', '5+ years', 'Homeowner')), 'tiers replace the main criteria');
  assert.ok(misses(f, l('£1m to £5m', '1 to 2 years', 'Homeowner'))[0].startsWith('Higher tier: '));
  assert.ok(matches({ turnovers: ['£50k to £100k'] }, l('£50k to £100k', '5+ years', null)), 'no tiers: unchanged');
  console.log('tiers ok');
}
{
  const { signWebhook } = await import('../api/_lib/platform.js');
  const { createHmac } = await import('node:crypto');
  const body = '{"event":"lead.test"}', h = signWebhook('whsec_test_secret_123', body, 1700000000);
  assert.equal(h['X-Loanleaf-Timestamp'], '1700000000');
  assert.equal(h['X-Loanleaf-Signature'], `t=1700000000,v1=${createHmac('sha256', 'whsec_test_secret_123').update(`1700000000.${body}`).digest('hex')}`);
  console.log('webhook signature ok');
}

// Lead tiers: the spec's test leads (Nov 2026 export). leadTier mirrors lead_tier() in tools/platform-schema-17.sql.
{ const { leadTier, matches: m, critOf, asPriced, tierPlanOf } = await import('../api/_lib/platform.js');
  const at = (d) => `${d}T10:00:00Z`;
  const cases = [ // turnover, declared trading, incorporated, property, enquiry date, tier
    ['£50k to £100k', '5+ years', null, null, '2026-11-05', 'Bronze'], ['£50k to £100k', 'Under 6 months', '2026-09-29', null, '2026-11-10', 'Bronze'],
    ['£100k to £250k', '5+ years', '2021-02-18', 'Homeowner', '2026-11-17', 'Silver'], ['£250k to £500k', '6 to 12 months', null, null, '2026-11-05', 'Silver'],
    ['£250k to £500k', '6 to 12 months', '2025-11-19', null, '2026-11-14', 'Silver'], ['£250k to £500k', '5+ years', '2018-05-22', null, '2026-11-08', 'Gold'],
    ['£500k to £1m', '1 to 2 years', '2025-10-31', null, '2026-11-12', 'Gold'], ['£500k to £1m', '1 to 2 years', '2025-05-09', 'Tenant', '2026-11-16', 'Gold'],
    ['£500k to £1m', '1 to 2 years', '2025-09-24', 'Homeowner', '2026-11-17', 'Platinum'], ['£500k to £1m', '5+ years', '2019-12-31', 'Homeowner', '2026-11-16', 'Platinum'],
    ['£1m to £5m', '2 to 5 years', '2023-09-04', null, '2026-11-11', 'Platinum+'], ['£5m+', '5+ years', '2008-02-29', null, '2026-11-14', 'Platinum+'],
    ['Under £50k', '5+ years', null, null, '2026-11-14', null]];
  // Credit history (added 17 Nov): missed payments / CCJs drop one more tier; stacks with trading; Bronze floor.
  assert.equal(leadTier({ turnover: '£500k to £1m', trading: '5+ years', property: 'Homeowner', credit: 'Yes', created_at: at('2026-11-16') }), 'Gold', 'lead 85 with CCJs');
  assert.equal(leadTier({ turnover: '£500k to £1m', trading: '1 to 2 years', credit: 'Yes', created_at: at('2026-11-16') }), 'Silver', 'short trading + CCJs = two tiers');
  assert.equal(leadTier({ turnover: '£500k to £1m', trading: '5+ years', credit: 'Not sure', created_at: at('2026-11-16') }), 'Platinum', 'not sure: no drop');
  assert.equal(leadTier({ turnover: '£50k to £100k', trading: '6 to 12 months', credit: 'Yes', created_at: at('2026-11-16') }), 'Bronze', 'Bronze floor');
  for (const [turnover, trading, inc, property, d, want] of cases)
    assert.equal(leadTier({ turnover, trading, property, company: inc ? { incorporated: inc } : null, created_at: at(d) }), want, `${turnover} / ${trading} / ${inc} / ${property}`);
  const tierB = { pricing: 'tier', filters: { tierPlan: { Bronze: { on: false }, Gold: { on: true, credits: 400 } } } }, creditB = { pricing: 'credit', filters: { turnovers: ['£5m+'] } };
  const lead = { tier: 'Gold', tier_price: 80, price: 135, price_fixed: true, turnover: '£250k to £500k', amount: 1e5, trading: '5+ years' };
  assert.ok(m(critOf(tierB), lead) && !m(critOf(tierB), { ...lead, tier: 'Bronze' }) && m(critOf(tierB), { ...lead, tier: 'Silver' }), 'tier brokers match by tier (unset = wanted)');
  assert.ok(!m(critOf(creditB), lead), 'credit brokers still use detailed criteria');
  assert.equal(asPriced(lead, tierB).price, 80); assert.equal(asPriced(lead, creditB).price, 135); assert.equal(asPriced({ ...lead, buyer: 'x' }, tierB).price, 135, 'sold leads keep what was paid');
  assert.equal(tierPlanOf(tierB).Gold.credits, 400); assert.equal(tierPlanOf(tierB).Silver.on, true);
  console.log('tiers ok'); }

// 17 Nov 2026: loan size matters less from £50k up (size score ≥ 0.4). Optional floor for £500k+, 5+ years, clean (off by default).
{ const richer = { amount: 50000, turnover: '£500k to £1m', trading: '5+ years', credit: 'No' };
  assert.equal(price(richer), 120, `Richer Education at 0.4 (got ${price(richer)})`);
  assert.ok(price({ ...richer, amount: 40000 }) >= 150 === false, 'no 150 floor by default');
  assert.ok(price({ ...richer, amount: 40000 }, { ...DEFAULT_PRICING, floorPrime: 150 }) === 150, 'floor works when switched on');
  const mid = { amount: 50000, turnover: '£250k to £500k', trading: '2 to 5 years', credit: 'No' };
  assert.ok(price({ ...mid, amount: 500000 }) - price(mid) <= 60, 'from £50k, a 10x bigger loan adds little');
  assert.ok(price(mid) > price({ ...mid, amount: 45000 }), 'under £50k is still priced down');
  assert.equal(price({ amount: 50000, turnover: '£50k to £100k', trading: '2 to 5 years', credit: 'No' }), 50, '£50k–£100k revenue sits around 50 (Lahori Nawaab)');
  console.log('loan size + prime floor ok'); }
// Meta click ID is rebuilt from the URL/referrer when the browser lost it (so Ads Manager can attribute the lead).
{
  const { fbcOf } = await import('../api/enquiry.js');
  assert.equal(fbcOf({ fbc: 'fb.1.1.KEEP' }), 'fb.1.1.KEEP', 'browser click ID kept');
  assert.match(fbcOf({ utm: { fbclid: 'Iw_A-1' } }), /^fb\.1\.\d+\.Iw_A-1$/, 'from URL params');
  assert.match(fbcOf({ referrer: 'https://loanleaf.co/apply?fbclid=PAZ_9&utm_source=ig' }), /\.PAZ_9$/, 'from referrer');
  assert.equal(fbcOf({ page: 'https://loanleaf.co/apply', referrer: 'https://google.com' }), '', 'none when not from an ad');
  console.log('meta click id fallback ok');
}
// Smaller/newer businesses (sent to Aureum free) are not counted as a Lead on Meta/LinkedIn.
{
  const { metaEvents } = await import('../api/enquiry.js');
  assert.equal(metaEvents({ turnover: 'Under £50k', trading: '5+ years' }).lead, false, 'under £50k counted as a Lead');
  assert.equal(metaEvents({ turnover: '£50k to £100k', trading: 'Under 6 months', property: 'Tenant' }).lead, false, 'under 6 months tenant under £100k counted as a Lead');
  assert.equal(metaEvents({ turnover: '£50k to £100k', trading: 'Under 6 months', property: 'Homeowner' }).lead, true, 'under 6 months homeowner not a Lead');
  assert.equal(metaEvents({ turnover: '£100k to £250k', trading: 'Under 6 months', property: 'Tenant' }).lead, true, 'under 6 months £100k+ not a Lead');
  assert.equal(metaEvents({ turnover: 'Under £50k', trading: '2 to 5 years', property: 'Homeowner' }).lead, false, 'under £50k homeowner counted as a Lead');
  assert.equal(metaEvents({ turnover: '£100k to £250k', trading: '2 to 5 years' }).lead, true, 'normal enquiry not a Lead');
  console.log('starter leads not counted ok');
  const { starterToMarket } = await import('../api/_lib/platform.js');
  assert.equal(starterToMarket({ trading: 'Under 6 months', property: 'Homeowner', turnover: '£250k to £500k' }), true, '£250k+ homeowner under 6 months not on marketplace');
  assert.equal(starterToMarket({ trading: 'Under 6 months', property: 'Homeowner', turnover: '£100k to £250k' }), false, 'under £250k should go to Aureum');
  assert.equal(starterToMarket({ trading: 'Under 6 months', property: 'Tenant', turnover: '£1m to £5m' }), false, 'tenant should not go to marketplace');
  // Under 6 months is opt-in for auto-buy: "any trading time" doesn't include it.
  const u6 = { amount: 50000, turnover: '£250k to £500k', trading: 'Under 6 months', property: 'Homeowner', credit: 'No' };
  assert.equal(matches({}, u6), false, 'empty criteria auto-buys under 6 months');
  assert.equal(matches({ trading: ['Under 6 months'] }, u6), true, 'opted-in broker misses under 6 months');
  assert.equal(matches({}, { ...u6, trading: '2 to 5 years' }), true, 'empty criteria still match normal leads');
  const { countsAsLead, isStarter } = await import('../api/_lib/platform.js');
  for (const t of [{ trading: 'Under 6 months', property: 'Tenant', turnover: '£50k to £100k' }, { trading: '2 to 5 years', property: 'Tenant', turnover: 'Under £50k' }])
    assert.equal(isStarter(t) && !starterToMarket(t) && !countsAsLead(t), true, 'small tenant should go to Aureum, not counted as a Lead');
  assert.equal(countsAsLead({ trading: 'Under 6 months', property: 'Tenant', turnover: '£100k to £250k' }), true, '£100k+ under-6 tenant should count');
  assert.equal(isStarter({ trading: 'Under 6 months', turnover: '£1m to £5m' }) && !starterToMarket({ trading: 'Under 6 months', property: 'Tenant', turnover: '£1m to £5m' }), true, 'under-6 tenant should go to Aureum');
  console.log('under 6 months routing + opt-in ok');
}
{ // Invitees at a firm that's already joined get no more lead alerts.
  const { notJoined } = await import('../api/_lib/platform.js');
  const real = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify([{ email: 'Rob.Smith@magnamoney.co.uk' }, { email: 'jo@gmail.com' }]), { status: 200, headers: { 'content-type': 'application/json' } });
  process.env.SUPABASE_URL ||= 'https://x.supabase.co';
  const left = (await notJoined([{ email: 'peter.nolan@magnamoney.co.uk' }, { email: 'sam@gmail.com' }, { email: 'jo@gmail.com' }, { email: 'a@other.co.uk' }])).map((v) => v.email);
  globalThis.fetch = real;
  assert.deepEqual(left, ['sam@gmail.com', 'a@other.co.uk'], `colleague/own-email invitees should be dropped (got ${left})`);
  console.log('joined firms get no invite alerts ok');
}

// £50k to £100k revenue is opt-in, and a leftover tierPlan on a credit broker doesn't override the real criteria (lead #112, 18 Nov 2026).
{
  const { matches, critOf } = await import('../api/_lib/platform.js');
  const l = { amount: 100000, turnover: '£50k to £100k', trading: '2 to 5 years', property: 'Tenant', credit: 'No', tier: 'Bronze' };
  assert.ok(!matches({}, l), 'empty revenue list ("any") must not include £50k to £100k');
  assert.ok(matches({ turnovers: ['£50k to £100k'] }, l), 'ticked £50k to £100k matches');
  const moorgate = { pricing: 'credit', filters: { turnovers: ['£100k to £250k', '£250k to £500k'], tierPlan: { Bronze: { on: true, credits: 0 } } } };
  assert.ok(!matches(critOf(moorgate), l), 'stale tierPlan on a credit broker must not bypass its revenue list');
  assert.ok(matches(critOf({ pricing: 'tier', filters: moorgate.filters }), l), 'tier brokers still match on tiers');
  console.log('opt-in £50k–£100k + stale tierPlan ok');
}
