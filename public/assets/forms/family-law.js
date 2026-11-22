// Family law enquiry form. Divorce, civil partnership dissolution, finances, children, cohabitation,
// separation agreements and prenups in England and Wales. Safety worries are signposted but never stop the enquiry.
// Format: see assets/form-options.js.
const GOV = (p, t) => [`https://www.gov.uk/${p}`, t];
const HELPLINE = ['https://www.nationaldahelpline.org.uk/', 'National Domestic Abuse Helpline'];
const FIND_SOL = ['https://solicitors.lawsociety.org.uk/', 'Find a Solicitor (Law Society)'];
const CA_FAMILY = ['https://www.citizensadvice.org.uk/family/', 'Citizens Advice family help'];

// Paths that involve money and property after a relationship ends.
const MONEY = ['divorce', 'dissolution', 'finances', 'consent', 'separation', 'cohab'];
// Paths about ending a marriage or civil partnership.
const ENDING = ['divorce', 'dissolution', 'finances', 'consent', 'separation'];

export default {
  steps: [
    { id: 'need', q: 'What do you need help with?', type: 'single', icons: true, options: [
      { v: 'divorce', label: 'Getting divorced', ico: 'ring', matter: 'divorce', tags: ['divorce'] },
      { v: 'dissolution', label: 'Ending a civil partnership', ico: 'ring', matter: 'civil-partnership-dissolution', tags: ['dissolution'] },
      { v: 'finances', label: 'Sorting out money and property after a split', ico: 'pound', matter: 'financial-settlements', tags: ['finances'] },
      { v: 'consent', label: 'Making an agreed money settlement legally binding', ico: 'doc', matter: 'consent-orders', tags: ['consent-order'] },
      { v: 'children', label: 'Arrangements for children', ico: 'child', matter: 'child-arrangements', tags: ['children'] },
      { v: 'separation', label: 'A separation agreement, without divorcing yet', ico: 'doc', matter: 'separation-agreements', tags: ['separation'] },
      { v: 'cohab', label: 'Splitting up after living together without marrying', ico: 'home', matter: 'cohabitation-disputes', tags: ['cohabitation'] },
      { v: 'prenup', label: 'A prenup or postnup', ico: 'heart', matter: 'prenuptial-agreements', tags: ['prenup'] },
      { v: 'protection', label: 'Protection from abuse', ico: 'shield', exit: 'protection' },
      { v: 'other', label: 'Something else', ico: 'other' }] },

    { id: 'other_kind', when: { need: ['other'] }, q: 'Which of these is closest?', type: 'single', options: [
      { v: 'grandparent', label: 'Seeing my grandchildren or a relative’s children', matter: 'child-arrangements', tags: ['children', 'grandparent'] },
      { v: 'cms', label: 'Child maintenance only', exit: 'cms' },
      { v: 'care', label: 'Social services are involved with my children', exit: 'care' },
      { v: 'adoption', label: 'Adoption or a special guardianship order', exit: 'adoption' },
      { v: 'surrogacy', label: 'Surrogacy or a parental order', exit: 'surrogacy' },
      { v: 'wills', label: 'A will, probate or an inheritance dispute', exit: 'wills' },
      { v: 'else', label: 'Something not listed here', exit: 'other' }] },

    // Relationship
    { id: 'status', when: { need: ['finances', 'consent', 'separation'] }, q: 'Are you married or in a civil partnership?', type: 'single', options: [
      { v: 'married', label: 'Married', tags: ['married'] },
      { v: 'cp', label: 'In a civil partnership', tags: ['civil-partnership'] },
      { v: 'cohab', label: 'Neither, we lived together', matter: 'cohabitation-disputes', tags: ['cohabitation'] }] },
    { id: 'stage', when: { need: ['divorce', 'dissolution', 'finances', 'consent'], '!status': ['cohab'] }, q: 'How far along is the divorce or dissolution?', type: 'single', options: [
      { v: 'none', label: 'Nobody has applied yet', tags: ['not-started'] },
      { v: 'joint', label: 'We plan to apply together', tags: ['not-started', 'joint-application'] },
      { v: 'applied', label: 'I’ve applied and it’s under way', tags: ['in-progress'] },
      { v: 'respondent', label: 'My ex has applied', tags: ['in-progress', 'respondent'] },
      { v: 'conditional', label: 'There’s a conditional order', tags: ['conditional-order'] },
      { v: 'final', label: 'It’s already finalised', tags: ['final-order'] }] },
    { id: 'length', when: { need: [...ENDING, 'cohab'] }, q: 'How long were you together, including any time living together first?', type: 'single', grid: true, options: [
      { v: 'l1', label: 'Under a year', tags: ['under-one-year'] },
      { v: 'l2', label: '1 to 5 years' },
      { v: 'l3', label: '5 to 10 years' },
      { v: 'l4', label: '10 to 20 years', tags: ['long-relationship'] },
      { v: 'l5', label: 'Over 20 years', tags: ['long-relationship'] }] },
    { id: 'kids', when: { need: [...MONEY] }, q: 'Do you have children under 18 together?', type: 'single', options: [
      { v: 'yes', label: 'Yes', tags: ['children'] },
      { v: 'no', label: 'No' }] },

    // Children
    { id: 'c_role', when: { need: ['children'] }, q: 'Who are you to the children?', type: 'single', options: [
      { v: 'mother', label: 'Their mother', tags: ['parent'] },
      { v: 'father', label: 'Their father', tags: ['parent'] },
      { v: 'step', label: 'Step parent or partner of a parent', tags: ['step-parent'] },
      { v: 'grand', label: 'Grandparent', tags: ['grandparent'] },
      { v: 'relative', label: 'Another relative or carer', tags: ['relative'] }] },
    { id: 'c_status', when: { need: ['children'] }, q: 'What was the relationship between the parents?', type: 'single', options: [
      { v: 'married', label: 'Married or in a civil partnership', tags: ['married'] },
      { v: 'cohab', label: 'Lived together but not married', tags: ['cohabitation'] },
      { v: 'apart', label: 'Never lived together' },
      { v: 'together', label: 'They’re still together' }] },
    { id: 'c_issue', when: { need: ['children'] }, q: 'What needs sorting out?', type: 'multi', options: [
      { v: 'live', label: 'Where the children live', tags: ['residence'] },
      { v: 'time', label: 'Time the children spend with each parent', tags: ['contact'] },
      { v: 'move', label: 'A parent wants to move away or abroad with them', tags: ['relocation'] },
      { v: 'decide', label: 'A decision on school, health or religion', tags: ['specific-issue'] },
      { v: 'stop', label: 'Stopping a parent from doing something', tags: ['prohibited-steps'] },
      { v: 'change', label: 'Changing or enforcing a court order', tags: ['existing-order'] }] },
    { id: 'c_count', when: { need: ['children'] }, q: 'How many children are involved?', type: 'single', grid: true, options: [
      { v: 'k1', label: 'One' }, { v: 'k2', label: 'Two' }, { v: 'k3', label: 'Three or more', tags: ['multiple-children'] }] },
    { id: 'c_youngest', when: { need: ['children'] }, q: 'How old is the youngest?', type: 'single', grid: true, options: [
      { v: 'a1', label: 'Under 5' }, { v: 'a2', label: '5 to 11' }, { v: 'a3', label: '12 to 15' }, { v: 'a4', label: '16 or 17', tags: ['older-child'] }] },
    { id: 'c_seeing', when: { need: ['children'] }, q: 'Are the children seeing both parents at the moment?', type: 'single', options: [
      { v: 'yes', label: 'Yes, regularly' },
      { v: 'some', label: 'Sometimes, but less than agreed or wanted', tags: ['reduced-contact'] },
      { v: 'none', label: 'No, one parent isn’t seeing them at all', tags: ['no-contact'] },
      { v: 'unsure', label: 'It’s complicated' }] },

    // Cohabitation
    { id: 'h_home', when: { $matter: ['cohabitation-disputes'], '!need': ['children', 'prenup'] }, q: 'Whose name is the home in?', type: 'single', options: [
      { v: 'joint', label: 'Both our names', tags: ['joint-names', 'property'] },
      { v: 'mine', label: 'Just my name', tags: ['sole-name', 'property'] },
      { v: 'theirs', label: 'Just my ex’s name', tags: ['sole-name', 'property'] },
      { v: 'rented', label: 'We rented', tags: ['rented'] },
      { v: 'unsure', label: 'I’m not sure' }] },

    // Prenups
    { id: 'p_type', when: { need: ['prenup'] }, q: 'What kind of agreement is it?', type: 'single', options: [
      { v: 'prenup', label: 'Before a wedding or civil partnership', tags: ['prenup'] },
      { v: 'postnup', label: 'After we’ve married or formed a civil partnership', tags: ['postnup'] },
      { v: 'living', label: 'A living together agreement, without marrying', matter: 'cohabitation-disputes', tags: ['cohabitation-agreement'] }] },
    { id: 'p_date', when: { p_type: ['prenup'] }, q: 'When is the wedding or ceremony?', type: 'date', deadline: true, optional: true },
    { id: 'p_reason', when: { need: ['prenup'] }, q: 'What do you want the agreement to protect?', type: 'multi', options: [
      { v: 'property', label: 'Property one of us already owns', tags: ['property'] },
      { v: 'business', label: 'A business', tags: ['business-assets'] },
      { v: 'inherit', label: 'Inheritance or family money', tags: ['inheritance'] },
      { v: 'kids', label: 'Children from an earlier relationship', tags: ['children'] },
      { v: 'abroad', label: 'Money or property abroad', tags: ['international'] },
      { v: 'general', label: 'Just peace of mind' }] },
    { id: 'p_partner', when: { need: ['prenup'] }, q: 'How does your partner feel about it?', type: 'single', options: [
      { v: 'agreed', label: 'They’re on board and will get their own solicitor', tags: ['amicable'] },
      { v: 'talking', label: 'We’re still talking it through', tags: ['partly-agreed'] },
      { v: 'notyet', label: 'I haven’t raised it with them yet' },
      { v: 'theirs', label: 'They’ve asked me to sign one', tags: ['received-draft'] }] },

    // Money
    { id: 'assets', when: { need: [...MONEY, 'prenup'] }, q: 'Roughly what is everything worth together, including the home, savings and pensions?', type: 'single', valueLabel: 'Value of assets', options: [
      { v: 'v1', label: 'Under £100,000', value: { min: 0, max: 100000 } },
      { v: 'v2', label: '£100,000 to £250,000', value: { min: 100000, max: 250000 } },
      { v: 'v3', label: '£250,000 to £500,000', value: { min: 250000, max: 500000 } },
      { v: 'v4', label: '£500,000 to £1 million', value: { min: 500000, max: 1000000 }, tags: ['high-value'] },
      { v: 'v5', label: '£1 million to £3 million', value: { min: 1000000, max: 3000000 }, tags: ['high-value', 'high-net-worth'] },
      { v: 'v6', label: 'Over £3 million', value: { min: 3000000, max: 10000000 }, tags: ['high-value', 'high-net-worth'] },
      { v: 'unsure', label: 'I’m not sure' }] },
    { id: 'assets_kind', when: { need: [...MONEY] }, q: 'Which of these are involved?', type: 'multi', options: [
      { v: 'home', label: 'A home that one or both of you own', tags: ['property'] },
      { v: 'mortgage', label: 'A mortgage', tags: ['mortgage'] },
      { v: 'property', label: 'Other property, such as a rental or holiday home', tags: ['second-property'] },
      { v: 'pension', label: 'Pensions', tags: ['pensions'] },
      { v: 'business', label: 'A business or self employed income', tags: ['business-assets'] },
      { v: 'savings', label: 'Savings, shares or investments', tags: ['investments'] },
      { v: 'inherit', label: 'Inheritance or family money', tags: ['inheritance'] },
      { v: 'debts', label: 'Significant debts', tags: ['debts'] },
      { v: 'maint', label: 'Ongoing maintenance for one of us', tags: ['spousal-maintenance'] }] },
    { id: 'c_agreed', when: { need: ['consent'] }, q: 'How was the agreement reached?', type: 'single', options: [
      { v: 'between', label: 'Between ourselves', tags: ['amicable'] },
      { v: 'mediation', label: 'Through mediation', tags: ['amicable', 'mediation-done'] },
      { v: 'solicitors', label: 'Through solicitors', tags: ['amicable'] },
      { v: 'partly', label: 'Most of it is agreed but a few points are open', tags: ['partly-agreed'] }] },

    // Whether things are agreed
    { id: 'agree', when: { need: ['divorce', 'dissolution', 'finances', 'separation', 'cohab', 'children'] }, q: 'Do you and your ex, or the other parent, agree on what should happen?', type: 'single', options: [
      { v: 'yes', label: 'Yes, mostly', tags: ['amicable'] },
      { v: 'partly', label: 'On some things but not others', tags: ['partly-agreed'] },
      { v: 'no', label: 'No, we don’t agree', tags: ['contested'] },
      { v: 'silent', label: 'They won’t engage or I can’t reach them', tags: ['no-engagement'] }] },
    { id: 'mediation', when: { need: ['finances', 'cohab', 'children'] }, q: 'Have you tried mediation?', type: 'single', options: [
      { v: 'done', label: 'Yes, and it helped with some things', tags: ['mediation-done'] },
      { v: 'failed', label: 'Yes, but it didn’t work', tags: ['mediation-done'] },
      { v: 'no', label: 'Not yet' },
      { v: 'unsuitable', label: 'No, it isn’t safe or suitable for us', tags: ['mediation-unsuitable'] }] },
    { id: 'court', when: { need: ['divorce', 'dissolution', 'finances', 'consent', 'cohab', 'children'] }, q: 'Has anyone started court proceedings?', type: 'single', options: [
      { v: 'no', label: 'No' },
      { v: 'me', label: 'Yes, I have', tags: ['court-proceedings'] },
      { v: 'them', label: 'Yes, I’ve received court papers', tags: ['court-proceedings', 'respondent'] },
      { v: 'hearing', label: 'Yes, and there’s a hearing date', tags: ['court-proceedings', 'court-date'] },
      { v: 'order', label: 'There’s already a court order in place', tags: ['existing-order'] }] },
    { id: 'court_date', when: { court: ['hearing'] }, q: 'When is the next hearing?', type: 'date', deadline: true, optional: true },

    // Everyone except prenups
    { id: 'international', when: { '!need': ['prenup'] }, q: 'Is there anything international about your situation?', type: 'single', options: [
      { v: 'no', label: 'No' },
      { v: 'married', label: 'We married abroad', tags: ['international'] },
      { v: 'lives', label: 'One of us lives outside England and Wales', tags: ['international'] },
      { v: 'assets', label: 'There’s money or property abroad', tags: ['international'] },
      { v: 'child', label: 'I’m worried a child may be taken abroad', sub: 'If a child is being taken right now, call 999', tags: ['international', 'abduction-risk'] }] },
    { id: 'safety', when: { '!need': ['prenup'] }, q: 'Do you have any worries about your safety or a child’s safety?', type: 'single', options: [
      { v: 'no', label: 'No' },
      { v: 'yes', label: 'Yes', sub: 'If you’re in danger now, call 999. The National Domestic Abuse Helpline is free, day or night, on 0808 2000 247', tags: ['safety-concern'] },
      { v: 'past', label: 'There have been problems in the past', tags: ['safety-concern'] },
      { v: 'skip', label: 'I’d rather say on the phone' }] },
    { id: 'before', when: { '!need': ['prenup'] }, q: 'Have you spoken to a family solicitor about this before?', type: 'single', options: [
      { v: 'no', label: 'No, this is the first time' },
      { v: 'new', label: 'Yes, and I want someone new', tags: ['switching-firm'] },
      { v: 'other', label: 'My ex already has a solicitor', tags: ['other-side-represented'] }] },
  ],
  exits: {
    protection: { reason: 'If you’re in danger right now, call 999. Orders that protect you from abuse are often needed quickly and you may be able to get legal aid for them, so these services can put you in touch with specialist help straight away. If you also need help with a divorce, money or children, you can come back and choose that.',
      links: [HELPLINE, GOV('injunction-domestic-violence', 'Get an injunction if you’ve been the victim of domestic abuse (GOV.UK)'), GOV('check-legal-aid', 'Check if you can get legal aid (GOV.UK)')] },
    cms: { reason: 'Child maintenance is usually arranged between parents or through the Child Maintenance Service, without a solicitor. These official pages explain how it works and how much it might be.',
      links: [GOV('child-maintenance-service', 'Child Maintenance Service (GOV.UK)'), GOV('calculate-child-maintenance', 'Calculate child maintenance (GOV.UK)'), CA_FAMILY] },
    care: { reason: 'When children’s services are involved, parents can usually get legal aid and should speak to a specialist children panel solicitor. The firms we work with don’t take on this kind of case, but these services can help straight away.',
      links: [['https://frg.org.uk/', 'Family Rights Group'], GOV('check-legal-aid', 'Check if you can get legal aid (GOV.UK)'), FIND_SOL] },
    adoption: { reason: 'Adoption and special guardianship are outside the matters the firms we work with take on through Leaflegal. These organisations can point you in the right direction.',
      links: [GOV('child-adoption', 'Adopting a child (GOV.UK)'), ['https://corambaaf.org.uk/', 'CoramBAAF'], FIND_SOL] },
    surrogacy: { reason: 'Surrogacy and parental orders are a specialist area that the firms we work with don’t cover through Leaflegal. These pages explain the basics and help you find a specialist.',
      links: [GOV('legal-rights-when-using-surrogates-and-donors', 'Surrogacy and donors, your legal rights (GOV.UK)'), FIND_SOL] },
    wills: { reason: 'Wills, probate and inheritance disputes are outside the family matters the firms we work with take on through Leaflegal. These pages can help you find the right person.',
      links: [GOV('make-will', 'Making a will (GOV.UK)'), GOV('applying-for-probate', 'Applying for probate (GOV.UK)'), FIND_SOL] },
    free: { reason: 'The firms we work with charge for their work, so they can’t help with free advice or legal aid cases. Legal aid for family matters is mostly available where there is domestic abuse or a risk to a child. These services can help.',
      links: [GOV('check-legal-aid', 'Check if you can get legal aid (GOV.UK)'), ['https://www.advicenow.org.uk/', 'Advicenow'], CA_FAMILY] },
    research: { reason: 'It sounds like you’re still weighing things up. Come back when you’re ready to speak to someone. Until then, these pages are a good place to start.',
      links: [GOV('divorce', 'Get a divorce (GOV.UK)'), GOV('looking-after-children-divorce', 'Making child arrangements if you divorce or separate (GOV.UK)'), CA_FAMILY] },
  },
};
