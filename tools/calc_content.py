# Copy for /business-loan-calculator. Edit here, then run: python3 tools/build_pages.py

TITLE = 'Business Loan Calculator | Work Out Monthly Repayments | Loanleaf'
DESC = ('Use our free business loan calculator to estimate monthly repayments, total interest and the full cost of borrowing '
        'from £5,000 to £2m, then get matched with a specialist UK finance broker.')
H1 = 'Business loan calculator'
LEAD = 'See what a business loan could cost each month. Change the amount, term and rate to compare options.'
NOTE = ('Figures are estimates based on a fixed interest rate with equal monthly repayments, and don’t include arrangement or broker fees. '
        'They are not an offer of finance. The rate and terms you’re offered will depend on your business, its finances and the lender.')

HOW_H2 = 'How our business loan calculator works'
HOW = [
    'Enter how much you want to borrow, how long you want to repay it over and an estimated interest rate. The calculator works out your monthly repayment, the total you would repay and how much of that is interest. It updates as you change each figure, so you can quickly see how a shorter term or a lower rate changes the cost.',
    'It assumes a standard amortising loan: a fixed interest rate and equal monthly repayments, where each payment covers that month’s interest and pays off part of the amount borrowed. This is how most fixed-rate business term loans work. Other products, such as merchant cash advances, revolving credit facilities or invoice finance, are priced differently, so treat the results as a guide rather than a quote.',
]

COST_H2 = 'What affects the cost of a business loan?'
COST = [
    ('Loan amount', 'The more you borrow, the more interest you pay in pounds, even at the same rate. Larger loans can sometimes attract lower rates, especially if they are secured against property or other assets.'),
    ('Interest rate', 'The rate depends on your business’s credit history, revenue, profitability, how long it has been trading, the type of finance and whether the loan is secured. A difference of a few percentage points can add up to thousands of pounds over the life of a loan.'),
    ('Repayment term', 'A longer term means lower monthly repayments but more interest overall, because you are borrowing the money for longer. A shorter term costs less in total but needs bigger monthly payments.'),
    ('Fees', 'Some lenders charge an arrangement fee, and brokers may charge a fee for their service. These aren’t included in the calculator, so always ask for the APR and the total amount repayable, including fees, before you agree to anything.'),
]

FORMULA_H2 = 'How to work out business loan repayments'
FORMULA = [
    'Monthly repayments on a fixed-rate loan are calculated with a standard formula: M = P × r ÷ (1 − (1 + r)<sup>−n</sup>), where P is the amount borrowed, r is the monthly interest rate (the annual rate divided by 12) and n is the number of monthly repayments.',
    'For example, borrowing £100,000 over 5 years (60 months) at 10% a year gives a monthly rate of about 0.833%. The monthly repayment is around £2,124.70, the total repaid is about £127,482 and the total interest is about £27,482.',
    'In the early months, more of each repayment goes towards interest, because the balance is at its highest. As the balance falls, more of each payment goes towards paying off the loan itself. You can see this in the year-by-year breakdown above.',
]

BORROW_H2 = 'How much can my business borrow?'
BORROW = [
    'How much a lender will offer depends mainly on your business’s revenue, profitability, existing borrowing and credit history, as well as how long it has been trading and whether you can offer security. As a rough guide, many lenders look for monthly repayments to be comfortably covered by your business’s cash flow.',
    'Through Loanleaf, specialist brokers can help UK limited companies and LLPs that have been trading for at least 6 months and have annual revenue of £50,000 or more, with funding from around £5,000 to over £2m.',
]

DOCS_H2 = 'What you’ll usually need to apply'
DOCS = [
    'Recent business bank statements, often the last 3 to 6 months',
    'Your latest filed accounts, and management accounts if they are more recent',
    'Details of any existing business borrowing',
    'Photo ID and proof of address for the directors',
    'For secured loans, details of the property or assets offered as security',
]

FAQ = [
    ('What is a business loan calculator?', 'A business loan calculator estimates the monthly repayments and total cost of a loan based on the amount, the repayment term and the interest rate. It helps you compare options and check affordability before you speak to a lender or broker.'),
    ('How accurate is the calculator?', 'It is accurate for a fixed-rate loan with equal monthly repayments and no fees. Real offers can differ because of arrangement fees, broker fees, variable rates, repayment holidays or different repayment structures. Always check the APR and total amount repayable in any offer.'),
    ('What interest rate should I use?', 'Use the rate you have been quoted if you have one. If not, try a few different rates to see the range of possible costs. Rates vary widely depending on your business, the type of finance and whether the loan is secured, so it is worth comparing a low, middle and high estimate.'),
    ('What is the difference between the interest rate and the APR?', 'The interest rate is the cost of borrowing the money itself. The APR (annual percentage rate) also includes compulsory fees, such as arrangement fees, so it gives a fuller picture of the yearly cost. When comparing offers, compare the APR and the total amount repayable.'),
    ('Does the calculator include fees?', 'No. It shows the cost of interest only. If a lender charges an arrangement fee or a broker charges a fee, the total cost will be higher than the calculator shows.'),
    ('Will using the calculator affect my credit score?', 'No. The calculator doesn’t ask for any personal or business details and doesn’t run a credit check.'),
    ('Is a longer or shorter loan term better?', 'A longer term lowers your monthly repayments but increases the total interest you pay. A shorter term costs less overall but needs higher monthly repayments. The right balance depends on your cash flow and what the funding is for.'),
    ('Can I repay a business loan early?', 'Many lenders allow early repayment, but some charge an early repayment fee. If you might want to repay early, ask about this before you agree to a loan.'),
    ('How does the calculator work for other types of finance?', 'It is designed for fixed-rate term loans. Asset finance and some commercial mortgages work in a similar way, but merchant cash advances, revolving credit facilities and invoice finance are priced differently, so the results will only be a rough guide for those.'),
    ('What happens when I click Get matched?', 'You go to our short enquiry form with your loan amount already filled in. Answer a few questions about your business and, if we can help, we will introduce you to a specialist finance broker. Loanleaf is free to use and is not a lender or broker.'),
]
