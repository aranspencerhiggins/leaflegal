// Trademarks and related IP enquiry form. UK wide, because there is one UK trademark register.
// Registration, searches, objections and oppositions, infringement and passing off, cease and desist letters,
// renewals and ownership changes, copyright and design rights. Patents are out of scope.
// Firms are SRA regulated solicitors or IPReg regulated chartered trade mark attorneys. General information only.
// Format: see assets/form-options.js.
const GOV = (p, t) => [`https://www.gov.uk/${p}`, t];
const TM = ['register', 'search', 'objection', 'copying', 'accused', 'letter', 'renew'];

export default {
  defaultMatter: 'other-ip',
  steps: [
    { id: 'need', q: 'What do you need help with?', type: 'single', icons: true, options: [
      { v: 'register', label: 'Registering a trademark', ico: 'tag', matter: 'trademark-registration', tags: ['registration'] },
      { v: 'search', label: 'Checking a name or logo is free to use', ico: 'look', matter: 'trademark-searches', tags: ['clearance-search'] },
      { v: 'objection', label: 'An objection or opposition at the UK IPO', ico: 'doc', matter: 'objections-and-oppositions', tags: ['ipo-proceedings'] },
      { v: 'copying', label: 'Someone is using my brand or copying my products', ico: 'shield', matter: 'trademark-infringement', tags: ['enforcement'] },
      { v: 'accused', label: 'I’ve been accused of using someone else’s brand', ico: 'gavel', matter: 'trademark-infringement', tags: ['defence'] },
      { v: 'letter', label: 'Sending or answering a cease and desist letter', ico: 'doc', matter: 'cease-and-desist-letters', tags: ['cease-and-desist'] },
      { v: 'renew', label: 'Renewing a trademark or changing the owner', ico: 'clock', matter: 'trademark-renewals', tags: ['renewal'] },
      { v: 'copyright', label: 'Copyright, such as copied content or a photo claim', ico: 'person', matter: 'copyright', tags: ['copyright'] },
      { v: 'design', label: 'Protecting the look of a product', ico: 'building', matter: 'design-rights', tags: ['design'] },
      { v: 'patent', label: 'A patent for an invention', ico: 'bolt', exit: 'patent' },
      { v: 'other', label: 'Something else about my brand or creative work', ico: 'other', matter: 'other-ip', tags: ['other-ip'] }] },

    // Who the client is
    { id: 'who', q: 'Who is the enquiry for?', type: 'single', options: [
      { v: 'ltd', label: 'My limited company or LLP', audience: 'business', tags: ['company'] },
      { v: 'sole', label: 'Me, as a sole trader, freelancer or partnership', audience: 'business', tags: ['sole-trader'] },
      { v: 'startup', label: 'A business I’m about to launch', audience: 'business', tags: ['startup'] },
      { v: 'creator', label: 'Me personally, for example as an artist, writer or photographer', audience: 'individual', tags: ['creator'] },
      { v: 'charity', label: 'A charity, club or other organisation', audience: 'business', tags: ['organisation'] }] },
    { id: 'company', when: { who: ['ltd'] }, q: 'What is the name of your company?', type: 'company', placeholder: 'Company name' },

    // What the brand covers
    { id: 'mark', when: { need: TM }, q: 'What is it you want to protect, or is being used?', type: 'multi', options: [
      { v: 'name', label: 'A business or brand name', tags: ['word-mark'] },
      { v: 'logo', label: 'A logo', tags: ['logo'] },
      { v: 'product', label: 'A product or range name', tags: ['product-name'] },
      { v: 'slogan', label: 'A slogan or tagline', tags: ['slogan'] },
      { v: 'other', label: 'Something else, such as packaging or a sound' }] },
    { id: 'sell', when: { need: ['register', 'search', 'copying'] }, q: 'What do you sell under the brand?', type: 'single', grid: true, options: [
      { v: 'products', label: 'Physical products', tags: ['goods'] },
      { v: 'services', label: 'Services', tags: ['services'] },
      { v: 'both', label: 'Products and services', tags: ['goods', 'services'] },
      { v: 'digital', label: 'Software, apps or digital content', tags: ['digital'] },
      { v: 'food', label: 'Food, drink or hospitality', tags: ['food-drink'] },
      { v: 'fashion', label: 'Fashion, beauty or lifestyle', tags: ['fashion-beauty'] }] },

    // Registering and searching
    { id: 'r_stage', when: { need: ['register'] }, q: 'Where are you with the application?', type: 'single', options: [
      { v: 'new', label: 'I haven’t applied yet', tags: ['new-filing'] },
      { v: 'filed', label: 'I’ve applied and I’m waiting', tags: ['pending-application'] },
      { v: 'more', label: 'It’s registered and I want to protect more', tags: ['extend-protection'] },
      { v: 'refused', label: 'My application was refused or withdrawn', tags: ['refusal'] }] },
    { id: 'r_where', when: { need: ['register', 'search'] }, q: 'Where do you trade, or plan to?', type: 'single', options: [
      { v: 'uk', label: 'Just the UK' },
      { v: 'eu', label: 'The UK and Europe', tags: ['international'] },
      { v: 'world', label: 'The UK and further afield, such as the US', tags: ['international'] }] },
    { id: 's_launch', when: { need: ['search'] }, q: 'Have you started using the name yet?', type: 'single', options: [
      { v: 'no', label: 'No, it’s still an idea', tags: ['pre-launch'] },
      { v: 'soon', label: 'We launch soon', tags: ['pre-launch'] },
      { v: 'yes', label: 'Yes, we already trade under it', tags: ['in-use'] }] },

    // Objections and oppositions
    { id: 'o_type', when: { need: ['objection'] }, q: 'What has happened?', type: 'single', options: [
      { v: 'exam', label: 'The examiner has objected to my application', tags: ['examination-report'] },
      { v: 'opposed', label: 'Someone has opposed my application', tags: ['defend-opposition'] },
      { v: 'threat', label: 'Someone has filed a notice of threatened opposition', tags: ['threatened-opposition'] },
      { v: 'oppose', label: 'I want to oppose someone else’s application', tags: ['bring-opposition'] },
      { v: 'cancel', label: 'I want to cancel a registered mark that clashes with mine', tags: ['invalidity-revocation'] }] },
    { id: 'o_deadline', when: { need: ['objection'] }, q: 'What is the deadline on your letter or notice?', type: 'date', deadline: true, optional: true },

    // Infringement, both sides
    { id: 'c_registered', when: { need: ['copying'] }, q: 'Is your brand registered as a trademark?', type: 'single', options: [
      { v: 'uk', label: 'Yes, in the UK', tags: ['registered-mark'] },
      { v: 'applied', label: 'I’ve applied but it isn’t registered yet', tags: ['pending-application'] },
      { v: 'no', label: 'No', tags: ['passing-off'] },
      { v: 'unsure', label: 'I’m not sure' }] },
    { id: 'c_where', when: { need: ['copying'] }, q: 'Where is it being used?', type: 'multi', options: [
      { v: 'marketplace', label: 'Online marketplaces, such as Amazon or Etsy', tags: ['marketplace'] },
      { v: 'social', label: 'Social media', tags: ['social-media'] },
      { v: 'website', label: 'A website or domain name', tags: ['domain'] },
      { v: 'shops', label: 'In shops or on products', tags: ['physical-goods'] },
      { v: 'name', label: 'As another business’s name', tags: ['company-name'] }] },
    { id: 'c_contact', when: { need: ['copying'] }, q: 'Have you contacted them yet?', type: 'single', options: [
      { v: 'no', label: 'No, not yet' },
      { v: 'self', label: 'Yes, I’ve written to them myself', tags: ['prior-contact'] },
      { v: 'ignored', label: 'Yes, and they ignored me or refused', tags: ['prior-contact', 'escalation'] }] },
    { id: 'a_what', when: { need: ['accused'] }, q: 'What have you received?', type: 'single', options: [
      { v: 'letter', label: 'A letter from a solicitor or the brand owner', tags: ['letter-received'] },
      { v: 'takedown', label: 'A marketplace or platform has removed my listings', tags: ['takedown'] },
      { v: 'claim', label: 'A court claim', tags: ['court-claim', 'urgent'] },
      { v: 'opposition', label: 'An opposition to my trademark application', tags: ['defend-opposition'] }] },

    // Cease and desist letters
    { id: 'l_dir', when: { need: ['letter'] }, q: 'Are you sending a letter or replying to one?', type: 'single', options: [
      { v: 'send', label: 'I want to send one', tags: ['send-letter'] },
      { v: 'reply', label: 'I’ve received one and need to reply', tags: ['letter-received'] }] },
    { id: 'l_about', when: { need: ['letter'] }, q: 'What is it about?', type: 'single', options: [
      { v: 'brand', label: 'A brand name or logo', tags: ['trademark'] },
      { v: 'content', label: 'Copied content, photos or designs', tags: ['copyright'] },
      { v: 'product', label: 'A lookalike product', tags: ['design'] },
      { v: 'other', label: 'Something else' }] },
    { id: 'reply_by', when: { need: ['accused'] }, q: 'Is there a date you have to reply by?', type: 'date', deadline: true, optional: true },
    { id: 'l_reply_by', when: { l_dir: ['reply'] }, q: 'Is there a date you have to reply by?', type: 'date', deadline: true, optional: true },

    // Renewals and ownership
    { id: 'rn_what', when: { need: ['renew'] }, q: 'What needs doing?', type: 'multi', options: [
      { v: 'renew', label: 'Renewing a mark before it expires', tags: ['renewal'] },
      { v: 'late', label: 'A mark that has expired or lapsed', tags: ['late-renewal', 'urgent'] },
      { v: 'owner', label: 'Recording a new owner after a sale or restructure', tags: ['assignment'] },
      { v: 'licence', label: 'Licensing a mark to someone else', tags: ['licence'] },
      { v: 'review', label: 'Reviewing all our marks', tags: ['portfolio-review'] }] },
    { id: 'rn_count', when: { need: ['renew'] }, q: 'How many registered marks do you have?', type: 'single', grid: true, options: [
      { v: 'one', label: 'One' }, { v: 'few', label: 'Two to five' },
      { v: 'many', label: 'Six to twenty', tags: ['portfolio'] }, { v: 'lots', label: 'More than twenty', tags: ['portfolio', 'high-value'] }] },
    { id: 'rn_expiry', when: { need: ['renew'] }, q: 'When does the next one expire?', type: 'date', deadline: true, optional: true },

    // Copyright
    { id: 'cp_what', when: { need: ['copyright'] }, q: 'What is happening?', type: 'single', options: [
      { v: 'copied', label: 'Someone has copied my work', tags: ['enforcement'] },
      { v: 'claim', label: 'I’ve received a claim, for example for using a photo', tags: ['defence', 'image-claim'] },
      { v: 'own', label: 'A dispute about who owns the work', tags: ['ownership'] },
      { v: 'contract', label: 'A licence or assignment of my work', tags: ['licensing-deal'] }] },
    { id: 'cp_type', when: { need: ['copyright'] }, q: 'What kind of work is it?', type: 'single', grid: true, options: [
      { v: 'photo', label: 'Photos or images', tags: ['images'] },
      { v: 'writing', label: 'Writing or website content', tags: ['written-content'] },
      { v: 'music', label: 'Music or audio', tags: ['music'] },
      { v: 'video', label: 'Film or video', tags: ['video'] },
      { v: 'software', label: 'Software or code', tags: ['software'] },
      { v: 'art', label: 'Art, illustration or design', tags: ['artwork'] }] },

    // Design rights
    { id: 'd_what', when: { need: ['design'] }, q: 'What do you need?', type: 'single', options: [
      { v: 'register', label: 'Registering a design', tags: ['design-registration'] },
      { v: 'copied', label: 'A competitor has copied my product', tags: ['enforcement'] },
      { v: 'accused', label: 'I’ve been accused of copying a design', tags: ['defence'] }] },
    { id: 'd_public', when: { d_what: ['register'] }, q: 'Have you shown the design publicly yet?', type: 'single', options: [
      { v: 'no', label: 'No, not yet' },
      { v: 'recent', label: 'Yes, in the last 12 months', tags: ['grace-period'] },
      { v: 'older', label: 'Yes, more than 12 months ago', tags: ['prior-disclosure'] }] },

    // Size of the business, for firms that filter on value
    { id: 'turnover', when: { $audience: ['business'] }, q: 'Roughly what is the business’s yearly turnover?', type: 'single', grid: true, valueLabel: 'Annual turnover', options: [
      { v: 't0', label: 'Not trading yet', tags: ['new-venture'] },
      { v: 't1', label: 'Under £100,000', value: { min: 0, max: 100000 } },
      { v: 't2', label: '£100,000 to £1 million', value: { min: 100000, max: 1000000 } },
      { v: 't3', label: '£1 million to £10 million', value: { min: 1000000, max: 10000000 }, tags: ['high-value'] },
      { v: 't4', label: 'Over £10 million', value: { min: 10000000, max: 100000000 }, tags: ['high-value'] },
      { v: 'unsure', label: 'I’d rather not say', wide: true }] },
  ],
  urgency: { q: 'When do you need help?' },
  exits: {
    patent: { reason: 'Patents protect how an invention works and are handled by patent attorneys, which is outside the trademark and IP work the firms we work with take on through Leaflegal. These pages explain how patents work and how to find a patent attorney.',
      links: [GOV('patent-your-invention', 'Patent your invention (GOV.UK)'), ['https://www.cipa.org.uk/', 'Find a patent attorney (CIPA)']] },
    research: { reason: 'It sounds like you’re still weighing things up. Come back when you’re ready to speak to someone. Until then, these pages are a good place to start.',
      links: [GOV('how-to-register-a-trade-mark', 'How to register a trade mark (GOV.UK)'), ['https://trademarks.ipo.gov.uk/ipo-tmtext', 'Search the UK trade mark register (UK IPO)']] },
  },
};
