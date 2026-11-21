# Copy for the /industries/<slug> pages. Edit text here, then rebuild the pages.
# Loanleaf is an introducer: never imply it lends, arranges, advises or approves. No rates, no guarantees.
# 'loans' lists slugs from loans_content.LOANS, most suitable first.


def _help(what):
    return ('How can Loanleaf help?',
            f'Loanleaf is an introduction service, not a lender or broker, and we don’t give advice. You answer one short form '
            f'about your company and what you need, and we match you with a specialist finance broker who works with {what}. '
            f'It’s free to use and there’s no obligation to go ahead. The broker will explain any fees of their own.')


INDUSTRIES = [
    {
        'slug': 'restaurants-and-hospitality',
        'name': 'Restaurants and hospitality',
        'short': 'Finance for restaurants, cafés, pubs, bars and hotels.',
        'icon': 'cash',
        'purpose': 'Cash flow',
        'title': 'Business Loans for Restaurants and Hospitality | Loanleaf',
        'desc': ('Business loans and finance for UK restaurants, cafés, pubs and hotels. One short form matches you with a '
                 'specialist finance broker. Free, no obligation.'),
        'h1': 'Business loans for restaurants and hospitality',
        'lead': 'Finance for kitchens, refurbishments and the quieter months, matched to how restaurants, pubs and hotels actually trade.',
        'intro': [
            'Hospitality businesses take most of their money in the moment, across the till and the card machine, but their costs '
            'arrive on a different schedule. Rent, wages, suppliers and VAT keep falling due through January and February, when '
            'covers drop and bookings thin out. Kitchens rely on expensive equipment that tends to fail at the worst time, and most '
            'venues need a refresh every few years to keep customers coming back. Margins are tight, so a single large bill can '
            'put real pressure on cash.',
            'Restaurants, cafés, pubs and hotels use finance in a few common ways. Some spread the cost of a new kitchen, a '
            'refurbishment or a second site over a fixed term. Others borrow against future card takings, so repayments rise and '
            'fall with trade. Equipment can often be financed on its own, with the kit acting as security. A specialist broker '
            'who knows hospitality can explain which of these lenders are likely to consider for a venue like yours.',
        ],
        'uses': [
            ('Kitchen equipment', 'Replace an oven, extraction system, refrigeration or a coffee machine and spread the cost over the working life of the kit.'),
            ('Refurbishment and fit-out', 'Refresh a dining room, bar or bedrooms before the busy season without draining the cash you need for stock and wages.'),
            ('Quiet months', 'Keep wages, rent and supplier bills covered through the winter dip while takings are lower than usual.'),
            ('Opening a second site', 'Cover the deposit, fit-out and opening stock for a new venue once the first one is trading well.'),
        ],
        'loans': ['merchant-cash-advance', 'asset-finance', 'unsecured-business-loans', 'commercial-mortgages'],
        'considerations': [
            ('Seasonal trading', 'Lenders look closely at how takings change through the year. Bank statements covering at least one full year help show the busy months as well as the quiet ones, and fixed repayments need to be affordable in both.'),
            ('Card takings', 'If most of your sales go through a card terminal, some lenders will base the amount on your card turnover and take repayments as a share of it. This can feel easier in quiet weeks, but the total cost can be higher than a standard loan.'),
            ('Lease and premises', 'Many venues are on a lease, and lenders may ask how long is left on it. A short remaining term can affect how much they are prepared to lend and over how long.'),
        ],
        'faqs': [
            ('Can a new restaurant get a business loan?', 'Loanleaf works with businesses that have been trading for at least six months and have annual revenue of £50,000 or more. Within that, lenders vary in how much trading history they want to see. A broker can tell you which lenders consider younger hospitality businesses and what documents they are likely to ask for.'),
            ('What is a merchant cash advance?', 'It is an advance against your future card takings. Instead of a fixed monthly payment, a small share of each day’s card sales goes towards repaying it, so you repay more when trade is busy and less when it is quiet. It suits venues where most customers pay by card.'),
            ('Can I finance a new kitchen?', 'Often, yes. Commercial kitchen equipment can usually be financed through hire purchase or leasing, with the equipment itself acting as security. This lets you spread the cost over several years rather than paying for it all upfront, and can leave other borrowing options open.'),
            ('Do I need to own my premises?', 'No. Many hospitality businesses that borrow are on a lease. Unsecured loans, asset finance and merchant cash advances do not depend on owning property. If you do own the building, a commercial mortgage or secured loan may be another route a broker can explain.'),
            ('Will a bad winter count against me?', 'Lenders expect hospitality takings to vary through the year, so a quiet winter on its own is not unusual. They tend to look at the overall trend, how the business covers its costs in the low months and whether existing borrowing is being repaid on time.'),
            _help('restaurants, cafés, pubs and hotels'),
        ],
        'img': 'stock-ind-restaurants-and-hospitality',
    },
    {
        'slug': 'construction-and-trades',
        'name': 'Construction and trades',
        'short': 'Finance for builders, contractors and trade businesses.',
        'icon': 'equip',
        'purpose': 'Equipment or vehicles',
        'title': 'Business Loans for Construction and Trades | Loanleaf',
        'desc': ('Business loans and finance for UK builders, contractors and trade firms, from plant and vans to cash flow. '
                 'Get matched with a specialist broker.'),
        'h1': 'Business loans for construction and trades',
        'lead': 'Finance for plant, vans and materials, and for the gap between doing the work and being paid for it.',
        'intro': [
            'Construction and trade businesses usually pay out long before they get paid. Materials, plant hire, labour and '
            'subcontractors all need covering at the start of a job, while invoices can take 30 to 60 days to clear and '
            'retentions may be held back for months after completion. Weather delays, late variations and a main contractor who '
            'pays slowly can all stretch cash further. Vans, tools and machinery are essential to the work and need replacing on '
            'a regular cycle.',
            'Builders, contractors and specialist trades tend to use finance to keep both the kit and the cash moving. Asset '
            'finance spreads the cost of vans, excavators and other plant over their working life. Invoice finance releases money '
            'tied up in unpaid invoices on completed work. Short-term loans can cover materials and wages when a larger contract '
            'starts. A broker who works with construction firms can explain which options lenders are likely to consider for your '
            'situation.',
        ],
        'uses': [
            ('Vans and plant', 'Add a van, a mini digger or a telehandler to the fleet and spread the cost rather than paying for it outright.'),
            ('Starting a larger contract', 'Cover materials, labour and subcontractors upfront when you win a job that pays in stages.'),
            ('Slow-paying clients', 'Release cash tied up in invoices for completed work while you wait for main contractors or clients to pay.'),
            ('Tools and equipment', 'Upgrade specialist tools, scaffolding or site equipment so you can take on different kinds of work.'),
        ],
        'loans': ['asset-finance', 'invoice-finance', 'unsecured-business-loans', 'revolving-credit-facility'],
        'considerations': [
            ('Payment terms and retentions', 'Lenders understand that construction is paid in arrears and that retentions are common. They will usually want to see who your main customers are and how reliably they pay.'),
            ('Invoice finance and applications', 'Some invoice finance providers are cautious about stage payments, applications for payment and contracts with retentions. A broker can point you towards lenders who are familiar with how construction invoicing works.'),
            ('Vehicle and plant values', 'With asset finance, the age, type and resale value of the vehicle or machinery affects what lenders offer. Used plant can often be financed, but terms may be shorter for older equipment.'),
        ],
        'faqs': [
            ('Can I finance a van or plant for my trade business?', 'Yes, this is one of the most common uses of finance in construction. Hire purchase and leasing let you spread the cost of vans, diggers, dumpers and other machinery, with the asset itself usually acting as security. New and used equipment can both be considered, depending on the lender.'),
            ('Can I borrow against unpaid invoices?', 'Invoice finance lets you borrow against invoices you have issued but not yet been paid for. In construction, some providers only work with straightforward invoices for completed work, while others understand applications for payment. A broker can explain which lenders are likely to consider your type of contracts.'),
            ('Do I need to be a limited company?', 'Loanleaf works with UK limited companies and LLPs. Many builders and trades operate as sole traders, which we cannot currently help with. If your business is incorporated, has traded for at least six months and turns over £50,000 or more a year, you can use the form.'),
            ('Will one bad debt count against me?', 'Most construction firms have experienced a client paying late or not at all at some point. Lenders tend to look at the overall picture, including your recent accounts, bank statements and how you have handled existing borrowing, rather than a single event.'),
            ('How quickly can money be available?', 'It depends on the type of finance and how quickly you can provide documents. Asset finance for a standard vehicle can sometimes be arranged within days, while larger or more complex applications take longer. Having accounts and bank statements ready usually helps.'),
            _help('builders, contractors and trade businesses'),
        ],
        'img': 'stock-ind-construction-and-trades',
    },
    {
        'slug': 'retail',
        'name': 'Retail',
        'short': 'Finance for independent shops and multi-site retailers.',
        'icon': 'stock',
        'purpose': 'Stock and inventory',
        'title': 'Business Loans for Retail Businesses | Loanleaf',
        'desc': ('Business loans and finance for UK shops and retailers, for stock, refits and seasonal peaks. One short form '
                 'matches you with a specialist broker.'),
        'h1': 'Business loans for retail businesses',
        'lead': 'Finance for stock, shop refits and the run-up to your busiest weeks, for independent and multi-site retailers.',
        'intro': [
            'Retailers have to buy stock well before they sell it. Orders for Christmas, summer or back to school are often placed '
            'and paid for months in advance, and suppliers may want payment upfront or on short terms. At the same time, rent, '
            'business rates and wages are fixed costs that do not move with footfall. A slow month, a late delivery or a supplier '
            'offering a discount for bulk orders can all leave a shop needing cash at short notice.',
            'Shops and retail businesses use finance to buy stock ahead of busy periods, refit their premises, open new branches '
            'and manage the dips between seasons. A revolving facility can be drawn on when a big order is due and repaid as '
            'stock sells. Card-based finance links repayments to daily takings. Fixed-term loans suit one-off projects such as a '
            'new shopfront or till system. A broker can explain which of these lenders are likely to consider for your shop.',
        ],
        'uses': [
            ('Seasonal stock', 'Buy in for Christmas or another peak period and repay as the stock sells through.'),
            ('Shop refit', 'Update shelving, lighting, flooring or a shopfront to make the most of the space you have.'),
            ('Bulk buying', 'Take up a supplier discount for paying upfront or ordering in larger quantities.'),
            ('A new branch', 'Cover the deposit, fit-out and opening stock for an additional shop.'),
        ],
        'loans': ['revolving-credit-facility', 'merchant-cash-advance', 'unsecured-business-loans', 'asset-finance'],
        'considerations': [
            ('Stock turnover', 'Lenders want to understand how quickly your stock sells and how much is tied up at any one time. Slow-moving or seasonal lines can affect how they view affordability.'),
            ('Card and online sales', 'If you take most payments by card or online, some lenders will look at that turnover directly and link repayments to it. This can match quieter weeks, but compare the total cost with a standard loan.'),
            ('Lease length', 'For retailers who rent their premises, lenders may consider how long is left on the lease, particularly for larger amounts or longer terms. A lease that is due for renewal soon is worth mentioning to the broker early.'),
        ],
        'faqs': [
            ('Can I get finance to buy stock?', 'Yes. Many retailers use a revolving credit facility, a short-term loan or a merchant cash advance to buy stock ahead of a busy period. The best fit depends on how often you need it, how quickly the stock sells and how your customers pay. A broker can explain the options.'),
            ('What is a revolving credit facility?', 'It is a limit you can draw from, repay and draw from again, a little like an overdraft but usually separate from your bank. You typically pay interest only on what you use. It can suit retailers who need extra cash at certain points in the year rather than all the time.'),
            ('Can I borrow if sales are seasonal?', 'Yes. Lenders are used to retail businesses with busy and quiet periods. They will usually look at bank statements over at least a year to see the full pattern, and at whether repayments would be affordable in the quieter months as well as the busy ones.'),
            ('Do I need to own my shop?', 'No. Most finance for retailers does not depend on owning the premises. If you do own your shop, a secured loan or commercial mortgage may give access to larger amounts over longer terms, but it means putting the property up as security.'),
            ('Can I finance a new till or shop fittings?', 'Often, yes. Point of sale systems, shelving, refrigeration and other fittings can sometimes be financed through asset finance or included in a broader loan. A broker can explain which approach lenders are likely to consider for the items you need.'),
            _help('independent and multi-site retailers'),
        ],
        'img': 'stock-ind-retail',
    },
    {
        'slug': 'manufacturing',
        'name': 'Manufacturing',
        'short': 'Finance for manufacturers, engineers and fabricators.',
        'icon': 'equip',
        'purpose': 'Equipment or vehicles',
        'title': 'Business Loans for Manufacturing Businesses | Loanleaf',
        'desc': ('Business loans and finance for UK manufacturers, from machinery and materials to cash flow on large orders. '
                 'Get matched with a specialist broker.'),
        'h1': 'Business loans for manufacturing businesses',
        'lead': 'Finance for machinery, raw materials and the working capital needed to deliver larger orders.',
        'intro': [
            'Manufacturers carry costs at every stage. Raw materials are bought in, turned into finished goods, then sold to '
            'customers who often pay on 30, 60 or even 90 day terms. A large new order can mean buying materials and taking on '
            'staff months before any money comes back. Machinery is expensive, and replacing or upgrading a CNC machine, press or '
            'production line is a significant investment. Energy and material prices can also move quickly, putting pressure on '
            'margins agreed in advance.',
            'Manufacturing and engineering businesses commonly use asset finance to spread the cost of machinery over its working '
            'life, and to release cash from equipment they already own. Invoice finance helps close the gap between delivering '
            'goods and being paid. Revolving facilities and short-term loans can cover raw materials for a big order. A specialist '
            'broker who understands manufacturing can explain which options lenders are likely to consider for your business.',
        ],
        'uses': [
            ('New machinery', 'Invest in a CNC machine, press, lathe or production line upgrade and spread the cost over its working life.'),
            ('Raw materials for a large order', 'Buy in materials and components upfront to fulfil a contract that pays on delivery or later.'),
            ('Customer payment terms', 'Release cash tied up in invoices to customers on 30 to 90 day terms.'),
            ('Releasing cash from equipment', 'Raise money against machinery you already own outright and put it to work elsewhere in the business.'),
        ],
        'loans': ['asset-finance', 'invoice-finance', 'revolving-credit-facility', 'secured-business-loans'],
        'considerations': [
            ('Machinery values', 'Lenders consider the type, age and resale value of the equipment. Specialist machinery with a narrow market may be treated differently from widely used kit, and this can affect the amount and term offered.'),
            ('Customer concentration', 'If a large share of your sales comes from one or two customers, lenders may look closely at those relationships. This matters most for invoice finance, where your customers’ reliability affects what a lender will advance.'),
            ('Order book and margins', 'For larger amounts, lenders may want to understand your order book and how material and energy costs affect margins. Management accounts can help show this.'),
        ],
        'faqs': [
            ('Can I finance new or used machinery?', 'Yes. Asset finance through hire purchase or leasing is widely used for manufacturing equipment, and many lenders will consider used machinery as well as new. The age and resale value of the equipment affects what lenders are likely to offer and over how long.'),
            ('What is asset refinance?', 'It lets you raise money against machinery you already own. A lender buys or takes security over the equipment and you repay over an agreed term while continuing to use it. It can release cash that is tied up in kit without selling it.'),
            ('Can I get finance against unpaid invoices?', 'Invoice finance lets you borrow against invoices you have issued to business customers. You receive a large part of the invoice value upfront and the rest, less fees, when the customer pays. It suits manufacturers who sell on credit terms to other businesses.'),
            ('Do I need security to borrow?', 'Not always. Asset finance is secured on the equipment itself, and invoice finance on your invoices. Unsecured loans are also available, though most lenders ask directors for a personal guarantee. Larger amounts may need security over property or other business assets.'),
            ('What documents will lenders ask for?', 'Most lenders ask for recent bank statements and filed accounts. For larger amounts they may also want management accounts, an aged debtors list and details of the equipment you want to buy. Having these ready usually helps an application move faster.'),
            _help('manufacturers, engineers and fabricators'),
        ],
        'img': 'stock-ind-manufacturing',
    },
    {
        'slug': 'transport-and-logistics',
        'name': 'Transport and logistics',
        'short': 'Finance for hauliers, couriers and logistics firms.',
        'icon': 'car',
        'purpose': 'Equipment or vehicles',
        'title': 'Business Loans for Transport and Logistics | Loanleaf',
        'desc': ('Business loans and finance for UK hauliers, couriers and logistics firms, from lorries and vans to cash flow. '
                 'Get matched with a specialist broker.'),
        'h1': 'Business loans for transport and logistics',
        'lead': 'Finance for lorries, vans and trailers, and for the cash flow gap between delivering loads and being paid.',
        'intro': [
            'Transport and logistics businesses run on vehicles, fuel and drivers, and all three cost money every day. Fuel, '
            'tolls, insurance and wages are paid as the work is done, but customers often pay on 30 to 60 day terms. Lorries, '
            'vans and trailers are expensive to buy and need replacing regularly to stay reliable and compliant with emissions '
            'rules. A large new contract can mean adding vehicles and drivers before the first invoice is paid, while a breakdown '
            'can take a vehicle off the road at short notice.',
            'Hauliers, couriers and logistics firms often use asset finance to grow or replace their fleet, spreading the cost of '
            'each vehicle over its working life. Invoice finance releases cash tied up in unpaid invoices from customers. Short-term '
            'loans can cover repairs, fuel or the upfront costs of a new contract. A specialist broker who works with transport '
            'businesses can explain which options lenders are likely to consider for your fleet.',
        ],
        'uses': [
            ('Adding to the fleet', 'Take on a new HGV, van or trailer to service a contract and spread the cost over the life of the vehicle.'),
            ('Replacing older vehicles', 'Upgrade vehicles to meet clean air zone or emissions requirements without paying the full price upfront.'),
            ('Waiting for customers to pay', 'Release cash tied up in invoices so fuel, wages and running costs stay covered.'),
            ('Repairs and downtime', 'Cover an unexpected repair bill or replacement vehicle so you can keep work moving.'),
        ],
        'loans': ['asset-finance', 'invoice-finance', 'unsecured-business-loans', 'revolving-credit-facility'],
        'considerations': [
            ('Operator licence and compliance', 'Lenders financing HGVs may ask about your operator licence and how many vehicles it covers. Having this in order makes the process smoother.'),            ('Vehicle age and mileage', 'The age, mileage and resale value of a vehicle affect what lenders will offer and over what term. High-mileage or older vehicles may be financed over a shorter period.'),
            ('Customer contracts', 'If much of your work comes from a few large customers, lenders may want to understand those contracts and how reliably they pay. Longer contracts with established customers can help show that income is steady.'),
        ],
        'faqs': [
            ('Can I finance an HGV or a van?', 'Yes. Hire purchase and leasing are the most common ways transport businesses finance lorries, vans and trailers. The vehicle usually acts as security, which can make this easier to arrange than other borrowing. New and used vehicles can both be considered, depending on the lender.'),
            ('Can I finance several vehicles at once?', 'Many lenders offer fleet finance for multiple vehicles, sometimes under a single agreement. They will look at your trading history, existing finance and how the extra vehicles will be used. A broker can explain how lenders tend to approach fleet growth.'),
            ('How does invoice finance work for hauliers?', 'You borrow against invoices you have issued to customers for completed deliveries. A large part of the invoice value is paid to you upfront, with the rest, less fees, when the customer pays. It can help cover fuel and wages while you wait for payment.'),
            ('Can I raise money against vehicles I own?', 'Often, yes. Asset refinance lets you release cash from vehicles you already own outright or have built up equity in. You keep using the vehicles while repaying over an agreed term. Lenders will look at the age, mileage and value of each vehicle, and at any finance still owed on it.'),
            ('What will lenders want to see?', 'Usually recent bank statements and filed accounts, plus details of the vehicles involved. For HGV finance, lenders may also ask about your operator licence. For invoice finance, they will want to see your customer list and how long invoices typically take to be paid.'),
            _help('hauliers, couriers and logistics firms'),
        ],
        'img': 'stock-ind-transport-and-logistics',
    },
    {
        'slug': 'healthcare-and-dental',
        'name': 'Healthcare and dental',
        'short': 'Finance for dental practices, clinics and care providers.',
        'icon': 'heart',
        'purpose': 'Equipment or vehicles',
        'title': 'Business Loans for Healthcare and Dental | Loanleaf',
        'desc': ('Business loans and finance for UK dental practices, clinics and care providers, from equipment to premises. '
                 'Get matched with a specialist broker.'),
        'h1': 'Business loans for healthcare and dental practices',
        'lead': 'Finance for equipment, refurbishment and premises, for dental practices, private clinics and care providers.',
        'intro': [
            'Healthcare businesses depend on specialist equipment and suitable premises, and both are expensive. A dental chair, '
            'an imaging system or treatment room fit-out can cost tens of thousands of pounds, and regulators expect facilities '
            'to be kept up to standard. Practices that take NHS work may be paid on a set schedule, while private income can vary '
            'month to month. Care providers carry high staffing costs and may wait for local authority payments, which can put '
            'pressure on cash.',
            'Dental practices, private clinics, physiotherapists, opticians and care providers commonly use asset finance to '
            'spread the cost of clinical equipment. Fixed-term loans can pay for a refurbishment or an extra surgery. Commercial '
            'mortgages help practices buy the premises they work from, and secured loans can support the purchase of an existing '
            'practice. A specialist broker who works with healthcare businesses can explain which options lenders are likely to '
            'consider.',
        ],
        'uses': [
            ('Clinical equipment', 'Buy a new dental chair, X-ray or scanning equipment, or treatment couches and spread the cost over several years.'),
            ('Surgery or clinic refurbishment', 'Update treatment rooms, waiting areas or decontamination facilities to meet current standards.'),
            ('Buying your premises', 'Move from renting to owning the building your practice or clinic operates from.'),
            ('Adding capacity', 'Fit out an extra surgery or treatment room to see more patients.'),
        ],
        'loans': ['asset-finance', 'unsecured-business-loans', 'commercial-mortgages', 'secured-business-loans'],
        'considerations': [
            ('Mix of NHS and private income', 'Lenders often look at how income is split between NHS or local authority contracts and private patients. Contracted income can be seen as steady, while private income may vary more.'),
            ('Specialist equipment', 'Clinical equipment can usually be financed, but lenders consider its resale value and expected working life. These affect the amount offered and how long you have to repay.'),
            ('Regulation and ownership', 'For larger amounts, lenders may ask about CQC registration and the ownership structure of the practice, particularly where several partners or directors are involved. Clear records of who owns what help keep things moving.'),
        ],
        'faqs': [
            ('Can I finance dental or medical equipment?', 'Yes. Asset finance is widely used for dental chairs, imaging systems, lasers and other clinical equipment. You spread the cost over an agreed term, with the equipment usually acting as security. Many lenders consider both new and used equipment, and some work only with healthcare businesses.'),
            ('Can I borrow to buy a dental practice?', 'Practice purchases are often financed with a combination of secured lending and your own contribution. Lenders look at the practice’s income, the mix of NHS and private work and your experience. A specialist broker can explain how lenders typically approach this.'),
            ('Can I get a commercial mortgage for my surgery?', 'Many practices buy their premises with a commercial mortgage. Lenders consider the property’s value, the practice’s trading history and how the repayments compare with your current rent. Owning the building can also give you more control over future changes, though you take on the cost of repairs.'),
            ('Do care providers use business finance?', 'Yes. Care homes and domiciliary care providers use finance for refurbishments, vehicles, equipment and cash flow while waiting for local authority payments. Lenders will want to understand occupancy, staffing costs, inspection ratings and how and when income is paid, whether by local authorities or private residents.'),
            ('What documents will lenders ask for?', 'Typically filed accounts, recent bank statements and details of what you want to finance. For practice purchases or premises, lenders may also ask for associate agreements, NHS contract details and information about the property. Having these ready usually helps an application move faster.'),
            _help('dental practices, clinics and care providers'),
        ],
        'img': 'stock-ind-healthcare-and-dental',
    },
    {
        'slug': 'ecommerce',
        'name': 'Ecommerce',
        'short': 'Finance for online retailers and direct-to-consumer brands.',
        'icon': 'globe',
        'purpose': 'Stock and inventory',
        'title': 'Business Loans for Ecommerce Businesses | Loanleaf',
        'desc': ('Business loans and finance for UK online retailers and ecommerce brands, for stock, marketing and growth. '
                 'Get matched with a specialist broker.'),
        'h1': 'Business loans for ecommerce businesses',
        'lead': 'Finance for stock, marketing and fulfilment, for online retailers and brands selling direct or through marketplaces.',
        'intro': [
            'Online retailers often pay for stock long before customers pay for it. Manufacturers and overseas suppliers may want '
            'deposits or payment in full before goods are shipped, and stock can spend weeks in transit before it is ready to '
            'sell. Marketplaces may hold back payouts, and advertising has to be paid for before it brings in sales. When a '
            'product sells well, the business can run out of stock and cash at the same time, just as demand is at its highest.',
            'Ecommerce businesses use finance to buy stock in larger quantities, pay for marketing campaigns, launch new products and '
            'invest in fulfilment. Revolving facilities can be drawn on when a big order is due. Some lenders base the amount on '
            'online sales data and take repayments as a share of revenue. Fixed-term loans can suit a one-off investment such as '
            'a warehouse move. A broker can explain which options lenders are likely to consider for an online business.',
        ],
        'uses': [
            ('Larger stock orders', 'Pay a supplier deposit or order in bulk ahead of a peak season such as Black Friday or Christmas.'),
            ('Marketing campaigns', 'Spread the cost of a paid advertising push or product launch over a set period.'),
            ('New product lines', 'Cover development, samples and first production runs for a new range.'),
            ('Fulfilment and storage', 'Move to a larger unit, add racking or bring fulfilment in-house.'),
        ],
        'loans': ['revolving-credit-facility', 'unsecured-business-loans', 'merchant-cash-advance', 'vat-and-tax-loans'],
        'considerations': [
            ('Sales data', 'Lenders that work with online businesses may ask to connect to your store, marketplace or payment provider accounts to see sales history. Consistent, well-kept data helps.'),
            ('Stock overseas and in transit', 'If stock is held abroad or in transit for long periods, lenders may look at how quickly it turns into cash and how much is tied up at once. Shipping delays are worth allowing for when you plan repayments.'),
            ('Seasonality and returns', 'Peaks around events such as Black Friday, and return rates in some categories, can make income uneven. Make sure repayments would be affordable in quieter months.'),
        ],
        'faqs': [
            ('Can an online-only business get a loan?', 'Yes. Many lenders work with ecommerce businesses and look at online sales history, marketplace payouts and bank statements. As with any business using Loanleaf, the company needs to be a UK limited company or LLP, trading for at least six months with annual revenue of £50,000 or more.'),
            ('What is revenue-based finance?', 'It is finance where repayments are taken as a share of your sales, so you repay more in busy periods and less in quiet ones. Some lenders offer this to online businesses using data from their store or payment provider. Compare the total cost with a standard loan before deciding.'),
            ('Can I borrow to buy stock from overseas suppliers?', 'Often, yes. Revolving facilities and short-term loans are commonly used to pay supplier deposits and balances. Some lenders offer trade finance aimed specifically at importing stock. A broker can explain which options might suit how and where you buy, and how long lenders allow for stock in transit.'),
            ('Do marketplace sellers qualify?', 'Many lenders consider businesses that sell through marketplaces such as Amazon or eBay, as well as their own website. They may look at payout history, account health and how long you have been selling on each platform, alongside your bank statements and filed accounts. Payouts that are held back or delayed can affect how lenders view cash flow.'),
            ('Can I borrow to pay a VAT bill?', 'Yes. VAT loans spread a quarterly VAT bill over a few months. They can help online retailers whose VAT falls due after a busy quarter, when much of the cash has already been spent on new stock. Check the total cost and any fees before you decide.'),
            _help('online retailers and ecommerce brands'),
        ],
        'img': 'stock-ind-ecommerce',
    },
    {
        'slug': 'professional-services',
        'name': 'Professional services',
        'short': 'Finance for accountants, architects, consultants and agencies.',
        'icon': 'briefcase',
        'purpose': 'Growth and expansion',
        'title': 'Business Loans for Professional Services Firms | Loanleaf',
        'desc': ('Business loans and finance for UK accountants, architects, consultants, agencies and other professional '
                 'firms. Get matched with a specialist broker.'),
        'h1': 'Business loans for professional services firms',
        'lead': 'Finance for hiring, acquisitions, tax bills and cash flow, for firms that sell expertise rather than products.',
        'intro': [
            'Professional services firms sell time and expertise, so their biggest cost is usually people. Salaries are paid every '
            'month, but clients may be billed at project milestones or on 30 to 60 day terms, and work in progress can build up '
            'before an invoice goes out. Tax and VAT bills can land at awkward points in the year. Firms often have few physical '
            'assets to borrow against, which shapes the kind of finance that suits them.',
            'Accountants, solicitors, architects, consultants and agencies commonly use unsecured loans to hire ahead of new work, '
            'open a new office or buy another practice. VAT and tax loans spread a large bill over several months. Invoice '
            'finance and revolving facilities help even out the gap between doing the work and being paid. A specialist broker '
            'who works with professional firms can explain which options lenders are likely to consider.',
        ],
        'uses': [
            ('Hiring ahead of growth', 'Take on staff for a new client or service line before the extra fees start coming in.'),
            ('Buying a practice or book', 'Acquire another firm, a client book or a retiring partner’s share.'),
            ('Tax and VAT bills', 'Spread a large corporation tax or VAT payment over several months instead of paying it in one go.'),
            ('A new office', 'Fit out a new office or move to larger premises as the team grows.'),
        ],
        'loans': ['unsecured-business-loans', 'vat-and-tax-loans', 'invoice-finance', 'revolving-credit-facility'],
        'considerations': [
            ('Few physical assets', 'Without property or equipment to secure against, lenders focus on trading history, recurring income and affordability. Most will ask directors or partners for a personal guarantee.'),
            ('Recurring and contracted income', 'Retainers, ongoing contracts and repeat clients can help show lenders that income is steady. Lenders may ask how much revenue comes from your largest clients.'),
            ('Partnership and LLP structures', 'For LLPs, lenders will want to understand the members, how profits are shared and who would give any guarantees. Members’ drawings may also be considered when lenders assess affordability.'),
        ],
        'faqs': [
            ('Can a firm with no property borrow?', 'Yes. Most finance for professional firms is unsecured, based on trading history, cash flow and affordability rather than assets. Lenders usually ask directors or members for a personal guarantee. A broker can explain what different lenders are likely to require.'),
            ('Can I borrow to buy another practice?', 'Many firms finance acquisitions of client books or whole practices with a business loan, often alongside their own contribution or deferred payments to the seller. Lenders look at the combined income and how the purchase will be repaid. They may also ask how many clients are expected to stay after the sale.'),
            ('Can I spread a corporation tax or VAT bill?', 'Yes. Tax and VAT loans let you pay HMRC on time and repay the lender over a few months. They can be useful when a large bill falls due at a point in the year when cash is tied up in client work.'),
            ('Do LLPs qualify?', 'Yes. Loanleaf works with UK limited companies and LLPs that have traded for at least six months and have annual revenue of £50,000 or more. Lenders will look at the LLP’s accounts and may ask members to provide personal guarantees, so it helps to agree who will do this early.'),
            ('Can I get finance against client invoices?', 'Invoice finance can work for professional firms that invoice other businesses on credit terms. Some providers are cautious about milestone billing or work in progress, so a broker can point you towards lenders who are familiar with how firms like yours usually bill.'),
            _help('accountants, architects, consultants and agencies'),
        ],
        'img': 'stock-ind-professional-services',
    },
]
