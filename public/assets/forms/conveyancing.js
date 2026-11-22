// Conveyancing enquiry form. Residential property in England and Wales only (buying, selling, remortgaging, transfers).
// Questions only sort the enquiry for the firm. No advice, no quotes, no rules about tax or schemes in the copy.
// Format: see assets/form-options.js.
const GOV = (p, t) => [`https://www.gov.uk/${p}`, t];

const PRICE = [
  { v: 'p1', label: 'Under £125,000', value: { min: 0, max: 125000 } },
  { v: 'p2', label: '£125,000 to £250,000', value: { min: 125000, max: 250000 } },
  { v: 'p3', label: '£250,000 to £500,000', value: { min: 250000, max: 500000 } },
  { v: 'p4', label: '£500,000 to £1 million', value: { min: 500000, max: 1000000 }, tags: ['high-value'] },
  { v: 'p5', label: '£1 million to £2 million', value: { min: 1000000, max: 2000000 }, tags: ['high-value'] },
  { v: 'p6', label: 'More than £2 million', value: { min: 2000000, max: 10000000 }, tags: ['high-value', 'prime'] },
];

const FLAT_TENURE = [
  { v: 'leasehold', label: 'Leasehold', matter: 'buying-a-leasehold-flat', tags: ['leasehold'] },
  { v: 'sof', label: 'Share of freehold', matter: 'buying-a-leasehold-flat', tags: ['leasehold', 'share-of-freehold'] },
  { v: 'freehold', label: 'Freehold', tags: ['freehold'] },
  { v: 'unsure', label: 'I’m not sure', matter: 'buying-a-leasehold-flat', tags: ['tenure-unknown'] }];
const LEASE_YEARS = [
  { v: 'y1', label: '125 years or more' },
  { v: 'y2', label: '90 to 124 years' },
  { v: 'y3', label: '80 to 89 years', tags: ['lease-near-80'] },
  { v: 'y4', label: 'Under 80 years', tags: ['under-80-years', 'short-lease'] },
  { v: 'unsure', label: 'I’m not sure', wide: true }];
const NEW_BUILD = [
  { v: 'yes', label: 'Yes, buying from a developer', matter: 'new-build-purchases', tags: ['new-build'] },
  { v: 'offplan', label: 'Yes, buying off plan before it’s finished', matter: 'new-build-purchases', tags: ['new-build', 'off-plan'] },
  { v: 'no', label: 'No' }];
// On a sale and purchase together the matter stays buying-and-selling, so these copies carry no matter.
const NO_MATTER = (opts) => opts.map(({ matter, ...o }) => o);

export default {
  defaultMatter: null,
  steps: [
    { id: 'what', q: 'What do you need help with?', type: 'single', icons: true, options: [
      { v: 'buy', label: 'Buying a home', ico: 'home', matter: 'buying-a-home', tags: ['purchase'] },
      { v: 'sell', label: 'Selling a home', ico: 'key', matter: 'selling-a-home', tags: ['sale'] },
      { v: 'both', label: 'Selling and buying at the same time', ico: 'building', matter: 'buying-and-selling', tags: ['purchase', 'sale', 'dual-transaction'] },
      { v: 'remortgage', label: 'Remortgaging', ico: 'pound', matter: 'remortgaging', tags: ['remortgage'] },
      { v: 'toe', label: 'Adding or removing an owner', ico: 'family', matter: 'transfer-of-equity', tags: ['transfer-of-equity'] },
      { v: 'commercial', label: 'Commercial property, such as a shop or office', ico: 'office', exit: 'commercial' },
      { v: 'other', label: 'Something else', ico: 'other', exit: 'other' }] },

    { id: 'where', q: 'Where is the property?', type: 'single', options: [
      { v: 'england', label: 'England' },
      { v: 'wales', label: 'Wales', tags: ['wales'] },
      { v: 'scotland', label: 'Scotland', exit: 'propScope' },
      { v: 'ni', label: 'Northern Ireland', exit: 'propScope' },
      { v: 'abroad', label: 'Outside the UK', exit: 'abroad' }] },

    { id: 'ptype', q: 'What type of property is it?', type: 'single', grid: true, options: [
      { v: 'house', label: 'House' },
      { v: 'flat', label: 'Flat or maisonette', tags: ['flat'] },
      { v: 'bungalow', label: 'Bungalow' },
      { v: 'land', label: 'Land or a building plot', tags: ['land'] },
      { v: 'rural', label: 'Farm or rural property with land', tags: ['rural'] },
      { v: 'mixed', label: 'Shop or business with a flat above', wide: true, exit: 'commercial' }] },

    // Buying
    { id: 'buyer', when: { what: ['buy'] }, q: 'Which best describes you?', type: 'single', options: [
      { v: 'ftb', label: 'First time buyer', matter: 'first-time-buyers', tags: ['first-time-buyer'] },
      { v: 'mover', label: 'Moving home', tags: ['home-mover'] },
      { v: 'btl', label: 'Buying to let in my own name', matter: 'buy-to-let', tags: ['buy-to-let', 'additional-property'] },
      { v: 'company', label: 'Buying through a limited company', matter: 'buy-to-let', audience: 'business', tags: ['buy-to-let', 'company-purchase', 'additional-property'] },
      { v: 'second', label: 'Buying a second home or holiday home', tags: ['second-home', 'additional-property'] }] },
    { id: 'b_company', when: { buyer: ['company'] }, q: 'Which company is buying the property?', type: 'company', placeholder: 'Company name' },
    { id: 'b_people', when: { buyer: ['ftb', 'mover', 'second', 'btl'] }, q: 'Are you buying on your own or with someone else?', type: 'single', options: [
      { v: 'one', label: 'Just me' },
      { v: 'two', label: 'Me and a partner or spouse', tags: ['joint-buyers'] },
      { v: 'friends', label: 'Me with a friend or family member', tags: ['joint-buyers', 'tenants-in-common'] },
      { v: 'three', label: 'Three or more of us', tags: ['joint-buyers', 'tenants-in-common'] }] },

    // Tenure. A leasehold flat purchase is its own matter.
    { id: 'tenure_flat', when: { what: ['buy'], ptype: ['flat'] }, q: 'Is the flat leasehold or freehold?', type: 'single', options: FLAT_TENURE },
    { id: 'tenure_flat_both', when: { what: ['both'], ptype: ['flat'] }, q: 'Is the flat you’re buying leasehold or freehold?', type: 'single', options: NO_MATTER(FLAT_TENURE) },
    { id: 'tenure', when: { '!tenure_flat': ['leasehold', 'sof', 'freehold', 'unsure'], '!tenure_flat_both': ['leasehold', 'sof', 'freehold', 'unsure'], '!ptype': ['land'] }, q: 'Is the property freehold or leasehold?', type: 'single', options: [
      { v: 'freehold', label: 'Freehold', tags: ['freehold'] },
      { v: 'leasehold', label: 'Leasehold', tags: ['leasehold'] },
      { v: 'sof', label: 'Share of freehold', tags: ['leasehold', 'share-of-freehold'] },
      { v: 'unsure', label: 'I’m not sure', tags: ['tenure-unknown'] }] },
    { id: 'lease_years', when: { tenure: ['leasehold', 'sof'] }, q: 'Roughly how many years are left on the lease?', type: 'single', grid: true, options: LEASE_YEARS },
    { id: 'lease_years_flat', when: { tenure_flat: ['leasehold', 'sof'] }, q: 'Roughly how many years are left on the lease?', type: 'single', grid: true, options: LEASE_YEARS },
    { id: 'lease_years_both', when: { tenure_flat_both: ['leasehold', 'sof'] }, q: 'Roughly how many years are left on the lease?', type: 'single', grid: true, options: LEASE_YEARS },

    { id: 'newbuild', when: { what: ['buy'], '!ptype': ['land'] }, q: 'Is it a new build?', type: 'single', options: NEW_BUILD },
    { id: 'newbuild_both', when: { what: ['both'], '!ptype': ['land'] }, q: 'Is the home you’re buying a new build?', type: 'single', options: NO_MATTER(NEW_BUILD) },
    { id: 'b_schemes', when: { what: ['buy', 'both'] }, q: 'Do any of these apply to your purchase?', type: 'multi', options: [
      { v: 'shared', label: 'Shared ownership', tags: ['shared-ownership'] },
      { v: 'rtb', label: 'Right to Buy from a council or housing association', tags: ['right-to-buy'] },
      { v: 'isa', label: 'Lifetime ISA or Help to Buy ISA', tags: ['lifetime-isa'] },
      { v: 'gift', label: 'A gifted deposit from family', tags: ['gifted-deposit'] },
      { v: 'auction', label: 'Buying at auction', tags: ['auction'] },
      { v: 'probate', label: 'Buying from an estate after a death', tags: ['probate-sale'] },
      { v: 'none', label: 'None of these' }] },
    { id: 'funding', when: { what: ['buy', 'both'] }, q: 'How are you paying for it?', type: 'single', options: [
      { v: 'offer', label: 'Mortgage, and I have a mortgage offer', tags: ['mortgage', 'mortgage-offer'] },
      { v: 'aip', label: 'Mortgage, with an agreement in principle', tags: ['mortgage'] },
      { v: 'mortgage', label: 'Mortgage, not arranged yet', tags: ['mortgage'] },
      { v: 'cash', label: 'Cash, no mortgage', tags: ['cash-buyer'] },
      { v: 'bridging', label: 'Bridging or development finance', tags: ['bridging'] }] },
    { id: 'b_offer', when: { what: ['buy', 'both'] }, q: 'Has your offer been accepted?', type: 'single', options: [
      { v: 'yes', label: 'Yes, my offer has been accepted', tags: ['offer-accepted'] },
      { v: 'made', label: 'I’ve made an offer and I’m waiting to hear', tags: ['offer-made'] },
      { v: 'looking', label: 'Not yet, I’m still looking', tags: ['pre-offer'] }] },

    // Selling
    { id: 's_offer', when: { what: ['sell', 'both'] }, q: 'Where are you up to with the sale?', type: 'single', options: [
      { v: 'agreed', label: 'I’ve accepted an offer', tags: ['sale-agreed'] },
      { v: 'market', label: 'It’s on the market', tags: ['on-market'] },
      { v: 'soon', label: 'It’s not on the market yet', tags: ['pre-listing'] }] },
    { id: 's_factors', when: { what: ['sell', 'both'] }, q: 'Do any of these apply to the home you’re selling?', type: 'multi', options: [
      { v: 'mortgage', label: 'There’s a mortgage to pay off', tags: ['mortgage-redemption'] },
      { v: 'joint', label: 'It’s owned jointly with someone else', tags: ['joint-owners'] },
      { v: 'separation', label: 'The sale is because of a separation or divorce', tags: ['separation'] },
      { v: 'probate', label: 'I’m selling as an executor after a death', tags: ['probate-sale'] },
      { v: 'tenants', label: 'There are tenants living there', tags: ['tenanted'] },
      { v: 'works', label: 'Extensions or building work have been done', tags: ['alterations'] },
      { v: 'none', label: 'None of these' }] },

    // Remortgaging
    { id: 'r_type', when: { what: ['remortgage'] }, q: 'What kind of remortgage is it?', type: 'single', options: [
      { v: 'switch', label: 'Moving to a new lender for a better deal', tags: ['like-for-like'] },
      { v: 'raise', label: 'Borrowing more against the property', tags: ['capital-raising'] },
      { v: 'toe', label: 'Remortgaging and adding or removing an owner', matter: 'transfer-of-equity', tags: ['transfer-of-equity'] },
      { v: 'btl', label: 'Remortgaging a buy to let', tags: ['buy-to-let'] }] },
    { id: 'r_offer', when: { what: ['remortgage'] }, q: 'Do you have a mortgage offer from the new lender?', type: 'single', options: [
      { v: 'yes', label: 'Yes, I have the offer', tags: ['mortgage-offer'] },
      { v: 'applied', label: 'I’ve applied and I’m waiting' },
      { v: 'no', label: 'Not yet' }] },
    { id: 'r_date', when: { what: ['remortgage'] }, q: 'When does your current mortgage deal end?', type: 'date', deadline: true, optional: true },

    // Transfer of equity
    { id: 't_change', when: { what: ['toe'] }, q: 'What’s changing?', type: 'single', options: [
      { v: 'add', label: 'Adding someone to the ownership', tags: ['adding-owner'] },
      { v: 'remove', label: 'Removing someone from the ownership', tags: ['removing-owner'] },
      { v: 'separation', label: 'Transferring it after a separation or divorce', tags: ['removing-owner', 'separation'] },
      { v: 'family', label: 'Giving it or part of it to a family member', tags: ['gift'] }] },
    { id: 't_mortgage', when: { what: ['toe'] }, q: 'Is there a mortgage on the property?', type: 'single', options: [
      { v: 'yes', label: 'Yes', tags: ['mortgage'] },
      { v: 'remortgage', label: 'Yes, and we’re remortgaging at the same time', tags: ['mortgage', 'remortgage'] },
      { v: 'no', label: 'No' }] },
    { id: 't_order', when: { t_change: ['separation'] }, q: 'Is there a court order or agreement about the property?', type: 'single', options: [
      { v: 'order', label: 'Yes, a court order', tags: ['court-order'] },
      { v: 'agreed', label: 'We’ve agreed it between us' },
      { v: 'no', label: 'Not yet', tags: ['not-agreed'] }] },

    // The key money figure
    { id: 'price', valueLabel: 'Property price', q: 'Roughly what’s the property worth or selling for?', type: 'single', grid: true, options: PRICE },
    { id: 'sale_price', when: { what: ['both'] }, q: 'And roughly what price is the home you’re selling?', type: 'single', grid: true,
      options: PRICE.map(({ v, label }) => ({ v, label })) },

    { id: 'chain', when: { what: ['buy', 'sell', 'both'] }, q: 'Are other sales or purchases linked to yours in a chain?', type: 'single', options: [
      { v: 'none', label: 'No, there’s no chain', tags: ['chain-free'] },
      { v: 'short', label: 'Yes, a short chain' },
      { v: 'long', label: 'Yes, a long chain', tags: ['long-chain'] },
      { v: 'unsure', label: 'I’m not sure yet' }] },
    { id: 'completion', when: { what: ['buy', 'sell', 'both'] }, q: 'When are you hoping to complete?', type: 'date', deadline: true, optional: true },
    { id: 'toe_date', when: { what: ['toe'] }, q: 'Is there a date it needs to be done by?', type: 'date', deadline: true, optional: true },
  ],
  urgency: { q: 'When do you need a conveyancer in place?' },
  exits: {
    commercial: { reason: 'The firm we work with through Leaflegal handles residential property only, so it can’t take on commercial or business premises. The Law Society directory lists solicitors who specialise in commercial property.',
      links: [['https://solicitors.lawsociety.org.uk/', 'Find a Solicitor (Law Society)'], GOV('government/organisations/land-registry', 'HM Land Registry (GOV.UK)'), ['https://www.ricsfirms.com/', 'Find a surveyor (RICS)']] },
    abroad: { reason: 'The firm we work with handles property in England and Wales only. For property overseas you’ll need a lawyer in that country. These pages can help you find one.',
      links: [GOV('government/collections/list-of-lawyers', 'Lists of lawyers abroad (GOV.UK)'), ['https://solicitors.lawsociety.org.uk/', 'Find a Solicitor (Law Society)']] },
    propScope: { reason: 'Property in Scotland and Northern Ireland follows a different legal system, so it needs a solicitor based there. These directories can help.',
      links: [['https://www.lawscot.org.uk/find-a-solicitor/', 'Find a solicitor in Scotland (Law Society of Scotland)'], ['https://www.lawsoc-ni.org/solicitors-directory', 'Find a solicitor in Northern Ireland (Law Society of NI)']] },
    research: { reason: 'It sounds like you’re still weighing things up. Come back when you’re ready to move. Until then, these pages explain how buying and selling works.',
      links: [GOV('buy-sell-your-home', 'Buying or selling your home (GOV.UK)'), ['https://www.citizensadvice.org.uk/housing/', 'Housing help (Citizens Advice)']] },
  },
};
