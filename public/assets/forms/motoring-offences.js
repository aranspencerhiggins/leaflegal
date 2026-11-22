// Motoring offences enquiry form. Criminal defence for road traffic offences in England and Wales.
// Parking tickets and PCNs are civil and leave early. Questions only sort the enquiry for the solicitor and never suggest a defence.
// Format: see assets/form-options.js.
const GOV = (p, t) => [`https://www.gov.uk/${p}`, t];

// Offences where a collision or injury matters.
const ROAD = ['drink', 'drug', 'careless', 'dangerous', 'insurance', 'other'];

export default {
  steps: [
    { id: 'offence', q: 'What are you accused of?', type: 'single', icons: true, options: [
      { v: 'speed', label: 'Speeding', ico: 'car', matter: 'speeding', tags: ['speeding'] },
      { v: 'drink', label: 'Drink driving', sub: 'Including being in charge of a vehicle or failing to give a sample', ico: 'gavel', matter: 'drink-driving', tags: ['drink-driving'] },
      { v: 'drug', label: 'Drug driving', sub: 'Including prescribed medicines', ico: 'gavel', matter: 'drug-driving', tags: ['drug-driving'] },
      { v: 'totting', label: 'Reaching 12 points', sub: 'A totting up ban', ico: 'badge', matter: 'totting-up', tags: ['totting-up', 'ban-risk'] },
      { v: 'careless', label: 'Careless driving', sub: 'Driving without due care and attention', ico: 'car', matter: 'careless-driving', tags: ['careless-driving'] },
      { v: 'dangerous', label: 'Dangerous driving', ico: 'shield', matter: 'dangerous-driving', tags: ['dangerous-driving', 'serious-offence'] },
      { v: 'fail', label: 'Failing to name the driver', sub: 'Not replying to a notice asking who was driving', ico: 'person', matter: 'failing-to-identify-the-driver', tags: ['failing-to-identify'] },
      { v: 'insurance', label: 'Driving without insurance', ico: 'doc', matter: 'driving-without-insurance', tags: ['no-insurance'] },
      { v: 'other', label: 'Another driving offence', sub: 'For example using a phone or failing to stop', ico: 'other', matter: 'other-motoring' },
      { v: 'parking', label: 'A parking ticket or PCN', sub: 'Including bus lane, congestion and clean air charges', ico: 'invoice', exit: 'civil' },
      { v: 'general', label: 'I haven’t been accused of anything', sub: 'Just a general question', ico: 'look', exit: 'nooffence' }] },

    { id: 'o_kind', when: { offence: ['other'] }, q: 'Which offence is it?', type: 'single', options: [
      { v: 'phone', label: 'Using a mobile phone while driving', tags: ['mobile-phone'] },
      { v: 'stop', label: 'Failing to stop or report an accident', tags: ['fail-to-stop'] },
      { v: 'disq', label: 'Driving while disqualified', tags: ['disqualified-driving', 'serious-offence'] },
      { v: 'licence', label: 'Driving without a valid licence', tags: ['no-licence'] },
      { v: 'signs', label: 'A red light or another traffic sign', tags: ['traffic-sign'] },
      { v: 'death', label: 'Causing death or serious injury by driving', tags: ['serious-injury', 'serious-offence'] },
      { v: 'else', label: 'Something else' }] },

    { id: 'f_who', when: { offence: ['fail'] }, q: 'Who received the notice?', type: 'single', options: [
      { v: 'me', label: 'I did, as the keeper of the vehicle' },
      { v: 'company', label: 'A company, for one of its vehicles', audience: 'business', tags: ['company-vehicle'] },
      { v: 'hire', label: 'I did, but it was a hire or lease vehicle', tags: ['hire-vehicle'] }] },
    { id: 'f_reason', when: { offence: ['fail'] }, q: 'Why wasn’t the driver named?', type: 'single', options: [
      { v: 'post', label: 'The notice didn’t reach me in time', tags: ['notice-not-received'] },
      { v: 'unknown', label: 'I don’t know who was driving', tags: ['driver-unknown'] },
      { v: 'shared', label: 'Several people drive the vehicle', tags: ['shared-vehicle'] },
      { v: 'else', label: 'Something else' }] },

    // Where things are up to
    { id: 'stage', q: 'Where are things up to?', type: 'single', options: [
      { v: 'stopped', label: 'I was stopped or caught on camera, nothing has arrived yet', tags: ['pre-nip'] },
      { v: 'nip', label: 'I’ve had a Notice of Intended Prosecution', tags: ['nip'] },
      { v: 'interview', label: 'The police want to interview me', tags: ['police-interview'] },
      { v: 'fixed', label: 'I’ve been offered a fixed penalty or a course', tags: ['fixed-penalty'] },
      { v: 'sjp', label: 'I’ve had a Single Justice Procedure Notice', tags: ['sjp'] },
      { v: 'summons', label: 'I’ve had a court summons or postal requisition', tags: ['summons'] },
      { v: 'charged', label: 'I was charged at the police station', tags: ['charged'] },
      { v: 'convicted', label: 'I’ve been convicted and want to appeal', tags: ['convicted', 'appeal'] },
      { v: 'banned', label: 'I’m banned and want to ask to end it early', tags: ['removal-of-ban'] }] },
    { id: 'court_date', when: { stage: ['sjp', 'summons', 'charged'] }, q: 'When is your court date or reply deadline?', type: 'date', deadline: true, optional: true },
    { id: 'notice_date', when: { stage: ['nip', 'fixed'] }, q: 'When did the notice arrive?', type: 'date', past: true, optional: true },
    { id: 'conviction_date', when: { stage: ['convicted'] }, q: 'When were you convicted?', type: 'date', past: true, optional: true },

    // Speeding
    { id: 's_limit', when: { offence: ['speed'] }, q: 'What was the speed limit?', type: 'single', grid: true, options: [
      { v: '20', label: '20 mph' }, { v: '30', label: '30 mph' }, { v: '40', label: '40 mph' },
      { v: '50', label: '50 mph' }, { v: '60', label: '60 mph' }, { v: '70', label: '70 mph', tags: ['motorway'] },
      { v: 'unsure', label: 'I’m not sure', wide: true }] },
    { id: 's_over', when: { offence: ['speed'] }, q: 'How far over the limit are you said to have been?', type: 'single', options: [
      { v: 'o1', label: 'Less than 10 mph over' },
      { v: 'o2', label: '10 to 20 mph over' },
      { v: 'o3', label: '21 to 30 mph over', tags: ['high-speed'] },
      { v: 'o4', label: 'More than 30 mph over', tags: ['high-speed', 'ban-risk'] },
      { v: 'unsure', label: 'I don’t know yet' }] },
    { id: 's_how', when: { offence: ['speed'] }, q: 'How was the speed recorded?', type: 'single', options: [
      { v: 'camera', label: 'A fixed or mobile camera', tags: ['camera'] },
      { v: 'average', label: 'Average speed cameras', tags: ['camera'] },
      { v: 'police', label: 'A police officer stopped me', tags: ['police-stop'] },
      { v: 'unsure', label: 'I’m not sure' }] },

    // Drink and drug driving
    { id: 'd_reading', when: { offence: ['drink'] }, q: 'What was the lowest breath reading, in microgrammes per 100ml?', type: 'single', options: [
      { v: 'r1', label: '36 to 59' },
      { v: 'r2', label: '60 to 89' },
      { v: 'r3', label: '90 to 119', tags: ['high-reading'] },
      { v: 'r4', label: '120 or more', tags: ['high-reading'] },
      { v: 'blood', label: 'It was a blood or urine test', tags: ['blood-urine'] },
      { v: 'refused', label: 'I didn’t give a sample', tags: ['failure-to-provide'] },
      { v: 'unsure', label: 'I don’t know' }] },
    { id: 'd_drug', when: { offence: ['drug'] }, q: 'What was the drug?', type: 'single', options: [
      { v: 'prescribed', label: 'A medicine I was prescribed', tags: ['prescription'] },
      { v: 'cannabis', label: 'Cannabis' },
      { v: 'cocaine', label: 'Cocaine' },
      { v: 'other', label: 'Something else or more than one' },
      { v: 'unsure', label: 'I don’t know yet', tags: ['awaiting-results'] }] },
    { id: 'd_driving', when: { offence: ['drink', 'drug'] }, q: 'Were you driving at the time?', type: 'single', options: [
      { v: 'driving', label: 'Yes, I was driving' },
      { v: 'charge', label: 'No, I was in or near a parked vehicle', tags: ['in-charge'] },
      { v: 'unsure', label: 'It’s disputed', tags: ['disputed'] }] },
    { id: 'd_previous', when: { offence: ['drink', 'drug'] }, q: 'Have you had a drink or drug driving conviction in the last 10 years?', type: 'single', options: [
      { v: 'no', label: 'No' },
      { v: 'yes', label: 'Yes', tags: ['repeat-offence'] }] },

    // Insurance
    { id: 'i_reason', when: { offence: ['insurance'] }, q: 'What happened with the insurance?', type: 'single', options: [
      { v: 'believed', label: 'I thought I was covered', tags: ['believed-insured'] },
      { v: 'cancelled', label: 'My policy was cancelled or ran out', tags: ['policy-lapsed'] },
      { v: 'borrowed', label: 'I was driving someone else’s vehicle', tags: ['borrowed-vehicle'] },
      { v: 'work', label: 'I was driving for work', tags: ['work-vehicle'] },
      { v: 'else', label: 'Something else' }] },

    // Collisions
    { id: 'collision', when: { offence: ROAD }, q: 'Was there a collision?', type: 'single', options: [
      { v: 'no', label: 'No' },
      { v: 'damage', label: 'Yes, but only damage to vehicles or property', tags: ['collision'] },
      { v: 'injury', label: 'Yes, and someone was hurt', tags: ['collision', 'injury'] }] },

    // Licence
    { id: 'points', when: { '!stage': ['banned'] }, q: 'How many points are on your licence now?', type: 'single', grid: true, options: [
      { v: 'p0', label: 'None' }, { v: 'p1', label: '1 to 3' }, { v: 'p2', label: '4 to 6' },
      { v: 'p3', label: '7 to 9', tags: ['ban-risk'] }, { v: 'p4', label: '10 or more', tags: ['ban-risk'] },
      { v: 'banned', label: 'I’m already banned', tags: ['already-banned'] }] },
    { id: 'held', when: { '!stage': ['banned'] }, q: 'How long have you had your full licence?', type: 'single', options: [
      { v: 'new', label: 'Less than 2 years', tags: ['new-driver'] },
      { v: 'est', label: '2 years or more' },
      { v: 'prov', label: 'I only have a provisional licence', tags: ['provisional'] },
      { v: 'foreign', label: 'I have a licence from outside the UK', tags: ['foreign-licence'] }] },
    { id: 'tu_previous', when: { offence: ['totting'] }, q: 'Have you asked a court not to ban you because of hardship in the last 3 years?', type: 'single', options: [
      { v: 'no', label: 'No' },
      { v: 'yes', label: 'Yes', tags: ['previous-hardship'] },
      { v: 'unsure', label: 'I’m not sure' }] },
    { id: 'hardship_tu', when: { offence: ['totting'] }, q: 'Would losing your licence cause serious problems for you or others?', type: 'single', options: [
      { v: 'job', label: 'Yes, I’d lose my job or business', matter: 'exceptional-hardship', tags: ['needs-licence', 'exceptional-hardship'] },
      { v: 'pro', label: 'Yes, I drive for a living', sub: 'For example HGV, taxi, delivery or sales', matter: 'exceptional-hardship', tags: ['needs-licence', 'professional-driver', 'exceptional-hardship'] },
      { v: 'care', label: 'Yes, people rely on me to drive them', sub: 'For example caring or school runs', matter: 'exceptional-hardship', tags: ['needs-licence', 'exceptional-hardship'] },
      { v: 'manage', label: 'It would be hard but I’d manage' },
      { v: 'no', label: 'No' }] },
    { id: 'hardship', when: { '!offence': ['totting'], '!stage': ['banned'] }, q: 'Do you need to keep driving?', type: 'single', options: [
      { v: 'job', label: 'Yes, my job or business depends on it', tags: ['needs-licence'] },
      { v: 'pro', label: 'Yes, I drive for a living', sub: 'For example HGV, taxi, delivery or sales', tags: ['needs-licence', 'professional-driver'] },
      { v: 'care', label: 'Yes, people rely on me to drive them', tags: ['needs-licence'] },
      { v: 'manage', label: 'It would be hard but I’d manage' },
      { v: 'no', label: 'No' }] },

    // Plea
    { id: 'plea', when: { '!stage': ['convicted', 'banned'] }, q: 'How are you thinking of pleading?', type: 'single', options: [
      { v: 'guilty', label: 'Guilty, I want help with the penalty', tags: ['guilty-plea'] },
      { v: 'not', label: 'Not guilty, I want to defend it', tags: ['not-guilty'] },
      { v: 'unsure', label: 'I’m not sure yet', tags: ['plea-undecided'] }] },
    { id: 'before', q: 'Have you had a solicitor for this before?', type: 'single', options: [
      { v: 'no', label: 'No, this is the first time' },
      { v: 'duty', label: 'Only the duty solicitor', tags: ['duty-solicitor'] },
      { v: 'new', label: 'Yes, and I want someone new', tags: ['switching-firm'] }] },
  ],
  exits: {
    civil: { reason: 'Parking tickets and penalty charge notices are civil matters rather than criminal offences, so the firms we work with don’t take them on. You can usually challenge them yourself and these services explain how.',
      links: [['https://www.trafficpenaltytribunal.gov.uk/', 'Traffic Penalty Tribunal (England outside London and Wales)'], ['https://www.londontribunals.gov.uk/', 'London Tribunals'], GOV('parking-tickets', 'Parking tickets (GOV.UK)')] },
    nooffence: { reason: 'The firms we work with defend people who have been accused of a driving offence. If nothing has happened yet, these official pages answer most general questions.',
      links: [GOV('penalty-points-endorsements', 'Penalty points and endorsements (GOV.UK)'), GOV('speeding-penalties', 'Speeding penalties (GOV.UK)'), GOV('driving-disqualifications', 'Driving bans (GOV.UK)')] },
    free: { reason: 'The firms we work with charge for their work, so they can’t help with free advice or legal aid cases. A duty solicitor may be able to help on the day at court, and these services can tell you more.',
      links: [GOV('check-legal-aid', 'Check if you can get legal aid (GOV.UK)'), ['https://www.citizensadvice.org.uk/law-and-courts/legal-system/', 'Citizens Advice, the legal system']] },
    research: { reason: 'It sounds like you’re still weighing things up. Come back when you’re ready to speak to someone, and keep an eye on any deadlines in your paperwork. Until then, these pages are a good place to start.',
      links: [GOV('penalty-points-endorsements', 'Penalty points and endorsements (GOV.UK)'), GOV('driving-disqualifications', 'Driving bans (GOV.UK)')] },
  },
};
