// Leaflegal practice areas, matters, regions and lead options: one list for the platform (filters, auto-buy, pricing,
// lead display) and the server. Matter slugs match the pages under /<area>/<matter>. The enquiry forms
// (api/_lib/lead-schema.js) send these slugs; a matter the form adds that isn't listed here is still stored and shown,
// it just has no filter checkbox until it's added below.
// Plain data only (no Node or browser APIs), so the platform front end gets the same lists from /api/platform?action=taxonomy.

export const AREAS = [
  { slug: 'conveyancing', label: 'Conveyancing', ew: true, matters: [
    ['buying-a-home', 'Buying a home'], ['selling-a-home', 'Selling a home'], ['buying-and-selling', 'Buying and selling'],
    ['first-time-buyers', 'First time buyer'], ['buying-a-leasehold-flat', 'Buying a leasehold flat'], ['new-build-purchases', 'New build purchase'],
    ['buy-to-let', 'Buy to let'], ['remortgaging', 'Remortgaging'], ['transfer-of-equity', 'Transfer of equity'], ['other', 'Something else'],
  ] },
  { slug: 'immigration', label: 'Immigration', ew: false, matters: [
    ['work-visas', 'Work visa'], ['spouse-and-partner-visas', 'Spouse or partner visa'], ['family-visas', 'Family visa'],
    ['settlement', 'Settlement (ILR)'], ['british-citizenship', 'British citizenship'], ['eu-settlement-scheme', 'EU Settlement Scheme'],
    ['sponsor-licences', 'Sponsor licence (employer)'], ['refusals-and-appeals', 'Refusal or appeal'], ['visitor-visas', 'Visitor visa'],
    ['talent-and-founder-visas', 'Global Talent or Innovator Founder'], ['other', 'Something else'],
  ] },
  { slug: 'family-law', label: 'Family law', ew: true, matters: [
    ['divorce', 'Divorce'], ['civil-partnership-dissolution', 'Ending a civil partnership'], ['financial-settlements', 'Financial settlement'],
    ['consent-orders', 'Consent order'], ['child-arrangements', 'Child arrangements'], ['cohabitation-disputes', 'Cohabitation dispute'],
    ['separation-agreements', 'Separation agreement'], ['prenuptial-agreements', 'Prenuptial agreement'], ['other', 'Something else'],
  ] },
  { slug: 'debt-recovery', label: 'Debt recovery', ew: true, businessOnly: true, matters: [
    ['unpaid-invoices', 'Unpaid invoices'], ['letters-before-action', 'Letter before action'], ['court-claims', 'Court claim'],
    ['enforcement', 'Enforcing a judgment'], ['statutory-demands', 'Statutory demand'], ['winding-up-petitions', 'Winding up petition'],
    ['late-payment-interest', 'Late payment interest'], ['other', 'Something else'],
  ] },
  { slug: 'motoring-offences', label: 'Motoring offences', ew: true, matters: [
    ['speeding', 'Speeding'], ['drink-driving', 'Drink driving'], ['drug-driving', 'Drug driving'], ['careless-driving', 'Careless driving'],
    ['dangerous-driving', 'Dangerous driving'], ['driving-without-insurance', 'Driving without insurance'], ['mobile-phone', 'Using a phone while driving'],
    ['failing-to-identify-the-driver', 'Failing to identify the driver'], ['totting-up', 'Totting up ban'], ['exceptional-hardship', 'Exceptional hardship'], ['other-motoring', 'Another motoring offence'], ['other', 'Something else'],
  ] },
  { slug: 'licensing', label: 'Licensing', ew: true, matters: [
    ['premises-licence-applications', 'New premises licence'], ['licence-variations', 'Licence variation'], ['transfers-and-dps', 'Transfer or DPS change'],
    ['personal-licences', 'Personal licence'], ['licence-reviews', 'Licence review or hearing'], ['taxi-and-private-hire-licences', 'Taxi or private hire licence'], ['other-licensing', 'Another licence'], ['other', 'Something else'],
  ] },
  { slug: 'lease-extensions', label: 'Lease extensions', ew: true, matters: [
    ['statutory-lease-extension', 'Statutory lease extension'], ['informal-lease-extension', 'Informal lease extension'], ['short-lease', 'Flat with a short lease'],
    ['collective-enfranchisement', 'Buying the freehold'], ['selling-a-leasehold-flat', 'Selling a leasehold flat'], ['lease-variations', 'Lease variation'], ['other', 'Something else'],
  ] },
];
export const AREA_SLUGS = AREAS.map((a) => a.slug);
export const areaOf = (slug) => AREAS.find((a) => a.slug === slug) || null;
export const areaLabel = (slug) => areaOf(slug)?.label || (slug === 'not-sure' ? 'Not sure yet' : slug || '');
export const matterLabel = (area, slug) => areaOf(area)?.matters.find(([s]) => s === slug)?.[1] || null;

// Old form labels (before the forms used slugs) mapped to area slugs.
export const AREA_ALIASES = {
  'Buying or selling a home': 'conveyancing', Immigration: 'immigration', 'Family law': 'family-law', 'Recovering a business debt': 'debt-recovery',
  'A motoring offence': 'motoring-offences', Licensing: 'licensing', 'Extending a lease': 'lease-extensions', 'Not sure yet': 'not-sure',
};
export const toAreaSlug = (v) => (AREA_SLUGS.includes(v) || v === 'not-sure' ? v : AREA_ALIASES[v] || null);

// Regulators a firm can be authorised by, and the areas each one lets a firm take on.
// Immigration advice is only for SRA, CILEx or IAA (formerly OISC) regulated advisers (Immigration and Asylum Act 1999 s84).
// CLC licensed conveyancers: conveyancing and lease work only.
export const REGULATORS = [
  { id: 'SRA', label: 'Solicitors Regulation Authority (SRA)', number: 'SRA number', areas: AREA_SLUGS },
  { id: 'CILEX', label: 'CILEx Regulation', number: 'CILEx Regulation number', areas: AREA_SLUGS },
  { id: 'CLC', label: 'Council for Licensed Conveyancers (CLC)', number: 'CLC licence number', areas: ['conveyancing', 'lease-extensions'] },
  { id: 'IAA', label: 'Immigration Advice Authority (IAA)', number: 'IAA reference', areas: ['immigration'] },
];
export const regulatorOf = (id) => REGULATORS.find((r) => r.id === id) || null;
export const allowedAreas = (regIds = []) => [...new Set(regIds.flatMap((id) => regulatorOf(id)?.areas || []))];

export const REGIONS = ['London', 'South East', 'South West', 'East of England', 'East Midlands', 'West Midlands', 'Yorkshire and the Humber', 'North West', 'North East', 'Wales', 'Scotland', 'Northern Ireland', 'Channel Islands and Isle of Man', 'Outside the UK'];
// Immigration enquiries from abroad have no postcode, region 'Outside the UK' and country 'outside'.
export const URGENCY = ['Urgently', 'Within a month', 'In the next few months', 'Just looking into it'];
// The forms thread may send short urgency codes; both are accepted.
export const URGENCY_CODES = { urgent: 'Urgently', month: 'Within a month', months: 'In the next few months', research: 'Just looking into it' };
export const toUrgency = (v) => (URGENCY.includes(v) ? v : URGENCY_CODES[v] || null);
export const AUDIENCES = [['individual', 'Individuals'], ['business', 'Businesses']];
export const GRADES = ['A', 'B', 'C'];
export const PRIVATE_PAY = [['yes', 'Can pay privately'], ['quote', 'Will pay if the cost is right']];
export const toPrivatePay = (v) => (v === 'yes' || v === 'Yes' ? 'yes' : v === 'quote' || v === 'Yes, if the cost is right' ? 'quote' : null);

// Pipeline stages on My leads.
export const STAGES = ['new', 'contacted', 'consultation', 'instructed', 'lost'];
export const STAGE_LABELS = { new: 'New', contacted: 'Contacted', consultation: 'Consultation', instructed: 'Instructed', lost: 'Lost' };

export const taxonomy = () => ({ areas: AREAS, regions: REGIONS, urgency: URGENCY, audiences: AUDIENCES, grades: GRADES, privatePay: PRIVATE_PAY, regulators: REGULATORS, stages: STAGES, stageLabels: STAGE_LABELS });
