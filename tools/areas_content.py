# Practice areas for Leaflegal. Edit the copy here, then run: python3 tools/build_pages.py
# Only these seven areas (owner's decision, 2026-11-21). Never add personal injury, clinical negligence (LASPO s56 referral fee ban),
# housing disrepair, financial mis-selling or other claims management work (FCA-regulated).
# Immigration is referral only: Leaflegal must never give immigration advice or services (Immigration and Asylum Act 1999, s84).
# Keep the immigration copy to what the firms do and how the introduction works. No eligibility rules, routes or requirements.
# Debt recovery is for business-to-business debts only. Consumer debt collection is FCA regulated and out of scope.
# No em dashes in any copy (owner's preference).

AREAS = [
    {
        'slug': 'conveyancing', 'name': 'Conveyancing', 'icon': 'property', 'form': 'Buying or selling a home',
        'short': 'Buying, selling or remortgaging a property in England and Wales.',
        'title': 'Conveyancing Solicitors | Get Matched With a Conveyancer | Leaflegal',
        'desc': 'Buying, selling or remortgaging? Answer a few quick questions and we will introduce you to a regulated conveyancing firm. Free to use, no obligation.',
        'h1': 'Find a conveyancing solicitor',
        'lead': 'Tell us about your purchase, sale or remortgage and we will introduce you to a regulated conveyancing firm that handles your kind of property.',
        'intro': [
            'Conveyancing is the legal work involved in transferring a property from one owner to another. A conveyancer checks the title, carries out searches, raises questions with the other side, handles the money and registers the change of ownership with HM Land Registry.',
            'Instead of ringing round for quotes, you answer a few questions once. We pass your enquiry to one firm regulated by the Solicitors Regulation Authority or the Council for Licensed Conveyancers, and they contact you with a quote and their timescales.',
        ],
        'matters': ['Buying a home', 'Selling a home', 'Buying and selling at the same time', 'Remortgaging', 'Transfer of equity', 'Buying a leasehold flat', 'Buy-to-let purchases'],
        'how': [
            ('Tell us about the property', 'Whether you are buying, selling or both, roughly what it is worth, and whether it is freehold or leasehold.'),
            ('We introduce one firm', 'We pass your enquiry to a regulated conveyancing firm that covers your area and your type of transaction.'),
            ('They send you a quote', 'The firm contacts you, explains their fees and disbursements and tells you what happens next. You decide whether to instruct them.'),
        ],
        'considerations': [
            ('Fixed fees and disbursements', 'Most firms quote a fixed legal fee plus disbursements such as searches, Land Registry fees and Stamp Duty Land Tax. Ask for a full breakdown so you can compare like for like.'),
            ('Leasehold properties', 'Buying or selling a leasehold flat usually takes longer and costs more, because the firm also deals with the lease, the freeholder and the managing agent.'),
            ('Your lender’s panel', 'If you are buying with a mortgage, the conveyancer usually needs to be on your lender’s panel. The firm can confirm this when they quote.'),
        ],
        'faqs': [
            ('Does Leaflegal do the conveyancing?', 'No. Leaflegal is a free introduction service. The firm we introduce you to does the legal work and is responsible for it.'),
            ('Which areas do you cover?', 'Conveyancing enquiries for properties in England and Wales. Scotland and Northern Ireland have separate systems and are not covered at the moment.'),
            ('How much does conveyancing cost?', 'It depends on the property, its value, whether it is leasehold and the firm. The firm will give you a written quote before you instruct them.'),
            ('Do I have to use the firm you introduce?', 'No. There is no obligation. You can compare their quote with others and choose whoever suits you.'),
        ],
    },
    {
        'slug': 'immigration', 'name': 'Immigration', 'icon': 'globe', 'form': 'Immigration', 'referral_only': True,
        'short': 'Introductions to regulated immigration lawyers and advisers.',
        'title': 'Immigration Lawyers | Get Introduced to a Regulated Adviser | Leaflegal',
        'desc': 'Looking for an immigration lawyer? We introduce you to a firm regulated to give immigration advice. We do not give immigration advice ourselves.',
        'h1': 'Find a regulated immigration adviser',
        'lead': 'Tell us a little about what you need and we will pass your enquiry to one firm that is regulated to give immigration advice. They will talk you through it.',
        'intro': [
            'In the UK, only people who are regulated can give immigration advice or provide immigration services. That includes solicitors regulated by the Solicitors Regulation Authority and advisers registered with the Immigration Advice Authority (formerly the OISC).',
            'Leaflegal is not regulated to give immigration advice and does not do so. We ask a few simple questions so the right firm can get in touch, then pass your enquiry to one regulated firm. Everything about your options, your application and the rules comes from them.',
        ],
        'matters': ['Family and partner visas', 'Settlement and indefinite leave to remain', 'British citizenship', 'Work and business visas', 'Visa refusals and appeals', 'Help for employers sponsoring staff'],
        'how': [
            ('Tell us what it is about', 'Pick the type of matter and tell us how soon you need help. We don’t ask about your immigration history.'),
            ('We introduce one regulated firm', 'We pass your enquiry to a firm regulated to give immigration advice, and only to that firm.'),
            ('They contact you', 'The firm talks to you about your situation, explains their fees and tells you what they can do. Any advice comes from them.'),
        ],
        'considerations': [
            ('Check who is advising you', 'Anyone giving you immigration advice must be regulated. You can check a solicitor on the SRA register or an adviser on the Immigration Advice Authority register.'),
            ('Fees', 'Immigration firms charge their own fees, and Home Office application fees are separate. The firm should explain both before you go ahead.'),
            ('Free help', 'If you can’t afford to pay, GOV.UK lists organisations that may be able to help for free, including for asylum.'),
        ],
        'faqs': [
            ('Can Leaflegal tell me if I qualify for a visa?', 'No. We are not allowed to give immigration advice and we don’t. Only a regulated adviser can tell you about your options. We introduce you to one.'),
            ('Who will contact me?', 'One firm regulated to give immigration advice, such as a firm of solicitors regulated by the SRA or an adviser registered with the Immigration Advice Authority.'),
            ('Does it cost anything?', 'Our introduction is free. The firm will explain its own fees before you agree to anything.'),
            ('Can you help with asylum?', 'We don’t introduce asylum enquiries at the moment. GOV.UK can point you to free, specialist help.'),
        ],
    },
    {
        'slug': 'family-law', 'name': 'Family law', 'icon': 'heart', 'form': 'Family law',
        'short': 'Divorce, separation, finances and arrangements for children.',
        'title': 'Family Law Solicitors | Divorce and Separation | Leaflegal',
        'desc': 'Going through a divorce or separation? Answer a few quick questions and we will introduce you to a family law solicitor. Free to use, no obligation.',
        'h1': 'Find a family law solicitor',
        'lead': 'Whether you are separating, sorting out finances or arranging time with your children, we will introduce you to a family law firm that can help.',
        'intro': [
            'Family law covers the legal side of relationships, separation and children. A family solicitor can explain the process, help you reach an agreement, draft the paperwork and represent you if a matter goes to court.',
            'You answer a few questions about what is happening and how urgent it is. We pass your enquiry to one family law firm, and they contact you to talk it through and explain their fees.',
        ],
        'matters': ['Divorce and dissolution', 'Financial settlements and consent orders', 'Child arrangements', 'Separation from a cohabiting partner', 'Prenuptial and postnuptial agreements'],
        'how': [
            ('Tell us what is happening', 'The type of matter, whether there are any court dates or deadlines and where you live.'),
            ('We introduce one firm', 'We pass your enquiry to a family law firm that covers your area.'),
            ('They contact you', 'The solicitor talks through your situation, explains your options and their fees. You decide whether to go ahead.'),
        ],
        'considerations': [
            ('Costs', 'Many family firms offer a fixed fee for straightforward divorces and quote hourly or staged fees for finances and children matters. Ask for an estimate in writing.'),
            ('Legal aid', 'Legal aid is only available for some family matters, such as where there is evidence of domestic abuse. GOV.UK has a tool to check. We only introduce people looking for paid help.'),
            ('Mediation', 'Before applying to court about children or finances, you usually need to attend a mediation information meeting (MIAM). Your solicitor can explain this.'),
        ],
        'faqs': [
            ('Which areas do you cover?', 'Family law enquiries in England and Wales.'),
            ('I’m worried about my safety. Can you help?', 'If you are in danger, call 999. For confidential support, the National Domestic Abuse Helpline is free on 0808 2000 247, 24 hours a day.'),
            ('Will my partner find out I made an enquiry?', 'No. We only share your details with the firm we introduce you to, and they contact you, not anyone else.'),
            ('Does it cost anything?', 'Our introduction is free. The firm will explain its own fees before you agree to anything.'),
        ],
    },
    {
        'slug': 'debt-recovery', 'name': 'Debt recovery', 'icon': 'cash', 'form': 'Recovering a business debt', 'business_only': True,
        'short': 'Recovering unpaid invoices and debts owed to your business.',
        'title': 'Commercial Debt Recovery Solicitors | Unpaid Invoices | Leaflegal',
        'desc': 'Customer not paying? We introduce businesses to debt recovery solicitors for unpaid invoices and commercial debts. Free to use, no obligation.',
        'h1': 'Recover what your business is owed',
        'lead': 'Unpaid invoices hurt cash flow. Tell us about the debt and we will introduce your business to a law firm that recovers commercial debts.',
        'intro': [
            'Commercial debt recovery is the process of getting paid when another business owes you money. A solicitor can send a formal letter before action, add statutory interest and compensation where it applies, issue a claim and enforce a judgment.',
            'This service is for businesses recovering money owed by other businesses. We don’t introduce enquiries about debts owed by individuals or consumers.',
        ],
        'matters': ['Unpaid invoices', 'Letters before action', 'County Court and High Court claims', 'Statutory demands and winding up petitions', 'Enforcing a judgment'],
        'how': [
            ('Tell us about the debt', 'Roughly how much is owed, how long it has been outstanding and whether it is disputed.'),
            ('We introduce one firm', 'We pass your enquiry to a law firm that handles commercial debt recovery.'),
            ('They contact you', 'The firm explains the options, the likely costs and what they need from you to get started.'),
        ],
        'considerations': [
            ('Act early', 'The older a debt gets, the harder it can be to recover. Most claims must be brought within six years.'),
            ('Disputed debts', 'If your customer says they don’t owe the money, recovery becomes a dispute and usually costs more. Tell the firm if it is disputed.'),
            ('Late payment interest', 'Under the Late Payment of Commercial Debts (Interest) Act 1998, businesses can often claim interest and a fixed sum on late invoices. The firm can tell you if it applies.'),
        ],
        'faqs': [
            ('Can you help with personal debts?', 'No. We only introduce businesses recovering debts owed by other businesses.'),
            ('How much does debt recovery cost?', 'Many firms charge a fixed fee for a letter before action and agreed fees for court stages. They will explain their charges before you instruct them.'),
            ('Do I need to be a limited company?', 'No. Sole traders, partnerships and companies can all recover business debts.'),
            ('Does it cost anything to use Leaflegal?', 'No. Our introduction is free for your business.'),
        ],
    },
    {
        'slug': 'motoring-offences', 'name': 'Motoring offences', 'icon': 'car', 'form': 'A motoring offence',
        'short': 'Speeding, drink driving, totting up and driving bans.',
        'title': 'Motoring Offence Solicitors | Driving Ban, Speeding, Drink Driving | Leaflegal',
        'desc': 'Facing a driving ban or a motoring charge? We introduce you to a motoring offence solicitor. Free to use, no obligation.',
        'h1': 'Find a motoring offence solicitor',
        'lead': 'Facing points, a ban or a court date? Tell us what has happened and we will introduce you to a firm that specialises in motoring law.',
        'intro': [
            'Motoring offences range from speeding and using a phone at the wheel to drink driving and dangerous driving. The outcome can affect your licence, your job and your insurance, so many people want specialist advice before a court date.',
            'You answer a few questions about the offence and any dates you know. We pass your enquiry to one motoring law firm, and they contact you to talk it through and explain their fees.',
        ],
        'matters': ['Speeding', 'Drink and drug driving', 'Totting up and exceptional hardship', 'Using a mobile phone while driving', 'Careless and dangerous driving', 'Failing to identify the driver'],
        'how': [
            ('Tell us what has happened', 'The type of offence, whether you have a court date and how many points you already have.'),
            ('We introduce one firm', 'We pass your enquiry to a firm that specialises in motoring offences.'),
            ('They contact you', 'The solicitor explains your options and their fees, so you can decide what to do before your deadline.'),
        ],
        'considerations': [
            ('Deadlines matter', 'Notices and court dates have strict deadlines. Contact a solicitor as soon as you can, and tell them any dates on your paperwork.'),
            ('Exceptional hardship', 'If a ban would cause exceptional hardship to you or others, a court may decide not to ban you under the totting up rules. A solicitor can tell you whether that argument could apply.'),
            ('Fees', 'Many motoring firms offer fixed fees for each stage. Ask what is included, such as attending court.'),
        ],
        'faqs': [
            ('Which areas do you cover?', 'Motoring offences dealt with in the courts of England and Wales.'),
            ('Is there legal aid for motoring offences?', 'Usually not, unless you are at risk of prison. We only introduce people looking for paid legal help.'),
            ('How quickly will someone contact me?', 'The firm aims to contact you quickly, especially if you have a court date coming up. Please give a mobile number you can answer.'),
            ('Does it cost anything?', 'Our introduction is free. The firm will explain its own fees before you agree to anything.'),
        ],
    },
    {
        'slug': 'licensing', 'name': 'Licensing', 'icon': 'key', 'form': 'Licensing',
        'short': 'Premises, personal, taxi and other licences.',
        'title': 'Licensing Solicitors | Premises Licences and Reviews | Leaflegal',
        'desc': 'Need help with a premises licence, a licence review or a taxi licence? We introduce you to a licensing solicitor. Free to use, no obligation.',
        'h1': 'Find a licensing solicitor',
        'lead': 'New premises, a variation, a review or a licence under threat? Tell us what you need and we will introduce you to a licensing law firm.',
        'intro': [
            'Licensing law covers the permissions businesses and individuals need to sell alcohol, provide late night refreshment, run gambling premises or drive a taxi. Applications, variations and reviews all have their own procedures and deadlines.',
            'You answer a few questions about the licence and any hearing dates. We pass your enquiry to one licensing firm, and they contact you to explain the process and their fees.',
        ],
        'matters': ['New premises licences', 'Variations and transfers', 'Licence reviews and hearings', 'Personal licences', 'Taxi and private hire licences', 'Gambling premises'],
        'how': [
            ('Tell us about the licence', 'What kind of licence it is, what you need to do and whether there is a hearing date.'),
            ('We introduce one firm', 'We pass your enquiry to a firm that handles licensing work.'),
            ('They contact you', 'The firm explains the process, the likely timescale and their fees.'),
        ],
        'considerations': [
            ('Reviews and hearings', 'If your licence is being reviewed, the hearing date is fixed and the outcome can affect your business. Get help as early as you can.'),
            ('Conditions', 'Licence conditions can be hard to change once granted. A solicitor can help you agree conditions that work for your business.'),
            ('Fees', 'Licensing firms often quote fixed fees for applications and agreed fees for hearings.'),
        ],
        'faqs': [
            ('Which areas do you cover?', 'Licensing matters in England and Wales.'),
            ('Do you help individuals as well as businesses?', 'Yes, for example personal licence holders and taxi or private hire drivers.'),
            ('Does it cost anything?', 'Our introduction is free. The firm will explain its own fees before you agree to anything.'),
        ],
    },
    {
        'slug': 'lease-extensions', 'name': 'Lease extensions', 'icon': 'doc', 'form': 'Extending a lease',
        'short': 'Extending the lease on a flat or buying the freehold.',
        'title': 'Lease Extension Solicitors | Extend Your Lease | Leaflegal',
        'desc': 'Lease getting short? We introduce flat owners to lease extension solicitors. Free to use, no obligation.',
        'h1': 'Find a lease extension solicitor',
        'lead': 'A short lease can make a flat harder to sell or remortgage. Tell us about your lease and we will introduce you to a firm that handles lease extensions.',
        'intro': [
            'If you own a leasehold flat, the number of years left on the lease affects its value. Once a lease drops towards 80 years, extending it usually becomes more expensive, and lenders may be reluctant to lend on a short lease.',
            'You answer a few questions about your flat and your lease. We pass your enquiry to one firm that handles lease extensions and enfranchisement, and they contact you to explain the process and their fees.',
        ],
        'matters': ['Statutory lease extensions', 'Informal lease extensions', 'Buying the freehold with your neighbours', 'Lease variations', 'Disputes with the freeholder'],
        'how': [
            ('Tell us about the lease', 'Roughly how many years are left, where the flat is and whether you have spoken to the freeholder.'),
            ('We introduce one firm', 'We pass your enquiry to a firm that handles lease extensions.'),
            ('They contact you', 'The firm explains the process, the costs involved and whether you might need a valuation.'),
        ],
        'considerations': [
            ('Timing', 'The fewer years left, the more an extension usually costs. Many owners start the process well before the lease falls to 80 years.'),
            ('Costs', 'As well as legal fees, there is usually a premium to pay the freeholder and a surveyor’s valuation. The law in this area is changing, so ask the firm how recent reforms affect you.'),
            ('Statutory or informal', 'A statutory extension follows a set legal process. An informal deal with the freeholder can be quicker but may come with less favourable terms.'),
        ],
        'faqs': [
            ('Which areas do you cover?', 'Leasehold flats in England and Wales.'),
            ('Can I extend my lease myself?', 'You can, but the process has strict notices and deadlines. Most owners use a solicitor and a valuer.'),
            ('Does it cost anything to use Leaflegal?', 'No. Our introduction is free. The firm will explain its own fees before you agree to anything.'),
        ],
    },
]

BY_SLUG = {a['slug']: a for a in AREAS}
