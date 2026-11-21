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
]
