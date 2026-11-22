// Leaflegal enquiry forms: every area, matter, question and knock-out, as plain data.
// Pure ES module with no DOM code. Imported by the browser form (assets/enquire.js), by the server
// (api/_lib/lead-schema.js builds and checks the lead from it) and by the lawyer platform for its filters.
//
// Copy rules for everything shown to the public: no colons, semicolons or em dashes, never mention the founder,
// and never give legal advice. Immigration is referral only, so no eligibility rules or routes in the copy.
//
// ---------------------------------------------------------------- how a form is described
// FORMS[areaSlug] = { steps: [Step], exits: { key: Exit }, ... area settings (see AREAS) }
// Step = { id, q, type, options?, when?, ... }
//   type     'single' (one choice), 'multi' (choose all that apply), 'text', 'date', 'company' (Companies House search)
//   when     { stepId: [values] } shows the step only if every listed answer matches (for a multi answer, any overlap).
//            A key starting with '!' means "not one of". '$audience' and '$matter' test the derived audience and matter.
//   grid     show options in two columns. icons: options carry icons (always one column).
//   note     key into NOTES, shown under the question.
//   deadline the date answered here is sent as the lead's deadline (court date, visa expiry, completion date).
//   valueLabel  the options carry value {min, max} in whole pounds and this names the figure (for example Property price).
//   optional a text or date step that can be skipped.
//   validate key into the browser's validators (nationality, name, reg, text).
// Option = { v, label, sub?, ico?, exit?, matter?, tags?, audience?, value?, wide? }
//   exit      ends the form with that exit screen. Nothing is sent to us.
//   matter    matter slug (MATTERS[area]). The last matter picked wins.
//   tags      short facets the platform can filter and auto buy on.
//   audience  'individual' or 'business'. Default is individual.
// Exit = { reason, links: [[href, text]] }
//
// After an area's own steps every form asks the shared steps in this order (built by the browser, checked by the server):
//   postcode (only areas with postcode: true), urgency, pay, business (businesses without a company step), details.

export const FORM_VERSION = '2026-11-22.4';

export const AREAS = [
  { slug: 'conveyancing', label: 'Conveyancing', form: 'Buying or selling a home', short: 'Buying, selling or remortgaging', icon: 'home', scope: 'ew', postcode: true },
  { slug: 'family-law', label: 'Family law', form: 'Family law', short: 'Divorce, finances, children', icon: 'family', scope: 'ew' },
  { slug: 'immigration', label: 'Immigration', form: 'Immigration', short: 'Visas, settlement, sponsor licences', icon: 'globe', scope: 'uk', referralOnly: true },
  { slug: 'debt-recovery', label: 'Debt recovery', form: 'Recovering a business debt', short: 'For businesses owed money', icon: 'invoice', scope: 'ew', businessOnly: true },
  { slug: 'licensing', label: 'Licensing', form: 'Licensing', short: 'Premises, personal, taxi', icon: 'badge', scope: 'ew' },
  { slug: 'lease-extensions', label: 'Lease extensions', form: 'Extending a lease', short: 'Flats and freeholds', icon: 'key', scope: 'ew', postcode: true },
  { slug: 'trademarks', label: 'Trademarks', form: 'Trademarks and IP', short: 'Brands, copyright, designs', icon: 'tag', scope: 'uk' },
];
export const AREA_SLUGS = AREAS.map((a) => a.slug);
export const areaOf = (s) => AREAS.find((a) => a.slug === s || a.form === s || a.label === s) || null;

// Every matter a lead can carry. page: false means there is no /<area>/<slug> page for it.
export const MATTERS = {
  conveyancing: [
    ['buying-a-home', 'Buying a home'], ['selling-a-home', 'Selling a home'], ['buying-and-selling', 'Buying and selling together'],
    ['remortgaging', 'Remortgaging'], ['transfer-of-equity', 'Transfer of equity'], ['first-time-buyers', 'First time buyers'],
    ['buy-to-let', 'Buy to let purchases'], ['new-build-purchases', 'New build purchases'], ['buying-a-leasehold-flat', 'Buying a leasehold flat'],
  ],
  'lease-extensions': [
    ['statutory-lease-extension', 'Statutory lease extensions'], ['informal-lease-extension', 'Informal lease extensions'],
    ['collective-enfranchisement', 'Collective enfranchisement'], ['short-lease', 'Flats with a short lease'],
    ['lease-variations', 'Lease variations'], ['selling-a-leasehold-flat', 'Selling a leasehold flat'],
  ],
  'family-law': [
    ['divorce', 'Divorce'], ['financial-settlements', 'Financial settlements'], ['consent-orders', 'Consent orders'],
    ['child-arrangements', 'Child arrangements'], ['separation-agreements', 'Separation agreements'], ['cohabitation-disputes', 'Cohabitation disputes'],
    ['prenuptial-agreements', 'Prenuptial agreements'], ['civil-partnership-dissolution', 'Ending a civil partnership'],
  ],
  immigration: [
    ['spouse-and-partner-visas', 'Spouse and partner visas'], ['settlement', 'Settlement and indefinite leave to remain'],
    ['british-citizenship', 'British citizenship'], ['work-visas', 'Work visas'], ['sponsor-licences', 'Sponsor licences for employers'],
    ['family-visas', 'Family visas'], ['refusals-and-appeals', 'Refusals and appeals'], ['eu-settlement-scheme', 'EU Settlement Scheme'],
    ['visitor-visas', 'Visitor visas', false], ['talent-and-founder-visas', 'Global Talent and Innovator Founder', false],
  ],
  licensing: [
    ['premises-licence-applications', 'Premises licence applications'], ['licence-variations', 'Licence variations'],
    ['transfers-and-dps', 'Transfers and DPS changes'], ['licence-reviews', 'Licence reviews and hearings'],
    ['personal-licences', 'Personal licences'], ['taxi-and-private-hire-licences', 'Taxi and private hire licences'],
    ['other-licensing', 'Another licence', false],
  ],
  'debt-recovery': [
    ['unpaid-invoices', 'Unpaid invoices'], ['letters-before-action', 'Letters before action'], ['court-claims', 'Court claims for debts'],
    ['statutory-demands', 'Statutory demands'], ['winding-up-petitions', 'Winding up petitions'], ['enforcement', 'Enforcing a judgment'],
    ['late-payment-interest', 'Late payment interest and compensation'],
  ],
  trademarks: [
    ['trademark-registration', 'Trademark registration'], ['trademark-searches', 'Trademark searches'],
    ['objections-and-oppositions', 'Objections and oppositions'], ['trademark-infringement', 'Trademark infringement'],
    ['cease-and-desist-letters', 'Cease and desist letters'], ['trademark-renewals', 'Renewals and ownership changes'],
    ['copyright', 'Copyright'], ['design-rights', 'Design rights'],
    ['other-ip', 'Another brand or IP matter', false],
  ],
};
export const matterOf = (area, slug) => {
  const m = (MATTERS[area] || []).find(([s]) => s === slug);
  return m ? { slug: m[0], label: m[1], page: m[2] !== false } : null;
};

// The four urgency labels a lead can carry (the server and platform filter on these exact strings).
export const URGENCY = ['Urgently', 'Within a month', 'In the next few months', 'Just looking into it'];
export const PRIVATE_PAY = ['Yes', 'Yes, if the cost is right'];

// UK postcode areas to a region, for the platform's location filter. Scotland and Northern Ireland are marked so
// England and Wales only areas can stop them. TD is mostly Scotland but includes Berwick, so it is not blocked.
export const POSTCODE_REGIONS = {
  London: 'E EC N NW SE SW W WC BR CR DA EN HA IG KT RM SM TW UB',
  'South East': 'BN CT GU HP ME MK OX PO RG RH SL SO TN',
  'East of England': 'AL CB CM CO IP LU NR PE SG SS',
  'South West': 'BA BH BS DT EX GL PL SN SP TA TQ TR',
  'West Midlands': 'B CV DY HR ST SY TF WR WS WV',
  'East Midlands': 'DE DN LE LN NG NN S',
  'North West': 'BB BL CA CH CW FY L LA M OL PR SK WA WN',
  'Yorkshire and the Humber': 'BD HD HG HU HX LS WF YO',
  'North East': 'DH DL NE SR TS',
  Wales: 'CF LD LL NP SA',
  Scotland: 'AB DD DG EH FK G HS IV KA KW KY ML PA PH ZE TD',
  'Northern Ireland': 'BT',
  'Channel Islands and Isle of Man': 'GY JE IM',
};
export const REGIONS = Object.keys(POSTCODE_REGIONS);
export const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
export const postcodeArea = (pc) => (String(pc || '').trim().toUpperCase().match(/^[A-Z]{1,2}/) || [''])[0];
export function regionOf(pc) {
  const ar = postcodeArea(pc);
  for (const [r, list] of Object.entries(POSTCODE_REGIONS)) if (list.split(' ').includes(ar)) return r;
  return '';
}
// England and Wales only matters stop these postcodes. TD (Borders and Berwick) is let through.
export const NOT_EW = /^(AB|DD|DG|EH|FK|G|HS|IV|KA|KW|KY|ML|PA|PH|ZE|BT|GY|JE|IM)\d/i;
export const countryOf = (pc) => {
  const r = regionOf(pc);
  return r === 'Scotland' ? 'scotland' : r === 'Northern Ireland' ? 'ni' : r === 'Wales' ? 'wales' : r === 'Channel Islands and Isle of Man' ? 'crown' : r ? 'england' : '';
};

// Notes shown under a question.
export const NOTES = {
  fees: '<b>Legal help is a paid service.</b> The firm will confirm its fees in writing before any work starts. Using Leaflegal is free.',
  immFees: '<b>Immigration advice is a paid service.</b> The regulated adviser will confirm their fees in writing before any work starts. Using Leaflegal is free.',
  bizFees: '<b>The firm charges for its work.</b> Many offer fixed fees for letters and claims, and some of the cost of chasing a late payment can often be added to the debt.',
  noAdvice: 'Leaflegal does not give legal or immigration advice. We just pass your answers to the firm so the first call is quicker.',
};

// Links used by more than one exit.
const L = {
  legalAid: ['https://www.gov.uk/check-legal-aid', 'Check if you can get legal aid (GOV.UK)'],
  ca: ['https://www.citizensadvice.org.uk/', 'Citizens Advice'],
  lawScot: ['https://www.lawscot.org.uk/find-a-solicitor/', 'Find a solicitor in Scotland (Law Society of Scotland)'],
  lawNI: ['https://www.lawsoc-ni.org/solicitors-directory', 'Find a solicitor in Northern Ireland (Law Society of NI)'],
  findSol: ['https://solicitors.lawsociety.org.uk/', 'Find a Solicitor (Law Society)'],
};

// Shared exits every form can use. Area exits with the same key win.
export const SHARED_EXITS = {
  scope: { reason: 'For this area of law we can only help with matters in England and Wales at the moment. These directories list solicitors who can help elsewhere in the UK.', links: [L.lawScot, L.lawNI] },
  free: { reason: 'The firms we work with charge for their work, so they can’t help with free advice or legal aid cases. These services can help.', links: [L.legalAid, L.ca] },
  research: { reason: 'It sounds like you’re still weighing things up. Come back when you’re ready to speak to someone. Until then, these pages are a good place to start.', links: [L.ca, L.findSol] },
  other: { reason: 'This one is outside the kinds of matter the firms we work with take on through Leaflegal. The Law Society directory lists solicitors for every area of law.', links: [L.findSol, L.ca] },
};

// Shared steps, asked after an area's own steps. {AREA} and {WHO} are filled in by the browser.
export const SHARED_STEPS = {
  postcode: { id: 'postcode', q: 'What’s the property postcode?', type: 'postcode', placeholder: 'For example SW1A 1AA',
    hint: 'If you haven’t found a property yet, use your own postcode' },
  urgency: { id: 'urgency', q: 'How soon do you need help?', type: 'single', icons: true, options: [
    { v: 'Urgently', label: 'Urgently, I have a deadline in the next two weeks', ico: 'bolt', tags: ['urgent'] },
    { v: 'Within a month', label: 'Within a month', ico: 'month' },
    { v: 'In the next few months', label: 'In the next few months', ico: 'clock' },
    { v: 'Just looking into it', label: 'I’m just researching for now', ico: 'look', exit: 'research' }] },
  pay: { id: 'pay', q: 'If the firm can help, are you ready to go ahead?', type: 'single', note: 'fees', options: [
    { v: 'Yes', label: 'Yes, I’m ready to instruct a firm', tags: ['ready'] },
    { v: 'Yes, if the cost is right', label: 'Yes, once I know what it will cost' },
    { v: 'free', label: 'No, I was hoping for free advice or legal aid', exit: 'free' }] },
  business: { id: 'business', q: 'What’s the name of the business?', type: 'text', placeholder: 'For example Acme Trading Ltd', validate: 'text' },
  summary: { id: 'summary', q: 'Anything else the firm should know?', type: 'summary', optional: true },
  details: { id: 'details', q: 'Your contact details', type: 'details' },
};

// ---------------------------------------------------------------- the forms, one per area (assets/forms/*.js)
import conveyancing from './forms/conveyancing.js';
import immigration from './forms/immigration.js';
import familyLaw from './forms/family-law.js';
import debtRecovery from './forms/debt-recovery.js';
import licensing from './forms/licensing.js';
import leaseExtensions from './forms/lease-extensions.js';
import trademarks from './forms/trademarks.js';

export const FORMS = {
  conveyancing, immigration, 'family-law': familyLaw, 'debt-recovery': debtRecovery,
  licensing, 'lease-extensions': leaseExtensions, trademarks,
};

// Tags each area can carry, for the platform's filters (collected from the form options).
export const TAGS = Object.fromEntries(Object.entries(FORMS).map(([k, f]) => [k, [...new Set(
  f.steps.flatMap((s) => (s.options || []).flatMap((o) => o.tags || [])).concat(SHARED_STEPS.urgency.options.flatMap((o) => o.tags || []), ['ready']))].sort()]));

// Value bands per area, for the platform's filters (the options of each area's valueLabel step).
export const VALUE_BANDS = Object.fromEntries(Object.entries(FORMS).map(([k, f]) => {
  const s = f.steps.find((x) => x.valueLabel);
  return [k, s ? { label: s.valueLabel, bands: s.options.filter((o) => o.value).map((o) => ({ v: o.v, label: o.label, min: o.value.min, max: o.value.max })) } : null];
}));

// ---------------------------------------------------------------- shared logic (browser and server)
// Does a step show, given the answers so far? `d` is { audience, matter } derived from the answers.
export function shows(step, a, d = {}) {
  for (const [k0, allowed] of Object.entries(step.when || {})) {
    const neg = k0.startsWith('!'), k = neg ? k0.slice(1) : k0;
    const v = k === '$audience' ? d.audience : k === '$matter' ? d.matter : a[k];
    const hit = Array.isArray(v) ? v.some((x) => allowed.includes(x)) : allowed.includes(v);
    if (neg ? hit : !hit) return false;
  }
  return true;
}
const optOf = (step, v) => (step.options || []).find((o) => o.v === v);
// Audience, matter, tags and value from an area's answers (the last matter or value picked wins).
export function derive(area, a) {
  const f = FORMS[area], d = { audience: AREAS.find((x) => x.slug === area)?.businessOnly ? 'business' : 'individual', matter: null, tags: [], value: null, valueLabel: null, deadline: null };
  if (!f) return d;
  for (const s of f.steps) {
    if (!shows(s, a, d) || a[s.id] == null) continue;
    const picked = [].concat(a[s.id]).map((v) => optOf(s, v)).filter(Boolean);
    for (const o of picked) {
      if (o.audience) d.audience = o.audience;
      if (o.matter) d.matter = o.matter;
      if (o.tags) d.tags.push(...o.tags);
      if (o.value && s.valueLabel) { d.value = { band: o.label, min: o.value.min, max: o.value.max }; d.valueLabel = s.valueLabel; }
    }
    if (s.deadline && /^\d{4}-\d{2}-\d{2}$/.test(a[s.id])) d.deadline = a[s.id];
  }
  if (!d.matter && f.defaultMatter) d.matter = f.defaultMatter;
  return d;
}
// The area's steps that show for these answers, then the shared ones.
export function pathOf(area, a) {
  const f = FORMS[area];
  if (!f) return [];
  const d = derive(area, a), out = [];
  for (const s of f.steps) if (shows(s, a, d)) out.push(s);
  const biz = d.audience === 'business';
  if (AREAS.find((x) => x.slug === area)?.postcode) out.push(SHARED_STEPS.postcode);
  out.push(f.urgency ? { ...SHARED_STEPS.urgency, ...f.urgency } : SHARED_STEPS.urgency);
  out.push({ ...SHARED_STEPS.pay, note: f.payNote || (biz ? 'bizFees' : 'fees'), ...(f.pay || {}) });
  if (biz && !f.steps.some((s) => s.type === 'company' && shows(s, a, d))) out.push(SHARED_STEPS.business);
  out.push(SHARED_STEPS.details);
  return out;
}
export const exitOf = (area, key) => (FORMS[area]?.exits || {})[key] || SHARED_EXITS[key] || SHARED_EXITS.other;
