// Leaflegal Partner Agreement (lead supply terms between Vertical Brands Ltd and the partner firm).
// Bump TERMS_VERSION whenever the wording changes: every signature stores the version and a hash of the exact text.
// Keep commercial clauses in step with api/_lib/platform.js (PACKS, CUSTOM, TRIAL, RETURN_HOURS) and the Billing page.
import { createHash } from 'node:crypto';

export const TERMS_VERSION = '2026-11-08';
export const P = 'Vertical Brands Ltd (trading as Leaflegal), a company registered in England and Wales with company number 14254961, whose registered office is at 20–22 Wenlock Road, London, N1 7GU';

export const SECTIONS = [
  ['1. About this agreement', [
    `This Partner Agreement (the “Agreement”) is between ${P} (“Leaflegal”, “we”, “us”) and the company or firm named in the signature block (the “Partner”, “you”). It sets out the terms on which Leaflegal supplies business finance enquiries to the Partner through the Leaflegal Platform at platform.leaflegal.co (the “Platform”).`,
    'The Agreement starts when it is accepted electronically by a person with authority to bind the Partner and continues until ended under clause 13. By signing, the Partner confirms it is acting in the course of its business and not as a consumer.',
    'If anything in a Platform page, email or proposal conflicts with this Agreement, this Agreement wins unless we have both agreed otherwise in writing and referred to the clause being changed.',
  ]],
  ['2. Definitions', [
    '“Lead” means an enquiry submitted through a Leaflegal website by a business owner seeking business finance, together with the information they provided, as made available on the Platform.',
    '“Applicant” means the person and business that submitted a Lead.',
    '“Credits” means the units credited to the Partner’s Platform account under its Subscription, used to buy Leads. One Credit represents £1 of Lead value. Credits are not money, have no cash value and are not e-money.',
    '“Subscription” means the Partner’s recurring monthly plan for Credits, including the Introductory Offer where it applies.',
    '“Auto-buy” means the Platform feature that buys Leads for the Partner automatically according to the criteria and limits the Partner sets.',
    '“Data Protection Law” means the UK GDPR, the Data Protection Act 2018, the Privacy and Electronic Communications (EC Directive) Regulations 2003 (“PECR”) and any related guidance from the Information Commissioner’s Office, each as amended.',
  ]],
  ['3. What Leaflegal provides', [
    'Leaflegal runs marketing that invites UK limited companies and limited liability partnerships to enquire about business finance, collects their details and consent, and makes the resulting Leads available to subscribing partners on the Platform.',
    'Each Lead is exclusive: once the Partner buys a Lead, Leaflegal will not sell or supply that Lead to any other Platform partner. Leaflegal may keep a record of the Lead for its own legal, accounting, quality and fraud-prevention purposes.',
    'Before purchase the Partner can see a summary of each Lead and its price. Business names and full contact details are released only on purchase.',
    'Leaflegal acts only as an introducer. It is not a lender or a broker, does not give advice, does not recommend any product and is not authorised by the Financial Conduct Authority. Leaflegal does not take any commission, fee or other payment from lenders in connection with Leads supplied to the Partner.',
    'Leaflegal does not guarantee the number of Leads available, that Leads will match the Partner’s criteria, that any Applicant will answer, qualify, be approved or proceed, or any level of conversion, revenue or return.',
  ]],
  ['4. Subscriptions, Credits and payment', [
    'The Partner must hold an active Subscription to buy Leads. Subscriptions are billed monthly in advance by card through our payment provider, Stripe. Prices on the Platform exclude VAT, which is added at the prevailing rate.',
    'Each paid monthly invoice adds the number of Credits shown for the Partner’s plan. Unused Credits roll over from month to month while the Subscription remains active.',
    'Credits are non-refundable, cannot be exchanged for cash and cannot be transferred to another person or account. Unused Credits expire when the Subscription ends (at the end of the last paid month) or immediately if this Agreement is terminated by Leaflegal under clause 13.3.',
    'The Partner authorises Leaflegal, through Stripe, to charge the Partner’s card each month until the Subscription is cancelled. If a payment fails, Leaflegal may pause Credits, Auto-buy and Lead purchases until payment is made.',
    'Upgrades take effect immediately: the new plan price is charged on the day of the upgrade, its Credits are added once payment succeeds, and the monthly billing date moves to that day. Downgrades take effect at the next renewal date. There are no refunds or credits for part months.',
    'Plans above 20,000 Credits a month, and any bespoke pricing, are only available by written agreement with Leaflegal.',
  ]],
  ['5. Introductory Offer', [
    'Partners subscribing for the first time may be offered an introductory first month at £1,000 plus VAT, which adds 1,000 Credits (the “Introductory Offer”). The Introductory Offer is available once per Partner and per group of connected companies.',
    'Unless the Partner cancels before the end of the first month, the Subscription automatically continues on the Starter plan at the price and number of Credits shown on the Billing page when the Partner subscribes, and renews monthly after that. The Partner may upgrade at any time under clause 4.5 or cancel at any time under clause 13.1.',
    'Leaflegal may withdraw or change the Introductory Offer or any promotional code at any time for new subscriptions, and may refuse an offer or code where it reasonably believes it is being misused.',
  ]],
  ['6. Buying Leads and Auto-buy', [
    'Each Lead has a price in Credits shown on the Platform before purchase. Leaflegal sets Lead prices at its discretion, currently using a scoring model that takes account of the loan amount, the Applicant’s revenue, time trading and credit history. Lead prices vary from Lead to Lead and can change at any time without notice, including the price of a Lead after it is listed and the pricing model and price ranges used for new Leads. This applies to Leads bought manually and to Leads bought by Auto-buy. The price charged is the price shown on the Platform at the moment the Lead is bought.',
    'The Partner can control what it pays through Auto-buy by setting a maximum price per Lead and daily and monthly limits. Auto-buy will not buy a Lead priced above the Partner’s maximum.',
    'When the Partner buys a Lead, or a Lead is bought by Auto-buy, the price is deducted from the Partner’s Credits and the purchase is final, except as set out in clause 7.',
    'By switching on Auto-buy the Partner instructs Leaflegal to buy every new Lead that matches the Partner’s saved criteria, within the Partner’s daily, monthly and per-Lead limits and its Credit balance. The Partner is responsible for keeping its criteria and limits up to date. Changes apply to Leads that arrive after they are saved.',
    'Where more than one partner’s Auto-buy settings match a Lead, Leaflegal decides which partner receives it using a fair rotation. Leaflegal does not guarantee that any particular Lead will be offered or allocated to the Partner.',
    'Leads are delivered on the Platform, by email to the addresses the Partner sets and, if configured, to the Partner’s webhook. The Partner is responsible for its own systems; a delivery failure to the Partner’s email or webhook does not make a Lead invalid, and the Lead remains available on the Platform.',
  ]],
  ['7. Invalid Leads and refunds of Credits', [
    'The Partner may request a refund of the Credits paid for a Lead through the Platform within 72 hours of purchase only if the Lead’s contact details are invalid. Contact details are invalid only if: (a) the phone number is not in service, or belongs to someone unconnected with the Applicant; or (b) the email address does not exist or permanently rejects email. No refund is available for any other reason, and no request can be made after 72 hours.',
    'For the avoidance of doubt, no refund is available because the Applicant does not answer or respond, changes their mind, says they did not make or no longer want the enquiry, chooses another provider, does not meet a lender’s criteria, is declined, or because the information the Applicant gave about their business turns out to be inaccurate.',
    'Leaflegal will review requests acting reasonably and may ask for evidence such as call logs. Leaflegal’s decision is final. The only remedy for an invalid Lead is the return of the Credits paid for it.',
  ]],
  ['8. The Partner’s obligations', [
    'The Partner warrants that, for as long as this Agreement continues, it and anyone acting for it: (a) holds every authorisation, permission and registration needed to carry on its business, including FCA authorisation or appointed representative status where the activities it carries on require it; (b) complies with all laws, rules and regulatory requirements that apply to it, including the FCA Handbook where applicable, Data Protection Law, consumer protection law and anti-money-laundering law; and (c) treats Applicants fairly, honestly and professionally.',
    'The Partner will: (a) contact Applicants only about their business finance enquiry; (b) identify itself clearly and explain truthfully how it obtained the Applicant’s details, namely through Leaflegal; (c) be clear and transparent about any fees it charges and any commission it receives, before the Applicant commits; (d) stop contacting an Applicant who asks it to; and (e) not make any statement suggesting that it is Leaflegal, that Leaflegal is a lender, or that finance is guaranteed.',
    'The Partner will not: (a) sell, rent, share or otherwise pass a Lead to any third party, except to lenders or finance providers where reasonably necessary to arrange finance the Applicant has asked for, and then only as permitted by Data Protection Law and the Partner’s own privacy notice; (b) add an Applicant to any marketing list, or send electronic marketing to an Applicant, unless it has its own lawful basis and, where PECR requires, valid consent; (c) use automated calling systems to contact Applicants; or (d) use a Lead for any purpose other than responding to the Applicant’s enquiry.',
    'The Partner will keep its Platform login details confidential, will not let anyone outside its own business use its account, and is responsible for everything done through its account.',
    'The Partner will tell Leaflegal within 5 working days if it receives a complaint that concerns how a Lead was generated or how the Applicant’s details were obtained, if it loses any regulatory authorisation, or if it becomes subject to regulatory enforcement action.',
  ]],
  ['9. Data protection', [
    'Leaflegal and the Partner are each independent controllers of the personal data in a Lead. Leaflegal is responsible for collecting it lawfully and for the consent and privacy information given to the Applicant at the point of enquiry. Each Lead includes a record of the consent wording the Applicant agreed to and when.',
    'Once a Lead is delivered, the Partner is responsible for its own copy. The Partner will: (a) process it only in line with Data Protection Law; (b) provide the Applicant with its own privacy information within the time Data Protection Law requires; (c) keep it secure using appropriate technical and organisational measures; (d) keep it no longer than necessary; and (e) handle requests from Applicants exercising their rights.',
    'Each party will promptly give the other reasonable help with any request from an Applicant, regulator or the Information Commissioner relating to a Lead, and the Partner will tell Leaflegal without undue delay, and in any event within 48 hours, if it becomes aware of a personal data breach affecting Lead data that may affect Leaflegal.',
    'Leaflegal’s handling of personal data about the Partner and its staff is described in the privacy policy at leaflegal.co/privacy-policy.',
  ]],
  ['10. Platform use, confidentiality and intellectual property', [
    'Leaflegal grants the Partner a non-exclusive, non-transferable right to use the Platform for its own business during this Agreement. The Partner will not copy, scrape, reverse engineer, resell or interfere with the Platform, or use it to build a competing service.',
    'All intellectual property in the Platform, the Leaflegal brand, its websites and its marketing belongs to Leaflegal or its licensors. Nothing in this Agreement transfers it to the Partner.',
    'Each party will keep confidential the other’s non-public business information, including Leaflegal’s pricing model and marketing methods, and use it only for this Agreement. This does not apply to information that is public through no fault of the recipient, or that must be disclosed by law or a regulator.',
  ]],
  ['11. Liability', [
    'Nothing in this Agreement limits or excludes liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for anything that cannot lawfully be limited or excluded.',
    'Subject to clause 11.1, Leaflegal will not be liable, whether in contract, tort (including negligence), breach of statutory duty or otherwise, for any loss of profit, revenue, business, commission, deals, goodwill or anticipated savings, or for any indirect or consequential loss.',
    'Subject to clause 11.1, Leaflegal’s total liability arising under or in connection with this Agreement in any 12-month period is limited to the total Subscription fees (excluding VAT) the Partner paid in the 3 months before the event giving rise to the claim.',
    'The Platform and Leads are provided on an “as is” and “as available” basis. Lead information is supplied by Applicants and Leaflegal does not warrant that it is accurate or complete. Leaflegal does not warrant that the Platform will be uninterrupted or error-free.',
  ]],
  ['12. Indemnity', [
    'The Partner will indemnify Leaflegal and its officers and staff against all losses, fines, penalties, damages, costs (including reasonable legal costs) and expenses arising from: (a) the Partner’s breach of clauses 8 or 9; (b) any claim by an Applicant or third party arising from the Partner’s contact with, advice to or arrangement of finance for an Applicant; and (c) any regulatory investigation or action relating to the Partner’s conduct.',
  ]],
  ['13. Cancellation, suspension and termination', [
    'The Partner may cancel its Subscription at any time on the Platform. Cancellation takes effect at the end of the current paid month; the Partner will not be charged again and can use its Credits until then. Fees already paid are not refundable.',
    'Either party may end this Agreement by giving the other at least 30 days’ notice by email. The Partner may also end it by cancelling its Subscription, in which case it ends when the Subscription ends.',
    'Leaflegal may suspend the Partner’s account or end this Agreement immediately by email if the Partner: (a) breaches this Agreement in a way that is serious or not put right within 7 days of being asked; (b) fails to pay any amount due; (c) loses a required regulatory authorisation or becomes subject to regulatory action; (d) becomes insolvent or ceases business; or (e) causes, in Leaflegal’s reasonable opinion, a risk of harm to Applicants, a regulatory risk or reputational damage to Leaflegal. If Leaflegal ends the Agreement under this clause, unused Credits are forfeited.',
    'When this Agreement ends, the Partner’s access to the Platform ends. Clauses 4.3, 7.3, 8.3, 9, 10, 11, 12, 14 and 15 and any other terms intended to survive will continue to apply, and the Partner must continue to protect any Lead data it holds.',
  ]],
  ['14. Changes to this Agreement and to pricing', [
    'Leaflegal may change this Agreement, its plans or Credit allocations by giving at least 30 days’ notice by email or on the Platform. If the Partner does not agree, it may cancel before the change takes effect. Continuing to use the Platform after the change takes effect means the Partner accepts it.',
    'Lead prices are not covered by the notice period in clause 14.1 and can change at any time under clause 6.1.',
    'Leaflegal may make changes immediately where needed to comply with law or a regulator, or that do not disadvantage the Partner.',
  ]],
  ['15. General', [
    'Anti-bribery and sanctions: each party will comply with the Bribery Act 2010 and applicable sanctions laws in connection with this Agreement.',
    'Force majeure: neither party is liable for delay or failure caused by events beyond its reasonable control, except for payment obligations.',
    'Assignment: the Partner may not assign or transfer this Agreement without Leaflegal’s written consent. Leaflegal may assign it to a successor to its business or a company in its group.',
    'Relationship: nothing in this Agreement creates a partnership, joint venture, agency or employment relationship. The Partner is not authorised to act or make commitments on behalf of Leaflegal.',
    'Entire agreement: this Agreement is the whole agreement between the parties about its subject matter and replaces any earlier discussions or proposals. Each party confirms it has not relied on any statement not set out in it.',
    'Severance and waiver: if any part of this Agreement is found invalid, the rest continues in force. A delay in enforcing a right is not a waiver of it.',
    'Third parties: no one other than the parties has any right to enforce this Agreement under the Contracts (Rights of Third Parties) Act 1999.',
    'Notices: notices must be sent by email, to hello@leaflegal.co for Leaflegal and to the Partner’s account email for the Partner, and are treated as received on the next working day.',
    'Electronic acceptance: the parties agree that this Agreement may be accepted electronically, including by ticking boxes and clicking to accept on the Platform, and that such acceptance, with the audit record kept by Leaflegal, is as valid and binding as a handwritten signature, in line with the Electronic Communications Act 2000.',
    'Law and jurisdiction: this Agreement and any dispute or claim arising out of or in connection with it (including non-contractual disputes) are governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction.',
  ]],
];

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Clause numbers are added per paragraph (1.1, 1.2...) so references like "clause 13.3" are stable.
export const termsHtml = () => SECTIONS.map(([t, ps], i) => `<h3>${esc(t)}</h3>${ps.map((p, j) => `<p><b>${i + 1}.${j + 1}</b> ${esc(p)}</p>`).join('')}`).join('');
export const termsHash = () => createHash('sha256').update(TERMS_VERSION + termsHtml()).digest('hex');

// A standalone signed copy (sent by email and downloadable from the Platform).
export function signedCopy(a) {
  const when = new Date(a.created_at).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/London' });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Leaflegal Partner Agreement – ${esc(a.company)}</title>
<style>body{font:15px/1.55 Arial,sans-serif;color:#1b3329;max-width:780px;margin:32px auto;padding:0 20px}h1{font-size:26px;margin:0 0 4px}h3{margin:26px 0 8px;font-size:16px}p{margin:0 0 10px}.box{border:1px solid #d3e0da;border-radius:10px;padding:16px 20px;margin:18px 0;background:#f6faf8}.sig{border-top:1px solid #d3e0da;margin-top:32px;padding-top:18px}.sig img{max-width:320px;height:auto;border-bottom:1px solid #1b3329;display:block;margin:8px 0}small{color:#5d7a6e}td{padding:3px 16px 3px 0;vertical-align:top}</style></head><body>
<h1>Leaflegal Partner Agreement</h1><small>Version ${esc(a.version)} · Agreement reference LL-PA-${String(a.id).padStart(5, '0')}</small>
<div class="box"><b>Between</b> ${esc(P)}<br><br><b>and</b> ${esc(a.company)}${a.company_number ? `, company number ${esc(a.company_number)}` : ''}${a.address ? `, of ${esc(a.address)}` : ''} (the “Partner”).</div>
${termsHtml()}
<div class="sig"><h3>Accepted for and on behalf of the Partner</h3>
${/^data:image\/png;base64,/.test(a.signature) ? `<img src="${esc(a.signature)}" alt="Signature of ${esc(a.signer_name)}">` : `<p><b>Accepted online</b> by ticking “I am authorised to accept this agreement on behalf of ${esc(a.company)}” and “I have read and agree to the Leaflegal Partner Agreement”.</p>`}
<table><tr><td>Name</td><td><b>${esc(a.signer_name)}</b></td></tr><tr><td>Position</td><td>${esc(a.signer_title)}</td></tr><tr><td>Company</td><td>${esc(a.company)}</td></tr>
<tr><td>Email</td><td>${esc(a.signer_email)}</td></tr><tr><td>Accepted</td><td>${esc(when)} (UK time)</td></tr><tr><td>IP address</td><td>${esc(a.ip || '–')}</td></tr>
<tr><td>Document hash</td><td><small>${esc(a.terms_hash)}</small></td></tr></table>
<p><small>The person accepting confirmed they have authority to bind the Partner. Accepted for and on behalf of Vertical Brands Ltd (trading as Leaflegal) on the same date.</small></p></div></body></html>`;
}
