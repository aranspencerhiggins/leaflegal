# Copy for /partners/legal (lead generation for solicitors and law firms). Edit text here, then run: python3 tools/build_pages.py
# Keep claims factual: prices, volumes and replacements are "agreed with you", not promised here.
# Deliberately excluded (owner's decision, 2026-11-04): personal injury, clinical negligence (LASPO s56 referral fee ban),
# housing disrepair and financial mis-selling / car finance claims (FCA-regulated claims management).

TITLE = 'Legal Leads for Solicitors & Law Firms | Pay Per Lead | Leaflegal'
DESC = ('Exclusive, pre-screened client enquiries for solicitors and law firms in conveyancing, family law, debt recovery, motoring offences, '
        'licensing, lease extensions and immigration. Pay per lead, sent to you while the enquiry is fresh.')

HERO_H1 = 'Client enquiries for solicitors and law firms'
HERO_LEAD = 'Exclusive, pre-screened leads from people and businesses looking for paid legal help. Pay per lead, sent to you while the enquiry is fresh.'
HERO_TICKS = [
    'Exclusive, with each enquiry sent to one firm',
    'Seven practice areas, matched to what you do',
    'Verified UK mobile number and email address',
    'Recorded consent to be contacted by your firm',
]

INTRO_H2 = 'New client enquiries, without running the ads yourself'
INTRO = [
    'Winning new private clients is expensive. Legal keywords are among the costliest in paid search, directory listings send the same enquiry to several firms, and most people don’t know which kind of solicitor they need until someone asks them the right questions. Leaflegal runs the campaigns, asks those questions and sends you finished enquiries from people who have asked to speak to a solicitor about their matter.',
    'Our campaigns run on social media, search and content, aimed at the moments people need legal help, like a house move, a relationship ending, a visa running out, a court summons, an invoice that hasn’t been paid, a licence review or a lease getting short. Each person answers a short series of questions about their situation, how urgent it is and where they are, and confirms they are looking for paid legal help rather than free advice.',
    'When an enquiry matches the practice areas and locations you cover, we send it to you, and only you, as soon as it is submitted. You get every answer, checked contact details and a record of the consent they gave, so your first call can be about their matter, not about who you are or why you are calling.',
]

AREAS_H2 = 'Practice areas we generate leads for'
AREAS_LEAD = 'Choose the areas your firm handles. We only send you enquiries that fit.'
# (icon, name, short card text, detail paragraph, typical matters)
AREAS = [
    ('property', 'Conveyancing', 'Purchases, sales, remortgages and transfers of equity.',
     'Conveyancing enquiries come from people at a clear point of decision, such as an offer accepted, a sale agreed or a remortgage due. They want a quote and a firm that answers the phone. Our enquiries tell you whether it is a purchase, sale or both, the rough property value and whether it is leasehold, so you can quote on the first call.',
     ['Purchases and sales', 'Sale and purchase together', 'Remortgages', 'Transfers of equity', 'Leasehold purchases']),
    ('globe', 'Immigration', 'Introductions only, for family visas, settlement, citizenship, work visas and appeals.',
     'Immigration clients are often working to a deadline and pay privately. Leaflegal does not give immigration advice. Our form asks only for the type of matter, urgency and contact details, and every enquiry goes to a firm or adviser regulated to give immigration advice. Everything about eligibility and routes comes from you.',
     ['Family and partner visas', 'Settlement and indefinite leave to remain', 'British citizenship', 'Work and business visas', 'Refusals and appeals']),
    ('heart', 'Family law', 'Divorce, finances on separation and child arrangements.',
     'People going through a separation want to understand their options quickly and usually want to speak to someone the same day. Since legal aid for most private family matters was withdrawn, most clients pay privately, which makes family enquiries some of the most valuable we generate.',
     ['Divorce and dissolution', 'Financial settlements and consent orders', 'Child arrangements', 'Cohabitation disputes', 'Prenuptial and postnuptial agreements']),
    ('cash', 'Debt recovery', 'Unpaid invoices and commercial debts owed to businesses.',
     'Business owners chasing unpaid invoices want a firm that acts quickly and charges clearly. Every debt recovery enquiry is business to business. We don’t send consumer debts. You get the rough amount owed, how old the debt is and whether it is disputed.',
     ['Letters before action', 'County Court and High Court claims', 'Statutory demands', 'Winding up petitions', 'Enforcement']),
    ('car', 'Motoring offences', 'Drink driving, speeding, totting up and driving bans.',
     'People facing a driving ban are highly motivated. Their job or business often depends on keeping their licence, they have a court date and they are prepared to pay privately for representation. These enquiries tend to convert quickly because the deadline is fixed.',
     ['Drink and drug driving', 'Speeding and totting up', 'Exceptional hardship arguments', 'Careless and dangerous driving', 'Failing to identify the driver']),
    ('key', 'Licensing', 'Premises licences, reviews, personal and taxi licences.',
     'Licensing enquiries come from pubs, bars, restaurants, late night venues and drivers, often with a hearing or opening date fixed. Businesses facing a review know what is at stake and want representation they can rely on.',
     ['New premises licences', 'Variations and transfers', 'Reviews and hearings', 'Personal licences', 'Taxi and private hire licences']),
    ('doc', 'Lease extensions', 'Statutory and informal lease extensions and collective enfranchisement.',
     'Flat owners with a shortening lease, often prompted by a sale or remortgage, want to know the cost and the process. We tell you roughly how many years are left on the lease, so you can prioritise those closest to 80 years.',
     ['Statutory lease extensions', 'Informal lease extensions', 'Collective enfranchisement', 'Lease variations', 'Freeholder disputes']),
]

LEAD_CONTENTS_TEXT = ('Each lead is the complete record of what the client told us, in the order they told us. There is no scraped data and no '
                      'guesswork, just the answers someone gave when they asked to speak to a solicitor.')
LEAD_CONTENTS = [
    ('target', 'Practice area and matter', 'The area of law, the type of matter and a short description in the client’s own words.'),
    ('clock', 'Urgency', 'How soon they need help, including any deadline, hearing or court date they know about.'),
    ('pin', 'Location', 'Where they are, so we only send you clients in the areas you cover, or nationally if you work remotely.'),
    ('shield', 'Paid help confirmed', 'Confirmation that they are looking for paid legal help, not legal aid or free advice.'),
    ('phone', 'Verified contact details', 'Name, a UK mobile number and an email address on a real domain, plus the best time to call.'),
    ('doc', 'Consent record', 'The exact wording they agreed to and when, so you can contact them with confidence.'),
]

PROCESS_STEPS = ('Tell us your practice areas', 'We match enquiries to your firm', 'Leads arrive quickly, by email or CRM')
PROCESS_DETAIL = [
    ('Tell us your practice areas', 'Apply to become a partner firm and tell us the practice areas you handle, the locations you cover, how you are regulated and how many leads your team can take each month. We use this to set up your matching criteria.'),
    ('We match enquiries to your firm', 'People complete a short enquiry about their legal matter. We check that each one meets our minimum criteria and yours, then match it to one firm. An enquiry is never sent to several firms at once.'),
    ('Leads arrive quickly', 'Matched leads are sent to you as soon as we have checked the enquiry, by email or straight into your case management system or CRM. Each lead includes every answer, the source, a timestamp and the consent record, so you can call while the enquiry is fresh.'),
]

QUAL_H2 = 'Who reaches you, and who doesn’t'
QUAL_LEAD = ('Our enquiry flow filters people before they are submitted. Anyone we can’t help is told politely and pointed in the right '
             'direction, so they never become a lead you have to deal with.')
QUAL_YES = [
    'People and businesses in England and Wales',
    'A matter in one of the practice areas you handle',
    'Looking for paid legal help, not legal aid or free advice',
    'A valid UK mobile number and an email address on a real domain',
    'Clear, recorded consent to be contacted by a solicitor',
]
QUAL_NO = [
    'Personal injury and clinical negligence claims',
    'Housing disrepair and mis-selling claims',
    'People who only want legal aid or free advice',
    'Matters outside England and Wales',
    'Enquiries without consent to be contacted',
]
QUAL_NOTE = ('We don’t generate personal injury or clinical negligence leads, because paying referral fees for them is prohibited under section 56 of '
             'the Legal Aid, Sentencing and Punishment of Offenders Act 2012. We also don’t handle financial claims, which are a regulated claims management activity.')

PRICING_H2 = 'How pay per lead works'
PRICING = [
    'You pay for each lead we deliver to you, at a price agreed with you before you start. There are no shared or recycled enquiries. You know exactly what each lead costs, so you can measure your return against the instructions you win.',
    'Pricing depends on the practice areas and locations you choose. A contested family finances enquiry is worth more to a firm than a simple remortgage, and a narrow area around one office produces fewer matches than national coverage, so each is priced accordingly. We will talk this through with you and put a proposal together.',
    'You stay in control of volume. The minimum is 10 leads per month. Above that, tell us how many leads your team can handle each month and we will match to that number, so you are never flooded with enquiries you can’t call back quickly. If you want more, or need to pause, just let us know.',
    'Billing, volumes and any rules about invalid leads are set out in your partner agreement before your first lead is delivered, so there are no surprises.',
]

COMPLIANCE_H2 = 'Compliance, consent and professional conduct'
COMPLIANCE = [
    ('Referral arrangements', 'Leaflegal is an introducer. Under the SRA Code of Conduct, you must make sure clients are told about any financial arrangement you have with an introducer, and that the arrangement doesn’t affect your independence or your advice. Our consent wording explains to every client that we are paid by the firms we introduce them to, and we send you that wording with each lead so your client care letter can match it.'),
    ('No prohibited referral fees', 'We only work in areas where paying for introductions is permitted. We don’t generate personal injury or clinical negligence enquiries, where referral fees are banned under LASPO, and we don’t handle financial mis-selling claims, which are regulated claims management.'),
    ('Clear consent from every client', 'Before an enquiry can be submitted, the person must tick two separate boxes. The first confirms they have read our terms and privacy policy and understand that Leaflegal is an introduction service, not a law firm. The second gives consent for their details to be shared with a firm we match them with, and for that firm to contact them by phone, email or text about their matter. We record the exact wording and the time.'),
    ('Data protection', 'Leaflegal is a trading name of Vertical Brands Ltd, which acts as the data controller for the information collected through our enquiry forms. Once a lead is delivered, you become the controller of your copy and are responsible for handling it in line with UK data protection law and your own privacy notice. Some enquiries, such as family, immigration or motoring matters, can include special category or criminal offence data, so we only collect what you need to make first contact, and never share matter details with advertising platforms.'),
    ('Your regulatory responsibilities', 'Leaflegal is not a law firm, is not regulated by the Solicitors Regulation Authority and does not give legal advice. You are responsible for being authorised for the work you take on, including immigration advice and reserved activities such as conveyancing, and for your own conflict checks, client care and fees.'),
]

FIRMS_H2 = 'Who partners with Leaflegal'
FIRMS = [
    ('user', 'High street firms', 'Multi-practice firms looking for a steady flow of private client work across property, family and motoring.'),
    ('property', 'Conveyancing practices', 'SRA and CLC regulated firms handling residential purchases, sales and remortgages.'),
    ('globe', 'Specialist immigration firms', 'Solicitors and advisers registered with the Immigration Advice Authority handling visas, settlement, citizenship and appeals.'),
    ('heart', 'Family law practices', 'Firms focused on divorce, finances and children, from fixed-fee services to complex financial remedy work.'),
    ('briefcase', 'Commercial and licensing teams', 'Firms recovering business debts and representing licensed premises at hearings.'),
    ('car', 'Motoring specialists', 'Firms and solicitor advocates who represent private-paying clients facing driving bans and motoring charges.'),
]

GUIDE_H2 = 'Getting the most from your legal leads'
GUIDE_LEAD = 'The firms that win the most instructions tend to do the same few things well. Here is what we recommend.'
GUIDE = [
    ('Call quickly', 'The best time to call a legal enquiry is within minutes of it arriving. The person has just described their situation, they are expecting a call and they are often anxious to talk. Every hour you wait makes it more likely they will have spoken to another firm. Set up alerts so the right fee earner or intake team knows the moment a lead lands.'),
    ('Use what they have already told you', 'Every lead includes the practice area, the type of matter, any deadline, their location and a description in their own words. Opening with “I understand you’ve had a visa refusal and need to act within 14 days” shows you have listened and gets straight to the useful part of the conversation.'),
    ('Explain who you are and how you were introduced', 'The client agreed to be contacted by a solicitor after making an enquiry through Leaflegal. Mention that when you introduce yourself, and confirm it in your client care letter alongside any referral arrangement you need to disclose.'),
    ('Be clear about fees', 'Private clients want to know what their matter will cost before they commit. Fixed fees, clear estimates and an honest view of the next steps build trust quickly, and trust is what turns an enquiry into an instruction.'),
    ('Follow up properly', 'Not everyone is ready to instruct on the first call. Some are waiting to speak to a partner, gathering documents or saving for fees. A short follow-up email and a second call a few days later often turn a “not yet” into an instruction.'),
    ('Tell us what works', 'The more feedback you give us, the better your leads become. Let us know which enquiries turn into instructions, which don’t and why, and we can adjust your practice areas, matter types and locations to match the work you want.'),
]

FAQ_H2 = 'Legal lead FAQs'
FAQ_GROUPS = [
    ('Getting started', [
        ('What is Leaflegal?', 'Leaflegal is an introduction service run by Vertical Brands Ltd. We run marketing campaigns for people and businesses who need legal help, ask them a short set of questions about their matter and, with their consent, introduce each one to a single partner firm that handles that type of work.'),
        ('Which practice areas do you cover?', 'Conveyancing, family law, debt recovery for businesses, motoring offences, licensing, lease extensions and immigration. You choose which of these you want to receive.'),
        ('Who can become a partner firm?', 'SRA-regulated solicitors’ firms, CILEx-regulated practices, CLC-regulated conveyancers and, for immigration, advisers registered with the Immigration Advice Authority (formerly the OISC). You must be authorised for the work you take on.'),
        ('How do I apply?', 'Complete the partner application. It takes a couple of minutes and asks about your practice areas, how you are regulated, the areas you cover and how many leads you want each month. We will then call you to agree your criteria, delivery and pricing.'),
        ('How quickly can I start?', 'Once your criteria, pricing and delivery are agreed and your partner agreement is in place, leads start as soon as matching enquiries come in. Volumes depend on your practice areas and locations.'),
        ('Can I see a sample lead?', 'Yes. When we talk through your application, we will show you exactly what a lead looks like, including the fields, the format and the consent record, before you commit to anything.'),
    ]),
    ('Leads and matching', [
        ('Are the leads exclusive?', 'Yes. Each enquiry is matched to one firm only. We don’t send the same lead to several firms and we don’t resell leads that have already been delivered.'),
        ('What is included in each lead?', 'The client’s name, a UK mobile number and an email address, the practice area and type of matter, a short description in their own words, how urgent it is, where they are and the best time to call. You also get the source, a timestamp and the consent record.'),
        ('Where do your leads come from?', 'From people completing our own enquiry forms, usually after seeing one of our campaigns on social media or finding us through search. We don’t buy in data, scrape directories or pass on cold contacts.'),
        ('Can I choose locations?', 'Yes. Tell us the towns, counties or regions you cover, or that you work nationally and remotely, and we only send you enquiries from those areas.'),
        ('Can I choose specific matter types?', 'Yes. Within each practice area you can tell us the matters you want and the ones you don’t. For example, you might want contested divorce finances but not uncontested divorce, or purchases but not remortgages.'),
        ('Do you send legal aid enquiries?', 'No. Every lead has confirmed they are looking for paid legal help. People who only want legal aid or free advice are pointed to the right place before their enquiry is submitted.'),
        ('Do you cover Scotland and Northern Ireland?', 'Not at the moment. Our legal leads are for matters in England and Wales, apart from immigration introductions, which can come from anywhere in the UK.'),
        ('How do you decide which firm gets a lead?', 'Each lead goes to one firm whose practice areas, matter types and locations it fits, taking into account each firm’s monthly cap. Where more than one firm could take a lead, we balance distribution fairly between them.'),
    ]),
    ('Pricing and volumes', [
        ('How much does each lead cost?', 'Pricing is agreed with each firm before it starts and depends on the practice areas, matter types and locations you choose. Apply and we will put a proposal together for you.'),
        ('Is there a minimum number of leads?', 'Yes. The minimum is 10 leads per month. Above that, tell us how many leads you want and we will match to that number, based on your criteria and the enquiries we are generating.'),
        ('Can I set a monthly cap?', 'Yes. You tell us how many leads you want each month and we stop matching to you once you reach that number. You can change it at any time.'),
        ('Can I pause leads?', 'Yes. If your team is at capacity or a fee earner is away, tell us and we will pause matching until you are ready again.'),
        ('Do you guarantee a number of leads?', 'We can’t guarantee exact volumes, because they depend on how many people enquire and how closely they match your criteria. We will give you an honest view of likely volumes when we agree your criteria.'),
    ]),
    ('Delivery', [
        ('How are leads delivered?', 'By email or straight into your case management system or CRM, using a lead email address or a webhook. We will set up whichever suits your intake team.'),
        ('How quickly are leads delivered?', 'As soon as the enquiry is submitted, so you can call while the client is still thinking about their matter.'),
        ('Can leads go to more than one person?', 'Yes. We can send leads to a shared intake inbox, several email addresses or your CRM, where you can assign them to the right fee earner.'),
    ]),
    ('Compliance and conduct', [
        ('Is Leaflegal a law firm?', 'No. Leaflegal is an introduction service. We don’t give legal advice and we are not regulated by the SRA. We make this clear to every client before they submit an enquiry.'),
        ('Do I need to disclose the referral to the client?', 'Yes. The SRA Code of Conduct requires you to make sure clients are told about any financial arrangement you have with an introducer. Our consent wording tells clients we are paid by the firms we introduce them to, and we send you that wording with each lead.'),
        ('Why don’t you offer personal injury leads?', 'Paying referral fees for personal injury and clinical negligence work is prohibited under section 56 of LASPO, so we don’t generate them.'),
        ('Can you send immigration leads to non-solicitor advisers?', 'Only to advisers registered with the Immigration Advice Authority (formerly the OISC) at the right level for the work, or to firms regulated by the SRA or CILEx Regulation. Leaflegal never gives immigration advice itself.'),
        ('Have the clients agreed to be contacted?', 'Yes. Every client ticks a box agreeing to their details being shared with a firm we match them with, and to that firm contacting them by phone, email or text about their matter. We record the wording and the time.'),
        ('Who is responsible for the data once I receive a lead?', 'You become the data controller for your copy and are responsible for handling it in line with UK data protection law and your own privacy notice. You should only use it to contact the client about their enquiry.'),
        ('What about conflicts of interest?', 'Run your normal conflict checks before taking on a matter. If you find a conflict, don’t act and let us know, and we will treat the lead as your partner agreement sets out.'),
    ]),
    ('Lead quality', [
        ('What counts as a valid lead?', 'A valid lead has accurate contact details and matches the practice areas, matter types and locations agreed with you. It stays valid if the client later decides not to instruct you or chooses another firm.'),
        ('What if a lead has wrong contact details?', 'Let us know within the review period in your partner agreement. Where a lead is genuinely invalid, we will deal with it as your agreement sets out.'),
        ('Will every lead become an instruction?', 'No. Some people are comparing firms, some decide not to proceed and some can’t afford the fees. We provide qualified enquiries, not guaranteed instructions.'),
        ('How can I convert more leads?', 'Call quickly, use what the client has already told you, explain how you were introduced, be clear about fees and follow up politely. Telling us which leads convert also helps us refine your criteria.'),
    ]),
]
FAQ = [qa for _, qas in FAQ_GROUPS for qa in qas]
assert len({q for q, _ in FAQ}) == len(FAQ)
