// Leaflegal Law Firm Referral Agreement (lead supply terms between Vertical Brands Ltd and the law firm).
// DRAFT FOR SOLICITOR REVIEW. This wording has not yet been checked by a solicitor. Have it reviewed (SRA Code of Conduct
// referral rules, LASPO s56, IAA and CILEx rules, UK GDPR special category data) before firms sign it in production.
// Bump TERMS_VERSION whenever the wording changes: every signature stores the version and a hash of the exact text.
// Keep commercial clauses in step with api/_lib/platform.js (PACKS, CUSTOM, TRIAL, RETURN_HOURS) and the Billing page.
import { createHash } from 'node:crypto';

export const TERMS_VERSION = '2026-11-22';
export const NEEDS_REVIEW = true; // draft wording, to be checked by a solicitor
export const P = 'Vertical Brands Ltd (trading as Leaflegal), a company registered in England and Wales with company number 14254961, whose registered office is at 20–22 Wenlock Road, London, N1 7GU';

export const SECTIONS = [
  ['1. About this agreement', [
    `This Law Firm Referral Agreement (the “Agreement”) is between ${P} (“Leaflegal”, “we”, “us”) and the law firm named in the signature block (the “Firm”, “you”). It sets out the terms on which Leaflegal introduces people and businesses looking for legal help to the Firm through the Leaflegal Platform at leaflegal.co/platform (the “Platform”).`,
    'The Agreement starts when it is accepted electronically by a person with authority to bind the Firm and continues until ended under clause 14. By signing, the Firm confirms it is acting in the course of its business and not as a consumer.',
    'If anything in a Platform page, email or proposal conflicts with this Agreement, this Agreement wins unless we have both agreed otherwise in writing and referred to the clause being changed.',
  ]],
  ['2. Definitions', [
    '“Lead” means an enquiry submitted through a Leaflegal website by a person or business looking for help from a law firm, together with the information they provided, as made available on the Platform.',
    '“Client” means the person, and where relevant the business, that submitted a Lead.',
    '“Regulator” means the body the Firm names on the Platform as regulating it, being the Solicitors Regulation Authority (“SRA”), CILEx Regulation, the Immigration Advice Authority (“IAA”), the Council for Licensed Conveyancers or another approved regulator Leaflegal accepts, together with the registration number the Firm gives for it.',
    '“Credits” means the units credited to the Firm’s Platform account under its Subscription and used to buy Leads. One Credit represents £1 of Lead value. Credits are not money, have no cash value and are not e-money.',
    '“Subscription” means the Firm’s recurring monthly plan for Credits, including the Introductory Offer where it applies.',
    '“Auto-buy” means the Platform feature that buys Leads for the Firm automatically according to the criteria and limits the Firm sets.',
    '“Data Protection Law” means the UK GDPR, the Data Protection Act 2018, the Privacy and Electronic Communications (EC Directive) Regulations 2003 (“PECR”) and any related guidance from the Information Commissioner’s Office, each as amended.',
  ]],
  ['3. What Leaflegal provides', [
    'Leaflegal runs marketing that invites people and businesses in the United Kingdom, and in some cases people abroad with a UK immigration matter, to describe what they need help with. It collects their details and consent and makes the resulting Leads available to subscribing law firms on the Platform.',
    'Leaflegal is an introducer only. It is not a law firm, is not regulated by the SRA or any other legal regulator, does not give legal advice, does not recommend any firm on the merits of a matter and does not take part in any retainer between the Firm and a Client.',
    'Each Lead is exclusive. Once the Firm buys a Lead, Leaflegal will not sell or supply that Lead to any other firm on the Platform, except where the Client later asks Leaflegal to match them with a different firm. Leaflegal may keep a record of the Lead for its own legal, accounting, quality and fraud prevention purposes.',
    'Before purchase the Firm can see a summary of each Lead and its price, including the practice area, matter type, rough location, urgency and the Client’s answers. The Client’s name and full contact details are released only on purchase.',
    'Leaflegal will offer the Firm only Leads in practice areas its Regulator allows. In particular, immigration Leads are offered only to firms regulated by the SRA, CILEx Regulation or the IAA.',
    'Leaflegal does not supply, and the Firm may not use the Platform to seek, Leads for personal injury or clinical negligence claims or any other work for which referral fees are banned by section 56 of the Legal Aid, Sentencing and Punishment of Offenders Act 2012 (“LASPO”). If such a Lead is supplied by mistake, the Firm must not act on it in return for the fee and may ask for its Credits back under clause 8.',
    'Leaflegal does not guarantee the number of Leads available, that Leads will match the Firm’s criteria, that any Client will answer, instruct the Firm or proceed, or any level of conversion, fees or return.',
  ]],
  ['4. The Firm’s regulatory status', [
    'The Firm warrants that it is, and will remain for as long as this Agreement continues, authorised or registered by its Regulator to carry out the work it accepts from Leads, and that the Regulator and registration number it gives on the Platform are correct. Leaflegal may check them against the Regulator’s public register at any time.',
    'The Firm will tell Leaflegal at once, and in any event within 2 working days, if its authorisation or registration is suspended, made subject to conditions, withdrawn or not renewed, if it becomes subject to an intervention or regulatory enforcement action, or if any fee earner handling Leads is no longer authorised to do so. Leaflegal may pause the Firm’s account until the position is clear.',
    'The Firm will keep the practice areas and matters it selects on the Platform within what it is regulated and competent to do.',
  ]],
  ['5. Referral fees and professional conduct', [
    'The Firm pays Leaflegal for each Lead it buys. The Firm acknowledges that this payment is a referral fee for the purposes of the SRA Standards and Regulations and any equivalent rules of its Regulator, and that it must comply with those rules.',
    'Before or at the time it accepts instructions from a Client, the Firm will tell the Client in writing that it was introduced by Leaflegal, that it pays Leaflegal a fee for the introduction, and the amount or basis of that fee, together with any other information its Regulator requires.',
    'The Firm will keep its independence and act in the Client’s best interests at all times. Nothing in this Agreement allows Leaflegal to influence the advice the Firm gives, how it conducts a matter or whether it accepts it, and the Firm must not let the referral arrangement affect its professional judgement.',
    'The Firm alone decides whether to accept a matter, after its own conflict, identity, anti-money laundering and competence checks. It sets its own fees and terms of business, is responsible for its client care letter, its advice and the conduct of the matter, and handles any complaint under its own complaints procedure, including telling the Client about their right to complain to the Legal Ombudsman or other body that applies.',
    'The Firm will not tell a Client or anyone else that Leaflegal is a law firm, that Leaflegal has given advice or that a particular outcome is guaranteed.',
  ]],
  ['6. Subscriptions, Credits and payment', [
    'The Firm must hold an active Subscription to buy Leads. Subscriptions are billed monthly in advance by card through our payment provider, Stripe. Prices on the Platform exclude VAT, which is added at the prevailing rate.',
    'Each paid monthly invoice adds the number of Credits shown for the Firm’s plan. Unused Credits roll over from month to month while the Subscription remains active.',
    'Credits are non-refundable, cannot be exchanged for cash and cannot be transferred to another person or account. Unused Credits expire when the Subscription ends (at the end of the last paid month) or immediately if this Agreement is ended by Leaflegal under clause 14.3.',
    'The Firm authorises Leaflegal, through Stripe, to charge the Firm’s card each month until the Subscription is cancelled. If a payment fails, Leaflegal may pause Credits, Auto-buy and Lead purchases until payment is made.',
    'Upgrades take effect immediately. The new plan price is charged on the day of the upgrade, its Credits are added once payment succeeds, and the monthly billing date moves to that day. Downgrades take effect at the next renewal date. There are no refunds or credits for part months.',
    'Plans above 20,000 Credits a month, and any bespoke pricing, are only available by written agreement with Leaflegal.',
  ]],
  ['7. Introductory Offer', [
    'Firms subscribing for the first time may be offered an introductory first month at £1,000 plus VAT, which adds 1,000 Credits (the “Introductory Offer”). The Introductory Offer is available once per Firm and per group of connected firms.',
    'Unless the Firm cancels before the end of the first month, the Subscription automatically continues on the Starter plan at the price and number of Credits shown on the Billing page when the Firm subscribes, and renews monthly after that. The Firm may upgrade at any time under clause 6.5 or cancel at any time under clause 14.1.',
    'Leaflegal may withdraw or change the Introductory Offer or any promotional code at any time for new subscriptions, and may refuse an offer or code where it reasonably believes it is being misused.',
  ]],
  ['8. Buying Leads, Auto-buy and refunds of Credits', [
    'Each Lead has a price in Credits shown on the Platform before purchase. Leaflegal sets Lead prices at its discretion, currently by practice area and matter type, adjusted for the quality grade of the enquiry, its urgency, whether the Client is a business and the value involved. Lead prices vary and can change at any time without notice, including the price of a Lead after it is listed. A Lead not sold within 72 hours may be offered at a lower price. The price charged is the price shown on the Platform at the moment the Lead is bought, whether bought by hand or by Auto-buy.',
    'By switching on Auto-buy the Firm instructs Leaflegal to buy every new Lead that matches the Firm’s saved criteria, within the Firm’s maximum price per Lead, daily and monthly limits and Credit balance. The Firm is responsible for keeping its criteria and limits up to date. Changes apply to Leads that arrive after they are saved. Where more than one firm’s Auto-buy settings match a Lead, Leaflegal decides which firm receives it using a fair rotation.',
    'When the Firm buys a Lead, or a Lead is bought by Auto-buy, the price is deducted from the Firm’s Credits and the purchase is final, except as set out in this clause. Leads are delivered on the Platform, by email to the addresses the Firm sets and, if configured, to the Firm’s CRM or webhook. A delivery failure to the Firm’s own systems does not make a Lead invalid.',
    'The Firm may ask for the Credits paid for a Lead to be returned, through the Platform and within 72 hours of purchase, if (a) the phone number is not in service or belongs to someone unconnected with the Client, (b) the email address does not exist or permanently rejects email, or, at Leaflegal’s discretion after review, (c) the Lead is clearly outside the practice area or region stated, (d) it duplicates a Lead the Firm has already bought, or (e) it is work of a kind described in clause 3.6.',
    'No Credits are returned because the Client does not answer, changes their mind, chooses another firm, cannot afford the Firm’s fees, has no case or is not eligible, or because a conflict of interest prevents the Firm from acting. Leaflegal will review requests reasonably and may ask for evidence such as call logs. Its decision is final, and the return of the Credits paid is the only remedy for an invalid Lead.',
  ]],
  ['9. How the Firm treats Clients', [
    'The Firm will contact a Client promptly, only about the enquiry the Client made, identify itself clearly and explain truthfully that it received the Client’s details through Leaflegal. It will stop contacting a Client who asks it to.',
    'The Firm will not sell, rent, share or otherwise pass a Lead to any third party, except to counsel, experts or other providers where reasonably needed to act on the Client’s instructions and only as Data Protection Law and its own privacy notice allow. It will not use automated calling systems to contact Clients, add a Client to any marketing list or send electronic marketing to a Client unless it has its own lawful basis and, where PECR requires, valid consent.',
    'The Firm will keep its Platform login details confidential, will not let anyone outside its own firm use its account, and is responsible for everything done through its account.',
    'The Firm will tell Leaflegal within 5 working days if it receives a complaint about how a Lead was generated or how the Client’s details were obtained.',
  ]],
  ['10. Data protection', [
    'Leaflegal and the Firm are each independent controllers of the personal data in a Lead. Leaflegal is responsible for collecting it lawfully and for the consent and privacy information given to the Client at the point of enquiry. Each Lead includes a record of the consent wording the Client agreed to and when.',
    'Leads may include special category data (for example about health, family life, immigration status or nationality) and personal data about criminal allegations or offences. Each party will handle such data only where it has a lawful basis and a condition under Data Protection Law, keep it secure with appropriate technical and organisational measures and limit access to the people who need it.',
    'Once a Lead is delivered, the Firm is responsible for its own copy. The Firm will use it only to respond to and act on the Client’s enquiry, give the Client its own privacy information within the time Data Protection Law requires, keep it no longer than necessary and handle requests from Clients exercising their rights. The Firm will not resell any Lead or any data in it.',
    'Each party will promptly give the other reasonable help with any request from a Client, a regulator or the Information Commissioner relating to a Lead. The Firm will tell Leaflegal without undue delay, and in any event within 48 hours, if it becomes aware of a personal data breach affecting Lead data that may affect Leaflegal.',
    'Leaflegal’s handling of personal data about the Firm and its staff is described in the privacy policy at leaflegal.co/privacy-policy.',
  ]],
  ['11. Platform use, confidentiality and intellectual property', [
    'Leaflegal grants the Firm a non-exclusive, non-transferable right to use the Platform for its own practice during this Agreement. The Firm will not copy, scrape, reverse engineer, resell or interfere with the Platform, or use it to build a competing service.',
    'All intellectual property in the Platform, the Leaflegal brand, its websites and its marketing belongs to Leaflegal or its licensors. Nothing in this Agreement transfers it to the Firm.',
    'Each party will keep confidential the other’s non-public business information, including Leaflegal’s pricing model and marketing methods, and use it only for this Agreement. This does not apply to information that is public through no fault of the recipient, or that must be disclosed by law or a regulator. Nothing in this Agreement stops the Firm meeting its duty of confidentiality to its own clients or its reporting duties to its Regulator.',
  ]],
  ['12. Liability', [
    'Nothing in this Agreement limits or excludes liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for anything that cannot lawfully be limited or excluded.',
    'Subject to clause 12.1, Leaflegal will not be liable, whether in contract, tort (including negligence), breach of statutory duty or otherwise, for any loss of profit, fees, business, instructions, goodwill or anticipated savings, or for any indirect or consequential loss.',
    'Subject to clause 12.1, Leaflegal’s total liability arising under or in connection with this Agreement in any 12-month period is limited to the total Subscription fees (excluding VAT) the Firm paid in the 3 months before the event giving rise to the claim.',
    'The Platform and Leads are provided on an “as is” and “as available” basis. Lead information is supplied by Clients and Leaflegal does not warrant that it is accurate or complete. Leaflegal does not warrant that the Platform will be uninterrupted or error-free.',
  ]],
  ['13. Indemnity', [
    'The Firm will indemnify Leaflegal and its officers and staff against all losses, fines, penalties, damages, costs (including reasonable legal costs) and expenses arising from (a) the Firm’s breach of clauses 4, 5, 9 or 10, (b) any claim by a Client or third party arising from the Firm’s contact with, advice to or work for a Client, and (c) any regulatory investigation or action relating to the Firm’s conduct.',
  ]],
  ['14. Cancellation, suspension and termination', [
    'The Firm may cancel its Subscription at any time on the Platform. Cancellation takes effect at the end of the current paid month. The Firm will not be charged again and can use its Credits until then. Fees already paid are not refundable.',
    'Either party may end this Agreement by giving the other at least 30 days’ notice by email. The Firm may also end it by cancelling its Subscription, in which case it ends when the Subscription ends.',
    'Leaflegal may suspend the Firm’s account or end this Agreement immediately by email if the Firm (a) breaches this Agreement in a way that is serious or not put right within 7 days of being asked, (b) fails to pay any amount due, (c) loses or has restricted the authorisation or registration described in clause 4, or becomes subject to an intervention or regulatory action, (d) becomes insolvent or ceases to practise, or (e) causes, in Leaflegal’s reasonable opinion, a risk of harm to Clients, a regulatory risk or reputational damage to Leaflegal. If Leaflegal ends the Agreement under this clause, unused Credits are forfeited.',
    'When this Agreement ends, the Firm’s access to the Platform ends. Clauses 5.2, 5.4, 6.3, 8.5, 9.2, 10, 11, 12, 13, 15 and 16 and any other terms intended to survive will continue to apply, and the Firm must continue to protect any Lead data it holds.',
  ]],
  ['15. Changes to this Agreement and to pricing', [
    'Leaflegal may change this Agreement, its plans or Credit allocations by giving at least 30 days’ notice by email or on the Platform. If the Firm does not agree, it may cancel before the change takes effect. Continuing to use the Platform after the change takes effect means the Firm accepts it.',
    'Lead prices are not covered by the notice period in clause 15.1 and can change at any time under clause 8.1.',
    'Leaflegal may make changes immediately where needed to comply with law or a regulator, or that do not disadvantage the Firm.',
  ]],
  ['16. General', [
    'Anti-bribery and sanctions. Each party will comply with the Bribery Act 2010 and applicable sanctions laws in connection with this Agreement.',
    'Force majeure. Neither party is liable for delay or failure caused by events beyond its reasonable control, except for payment obligations.',
    'Assignment. The Firm may not assign or transfer this Agreement without Leaflegal’s written consent. Leaflegal may assign it to a successor to its business or a company in its group.',
    'Relationship. Nothing in this Agreement creates a partnership, joint venture, agency or employment relationship. The Firm is not authorised to act or make commitments on behalf of Leaflegal, and Leaflegal does not act for the Firm or for any Client.',
    'Entire agreement. This Agreement is the whole agreement between the parties about its subject matter and replaces any earlier discussions or proposals. Each party confirms it has not relied on any statement not set out in it.',
    'Severance and waiver. If any part of this Agreement is found invalid, the rest continues in force. A delay in enforcing a right is not a waiver of it.',
    'Third parties. No one other than the parties has any right to enforce this Agreement under the Contracts (Rights of Third Parties) Act 1999.',
    'Notices. Notices must be sent by email, to hello@leaflegal.co for Leaflegal and to the Firm’s account email for the Firm, and are treated as received on the next working day.',
    'Electronic acceptance. The parties agree that this Agreement may be accepted electronically, including by ticking boxes and clicking to accept on the Platform, and that such acceptance, with the audit record kept by Leaflegal, is as valid and binding as a handwritten signature, in line with the Electronic Communications Act 2000.',
    'Law and jurisdiction. This Agreement and any dispute or claim arising out of or in connection with it (including non-contractual disputes) are governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction.',
  ]],
];

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Clause numbers are added per paragraph (1.1, 1.2...) so references like "clause 13.3" are stable.
export const termsHtml = () => SECTIONS.map(([t, ps], i) => `<h3>${esc(t)}</h3>${ps.map((p, j) => `<p><b>${i + 1}.${j + 1}</b> ${esc(p)}</p>`).join('')}`).join('');
export const termsHash = () => createHash('sha256').update(TERMS_VERSION + termsHtml()).digest('hex');

// A standalone signed copy (sent by email and downloadable from the Platform).
export function signedCopy(a) {
  const when = new Date(a.created_at).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/London' });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Leaflegal Referral Agreement, ${esc(a.company)}</title>
<style>body{font:15px/1.55 Arial,sans-serif;color:#1b3329;max-width:780px;margin:32px auto;padding:0 20px}h1{font-size:26px;margin:0 0 4px}h3{margin:26px 0 8px;font-size:16px}p{margin:0 0 10px}.box{border:1px solid #d3e0da;border-radius:10px;padding:16px 20px;margin:18px 0;background:#f6faf8}.sig{border-top:1px solid #d3e0da;margin-top:32px;padding-top:18px}.sig img{max-width:320px;height:auto;border-bottom:1px solid #1b3329;display:block;margin:8px 0}small{color:#5d7a6e}td{padding:3px 16px 3px 0;vertical-align:top}</style></head><body>
<h1>Leaflegal Law Firm Referral Agreement</h1><small>Version ${esc(a.version)} · Agreement reference LL-RA-${String(a.id).padStart(5, '0')}</small>
<div class="box"><b>Between</b> ${esc(P)}<br><br><b>and</b> ${esc(a.company)}${a.company_number ? `, company number ${esc(a.company_number)}` : ''}${a.address ? `, of ${esc(a.address)}` : ''} (the “Firm”).</div>
${termsHtml()}
<div class="sig"><h3>Accepted for and on behalf of the Firm</h3>
${/^data:image\/png;base64,/.test(a.signature) ? `<img src="${esc(a.signature)}" alt="Signature of ${esc(a.signer_name)}">` : `<p><b>Accepted online</b> by ticking “I am authorised to accept this agreement on behalf of ${esc(a.company)}” and “I have read and agree to the Leaflegal Law Firm Referral Agreement”.</p>`}
<table><tr><td>Name</td><td><b>${esc(a.signer_name)}</b></td></tr><tr><td>Position</td><td>${esc(a.signer_title)}</td></tr><tr><td>Company</td><td>${esc(a.company)}</td></tr>
<tr><td>Email</td><td>${esc(a.signer_email)}</td></tr><tr><td>Accepted</td><td>${esc(when)} (UK time)</td></tr><tr><td>IP address</td><td>${esc(a.ip || '–')}</td></tr>
<tr><td>Document hash</td><td><small>${esc(a.terms_hash)}</small></td></tr></table>
<p><small>The person accepting confirmed they have authority to bind the Firm. Accepted for and on behalf of Vertical Brands Ltd (trading as Leaflegal) on the same date.</small></p></div></body></html>`;
}
