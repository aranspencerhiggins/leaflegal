# Keyword targeting for client pages, from Ahrefs UK data (Keywords Explorer, country GB, pulled 22 Nov 2026).
# Each entry sets the title, meta description, short hero h1, the main keyword and an anchor used when other pages link here,
# plus a short keyword-focused section (paragraphs and questions) and a few cross-area related links.
# Rules: no colons, semicolons or em dashes in copy. Immigration is referral only, never eligibility or advice.
# Volumes (UK monthly) are noted beside each main keyword so later changes keep the reasoning.

def E(title, desc, kw, anchor, paras, faqs=(), h1=None, cross=(), also=()):
    return {'title': title, 'desc': desc, 'kw': kw, 'anchor': anchor, 'paras': list(paras), 'faqs': list(faqs),
            'h1': h1, 'cross': list(cross), 'also': list(also)}


B = 'Leaflegal'
SEO = {
    # ------------------------------------------------------------ practice areas
    '/conveyancing': E(  # conveyancing solicitors 9.6k, conveyancing 18k, conveyancer 5.6k, conveyancing fees 1.8k, conveyancing quotes 1.1k
        f'Conveyancing Solicitors | Free Conveyancing Quotes | {B}',
        'Find a conveyancing solicitor for buying, selling or remortgaging in England and Wales. Free introductions and clear conveyancing quotes. No obligation.',
        'conveyancing solicitors', 'Conveyancing solicitors', [
            'Looking for conveyancing solicitors you can trust? Leaflegal introduces you to one regulated conveyancer or conveyancing solicitor who handles your kind of property matter, whether you are buying a house, selling, remortgaging or transferring equity. You answer a few questions once and the firm contacts you with a clear conveyancing quote.',
            'Conveyancing fees vary with the price of the property, whether it is freehold or leasehold and whether there is a mortgage. A good conveyancer sets out their legal fee, VAT and disbursements such as searches and Land Registry fees in writing before any work starts. Many firms now offer online conveyancing with case tracking, so you can follow progress without chasing.',
        ], [
            ('How much do conveyancing solicitors charge?', 'Conveyancing fees depend on the price, the type of property and the work involved. Most firms quote a fixed legal fee plus VAT and disbursements such as searches and Land Registry fees. The firm we introduce you to gives you a written conveyancing quote before you agree to anything.'),
            ('What is the difference between a conveyancer and a conveyancing solicitor?', 'Both can handle your property transaction. A conveyancing solicitor is regulated by the Solicitors Regulation Authority, and a licensed conveyancer is regulated by the Council for Licensed Conveyancers. Either can act for you when you buy, sell or remortgage.'),
            ('Can I get an online conveyancing quote?', 'Yes. Answer a few quick questions and the firm we introduce you to will send you a conveyancing quote, usually the same working day. Most firms can run the whole matter by phone, email and an online portal.'),
        ], cross=['/lease-extensions', '/guides/how-conveyancing-works', '/conveyancing/transfer-of-equity']),
    '/immigration': E(  # immigration lawyer 8.7k, immigration solicitors 1.8k, immigration solicitor 1.2k, immigration adviser 700
        f'Immigration Lawyers and Solicitors UK | {B}',
        'Looking for an immigration lawyer or immigration solicitor? We introduce you to a firm regulated to give immigration advice. Free to use, no obligation.',
        'immigration lawyer', 'Immigration lawyers', [
            'If you are searching for an immigration lawyer, immigration solicitor or regulated immigration adviser, Leaflegal can introduce you to one firm that is regulated to advise on your kind of matter. That might be a spouse visa, indefinite leave to remain, British citizenship, a work visa, a sponsor licence or a refusal.',
            'Leaflegal does not give immigration advice and is not regulated to do so. We only introduce people and employers to firms regulated by the Solicitors Regulation Authority, CILEx Regulation or the Immigration Advice Authority. Any advice about your situation, your options and the forms to use comes from the regulated firm, never from us.',
        ], [
            ('How do I find a regulated immigration lawyer?', 'Answer a few quick questions about what you need help with and we introduce you to one regulated immigration firm. You can also check any adviser on the Solicitors Regulation Authority register or the Immigration Advice Authority register.'),
            ('Is an immigration solicitor the same as an immigration adviser?', 'Not always. Immigration solicitors are regulated by the Solicitors Regulation Authority. Other immigration advisers are regulated by the Immigration Advice Authority at a set level. The firm we introduce you to will be regulated to advise on your type of matter.'),
        ], cross=['/guides/choosing-an-immigration-adviser', '/family-law', '/conveyancing']),
    '/family-law': E(  # family lawyer 8.9k, family law solicitors 4.9k, family solicitors 2.9k, family solicitor 1.4k
        f'Family Solicitors and Divorce Lawyers | {B}',
        'Find a family solicitor for divorce, financial settlements, child arrangements, prenups and separation in England and Wales. Free introductions, no obligation.',
        'family solicitors', 'Family solicitors', [
            'Whether you need a family solicitor for a divorce, a financial settlement, child arrangements or a prenuptial agreement, Leaflegal introduces you to one regulated family law firm that handles your kind of matter. Family lawyers deal with some of the most personal decisions people make, so it matters that you speak to someone experienced and approachable.',
            'Family law solicitors can help you reach agreement, draft a consent order or a separation agreement, and represent you if court is needed. Many offer a fixed fee first meeting and fixed fees for set stages, such as a divorce application or a consent order. The firm explains its fees in writing before you agree to anything.',
        ], [
            ('What does a family law solicitor do?', 'A family law solicitor advises on divorce, dissolving a civil partnership, money and property after a separation, arrangements for children, cohabitation disputes and prenuptial agreements. They can negotiate for you, draft agreements and represent you at court.'),
            ('How do I choose a family solicitor?', 'Look for a firm that handles your kind of matter, explains fees clearly and makes you feel heard. Every family solicitor we introduce you to is regulated, and you are free to decide whether to instruct them.'),
        ], cross=['/conveyancing/transfer-of-equity', '/guides/how-divorce-works', '/conveyancing/selling-a-home']),
    '/debt-recovery': E(  # debt recovery 4.6k, business debt recovery 800, debt recovery solicitors 800, commercial debt recovery 400
        f'Debt Recovery Solicitors for Business | {B}',
        'Business debt recovery from regulated solicitors. Unpaid invoices, letters before action, court claims and enforcement in England and Wales. Free introductions.',
        'debt recovery solicitors', 'Debt recovery solicitors', [
            'When a customer will not pay, debt recovery solicitors can often get the money in faster than chasing on your own. Leaflegal introduces businesses to one regulated firm that handles commercial debt recovery, from a firm letter before action to a court claim, a statutory demand or enforcing a judgment.',
            'Business debt recovery is usually staged, and many firms offer a fixed fee for each step. You can also add statutory interest and fixed compensation to most overdue business invoices under the late payment rules. We only help with debts owed to businesses by other businesses, not consumer debts.',
        ], [
            ('Is a debt recovery solicitor better than a debt collection agency?', 'A debt collection agency can chase payment, but only a solicitor can issue court proceedings for you, advise on the strength of your claim and take steps such as a statutory demand or a winding up petition. Many businesses go straight to a debt recovery solicitor for larger or disputed debts.'),
            ('How much does commercial debt recovery cost?', 'Many firms charge a fixed fee for a letter before action and fixed or capped fees for later stages. Some of the cost can often be recovered from the debtor. The firm explains its fees before any work starts.'),
        ], cross=['/licensing', '/solicitors', '/guides']),
    '/motoring-offences': E(  # motoring offence solicitors 600, driving offence solicitors 600, motoring solicitors 500
        f'Motoring Offence Solicitors | Driving Offence Help | {B}',
        'Facing a driving ban, speeding, drink driving or totting up charge? We introduce you to a motoring offence solicitor in England and Wales. Free, no obligation.',
        'motoring offence solicitors', 'Motoring offence solicitors', [
            'Motoring offence solicitors help drivers facing a ban, penalty points or a court date. Leaflegal introduces you to one regulated firm that handles your kind of driving offence, whether it is drink driving, drug driving, speeding, a totting up ban, careless driving or driving without insurance.',
            'Driving offence solicitors can check the evidence and procedure, advise on your plea, argue exceptional hardship or special reasons where they apply and represent you in the magistrates’ court. Many offer fixed fees for a guilty plea hearing. Speaking to a motoring solicitor early gives the most options.',
        ], [
            ('Do I need a motoring offence solicitor?', 'Not always, but it is worth taking advice if you could be banned, you face a totting up ban, the charge is serious or you think the evidence is wrong. A motoring solicitor can tell you your options and likely outcome.'),
            ('How much does a driving offence solicitor cost?', 'Many firms offer fixed fees for a guilty plea, an exceptional hardship argument or a trial. The firm we introduce you to explains its fees before you agree to anything.'),
        ], cross=['/licensing/taxi-and-private-hire-licences', '/guides/what-happens-at-a-motoring-hearing', '/licensing/personal-licences']),
    '/licensing': E(  # licensing solicitors 600, premises licence 800, personal licence 1.6k, private hire licence 1.5k
        f'Licensing Solicitors | Premises and Personal Licences | {B}',
        'Licensing solicitors for premises licence applications, variations, DPS changes, licence reviews, personal licences and taxi licences. Free introductions.',
        'licensing solicitors', 'Licensing solicitors', [
            'Licensing solicitors help pubs, bars, restaurants, shops, venues and drivers get, keep and change the licences they rely on. Leaflegal introduces you to one regulated firm that handles your kind of licensing matter, from a new premises licence application to a variation, a designated premises supervisor change or a licence review hearing.',
            'Licensing law is local as well as national, and the council’s policy can make a real difference to an application. A licensing solicitor can prepare your operating schedule, deal with objections from responsible authorities and represent you at a hearing. They also help with personal licence reviews and taxi and private hire licence appeals.',
        ], [
            ('When should I use a licensing solicitor?', 'For a new premises licence, a major variation, a licence review or any hearing, and whenever the police or council have raised concerns. Simple changes can sometimes be done yourself, but advice helps avoid delays and objections.'),
            ('Do licensing solicitors help with taxi licences?', 'Yes. Many licensing firms help drivers and operators with taxi and private hire licence applications, suspensions, revocations and appeals.'),
        ], cross=['/motoring-offences', '/debt-recovery', '/solicitors']),
    '/lease-extensions': E(  # lease extension 1.2k, lease extension solicitors 800, lease extension cost 350
        f'Lease Extension Solicitors | Extend Your Lease | {B}',
        'Lease getting short? Find a lease extension solicitor for statutory and informal lease extensions and buying the freehold. Free introductions, no obligation.',
        'lease extension solicitors', 'Lease extension solicitors', [
            'Lease extension solicitors help flat owners add years to their lease, usually 90 years on top of the remaining term with ground rent reduced to zero under the statutory route. Leaflegal introduces you to one regulated firm that handles lease extensions and works alongside a specialist surveyor.',
            'The lease extension cost has two parts, the premium paid to the freeholder and the professional fees. Online lease extension calculators give a rough idea, but a surveyor’s valuation is what counts. Starting early matters, because a short lease can make a flat harder to sell or mortgage and the premium usually rises as the lease gets shorter.',
        ], [
            ('How much does a lease extension cost?', 'The cost is the premium payable to the freeholder plus legal and valuation fees. The premium depends on the lease length, the value of the flat and the ground rent. A surveyor values the premium, and the solicitor explains their own fees in writing before starting.'),
            ('Do I need a lease extension solicitor?', 'Yes, in practice. The statutory route has strict notices and deadlines, and an informal deal needs careful drafting. A lease extension solicitor protects your position and registers the new lease.'),
        ], cross=['/conveyancing/buying-a-leasehold-flat', '/guides/leasehold-vs-freehold', '/conveyancing/selling-a-home']),

    # ------------------------------------------------------------ conveyancing
    '/conveyancing/buying-a-home': E(  # solicitors for buying a house 700, buying a house solicitor 350, conveyancing fees for buying a house 150
        f'Solicitors for Buying a House | Purchase Conveyancing | {B}',
        'Find a solicitor for buying a house in England and Wales. Clear purchase conveyancing fees, searches and title checks. Free introductions, no obligation.',
        'solicitors for buying a house', 'Solicitors for buying a house', [
            'Choosing the right solicitor for buying a house can make your purchase quicker and less stressful. Leaflegal introduces you to one regulated conveyancing firm that handles purchases like yours, freehold or leasehold, with or without a mortgage.',
            'Conveyancing fees for buying a house usually include a legal fee, VAT, searches, Land Registry fees and any Stamp Duty Land Tax return. Ask for the full figure in writing, and check whether the firm charges extra for a leasehold, a new build or a Help to Buy or shared ownership element.',
        ], [
            ('When should I instruct a solicitor for buying a house?', 'As soon as your offer is accepted, and ideally before. Having a conveyancer lined up shows the seller you are ready and saves time at the start.'),
            ('What do conveyancing fees for buying a house include?', 'Usually the legal fee, VAT, searches, Land Registry fees, bank transfer fees and handling the Stamp Duty Land Tax return. The firm lists everything in its written quote.'),
        ], cross=['/conveyancing/first-time-buyers', '/guides/conveyancing-searches-explained', '/conveyancing/buying-and-selling'], h1='Solicitors for buying a house'),
    '/conveyancing/selling-a-home': E(  # solicitor for selling house 250, conveyancing fees for selling a house 200, conveyancing for selling a house 150
        f'Solicitor for Selling a House | Sale Conveyancing | {B}',
        'Find a solicitor for selling a house in England and Wales. Clear conveyancing fees for selling, a ready contract pack and redemption of your mortgage. Free.',
        'solicitor for selling a house', 'Solicitor for selling a house', [
            'A good solicitor for selling a house gets the contract pack out quickly and answers the buyer’s enquiries without delay. Leaflegal introduces you to one regulated conveyancing firm that handles sales like yours, including leasehold flats and properties with a mortgage to pay off.',
            'Conveyancing fees for selling a house are usually lower than for buying, because there are no searches to order. Expect a legal fee, VAT, office copy entries, a fee for redeeming your mortgage and, for a leasehold flat, the cost of the management pack.',
        ], [
            ('When should I instruct a solicitor for selling my house?', 'When you put the property on the market. Early instruction lets the firm prepare the contract pack and spot title problems before a buyer is found.'),
            ('What are typical conveyancing fees for selling a house?', 'Fees depend on the price and whether the property is leasehold. The firm we introduce you to gives you a written quote that lists the legal fee, VAT and disbursements.'),
        ], cross=['/conveyancing/buying-and-selling', '/lease-extensions/selling-a-leasehold-flat', '/family-law/financial-settlements'], h1='Solicitor for selling a house'),
    '/conveyancing/buying-and-selling': E(  # buying and selling conveyancing fees 200
        f'Buying and Selling Conveyancing | One Solicitor | {B}',
        'Selling and buying at the same time? Find one conveyancing solicitor to handle both sides of your move, with a combined buying and selling conveyancing quote.',
        'buying and selling conveyancing', 'Buying and selling conveyancing', [
            'If you are selling one home and buying another, using one firm for buying and selling conveyancing keeps everything in step. Leaflegal introduces you to one regulated firm that runs both sides of your move and lines up exchange and completion on the same day.',
            'Buying and selling conveyancing fees are often quoted as a package that is cheaper than two separate matters. Ask what is included for each side, and whether the firm charges extra for a chain, a leasehold or a bridging loan.',
        ], [
            ('Can one solicitor handle my sale and purchase?', 'Yes, and most people use the same firm for both. It makes it easier to link exchange and completion and to move money from the sale to the purchase.'),
            ('Are buying and selling conveyancing fees cheaper together?', 'Often. Many firms offer a combined quote that costs less than two separate matters. The firm explains exactly what is included.'),
        ], cross=['/conveyancing/remortgaging', '/conveyancing/new-build-purchases'], h1='Buying and selling conveyancing'),
    '/conveyancing/remortgaging': E(  # remortgage solicitor 450, remortgage conveyancing 400, remortgage legal fees 400
        f'Remortgage Solicitors | Remortgage Conveyancing | {B}',
        'Find a remortgage solicitor for switching lender, borrowing more or adding a name. Clear remortgage legal fees. Free introductions, no obligation.',
        'remortgage solicitor', 'Remortgage solicitors', [
            'A remortgage solicitor handles the legal side when you move your mortgage to a new lender, raise extra money or change whose name is on the title. Leaflegal introduces you to one regulated firm that handles remortgage conveyancing quickly and to your lender’s requirements.',
            'Some lenders offer a free legal package, but you can choose your own remortgage solicitor, especially if there is a transfer of equity, a lease issue or a second charge to deal with. Remortgage legal fees are usually a fixed fee plus a few small disbursements.',
        ], [
            ('Do I need a solicitor to remortgage?', 'Yes, your new lender needs a conveyancer to check the title, pay off the old mortgage and register the new one. Some lenders arrange this for free, but you can choose your own.'),
            ('What are typical remortgage legal fees?', 'Usually a modest fixed fee plus VAT and small disbursements such as Land Registry fees and searches or search insurance. The firm confirms the figure in writing.'),
        ], cross=['/conveyancing/transfer-of-equity', '/lease-extensions/statutory-lease-extension'], h1='Remortgage solicitors'),
    '/conveyancing/transfer-of-equity': E(  # transfer of equity 2.4k, transfer of equity solicitor 700, transfer of equity cost 150
        f'Transfer of Equity Solicitors | Add or Remove a Name | {B}',
        'Find a transfer of equity solicitor to add or remove someone from the title to your home after marriage, separation or divorce. Clear costs, no obligation.',
        'transfer of equity', 'Transfer of equity solicitors', [
            'A transfer of equity adds or removes someone from the legal title to a property, for example after a marriage, a separation or a divorce. Leaflegal introduces you to one regulated transfer of equity solicitor who handles the deed, deals with your lender and registers the change.',
            'The transfer of equity cost depends on whether there is a mortgage and whether money is changing hands. Stamp Duty Land Tax can apply where someone takes on a share of the mortgage, so ask the firm to check this. If the transfer is part of a financial settlement, your family solicitor and conveyancer will work together.',
        ], [
            ('How much does a transfer of equity cost?', 'Usually a fixed legal fee plus Land Registry fees, and sometimes Stamp Duty Land Tax. A mortgage lender’s consent can add a little more work. The firm gives you a written quote first.'),
            ('Do I need a solicitor for a transfer of equity?', 'If there is a mortgage, the lender will require one. Even without a mortgage, a solicitor makes sure the deed is right and checks tax and trust issues.'),
        ], cross=['/family-law/financial-settlements', '/family-law/divorce', '/family-law/cohabitation-disputes'], h1='Transfer of equity solicitors'),
    '/conveyancing/first-time-buyers': E(  # first time buyer solicitor 250, first time buyer conveyancing 100
        f'First Time Buyer Solicitors | Conveyancing | {B}',
        'Find a first time buyer solicitor who explains every step. First time buyer conveyancing with clear fees, Lifetime ISA and shared ownership help. Free.',
        'first time buyer solicitor', 'First time buyer solicitors', [
            'A first time buyer solicitor explains each stage of buying your first home in plain English, from searches and enquiries to exchange and completion. Leaflegal introduces you to one regulated firm that is used to first time buyer conveyancing and is happy to answer questions.',
            'Ask about first time buyer relief on Stamp Duty Land Tax, and tell the firm early if you are using a Lifetime ISA, shared ownership or a family gift, because each needs extra paperwork. A clear quote up front helps you plan your moving costs.',
        ], [
            ('Do first time buyers pay less for conveyancing?', 'Not usually, but some firms offer packages for first time buyers. Extra work such as a Lifetime ISA, a gifted deposit or shared ownership can add to the fee, so ask for a full quote.'),
            ('What does a first time buyer solicitor need from me?', 'Your ID, the property details, your mortgage in principle or offer and details of any scheme or gift you are using.'),
        ], cross=['/conveyancing/new-build-purchases', '/guides/how-conveyancing-works', '/conveyancing/buying-a-leasehold-flat'], h1='First time buyer solicitors'),
    '/conveyancing/buy-to-let': E(  # buy to let solicitor 150, buy to let conveyancing 150
        f'Buy to Let Solicitors | Buy to Let Conveyancing | {B}',
        'Find a buy to let solicitor for buying an investment property, in your own name or a limited company. Clear buy to let conveyancing fees. Free introductions.',
        'buy to let solicitor', 'Buy to let solicitors', [
            'A buy to let solicitor handles the purchase of an investment property and the extra checks a buy to let lender asks for. Leaflegal introduces you to one regulated firm used to buy to let conveyancing, whether you buy in your own name or through a limited company.',
            'Buy to let conveyancing often involves higher rate Stamp Duty Land Tax, existing tenancies to check and company paperwork for limited company buyers. Ask for a fixed fee that covers these points.',
        ], [
            ('Is buy to let conveyancing different from a normal purchase?', 'The core work is the same, but there can be tenancies to review, lender conditions for letting and higher rate Stamp Duty Land Tax. Company purchases need extra documents.'),
        ], cross=['/conveyancing/remortgaging', '/debt-recovery'], h1='Buy to let solicitors'),
    '/conveyancing/new-build-purchases': E(  # new build conveyancing 300, new build solicitor 150, buying a new build 450
        f'New Build Conveyancing Solicitors | {B}',
        'Buying a new build home? Find a new build solicitor who knows developer contracts, deadlines and warranties. Clear new build conveyancing fees, no obligation.',
        'new build conveyancing', 'New build conveyancing', [
            'New build conveyancing has its own pressures, including tight developer deadlines, plans and estate charges to check and a build that may not be finished at exchange. Leaflegal introduces you to one regulated new build solicitor who handles purchases from housebuilders regularly.',
            'Before buying a new build, ask your conveyancer to check the warranty, the estate management arrangements and any leasehold terms, and plan your snagging. Make sure the firm can meet the developer’s exchange deadline.',
        ], [
            ('Why do I need a new build solicitor?', 'Developer contracts, deadlines and estate arrangements differ from a normal purchase. A new build solicitor is used to these and can move quickly.'),
        ], cross=['/conveyancing/first-time-buyers', '/conveyancing/buying-a-home'], h1='New build conveyancing'),
    '/conveyancing/buying-a-leasehold-flat': E(  # leasehold conveyancing 150, leasehold vs freehold 4k (guide)
        f'Leasehold Conveyancing | Buying a Leasehold Flat | {B}',
        'Buying a leasehold flat? Find a leasehold conveyancing solicitor to check the lease length, ground rent and service charges. Free introductions.',
        'leasehold conveyancing', 'Leasehold conveyancing', [
            'Leasehold conveyancing needs extra care, because the lease sets what you can do with the flat and what you will pay. Leaflegal introduces you to one regulated firm that checks the lease length, ground rent, service charges and management pack before you commit.',
            'If the lease is short, ask whether the seller will start a lease extension before completion. Your conveyancer can explain the difference between leasehold and freehold and how the lease affects value and mortgage options.',
        ], [
            ('What should I check when buying a leasehold flat?', 'The years left on the lease, the ground rent, the service charge and any major works, the rules in the lease and who manages the building. Your conveyancer reports on each.'),
        ], cross=['/lease-extensions/short-lease', '/guides/leasehold-vs-freehold', '/lease-extensions/statutory-lease-extension']),

    # ------------------------------------------------------------ lease extensions
    '/lease-extensions/statutory-lease-extension': E(  # statutory lease extension 350, section 42 notice 600
        f'Statutory Lease Extension | Section 42 Notice | {B}',
        'Extend your lease using the statutory route. A solicitor serves the section 42 notice and a surveyor values the premium. Free introductions, no obligation.',
        'statutory lease extension', 'Statutory lease extensions', [
            'A statutory lease extension uses your legal right as a qualifying leaseholder to add 90 years to the lease, usually with ground rent reduced to zero. The process starts when your solicitor serves a section 42 notice on the freeholder, which sets out your proposed premium.',
            'Strict deadlines follow the section 42 notice, so you need a lease extension solicitor and a surveyor working together. Leaflegal introduces you to one regulated firm that handles statutory lease extensions regularly.',
        ], [
            ('What is a section 42 notice?', 'It is the formal notice a leaseholder serves on the freeholder to claim a statutory lease extension. It proposes a premium and starts a timetable for the freeholder’s response.'),
        ], cross=['/lease-extensions/collective-enfranchisement', '/conveyancing/selling-a-home'], h1='Statutory lease extensions'),
    '/lease-extensions/informal-lease-extension': E(
        f'Informal Lease Extension Solicitors | {B}',
        'Agreeing a lease extension directly with your freeholder? Find a solicitor to check the terms of an informal lease extension before you sign.',
        'informal lease extension', 'Informal lease extensions', [
            'An informal lease extension is agreed directly with the freeholder instead of using the statutory route. It can be quicker, but the terms can include ground rent or other changes that affect the value of your flat.',
            'A lease extension solicitor checks the offer, compares it with the statutory lease extension and drafts the new lease so lenders and future buyers will accept it.',
        ], cross=['/lease-extensions/statutory-lease-extension', '/conveyancing/buying-a-leasehold-flat'], h1='Informal lease extensions'),
    '/lease-extensions/collective-enfranchisement': E(  # collective enfranchisement 400, buying the freehold 100
        f'Collective Enfranchisement | Buying the Freehold | {B}',
        'Want to buy the freehold of your building with your neighbours? Find a collective enfranchisement solicitor in England and Wales. Free introductions.',
        'collective enfranchisement', 'Collective enfranchisement', [
            'Collective enfranchisement lets qualifying leaseholders in a building join together to buy the freehold. Once you own the freehold, you can grant yourselves long leases and take control of how the building is managed.',
            'Buying the freehold needs enough leaseholders to take part, a company to hold the freehold and a surveyor’s valuation. Leaflegal introduces you to one regulated firm that handles collective enfranchisement claims.',
        ], cross=['/lease-extensions/statutory-lease-extension', '/guides/leasehold-vs-freehold'], h1='Collective enfranchisement'),
    '/lease-extensions/short-lease': E(  # short lease 100, selling a flat with a short lease 150
        f'Short Lease Flat Solicitors | Extend or Sell | {B}',
        'Own a flat with a short lease? Find a solicitor to extend the lease or sell the flat with a short lease. Free introductions, no obligation.',
        'short lease', 'Short lease flats', [
            'A short lease, often anything under about 80 to 90 years, can make a flat harder to mortgage and sell, and the cost of extending usually rises as the years run down. A lease extension solicitor can explain your options and start the process.',
            'If you are selling a flat with a short lease, you can often serve the section 42 notice and assign the benefit to your buyer, so the extension carries on after the sale.',
        ], cross=['/lease-extensions/selling-a-leasehold-flat', '/conveyancing/buying-a-leasehold-flat'], h1='Flats with a short lease'),
    '/lease-extensions/lease-variations': E(  # deed of variation lease 450
        f'Deed of Variation of Lease Solicitors | {B}',
        'Need to change the terms of a lease? Find a solicitor for a deed of variation to fix defects, change ground rent or update service charge terms.',
        'deed of variation', 'Lease variations', [
            'A deed of variation changes the terms of an existing lease, for example to fix a defect, update the service charge or insurance terms, or change ground rent. Lenders sometimes ask for a deed of variation before they will lend on a flat.',
            'A lease variation needs the freeholder’s agreement and often the lender’s consent. A solicitor drafts the deed and registers it at HM Land Registry.',
        ], cross=['/lease-extensions/informal-lease-extension', '/conveyancing/remortgaging']),
    '/lease-extensions/selling-a-leasehold-flat': E(
        f'Selling a Leasehold Flat | Conveyancing Solicitors | {B}',
        'Selling a leasehold flat? Find a solicitor to prepare the management pack, deal with a short lease and keep your sale on track. Free introductions.',
        'selling a leasehold flat', 'Selling a leasehold flat', [
            'Selling a leasehold flat involves more paperwork than selling a house, including the management pack from your managing agent and replies about service charges and ground rent. Ordering the pack early avoids delay.',
            'If the lease is getting short, a lease extension before or during the sale can protect the price. Leaflegal introduces you to one regulated firm that handles both.',
        ], cross=['/conveyancing/selling-a-home', '/lease-extensions/short-lease']),

    # ------------------------------------------------------------ family law
    '/family-law/divorce': E(  # divorce solicitors 7.2k, divorce lawyer 7k, divorce lawyers 5.6k, divorce solicitor 2.7k
        f'Divorce Solicitors | Find a Divorce Lawyer | {B}',
        'Find a divorce solicitor in England and Wales for no fault divorce, finances and children. Fixed fee options. Free introductions, no obligation.',
        'divorce solicitors', 'Divorce solicitors', [
            'Divorce solicitors guide you through the no fault divorce process and, just as importantly, help you sort out money, property and arrangements for children. Leaflegal introduces you to one regulated divorce lawyer who handles your kind of situation.',
            'The divorce itself is often straightforward and many firms offer it for a fixed fee. The financial side usually needs more care, and a financial order such as a consent order is the only way to make a settlement legally binding. A divorce solicitor can explain how much a divorce costs in your case before you start.',
        ], [
            ('How much does a divorce solicitor cost?', 'Many firms offer the divorce application for a fixed fee. Work on finances or children is often charged by the hour or in fixed stages. The firm explains its fees in writing before starting.'),
            ('Do I need a divorce lawyer for a no fault divorce?', 'You can apply yourself, but a divorce lawyer helps you avoid mistakes and, most importantly, makes sure your finances are dealt with properly before the final order.'),
        ], cross=['/conveyancing/transfer-of-equity', '/guides/how-divorce-works', '/conveyancing/selling-a-home'], h1='Divorce solicitors'),
    '/family-law/financial-settlements': E(  # divorce financial settlement 1.2k, financial order 1.4k, clean break order 2k
        f'Divorce Financial Settlement Solicitors | {B}',
        'Find a solicitor for your divorce financial settlement, financial order or clean break order in England and Wales. Free introductions, no obligation.',
        'divorce financial settlement', 'Divorce financial settlements', [
            'A divorce financial settlement deals with the house, savings, pensions, debts and maintenance. Leaflegal introduces you to one regulated family solicitor who can help you reach a fair agreement and turn it into a financial order the court approves.',
            'A clean break order ends financial ties between you, so neither of you can make claims in the future. Where you agree, the order is usually made as a consent order. Where you cannot agree, the court can decide through financial remedy proceedings.',
        ], [
            ('What is a clean break order?', 'It is a financial order that ends ongoing financial claims between former spouses or civil partners. It can be part of a consent order or made by the court after a hearing.'),
            ('Is a financial settlement legally binding without a court order?', 'No. An agreement only becomes binding once the court approves it as a financial order, such as a consent order.'),
        ], cross=['/conveyancing/transfer-of-equity', '/conveyancing/selling-a-home'], h1='Divorce financial settlements'),
    '/family-law/consent-orders': E(  # consent order 3.7k, consent order divorce 1.2k, financial consent order 1k
        f'Consent Order Solicitors | Financial Consent Orders | {B}',
        'Agreed your divorce finances? Find a solicitor to draft a financial consent order and get it approved by the court. Fixed fee options, no obligation.',
        'consent order', 'Consent order solicitors', [
            'A consent order makes the financial agreement you reach on divorce legally binding. A family solicitor drafts the consent order and the statement of information, and sends them to the court for a judge to approve.',
            'A well drafted financial consent order can include a clean break, a pension sharing order and arrangements for the family home, including a transfer of equity. Many firms offer consent orders for a fixed fee.',
        ], [
            ('Do I need a solicitor for a consent order?', 'A judge must be satisfied the order is fair and properly drafted. A solicitor makes rejection less likely and makes sure it does what you both intend.'),
        ], cross=['/conveyancing/transfer-of-equity', '/family-law/financial-settlements'], h1='Consent order solicitors'),
    '/family-law/child-arrangements': E(  # child arrangements order 2.1k, child custody 1.2k, child custody lawyer 1k
        f'Child Arrangements Order Solicitors | {B}',
        'Need help with child arrangements after a separation? Find a family solicitor for agreements and child arrangements orders. Free introductions.',
        'child arrangements order', 'Child arrangements solicitors', [
            'A child arrangements order sets out who a child lives with and spends time with. What people often call child custody is now dealt with this way in England and Wales. Most families agree arrangements without court, and a family solicitor can help.',
            'If you cannot agree, you usually need to consider mediation before applying to court. Leaflegal introduces you to one regulated family solicitor who handles child arrangements.',
        ], cross=['/family-law/separation-agreements', '/family-law/divorce'], h1='Child arrangements solicitors'),
    '/family-law/separation-agreements': E(  # separation agreement 1.1k, legal separation uk 500
        f'Separation Agreement Solicitors | {B}',
        'Find a solicitor to draft a separation agreement covering money, property and children if you are separating but not divorcing yet. Free introductions.',
        'separation agreement', 'Separation agreement solicitors', [
            'A separation agreement records what you have agreed about money, property and children when you separate but are not ready to divorce. It is not the same as a legal separation order, but courts often give weight to a fair agreement made with advice.',
            'A family solicitor can draft the separation agreement so it can later form the basis of a consent order.',
        ], cross=['/family-law/consent-orders', '/conveyancing/transfer-of-equity'], h1='Separation agreement solicitors'),
    '/family-law/cohabitation-disputes': E(  # cohabitation agreement 3.6k, unmarried couples rights 200
        f'Cohabitation Agreement and Dispute Solicitors | {B}',
        'Living together or separating without being married? Find a solicitor for a cohabitation agreement or a property dispute between unmarried couples.',
        'cohabitation agreement', 'Cohabitation solicitors', [
            'Unmarried couples do not have the same rights as married couples when they separate. A cohabitation agreement sets out who owns what and what happens if you split up, and can save a costly dispute later.',
            'If you have already separated, a family solicitor can advise on shares in the home and claims for children. Leaflegal introduces you to one regulated firm that handles cohabitation disputes.',
        ], cross=['/conveyancing/transfer-of-equity', '/family-law/prenuptial-agreements'], h1='Cohabitation solicitors'),
    '/family-law/prenuptial-agreements': E(  # prenup 11k, prenuptial agreement 2.7k, prenuptial agreement uk 1k, prenup uk 600
        f'Prenup Solicitors | Prenuptial Agreements UK | {B}',
        'Find a solicitor to draft a prenup before you marry or form a civil partnership in England and Wales. Free introductions, no obligation.',
        'prenup', 'Prenup solicitors', [
            'A prenup, or prenuptial agreement, sets out how money and property will be divided if a marriage or civil partnership ends. In the UK, courts will usually uphold a fair prenup that both people entered freely with full disclosure and proper advice.',
            'Allow plenty of time before the wedding. Each person should have their own solicitor, and the prenuptial agreement should be signed well in advance.',
        ], [
            ('Are prenups legally binding in the UK?', 'Not automatically, but courts in England and Wales usually give them decisive weight when they are fair, entered freely, with full disclosure and independent advice.'),
        ], cross=['/family-law/cohabitation-disputes', '/family-law/divorce'], h1='Prenup solicitors'),
    '/family-law/civil-partnership-dissolution': E(  # civil partnership dissolution 900
        f'Civil Partnership Dissolution Solicitors | {B}',
        'Ending a civil partnership? Find a family solicitor for civil partnership dissolution, finances and children in England and Wales. Free introductions.',
        'civil partnership dissolution', 'Civil partnership dissolution', [
            'Civil partnership dissolution follows the same no fault process as divorce. A family solicitor can guide you through the application and help you agree finances and arrangements for children.',
            'As with divorce, a financial order such as a consent order is needed to make a financial settlement binding.',
        ], cross=['/family-law/consent-orders', '/conveyancing/transfer-of-equity'], h1='Ending a civil partnership'),

    # ------------------------------------------------------------ immigration (referral only)
    '/immigration/spouse-and-partner-visas': E(  # spouse visa uk 15k, spouse visa 5.6k, partner visa uk 2.6k, spouse visa solicitor 200
        f'Spouse Visa Lawyers UK | Partner Visa Help | {B}',
        'Applying for a UK spouse visa or partner visa? We introduce you to a regulated immigration lawyer. We do not give immigration advice ourselves.',
        'spouse visa', 'Spouse visa lawyers', [
            'Many people look for a spouse visa lawyer or partner visa solicitor because the application depends on detailed evidence. Leaflegal introduces you to one regulated immigration firm that handles UK spouse and partner visa matters.',
            'We do not give advice about spouse visa requirements or your eligibility. The regulated firm advises on your situation, the evidence needed and the application itself.',
        ], cross=['/immigration/settlement', '/family-law/prenuptial-agreements'], h1='Spouse visa lawyers'),
    '/immigration/settlement': E(  # indefinite leave to remain 29k, ilr 10k
        f'Indefinite Leave to Remain Lawyers | ILR | {B}',
        'Applying for indefinite leave to remain (ILR)? We introduce you to a regulated immigration lawyer. Leaflegal does not give immigration advice.',
        'indefinite leave to remain', 'Indefinite leave to remain lawyers', [
            'Indefinite leave to remain, often called ILR or settlement, is a significant application and mistakes can be costly. Leaflegal introduces you to one regulated immigration firm that handles ILR applications.',
            'We do not advise on whether you qualify for indefinite leave to remain. The regulated firm advises on your situation and the application.',
        ], cross=['/immigration/british-citizenship', '/immigration/eu-settlement-scheme'], h1='Indefinite leave to remain'),
    '/immigration/british-citizenship': E(  # british citizenship 15k, british citizenship application 4.9k, naturalisation 2.1k
        f'British Citizenship Lawyers | Naturalisation | {B}',
        'Making a British citizenship application or applying for naturalisation? We introduce you to a regulated immigration lawyer. We give no immigration advice.',
        'British citizenship', 'British citizenship lawyers', [
            'A British citizenship application, including naturalisation, is the last step for many people who have settled in the UK. Leaflegal introduces you to one regulated immigration firm that handles citizenship applications.',
            'We do not advise on eligibility for British citizenship. The regulated firm advises on your situation and the application.',
        ], cross=['/immigration/settlement'], h1='British citizenship lawyers'),
    '/immigration/work-visas': E(  # skilled worker visa 45k, work visa uk 7.4k
        f'Skilled Worker Visa Lawyers | UK Work Visas | {B}',
        'Need help with a skilled worker visa or another UK work visa? We introduce you to a regulated immigration lawyer. Leaflegal gives no immigration advice.',
        'skilled worker visa', 'Work visa lawyers', [
            'The skilled worker visa is the main UK work visa route, and applications depend on the sponsor, the job and supporting documents. Leaflegal introduces individuals and employers to one regulated immigration firm that handles work visa matters.',
            'We do not advise on work visa requirements or eligibility. The regulated firm advises on your situation and the application.',
        ], cross=['/immigration/sponsor-licences'], h1='Work visa lawyers'),
    '/immigration/sponsor-licences': E(  # sponsor licence 2.2k, sponsor licence application 1.1k
        f'Sponsor Licence Solicitors for Employers | {B}',
        'Applying for a sponsor licence or managing compliance? We introduce employers to a regulated immigration solicitor. Leaflegal gives no immigration advice.',
        'sponsor licence', 'Sponsor licence solicitors', [
            'Employers need a sponsor licence before they can sponsor skilled workers from overseas. A sponsor licence application and the duties that follow are detailed, and errors can lead to suspension. Leaflegal introduces employers to one regulated immigration firm that handles sponsor licences.',
            'We do not give immigration advice. The regulated firm advises on your application and compliance duties.',
        ], cross=['/immigration/work-visas', '/debt-recovery'], h1='Sponsor licence solicitors'),
    '/immigration/family-visas': E(  # family visa uk 5.1k, family visa 1.8k
        f'Family Visa UK Lawyers | {B}',
        'Applying for a UK family visa? We introduce you to a regulated immigration lawyer who handles family visa matters. Leaflegal gives no immigration advice.',
        'family visa', 'Family visa lawyers', [
            'A UK family visa application can involve detailed evidence about your relationship and circumstances. Leaflegal introduces you to one regulated immigration firm that handles family visa matters.',
            'We do not advise on family visa requirements or eligibility. The regulated firm advises on your situation.',
        ], cross=['/immigration/spouse-and-partner-visas'], h1='Family visa lawyers'),
    '/immigration/refusals-and-appeals': E(  # immigration appeal 90, visa refusal appeal 40
        f'Visa Refusal and Immigration Appeal Lawyers | {B}',
        'Had a visa refused? We introduce you to a regulated immigration lawyer for refusals, administrative reviews and immigration appeals. Act quickly.',
        'immigration appeal', 'Immigration appeal lawyers', [
            'A visa refusal often comes with a short deadline to challenge it, so it pays to act quickly. Leaflegal introduces you to one regulated immigration firm that handles refusals, administrative reviews and immigration appeals.',
            'We do not advise on whether to appeal. The regulated firm reviews the decision and advises on your options.',
        ], cross=['/immigration/settlement'], h1='Refusals and appeals'),
    '/immigration/eu-settlement-scheme': E(  # settled status 16k, pre settled status 6.4k, eu settlement scheme 5.7k
        f'EU Settlement Scheme Lawyers | Settled Status | {B}',
        'Need help with settled status or pre settled status under the EU Settlement Scheme? We introduce you to a regulated immigration lawyer.',
        'EU Settlement Scheme', 'EU Settlement Scheme lawyers', [
            'People with settled status or pre settled status under the EU Settlement Scheme sometimes need help with upgrades, late applications or refusals. Leaflegal introduces you to one regulated immigration firm that handles EU Settlement Scheme matters.',
            'We do not advise on your status or eligibility. The regulated firm advises on your situation.',
        ], cross=['/immigration/british-citizenship', '/immigration/settlement'], h1='EU Settlement Scheme'),

    # ------------------------------------------------------------ motoring offences
    '/motoring-offences/drink-driving': E(  # drink driving 2.2k, drink driving solicitors 1.1k, drink driving ban 200
        f'Drink Driving Solicitors | Drink Driving Ban Help | {B}',
        'Charged with drink driving? Find a drink driving solicitor in England and Wales for advice on the ban, special reasons and court. Free introductions.',
        'drink driving solicitors', 'Drink driving solicitors', [
            'A drink driving conviction normally brings a driving ban of at least 12 months, and can affect your job and insurance for years. Drink driving solicitors check the procedure and evidence, advise on special reasons that could avoid a ban and represent you at court.',
            'Ask about the drink drive rehabilitation course, which can reduce the length of the drink driving ban. Leaflegal introduces you to one regulated motoring offence solicitor.',
        ], [
            ('Can a drink driving solicitor stop a ban?', 'A ban is usually mandatory, but a solicitor can check whether the evidence and procedure were correct and whether special reasons apply, which can avoid or reduce a ban.'),
        ], cross=['/motoring-offences/drug-driving', '/licensing/personal-licences', '/licensing/taxi-and-private-hire-licences'], h1='Drink driving solicitors'),
    '/motoring-offences/drug-driving': E(  # drug driving 1.1k, drug driving solicitor 90
        f'Drug Driving Solicitors | {B}',
        'Charged with drug driving? Find a drug driving solicitor in England and Wales to check the blood test, limits and procedure. Free introductions.',
        'drug driving solicitor', 'Drug driving solicitors', [
            'Drug driving cases often turn on blood test results, legal limits and how samples were taken and stored. A drug driving solicitor can check each step and advise on your plea.',
            'Like drink driving, a conviction usually means a minimum 12 month ban. Leaflegal introduces you to one regulated motoring firm.',
        ], cross=['/motoring-offences/drink-driving'], h1='Drug driving solicitors'),
    '/motoring-offences/speeding': E(  # speeding solicitor 200, speeding fines uk 3.4k, speeding ticket 2.6k
        f'Speeding Solicitors | Speeding Fines and Points | {B}',
        'Facing speeding points, a high speeding fine or a ban? Find a speeding solicitor in England and Wales. Free introductions, no obligation.',
        'speeding solicitor', 'Speeding solicitors', [
            'Most speeding tickets are dealt with by a fixed penalty, but high speeds, a totting up ban or a court summons need more thought. A speeding solicitor can check the evidence, explain the likely speeding fine and points and represent you.',
            'If the extra points would take you to 12, ask about exceptional hardship. Leaflegal introduces you to one regulated motoring offence solicitor.',
        ], cross=['/motoring-offences/totting-up', '/motoring-offences/failing-to-identify-the-driver'], h1='Speeding solicitors'),
    '/motoring-offences/totting-up': E(  # totting up ban 700, totting up 300
        f'Totting Up Ban Solicitors | 12 Points | {B}',
        'Reached 12 points? Find a totting up ban solicitor to argue exceptional hardship and protect your licence. Free introductions, no obligation.',
        'totting up ban', 'Totting up ban solicitors', [
            'A totting up ban usually follows when you reach 12 or more points within three years, and the minimum ban is six months. The main way to avoid it is to show exceptional hardship.',
            'A totting up solicitor prepares your evidence and witnesses and presents the argument in court. Leaflegal introduces you to one regulated firm.',
        ], cross=['/motoring-offences/exceptional-hardship', '/motoring-offences/speeding'], h1='Totting up ban solicitors'),
    '/motoring-offences/exceptional-hardship': E(  # exceptional hardship 500
        f'Exceptional Hardship Solicitors | Keep Your Licence | {B}',
        'Facing a totting up ban? Find an exceptional hardship solicitor to prepare your evidence and argue to keep your licence. Free introductions.',
        'exceptional hardship', 'Exceptional hardship solicitors', [
            'Exceptional hardship is an argument that a ban would cause hardship beyond the usual inconvenience, often to other people such as family members, employees or patients. It needs strong evidence and careful preparation.',
            'An exceptional hardship solicitor can tell you whether your case is likely to succeed and prepare it. Leaflegal introduces you to one regulated motoring firm.',
        ], cross=['/motoring-offences/totting-up'], h1='Exceptional hardship solicitors'),
    '/motoring-offences/careless-driving': E(  # careless driving 900, careless driving solicitor 150
        f'Careless Driving Solicitors | {B}',
        'Charged with careless driving or driving without due care and attention? Find a careless driving solicitor in England and Wales. Free introductions.',
        'careless driving', 'Careless driving solicitors', [
            'Careless driving, or driving without due care and attention, carries 3 to 9 points or a discretionary ban. The outcome often depends on the evidence of how the driving fell below the standard expected.',
            'A careless driving solicitor can test the evidence and advise on your plea. Leaflegal introduces you to one regulated motoring firm.',
        ], cross=['/motoring-offences/dangerous-driving'], h1='Careless driving solicitors'),
    '/motoring-offences/dangerous-driving': E(  # dangerous driving 1.7k, dangerous driving solicitor 200
        f'Dangerous Driving Solicitors | {B}',
        'Charged with dangerous driving? Find a dangerous driving solicitor in England and Wales for this serious offence. Free introductions, no obligation.',
        'dangerous driving', 'Dangerous driving solicitors', [
            'Dangerous driving is a serious offence with an obligatory ban, an extended retest and a possible prison sentence. Early advice from a dangerous driving solicitor is important.',
            'Sometimes the evidence supports careless driving instead. Leaflegal introduces you to one regulated motoring firm.',
        ], cross=['/motoring-offences/careless-driving'], h1='Dangerous driving solicitors'),
    '/motoring-offences/failing-to-identify-the-driver': E(  # section 172 600, s172 300, failing to identify driver 60
        f'Section 172 Failing to Identify the Driver | {B}',
        'Received a section 172 notice or charged with failing to identify the driver? Find a motoring solicitor in England and Wales. Free introductions.',
        'section 172', 'Failing to identify the driver', [
            'A section 172 notice asks the registered keeper to name the driver. Failing to identify the driver carries 6 points and a fine, often more than the original offence.',
            'There are defences where the keeper used reasonable diligence and still could not identify the driver. A motoring solicitor can advise.',
        ], cross=['/motoring-offences/speeding'], h1='Failing to identify the driver'),
    '/motoring-offences/driving-without-insurance': E(  # driving without insurance 2.9k, driving without insurance penalty 300
        f'Driving Without Insurance Solicitors | IN10 | {B}',
        'Charged with driving without insurance? Find a solicitor to check the cover, advise on the IN10 penalty and special reasons. Free introductions.',
        'driving without insurance', 'Driving without insurance solicitors', [
            'Driving without insurance carries 6 to 8 points and an IN10 endorsement that can raise premiums for years. Sometimes there was cover after all, or special reasons apply.',
            'A motoring solicitor can check the policy and advise on the penalty. Leaflegal introduces you to one regulated motoring firm.',
        ], cross=['/motoring-offences/totting-up'], h1='Driving without insurance'),

    # ------------------------------------------------------------ trademarks and related IP (UK wide)
    '/trademarks': E(  # trademark registration 11k, trademark 7.2k, intellectual property lawyer 4.4k, trademark lawyer 450, trademark solicitor(s) 300, trademark attorney 250
        f'Trademark Solicitors and Attorneys UK | Register Your Trademark | {B}',
        'Find a trademark solicitor or chartered trade mark attorney to register, search, protect and enforce your brand across the UK. Free introductions, no obligation.',
        'trademark solicitors', 'Trademark solicitors', [
            'Looking for a trademark solicitor, trademark attorney or intellectual property lawyer? Leaflegal introduces you to one regulated firm that handles UK trademark registration, clearance searches, oppositions and brand disputes, as well as copyright and design rights. Because there is one UK trademark register, we can introduce you wherever you are in the UK.',
            'Trademark work is done by solicitors regulated by the Solicitors Regulation Authority and by chartered trade mark attorneys regulated by IPReg. Both can search, file and defend a trademark at the UK Intellectual Property Office, and solicitors can also take infringement claims to court. The firm explains its fees and the official UK IPO fees before you decide anything.',
        ], [
            ('What is the difference between a trademark attorney and a trademark solicitor?', 'Both can register and protect a UK trademark. A chartered trade mark attorney is regulated by IPReg and specialises in trademark filings and UK IPO proceedings. A trademark solicitor is regulated by the Solicitors Regulation Authority and can also bring or defend infringement claims in court.'),
            ('Do I need a lawyer to register a trademark?', 'No, anyone can apply at the UK IPO. Many businesses use a trademark solicitor or attorney because the classes and the wording of the goods and services decide how well the brand is protected, and the application can’t be widened once it is filed.'),
            ('Is an intellectual property lawyer the same as a trademark lawyer?', 'Trademarks are one part of intellectual property law. Many IP lawyers also handle copyright, design rights and passing off, which is why we cover those alongside trademarks.'),
        ], cross=['/trademarks/trademark-registration', '/trademarks/trademark-searches', '/debt-recovery'], h1='Trademark and IP solicitors'),
    '/trademarks/trademark-registration': E(  # trademark registration 11k, register a trademark 1.1k, register trademark uk 1k, uk trademark registration 450
        f'Trademark Registration UK | Register a Trademark With a Specialist | {B}',
        'Register a trademark in the UK with a trademark solicitor or attorney. Clearance, classes, filing at the UK IPO and international protection. Free introductions.',
        'trademark registration', 'UK trademark registration', [
            'UK trademark registration gives you the exclusive right to use your name, logo or slogan for the goods and services you list, across England, Wales, Scotland and Northern Ireland. You register a trademark with the UK Intellectual Property Office, which examines it, publishes it for opposition and then registers it for ten years.',
            'A trademark solicitor or attorney checks the mark is distinctive, searches for earlier rights, picks the right classes and drafts a specification that matches how you trade. Leaflegal introduces you to one regulated firm for your trademark registration.',
        ], [
            ('How much does it cost to register a trademark in the UK?', 'The UK IPO charges an official fee for the first class and a further fee for each extra class. Professional fees for searching and filing are usually quoted as a fixed fee on top.'),
            ('How long does UK trademark registration take?', 'Around four months if there are no objections or oppositions, and longer if there are.'),
        ], cross=['/trademarks/trademark-searches', '/guides/how-to-trademark-a-name'], h1='Trademark registration'),
    '/trademarks/trademark-searches': E(  # trademark search 4.7k, uk trademark search 2.2k, trademark search uk 2k, ipo trademark search 350, trademark clearance search 100
        f'UK Trademark Search | Professional Clearance Searches | {B}',
        'Check your brand is free to use with a professional UK trademark search. Clearance searches, similar marks and a written risk opinion. Free introductions.',
        'trademark search', 'UK trademark search', [
            'A UK trademark search shows whether someone already has rights in a name or logo like yours. The free UK IPO search finds identical marks, but a professional trademark clearance search also looks for marks that sound, look or mean the same, plus company names and unregistered use.',
            'A trademark attorney or solicitor turns the results into a clear view of the risk of using and registering your brand. Leaflegal introduces you to one regulated firm to run your trademark search.',
        ], [
            ('How do I do a UK trademark search?', 'You can search the UK IPO register online for free. For a launch or a filing, a professional clearance search is more thorough because it looks for similar marks as well as identical ones.'),
        ], cross=['/trademarks/trademark-registration', '/trademarks/objections-and-oppositions'], h1='Trademark searches'),
    '/trademarks/objections-and-oppositions': E(  # trademark opposition 150, oppose a trademark 70
        f'Trademark Opposition UK | Objections and Oppositions | {B}',
        'Received a UK IPO objection or notice of opposition, or want to oppose a trademark? Find a trademark specialist to act before the deadline. Free introductions.',
        'trademark opposition', 'Trademark oppositions', [
            'A trademark opposition is a challenge to an application, brought by someone with earlier rights during the two month opposition period after publication. Examiners can also object to an application before it is published.',
            'A trademark attorney or solicitor can respond to an examiner, oppose a trademark that clashes with yours or defend your own application. Leaflegal introduces you to one regulated firm.',
        ], [
            ('How do I oppose a trademark in the UK?', 'File a notice of opposition with the UK IPO within two months of the application being published, or within three months if you file a notice of threatened opposition first.'),
        ], cross=['/trademarks/trademark-infringement', '/trademarks/trademark-searches'], h1='Objections and oppositions'),
    '/trademarks/trademark-infringement': E(  # trademark infringement 700, brand infringement 200, trademark infringement lawyer 200, passing off 350
        f'Trademark Infringement Solicitors UK | Passing Off | {B}',
        'Someone using your brand, or accused of using theirs? Find a trademark infringement solicitor for letters, takedowns, passing off and court claims. Free introductions.',
        'trademark infringement', 'Trademark infringement', [
            'Trademark infringement is using a sign identical or similar to a registered trademark for similar goods or services without permission. If your brand is not registered, passing off can protect the goodwill you have built.',
            'A trademark infringement solicitor assesses both sides, deals with marketplace and social media takedowns and can bring or defend a claim. Leaflegal introduces you to one regulated firm that handles brand infringement.',
        ], [
            ('What is passing off?', 'A claim that protects unregistered brands. You need to show goodwill in your business, a misrepresentation by the other side that is likely to confuse customers, and damage as a result.'),
        ], cross=['/trademarks/cease-and-desist-letters', '/trademarks/copyright'], h1='Trademark infringement'),
    '/trademarks/cease-and-desist-letters': E(  # cease and desist 8.1k (KD 5), cease and desist letter 3.5k, cease and desist letter uk 500
        f'Cease and Desist Letter UK | Send or Respond With a Solicitor | {B}',
        'Need to send a cease and desist letter, or received one? Find a solicitor to write a proportionate letter or reply. Free introductions, no obligation.',
        'cease and desist letter', 'Cease and desist letters', [
            'A cease and desist letter is a formal demand that someone stops doing something, such as using your brand, copying your work or selling lookalike products. In the UK it is usually the first step in an IP dispute, and many disputes end with the letter.',
            'Because UK law penalises unjustified threats of trademark and design infringement, a cease and desist letter needs care. A solicitor can write it, or reply to one you have received. Leaflegal introduces you to one regulated firm.',
        ], [
            ('What does cease and desist mean?', 'It means stop and do not start again. A cease and desist letter asks the other side to stop a particular activity, and usually to confirm in writing that they will.'),
        ], cross=['/trademarks/trademark-infringement', '/trademarks/copyright'], h1='Cease and desist letters'),
    '/trademarks/trademark-renewals': E(  # trademark renewal service 150, renew trademark 100, trademark renewal 90
        f'Trademark Renewal UK | Renewals and Ownership Changes | {B}',
        'Renew a UK trademark, restore a lapsed one or record a new owner. Find a trademark specialist to keep your registrations in force. Free introductions.',
        'trademark renewal', 'Trademark renewals', [
            'A UK trademark lasts ten years and can be renewed again and again. Trademark renewal can be done up to six months before expiry, with a further six month late period for an extra fee.',
            'A trademark attorney or solicitor can renew your marks, record a change of owner after a sale and review whether older registrations are still protected. Leaflegal introduces you to one regulated firm.',
        ], [], cross=['/trademarks/trademark-registration'], h1='Renewals and ownership'),
    '/trademarks/copyright': E(  # copyright infringement 1.6k, copyright lawyer 350, copyright solicitor 100, copyright infringement lawyer 150
        f'Copyright Solicitors UK | Copyright Infringement Help | {B}',
        'Work copied, or received an image claim? Find a copyright solicitor for infringement, takedowns, licences and ownership disputes. Free introductions.',
        'copyright solicitor', 'Copyright solicitors', [
            'Copyright protects original writing, photos, art, music, film and software, and arises automatically in the UK. Copyright infringement happens when someone copies a substantial part of a work without permission.',
            'A copyright solicitor or copyright lawyer can help you prove ownership, act against copying or respond to a claim. Leaflegal introduces you to one regulated firm.',
        ], [], cross=['/trademarks/cease-and-desist-letters', '/trademarks/design-rights'], h1='Copyright'),
    '/trademarks/design-rights': E(  # unregistered design rights 150, registered design 100, design registration 70
        f'Design Rights and Registered Designs UK | {B}',
        'Protect the look of your product with a registered design, or act on copies. Find an IP specialist for design rights across the UK. Free introductions.',
        'registered design', 'Design rights', [
            'A registered design protects the shape, pattern and decoration of a product for up to 25 years. Unregistered design rights also arise automatically, but they last for less time and are harder to prove.',
            'An IP solicitor or attorney can prepare a design registration and act if a competitor copies your product. Leaflegal introduces you to one regulated firm.',
        ], [], cross=['/trademarks/copyright', '/trademarks/trademark-registration'], h1='Design rights'),

    # ------------------------------------------------------------ licensing
    '/licensing/premises-licence-applications': E(  # premises licence 800, alcohol licence 350, premises licence application 90
        f'Premises Licence Application Solicitors | {B}',
        'Applying for a premises licence or alcohol licence? Find a licensing solicitor to prepare the application and handle objections. Free introductions.',
        'premises licence', 'Premises licence applications', [
            'A premises licence lets a venue sell alcohol, provide regulated entertainment or serve late night refreshment. A premises licence application needs an operating schedule, plans and notices, and responsible authorities and residents can object.',
            'A licensing solicitor prepares the alcohol licence application, deals with objections and represents you at a hearing. Leaflegal introduces you to one regulated licensing firm.',
        ], cross=['/licensing/personal-licences', '/licensing/transfers-and-dps'], h1='Premises licence applications'),
    '/licensing/licence-variations': E(
        f'Premises Licence Variation Solicitors | {B}',
        'Need to change your hours, layout or conditions? Find a licensing solicitor for a premises licence variation or minor variation. Free introductions.',
        'premises licence variation', 'Premises licence variations', [
            'A premises licence variation changes your licensed hours, activities, layout or conditions. Small changes may qualify as a minor variation, while bigger ones need a full variation with notices.',
            'A licensing solicitor can advise which route applies and prepare the application.',
        ], cross=['/licensing/premises-licence-applications'], h1='Licence variations'),
    '/licensing/transfers-and-dps': E(  # designated premises supervisor 150
        f'Premises Licence Transfer and DPS Change | {B}',
        'Taking over a venue or changing the designated premises supervisor? Find a licensing solicitor for a licence transfer or DPS change. Free introductions.',
        'designated premises supervisor', 'Licence transfers and DPS changes', [
            'When a business changes hands, the premises licence usually needs transferring to the new operator. When the person running the bar changes, the designated premises supervisor (DPS) must be updated.',
            'Both can be done quickly with the right paperwork. A licensing solicitor can handle it for you.',
        ], cross=['/licensing/personal-licences', '/licensing/premises-licence-applications'], h1='Transfers and DPS changes'),
    '/licensing/licence-reviews': E(
        f'Premises Licence Review Solicitors | {B}',
        'Facing a premises licence review? Find a licensing solicitor to prepare your case and represent you at the hearing. Act quickly. Free introductions.',
        'licence review', 'Licence review solicitors', [
            'A premises licence review can lead to new conditions, suspension or revocation. Reviews are often brought by the police or council, and preparing early is vital.',
            'A licensing solicitor can negotiate conditions and represent you at the hearing.',
        ], cross=['/licensing/licence-variations'], h1='Licence review solicitors'),
    '/licensing/personal-licences': E(  # personal licence 1.6k, personal licence application 250, personal licence holder 150
        f'Personal Licence Solicitors | {B}',
        'Help with a personal licence application, a relevant offence or a personal licence review. Find a licensing solicitor. Free introductions.',
        'personal licence', 'Personal licence solicitors', [
            'A personal licence lets you authorise the sale of alcohol under a premises licence. Most applications are simple, but a relevant offence, such as drink driving, can lead to objections or a review.',
            'A licensing solicitor can advise personal licence holders facing a review or objection.',
        ], cross=['/motoring-offences/drink-driving', '/licensing/transfers-and-dps'], h1='Personal licence solicitors'),
    '/licensing/taxi-and-private-hire-licences': E(  # private hire licence 1.5k, taxi licence 350
        f'Taxi and Private Hire Licence Solicitors | {B}',
        'Taxi licence suspended or refused? Find a solicitor for taxi and private hire licence applications, reviews and appeals. Free introductions.',
        'private hire licence', 'Taxi licence solicitors', [
            'Taxi and private hire licence holders can face suspension or revocation after a complaint, an offence or points on their driving licence. Appeal deadlines are short.',
            'A taxi licence solicitor can respond to the council, represent you at a committee and appeal. Leaflegal introduces you to one regulated firm.',
        ], cross=['/motoring-offences/speeding', '/motoring-offences/totting-up'], h1='Taxi licence solicitors'),

    # ------------------------------------------------------------ debt recovery (business to business)
    '/debt-recovery/unpaid-invoices': E(  # unpaid invoices 350, how to chase unpaid invoices 50
        f'Unpaid Invoices | Debt Recovery Solicitors | {B}',
        'Customer not paying? Find a debt recovery solicitor to chase unpaid invoices, add late payment interest and take legal action. For businesses.',
        'unpaid invoices', 'Unpaid invoice recovery', [
            'Unpaid invoices hurt cash flow. If polite reminders have not worked, a debt recovery solicitor can step in with a formal demand, add statutory late payment interest and compensation, and take the matter to court if needed.',
            'Leaflegal introduces businesses to one regulated firm that recovers unpaid invoices from other businesses.',
        ], cross=['/debt-recovery/late-payment-interest', '/debt-recovery/letters-before-action'], h1='Unpaid invoice recovery'),
    '/debt-recovery/letters-before-action': E(  # letter before action 2.2k, letter before claim 500
        f'Letter Before Action Solicitors | {B}',
        'A letter before action from a solicitor often gets debts paid. Find a debt recovery firm to send a letter before claim for your business. Free introductions.',
        'letter before action', 'Letter before action', [
            'A letter before action, also called a letter before claim, is a formal demand that warns the debtor that court action will follow if they do not pay. It must follow the pre action rules.',
            'A letter before action on a solicitor’s letterhead often gets a debt paid without going further. Many firms send one for a fixed fee.',
        ], cross=['/debt-recovery/court-claims'], h1='Letters before action'),
    '/debt-recovery/court-claims': E(  # money claim online 6.6k, county court claim 400
        f'Business Debt Court Claims | Money Claim Online | {B}',
        'Need to take a customer to court for an unpaid debt? Find a solicitor for county court claims and Money Claim Online for business debts.',
        'county court claim', 'Court claims for business debts', [
            'If the debtor still does not pay, a county court claim is the next step. Many business debts are issued through Money Claim Online, and defended claims are allocated to the small claims, fast or multi track depending on value.',
            'A debt recovery solicitor can issue the claim, deal with any defence and get judgment.',
        ], cross=['/debt-recovery/enforcement', '/debt-recovery/letters-before-action'], h1='Court claims for debts'),
    '/debt-recovery/statutory-demands': E(  # statutory demand 1.6k
        f'Statutory Demand Solicitors | {B}',
        'Find a solicitor to serve a statutory demand on a company or individual that owes your business money. Free introductions, no obligation.',
        'statutory demand', 'Statutory demands', [
            'A statutory demand is a formal demand for an undisputed debt. If it is not paid or settled within 21 days, it can lead to a winding up petition or bankruptcy petition.',
            'Statutory demands should not be used where the debt is genuinely disputed. A debt recovery solicitor can advise.',
        ], cross=['/debt-recovery/winding-up-petitions'], h1='Statutory demand solicitors'),
    '/debt-recovery/winding-up-petitions': E(  # winding up petition 2.1k
        f'Winding Up Petition Solicitors | {B}',
        'Find a solicitor to present a winding up petition against a company that will not pay an undisputed debt. Free introductions, no obligation.',
        'winding up petition', 'Winding up petitions', [
            'A winding up petition asks the court to close a company that cannot pay its debts. It is a serious step that often prompts payment.',
            'A debt recovery solicitor can advise on whether a winding up petition is right.',
        ], cross=['/debt-recovery/statutory-demands', '/debt-recovery/enforcement'], h1='Winding up petition solicitors'),
    '/debt-recovery/enforcement': E(  # high court enforcement 2.2k, ccj enforcement 900
        f'CCJ and High Court Enforcement Solicitors | {B}',
        'Won a judgment but still not paid? Find a solicitor for CCJ enforcement, High Court enforcement, charging orders and more. Free introductions.',
        'High Court enforcement', 'Judgment enforcement', [
            'A county court judgment (CCJ) is not the same as payment. CCJ enforcement options include transferring the judgment for High Court enforcement, a charging order on property, a third party debt order or an attachment of earnings order.',
            'A debt recovery solicitor can choose the method most likely to work.',
        ], cross=['/debt-recovery/court-claims'], h1='Enforcing a judgment'),
    '/debt-recovery/late-payment-interest': E(  # late payment of commercial debts 350, late payment interest 350
        f'Late Payment of Commercial Debts Interest | {B}',
        'Claim late payment interest and compensation on overdue business invoices under the Late Payment of Commercial Debts rules. Find a solicitor.',
        'late payment interest', 'Late payment interest', [
            'Under the Late Payment of Commercial Debts (Interest) Act 1998, businesses can usually claim statutory late payment interest at 8 percent above the Bank of England base rate, plus fixed compensation on each overdue invoice.',
            'A debt recovery solicitor can work out what you can claim and add it to your demand.',
        ], cross=['/debt-recovery/unpaid-invoices'], h1='Late payment interest'),

    # ------------------------------------------------------------ guides
    '/guides/how-conveyancing-works': E(  # conveyancing process 900, how long does conveyancing take 800
        f'The Conveyancing Process Step by Step | {B}',
        'How the conveyancing process works in England and Wales, how long conveyancing takes and what your conveyancer does at each stage.',
        'conveyancing process', 'The conveyancing process', []),
    '/guides/conveyancing-searches-explained': E(  # conveyancing searches 350, local authority search 900
        f'Conveyancing Searches and Local Authority Search | {B}',
        'What conveyancing searches are, including the local authority search, water and drainage and environmental searches, and why they matter.',
        'conveyancing searches', 'Conveyancing searches explained', []),
    '/guides/leasehold-vs-freehold': E(  # leasehold vs freehold 4k
        f'Leasehold vs Freehold | What Is the Difference | {B}',
        'Leasehold vs freehold explained. What you own, ground rent and service charges, and why lease length matters for flats in England and Wales.',
        'leasehold vs freehold', 'Leasehold vs freehold', []),
    '/guides/how-to-extend-a-lease': E(  # how to extend a lease 150, lease extension process 100
        f'How to Extend a Lease | Lease Extension Process | {B}',
        'How to extend a lease on a flat, the statutory and informal routes, the section 42 notice and how long the lease extension process takes.',
        'how to extend a lease', 'How to extend a lease', []),
    '/guides/how-divorce-works': E(  # divorce process uk 3.1k, no fault divorce 2.2k
        f'Divorce Process UK | How No Fault Divorce Works | {B}',
        'The divorce process in England and Wales step by step, from the no fault divorce application to the conditional order, final order and finances.',
        'divorce process', 'The divorce process', []),
    '/guides/how-to-trademark-a-name': E(  # how to trademark a name 1.1k (KD 6), how to trademark a logo 250, trademark a business name 150
        f'How to Trademark a Name in the UK | Step by Step | {B}',
        'How to trademark a business name or logo in the UK, from checking it is distinctive and searching to filing at the UK IPO, plus what it costs.',
        'how to trademark a name', 'How to trademark a name', []),
}

# Anchor words that link to a page when they appear in plain body paragraphs (first match only, one link per paragraph).
# Longest phrases first. Targets are keyword-led pages above.
AUTO_LINKS = [
    ('conveyancing solicitors', '/conveyancing'), ('conveyancing solicitor', '/conveyancing'), ('conveyancing quote', '/conveyancing'),
    ('solicitor for buying a house', '/conveyancing/buying-a-home'), ('buying a house', '/conveyancing/buying-a-home'),
    ('selling a house', '/conveyancing/selling-a-home'), ('selling your home', '/conveyancing/selling-a-home'),
    ('remortgage solicitor', '/conveyancing/remortgaging'), ('remortgaging', '/conveyancing/remortgaging'),
    ('transfer of equity', '/conveyancing/transfer-of-equity'), ('first time buyers', '/conveyancing/first-time-buyers'), ('first time buyer', '/conveyancing/first-time-buyers'),
    ('buy to let', '/conveyancing/buy-to-let'), ('new build', '/conveyancing/new-build-purchases'),
    ('leasehold conveyancing', '/conveyancing/buying-a-leasehold-flat'), ('buying a leasehold flat', '/conveyancing/buying-a-leasehold-flat'),
    ('selling a leasehold flat', '/lease-extensions/selling-a-leasehold-flat'),
    ('lease extension solicitors', '/lease-extensions'), ('lease extension solicitor', '/lease-extensions'), ('lease extensions', '/lease-extensions'), ('lease extension', '/lease-extensions'),
    ('section 42 notice', '/lease-extensions/statutory-lease-extension'), ('statutory lease extension', '/lease-extensions/statutory-lease-extension'),
    ('informal lease extension', '/lease-extensions/informal-lease-extension'),
    ('collective enfranchisement', '/lease-extensions/collective-enfranchisement'), ('buying the freehold', '/lease-extensions/collective-enfranchisement'), ('buy the freehold', '/lease-extensions/collective-enfranchisement'),
    ('short lease', '/lease-extensions/short-lease'), ('deed of variation', '/lease-extensions/lease-variations'),
    ('leasehold vs freehold', '/guides/leasehold-vs-freehold'),
    ('conveyancing searches', '/guides/conveyancing-searches-explained'),
    ('divorce solicitors', '/family-law/divorce'), ('divorce solicitor', '/family-law/divorce'), ('divorce lawyer', '/family-law/divorce'), ('no fault divorce', '/guides/how-divorce-works'),
    ('family law solicitors', '/family-law'), ('family law solicitor', '/family-law'), ('family solicitors', '/family-law'), ('family solicitor', '/family-law'),
    ('financial settlement', '/family-law/financial-settlements'), ('clean break order', '/family-law/financial-settlements'), ('financial order', '/family-law/financial-settlements'),
    ('consent order', '/family-law/consent-orders'), ('child arrangements order', '/family-law/child-arrangements'), ('child arrangements', '/family-law/child-arrangements'),
    ('separation agreement', '/family-law/separation-agreements'), ('cohabitation agreement', '/family-law/cohabitation-disputes'),
    ('prenuptial agreement', '/family-law/prenuptial-agreements'), ('prenup', '/family-law/prenuptial-agreements'),
    ('civil partnership dissolution', '/family-law/civil-partnership-dissolution'), ('dissolving a civil partnership', '/family-law/civil-partnership-dissolution'),
    ('immigration lawyer', '/immigration'), ('immigration solicitors', '/immigration'), ('immigration solicitor', '/immigration'),
    ('spouse visa', '/immigration/spouse-and-partner-visas'), ('partner visa', '/immigration/spouse-and-partner-visas'),
    ('indefinite leave to remain', '/immigration/settlement'), ('British citizenship', '/immigration/british-citizenship'),
    ('skilled worker visa', '/immigration/work-visas'), ('work visa', '/immigration/work-visas'),
    ('sponsor licence', '/immigration/sponsor-licences'), ('family visa', '/immigration/family-visas'),
    ('EU Settlement Scheme', '/immigration/eu-settlement-scheme'), ('settled status', '/immigration/eu-settlement-scheme'),
    ('motoring offence solicitors', '/motoring-offences'), ('motoring offence solicitor', '/motoring-offences'), ('driving offence solicitors', '/motoring-offences'),
    ('drink driving', '/motoring-offences/drink-driving'), ('drug driving', '/motoring-offences/drug-driving'),
    ('speeding fine', '/motoring-offences/speeding'), ('speeding ticket', '/motoring-offences/speeding'),
    ('totting up', '/motoring-offences/totting-up'), ('exceptional hardship', '/motoring-offences/exceptional-hardship'),
    ('careless driving', '/motoring-offences/careless-driving'), ('dangerous driving', '/motoring-offences/dangerous-driving'),
    ('section 172', '/motoring-offences/failing-to-identify-the-driver'), ('failing to identify the driver', '/motoring-offences/failing-to-identify-the-driver'),
    ('driving without insurance', '/motoring-offences/driving-without-insurance'),
    ('licensing solicitors', '/licensing'), ('licensing solicitor', '/licensing'),
    ('premises licence application', '/licensing/premises-licence-applications'), ('premises licence variation', '/licensing/licence-variations'),
    ('designated premises supervisor', '/licensing/transfers-and-dps'), ('licence review', '/licensing/licence-reviews'),
    ('personal licence', '/licensing/personal-licences'), ('private hire licence', '/licensing/taxi-and-private-hire-licences'), ('taxi licence', '/licensing/taxi-and-private-hire-licences'),
    ('premises licence', '/licensing/premises-licence-applications'),
    ('debt recovery solicitors', '/debt-recovery'), ('debt recovery solicitor', '/debt-recovery'), ('commercial debt recovery', '/debt-recovery'), ('business debt recovery', '/debt-recovery'),
    ('unpaid invoices', '/debt-recovery/unpaid-invoices'), ('unpaid invoice', '/debt-recovery/unpaid-invoices'),
    ('letter before action', '/debt-recovery/letters-before-action'), ('letter before claim', '/debt-recovery/letters-before-action'),
    ('Money Claim Online', '/debt-recovery/court-claims'), ('county court claim', '/debt-recovery/court-claims'),
    ('statutory demand', '/debt-recovery/statutory-demands'), ('winding up petition', '/debt-recovery/winding-up-petitions'),
    ('High Court enforcement', '/debt-recovery/enforcement'), ('county court judgment', '/debt-recovery/enforcement'),
    ('late payment interest', '/debt-recovery/late-payment-interest'), ('Late Payment of Commercial Debts', '/debt-recovery/late-payment-interest'),
    ('trademark solicitors', '/trademarks'), ('trademark solicitor', '/trademarks'), ('trademark attorney', '/trademarks'), ('intellectual property lawyer', '/trademarks'),
    ('trademark registration', '/trademarks/trademark-registration'), ('register a trademark', '/trademarks/trademark-registration'),
    ('trademark search', '/trademarks/trademark-searches'), ('clearance search', '/trademarks/trademark-searches'),
    ('notice of opposition', '/trademarks/objections-and-oppositions'), ('trademark opposition', '/trademarks/objections-and-oppositions'),
    ('trademark infringement', '/trademarks/trademark-infringement'), ('passing off', '/trademarks/trademark-infringement'),
    ('cease and desist letter', '/trademarks/cease-and-desist-letters'), ('trademark renewal', '/trademarks/trademark-renewals'),
    ('copyright infringement', '/trademarks/copyright'), ('copyright solicitor', '/trademarks/copyright'),
    ('registered design', '/trademarks/design-rights'), ('design right', '/trademarks/design-rights'),
]

# Location page titles, led by the phrase people search with (Ahrefs UK, e.g. conveyancing solicitors london 1.7k, family solicitors bristol 800).
LOCAL_TITLE = {'conveyancing': 'Conveyancing Solicitors in {c}', 'family-law': 'Family and Divorce Solicitors in {c}',
               'motoring-offences': 'Motoring Offence Solicitors in {c}', 'licensing': 'Licensing Solicitors in {c}',
               'debt-recovery': 'Debt Recovery Solicitors in {c}', 'lease-extensions': 'Lease Extension Solicitors in {c}',
               'trademarks': 'Trademark Solicitors in {c}'}
