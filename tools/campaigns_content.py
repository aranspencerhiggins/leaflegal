# Bespoke campaigns for law firms (/partners/bespoke-campaigns). Copy rules apply, so no colons, semicolons or em dashes in any string.
#
# Compliance framing (researched 24 Nov 2026, not legal advice, a regulatory solicitor should review before heavy promotion):
# - Under your brand. The firm is the advertiser of record and the regulated provider. SRA Code 8.8 (accurate publicity incl. charges),
#   8.9 (no unsolicited approaches) and 8.10 apply to it, and the SRA warning notice on marketing (Dec 2024) says firms are responsible for
#   marketing material used by third parties they work with. We are its marketing supplier and data processor (UK GDPR art 28).
# - On your behalf. Leaflegal runs the campaign and passes enquiries to one named firm. That is an introduction, so SRA Code 5.1 applies
#   (tell clients about the arrangement in writing, no payment for criminal clients, clients not acquired in a way that would breach SRA rules).
# - Fees are flat or monthly for genuine marketing work, never per referral or tied to referral numbers (SRA LASPO s56-60 guidance red flags).
# - Out of scope. Personal injury and clinical negligence (LASPO ban), FCA claims management sectors (PI, financial products, housing
#   disrepair, employment, criminal injuries, benefits), consumer debt collection, criminal defence, and any immigration advice (IAA 1999 s84).
# - Channels. No cold calls, door knocking, or unsolicited texts and emails to the public (SRA 8.9, PECR regs 21 and 22). B2B email only
#   to corporate subscribers with an opt out. Ads follow the CAP Code.

SLUG = 'bespoke-campaigns'
URL = f'/partners/{SLUG}'
NAV = 'Bespoke campaigns'
TITLE = 'Bespoke Marketing Campaigns for Law Firms | Leaflegal'
DESC = ('Custom marketing campaigns for UK law firms, run under your own brand or by Leaflegal on your behalf. '
        'Built around SRA rules, with a flat fee that never depends on referrals.')
H1 = 'Bespoke campaigns for law firms'
LEAD = 'Campaigns built around your firm, your practice areas and your patch. Run under your brand, or by us on your behalf.'
TICKS = ['Under your brand or run by us for you', 'Built around SRA publicity and referral rules', 'A flat campaign fee, never a fee per referral']

INTRO = [
    'Some firms want more than a steady flow of shared demand. You might be launching a new office, pushing a practice area that is quiet, '
    'or competing in a town where three other firms already buy every search term. A bespoke campaign is planned around that goal.',
    'We plan the audience, write the ads and landing pages, set up tracking and run the campaign day to day. You approve everything that '
    'goes out and the enquiries come straight to your team.',
]

# The two ways of working. (icon, title, short, [ticks], who it suits)
MODELS = [
    ('briefcase', 'Under your brand',
     'We run the campaign as your marketing team. The ads, landing pages and follow up emails carry your firm’s name, and enquiries go straight to you.',
     ['Your firm is the advertiser and the regulated provider', 'Ads run in your own ad accounts, so you keep the data and history',
      'Landing pages show your SRA number, digital badge, prices and complaints details', 'You sign off every ad and page before it goes live',
      'We act as your data processor under a written agreement'],
     'Best for firms that want to build their own brand and keep everything in house.'),
    ('user', 'On your behalf',
     'We run the campaign under the Leaflegal name and pass every enquiry to your firm alone. Clients are told who you are and how we work together before they are introduced.',
     ['Clients are told in writing about our arrangement with your firm', 'Every enquiry goes to your firm only, never shared or resold',
      'You never need to set up ad accounts or landing pages', 'Our intake asks questions only and never gives legal or immigration advice',
      'Consent wording and time are recorded with each enquiry'],
     'Best for firms that want results without running a marketing operation.'),
]

CHANNELS = [
    ('eye', 'Paid search', 'Google and Bing ads on the searches your clients actually make, with tight local targeting.'),
    ('growth', 'Paid social', 'Meta and LinkedIn campaigns for awareness, retargeting and business audiences.'),
    ('doc', 'Landing pages', 'Fast, focused pages built for one matter type, with your prices and regulatory details.'),
    ('pin', 'Local SEO', 'Location and matter pages, Google Business Profile and reviews for the towns you cover.'),
    ('link', 'Email to businesses', 'Outreach to company inboxes for debt recovery, trademarks and licensing, with an opt out on every email.'),
    ('chart', 'Tracking and reporting', 'Calls, forms and instructions tracked to the campaign, with a plain monthly report.'),
]

# Process steps (title, detail)
STEPS = [
    ('Tell us what you want to grow', 'A 30-minute call about the practice area, the locations, your capacity and what a good month looks like.'),
    ('We send a campaign plan', 'Channels, audiences, sample ads, a budget split and the compliance checks we will run. The fee is fixed in the plan.'),
    ('You approve the copy', 'Your compliance officer signs off every ad, landing page and email before anything goes live.'),
    ('We launch and manage it', 'We run the campaign day to day, test new ads and move budget to what is working.'),
    ('We report every month', 'Spend, enquiries, cost per enquiry and what we are changing next. You can pause or end it on notice.'),
]

# Compliance points (title, detail)
COMPLIANCE = [
    ('You stay the regulated firm', 'Your firm does the legal work and gives the advice. We provide marketing services only, so reserved legal activities, '
     'immigration advice and client care stay with you and your regulator.'),
    ('Publicity that meets the SRA Code', 'Ads and pages must be accurate and not misleading, including on price. The SRA holds firms responsible for marketing '
     'that third parties run for them, so you see and approve all of it and we keep a record of what ran.'),
    ('No unsolicited approaches', 'We never cold call, door knock or send unsolicited texts or emails to members of the public. People come to the campaign, '
     'not the other way round.'),
    ('Referral rules when we act for you', 'When we run a campaign on your behalf the SRA treats it as an introduction. Clients are told about the arrangement '
     'in writing and we never introduce clients facing criminal proceedings.'),
    ('A fee for marketing, not for referrals', 'You pay a fixed setup fee and a monthly management fee agreed up front. Ad spend is paid at cost, ideally straight '
     'from your own account. Our fee never goes up or down with the number of enquiries or instructions.'),
    ('Data handled properly', 'Under your brand we act as your processor under a written data processing agreement. On your behalf we tell each person who will '
     'receive their details before they submit, and sensitive matter details are never sent to ad platforms.'),
]

YES = ['Conveyancing and lease extensions', 'Family law, divorce and child arrangements', 'Immigration, through SRA, CILEx or IAA regulated firms',
       'Business to business debt recovery', 'Licensing for pubs, bars and venues', 'Trademarks and other intellectual property',
       'Other work by agreement, where no referral or claims rules stand in the way']
NO = ['Personal injury and clinical negligence', 'Claims that need FCA claims management authorisation', 'Housing disrepair and financial mis-selling claims',
      'Criminal defence and motoring offences', 'Collecting debts from consumers', 'Anything that relies on cold calling or unsolicited messages']

PRICING = [
    'Every campaign is quoted in writing before it starts. There is a one off setup fee for planning, copy, pages and tracking, then a fixed monthly fee for running it.',
    'Ad spend is separate and paid at cost. Under your brand it is billed by Google or Meta straight to your card. On your behalf we pass it on at cost with receipts.',
    'Our fee is for the marketing work and stays the same however many enquiries or instructions the campaign brings in. That keeps the arrangement clear of the rules on referral fees.',
]

FAQS = [
    ('Is it allowed for a marketing company to run campaigns for a law firm?',
     'Yes. Firms regulated by the SRA can use outside marketing suppliers. The firm stays responsible for its publicity, so it must check that ads are accurate, '
     'include clear pricing where needed and are not run through cold calls or unsolicited messages to the public. We build each campaign so you can do that.'),
    ('What is the difference between under your brand and on your behalf?',
     'Under your brand the ads and pages carry your firm’s name, you are the advertiser and we work as your marketing team. On your behalf the campaign runs '
     'as Leaflegal and each enquiry is introduced to your firm alone, so the SRA referral rules apply and clients are told about the arrangement in writing.'),
    ('Do you charge per lead for bespoke campaigns?',
     'No. Bespoke campaigns have a setup fee and a fixed monthly fee, plus ad spend at cost. The fee does not depend on how many enquiries or instructions you receive. '
     'If you would rather pay per lead, our standard <a href="/partners/pricing">exclusive leads</a> do that.'),
    ('Can you run campaigns for personal injury or claims work?',
     'No. Paying for personal injury and clinical negligence referrals is banned by the Legal Aid, Sentencing and Punishment of Offenders Act 2012, and generating '
     'leads for claims such as housing disrepair or mis-sold finance needs FCA claims management authorisation. We do not work in those areas.'),
    ('Will you give advice to potential clients?',
     'Never. Our ads, pages and intake questions explain what your firm does and gather the facts. All legal and immigration advice comes from your firm.'),
    ('Who owns the ad accounts and the data?',
     'Under your brand you own the ad accounts, landing pages, tracking and the enquiry data, and we work in them as your processor. On your behalf the enquiries '
     'are passed to you and you become responsible for them from that point.'),
    ('Which regulators do you work with?',
     'We work with firms regulated by the SRA, CILEx Regulation and the CLC, IPReg regulated trade mark attorneys and, for immigration, IAA regulated advisers.'),
    ('How long does a campaign run?',
     'Most campaigns run for at least three months so there is time to learn and improve. After that you can carry on monthly and end it with 30 days’ notice.'),
    ('Do you check the copy against the CAP Code?',
     'Yes. Every ad and page is checked against the CAP Code and the SRA Code before we send it to you for sign off, and we keep a copy of everything that ran.'),
]

# Form options
FORM_MODELS = ['Under our brand', 'On our behalf', 'Not sure yet']
FORM_AREAS = ['Conveyancing', 'Family law', 'Immigration', 'Debt recovery', 'Licensing', 'Lease extensions', 'Trademarks and IP', 'Something else']
FORM_BUDGETS = ['Under £2,000 a month', '£2,000 to £5,000 a month', '£5,000 to £10,000 a month', 'Over £10,000 a month', 'Not sure yet']
FORM_REGULATORS = ['SRA', 'CILEx Regulation', 'CLC', 'IPReg', 'IAA', 'Other']
