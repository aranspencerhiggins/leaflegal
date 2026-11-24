# Mega menus for the client and law firm sides. Run inside tools/build_pages.py (exec), so it shares its helpers and constants.
# Owner (2026-11-21): "massive mega menu" on both sides; Property first, every service listed, About at the end.
import matters_content as MC, partner_seo_content as PS, client_guides as CG, photos as PH

MAT = MC.MATTERS
AREA = AC.BY_SLUG
M_URL = lambda a, s: f'/{a}/{s}'
CITY_URL = lambda c: f'/solicitors/{c}'
LOC_URL = lambda c, a: f'/solicitors/{c}/{a}'
CITY = {c[0]: c for c in MC.CITIES}
LOCAL_NAME = {'conveyancing': 'Conveyancing solicitors', 'family-law': 'Family solicitors',
              'licensing': 'Licensing solicitors', 'debt-recovery': 'Debt recovery solicitors', 'lease-extensions': 'Lease extension solicitors',
              'trademarks': 'Trademark solicitors'}
TOP_CITIES = [c[0] for c in MC.CITIES[:8]]
AREA_GUIDES = {}
for _g in CG.GUIDES:
    AREA_GUIDES.setdefault(_g['area'], []).append(_g)


def _area_sub(a):
    groups = []
    if a in MC.LOCAL_AREAS:
        groups.append((f'{AREA[a]["name"]} near you', [(LOC_URL(c, a), CITY[c][1]) for c in TOP_CITIES]))
    else:
        groups.append(('Across the UK', [(AREA_URL(a) + '#how', 'How introductions work'), ('/guides/choosing-an-immigration-adviser', 'Choosing a regulated adviser')]))
    gl = [(f'/guides/{g["slug"]}', g['h1']) for g in AREA_GUIDES.get(a, [])]
    groups.append(('Guides' if gl else 'Get started', gl or [('/apply', 'Answer a few questions'), ('/how-it-works', 'How it works')]))
    return {'head': (AREA_URL(a), f'{AREA[a]["name"]} overview'), 'groups': groups}


def area_mega(label, slugs, card):
    items = []
    for a in slugs:
        items.append((AREA_URL(a), AREA[a]['name'], a))
        items += [(M_URL(a, m['slug']), m['name'], a) for m in MAT[a]]
    return mega(label, items, {a: _area_sub(a) for a in slugs}, card, foot=('/apply', 'Not sure? Get matched'))


def _card(key, title, text, href, link):
    return (PH.photo(key, 600), title, text, href, link)


property_dd = area_mega('Property', ['conveyancing', 'lease-extensions'],
                        _card('keys', 'Moving home?', 'One short form and a regulated conveyancer contacts you with a quote.', AREA_URL('conveyancing'), 'Conveyancing'))
family_dd = area_mega('Family', ['family-law'], _card('family-law', 'Going through a separation?', 'Speak to a family solicitor who handles your kind of matter.', AREA_URL('family-law'), 'Family law'))
immig_dd = area_mega('Immigration', ['immigration'], _card('passport', 'Introductions only', 'We introduce you to a regulated immigration adviser. We never give immigration advice.', AREA_URL('immigration'), 'How it works'))
business_dd = area_mega('Business', ['debt-recovery', 'licensing', 'trademarks'], _card('licensing', 'For businesses', 'Recover what you are owed, protect your brand or get your licence sorted.', AREA_URL('debt-recovery'), 'Debt recovery'))
near_dd = mega('Near you', [(CITY_URL(c[0]), c[1], c[0]) for c in MC.CITIES],
               {c[0]: {'head': (CITY_URL(c[0]), f'Solicitors in {c[1]}'), 'groups': [(f'In {c[1]}', [(LOC_URL(c[0], a), LOCAL_NAME[a]) for a in MC.LOCAL_AREAS])]} for c in MC.CITIES},
               None, foot=('/solicitors', 'All locations'))
about_dd = mega('About', [('/about', 'About us', 'a'), ('/how-it-works', 'How it works', 'a'), ('/legal-services', 'All legal services', 'a'), ('/guides', 'Guides', 'g'),
                          ('/how-we-make-money', 'How we make money', 'a'), ('/press', 'Press', 'a'), ('/contact', 'Contact us', 'c'), ('/complaints', 'Complaints', 'c')],
                {'a': (f'More about {BRAND}', [('/partners', 'For law firms'), ('/solicitors', 'Solicitors near you'), ('/privacy-policy', 'Privacy Policy'), ('/terms-conditions', 'Terms of Service')]),
                 'g': ('Popular guides', [(f'/guides/{g["slug"]}', g['h1']) for g in CG.GUIDES[:6]]),
                 'c': ('Get in touch', [(f'mailto:{EMAIL}', EMAIL), ('/contact', 'Contact form'), ('/accessibility', 'Accessibility')])},
                _card('desk-warm', 'An introducer, not a law firm', 'We introduce people and businesses to regulated firms. We never give legal advice.', '/how-we-make-money', 'How we make money'), foot=('/apply', 'Get matched'))
CLIENT_MENU = property_dd + family_dd + immig_dd + business_dd + near_dd + about_dd

# ---------------------------------------------------------------- law firm side
PPAGES = {d['slug']: d for d in PS.PILLARS + PS.INFO + PS.GUIDES}
_pp = lambda slugs: [(f'/partners/{s}', PPAGES[s]['nav'], 's') for s in slugs]
P_START = ('Get started', [('/partners/apply', 'Book a call'), ('/partners/pricing', 'How pricing works'), ('/partners/bespoke-campaigns', 'Bespoke campaigns'), ('/partners/faq', 'Questions and answers'), ('/contact', 'Contact the team')])
P_INFO = ['how-it-works', 'getting-started', 'lead-verification', 'lead-delivery', 'lead-quality', 'pricing']
p_how = mega('How it works', _pp(P_INFO), {'s': P_START},
             _card('partner-call', 'Exclusive enquiries, sent while fresh', 'Each lead goes to one firm only, with every answer and the consent record.', '/partners/apply', 'Book a call'), foot=('/partners/apply', 'Book a call'))
AL = PS.AREA_LEADS
p_leads = mega('Leads', [(f'/partners/{AL[a["slug"]]["slug"]}', AL[a['slug']]['kw'], a['slug']) for a in AC.AREAS],
               {a['slug']: {'head': (f'/partners/{AL[a["slug"]]["slug"]}', f'{AL[a["slug"]]["kw"]} overview'),
                            'groups': [('By matter type', [(f'/partners/{AL[a["slug"]]["slug"]}/{m["slug"]}', f'{m["name"]} leads') for m in MAT[a['slug']]])]} for a in AC.AREAS},
               None, foot=('/partners/apply', 'Become a partner firm'))
P_PILLARS = [d['slug'] for d in PS.PILLARS]
p_gen = mega('Lead generation', _pp(P_PILLARS) + [('/partners/bespoke-campaigns', 'Bespoke campaigns', 's')], {'s': ('By practice area', [(f'/partners/{AL[a["slug"]]["slug"]}', AL[a['slug']]['kw']) for a in AC.AREAS])},
             _card('campaign-plan', 'Want a campaign of your own?', 'Bespoke campaigns under your brand or run by us on your behalf.', '/partners/bespoke-campaigns', 'Bespoke campaigns'), foot=('/partners/apply', 'Become a partner firm'))
P_GUIDES = [d['slug'] for d in PS.GUIDES]
p_res = mega('Resources', [('/partners/guides', 'Guides for law firms', 'g')] + [(f'/partners/{s}', PPAGES[s]['nav'], 'g') for s in P_GUIDES] +
             [('/partners/sra-referral-rules', 'SRA referral rules', 'c'), ('/partners/data-protection', 'Data and consent', 'c'), ('/partners/faq', 'Questions and answers', 'c')],
             {'g': ('More help', [('/partners/how-it-works', 'How it works'), ('/partners/lead-quality', 'Lead quality'), ('/contact', 'Contact the team'), ('/about', f'About {BRAND}')]),
              'c': P_START},
             _card('partner-sunlit', 'Turn more enquiries into instructions', 'Practical guides on speed to lead, first calls and follow-up.', '/partners/guides', 'Read the guides'), foot=('/partners/apply', 'Become a partner firm'))
PARTNER_MENU = p_how + p_leads + p_gen + p_res
