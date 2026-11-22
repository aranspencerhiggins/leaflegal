# Client guides: /guides/<slug>. Plain English, general information only, never advice. No em dashes.
# Immigration guides explain how to find and work with a regulated adviser, never eligibility or routes.

def g(slug, area, title, desc, h1, lead, blocks):
    return {'slug': slug, 'area': area, 'title': title, 'desc': desc, 'h1': h1, 'lead': lead, 'blocks': blocks}

GUIDES = [
    g('how-conveyancing-works', 'conveyancing', 'How Conveyancing Works, A Step by Step Guide | Leaflegal',
      'How conveyancing works in England and Wales, from offer accepted to completion, and what your conveyancer does at each stage.',
      'How conveyancing works', 'What happens between your offer being accepted and getting the keys.', [
      ('h2', 'Instructing a conveyancer'), ('p', 'Once an offer is accepted, both buyer and seller instruct a conveyancer. The seller’s conveyancer prepares the contract pack and the buyer’s conveyancer checks it.'),
      ('h2', 'Searches and enquiries'), ('p', 'The buyer’s conveyancer orders searches and raises questions about anything unclear in the title or the property information.'),
      ('h2', 'Mortgage offer and report'), ('p', 'If you are buying with a mortgage, the lender issues an offer and your conveyancer checks its conditions. They then report to you before you sign.'),
      ('h2', 'Exchange and completion'), ('p', 'At exchange, contracts become binding and a completion date is fixed. On completion, the money moves, you get the keys and your conveyancer registers the change of ownership.'),
      ('ul', ['Ask for a full quote including disbursements', 'Reply to your conveyancer quickly', 'Keep your mortgage broker and estate agent in the loop'])]),
    g('conveyancing-searches-explained', 'conveyancing', 'Conveyancing Searches Explained | Leaflegal',
      'What conveyancing searches are, which ones are usually ordered and why they matter when you buy a property.',
      'Conveyancing searches explained', 'The checks your conveyancer carries out on a property before you buy it.', [
      ('p', 'Searches are enquiries made to councils and other bodies about a property and its surroundings. Lenders usually require them, and they help you avoid surprises.'),
      ('h2', 'Common searches'), ('ul', ['Local authority search, covering planning, building control, roads and local charges', 'Water and drainage search, showing whether the property is connected to mains services', 'Environmental search, covering contaminated land and flood risk', 'Other searches depending on location, such as mining']),
      ('h2', 'What if a search shows a problem?'), ('p', 'Your conveyancer will explain what it means and what your options are, which might include asking questions, negotiating or reconsidering the purchase.')]),
    g('leasehold-vs-freehold', 'lease-extensions', 'Leasehold vs Freehold, What’s the Difference? | Leaflegal',
      'The difference between leasehold and freehold property in England and Wales, and what it means for owners of flats and houses.',
      'Leasehold vs freehold', 'What you actually own, and why it matters.', [
      ('h2', 'Freehold'), ('p', 'If you own the freehold, you own the building and the land it stands on, with no time limit.'),
      ('h2', 'Leasehold'), ('p', 'If you own a leasehold, you own the right to occupy the property for the length of the lease. Most flats are leasehold. You usually pay ground rent and a service charge, and the lease sets rules about what you can do.'),
      ('h2', 'Why lease length matters'), ('p', 'As a lease gets shorter, the property can become harder to sell or mortgage. Many leaseholders have the right to extend their lease or buy the freehold with their neighbours.'),
      ('p', 'The law on leasehold is changing. A solicitor can tell you what applies to your property now.')]),
    g('how-to-extend-a-lease', 'lease-extensions', 'How to Extend a Lease on a Flat | Leaflegal',
      'The main ways to extend the lease on your flat, how the process works and who you need to help you.',
      'How to extend a lease', 'Your options when the lease on your flat is getting shorter.', [
      ('h2', 'Two main routes'), ('ul', ['The statutory route, a formal process using your legal right, with set steps and deadlines', 'The informal route, agreeing terms directly with your freeholder']),
      ('h2', 'Who you need'), ('p', 'A solicitor who deals with leasehold, and a surveyor to value the premium. They usually work together.'),
      ('h2', 'Timing'), ('p', 'Start well before you plan to sell or remortgage. A statutory extension can take several months.')]),
    g('how-divorce-works', 'family-law', 'How Divorce Works in England and Wales | Leaflegal',
      'How no fault divorce works in England and Wales, from the application to the conditional order, the final order and sorting out finances.',
      'How divorce works', 'The steps in a no fault divorce, and what it does and doesn’t cover.', [
      ('h2', 'No fault divorce'), ('p', 'Since April 2022, you only need to state that the marriage has broken down irretrievably. You can apply alone or jointly.'),
      ('h2', 'The timeline'), ('ul', ['Application', 'At least 20 weeks, then the conditional order', 'At least six weeks and one day more, then the final order']),
      ('h2', 'Money and children'), ('p', 'The divorce ends the marriage but doesn’t deal with money or children. A financial order, often a consent order, makes a settlement binding. Many people take advice before applying for the final order.')]),
    g('choosing-an-immigration-adviser', 'immigration', 'How to Choose an Immigration Adviser | Leaflegal',
      'How to check an immigration adviser is regulated, what to ask before you instruct them and how Leaflegal introductions work.',
      'How to choose an immigration adviser', 'How to make sure the person helping you is allowed to give immigration advice.', [
      ('p', 'In the UK, it is a criminal offence to give immigration advice unless you are regulated to do so. Using a regulated adviser protects you.'),
      ('h2', 'Who can give immigration advice'), ('ul', ['Solicitors’ firms regulated by the Solicitors Regulation Authority', 'Practices regulated by CILEx Regulation', 'Advisers registered with the Immigration Advice Authority, at the right level for the work']),
      ('h2', 'Questions to ask'), ('ul', ['Who is regulated, and by whom?', 'What will it cost, and what is included?', 'Who will handle my case day to day?', 'How will you keep me updated?']),
      ('h2', 'How Leaflegal helps'), ('p', 'Leaflegal does not give immigration advice. We ask a few questions about the type of help you need and introduce you to a regulated firm or adviser.')]),
    g('preparing-for-an-immigration-consultation', 'immigration', 'Preparing for an Immigration Consultation | Leaflegal',
      'What to have ready before your first call or meeting with a regulated immigration adviser.',
      'Preparing for an immigration consultation', 'Getting the most from your first conversation with an adviser.', [
      ('h2', 'Have these ready'), ('ul', ['Your passport and any current visa or status documents', 'Copies of previous applications and decisions', 'Any letters from the Home Office, with dates', 'A list of your questions']),
      ('h2', 'Deadlines'), ('p', 'If you have a decision letter or a visa end date, tell the adviser straight away. Some deadlines are very short.'),
      ('h2', 'Be open'), ('p', 'Tell the adviser about anything that worries you, including past problems. They can only help with what they know.')]),
    g('what-happens-at-a-motoring-hearing', 'motoring-offences', 'What Happens at a Motoring Offence Hearing | Leaflegal',
      'What to expect at a magistrates’ court hearing for a motoring offence, and how a solicitor can help.',
      'What happens at a motoring offence hearing', 'A plain English guide to your first hearing.', [
      ('h2', 'Before the hearing'), ('p', 'Read your court papers carefully and get advice before the hearing, especially if a ban is possible.'),
      ('h2', 'On the day'), ('p', 'Arrive early. Your case will be called, you will be asked to confirm your details and enter a plea. If you plead guilty, the court may sentence you the same day.'),
      ('h2', 'How a solicitor helps'), ('ul', ['Checking the evidence and procedure', 'Advising on plea', 'Putting forward mitigation or an exceptional hardship argument'])]),
    g('how-to-trademark-a-name', 'trademarks', 'How to Trademark a Name in the UK | Leaflegal',
      'How to trademark a business name, logo or product name in the UK, step by step, from searching to registration, and what it costs.',
      'How to trademark a name', 'A plain English guide to protecting your brand name in the UK.', [
      ('h2', 'Check the name can be registered'), ('p', 'A trademark must be distinctive. Names that simply describe the product, such as Fresh Bread for a bakery, are usually refused. Invented words and names with no link to what you sell are the easiest to register.'),
      ('h2', 'Search for earlier marks'), ('p', 'Search the UK IPO register for identical and similar marks used for similar goods or services. A professional clearance search also looks at company names and unregistered use.'),
      ('h2', 'Choose your classes and specification'), ('p', 'Goods and services are grouped into 45 classes. You list exactly what you sell in each class you choose. The list decides what your registration protects, and it cannot be widened after filing.'),
      ('h2', 'File, examination and publication'), ('p', 'Once you file at the UK IPO, an examiner checks the application. If it is accepted, it is published for two months so others can oppose it. If nobody does, it is registered, usually around four months after filing.'),
      ('ul', ['Search before you spend money on branding', 'Describe your goods and services carefully', 'Keep evidence of when you started using the name'])]),
]

# Extra depth for each guide (owner, 2026-11-21: "more text"). 'key' shows as a summary box at the top, 'more' is added
# after the original sections. Block kinds: h2, p, ul, tip.
EXTRA = {
    'how-conveyancing-works': {
        'key': ['Most purchases take around three to four months from offer to completion', 'Exchange is the point of no return, completion is when you get the keys', 'Replying quickly to your conveyancer is the best way to avoid delays'],
        'more': [
            ('h2', 'How long it takes'), ('p', 'A straightforward purchase with no chain often takes eight to twelve weeks. Leasehold flats, new builds and long chains usually take longer, because there are more people to hear back from and more documents to check.'),
            ('h2', 'What can slow things down'), ('ul', ['Waiting for searches from the local council', 'Missing documents, such as building regulation certificates', 'Questions about the lease or the management company', 'Someone further up or down the chain not being ready']),
            ('h2', 'What it costs'), ('p', 'You pay a legal fee to the conveyancer plus disbursements, such as searches and Land Registry fees. If you are buying, Stamp Duty Land Tax may also be due. Ask for a written quote that lists everything, so you can compare firms properly.'),
            ('tip', 'Instruct your conveyancer as soon as your offer is accepted. Starting the paperwork early is one of the simplest ways to keep your move on track.'),
        ]},
    'conveyancing-searches-explained': {
        'key': ['Searches are checks on the property and the area around it', 'Most lenders insist on them', 'They usually take a few weeks to come back'],
        'more': [
            ('h2', 'How long searches take'), ('p', 'Many searches come back within a couple of weeks, but some councils take longer. Your conveyancer will usually order them as soon as you instruct them and pay the search fees, so it helps to instruct a firm early.'),
            ('h2', 'Do I need searches if I am a cash buyer?'), ('p', 'There is no legal requirement for a cash buyer to have searches, but skipping them means you could buy a property with problems you didn’t know about. Most conveyancers strongly recommend them.'),
            ('h2', 'Search indemnity insurance'), ('p', 'Sometimes a seller or conveyancer suggests insurance instead of a local authority search, to save time. It can help in some cases, but it does not tell you anything about the property. Ask your conveyancer what it covers before you agree.'),
            ('tip', 'Read the summary your conveyancer sends you after the searches come back, and ask about anything you don’t understand.'),
        ]},
    'leasehold-vs-freehold': {
        'key': ['Freehold means you own the building and the land', 'Leasehold means you own the right to live there for a set number of years', 'Lease length affects value and whether lenders will lend'],
        'more': [
            ('h2', 'Ground rent and service charges'), ('p', 'Leaseholders usually pay ground rent to the freeholder and a service charge towards the upkeep of shared areas, such as the roof, stairs and gardens. Your lease says how these are worked out and when they can go up.'),
            ('h2', 'Share of freehold'), ('p', 'In some buildings the flat owners own the freehold together, often through a company. This is called a share of freehold. It gives you more control over how the building is run, but you also share the responsibilities.'),
            ('h2', 'Buying a leasehold property'), ('ul', ['Check how many years are left on the lease', 'Ask for the latest service charge accounts and any planned major works', 'Check the ground rent and how it can increase', 'Ask your conveyancer to explain any restrictions in the lease']),
            ('tip', 'If the lease has fewer than about 90 years left, speak to a solicitor about extending it before you sell or remortgage.'),
        ]},
    'how-to-extend-a-lease': {
        'key': ['There is a formal statutory route and an informal route', 'You will usually need a solicitor and a surveyor', 'Starting early gives you more options'],
        'more': [
            ('h2', 'The statutory route in more detail'), ('p', 'There used to be a rule that you had to own the flat for two years before using the statutory route, but the Leasehold and Freehold Reform Act 2024 removed it from 31 January 2025. Your solicitor will confirm what applies to you. Under the statutory route, your solicitor serves a formal notice on the freeholder setting out your proposed premium, and the freeholder replies with a counter notice. If you can’t agree, a tribunal can decide.'),
            ('h2', 'The informal route in more detail'), ('p', 'An informal deal can be quicker and more flexible. The freeholder can set their own terms, though, so a solicitor should check the new lease carefully before you sign.'),
            ('h2', 'What affects the premium'), ('ul', ['How many years are left on the lease', 'The value of the flat', 'The ground rent', 'Whether the lease is below 80 years, which can make extending more expensive']),
            ('tip', 'The rules on leasehold are changing. Ask your solicitor which rules apply to your lease right now.'),
        ]},
    'how-divorce-works': {
        'key': ['No fault divorce means nobody has to be blamed', 'It takes at least 26 weeks from application to final order', 'Money and children are dealt with separately from the divorce itself'],
        'more': [
            ('h2', 'Applying alone or together'), ('p', 'You can apply on your own, as a sole applicant, or together with your spouse as joint applicants. A joint application can feel less confrontational, but both of you need to agree to go ahead at each stage.'),
            ('h2', 'Why finances matter'), ('p', 'A divorce does not end financial claims between you. Without a financial order, either of you could make a claim in the future. A consent order records what you have agreed and makes it legally binding, and a solicitor can help you prepare one.'),
            ('h2', 'Arrangements for children'), ('p', 'Many parents agree arrangements for their children between themselves or through mediation. If you can’t agree, the court can make a child arrangements order. Courts usually expect you to consider mediation first.'),
            ('tip', 'Speak to a family solicitor before you apply for the final order if your finances are not yet sorted.'),
        ]},
    'choosing-an-immigration-adviser': {
        'key': ['Only regulated advisers can give immigration advice', 'You can check an adviser on their regulator’s register', 'Always ask for fees and what they cover in writing'],
        'more': [
            ('h2', 'How to check an adviser'), ('p', 'Solicitors’ firms can be checked on the Solicitors Regulation Authority register. Advisers registered with the Immigration Advice Authority can be checked on its online register, which also shows the level of work they are allowed to do.'),
            ('h2', 'Warning signs'), ('ul', ['They won’t tell you who regulates them', 'They promise a particular result', 'They ask for large cash payments without a written agreement', 'They pressure you to decide quickly']),
            ('h2', 'Fees'), ('p', 'Advisers often charge a fixed fee for each application. Home Office fees are separate and are paid to the Home Office. A regulated adviser should explain their costs clearly before you agree to anything.'),
            ('tip', 'Keep copies of everything you sign and everything you send to your adviser or the Home Office.'),
        ]},
    'preparing-for-an-immigration-consultation': {
        'key': ['Bring your documents and any letters from the Home Office', 'Tell the adviser about any deadlines straight away', 'Write down your questions before the call'],
        'more': [
            ('h2', 'Questions you might want to ask'), ('ul', ['What will it cost, and what does that include?', 'Who will handle my case day to day?', 'How long might it take?', 'What do you need from me next?']),
            ('h2', 'If you need an interpreter'), ('p', 'Tell the adviser before your appointment if you would like an interpreter or would feel more comfortable with someone with you. Many advisers can arrange this.'),
            ('h2', 'After the consultation'), ('p', 'The adviser should confirm in writing what they will do, what it costs and what they need from you. Read it carefully and ask about anything that is unclear before you agree.'),
            ('tip', 'Leaflegal does not give immigration advice. We introduce you to a regulated adviser who can.'),
        ]},
    'what-happens-at-a-motoring-hearing': {
        'key': ['Get advice before the hearing, especially if a ban is possible', 'Arrive early and bring your paperwork', 'The court may sentence you on the same day'],
        'more': [
            ('h2', 'What to bring'), ('ul', ['Your court papers and any letters from the police', 'Your driving licence', 'Details of your income and outgoings, as fines are linked to income', 'Any letters supporting an exceptional hardship argument']),
            ('h2', 'Possible outcomes'), ('p', 'Depending on the offence, the court can impose a fine, add penalty points or disqualify you from driving. For more serious offences other sentences are possible. A solicitor can explain what is likely in your case and how to put forward your side.'),
            ('h2', 'Exceptional hardship'), ('p', 'If you reach 12 points, the court will usually ban you for at least six months. You can argue that a ban would cause exceptional hardship, for example to people who rely on you. These arguments need careful preparation and evidence.'),
            ('tip', 'If you can’t attend on the date given, contact the court and your solicitor as soon as possible.'),
        ]},
    'how-to-trademark-a-name': {
        'key': ['A company name at Companies House is not a trademark', 'Search before you file, because a filed application can’t be widened', 'Registration usually takes around four months if nobody objects'],
        'more': [
            ('h2', 'What it costs'), ('p', 'The UK IPO charges an official fee for the first class and a further fee for each extra class. If you use a trademark solicitor or attorney, they usually quote a fixed fee for searching and filing on top.'),
            ('h2', 'Trademarking a logo as well as a name'), ('p', 'A word mark protects the name however it is written. A logo mark protects the design. Many businesses start with the word mark because it gives the widest protection for the name itself.'),
            ('h2', 'Protecting the name abroad'), ('p', 'A UK registration only covers the UK. If you trade overseas, a trademark attorney can extend protection to other countries, for example through the Madrid system.'),
            ('tip', 'Use the ® symbol only once your mark is registered. Until then you can use ™ to show you claim the name as a trademark.'),
        ]},
}
