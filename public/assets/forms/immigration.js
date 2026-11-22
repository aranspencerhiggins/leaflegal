// Immigration enquiry form, copied from the LoanLeaf immigration funnel (employer and individual paths, can't-help exits).
// Referral only. Leaflegal never gives immigration advice, so questions only sort the enquiry for a regulated adviser.
// Format: see assets/form-options.js.
const GOV = (p, t) => [`https://www.gov.uk/${p}`, t];

export default {
  payNote: 'immFees',
  defaultMatter: null,
  steps: [
    { id: 'who', q: 'What do you need help with?', type: 'single', icons: true, options: [
      { v: 'employer', label: 'Hiring or sponsoring overseas staff', ico: 'office', audience: 'business', matter: 'sponsor-licences', tags: ['employer'] },
      { v: 'individual', label: 'A visa for me or my family', ico: 'person' },
      { v: 'seeker', label: 'I’m looking for a UK employer to sponsor me', ico: 'look', exit: 'sponsor' }] },

    // Employers
    { id: 'e_status', when: { who: ['employer'] }, q: 'Does your business hold a sponsor licence?', type: 'single', options: [
      { v: 'none', label: 'No', tags: ['no-licence'] },
      { v: 'considering', label: 'No, but we’re thinking about applying', tags: ['no-licence'] },
      { v: 'holds', label: 'Yes, we already hold one', tags: ['licence-holder'] }] },
    { id: 'e_help', when: { who: ['employer'] }, q: 'Which of these does your business need?', type: 'multi', options: [
      { v: 'licence', label: 'Applying for a sponsor licence', tags: ['sponsor-licence'] },
      { v: 'cos', label: 'Certificates of Sponsorship', tags: ['cos'] },
      { v: 'recruit', label: 'Recruiting workers from overseas', tags: ['recruitment'] },
      { v: 'compliance', label: 'Compliance and Home Office audits', tags: ['compliance'] },
      { v: 'founder', label: 'Global Talent or Innovator Founder', tags: ['founder'] }] },
    { id: 'e_company', when: { who: ['employer'] }, q: 'What is the name of your company?', type: 'company', placeholder: 'Company name' },
    { id: 'e_sector', when: { who: ['employer'] }, q: 'Which sector are you in?', type: 'single', grid: true, options: [
      { v: 'care', label: 'Health and social care', tags: ['care-sector'] }, { v: 'hosp', label: 'Hospitality and food' },
      { v: 'tech', label: 'Technology and digital' }, { v: 'eng', label: 'Engineering and construction' },
      { v: 'edu', label: 'Education and research' }, { v: 'retail', label: 'Retail, logistics and manufacturing' },
      { v: 'fin', label: 'Finance and professional services' }, { v: 'other', label: 'Something else' }] },
    { id: 'e_size', when: { who: ['employer'] }, q: 'Roughly how many people work there?', type: 'single', grid: true, options: [
      { v: 's1', label: '1 to 9' }, { v: 's2', label: '10 to 49' }, { v: 's3', label: '50 to 249', tags: ['large-employer'] }, { v: 's4', label: '250 or more', tags: ['large-employer'] }] },
    { id: 'e_hires', when: { who: ['employer'] }, q: 'How many overseas workers do you expect to sponsor this year?', type: 'single', grid: true, options: [
      { v: 'h1', label: 'One' }, { v: 'h2', label: '2 to 5' }, { v: 'h3', label: '6 to 20', tags: ['volume-hiring'] }, { v: 'h4', label: 'More than 20', tags: ['volume-hiring'] },
      { v: 'h0', label: 'None, it’s for staff we already sponsor', wide: true }] },

    // Individuals
    { id: 'i_service', when: { who: ['individual'] }, q: 'Which visa or application is it?', type: 'single', options: [
      { v: 'skilled', label: 'Skilled Worker or another work visa', matter: 'work-visas', tags: ['work-visa'] },
      { v: 'partner', label: 'Spouse or partner visa', matter: 'spouse-and-partner-visas', tags: ['partner-visa'] },
      { v: 'family', label: 'Visa for a child, parent or other relative', matter: 'family-visas', tags: ['family-visa'] },
      { v: 'ilr', label: 'Indefinite leave to remain', matter: 'settlement', tags: ['settlement'] },
      { v: 'citizen', label: 'British citizenship', matter: 'british-citizenship', tags: ['citizenship'] },
      { v: 'eu', label: 'EU Settlement Scheme', matter: 'eu-settlement-scheme', tags: ['euss'] },
      { v: 'refused', label: 'A refusal, appeal or judicial review', matter: 'refusals-and-appeals', tags: ['refusal'] },
      { v: 'visitor', label: 'Standard Visitor visa', matter: 'visitor-visas', tags: ['visitor'] },
      { v: 'talent', label: 'Global Talent or Innovator Founder', matter: 'talent-and-founder-visas', tags: ['founder'] },
      { v: 'asylum', label: 'Asylum or refugee protection', exit: 'asylum' },
      { v: 'general', label: 'Just a general question', exit: 'info' }] },
    { id: 'i_joboffer', when: { i_service: ['skilled'] }, q: 'Do you have a job offer from a UK employer?', type: 'single', options: [
      { v: 'yes', label: 'Yes, and they hold a sponsor licence', tags: ['job-offer'] },
      { v: 'unsure', label: 'Yes, but I’m not sure about their licence', tags: ['job-offer'] },
      { v: 'no', label: 'No, I’m still looking for a sponsor', exit: 'sponsor' }] },
    { id: 'i_refusal', when: { i_service: ['refused'] }, q: 'What stage is it at?', type: 'single', options: [
      { v: 'decision', label: 'I’ve just had a refusal letter', tags: ['refusal-letter'] },
      { v: 'appeal', label: 'I have an appeal or tribunal hearing coming up', tags: ['court-date'] },
      { v: 'removal', label: 'I’ve been told I must leave the UK', tags: ['removal'] },
      { v: 'other', label: 'Something else' }] },
    { id: 'i_refusal_date', when: { i_service: ['refused'] }, q: 'What date is on the refusal letter or hearing notice?', type: 'date', deadline: true, optional: true, past: true },
    { id: 'i_nationality', when: { who: ['individual'] }, q: 'What is your nationality?', type: 'text', list: 'nationality', placeholder: 'Start typing, for example Indian', validate: 'nationality' },
    { id: 'i_status', when: { who: ['individual'] }, q: 'What is your current immigration status?', type: 'single', options: [
      { v: 'visa', label: 'In the UK on a visa', tags: ['in-uk'] },
      { v: 'settled', label: 'In the UK with settled or pre-settled status', tags: ['in-uk'] },
      { v: 'expired', label: 'In the UK, but my visa has expired or been refused', tags: ['in-uk', 'overstay-risk'] },
      { v: 'outside', label: 'Outside the UK', tags: ['outside-uk'] },
      { v: 'british', label: 'British or Irish, applying for a family member', tags: ['sponsor-family'] }] },
    { id: 'i_deadline', when: { i_status: ['visa', 'expired'] }, q: 'When does your current visa run out?', type: 'date', deadline: true, optional: true, past: { i_status: ['expired'] } },
    { id: 'i_people', when: { who: ['individual'], '!i_service': ['citizen'] }, q: 'How many people is the application for?', type: 'single', grid: true, options: [
      { v: 'p1', label: 'Just one' }, { v: 'p2', label: 'Two' }, { v: 'p3', label: 'Three or four', tags: ['multi-applicant'] }, { v: 'p5', label: 'Five or more', tags: ['multi-applicant'] }] },
    { id: 'i_before', when: { who: ['individual'] }, q: 'Have you used an immigration lawyer or adviser for this before?', type: 'single', options: [
      { v: 'no', label: 'No, this is the first time' },
      { v: 'yes', label: 'Yes, and I want someone new' },
      { v: 'diy', label: 'No, I applied myself before', tags: ['previous-diy'] }] },
  ],
  urgency: { q: 'When do you need this in place?' },
  exits: {
    sponsor: { reason: 'The regulated advisers we work with help employers, and people who already have a route into the UK. They can’t find you a job or a sponsor. These official pages can help with your search.',
      links: [GOV('government/publications/register-of-licensed-sponsors-workers', 'Register of licensed sponsors (GOV.UK)'), GOV('skilled-worker-visa', 'Skilled Worker visa (GOV.UK)')] },
    asylum: { reason: 'Asylum and refugee protection are outside the services the advisers we work with offer. You may be able to get free specialist help, including legal aid.',
      links: [GOV('claim-asylum', 'Claim asylum in the UK (GOV.UK)'), GOV('check-legal-aid', 'Check if you can get legal aid (GOV.UK)'), ['https://www.refugeecouncil.org.uk/', 'Refugee Council']] },
    free: { reason: 'The advisers we work with charge for their advice, so they can’t help with free advice. These services give free, reliable information.',
      links: [GOV('browse/visas-immigration', 'Visas and immigration (GOV.UK)'), ['https://www.citizensadvice.org.uk/immigration/', 'Citizens Advice immigration help'], GOV('find-an-immigration-adviser', 'Find a regulated immigration adviser (GOV.UK)')] },
    info: { reason: 'The advisers we work with take on applications and employer work rather than general questions. The official guidance answers most questions and is kept up to date.',
      links: [GOV('check-uk-visa', 'Check if you need a UK visa (GOV.UK)'), GOV('browse/visas-immigration', 'Visas and immigration (GOV.UK)')] },
    research: { reason: 'It sounds like you’re still weighing up your options. Come back when you have a timeframe in mind. Until then, these pages are a good place to start.',
      links: [GOV('check-uk-visa', 'Check if you need a UK visa (GOV.UK)'), GOV('uk-visa-sponsorship-employers', 'Sponsoring workers, guidance for employers (GOV.UK)')] },
  },
};
