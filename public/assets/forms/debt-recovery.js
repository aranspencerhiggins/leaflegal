// Debt recovery enquiry form. Business to business only. The creditor and the debtor must both be businesses.
// Exits for consumer debts, debts older than six years, debtors already in an insolvency process, and people being chased.
// Format: see assets/form-options.js.
const GOV = (p, t) => [`https://www.gov.uk/${p}`, t];
const CH = ['https://find-and-update.company-information.service.gov.uk/', 'Search the Companies House register'];

export default {
  defaultMatter: 'unpaid-invoices',
  steps: [
    { id: 'need', q: 'What do you need help with?', type: 'single', icons: true, options: [
      { v: 'chase', label: 'Chasing an unpaid invoice', ico: 'invoice', audience: 'business', matter: 'unpaid-invoices', tags: ['unpaid-invoice'] },
      { v: 'lba', label: 'Sending a solicitor’s letter demanding payment', ico: 'doc', audience: 'business', matter: 'letters-before-action', tags: ['letter-before-action'] },
      { v: 'claim', label: 'Making a court claim', ico: 'gavel', audience: 'business', matter: 'court-claims', tags: ['court-claim'] },
      { v: 'statdemand', label: 'Serving a statutory demand', sub: 'A formal demand that can lead to insolvency action', ico: 'doc', audience: 'business', matter: 'statutory-demands', tags: ['statutory-demand'] },
      { v: 'windup', label: 'Winding up a company that owes us', sub: 'Asking the court to close down the debtor company', ico: 'building', audience: 'business', matter: 'winding-up-petitions', tags: ['winding-up'] },
      { v: 'enforce', label: 'Enforcing a court judgment, we won but still haven’t been paid', ico: 'badge', audience: 'business', matter: 'enforcement', tags: ['enforcement', 'judgment'] },
      { v: 'interest', label: 'Claiming interest on invoices paid late', ico: 'pound', audience: 'business', matter: 'late-payment-interest', tags: ['late-payment-interest'] },
      { v: 'owe', label: 'I owe money and I’m being chased for it', ico: 'other', exit: 'debtor' }] },

    // The creditor
    { id: 'creditor', q: 'Is the money owed to you or to your business?', type: 'single', options: [
      { v: 'ltd', label: 'My limited company or LLP', audience: 'business', tags: ['creditor-company'] },
      { v: 'sole', label: 'Me, as a sole trader, freelancer or partnership', audience: 'business', tags: ['creditor-sole-trader'] },
      { v: 'other', label: 'My charity, club or other organisation', audience: 'business', tags: ['creditor-organisation'] },
      { v: 'personal', label: 'Me personally, for example money lent to a friend', exit: 'personal' }] },
    { id: 'company', when: { creditor: ['ltd'] }, q: 'What is the name of your company?', type: 'company', placeholder: 'Company name' },
    // The debtor
    { id: 'debtor', q: 'Who hasn’t paid you?', type: 'single', options: [
      { v: 'ltd', label: 'A limited company or LLP', tags: ['debtor-company'] },
      { v: 'sole', label: 'A sole trader or partnership', tags: ['debtor-sole-trader'] },
      { v: 'public', label: 'A public body, charity or other organisation', tags: ['debtor-organisation'] },
      { v: 'abroad', label: 'A business based outside the UK', tags: ['overseas-debtor'] },
      { v: 'consumer', label: 'A private individual, not a business', exit: 'consumer' }] },
    { id: 'debtor_status', q: 'Is the business that owes you still trading?', type: 'single', options: [
      { v: 'trading', label: 'Yes, as far as I know', tags: ['debtor-trading'] },
      { v: 'unsure', label: 'I’m not sure, they’ve gone quiet', tags: ['debtor-unresponsive'] },
      { v: 'ceased', label: 'They seem to have stopped trading', tags: ['debtor-ceased-trading'] },
      { v: 'insolvent', label: 'They’re insolvent, for example in liquidation or administration', exit: 'insolvent' },
      { v: 'dissolved', label: 'The company has been dissolved or struck off', exit: 'dissolved' }] },

    // The debt
    { id: 'amount', q: 'How much are you owed in total?', type: 'single', grid: true, valueLabel: 'Amount owed', options: [
      { v: 'a1', label: 'Under £1,000', value: { min: 0, max: 1000 }, tags: ['small-claim'] },
      { v: 'a2', label: '£1,000 to £5,000', value: { min: 1000, max: 5000 }, tags: ['small-claim'] },
      { v: 'a3', label: '£5,000 to £10,000', value: { min: 5000, max: 10000 }, tags: ['small-claim'] },
      { v: 'a4', label: '£10,000 to £25,000', value: { min: 10000, max: 25000 } },
      { v: 'a5', label: '£25,000 to £100,000', value: { min: 25000, max: 100000 } },
      { v: 'a6', label: '£100,000 to £500,000', value: { min: 100000, max: 500000 }, tags: ['high-value'] },
      { v: 'a7', label: 'Over £500,000', value: { min: 500000, max: 5000000 }, tags: ['high-value'], wide: true }] },
    { id: 'age', q: 'When should the oldest unpaid invoice have been paid?', type: 'single', options: [
      { v: 'm1', label: 'Less than a month ago', tags: ['recent-debt'] },
      { v: 'm3', label: '1 to 3 months ago', tags: ['recent-debt'] },
      { v: 'y1', label: '3 to 12 months ago' },
      { v: 'y2', label: '1 to 2 years ago', tags: ['older-debt'] },
      { v: 'y6', label: '2 to 6 years ago', tags: ['older-debt'] },
      { v: 'ack', label: 'More than 6 years ago, but they’ve paid some or admitted it in writing since', tags: ['older-debt', 'acknowledged'] },
      { v: 'old', label: 'More than 6 years ago', exit: 'limitation' }] },
    { id: 'dispute', q: 'Have they given a reason for not paying?', type: 'single', options: [
      { v: 'silent', label: 'No, they’re ignoring us', tags: ['undisputed'] },
      { v: 'promise', label: 'They keep promising to pay but don’t', tags: ['undisputed'] },
      { v: 'cash', label: 'They say they can’t afford it right now', tags: ['undisputed', 'payment-plan'] },
      { v: 'part', label: 'They say they owe less than we’re claiming', tags: ['part-disputed'] },
      { v: 'disputed', label: 'They’re unhappy with the goods or work', tags: ['disputed'] },
      { v: 'counter', label: 'They say we owe them money', tags: ['disputed', 'counterclaim'] }] },
    { id: 'paperwork', q: 'What paperwork do you have?', type: 'multi', options: [
      { v: 'contract', label: 'A signed contract or our terms and conditions', tags: ['written-terms'] },
      { v: 'order', label: 'A purchase order or emails agreeing the work', tags: ['written-agreement'] },
      { v: 'invoices', label: 'Copies of the invoices' },
      { v: 'proof', label: 'Delivery notes or proof the work was done' },
      { v: 'guarantee', label: 'A personal guarantee from a director', tags: ['personal-guarantee'] },
      { v: 'nothing', label: 'Nothing in writing', tags: ['no-paperwork'] }] },
    { id: 'so_far', q: 'What have you done so far to get paid?', type: 'multi', options: [
      { v: 'reminders', label: 'Reminders, emails or calls' },
      { v: 'final', label: 'A final demand from us' },
      { v: 'agency', label: 'A debt collection agency', tags: ['agency-tried'] },
      { v: 'lba', label: 'A letter before action', tags: ['lba-sent'] },
      { v: 'claim', label: 'A court claim has been issued', tags: ['claim-issued'] },
      { v: 'judgment', label: 'We have a court judgment', tags: ['judgment'] },
      { v: 'statdemand', label: 'A statutory demand has been served', tags: ['stat-demand-served'] },
      { v: 'nothing', label: 'Nothing yet' }] },
    { id: 'hearing', when: { so_far: ['claim', 'statdemand'] }, q: 'Is there a court hearing or deadline coming up?', type: 'date', deadline: true, optional: true },

    // Enforcing a judgment
    { id: 'judgment', when: { need: ['enforce'] }, q: 'What kind of judgment or award do you have?', type: 'single', options: [
      { v: 'default', label: 'A County Court judgment they didn’t respond to', tags: ['default-judgment'] },
      { v: 'trial', label: 'A County Court judgment after a hearing' },
      { v: 'high', label: 'A High Court judgment', tags: ['high-court'] },
      { v: 'award', label: 'An arbitration or adjudication award', tags: ['adjudication'] },
      { v: 'unsure', label: 'I’m not sure' }] },
    { id: 'judgment_date', when: { need: ['enforce'] }, q: 'What date was the judgment or award made?', type: 'date', optional: true, past: true },
    { id: 'assets', when: { need: ['enforce', 'statdemand', 'windup'] }, q: 'Do you know if they have money or assets?', type: 'single', options: [
      { v: 'yes', label: 'Yes, they’re still trading and have money coming in', tags: ['debtor-has-assets'] },
      { v: 'property', label: 'They own property or valuable equipment', tags: ['debtor-has-assets'] },
      { v: 'unsure', label: 'I don’t know' },
      { v: 'no', label: 'I don’t think they have much', tags: ['debtor-low-assets'] }] },

    { id: 'other_debts', q: 'Does your business have other customers who owe you money?', type: 'single', options: [
      { v: 'no', label: 'No, it’s just this one' },
      { v: 'few', label: 'Yes, a few others', tags: ['multiple-debtors'] },
      { v: 'regular', label: 'Yes, we’d like ongoing help with credit control', tags: ['multiple-debtors', 'ongoing-credit-control'] }] },
  ],
  urgency: { q: 'How soon do you want to start recovering the money?' },
  exits: {
    debtor: { reason: 'The firms we work with on Leaflegal act for businesses that are owed money, not for people or businesses being chased for a debt. These free, independent services can help you deal with it.',
      links: [['https://businessdebtline.org/', 'Business Debtline'], ['https://www.nationaldebtline.org/', 'National Debtline'], ['https://www.citizensadvice.org.uk/debt-and-money/', 'Citizens Advice debt help']] },
    personal: { reason: 'Debt recovery through Leaflegal is for businesses owed money by other businesses. For money owed to you personally, you can usually make a claim online yourself, and these pages explain how.',
      links: [GOV('make-court-claim-for-money', 'Make a court claim for money (GOV.UK)'), ['https://www.citizensadvice.org.uk/law-and-courts/legal-system/taking-legal-action/small-claims/', 'Small claims (Citizens Advice)']] },
    consumer: { reason: 'The firms we work with on Leaflegal only recover debts owed by other businesses. Debts owed by private individuals follow different rules. These pages explain how to recover money from a customer.',
      links: [GOV('make-court-claim-for-money', 'Make a court claim for money (GOV.UK)'), ['https://www.citizensadvice.org.uk/law-and-courts/legal-system/taking-legal-action/small-claims/', 'Small claims (Citizens Advice)'], ['https://solicitors.lawsociety.org.uk/', 'Find a Solicitor (Law Society)']] },
    insolvent: { reason: 'When a business is already in an insolvency process, money is usually claimed through the insolvency practitioner dealing with it rather than through a solicitor. These official pages explain how creditors can claim.',
      links: [['https://www.gov.uk/government/organisations/insolvency-service', 'The Insolvency Service (GOV.UK)'], GOV('search-bankruptcy-insolvency-register', 'Search the Individual Insolvency Register (GOV.UK)'), CH] },
    dissolved: { reason: 'A company that has been dissolved or struck off no longer exists, so a claim can’t be made against it in the usual way. Companies House can show you what happened to the company and explain the options.',
      links: [CH, GOV('get-information-about-a-company', 'Get information about a company (GOV.UK)')] },
    limitation: { reason: 'Debts that fell due more than six years ago are usually too old for the firms we work with to take on through Leaflegal. A solicitor from the Law Society directory can look at your situation in more detail.',
      links: [['https://solicitors.lawsociety.org.uk/', 'Find a Solicitor (Law Society)'], GOV('make-court-claim-for-money', 'Make a court claim for money (GOV.UK)')] },
    free: { reason: 'The firms we work with charge for debt recovery work. If you’d rather do it yourself, you can make a claim online, and these official pages explain how.',
      links: [GOV('make-court-claim-for-money', 'Make a court claim for money (GOV.UK)'), GOV('late-commercial-payments-interest-debt-recovery', 'Late commercial payments (GOV.UK)')] },
    research: { reason: 'It sounds like you’re still weighing things up. Come back when you’re ready to start recovering the money. Until then, these pages are a good place to start.',
      links: [GOV('late-commercial-payments-interest-debt-recovery', 'Late commercial payments (GOV.UK)'), GOV('make-court-claim-for-money', 'Make a court claim for money (GOV.UK)')] },
  },
};
