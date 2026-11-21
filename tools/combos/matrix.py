# Which combination pages exist. Edit here, then add copy in tools/combos/*.json and rebuild.
U, S, A, I, M, R, C, B, V = ('unsecured-business-loans', 'secured-business-loans', 'asset-finance', 'invoice-finance', 'merchant-cash-advance',
                             'revolving-credit-facility', 'commercial-mortgages', 'bridging-loans', 'vat-and-tax-loans')
LOAN_NEEDS = {  # loan type -> needs it sensibly serves
    U: ['working-capital', 'business-expansion', 'buying-equipment', 'buying-vehicles', 'buying-stock', 'hiring-staff', 'refurbishing-premises', 'paying-a-tax-bill'],
    S: ['business-expansion', 'buying-equipment', 'buying-vehicles', 'refurbishing-premises', 'working-capital', 'buying-stock'],
    A: ['buying-equipment', 'buying-vehicles', 'business-expansion', 'refurbishing-premises', 'working-capital'],
    I: ['working-capital', 'hiring-staff', 'buying-stock', 'business-expansion', 'paying-a-tax-bill'],
    M: ['working-capital', 'buying-stock', 'refurbishing-premises', 'buying-equipment', 'business-expansion'],
    R: ['working-capital', 'buying-stock', 'hiring-staff', 'paying-a-tax-bill', 'business-expansion'],
    C: ['business-expansion', 'refurbishing-premises'],
    B: ['refurbishing-premises', 'business-expansion'],
    V: ['paying-a-tax-bill', 'working-capital'],
}
INDUSTRY_LOANS = {  # industry -> loan types that sensibly suit it
    'restaurants-and-hospitality': [M, A, U, C, R, V, S],
    'construction-and-trades': [A, I, U, R, S, B, V],
    'retail': [R, M, U, A, V, C],
    'manufacturing': [A, I, R, S, U, C],
    'transport-and-logistics': [A, I, U, R, V, S],
    'healthcare-and-dental': [A, U, C, S, M],
    'ecommerce': [R, U, M, V, I],
    'professional-services': [U, V, I, R, C],
}
NEEDS_ORDER = ['working-capital', 'business-expansion', 'buying-equipment', 'buying-vehicles', 'buying-stock', 'hiring-staff', 'refurbishing-premises', 'paying-a-tax-bill']
LOAN_NEED = [(l, n) for l, ns in LOAN_NEEDS.items() for n in ns]
LOAN_IND = [(l, i) for i, ls in INDUSTRY_LOANS.items() for l in ls]
NEED_IND = [(n, i) for i in INDUSTRY_LOANS for n in NEEDS_ORDER]
