// Lease extension enquiry form. Residential leasehold flats and houses in England and Wales only.
// Covers leaseholders, groups buying the freehold, landlords who have received a notice, lease variations and short lease sales.
// Questions only sort the enquiry for the firm. No eligibility rules, no valuations, no advice in the copy.
// Format: see assets/form-options.js.
const GOV = (p, t) => [`https://www.gov.uk/${p}`, t];
const LEASE = ['https://www.lease-advice.org/', 'The Leasehold Advisory Service'];
const FTT = GOV('courts-tribunals/first-tier-tribunal-property-chamber', 'First tier Tribunal, Property Chamber (GOV.UK)');

const YEARS = [
  { v: 'y1', label: '90 years or more' },
  { v: 'y2', label: '80 to 89 years', tags: ['lease-near-80'] },
  { v: 'y3', label: '60 to 79 years', matter: 'short-lease', tags: ['under-80-years', 'short-lease'] },
  { v: 'y4', label: 'Under 60 years', matter: 'short-lease', tags: ['under-80-years', 'short-lease', 'very-short-lease'] },
  { v: 'unsure', label: 'I’m not sure' }];
const ROUTE = [
  { v: 'formal', label: 'Extend through a formal notice to the landlord', matter: 'statutory-lease-extension', tags: ['statutory'] },
  { v: 'informal', label: 'Extend by agreeing a deal with the landlord', matter: 'informal-lease-extension', tags: ['informal'] },
  { v: 'offer', label: 'The landlord has already offered terms', matter: 'informal-lease-extension', tags: ['informal', 'landlord-offer'] },
  { v: 'unsure', label: 'I’m not sure yet', tags: ['route-unsure'] }];
const NO_MATTER = (opts) => opts.map(({ matter, ...o }) => o);

export default {
  defaultMatter: 'statutory-lease-extension',
  steps: [
    { id: 'role', q: 'What do you need help with?', type: 'single', icons: true, options: [
      { v: 'leaseholder', label: 'Extending my lease', sub: 'You own a leasehold flat or house', ico: 'key', tags: ['leaseholder'] },
      { v: 'group', label: 'Buying the freehold with other flat owners', sub: 'Collective enfranchisement', ico: 'building', matter: 'collective-enfranchisement', tags: ['collective', 'freehold-purchase'] },
      { v: 'landlord', label: 'I’m the freeholder or landlord', sub: 'You’ve received a notice or a request to extend', ico: 'doc', tags: ['landlord'] },
      { v: 'selling', label: 'Selling a flat with a short lease', ico: 'pound', matter: 'selling-a-leasehold-flat', tags: ['selling', 'leaseholder'] },
      { v: 'variation', label: 'Changing the terms of a lease', sub: 'For example fixing errors or updating clauses', ico: 'gavel', matter: 'lease-variations', tags: ['lease-variation'] },
      { v: 'commercial', label: 'A shop, office or business lease', ico: 'office', exit: 'commercial' },
      { v: 'dispute', label: 'A dispute about service charges, repairs or management', ico: 'other', exit: 'dispute' },
      { v: 'renting', label: 'I rent my home from a landlord', sub: 'You pay rent and don’t own a lease', ico: 'person', exit: 'renting' }] },

    { id: 'ptype', when: { '!role': ['group'] }, q: 'Is it a flat or a house?', type: 'single', options: [
      { v: 'flat', label: 'A flat or maisonette', tags: ['flat'] },
      { v: 'house', label: 'A leasehold house', tags: ['house'] },
      { v: 'shared', label: 'A shared ownership flat or house', tags: ['shared-ownership'] }] },

    // Groups of flat owners
    { id: 'g_flats', when: { role: ['group'] }, q: 'How many flats are in the building?', type: 'single', grid: true, options: [
      { v: 'f1', label: '2 to 4' }, { v: 'f2', label: '5 to 10' },
      { v: 'f3', label: '11 to 50', tags: ['large-building'] }, { v: 'f4', label: 'More than 50', tags: ['large-building'] }] },
    { id: 'g_owners', when: { role: ['group'] }, q: 'How many of the flat owners want to take part?', type: 'single', options: [
      { v: 'most', label: 'Most or all of them', tags: ['group-agreed'] },
      { v: 'half', label: 'About half' },
      { v: 'few', label: 'Only a few so far' },
      { v: 'unsure', label: 'We’re still finding out' }] },
    { id: 'g_commercial', when: { role: ['group'] }, q: 'Are there any shops or offices in the building?', type: 'single', options: [
      { v: 'no', label: 'No, it’s all flats' },
      { v: 'some', label: 'Yes, there are some', tags: ['mixed-use'] },
      { v: 'unsure', label: 'I’m not sure' }] },

    // Freeholders and landlords
    { id: 'l_owner', when: { role: ['landlord'] }, q: 'Who owns the freehold?', type: 'single', options: [
      { v: 'me', label: 'I own it personally' },
      { v: 'company', label: 'A company owns it', audience: 'business', tags: ['corporate-landlord'] },
      { v: 'rmc', label: 'A residents’ management or freehold company', audience: 'business', tags: ['resident-freeholder'] },
      { v: 'trust', label: 'A trust or an estate', tags: ['trust-landlord'] }] },
    { id: 'l_company', when: { l_owner: ['company', 'rmc'] }, q: 'Which company owns the freehold?', type: 'company', placeholder: 'Company name' },
    { id: 'l_received', when: { role: ['landlord'] }, q: 'What have you received?', type: 'single', options: [
      { v: 'notice', label: 'A formal notice to extend a lease', matter: 'statutory-lease-extension', tags: ['notice-received'] },
      { v: 'collective', label: 'A notice to buy the freehold', matter: 'collective-enfranchisement', tags: ['notice-received', 'collective'] },
      { v: 'informal', label: 'An informal request to extend', matter: 'informal-lease-extension', tags: ['informal'] },
      { v: 'tribunal', label: 'A tribunal application', matter: 'statutory-lease-extension', tags: ['tribunal'] },
      { v: 'nothing', label: 'Nothing yet, I want to offer extensions', matter: 'informal-lease-extension', tags: ['landlord-initiated'] }] },
    { id: 'l_count', when: { role: ['landlord'] }, q: 'How many leases does this involve?', type: 'single', grid: true, options: [
      { v: 'one', label: 'Just one' }, { v: 'few', label: '2 to 5', tags: ['multiple-leases'] },
      { v: 'many', label: 'More than 5', tags: ['multiple-leases'] }, { v: 'block', label: 'The whole building', tags: ['multiple-leases'] }] },

    // Years left on the lease
    { id: 'years', when: { role: ['leaseholder'] }, q: 'Roughly how many years are left on the lease?', type: 'single', grid: true, options: YEARS },
    { id: 'years_other', when: { role: ['landlord', 'selling', 'variation'] }, q: 'Roughly how many years are left on the lease?', type: 'single', grid: true, options: NO_MATTER(YEARS) },
    { id: 'g_years', when: { role: ['group'] }, q: 'Roughly how many years are left on most of the leases?', type: 'single', grid: true, options: NO_MATTER(YEARS) },

    // Leaseholders extending
    { id: 'route', when: { role: ['leaseholder'], '!ptype': ['house'] }, q: 'How are you hoping to do it?', type: 'single', options: ROUTE },
    { id: 'route_house', when: { role: ['leaseholder'], ptype: ['house'] }, q: 'What would you like to do?', type: 'single', options: [
      { v: 'freehold', label: 'Buy the freehold of my house', matter: 'statutory-lease-extension', tags: ['freehold-purchase'] },
      ...ROUTE] },
    { id: 'owned', when: { role: ['leaseholder', 'selling'] }, q: 'Have you owned it for at least two years?', type: 'single', options: [
      { v: 'yes', label: 'Yes' },
      { v: 'no', label: 'No, less than two years', tags: ['under-two-years'] },
      { v: 'unsure', label: 'I’m not sure' }] },
    { id: 'landlord', when: { role: ['leaseholder', 'selling', 'variation'] }, q: 'Who is your landlord?', type: 'single', options: [
      { v: 'private', label: 'A private freeholder or investment company' },
      { v: 'council', label: 'A council or housing association', tags: ['social-landlord'] },
      { v: 'rmc', label: 'A company owned by the residents', tags: ['resident-freeholder'] },
      { v: 'missing', label: 'I can’t trace the landlord', tags: ['missing-landlord'] },
      { v: 'unsure', label: 'I’m not sure' }] },

    // Where it is up to
    { id: 'notice', when: { role: ['leaseholder', 'selling'] }, q: 'Has a notice been sent to the landlord yet?', type: 'single', options: [
      { v: 'no', label: 'No, not yet' },
      { v: 'served', label: 'Yes, a notice has been served', tags: ['notice-served'] },
      { v: 'counter', label: 'Yes, and the landlord has replied with a counter notice', tags: ['notice-served', 'counter-notice'] },
      { v: 'tribunal', label: 'It’s gone to the tribunal', tags: ['notice-served', 'tribunal'] }] },
    { id: 'g_stage', when: { role: ['group'] }, q: 'Where are you up to?', type: 'single', options: [
      { v: 'early', label: 'We’re just getting started' },
      { v: 'organised', label: 'We’ve got enough owners together', tags: ['group-agreed'] },
      { v: 'served', label: 'A notice has been served on the freeholder', tags: ['notice-served'] },
      { v: 'counter', label: 'The freeholder has replied with a counter notice', tags: ['notice-served', 'counter-notice'] },
      { v: 'tribunal', label: 'It’s gone to the tribunal', tags: ['notice-served', 'tribunal'] }] },
    { id: 'notice_date', when: { notice: ['served', 'counter', 'tribunal'] }, q: 'What date was the notice served?', type: 'date', deadline: true, optional: true, past: true },
    { id: 'g_notice_date', when: { g_stage: ['served', 'counter', 'tribunal'] }, q: 'What date was the notice served?', type: 'date', deadline: true, optional: true, past: true },
    { id: 'l_notice_date', when: { l_received: ['notice', 'collective', 'tribunal'] }, q: 'What date is on the notice you received?', type: 'date', deadline: true, optional: true, past: true },

    // Lease variations
    { id: 'v_change', when: { role: ['variation'] }, q: 'What needs changing in the lease?', type: 'multi', options: [
      { v: 'errors', label: 'Mistakes or missing clauses', tags: ['defective-lease'] },
      { v: 'lender', label: 'Changes a mortgage lender has asked for', tags: ['lender-required'] },
      { v: 'charges', label: 'Service charge or insurance clauses' },
      { v: 'alterations', label: 'Alterations, pets or subletting rules' },
      { v: 'rent', label: 'The ground rent', tags: ['ground-rent-change'] },
      { v: 'other', label: 'Something else' }] },
    { id: 'v_agreed', when: { role: ['variation'] }, q: 'Does the landlord agree to the change?', type: 'single', options: [
      { v: 'yes', label: 'Yes, they’ve agreed in principle', tags: ['agreed'] },
      { v: 'talking', label: 'We’re still discussing it' },
      { v: 'no', label: 'No, they don’t agree', tags: ['contested'] },
      { v: 'notasked', label: 'I haven’t asked yet' }] },

    // The key money figure
    { id: 'value', valueLabel: 'Flat value', q: 'Roughly what is the property worth today?', type: 'single', grid: true, options: [
      { v: 'v1', label: 'Under £150,000', value: { min: 0, max: 150000 } },
      { v: 'v2', label: '£150,000 to £250,000', value: { min: 150000, max: 250000 } },
      { v: 'v3', label: '£250,000 to £400,000', value: { min: 250000, max: 400000 } },
      { v: 'v4', label: '£400,000 to £750,000', value: { min: 400000, max: 750000 } },
      { v: 'v5', label: '£750,000 to £1.5 million', value: { min: 750000, max: 1500000 }, tags: ['high-value'] },
      { v: 'v6', label: 'More than £1.5 million', value: { min: 1500000, max: 10000000 }, tags: ['high-value', 'prime'] },
      { v: 'unsure', label: 'I’m not sure', wide: true }] },
    { id: 'rent', when: { '!role': ['variation'] }, q: 'How much is the ground rent?', type: 'single', options: [
      { v: 'none', label: 'Nothing or a peppercorn' },
      { v: 'low', label: 'Under £250 a year' },
      { v: 'mid', label: '£250 to £1,000 a year', tags: ['ground-rent'] },
      { v: 'high', label: 'More than £1,000 a year', tags: ['ground-rent', 'high-ground-rent'] },
      { v: 'rising', label: 'It doubles or goes up over time', tags: ['ground-rent', 'escalating-ground-rent'] },
      { v: 'unsure', label: 'I’m not sure' }] },
    { id: 'mortgage', when: { role: ['leaseholder', 'selling', 'variation'] }, q: 'Is there a mortgage on the property?', type: 'single', options: [
      { v: 'yes', label: 'Yes', tags: ['mortgage'] },
      { v: 'no', label: 'No' }] },
    { id: 'sale', when: { role: ['leaseholder', 'group'] }, q: 'Are you planning to sell?', type: 'single', options: [
      { v: 'buyer', label: 'Yes, and I have a buyer', tags: ['selling', 'sale-agreed'] },
      { v: 'market', label: 'Yes, it’s on the market', tags: ['selling'] },
      { v: 'later', label: 'Maybe in the next year or two' },
      { v: 'no', label: 'No, I’m staying put' }] },
    { id: 's_stage', when: { role: ['selling'] }, q: 'Where are you up to with the sale?', type: 'single', options: [
      { v: 'buyer', label: 'I’ve accepted an offer', tags: ['sale-agreed'] },
      { v: 'fallen', label: 'A sale fell through because of the lease', tags: ['sale-fallen-through'] },
      { v: 'market', label: 'It’s on the market', tags: ['on-market'] },
      { v: 'soon', label: 'It’s not on the market yet' }] },
    { id: 's_assign', when: { role: ['selling'] }, q: 'Would you like the lease extended before you sell, or passed to the buyer?', type: 'single', options: [
      { v: 'before', label: 'Extended before the sale completes' },
      { v: 'assign', label: 'Start it and pass the claim to the buyer', tags: ['assign-notice'] },
      { v: 'unsure', label: 'I’d like to talk it through' }] },
  ],
  urgency: { q: 'How soon do you need help with the lease?' },
  exits: {
    commercial: { reason: 'The firm we work with through Leaflegal handles residential leases only, so it can’t take on shop, office or other business leases. The Law Society directory lists solicitors who specialise in commercial property.',
      links: [['https://solicitors.lawsociety.org.uk/', 'Find a Solicitor (Law Society)'], ['https://www.ricsfirms.com/', 'Find a surveyor (RICS)']] },
    dispute: { reason: 'The firm we work with takes on lease extensions and freehold purchases rather than service charge, repair or management disputes. These services give free information and explain how the tribunal works.',
      links: [LEASE, FTT, ['https://www.citizensadvice.org.uk/housing/', 'Housing help (Citizens Advice)']] },
    renting: { reason: 'Lease extensions are for people who own a leasehold home. If you rent from a landlord, these services can help with your tenancy.',
      links: [['https://england.shelter.org.uk/housing_advice', 'Housing advice (Shelter)'], ['https://www.citizensadvice.org.uk/housing/renting-privately/', 'Renting privately (Citizens Advice)'], GOV('private-renting', 'Private renting (GOV.UK)')] },
    research: { reason: 'It sounds like you’re still weighing things up. Come back when you’re ready to speak to someone. Until then, these pages explain how leasehold works.',
      links: [GOV('leasehold-property', 'Leasehold property (GOV.UK)'), LEASE] },
  },
};
