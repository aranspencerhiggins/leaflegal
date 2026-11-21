# Copy for the /loans/<slug> product pages. Edit text here, then rebuild the pages.
# Loanleaf is an introducer: never imply it lends, arranges, advises or approves. No rates, no guarantees.


def _help(what):
    return ('How can Loanleaf help?',
            f'Loanleaf is an introduction service, not a lender or broker, and we don’t give advice. You answer one short form '
            f'about your company and what you need, and we match you with a specialist finance broker who works with {what}. '
            f'It’s free to use and there’s no obligation to go ahead. The broker will explain any fees of their own.')


LOANS = [
    {
        'slug': 'unsecured-business-loans',
        'name': 'Unsecured business loans',
        'icon': 'growth',
        'purpose': 'Growth and expansion',
        'short': 'Borrow a fixed sum without putting up property or equipment as security, repaid in regular instalments.',
        'title': 'Unsecured Business Loans for UK Companies | Loanleaf',
        'desc': ('How unsecured business loans work for UK limited companies and LLPs. One short form matches you with a '
                 'specialist finance broker. Free, with no obligation.'),
        'h1': 'Unsecured business loans',
        'lead': 'A fixed sum for your company, repaid in regular instalments, without putting property or equipment up as security.',
        'intro': [
            'An unsecured business loan is a lump sum lent to your company that is not tied to a specific asset such as property or '
            'machinery. You agree the amount and the term at the start, then repay it in fixed monthly instalments, usually over anything '
            'from a few months to around five years. Because there is no asset behind the loan, lenders focus closely on your trading '
            'history, your accounts and how comfortably the business can afford the repayments.',
            'This type of finance often suits established limited companies and LLPs that want to invest in growth, such as hiring staff, '
            'launching a new product, taking on a bigger contract or upgrading their premises, without tying up property. It can also help '
            'with one-off costs where a quick decision matters. The amount available depends largely on revenue and affordability, and most '
            'lenders will ask the directors for a personal guarantee.',
        ],
        'uses': [
            ('Hiring and growth', 'Take on new staff, open a second site or expand into a new market while keeping your cash reserves in place for day-to-day running costs.'),
            ('Marketing and sales', 'Invest in a campaign, a new website or a sales push, spreading the cost over a fixed term rather than paying for it all upfront.'),
            ('Larger contracts', 'Cover the upfront cost of materials, staff or subcontractors when you win work that pays out later than you have to spend.'),
            ('Fit-out and refurbishment', 'Refresh a shop, office, restaurant or workshop without having to offer your premises or equipment as security for the loan.'),
        ],
        'how': [
            ('You share the basics', 'You tell a broker how much you want to borrow, what it is for and how your company is performing. They will usually ask for recent bank statements, filed accounts and sometimes management accounts.'),
            ('The broker approaches lenders', 'A specialist broker looks at which lenders are likely to suit your circumstances and presents your application. Lenders carry out their own checks, including credit searches on the business and usually on its directors.'),
            ('You review any offer', 'If a lender makes an offer, you will see the amount, the term, the total cost and any fees. You decide whether to accept. Once the agreement is signed, the money is usually paid into the business bank account.'),
        ],
        'eligibility': [
            'How long the company has been trading',
            'Annual revenue and recent turnover trends',
            'Business bank statements and filed accounts',
            'Credit history of the business and its directors',
            'Affordability of repayments against existing commitments',
        ],
        'considerations': [
            ('Cost', 'Unsecured loans can cost more than secured borrowing because the lender has no asset to fall back on. Compare the total amount repayable, not just the monthly figure, and check for arrangement fees or early repayment charges before you sign.'),
            ('Personal guarantees', 'Most lenders ask one or more directors to give a personal guarantee. This means the directors can be personally liable for the debt if the company cannot repay, so it is worth understanding exactly what you are signing.'),
            ('Affordability', 'Fixed monthly repayments are predictable, but they still need to be met in quieter months. Think about seasonal dips and other commitments, and borrow an amount the business can repay comfortably, not just the most a lender will offer.'),
        ],
        'faqs': [
            ('What is an unsecured business loan?', 'It is a loan to your company that is not secured against a specific asset such as property or equipment. You borrow a fixed amount and repay it, with interest, in regular instalments over an agreed term.'),
            ('How much can my company borrow?', 'It depends mainly on your revenue, profitability, trading history and how comfortably the business can afford the repayments. Lenders often use annual turnover as a starting point. Loanleaf handles enquiries from £5,000 upwards, and a broker can tell you what is realistic for your company.'),
            ('Will I need to give a personal guarantee?', 'In most cases, yes. Even though the loan is not secured on business assets, lenders usually ask directors to guarantee it personally. A broker can explain how any guarantee would work before you apply.'),
            ('How long does it take?', 'Timescales vary by lender and by how quickly you can provide documents. Some lenders can make a decision within days, while larger or more complex applications take longer. Having bank statements and accounts ready usually speeds things up.'),
            ('Can I repay the loan early?', 'Many lenders allow early repayment, but some charge a fee or require interest for a set period regardless. Check the early repayment terms in any offer before you accept, so you know what clearing the loan early would cost.'),
            _help('unsecured business loans'),
        ],
        'related': ['secured-business-loans', 'revolving-credit-facility', 'merchant-cash-advance'],
    },
    {
        'slug': 'secured-business-loans',
        'name': 'Secured business loans',
        'icon': 'shield',
        'purpose': 'Growth and expansion',
        'short': 'Borrow larger sums over longer terms by securing the loan against property or other business assets.',
        'title': 'Secured Business Loans for UK Companies | Loanleaf',
        'desc': ('How secured business loans work for UK limited companies and LLPs, from security to completion. Get matched '
                 'with a specialist finance broker.'),
        'h1': 'Secured business loans',
        'lead': 'Larger amounts and longer terms, with the loan secured against property or other assets.',
        'intro': [
            'A secured business loan is backed by an asset, most often property, though some lenders accept other valuable assets. Because '
            'the lender has security to fall back on, secured loans can open up larger amounts and longer terms than unsecured borrowing, '
            'and may come at a lower cost. The amount available usually depends on the value of the security and how much is already '
            'borrowed against it, as well as the company’s ability to repay.',
            'Secured finance often suits established companies planning a significant investment, such as an acquisition, a major expansion '
            'or bringing several existing debts into one. It can also help businesses whose trading figures alone would not support the '
            'amount they need. The trade-off is risk: if repayments are not made, the lender can take steps to recover its money from the '
            'asset, so it pays to borrow carefully and understand the terms.',
        ],
        'uses': [
            ('Major expansion', 'Pay for a significant step such as a new site, a larger workshop or entry into a new market, where the amount needed is beyond what unsecured lenders typically offer.'),
            ('Buying a business', 'Help finance the acquisition of a competitor, supplier or complementary business, often alongside your own contribution and other sources of finance.'),
            ('Consolidating debt', 'Replace several existing loans or facilities with a single secured loan, which can simplify repayments and in some cases reduce the overall monthly cost.'),
            ('Releasing equity', 'Raise money against property the business already owns, putting value that is tied up in bricks and mortar to work in the company.'),
        ],
        'how': [
            ('The security is assessed', 'The lender looks at the asset being offered, usually arranging a professional valuation for property. They check how much is already owed against it and how much they are prepared to lend as a proportion of its value.'),
            ('Your company is assessed', 'Alongside the security, lenders review accounts, bank statements, credit history and affordability. A broker helps present this information clearly and approaches lenders whose criteria suit your situation.'),
            ('Legal work and completion', 'Once an offer is accepted, solicitors complete the legal work, which may include registering a charge over the property or a debenture over company assets. The money is released when this is done, so allow time for it.'),
        ],
        'eligibility': [
            'Value and type of the security offered',
            'Existing borrowing secured on the asset',
            'Company accounts and trading history',
            'Credit history of the business and its directors',
            'Ability to afford repayments over the term',
        ],
        'considerations': [
            ('Risk to the asset', 'If the company cannot keep up repayments, the lender can take action against the security, which may include repossessing property. Only offer assets you are prepared to put at risk, and take independent advice if the security is your home.'),
            ('Upfront costs', 'Secured loans often involve valuation fees, legal fees for both sides and arrangement fees. These can add noticeably to the total cost, so ask for a full breakdown and factor it into your decision alongside the interest rate.'),
            ('Time to complete', 'Valuations and legal work mean secured loans usually take longer to arrange than unsecured ones. If you have a deadline, such as an auction or an acquisition date, tell the broker early so they can plan around it.'),
        ],
        'faqs': [
            ('What can be used as security?', 'Property is the most common form of security, including commercial premises and, in some cases, other property owned by the business or its directors. Some lenders also take a debenture, which gives them a charge over the company’s assets more generally.'),
            ('Can I get a secured loan if the property already has a mortgage?', 'Often, yes. Some lenders offer second charge loans that sit behind an existing mortgage. How much you can borrow depends on the property’s value and the amount already secured against it. Your existing lender may need to give consent.'),
            ('Are secured loans cheaper than unsecured loans?', 'They can be, because the security reduces the lender’s risk. However, valuation, legal and arrangement fees add to the cost, so for smaller amounts an unsecured loan may work out similar overall. Comparing the total cost is the clearest guide.'),
            ('How long does a secured loan take to arrange?', 'Usually longer than an unsecured loan, because of the valuation and legal work. A straightforward case may take a few weeks, while more complex cases can take longer. Providing documents promptly helps keep things moving.'),
            ('Will I still need a personal guarantee?', 'Possibly. Some lenders ask for a personal guarantee from the directors as well as security over the asset. A broker can explain what each lender is likely to require before you apply, so there are no surprises later.'),
            _help('secured business loans'),
        ],
        'related': ['unsecured-business-loans', 'commercial-mortgages', 'bridging-loans'],
    },
    {
        'slug': 'asset-finance',
        'name': 'Asset finance',
        'icon': 'equip',
        'purpose': 'Equipment or vehicles',
        'short': 'Spread the cost of vehicles, machinery and equipment, with the asset itself usually acting as security.',
        'title': 'Asset Finance for Equipment and Vehicles | Loanleaf',
        'desc': ('How asset finance, hire purchase and leasing work for UK limited companies and LLPs. Get matched with a '
                 'specialist finance broker through one short form.'),
        'h1': 'Asset finance for equipment and vehicles',
        'lead': 'Spread the cost of the equipment your business relies on, with the asset itself usually acting as security.',
        'intro': [
            'Asset finance helps a business acquire vehicles, machinery, technology and other equipment without paying the full price '
            'upfront. The main types are hire purchase, where you usually own the asset once the final payment is made, and leasing, where '
            'you pay to use the asset for an agreed period. Because the equipment itself usually acts as security, asset finance can be '
            'easier to arrange than other borrowing, particularly for assets that hold their value.',
            'It suits companies of almost any kind that rely on equipment to trade, from construction firms and hauliers to manufacturers, '
            'clinics and farms. Spreading the cost keeps cash available for running the business, and repayments can often be matched to '
            'the useful life of the asset. Asset refinance can also release cash from equipment you already own outright.',
        ],
        'uses': [
            ('Vehicles and fleets', 'Finance vans, cars, lorries, trailers or a whole fleet, with repayments spread over a term that reflects how long the vehicles are likely to be in service.'),
            ('Plant and machinery', 'Acquire diggers, production lines, CNC machines and other heavy equipment without tying up the cash you need for materials, wages and day-to-day costs.'),
            ('Technology and IT', 'Spread the cost of computers, servers, telephone systems or specialist hardware, which can make regular upgrades easier to plan for.'),
            ('Refinancing assets you own', 'Release cash from equipment the business already owns outright by refinancing it, then repay over an agreed term while continuing to use it.'),
        ],
        'how': [
            ('Choose the asset', 'You pick the equipment and the supplier, new or used. The broker gathers details of the asset, its cost and your company, then looks for lenders who finance that type of equipment.'),
            ('Agree the structure', 'You choose between options such as hire purchase or a lease, often with a deposit or an initial rental. The term is usually set to match how long the asset will be useful to the business.'),
            ('The lender pays the supplier', 'Once the agreement is signed, the lender typically pays the supplier directly and you take delivery of the asset. You then make regular payments for the rest of the agreed term.'),
        ],
        'eligibility': [
            'Type, age and expected life of the asset',
            'Whether the asset is new or used',
            'Company trading history and accounts',
            'Credit history of the business and its directors',
            'Size of any deposit or initial rental',
        ],
        'considerations': [
            ('Ownership', 'With hire purchase you usually own the asset after the final payment, sometimes after a small option-to-purchase fee. With a lease, the lender keeps ownership, and you may return, extend or upgrade at the end. Choose the structure that fits how you use the asset.'),
            ('Tax and VAT treatment', 'Hire purchase and leasing are treated differently for VAT and for tax relief. With hire purchase, VAT is usually paid upfront, while lease rentals normally have VAT added to each payment. Your accountant can explain which suits your company.'),
            ('Commitment and risk', 'Payments run for the full term even if you stop using the asset. If they are not made, the lender can recover the equipment, and some agreements also need a personal guarantee. Check the end-of-term terms and any balloon payment before you sign.'),
        ],
        'faqs': [
            ('What is the difference between hire purchase and leasing?', 'With hire purchase you pay for the asset in instalments and usually own it once the final payment is made. With leasing you pay to use the asset for a set period, and the lender keeps ownership. Each has different accounting, tax and VAT treatment.'),
            ('Can I finance used equipment?', 'Yes, many lenders finance used vehicles and machinery as well as new. They will look at the age, condition and expected remaining life of the asset, and some set limits on how old it can be at the end of the agreement.'),
            ('Do I need a deposit?', 'Often, though not always. Many agreements start with a deposit or an initial rental, and with hire purchase the VAT is usually paid upfront. The amount depends on the lender, the asset and your company’s circumstances.'),
            ('What is asset refinance?', 'Asset refinance lets a business raise cash against equipment it already owns. The lender buys or takes security over the asset, you receive a lump sum, and you repay over an agreed term while continuing to use the equipment.'),
            ('What happens at the end of the agreement?', 'With hire purchase, ownership usually passes to you after the final payment. With a lease, you may be able to return the asset, extend the lease or upgrade to new equipment. The options are set out in the agreement.'),
            _help('asset finance'),
        ],
        'related': ['unsecured-business-loans', 'secured-business-loans', 'revolving-credit-facility'],
    },
    {
        'slug': 'invoice-finance',
        'name': 'Invoice finance',
        'icon': 'cash',
        'purpose': 'Cash flow',
        'short': 'Release cash tied up in unpaid customer invoices instead of waiting 30, 60 or 90 days to be paid.',
        'title': 'Invoice Finance, Factoring and Discounting | Loanleaf',
        'desc': ('How invoice factoring and invoice discounting work for UK limited companies and LLPs. Get matched with a '
                 'specialist finance broker through one short form.'),
        'h1': 'Invoice finance',
        'lead': 'Turn unpaid invoices into working capital, so your cash flow keeps pace with the work you do.',
        'intro': [
            'Invoice finance lets a business borrow against the money its customers owe. When you raise an invoice, a provider advances a '
            'large share of its value, often up to around 80 to 90%, usually within a day or two. The rest, minus fees, is paid once your '
            'customer settles. As your sales grow, the amount available can grow with them, which makes it a flexible source of working '
            'capital.',
            'It suits businesses that sell to other businesses on credit terms, such as manufacturers, wholesalers, recruitment agencies, '
            'logistics firms and professional services companies. It is less suited to businesses that are paid upfront or mainly sell to '
            'consumers. The two main types are factoring, where the provider manages your sales ledger and collects payment, and invoice '
            'discounting, where you keep control of collections and customers are often unaware.',
        ],
        'uses': [
            ('Smoothing cash flow', 'Bridge the gap between delivering work and being paid, so wages, rent and supplier bills can be met on time even when customers take 60 days or more to pay.'),
            ('Taking on bigger orders', 'Accept larger orders or new customers with confidence, knowing that cash will come in soon after you invoice rather than weeks later.'),
            ('Paying suppliers sooner', 'Pay suppliers promptly, which can strengthen relationships and sometimes open up early settlement discounts that help to offset the cost of the facility.'),
            ('Supporting growth', 'Because the facility is linked to your sales ledger, the amount available can rise as turnover increases, rather than needing a new loan each time.'),
        ],
        'how': [
            ('The facility is set up', 'The provider reviews your sales ledger, your customers and their payment history, then agrees a facility limit and the percentage it will advance against each approved invoice. Set-up often takes a few weeks.'),
            ('You raise invoices', 'As you invoice customers, you send the details to the provider. It advances the agreed percentage, typically within a day or two, so cash reaches your account without waiting for payment terms to run.'),
            ('Customers pay', 'When customers pay, the provider releases the remaining balance to you, minus its fees. With factoring, the provider chases payment. With invoice discounting, your own team carries on managing collections.'),
        ],
        'eligibility': [
            'Selling to other businesses on credit terms',
            'Quality and spread of your customer base',
            'Customer payment history and debtor days',
            'Turnover and the value of your sales ledger',
            'Company trading history and accounts',
        ],
        'considerations': [
            ('Fees and charges', 'Providers usually charge a service fee, often based on turnover, plus a discount charge on money advanced. There may also be set-up, audit or minimum fees. Compare the full cost at your expected turnover, not just the headline rate.'),
            ('Contract terms', 'Many facilities have a minimum term and a notice period, and leaving early can involve termination fees. Check how long you are committed for, what notice is needed and whether the facility covers all your invoices or selected ones.'),
            ('Bad debt and guarantees', 'Most facilities are recourse, which means you carry the loss if a customer does not pay. Bad debt protection may be available at extra cost. Directors may also be asked for a personal guarantee or an indemnity, so read these terms carefully.'),
        ],
        'faqs': [
            ('What is the difference between factoring and invoice discounting?', 'With factoring, the provider manages your sales ledger and collects payments, so customers know it is involved. With invoice discounting, you keep control of credit control and collections, and the arrangement is often confidential. Discounting is usually offered to larger, more established businesses.'),
            ('How much of each invoice can I receive?', 'Providers usually advance a large share of each approved invoice, often up to around 80 to 90% of its value, though this varies. The rest is paid to you, minus fees, when your customer settles the invoice.'),
            ('Will my customers know?', 'With factoring they usually will, because the provider collects payment. With confidential invoice discounting, your customers deal with you as normal and may not be aware a facility is in place. Which option is available depends on your business.'),
            ('Can I finance just some invoices?', 'Yes. Selective invoice finance, sometimes called spot factoring, lets you choose individual invoices or customers to finance rather than your whole sales ledger. It can suit occasional needs but may cost more per invoice.'),
            ('Is invoice finance a loan?', 'Not in the traditional sense. Rather than borrowing a fixed sum, you receive an advance against money your customers already owe. The amount available rises and falls with your invoices, and repayment comes mainly from customers paying.'),
            _help('invoice finance'),
        ],
        'related': ['revolving-credit-facility', 'merchant-cash-advance', 'unsecured-business-loans'],
    },
    {
        'slug': 'merchant-cash-advance',
        'name': 'Merchant cash advance',
        'icon': 'chart',
        'purpose': 'Cash flow',
        'short': 'An advance repaid as a share of your future card takings, so repayments rise and fall with your sales.',
        'title': 'Merchant Cash Advance for UK Businesses | Loanleaf',
        'desc': ('How a merchant cash advance works for UK limited companies and LLPs that take card payments. Get matched '
                 'with a specialist finance broker. Free to use.'),
        'h1': 'Merchant cash advance',
        'lead': 'An advance against your future card sales, repaid automatically as a share of what your customers spend.',
        'intro': [
            'A merchant cash advance gives your business a lump sum in exchange for a share of its future card takings. Instead of fixed '
            'monthly repayments, an agreed percentage of each card sale goes towards repaying the advance until the total is cleared. When '
            'sales are strong you repay faster, and in quieter periods you repay less. The cost is usually a fixed fee agreed at the start '
            'rather than interest charged over time.',
            'It suits businesses that take a steady volume of card payments, such as restaurants, cafés, pubs, hotels, retailers, salons and '
            'other customer-facing businesses. Providers look mainly at your card transaction history, so it can be an option for companies '
            'with seasonal trade or few assets. Some providers offer a similar product based on overall revenue, often called revenue-based '
            'finance, for businesses that take payments online.',
        ],
        'uses': [
            ('Seasonal preparation', 'Stock up, take on staff or market your business ahead of a busy period, with repayments that follow the pattern of your takings.'),
            ('Refurbishment', 'Refresh a restaurant, bar, shop or salon, spreading the cost through future card sales rather than taking cash out of the business all at once.'),
            ('Equipment and repairs', 'Replace a broken oven, coffee machine or till system quickly, so the business can keep trading without a long wait for finance.'),
            ('Smoothing cash flow', 'Cover rent, supplier bills or other costs during quieter months, without a fixed repayment that stays the same when sales dip.'),
        ],
        'how': [
            ('Card sales are reviewed', 'The provider looks at your card terminal statements, usually covering several recent months, to understand your average takings. This largely determines how much it is prepared to advance and on what terms.'),
            ('You agree the terms', 'You agree the advance, the total amount repayable and the percentage of each card sale that will go towards it. The total is fixed at the start, so you know exactly what you will repay.'),
            ('Repayments follow your sales', 'Once the advance is paid, the agreed percentage is taken from card transactions, either through your card terminal provider or by regular collections. This continues until the full agreed amount has been repaid.'),
        ],
        'eligibility': [
            'Monthly card takings and how consistent they are',
            'How long the business has taken card payments',
            'Your card terminal provider',
            'Type of business and sector',
            'Credit history of the business and its directors',
        ],
        'considerations': [
            ('Cost', 'Because the cost is a fixed fee rather than an annual interest rate, it can be hard to compare with a loan. If sales are strong and you repay quickly, the effective cost can be high. Ask for the total repayable and compare it with other options.'),
            ('Regulation and contracts', 'Merchant cash advances for companies are generally not regulated by the FCA, so protections that apply to some other credit may not apply. Read the agreement carefully, including what happens if takings fall or you change card terminal provider.'),
            ('Ongoing share of takings', 'A share of every card sale goes to the provider until the advance is repaid, which reduces the cash coming into the business. Make sure the remaining takings will still cover your running costs comfortably. Some providers also ask for a personal guarantee.'),
        ],
        'faqs': [
            ('How is a merchant cash advance repaid?', 'Through an agreed percentage of your future card takings. Each time a customer pays by card, part of that payment goes towards the advance until the total agreed amount has been repaid. There are usually no fixed monthly instalments.'),
            ('How much can I get?', 'The amount is usually linked to your average monthly card takings. Providers review recent card terminal statements and decide what they are comfortable advancing. A broker can tell you what is likely based on your figures.'),
            ('How does the cost work?', 'Rather than interest, you usually pay a fixed fee agreed upfront, added to the amount advanced. The total you repay does not change if it takes longer than expected, but repaying quickly can make the effective cost higher than it first appears.'),
            ('Do I need to change my card terminal?', 'Not always. Some providers work with a range of card terminal providers, while others need you to use a specific terminal or account. A broker can explain the options and which providers work with your current set-up.'),
            ('What if my sales drop?', 'Because repayments are a percentage of card takings, you repay less when sales fall. The advance takes longer to clear, but the total amount repayable usually stays the same. Check the agreement for any minimum payment terms.'),
            _help('merchant cash advances'),
        ],
        'related': ['revolving-credit-facility', 'unsecured-business-loans', 'invoice-finance'],
    },
    {
        'slug': 'revolving-credit-facility',
        'name': 'Revolving credit facility',
        'icon': 'refi',
        'purpose': 'Cash flow',
        'short': 'A credit limit you can draw on, repay and use again, paying interest only on what you use.',
        'title': 'Revolving Credit Facility for UK Businesses | Loanleaf',
        'desc': ('How a revolving credit facility works for UK limited companies and LLPs. Get matched with a specialist finance '
                 'broker through one short form.'),
        'h1': 'Revolving credit facility',
        'lead': 'A credit limit your company can draw on when it needs to, repay and use again, paying interest only on what you use.',
        'intro': [
            'A revolving credit facility gives your business access to an agreed credit limit that you can draw on as and when you need it. '
            'You might take out part of the limit to cover a gap in cash flow, repay it when customers pay, then draw again later. Interest '
            'is charged on the amount you have drawn rather than the full limit, which can make it a cost-effective safety net for uneven '
            'cash flow.',
            'It suits established companies with variable or seasonal costs, such as businesses that buy stock ahead of busy periods, wait '
            'on large customer payments or want a buffer for unexpected expenses. It works a little like a business overdraft, but is often '
            'offered by specialist lenders as a separate facility. Facilities are usually reviewed and renewed periodically, often once a '
            'year.',
        ],
        'uses': [
            ('Covering cash flow gaps', 'Draw on the facility while waiting for customers to pay, then repay when the money comes in, without applying for a new loan each time.'),
            ('Seasonal stock', 'Buy stock or materials ahead of a busy season and repay as sales come in, so you only pay interest for the weeks the money is used.'),
            ('Unexpected costs', 'Keep a facility in place for urgent repairs, a sudden opportunity or a delayed payment, giving the business room to act quickly.'),
            ('Supplier discounts', 'Use the facility to pay suppliers early or buy in bulk where that earns a discount, then repay over the following weeks or months.'),
        ],
        'how': [
            ('A limit is agreed', 'The lender reviews your trading history, accounts and bank statements, then agrees a credit limit. You may pay an arrangement fee when the facility is set up, and some lenders charge a fee for keeping it available.'),
            ('You draw when needed', 'You draw some or all of the limit whenever the business needs it, usually through an online account. Interest is charged on the amount drawn, for as long as it is outstanding.'),
            ('Repay and reuse', 'As you repay, that amount becomes available to draw again. Some facilities need a minimum repayment each month. The facility usually runs for a set period and is reviewed before it is renewed.'),
        ],
        'eligibility': [
            'Trading history and annual revenue',
            'Cash flow patterns shown in bank statements',
            'Company accounts and profitability',
            'Credit history of the business and its directors',
            'Existing borrowing and commitments',
        ],
        'considerations': [
            ('Fees as well as interest', 'Alongside interest on what you draw, there may be an arrangement fee, a renewal fee or a charge on the unused part of the limit. Add these up to understand the true cost of keeping the facility in place, especially if you rarely use it.'),
            ('Discipline', 'Because money can be drawn and redrawn, a revolving facility can drift into permanent borrowing. It works best for short-term needs that you repay regularly. If you are always at your limit, a term loan may be a better fit.'),
            ('Reviews and guarantees', 'Lenders can review, reduce or withdraw a facility, usually at renewal, if your circumstances change. Many also ask directors for a personal guarantee. Understand the review terms and what would happen to any balance if the facility ended.'),
        ],
        'faqs': [
            ('How is a revolving credit facility different from a loan?', 'A term loan gives you a fixed sum that you repay over a set period. A revolving facility gives you a limit you can draw on, repay and use again, and you pay interest only on the amount you have drawn.'),
            ('Is it the same as an overdraft?', 'It works in a similar way, but it is usually a separate facility rather than part of your current account, and it is often provided by a specialist lender. Limits, fees and repayment terms vary from one provider to another.'),
            ('How much does it cost?', 'You pay interest on the amount you draw, for as long as it is outstanding. There may also be an arrangement fee, a renewal fee or a charge for keeping the limit available. A broker can explain the full costs of any facility.'),
            ('How long does a facility last?', 'Many facilities run for around 12 months and are then reviewed and renewed, though terms vary. At review, the lender may keep, increase or reduce the limit depending on how the business is performing.'),
            ('Do I have to use the whole limit?', 'No. You can draw as much or as little of the limit as you need, when you need it. Interest is only charged on what you have drawn, although some lenders charge a small fee for the unused part.'),
            _help('revolving credit facilities'),
        ],
        'related': ['invoice-finance', 'unsecured-business-loans', 'merchant-cash-advance'],
    },
    {
        'slug': 'commercial-mortgages',
        'name': 'Commercial mortgages',
        'icon': 'property',
        'purpose': 'Commercial property',
        'short': 'Long-term finance to buy, refinance or release equity from business premises or investment property.',
        'title': 'Commercial Mortgages for UK Companies | Loanleaf',
        'desc': ('How commercial mortgages work for UK limited companies and LLPs buying or refinancing property. Get matched '
                 'with a specialist finance broker.'),
        'h1': 'Commercial mortgages',
        'lead': 'Long-term finance for buying, refinancing or releasing money from business premises and commercial property.',
        'intro': [
            'A commercial mortgage is a long-term loan secured on business property, such as offices, shops, warehouses, workshops, pubs, '
            'hotels or care homes. It works in a similar way to a home mortgage: the lender lends a proportion of the property’s value, you '
            'put in a deposit, and you repay over an agreed term that can run for many years. Rates can be fixed or variable, and the '
            'property is the main security.',
            'There are two broad types. Owner-occupier mortgages are for companies buying premises they will trade from, where lenders focus '
            'on the strength of the business. Commercial investment mortgages are for property let to tenants, where rental income matters '
            'most. Both can suit companies that would rather own than rent, want to refinance an existing mortgage, or wish to release '
            'equity from property they already own.',
        ],
        'uses': [
            ('Buying your premises', 'Move from renting to owning the property your business trades from, building equity over time and gaining more control over how the premises are used.'),
            ('Commercial investment', 'Buy shops, offices or industrial units let to tenants, with the rental income playing a central part in how much a lender will offer.'),
            ('Refinancing', 'Move an existing commercial mortgage to a new lender when a fixed rate ends or your needs change, potentially on terms that suit the business better.'),
            ('Releasing equity', 'Raise money against commercial property the company already owns, to reinvest in the business, buy further property or consolidate other borrowing.'),
        ],
        'how': [
            ('Your plans are reviewed', 'A broker looks at the property, how it will be used, the deposit available and your company’s finances. For investment property, they will also look at the tenancies and the rental income.'),
            ('Valuation and offer', 'The lender instructs a valuation of the property and assesses the application. If it is approved, you receive an offer setting out the amount, the term, the rate and any conditions attached.'),
            ('Legal work and completion', 'Solicitors handle the legal work, including searches and registering the lender’s charge over the property. Once this is complete, the money is released and the purchase or refinance goes ahead.'),
        ],
        'eligibility': [
            'Property type, location and condition',
            'Deposit or equity available',
            'Company accounts and trading performance',
            'Rental income and tenancies, for investment property',
            'Credit history of the business and its directors',
        ],
        'considerations': [
            ('Deposit and loan to value', 'Lenders usually lend a proportion of the property’s value, so a significant deposit is normally needed, often more than for a residential mortgage. The amount depends on the property type, how it is used and the strength of your business.'),
            ('Total costs', 'Beyond interest, budget for valuation fees, legal fees for you and the lender, arrangement fees and, when buying, Stamp Duty Land Tax or its equivalent in Scotland and Wales. Some mortgages also have early repayment charges during a fixed period.'),
            ('Security and guarantees', 'The property is at risk if repayments are not kept up. Lenders may also ask directors for personal guarantees, especially for smaller or newer companies. Think about how repayments would be met if trading conditions or tenancies change.'),
        ],
        'faqs': [
            ('How much deposit do I need for a commercial mortgage?', 'It varies by lender, property and business, but commercial mortgages usually need a larger deposit than residential ones. A broker can tell you what lenders are likely to expect for your property and circumstances before you commit to anything.'),
            ('How long can a commercial mortgage last?', 'Terms vary widely. Some run for just a few years, while others can last for 20 years or more. The right term depends on the property, the amount and what suits your company’s cash flow and plans.'),
            ('What is the difference between owner-occupier and investment mortgages?', 'An owner-occupier mortgage is for property your business trades from, and lenders focus mainly on your company’s finances. An investment mortgage is for property let to tenants, where lenders look closely at the rental income and tenancy terms.'),
            ('Can a limited company or LLP take out a commercial mortgage?', 'Yes. Many commercial mortgages are taken out by limited companies, LLPs or special purpose vehicles set up to hold property. Lenders will usually look at the directors or members as well as the company itself.'),
            ('Can I refinance my current commercial mortgage?', 'Often, yes. Businesses refinance to secure a new rate, change the term, release equity or move away from a lender that no longer suits them. Check whether your current mortgage has early repayment charges first.'),
            _help('commercial mortgages'),
        ],
        'related': ['bridging-loans', 'secured-business-loans', 'unsecured-business-loans'],
    },
    {
        'slug': 'bridging-loans',
        'name': 'Bridging loans',
        'icon': 'clock',
        'purpose': 'Commercial property',
        'short': 'Short-term finance secured on property, bridging a gap until a sale, refinance or other money comes in.',
        'title': 'Bridging Loans for UK Businesses | Loanleaf',
        'desc': ('How bridging loans work for UK limited companies and LLPs, from auction purchases to refurbishment. Get '
                 'matched with a specialist finance broker.'),
        'h1': 'Bridging loans',
        'lead': 'Short-term finance secured on property, designed to bridge a gap until a sale, refinance or other money comes in.',
        'intro': [
            'A bridging loan is short-term finance secured on property, typically arranged for anything from a few weeks up to around 12 '
            'to 24 months. It is designed to cover a gap, for example buying a property before another sale completes, or securing a '
            'purchase quickly before longer-term finance is in place. Interest is often rolled up or retained rather than paid monthly, '
            'with the loan repaid in full at the end of the term.',
            'Bridging often suits companies that need to move quickly, such as buying at auction, where completion is usually required '
            'within a set number of days, or taking up a time-sensitive property opportunity. It is also used to buy property that is not '
            'yet mortgageable, such as premises needing refurbishment. The key to any bridging loan is a clear exit plan: how the loan will '
            'be repaid when the term ends.',
        ],
        'uses': [
            ('Auction purchases', 'Complete on a property bought at auction within the deadline, which is often too short for a standard commercial mortgage to be arranged.'),
            ('Chain breaks', 'Buy new premises before your current property has sold, so the business can move without waiting for a sale to complete.'),
            ('Refurbishment', 'Buy a property that needs work before a mainstream lender will accept it, then refinance onto a longer-term mortgage once the improvements are complete.'),
            ('Short-term opportunities', 'Act quickly on a time-sensitive purchase or business need while longer-term finance, a sale or other money is being arranged.'),
        ],
        'how': [
            ('The property and exit are reviewed', 'The lender looks at the property offered as security, its value and how the loan will be repaid at the end, usually through a sale or refinancing. A clear, realistic exit plan is central.'),
            ('Valuation and legal work', 'A valuation is carried out and solicitors handle the legal work. Bridging lenders can often move faster than mainstream lenders, especially when documents are ready and the case is straightforward.'),
            ('Repay at the end of the term', 'Interest is often rolled up or deducted at the start. At the end of the term, the loan and interest are repaid in full, usually from the sale of a property or a new longer-term loan.'),
        ],
        'eligibility': [
            'Value and type of the property offered as security',
            'A clear, realistic exit plan',
            'Loan size compared with the property’s value',
            'Experience with similar projects, for refurbishments',
            'Credit history of the business and its directors',
        ],
        'considerations': [
            ('Higher cost', 'Bridging is designed for short periods and usually costs more than longer-term borrowing. Interest is often charged monthly, and there may be arrangement, valuation, legal and exit fees. It is rarely suitable for long-term needs.'),
            ('Exit risk', 'If the sale or refinance you are relying on is delayed or falls through, you may need to extend the loan, which adds cost, or the lender may take action against the property. Build in time and a backup plan where you can.'),
            ('Security and guarantees', 'Bridging loans are secured on property, which is at risk if the loan is not repaid. Lenders often ask for personal guarantees from directors as well. Make sure you understand what happens if the loan runs past its end date.'),
        ],
        'faqs': [
            ('How long does a bridging loan last?', 'Bridging loans are short-term, usually running from a few weeks up to around 12 to 24 months. The term is set around your exit plan, such as the expected date of a sale or a refinance onto longer-term finance.'),
            ('What is an exit strategy?', 'It is how you will repay the loan at the end of the term. Common exits are selling a property or refinancing onto a commercial mortgage. Lenders want to see that the exit is realistic before they lend.'),
            ('How quickly can a bridging loan be arranged?', 'Bridging lenders can often move faster than mainstream lenders, but timescales depend on the valuation, the legal work and how quickly documents are provided. Telling the broker about any deadline, such as an auction completion date, helps.'),
            ('How is interest paid?', 'Interest is usually calculated monthly. It may be paid each month, added to the loan and repaid at the end, or deducted from the loan at the start. Each approach affects how much you receive and how much you repay.'),
            ('What is the difference between open and closed bridging?', 'A closed bridging loan has a fixed repayment date, usually because the exit, such as a sale, is already agreed. An open bridging loan has no fixed date, but must still be repaid within a maximum term.'),
            _help('bridging loans'),
        ],
        'related': ['commercial-mortgages', 'secured-business-loans', 'unsecured-business-loans'],
    },
    {
        'slug': 'vat-and-tax-loans',
        'name': 'VAT and tax loans',
        'icon': 'tax',
        'purpose': 'Tax or VAT bill',
        'short': 'Spread the cost of a VAT, corporation tax or PAYE bill over a few months instead of paying all at once.',
        'title': 'VAT and Tax Loans for UK Companies | Loanleaf',
        'desc': ('How VAT and tax loans help UK limited companies and LLPs spread a VAT, corporation tax or PAYE bill. Get '
                 'matched with a specialist finance broker.'),
        'h1': 'VAT and tax loans',
        'lead': 'Spread the cost of a large VAT, corporation tax or PAYE bill over a few months, so your cash flow stays steady.',
        'intro': [
            'A VAT or tax loan is a short-term business loan used to pay a tax bill on time and spread the cost over a set period, typically '
            'a few months up to around a year. The lender may pay HMRC directly or pay the money to your business to settle the bill. '
            'Repayments are usually fixed and monthly, which makes the cost easier to plan for than one large payment.',
            'This type of finance often suits profitable companies whose tax bill falls at an awkward time, such as after a strong year, a '
            'large contract or a seasonal peak, when cash has already been committed elsewhere. Paying on time avoids HMRC interest and '
            'penalties for late payment. It is worth comparing a tax loan with HMRC’s own Time to Pay arrangements, which may also be '
            'available.',
        ],
        'uses': [
            ('VAT bills', 'Pay a quarterly or annual VAT return in full and on time, then spread the cost, which can help after a quarter with unusually high sales.'),
            ('Corporation tax', 'Settle a corporation tax bill after a profitable year without draining the cash reserves you need for wages, stock and day-to-day running costs.'),
            ('PAYE and National Insurance', 'Cover a PAYE and National Insurance bill, for example after paying bonuses or taking on staff, without delaying other payments the business relies on.'),
            ('Protecting cash reserves', 'Keep cash in the business for planned investment or a quieter period, rather than using it all at once to meet a single tax deadline.'),
        ],
        'how': [
            ('Share the bill details', 'You tell the broker what the bill is for, how much it is and when it is due. They will usually ask for recent accounts, bank statements and a copy of the HMRC demand or return.'),
            ('Find a suitable lender', 'The broker approaches lenders who offer short-term tax and VAT loans. Because tax deadlines are fixed, it helps to start early, giving lenders time to make their checks before the bill is due.'),
            ('Pay HMRC and repay monthly', 'If you accept an offer, the lender pays HMRC directly or pays your business so you can settle the bill. You then repay the loan in fixed monthly instalments over the agreed term.'),
        ],
        'eligibility': [
            'The type, amount and due date of the tax bill',
            'Company trading history and recent accounts',
            'Profitability and cash flow shown in bank statements',
            'Credit history of the business and its directors',
            'Any existing arrears or arrangements with HMRC',
        ],
        'considerations': [
            ('Cost compared with Time to Pay', 'A tax loan has interest and possibly fees. HMRC may agree a Time to Pay arrangement, which also lets you spread a bill, though HMRC still charges interest on the amount outstanding. Compare both before you decide.'),
            ('Timing', 'Lenders need time to assess an application, so leave enough time before the deadline. If you already have arrears with HMRC, fewer lenders may be able to help and the options can be more limited.'),
            ('Guarantees and planning', 'Directors are often asked for a personal guarantee. A tax loan helps with one bill, but if tax bills regularly cause pressure, it may be worth reviewing with your accountant how the business sets money aside for them.'),
        ],
        'faqs': [
            ('What can a tax loan be used for?', 'It is typically used to pay VAT, corporation tax or PAYE and National Insurance bills. Some lenders also help with other HMRC liabilities. The aim is to settle the bill on time and spread the cost over a set period.'),
            ('Does the lender pay HMRC directly?', 'Some do. Others pay the money to your business so you can make the payment yourself. Either way, the loan is repaid to the lender in agreed instalments, usually monthly, over the term you agreed at the start.'),
            ('How long can I spread the cost?', 'VAT and tax loans are usually short-term, typically running from a few months up to around 12 months, so repayments can be planned around the next tax period. Some lenders offer longer terms.'),
            ('Is a tax loan better than HMRC Time to Pay?', 'It depends on your circumstances. Time to Pay is agreed directly with HMRC and interest is charged on the amount outstanding. A tax loan means HMRC is paid in full on time, but has its own interest and fees. Comparing both is sensible.'),
            ('Can I get a tax loan if I am already behind with HMRC?', 'It can be harder, because some lenders only help businesses whose tax affairs are up to date. Others may consider it depending on the amount and circumstances. A broker can tell you which options are realistic.'),
            _help('VAT and tax loans'),
        ],
        'related': ['unsecured-business-loans', 'revolving-credit-facility', 'merchant-cash-advance'],
    },
]
