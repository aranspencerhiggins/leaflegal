# Copy for the /needs/<slug> business-need pages. Edit text here, then rebuild the pages.
# Loanleaf is an introducer: never imply it lends, arranges, advises or approves. No rates, no guarantees.
# 'loans' entries are slugs from loans_content.LOANS, most suitable first.


def _help(what):
    return ('How can Loanleaf help?',
            f'Loanleaf is an introduction service, not a lender or broker, and we don’t give advice. You answer one short form '
            f'about your company and what you need, and we match you with a specialist finance broker who works with {what}. '
            f'It’s free to use and there’s no obligation to go ahead. The broker will explain any fees of their own.')


NEEDS = [
    {
        'slug': 'working-capital',
        'name': 'Working capital',
        'short': 'Keep wages, suppliers and running costs covered between payments.',
        'icon': 'cash',
        'purpose': 'Cash flow',
        'title': 'Working Capital Finance for UK Businesses | Loanleaf',
        'desc': ('How UK limited companies and LLPs finance working capital, from invoice finance to revolving credit. '
                 'One short form matches you with a specialist broker.'),
        'h1': 'Finance for working capital',
        'lead': 'Keep the business running smoothly when money going out arrives before money coming in.',
        'intro': [
            'Working capital is the money a business uses to cover its day-to-day costs: wages, rent, supplier bills and '
            'everything else that keeps the doors open. Most companies have gaps between paying out and being paid, '
            'whether that is a customer on 60-day terms, a slow month or a large order that needs materials up front. '
            'When those gaps get wider, even a profitable business can feel short of cash.',
            'Businesses usually finance working capital with facilities that move with their trading rather than a single '
            'large loan. Invoice finance releases money tied up in unpaid invoices, a revolving credit facility gives a '
            'limit to draw on and repay, and a merchant cash advance is repaid from card takings. A short-term unsecured '
            'loan can also help with a one-off squeeze. Which suits depends on how your customers pay you.',
        ],
        'uses': [
            ('Waiting on customer payments', 'Cover wages and supplier bills while invoices sit unpaid on 30, 60 or 90-day terms, so the gap does not fall on the business.'),
            ('Seasonal dips', 'Keep up with fixed costs through a quieter season, such as winter for a garden centre or January for a restaurant, until trade picks up again.'),
            ('Taking on a large order', 'Pay for materials, staff time or subcontractors on a big contract that will only pay out once the work is delivered.'),
            ('Supplier terms', 'Pay suppliers on time or early, which can protect the relationship and sometimes earn a discount for prompt settlement.'),
        ],
        'loans': ['invoice-finance', 'revolving-credit-facility', 'merchant-cash-advance', 'unsecured-business-loans'],
        'considerations': [
            ('Match the finance to the gap', 'Working capital needs tend to come and go, so a flexible facility often fits better than a fixed loan. Think about whether the shortfall is a one-off or a pattern that repeats through the year.'),
            ('Total cost', 'Facilities can carry service fees, arrangement fees or charges on unused limits as well as interest. Add these up at the level you expect to use, rather than comparing headline figures alone.'),
            ('The underlying cause', 'Finance can smooth timing gaps, but it will not fix prices that are too low or customers who never pay. If cash is always tight, it may be worth reviewing credit terms and margins with your accountant.'),
        ],
        'faqs': [
            ('What is working capital finance?', 'It is any finance used to cover a business’s day-to-day running costs rather than a specific purchase. Common options include invoice finance, revolving credit facilities, merchant cash advances and short-term business loans. The aim is to keep cash flowing while you wait for money to come in.'),
            ('Which type of finance suits working capital best?', 'It depends on how your business is paid. Companies that invoice other businesses often look at invoice finance. Businesses that take card payments may consider a merchant cash advance. A revolving credit facility can suit uneven needs. A broker can explain how each would fit your trading pattern.'),
            ('How much can my company borrow for working capital?', 'Lenders usually look at turnover, the value of unpaid invoices or card takings, your bank statements and your existing commitments. Loanleaf handles enquiries from £5,000 upwards, and a broker can tell you what is realistic for your company after looking at its figures.'),
            ('Is working capital finance only for businesses in difficulty?', 'No. Many healthy, growing companies use it because growth itself ties up cash. Taking on more customers often means paying for stock, staff and materials before the money from those customers arrives. Lenders will still look closely at how the business is performing.'),
            ('How quickly can working capital finance be arranged?', 'Some facilities, such as merchant cash advances or short-term loans, can be arranged fairly quickly once documents are in. Invoice finance usually takes longer to set up because the provider reviews your sales ledger. Having recent bank statements and accounts ready helps either way.'),
            _help('working capital finance'),
        ],
        'img': 'stock-need-working-capital',
    },
    {
        'slug': 'business-expansion',
        'name': 'Business expansion',
        'short': 'Open a new site, enter a new market or take on bigger contracts.',
        'icon': 'growth',
        'purpose': 'Growth and expansion',
        'title': 'Business Expansion Finance for UK Companies | Loanleaf',
        'desc': ('How UK limited companies and LLPs finance expansion, from a second site to a new market. Get matched with '
                 'a specialist finance broker. Free, no obligation.'),
        'h1': 'Finance for business expansion',
        'lead': 'Take the next step, whether that is a second site, a new market or a bigger team, without draining cash reserves.',
        'intro': [
            'Expansion usually means spending money before the extra revenue arrives. Opening a second shop, moving into '
            'larger premises, launching a new product line or taking on a contract that needs more people all carry costs '
            'that come well ahead of the return. Paying for that entirely from cash can leave the business short for its '
            'everyday running costs at exactly the moment it is busiest.',
            'Companies often finance expansion with a business loan repaid over a fixed term that reflects how long the '
            'investment takes to pay back. Smaller or shorter projects may suit an unsecured loan, while larger plans can '
            'involve secured borrowing or a commercial mortgage if property is part of it. Equipment needed for the '
            'expansion is often financed separately through asset finance, which keeps the main loan smaller.',
        ],
        'uses': [
            ('Opening a second site', 'Cover the deposit, fit-out, stock and early running costs of a new shop, café, clinic or branch while it builds up its own customers.'),
            ('Entering a new market', 'Pay for the marketing, staff and set-up costs of selling into a new region or sector before the first orders arrive.'),
            ('Moving to larger premises', 'Spread the cost of relocating to a bigger unit, including the move itself, the fit-out and any overlap in rent.'),
            ('Winning bigger contracts', 'Take on the people, materials and systems a larger contract needs, so the business can deliver it without stretching day-to-day cash.'),
        ],
        'loans': ['unsecured-business-loans', 'secured-business-loans', 'commercial-mortgages', 'asset-finance'],
        'considerations': [
            ('A realistic plan', 'Lenders want to see how the expansion will pay for itself. A simple forecast showing when extra revenue is expected, and what happens if it comes later than planned, makes the conversation with a broker much easier.'),
            ('Borrow for the right term', 'Matching the repayment term to how long the investment takes to pay back keeps monthly costs manageable. A short loan for a slow-burn project can put pressure on cash flow in the first year.'),
            ('Security and guarantees', 'Larger amounts may need security over property or other assets, and directors are often asked for a personal guarantee. Understand what you are putting at risk before you commit.'),
        ],
        'faqs': [
            ('What kind of finance is used for business expansion?', 'Many companies use a term business loan, either unsecured or secured, repaid over a period that matches the investment. Where property is involved, a commercial mortgage may be part of the picture. Equipment and vehicles are often financed separately with asset finance.'),
            ('How much can I borrow to expand my business?', 'Lenders look mainly at turnover, profitability, trading history and how comfortably the business can afford repayments, along with any security offered. Loanleaf handles enquiries from £5,000 to £2m and above, and a broker can tell you what is realistic for your plans.'),
            ('Do I need a business plan?', 'For smaller amounts, recent accounts and bank statements may be enough. For larger expansion projects, lenders usually want to see a short plan or forecast showing what the money is for and how the business expects to repay it. A broker can tell you what each lender will ask for.'),
            ('Can a newer company borrow to expand?', 'Loanleaf works with companies that have been trading for at least six months with annual revenue of £50,000 or more. Newer businesses may find fewer lenders available and smaller amounts on offer, but options can exist. A broker can explain what is realistic.'),
            ('Should I use cash or finance for expansion?', 'That is a decision for you and your accountant. Some businesses prefer to keep a cash buffer for running costs and spread the cost of growth, while others would rather avoid borrowing. Comparing the total cost of finance with the risk of running low on cash can help.'),
            _help('expansion finance'),
        ],
        'img': 'stock-need-business-expansion',
    },
    {
        'slug': 'buying-equipment',
        'name': 'Buying equipment',
        'short': 'Spread the cost of machinery, tools and technology you rely on.',
        'icon': 'equip',
        'purpose': 'Equipment or vehicles',
        'title': 'Finance for Buying Business Equipment | Loanleaf',
        'desc': ('How UK limited companies and LLPs finance machinery, tools and technology without paying the full price '
                 'upfront. Get matched with a specialist finance broker.'),
        'h1': 'Finance for buying equipment',
        'lead': 'Get the machinery, tools or technology your business needs and spread the cost over its working life.',
        'intro': [
            'Most businesses rely on equipment to trade, whether that is a vehicle lift in a garage, an oven in a bakery, a '
            'CNC machine in a workshop or the computers in an office. Buying it outright can tie up a large amount of cash '
            'in one go, and replacing something that has broken down often cannot wait. Spreading the cost lets the '
            'equipment start earning while it is being paid for.',
            'Asset finance is the most common route, through hire purchase, where you usually own the equipment at the end, '
            'or leasing, where you pay to use it. Because the equipment itself usually acts as security, it can be easier '
            'to arrange than other borrowing. Some businesses use an unsecured loan instead, especially for smaller or '
            'mixed purchases, and asset refinance can release cash from equipment already owned.',
        ],
        'uses': [
            ('Replacing worn-out machinery', 'Swap an ageing machine that keeps breaking down for a newer one, cutting repair bills and lost working time without a large upfront payment.'),
            ('Adding capacity', 'Buy a second production line, a larger oven or an extra ramp so the business can take on more work with the team it already has.'),
            ('Technology and IT', 'Spread the cost of computers, tills, phone systems or specialist software and hardware, and plan for the next upgrade.'),
            ('Used equipment', 'Finance good-quality second-hand machinery, which can lower the overall cost while still spreading payments over an agreed term.'),
        ],
        'loans': ['asset-finance', 'unsecured-business-loans', 'secured-business-loans'],
        'considerations': [
            ('Own or lease', 'Hire purchase usually leaves you owning the equipment, while a lease lets you use it and hand it back or upgrade. Think about how long you will need the equipment and whether it will hold its value.'),
            ('Tax and VAT', 'Hire purchase and leasing are treated differently for VAT and tax relief. Your accountant can explain which structure suits your company before you commit to an agreement.'),
            ('Term and condition', 'Match the term to the useful life of the equipment so you are not still paying for something that has stopped working. For used equipment, lenders will look at age and condition.'),
        ],
        'faqs': [
            ('What is the most common way to finance equipment?', 'Asset finance, which includes hire purchase and leasing, is the most common route. The equipment usually acts as security, and payments are spread over an agreed term. Some businesses also use unsecured loans, particularly for smaller or mixed purchases. A broker can explain which structure fits the equipment you have in mind.'),
            ('Can I finance second-hand equipment?', 'Yes, many lenders finance used machinery and tools as well as new. They will look at the age, condition and expected remaining life of the equipment, and some set limits on how old it can be by the end of the agreement.'),
            ('Do I need a deposit?', 'Often, though not always, and some lenders will consider agreements with no deposit for established companies. Many agreements start with a deposit or an initial rental, and with hire purchase the VAT is usually paid upfront. The amount depends on the lender, the equipment and your company’s circumstances.'),
            ('Can I raise money against equipment I already own?', 'Often, yes. Asset refinance lets a business release cash from equipment it owns outright, then repay over an agreed term while continuing to use it. The amount depends on the value, age and type of equipment, and on how the business is performing.'),
            ('What happens if the equipment breaks down?', 'Payments usually continue regardless, so maintenance and insurance are your responsibility unless the agreement says otherwise. Some leases include servicing. Check the terms carefully, and consider warranty or breakdown cover for machinery the business cannot work without, so a fault does not leave you paying for something you cannot use.'),
            _help('equipment finance'),
        ],
        'img': 'stock-need-buying-equipment',
    },
    {
        'slug': 'buying-vehicles',
        'name': 'Buying vehicles',
        'short': 'Finance vans, cars, lorries or a whole fleet for the business.',
        'icon': 'car',
        'purpose': 'Equipment or vehicles',
        'title': 'Finance for Business Vans, Cars and Fleets | Loanleaf',
        'desc': ('How UK limited companies and LLPs finance vans, cars, lorries and fleets through hire purchase, leasing '
                 'and loans. Get matched with a specialist broker.'),
        'h1': 'Finance for buying vehicles',
        'lead': 'Put the vans, cars or lorries your business needs on the road and spread the cost over their working life.',
        'intro': [
            'For many businesses, vehicles are how the work gets done. A builder needs a van for tools and materials, a '
            'courier needs reliable transport every day, and a growing haulage firm may need another lorry to take on a new '
            'route. Vehicles lose value as they age, so tying up a large sum of cash in them can be harder to justify than '
            'spreading the cost while they earn their keep.',
            'Most business vehicles are financed through asset finance. Hire purchase spreads the cost and usually leaves '
            'the business owning the vehicle at the end, while contract hire and other leases let you use the vehicle for '
            'a set period and hand it back. Because the vehicle acts as security, these agreements can be easier to arrange '
            'than other borrowing. An unsecured loan is sometimes used for older vehicles or mixed purchases.',
        ],
        'uses': [
            ('Vans for trades', 'Buy or replace the van a plumber, electrician, builder or landscaper relies on, with payments spread over a term that suits the business.'),
            ('Adding to a fleet', 'Take on extra vans or lorries to handle a new contract or route, without using up the cash needed for fuel, wages and maintenance.'),
            ('Specialist vehicles', 'Finance refrigerated vans, tippers, minibuses, tractors or vehicles with fitted equipment that are central to how the business trades.'),
            ('Replacing older vehicles', 'Swap vehicles that are costly to run or no longer meet low emission zone rules for newer, more efficient ones.'),
        ],
        'loans': ['asset-finance', 'unsecured-business-loans', 'secured-business-loans'],
        'considerations': [
            ('Own or hand back', 'Hire purchase usually leads to ownership, while contract hire or leasing means handing the vehicle back. If you change vehicles every few years, leasing may suit. If you run them into the ground, ownership may make more sense.'),
            ('Mileage and condition', 'Leases often have mileage limits and return conditions, with charges for going over or for damage beyond normal wear. Estimate your real mileage honestly before you sign.'),
            ('Running costs', 'Insurance, servicing, tyres and fuel or charging costs add to the monthly finance payment. Factor in the whole cost of keeping the vehicle on the road, not just the agreement itself.'),
        ],
        'faqs': [
            ('What is the difference between hire purchase and contract hire?', 'With hire purchase you pay for the vehicle in instalments and usually own it after the final payment. With contract hire you pay to use the vehicle for a set period and mileage, then hand it back. Each has different tax and VAT treatment.'),
            ('Can I finance a used van or car?', 'Yes, many lenders finance used vehicles as well as new ones. They will look at the age, mileage and value of the vehicle, and some set limits on how old it can be at the end of the agreement. Older vehicles may need a shorter term.'),
            ('Can I finance several vehicles at once?', 'Yes. Many businesses finance a number of vehicles together, and some lenders offer facilities for growing fleets. A broker can explain how a fleet arrangement would work for your company and what lenders are likely to ask for, such as details of each vehicle and how they will be used.'),
            ('Do I need a deposit for a business vehicle?', 'Often, though not always, and some lease agreements start with a few months of rentals paid in advance instead. Many agreements start with a deposit or an initial rental, and with hire purchase the VAT is usually paid upfront. The amount depends on the lender, the vehicle and your company’s circumstances.'),
            ('Can I finance electric vans or cars?', 'Yes, many lenders finance electric and hybrid vehicles in the same way as petrol or diesel ones. Some businesses also finance charging points alongside the vehicles. Your accountant can explain any tax treatment that applies, which can differ from petrol and diesel vehicles.'),
            _help('vehicle finance'),
        ],
        'img': 'stock-need-buying-vehicles',
    },
    {
        'slug': 'buying-stock',
        'name': 'Buying stock',
        'short': 'Stock up ahead of busy periods or buy in bulk at better prices.',
        'icon': 'stock',
        'purpose': 'Stock and inventory',
        'title': 'Stock and Inventory Finance for UK Businesses | Loanleaf',
        'desc': ('How UK limited companies and LLPs finance stock and inventory ahead of busy periods or bulk orders. Get '
                 'matched with a specialist finance broker.'),
        'h1': 'Finance for buying stock',
        'lead': 'Have the right stock on the shelves when customers want it, without emptying the bank account first.',
        'intro': [
            'Retailers, wholesalers, manufacturers and online sellers all face the same problem: stock has to be paid for '
            'before it can be sold. Stocking up for Christmas, taking a bulk order at a better price or launching a new '
            'range can mean a large payment to suppliers weeks or months before the sales come in. Without finance, that '
            'gap can limit how much the business is able to buy.',
            'Companies often use short-term or flexible finance for stock, so they are not paying for borrowing once the '
            'goods have sold. A revolving credit facility lets a business draw what it needs and repay as sales arrive. '
            'Businesses with card takings may use a merchant cash advance, and those selling to other businesses on credit '
            'may use invoice finance. An unsecured loan can suit a single, planned purchase.',
        ],
        'uses': [
            ('Seasonal stock', 'Buy in ahead of Christmas, summer or another peak, so the shelves are full when demand is highest and repayments follow the sales.'),
            ('Bulk buying discounts', 'Order larger quantities when a supplier offers a better unit price, where the saving helps to offset the cost of the finance.'),
            ('New product lines', 'Pay for the first run of a new range or product before it has started selling, so the launch is not held back by cash.'),
            ('Large customer orders', 'Buy the stock or raw materials needed to fulfil a big order from a trade customer who will pay on terms after delivery.'),
        ],
        'loans': ['revolving-credit-facility', 'merchant-cash-advance', 'unsecured-business-loans', 'invoice-finance'],
        'considerations': [
            ('How quickly it sells', 'Finance for stock works best when you are confident the goods will sell within a known period. Slow-moving stock means paying for borrowing for longer, so be realistic about sell-through.'),
            ('Short-term needs, short-term finance', 'Taking a long loan for stock that sells in weeks can mean paying interest long after the money has come back in. Flexible facilities that you repay as you sell often fit better.'),
            ('Supplier terms', 'Before borrowing, check whether suppliers will offer longer payment terms. Combining supplier credit with a smaller facility can reduce the overall cost.'),
        ],
        'faqs': [
            ('What finance can I use to buy stock?', 'Common options include revolving credit facilities, merchant cash advances, short-term unsecured loans and, for businesses selling on credit terms, invoice finance. Some specialist lenders also offer trade finance to pay suppliers directly. A broker can explain which fits your business.'),
            ('Can I finance stock for an online shop?', 'Often, yes. Lenders look at your sales history, which may come from marketplaces or payment providers as well as your bank statements. Some providers offer finance repaid as a share of online revenue, similar to a merchant cash advance. A broker can tell you which providers work with your sales channels.'),
            ('How much stock finance can my business get?', 'It depends mainly on turnover, sales history, how quickly stock sells and your existing commitments. Loanleaf handles enquiries from £5,000 upwards, and a broker can tell you what is realistic once they have seen your figures and understood how quickly your stock usually sells.'),
            ('Is it worth borrowing to get a bulk discount?', 'It can be, if the discount is larger than the total cost of the finance and you are confident the stock will sell in good time. Compare the saving with the full cost of borrowing, including any fees, before deciding.'),
            ('Can a lender pay my supplier directly?', 'Some can. Trade finance and certain stock facilities pay suppliers on your behalf, sometimes overseas, and you repay the lender later. Not every lender offers this, so a broker can tell you whether it is available for your purchase and what the lender would need to see.'),
            _help('stock and inventory finance'),
        ],
        'img': 'stock-need-buying-stock',
    },
    {
        'slug': 'hiring-staff',
        'name': 'Hiring staff',
        'short': 'Cover salaries and training while new people get up to speed.',
        'icon': 'user',
        'purpose': 'Growth and expansion',
        'title': 'Finance for Hiring Staff and Growing Your Team | Loanleaf',
        'desc': ('How UK limited companies and LLPs finance new hires, training and recruitment costs while a team grows. '
                 'Get matched with a specialist finance broker.'),
        'h1': 'Finance for hiring staff',
        'lead': 'Bring in the people you need to grow and cover their costs while they settle into the role.',
        'intro': [
            'Taking on new people is one of the most common reasons a business needs extra cash. Salaries, employer '
            'National Insurance, pension contributions, recruitment fees, training and equipment all start from day one, '
            'while a new team member may take several months to bring in more than they cost. For a small company, two or '
            'three hires at once can put real pressure on monthly cash flow.',
            'Businesses usually finance hiring with an unsecured business loan, repaid over a term that gives new staff '
            'time to become productive. Where new hires are needed to deliver work that is invoiced on credit terms, '
            'invoice finance can release cash as that work is billed. A revolving credit facility can also help cover '
            'payroll in months where income and wages do not line up.',
        ],
        'uses': [
            ('Staffing a new contract', 'Recruit the people needed to deliver a contract you have won, covering wages until the first invoices are paid.'),
            ('Specialist roles', 'Hire an experienced engineer, sales manager or other specialist whose salary is higher than the business can comfortably absorb at first.'),
            ('Apprentices and training', 'Cover the cost of training new starters or apprentices, including courses, supervision and the time before they work independently.'),
            ('Recruitment costs', 'Spread the cost of agency fees, job advertising and onboarding equipment, so hiring does not compete with other spending.'),
        ],
        'loans': ['unsecured-business-loans', 'invoice-finance', 'revolving-credit-facility'],
        'considerations': [
            ('Ongoing cost', 'A loan covers the early months, but salaries continue long after. Make sure the business expects to afford the new role from its own income by the time repayments end.'),
            ('Time to productivity', 'Think realistically about how long new staff will take to add value, and set the loan term with that in mind rather than the shortest term available.'),
            ('Personal guarantees', 'Unsecured lenders usually ask directors for a personal guarantee. Understand what that means for you before you sign, especially if the hire is a larger commitment.'),
        ],
        'faqs': [
            ('Can I get a business loan to pay staff wages?', 'Yes, many companies use business loans or flexible facilities to cover wages while new staff get up to speed or while waiting for customers to pay. Lenders will look at your turnover, profitability and how the business plans to afford the role over time.'),
            ('What type of finance suits hiring?', 'An unsecured business loan is common for planned hires, because it gives a fixed sum and predictable repayments. Businesses that invoice other companies may use invoice finance, and a revolving credit facility can help with payroll in uneven months. A broker can compare options.'),
            ('How much should I borrow for a new hire?', 'Many businesses estimate the full cost of the role, including employer National Insurance, pension, equipment and training, for the months before the new person covers their own cost. Your accountant can help work out a sensible figure based on your own costs and how quickly the role is likely to pay for itself.'),
            ('Will lenders ask why I am hiring?', 'Usually they will want to understand what the money is for and how the business will repay it. For hiring, that might mean explaining the contract, demand or growth the new role supports. Recent accounts and bank statements are normally needed too.'),
            ('Is it risky to borrow to hire?', 'Any borrowing carries risk. If the extra work does not materialise, the business still has both wages and repayments to meet. Starting with one hire, building in a buffer and choosing a sensible term can reduce the pressure. It helps to know how the business would cope if growth came more slowly than planned.'),
            _help('finance for growing teams'),
        ],
        'img': 'stock-need-hiring-staff',
    },
    {
        'slug': 'refurbishing-premises',
        'name': 'Refurbishing premises',
        'short': 'Refit a shop, café, office or workshop without draining cash.',
        'icon': 'property',
        'purpose': 'Growth and expansion',
        'title': 'Finance for Refurbishing Business Premises | Loanleaf',
        'desc': ('How UK limited companies and LLPs finance shop fits, refits and refurbishment of business premises. Get '
                 'matched with a specialist finance broker. Free to use.'),
        'h1': 'Finance for refurbishing premises',
        'lead': 'Refit, repair or update the place you trade from and spread the cost over the years it will be used.',
        'intro': [
            'The look and condition of your premises can matter as much as what you sell. A tired café, a dated shop floor '
            'or a workshop that no longer meets health and safety rules can hold a business back. Refurbishment covers '
            'everything from new flooring, lighting and fixtures to a full strip-out and fit-out, and the cost often lands '
            'in a short period while the work is carried out.',
            'Many businesses use an unsecured business loan for refurbishment, especially where they rent their premises '
            'and have no property to offer as security. Owners of their premises may be able to borrow more through '
            'secured lending. Customer-facing businesses with steady card takings sometimes use a merchant cash advance, '
            'and where a property needs work before a mainstream lender will accept it, bridging finance can play a part.',
        ],
        'uses': [
            ('Shop and café refits', 'Update the counter, seating, lighting and shopfront so the business looks the part and works better for staff and customers.'),
            ('Workshop and kitchen upgrades', 'Bring a commercial kitchen, salon or workshop up to current standards, including ventilation, electrics and fire safety.'),
            ('Office fit-out', 'Fit out new or existing office space with partitions, furniture and cabling when the team grows or the business moves.'),
            ('Energy efficiency', 'Replace old heating, lighting, windows or insulation, which can lower running costs as well as improving the space.'),
        ],
        'loans': ['unsecured-business-loans', 'secured-business-loans', 'merchant-cash-advance', 'bridging-loans'],
        'considerations': [
            ('Landlord consent', 'If you rent your premises, check your lease and get the landlord’s agreement before starting work. Some changes may also need planning permission or building regulations approval.'),
            ('Budget for overruns', 'Refurbishments often cost more and take longer than planned. Build a contingency into the amount you borrow and think about how the business will trade while the work is under way.'),
            ('Lease length', 'If your lease ends in a few years, borrowing over a longer term to improve someone else’s property may not make sense. Match the loan term to how long you expect to stay.'),
        ],
        'faqs': [
            ('Can I get finance to refurbish rented premises?', 'Yes. Many businesses that rent use unsecured business loans for refurbishment, because there is no property to offer as security. You will usually need your landlord’s agreement for the work, and lenders may ask about the length of your lease.'),
            ('What finance suits a shop or restaurant refit?', 'Unsecured business loans are common for refits. Restaurants, cafés, pubs and shops with steady card takings sometimes use a merchant cash advance, repaid from future sales. If you own the premises, secured lending may allow larger amounts. A broker can compare the options.'),
            ('Can I include furniture and equipment in the cost?', 'Often, yes, as part of a general business loan. Some businesses finance larger items of equipment, such as ovens or fitted machinery, separately through asset finance, which can keep the main loan smaller. A broker can suggest how to split the costs.'),
            ('How much can I borrow for refurbishment?', 'It depends on your turnover, profitability, trading history and whether you can offer security. Loanleaf handles enquiries from £5,000 to £2m and above. Having quotes from contractors helps a broker and lender understand the amount you need and what it will be spent on.'),
            ('Will lenders want to see quotes for the work?', 'For larger projects, many lenders like to see contractor quotes or a breakdown of costs so they understand what the money is for. For smaller amounts, the focus is usually on your accounts, bank statements and ability to repay. Either way, a clear idea of costs makes the process smoother.'),
            _help('refurbishment finance'),
        ],
        'img': 'stock-need-refurbishing-premises',
    },
    {
        'slug': 'paying-a-tax-bill',
        'name': 'Paying a tax bill',
        'short': 'Pay VAT, corporation tax or PAYE on time and spread the cost.',
        'icon': 'tax',
        'purpose': 'Tax or VAT bill',
        'title': 'Finance to Pay a Business Tax or VAT Bill | Loanleaf',
        'desc': ('How UK limited companies and LLPs finance a VAT, corporation tax or PAYE bill and spread the cost. Get '
                 'matched with a specialist finance broker.'),
        'h1': 'Finance for paying a tax bill',
        'lead': 'Settle a VAT, corporation tax or PAYE bill on time and spread the cost over the months that follow.',
        'intro': [
            'Tax bills often arrive at awkward moments. A strong quarter can leave a large VAT bill just as cash has gone '
            'on stock, and a profitable year can mean a corporation tax bill that is larger than expected. PAYE and '
            'National Insurance can jump after bonuses or new hires. Paying late brings HMRC interest and penalties, but '
            'paying in one go can leave the business short for wages and suppliers.',
            'Many companies use a VAT or tax loan, a short-term business loan designed to pay HMRC on time and spread the '
            'cost over a few months. Some lenders pay HMRC directly. A general unsecured loan or a revolving credit facility '
            'can do the same job. It is also worth comparing these with HMRC’s own Time to Pay arrangements, which let some '
            'businesses spread a bill directly with HMRC.',
        ],
        'uses': [
            ('Quarterly VAT', 'Pay a VAT return in full after a busy quarter, then spread the cost so the next quarter is not starved of cash.'),
            ('Corporation tax', 'Settle a corporation tax bill after a profitable year without using the reserves the business needs for wages and running costs.'),
            ('PAYE and National Insurance', 'Cover a higher than usual PAYE bill, for example after paying bonuses or taking on several new staff.'),
            ('Keeping cash for plans', 'Keep cash in the business for planned investment or a quieter season, rather than spending it all at once on a single deadline.'),
        ],
        'loans': ['vat-and-tax-loans', 'unsecured-business-loans', 'revolving-credit-facility'],
        'considerations': [
            ('Compare with Time to Pay', 'HMRC may agree a Time to Pay arrangement, which also spreads the bill, though HMRC charges interest on what is outstanding. Compare the total cost and conditions of both before deciding.'),
            ('Start early', 'Lenders need time to make their checks, and tax deadlines do not move. Starting a few weeks before the bill is due gives more options than leaving it to the last few days.'),
            ('Plan for next time', 'A loan helps with one bill. If tax bills regularly cause pressure, your accountant may be able to help set money aside through the year so the next one is easier to meet.'),
        ],
        'faqs': [
            ('Can I get a loan to pay my VAT bill?', 'Yes. VAT and tax loans are short-term business loans designed for this. The lender either pays HMRC directly or pays your business so you can settle the bill, and you repay in fixed instalments, typically over a few months. Lenders will usually ask to see the HMRC demand or return alongside your recent accounts.'),
            ('Which tax bills can be financed?', 'Lenders commonly help with VAT, corporation tax, and PAYE and National Insurance bills. Some also consider other HMRC liabilities. The aim is to pay HMRC in full and on time, then spread the cost over an agreed period that suits your cash flow.'),
            ('Is a tax loan better than HMRC Time to Pay?', 'It depends on your circumstances. Time to Pay is agreed directly with HMRC, which charges interest on the amount outstanding. A tax loan means HMRC is paid in full on time, but has its own interest and fees. Comparing both is sensible.'),
            ('What if my company is already behind with HMRC?', 'It can be harder, because some lenders only work with businesses whose tax affairs are up to date. Others may consider it depending on the amount and circumstances. A broker can tell you which options are realistic for your company.'),
            ('How quickly can a tax loan be arranged?', 'Some lenders can move within days once they have your documents, but it is safer not to rely on that. Having recent accounts, bank statements and the HMRC demand or return ready, and starting early, gives the best chance of meeting the deadline.'),
            _help('VAT and tax bills'),
        ],
        'img': 'stock-need-paying-a-tax-bill',
    },
]
