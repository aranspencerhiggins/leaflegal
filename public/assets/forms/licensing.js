// Licensing enquiry form. Alcohol, entertainment and late night refreshment premises licences, personal licences,
// DPS changes, reviews and hearings, taxi and private hire licences, and other council licences.
// Exits for things that aren't licensing law work, such as a TV licence or a driving licence.
// Format: see assets/form-options.js.
const GOV = (p, t) => [`https://www.gov.uk/${p}`, t];
const PREMISES = ['newprem', 'vary', 'transfer', 'review', 'other'];

export default {
  defaultMatter: 'other-licensing',
  steps: [
    { id: 'need', q: 'What do you need help with?', type: 'single', icons: true, options: [
      { v: 'newprem', label: 'A new premises licence', sub: 'For selling alcohol, live music, late night food or events', ico: 'building', audience: 'business', matter: 'premises-licence-applications', tags: ['premises-licence', 'new-application'] },
      { v: 'vary', label: 'Changing an existing premises licence', sub: 'Longer hours, new activities, a new layout or conditions', ico: 'doc', audience: 'business', matter: 'licence-variations', tags: ['premises-licence', 'variation'] },
      { v: 'transfer', label: 'Transferring a licence or changing the DPS', sub: 'Buying or taking over a business, or a new designated premises supervisor', ico: 'key', audience: 'business', matter: 'transfers-and-dps', tags: ['premises-licence', 'transfer'] },
      { v: 'review', label: 'A licence review, hearing or closure', sub: 'The police, council or residents have raised concerns', ico: 'gavel', audience: 'business', matter: 'licence-reviews', tags: ['premises-licence', 'review'] },
      { v: 'personal', label: 'A personal licence', sub: 'Applying, or a licence at risk because of a conviction', ico: 'person', audience: 'individual', matter: 'personal-licences', tags: ['personal-licence'] },
      { v: 'taxi', label: 'A taxi or private hire licence', sub: 'Drivers, vehicles and operators', ico: 'car', matter: 'taxi-and-private-hire-licences', tags: ['taxi'] },
      { v: 'object', label: 'Objecting to a licence near me', sub: 'A new application or a venue causing problems', ico: 'home', audience: 'individual', matter: 'licence-reviews', tags: ['objector'] },
      { v: 'other', label: 'Another licence from the council', sub: 'Gambling, events, street trading and more', ico: 'badge', audience: 'business', matter: 'other-licensing' },
      { v: 'notlicensing', label: 'A TV licence, driving licence or something else', ico: 'other', exit: 'notlicensing' }] },

    // Other council licences
    { id: 'o_type', when: { need: ['other'] }, q: 'Which licence is it?', type: 'single', options: [
      { v: 'ten', label: 'A temporary event notice', tags: ['temporary-event'] },
      { v: 'gambling', label: 'A gambling premises licence or gaming machine permit', tags: ['gambling'] },
      { v: 'sev', label: 'A sexual entertainment venue licence', tags: ['sex-establishment'] },
      { v: 'street', label: 'Street trading or a market pitch', tags: ['street-trading'] },
      { v: 'scrap', label: 'A scrap metal dealer licence', tags: ['scrap-metal'] },
      { v: 'hmo', label: 'An HMO or landlord licence', exit: 'housing' },
      { v: 'other', label: 'Something else', tags: ['other-licence'] }] },

    // Premises
    { id: 'p_company', when: { need: PREMISES }, q: 'What is the name of the business?', type: 'company', placeholder: 'Company name' },
    { id: 'p_role', when: { need: PREMISES }, q: 'What is your role?', type: 'single', options: [
      { v: 'operator', label: 'I run the business or hold the licence', tags: ['licence-holder'] },
      { v: 'buyer', label: 'I’m buying or taking over the business', tags: ['acquisition'] },
      { v: 'landlord', label: 'I own the building', tags: ['landlord'] },
      { v: 'group', label: 'I manage several sites for a group or pub company', tags: ['multi-site'] }] },
    { id: 'p_type', when: { need: PREMISES, '!o_type': ['scrap', 'street'] }, q: 'What type of premises is it?', type: 'single', grid: true, options: [
      { v: 'pub', label: 'Pub or bar', tags: ['pub'] },
      { v: 'restaurant', label: 'Restaurant or café', tags: ['restaurant'] },
      { v: 'club', label: 'Nightclub or late venue', tags: ['late-night'] },
      { v: 'shop', label: 'Shop, off licence or supermarket', tags: ['off-sales'] },
      { v: 'hotel', label: 'Hotel or guest house', tags: ['hotel'] },
      { v: 'venue', label: 'Event venue or festival', tags: ['events'] },
      { v: 'takeaway', label: 'Takeaway or late night food', tags: ['late-night-refreshment'] },
      { v: 'members', label: 'Members’ club', tags: ['members-club'] },
      { v: 'online', label: 'Online or delivery only', tags: ['delivery'] },
      { v: 'other', label: 'Something else' }] },
    { id: 'p_turnover', when: { need: PREMISES }, q: 'Roughly what is the yearly turnover of the premises?', type: 'single', grid: true, valueLabel: 'Annual turnover', options: [
      { v: 't0', label: 'Not trading yet', tags: ['new-venture'] },
      { v: 't1', label: 'Under £100,000', value: { min: 0, max: 100000 } },
      { v: 't2', label: '£100,000 to £250,000', value: { min: 100000, max: 250000 } },
      { v: 't3', label: '£250,000 to £1 million', value: { min: 250000, max: 1000000 } },
      { v: 't4', label: '£1 million to £5 million', value: { min: 1000000, max: 5000000 }, tags: ['high-value'] },
      { v: 't5', label: 'Over £5 million', value: { min: 5000000, max: 50000000 }, tags: ['high-value'] },
      { v: 'unsure', label: 'I’d rather not say', wide: true }] },

    // New licence or variation
    { id: 'n_activities', when: { need: ['newprem', 'vary'] }, q: 'Which activities does it cover?', type: 'multi', options: [
      { v: 'on', label: 'Selling alcohol to drink on the premises', tags: ['on-sales'] },
      { v: 'off', label: 'Selling alcohol to take away or deliver', tags: ['off-sales'] },
      { v: 'music', label: 'Live or recorded music, dancing or performances', tags: ['regulated-entertainment'] },
      { v: 'food', label: 'Hot food or drink after 11pm', tags: ['late-night-refreshment'] },
      { v: 'late', label: 'Opening after midnight', tags: ['late-hours'] },
      { v: 'outdoor', label: 'Outdoor areas, terraces or pavement seating', tags: ['outdoor-area'] }] },
    { id: 'v_change', when: { need: ['vary'] }, q: 'What do you want to change?', type: 'multi', options: [
      { v: 'hours', label: 'Longer opening or licensed hours', tags: ['extend-hours'] },
      { v: 'activities', label: 'Adding new activities' },
      { v: 'layout', label: 'The layout or plan of the premises', tags: ['plan-change'] },
      { v: 'conditions', label: 'Removing or changing conditions', tags: ['conditions'] },
      { v: 'minor', label: 'A small change that shouldn’t affect anyone', tags: ['minor-variation'] }] },
    { id: 'n_stage', when: { need: ['newprem', 'vary'] }, q: 'Where are you with the application?', type: 'single', options: [
      { v: 'planning', label: 'Not started yet', tags: ['pre-application'] },
      { v: 'submitted', label: 'Submitted and waiting', tags: ['application-submitted'] },
      { v: 'objections', label: 'Objections or representations have been made', tags: ['representations'] },
      { v: 'refused', label: 'It was refused or granted with conditions I can’t accept', tags: ['appeal'] }] },
    { id: 'n_cia', when: { need: ['newprem', 'vary'] }, q: 'Is the premises in a cumulative impact area?', type: 'single', options: [
      { v: 'yes', label: 'Yes', tags: ['cumulative-impact'] },
      { v: 'no', label: 'No' },
      { v: 'unsure', label: 'I’m not sure' }] },
    // Transfers and DPS
    { id: 't_what', when: { need: ['transfer'] }, q: 'What needs to happen?', type: 'multi', options: [
      { v: 'transfer', label: 'Transfer the premises licence to a new holder', tags: ['licence-transfer'] },
      { v: 'dps', label: 'Change the designated premises supervisor', tags: ['dps'] },
      { v: 'interim', label: 'The licence holder has died, become insolvent or lost capacity', tags: ['interim-authority', 'urgent'] },
      { v: 'lapsed', label: 'The licence may have lapsed or been surrendered', tags: ['lapsed-licence'] },
      { v: 'diligence', label: 'Checking the licence before buying', tags: ['due-diligence'] }] },
    { id: 't_police', when: { need: ['transfer'] }, q: 'Have the police objected?', type: 'single', options: [
      { v: 'no', label: 'No' },
      { v: 'yes', label: 'Yes', tags: ['police-objection'] },
      { v: 'notyet', label: 'Nothing has been submitted yet' }] },

    // Reviews and enforcement
    { id: 'r_who', when: { need: ['review'] }, q: 'Who has raised the concerns?', type: 'multi', options: [
      { v: 'police', label: 'The police', tags: ['police-review'] },
      { v: 'council', label: 'The council licensing or environmental health team', tags: ['council-review'] },
      { v: 'trading', label: 'Trading Standards', tags: ['trading-standards'] },
      { v: 'home', label: 'The Home Office', tags: ['illegal-working'] },
      { v: 'residents', label: 'Local residents or businesses', tags: ['resident-complaints'] }] },
    { id: 'r_issue', when: { need: ['review'] }, q: 'What are the concerns about?', type: 'multi', options: [
      { v: 'noise', label: 'Noise or nuisance', tags: ['noise'] },
      { v: 'crime', label: 'Crime, violence or disorder', tags: ['crime-disorder'] },
      { v: 'underage', label: 'Underage sales', tags: ['underage-sales'] },
      { v: 'drugs', label: 'Drugs on the premises', tags: ['drugs'] },
      { v: 'working', label: 'Illegal working', tags: ['illegal-working'] },
      { v: 'conditions', label: 'Breaching licence conditions', tags: ['breach-of-conditions'] },
      { v: 'other', label: 'Something else' }] },
    { id: 'r_stage', when: { need: ['review'] }, q: 'What has happened so far?', type: 'single', options: [
      { v: 'warning', label: 'A warning letter or a visit', tags: ['early-stage'] },
      { v: 'application', label: 'A review application has been made', tags: ['review-application'] },
      { v: 'summary', label: 'An expedited review or interim steps by the police', tags: ['summary-review', 'urgent'] },
      { v: 'closure', label: 'A closure notice or closure order', tags: ['closure-order', 'urgent'] },
      { v: 'decided', label: 'The licence has been suspended or revoked', tags: ['revocation', 'appeal'] },
      { v: 'prosecution', label: 'We’re being prosecuted', tags: ['prosecution'] }] },

    // Personal licences
    { id: 'pl_issue', when: { need: ['personal'] }, q: 'What is happening with your personal licence?', type: 'single', options: [
      { v: 'apply', label: 'I want to apply for one', tags: ['new-application'] },
      { v: 'conviction', label: 'I’m applying and I have a conviction', tags: ['conviction'] },
      { v: 'objection', label: 'The police or Home Office have objected', tags: ['police-objection'] },
      { v: 'revoke', label: 'The council wants to suspend or revoke it', tags: ['revocation'] },
      { v: 'charged', label: 'I’ve been charged with an offence', tags: ['conviction', 'criminal'] },
      { v: 'admin', label: 'It’s lost, or my details have changed', tags: ['admin'] },
      { v: 'course', label: 'I need to find the qualification course', exit: 'course' }] },
    { id: 'pl_dps', when: { need: ['personal'] }, q: 'Are you, or will you be, a designated premises supervisor?', type: 'single', options: [
      { v: 'yes', label: 'Yes', tags: ['dps'] },
      { v: 'soon', label: 'Yes, for a new job or venue', tags: ['dps'] },
      { v: 'no', label: 'No' }] },

    // Taxi and private hire
    { id: 'tx_role', when: { need: ['taxi'] }, q: 'Which licence is it?', type: 'single', options: [
      { v: 'hackney', label: 'Hackney carriage driver', sub: 'A black cab or taxi you can hail', audience: 'individual', tags: ['driver', 'hackney'] },
      { v: 'phv', label: 'Private hire driver', sub: 'Including app based work', audience: 'individual', tags: ['driver', 'private-hire'] },
      { v: 'vehicle', label: 'A vehicle licence', audience: 'individual', tags: ['vehicle-licence'] },
      { v: 'operator', label: 'A private hire operator licence', sub: 'Running a taxi or private hire firm', audience: 'business', tags: ['operator'] }] },
    { id: 'tx_company', when: { tx_role: ['operator'] }, q: 'What is the name of your business?', type: 'company', placeholder: 'Company name' },
    { id: 'tx_fleet', when: { tx_role: ['operator'] }, q: 'How many vehicles do you run?', type: 'single', grid: true, options: [
      { v: 'f1', label: '1 to 10' }, { v: 'f2', label: '11 to 50' }, { v: 'f3', label: '51 to 200', tags: ['large-operator'] }, { v: 'f4', label: 'More than 200', tags: ['large-operator'] }] },
    { id: 'tx_issue', when: { need: ['taxi'] }, q: 'What is happening?', type: 'single', options: [
      { v: 'apply', label: 'A new application or renewal', tags: ['new-application'] },
      { v: 'concern', label: 'Applying with a conviction, points or a past complaint', tags: ['conviction'] },
      { v: 'refused', label: 'My application or renewal was refused', tags: ['refusal', 'appeal'] },
      { v: 'suspended', label: 'My licence has been suspended or revoked', tags: ['revocation', 'appeal'] },
      { v: 'committee', label: 'I’ve been called to a licensing committee or interview', tags: ['committee-hearing'] },
      { v: 'complaint', label: 'A complaint or investigation by the council', tags: ['investigation'] }] },
    { id: 'tx_working', when: { tx_issue: ['suspended'] }, q: 'Can you still work while this is sorted out?', type: 'single', options: [
      { v: 'yes', label: 'Yes, for now' },
      { v: 'no', label: 'No, it took effect straight away', tags: ['immediate-suspension', 'urgent'] },
      { v: 'unsure', label: 'I’m not sure' }] },
    { id: 'tx_letter', when: { tx_issue: ['refused', 'suspended'] }, q: 'What date is on the council’s decision letter?', type: 'date', deadline: true, optional: true, past: true },
    { id: 'tx_council', when: { need: ['taxi'] }, q: 'Which council issued or is considering the licence?', type: 'text', placeholder: 'For example Leeds City Council', validate: 'text', optional: true },

    // Objectors
    { id: 'obj_what', when: { need: ['object'] }, q: 'What are you objecting to?', type: 'single', options: [
      { v: 'new', label: 'A new licence application', tags: ['new-application'] },
      { v: 'variation', label: 'A venue asking for longer hours or changes', tags: ['variation'] },
      { v: 'existing', label: 'A venue that is already causing problems', tags: ['review'] }] },
    { id: 'obj_issue', when: { need: ['object'] }, q: 'What is the problem?', type: 'multi', options: [
      { v: 'noise', label: 'Noise late at night', tags: ['noise'] },
      { v: 'crime', label: 'Crime, fights or antisocial behaviour', tags: ['crime-disorder'] },
      { v: 'safety', label: 'Public safety', tags: ['public-safety'] },
      { v: 'children', label: 'Risk to children', tags: ['protecting-children'] },
      { v: 'other', label: 'Something else' }] },
    { id: 'obj_group', when: { need: ['object'] }, q: 'Are you objecting on your own or as a group?', type: 'single', options: [
      { v: 'self', label: 'On my own' },
      { v: 'group', label: 'With neighbours or a residents’ group', tags: ['residents-group'] },
      { v: 'business', label: 'For a nearby business', audience: 'business', tags: ['business-objector'] }] },

    // Hearings, for anything that might go before a licensing committee or the magistrates
    { id: 'hearing', when: { '!need': ['transfer'], '!pl_issue': ['apply', 'admin'], '!tx_issue': ['apply'] }, q: 'Is there a hearing date?', type: 'single', options: [
      { v: 'yes', label: 'Yes, a date has been set', tags: ['court-date'] },
      { v: 'expected', label: 'Not yet, but I expect one', tags: ['hearing-expected'] },
      { v: 'no', label: 'No' }] },
    { id: 'hearing_date', when: { hearing: ['yes'] }, q: 'When is the hearing?', type: 'date', deadline: true, optional: true },
  ],
  urgency: { q: 'When do you need this sorted?' },
  exits: {
    notlicensing: { reason: 'The firms we work with on Leaflegal help with alcohol, entertainment, taxi and other council licences. TV licences and driving licences are dealt with by the organisations below.',
      links: [['https://www.tvlicensing.co.uk/', 'TV Licensing'], GOV('browse/driving/driving-licences', 'Driving licences (GOV.UK)'), ['https://solicitors.lawsociety.org.uk/', 'Find a Solicitor (Law Society)']] },
    housing: { reason: 'HMO and selective landlord licences are housing matters rather than the premises and taxi licensing the firms we work with take on through Leaflegal. These pages explain how they work.',
      links: [GOV('house-in-multiple-occupation-licence', 'House in multiple occupation licence (GOV.UK)'), ['https://solicitors.lawsociety.org.uk/', 'Find a Solicitor (Law Society)']] },
    course: { reason: 'The personal licence qualification is a short course run by accredited training providers, so you don’t need a solicitor for it. These pages explain how to get your licence.',
      links: [GOV('guidance/alcohol-licensing', 'Alcohol licensing (GOV.UK)'), GOV('find-local-council', 'Find your local council (GOV.UK)')] },
    research: { reason: 'It sounds like you’re still weighing things up. Come back when you’re ready to speak to someone. Until then, these pages are a good place to start.',
      links: [GOV('guidance/alcohol-licensing', 'Alcohol licensing (GOV.UK)'), GOV('find-local-council', 'Find your local council (GOV.UK)')] },
  },
};
