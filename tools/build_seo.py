# SEO pages, run inside tools/build_pages.py (exec): matter pages, location pages, client guides, and the law firm pages
# (lead types by practice area and matter, lead generation pillars, how it works, guides, FAQ). No em dashes in copy.

def hero_split(h1, lead, ticks, btns, img, crumbs='', alt=''):
    li = ''.join(f'<li>{TICK}{t}</li>' for t in ticks)
    return (f'<section class="ll-pagehead ll-hero-split"><div class="ll-hero-grid"><div>{crumbs}'
            f'<h1>{h1}</h1><p class="ll-lead">{lead}</p><ul class="ll-hero-ticks">{li}</ul><div class="ll-head-btns">{btns}</div></div>'
            f'<div class="ll-hero-media"><img src="{img}" alt="{alt}" loading="eager" fetchpriority="high"/></div></div></section>')


def crumb_ld(*items):
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i, 'name': n, 'item': SITE + u} for i, (n, u) in enumerate(items, 1)]}


def link_list(links, cls='ll-linkgrid'):
    return f'<ul class="{cls}">' + ''.join(f'<li><a href="{h}">{t}{ARR}</a></li>' for h, t in links) + '</ul>'


svc_ld = lambda name, url, desc: {'@context': 'https://schema.org', '@type': 'Service', 'name': name, 'url': SITE + url, 'description': desc,
                                  'areaServed': 'GB', 'provider': {'@id': f'{SITE}/#organization'}}
IMM_NOTE = ('<p class="ll-note">Leaflegal is not regulated to give immigration advice and does not do so. Any advice about your situation comes from '
            'the regulated firm or adviser we introduce you to.</p>')
_count = {'matter': 0, 'local': 0, 'hub': 0, 'guide': 0, 'partner': 0}


def area_img(a, i=0):
    return PH.photo(PH.AREA[a][i % 2])


SHORT_NAMES = {'Settlement and indefinite leave to remain': 'Indefinite leave to remain', 'Sponsor licences for employers': 'Sponsor licences',
               'Late payment interest and compensation': 'Late payment interest', 'Taxi and private hire licences': 'Taxi licences'}


def short_name(n):
    return SHORT_NAMES.get(n, n)


# ---------------------------------------------------------------- client matter pages: /<area>/<matter>
for a_slug, matters in MAT.items():
    a = AREA[a_slug]
    os.makedirs(f'{PUB}/{a_slug}', exist_ok=True)
    imm = a_slug == 'immigration'
    for i, mt in enumerate(matters):
        url = M_URL(a_slug, mt['slug'])
        q = f'/apply?area={quote(a["form"])}'
        h1 = short_name(mt['name'])
        if a_slug in ('family-law', 'motoring-offences', 'debt-recovery', 'licensing') and not h1.endswith('s') and len(h1) < 20:
            h1 += ' solicitors'
        ticks = ['Free to use, no obligation', 'Introductions to regulated advisers only' if imm else 'One regulated firm, not a list',
                 'For businesses in England and Wales' if a.get('business_only') else 'Across the UK' if imm else 'For matters in England and Wales']
        head = hero_split(h1, mt['short'] + ' ' + ('Tell us a little about it and we will introduce you to a regulated adviser.' if imm else 'Tell us a little about it and we will introduce you to a specialist firm.'),
                          ticks, f'<a href="{q}" class="button"><div>Get matched</div></a><a href="#how" class="ll-ghost-light">How it works</a>', area_img(a_slug, i + 1), alt='')
        related = [x for x in matters if x['slug'] != mt['slug']]
        faqs = mt['faqs'] + a['faqs'][:3]
        who = 'regulated adviser' if imm else 'firm'
        glance = [('Area of law', f'<a href="{AREA_URL(a_slug)}">{a["name"]}</a>'), ('Who it is for', AREA_EXTRA[a_slug]['who']),
                  ('Who contacts you', 'One regulated immigration firm or adviser' if imm else 'One regulated law firm'),
                  ('Where', 'Across the UK' if imm else 'England and Wales'), ('Cost to use Leaflegal', 'Free, with no obligation')]
        body = ''.join([
            head, TRUST_STRIP,
            cs_intro(f'About {mt["name"].lower()}', mt['intro'] + [AREA_EXTRA[a_slug]['more']], glance, IMM_NOTE if imm else ''),
            cs_help(f'How the {who} can help', mt['help'], 'What to have ready', mt['ready'], 'Don’t worry if you don’t have everything yet. The ' + who + ' will tell you what else they need.'),
            cs_steps('How it works', a['how'], q, lead='Three simple steps, and nothing to pay us.'),
            cs_fees(a_slug, a['name']),
            cs_things(a['considerations']),
            faq(faqs, 'Ready to get started?', 'One short form. One specialist contacts you.', q, 'Get matched', title=f'{mt["name"]} questions and answers'),
            section(f'<h2 class="cs-h2 cs-center">More {a["name"].lower()} help</h2>' + cards([(a['icon'], x['name'], x['short'], M_URL(a_slug, x['slug'])) for x in related[:6]], 'three', more_label='Learn more'), cls='section cs-sec'),
            cs_guides(a_slug, AREA_GUIDES.get(a_slug, [])),
            cs_links(f'{LOCAL_NAME[a_slug]} near you', [(LOC_URL(c[0], a_slug), c[1]) for c in MC.CITIES]) if a_slug in MC.LOCAL_AREAS else '',
        ])
        title = f'{mt["name"]} {"Solicitors" if not imm else "Advisers"} | {a["name"]} | {BRAND}'
        if len(title) > 70:
            title = f'{mt["name"]} | {a["name"]} | {BRAND}'
        desc = f'{mt["short"]} Answer a few quick questions and we will introduce you to {"a regulated immigration adviser" if imm else "a regulated law firm"}. Free to use, no obligation.'
        page(f'{PUB}{url}.html', title, desc, compact(body),
             f'<link rel="canonical" href="{SITE}{url}"/>' + ld(faq_ld(faqs), svc_ld(mt['name'], url, mt['short']),
                crumb_ld(('Legal services', '/legal-services'), (a['name'], AREA_URL(a_slug)), (mt['name'], url))),
             '<script src="/assets/tabs.js?v=2"></script>', backup=False)
        _count['matter'] += 1

# ---------------------------------------------------------------- location pages: /solicitors, /solicitors/<city>, /solicitors/<city>/<area>
os.makedirs(f'{PUB}/solicitors', exist_ok=True)
for ci, (c_slug, c_name, region, nearby) in enumerate(MC.CITIES):
    os.makedirs(f'{PUB}/solicitors/{c_slug}', exist_ok=True)
    others = [c for c in MC.CITIES if c[0] != c_slug]
    for ai, a_slug in enumerate(MC.LOCAL_AREAS):
        a = AREA[a_slug]
        url = LOC_URL(c_slug, a_slug)
        q = f'/apply?area={quote(a["form"])}'
        need, angle = MC.LOCAL_ANGLE[a_slug]
        h1 = f'{LOCAL_NAME[a_slug]} in {c_name}'
        lead = f'If you are {need} in {c_name} or nearby, answer a few quick questions and we will introduce you to one regulated firm that handles your kind of matter.'
        intro = [angle.replace('local', f'{c_name}', 1) if 'local' in angle else angle,
                 f'{BRAND} introduces people and businesses in {c_name}, {nearby[0]}, {nearby[1]} and across {region} to regulated law firms. '
                 f'Many firms work remotely as well as from their offices, so you can speak to a specialist by phone or video without travelling.'] + a['intro'][:1]
        faqs = [(f'Do you only introduce firms based in {c_name}?', f'We introduce you to a firm that covers {c_name}. Some have offices nearby, and others work remotely across England and Wales. The firm will tell you how they work when they contact you.'),
                (f'Does it cost anything to use {BRAND} in {c_name}?', f'No. {BRAND} is free to use. The firm explains its own fees before you agree to anything.'),
                (f'Do you cover {nearby[0]} and {nearby[1]}?', f'Yes. We cover {c_name} and the surrounding area, including {", ".join(nearby[:-1])} and {nearby[-1]}.')] + a['faqs'][:3]
        glance = [('Area of law', f'<a href="{AREA_URL(a_slug)}">{a["name"]}</a>'), ('Who it is for', AREA_EXTRA[a_slug]['who']),
                  ('Covering', f'{c_name}, {", ".join(nearby[:-1])} and {nearby[-1]}'), ('Who contacts you', 'One regulated law firm'),
                  ('Cost to use Leaflegal', 'Free, with no obligation')]
        body = ''.join([
            hero_split(h1, lead, ['Free to use, no obligation', 'One regulated firm, not a list', f'Covering {c_name} and {region}'],
                       f'<a href="{q}" class="button"><div>Get matched</div></a><a href="#how" class="ll-ghost-light">How it works</a>', area_img(a_slug, ci + ai)),
            TRUST_STRIP,
            cs_intro(f'{a["name"]} in {c_name}', intro + [AREA_EXTRA[a_slug]['more']], glance),
            section(f'<h2 class="cs-h2 cs-center">What the firms help with</h2>' + cards([(a['icon'], x['name'], x['short'], M_URL(a_slug, x['slug'])) for x in MAT[a_slug]], 'three', more_label='Learn more'), cls='section cs-sec'),
            cs_steps('How it works', a['how'], q, lead=f'Three simple steps, wherever you are in {c_name}.'),
            cs_fees(a_slug, a['name']),
            faq(faqs, 'Ready to get started?', 'One short form. One specialist firm contacts you.', q, 'Get matched', title=f'{a["name"]} in {c_name}, questions and answers'),
            cs_links(f'{LOCAL_NAME[a_slug]} in other places', [(LOC_URL(c[0], a_slug), c[1]) for c in others]),
            cs_links(f'Other legal help in {c_name}', [(LOC_URL(c_slug, x), LOCAL_NAME[x]) for x in MC.LOCAL_AREAS if x != a_slug] + [(AREA_URL('immigration'), 'Immigration advisers (UK wide)')]),
        ])
        page(f'{PUB}{url}.html', f'{LOCAL_NAME[a_slug]} in {c_name} | {BRAND}',
             f'{LOCAL_NAME[a_slug]} in {c_name}. Answer a few quick questions and we will introduce you to a regulated firm covering {c_name} and {region}. Free, no obligation.',
             compact(body), f'<link rel="canonical" href="{SITE}{url}"/>' + ld(faq_ld(faqs), crumb_ld(('Solicitors near you', '/solicitors'), (c_name, CITY_URL(c_slug)), (a['name'], url))),
             '<script src="/assets/tabs.js?v=2"></script>', backup=False)
        _count['local'] += 1
    # city hub
    hub = ''.join([
        hero_split(f'Solicitors in {c_name}', f'Free introductions to regulated law firms covering {c_name}, {nearby[0]}, {nearby[1]} and the rest of {region}.',
                   ['Free to use, no obligation', 'One regulated firm, not a list', 'Seven areas of law'],
                   '<a href="/apply" class="button"><div>Get matched</div></a>', PH.photo('golden-street' if ci % 2 else 'street')),
        TRUST_STRIP,
        cs_intro(f'Legal help in {c_name}', [
            f'Whether you are moving home in {c_name}, going through a separation, facing a motoring charge, chasing an unpaid invoice or sorting out a licence, {BRAND} can introduce you to a regulated law firm that handles your kind of matter.',
            f'We cover {c_name}, {", ".join(nearby[:-1])}, {nearby[-1]} and the rest of {region}. Many of the firms we work with have offices in the area, and most can also work with you by phone, email or video, so you don’t need to travel.',
            'You answer a few quick questions once, instead of ringing round. We pass your enquiry to one firm, never a list, and the firm contacts you to talk through your matter and explain their fees. It is free to use and there is no obligation.'],
            [('Covering', f'{c_name} and {region}'), ('Areas of law', 'Seven, including conveyancing, family law and motoring offences'), ('Who contacts you', 'One regulated law firm'), ('Cost to use Leaflegal', 'Free, with no obligation')]),
        section(f'<h2 class="cs-h2 cs-center">Pick the help you need</h2>'
                + cards([(AREA[x]['icon'], LOCAL_NAME[x], AREA[x]['short'], LOC_URL(c_slug, x)) for x in MC.LOCAL_AREAS]
                        + [('globe', 'Immigration advisers', 'Introductions to regulated immigration advisers, wherever you are in the UK.', AREA_URL('immigration'))], 'three', more_label='Learn more'), cls='section cs-sec'),
        cs_steps('How it works', [('Tell us what you need', 'Answer a few quick questions about your matter. It takes about two minutes.'), ('We introduce one firm', f'We pass your enquiry to one regulated firm that covers {c_name} and handles your kind of matter.'), ('The firm contacts you', 'They talk through your matter and explain their fees. You decide whether to go ahead.')], '/apply', lead='Free to use, with no obligation.'),
        section(f'<h2 class="cs-h2 cs-center">Legal help in {c_name}, area by area</h2><div class="cs-things">'
                + ''.join(f'<div class="cs-thing"><h3><a href="{LOC_URL(c_slug, x)}">{LOCAL_NAME[x]}</a></h3><p>{AREA[x]["short"]} For {AREA_EXTRA[x]["who"][0].lower() + AREA_EXTRA[x]["who"][1:]}.</p></div>' for x in MC.LOCAL_AREAS) + '</div>', cls='section cs-sec'),
        cs_intro(f'Choosing a solicitor in {c_name}', [
            f'The right firm for you depends on the kind of matter you have, not just on being close by. A conveyancing firm on the high street in {c_name} may not handle a contested licence review, and a family law specialist will not usually deal with a speeding charge. That is why we ask what your matter is about before we introduce anyone.',
            'It is worth asking any firm how it charges before work starts. Many matters are handled for a fixed fee, while others are charged by the hour. A good firm will explain the likely total, what could make it change and what is included, and confirm it in writing.',
            f'You can check that a solicitor is regulated on the Solicitors Regulation Authority register, and that a licensed conveyancer is regulated by the Council for Licensed Conveyancers. Every firm we introduce in {c_name} and {region} is regulated, and you are free to decide whether to instruct them.'],
            [('Check regulation', 'SRA or CLC register'), ('Ask about fees', 'Before any work starts'), ('Meetings', 'In person, phone or video'), ('Obligation', 'None')]),
        faq(HOME_FAQ, 'Ready to get started?', 'One short form. One specialist firm contacts you.', '/apply', 'Get matched', title=f'Solicitors in {c_name}, questions and answers'),
        cs_links('Other places we cover', [(CITY_URL(c[0]), c[1]) for c in others]),
        cta(f'Find a solicitor in {c_name}', 'Answer a few quick questions and we will do the matching.', '/apply', 'Get matched'),
    ])
    page(f'{PUB}/solicitors/{c_slug}.html', f'Free Introductions to Solicitors in {c_name} | {BRAND}',
         f'Find a solicitor in {c_name} for conveyancing, family law, motoring offences, licensing, debt recovery and lease extensions. Free introductions to regulated firms.',
         compact(hub), f'<link rel="canonical" href="{SITE}{CITY_URL(c_slug)}"/>' + ld(crumb_ld(('Solicitors near you', '/solicitors'), (c_name, CITY_URL(c_slug)))), backup=False)
    _count['hub'] += 1

page(f'{PUB}/solicitors.html', f'Find a Solicitor Near You | {BRAND}',
     'Free introductions to regulated law firms in towns and cities across England and Wales. Pick your area to get started.',
     page_head('Solicitors near you', 'We introduce people and businesses to regulated law firms across England and Wales. Pick a place to see the help available.')
     + TRUST_STRIP + section(link_list([(CITY_URL(c[0]), c[1]) for c in MC.CITIES]))
     + section(title_block('By area of law') + area_cards())
     + cta('Not sure where to start?', 'Answer a few quick questions and we will do the matching.', '/apply', 'Get matched'), backup=False)

# ---------------------------------------------------------------- client guides: /guides, /guides/<slug>
os.makedirs(f'{PUB}/guides', exist_ok=True)
for gd in CG.GUIDES:
    a = AREA[gd['area']]
    aside = (f'<aside class="ll-doc-aside"><div class="ll-gside ll-gside-cta"><h2>Need {a["name"].lower()} help?</h2><p>Answer a few quick questions and we will introduce you to {"a regulated adviser" if gd["area"] == "immigration" else "a specialist firm"}.</p>'
             f'<a href="/apply?area={quote(a["form"])}" class="button">Get matched</a></div>'
             f'<div class="ll-gside"><h2>{a["name"]}</h2><ul>' + ''.join(f'<li><a href="{M_URL(gd["area"], m["slug"])}">{m["name"]}</a></li>' for m in MAT[gd['area']][:6]) + '</ul></div></aside>')
    ex = CG.EXTRA[gd['slug']]
    blocks = gd['blocks'] + ex['more'] + ([('p', IMM_NOTE[19:-4])] if gd['area'] == 'immigration' else []) + [('p', 'This guide is general information, not legal advice. A solicitor can advise on your situation.')]
    key = '<div class="cs-key"><p class="cs-glance-h">Key points</p><ul>' + ''.join(f'<li><span class="cs-tick">{_CHECK}</span>{k}</li>' for k in ex['key']) + '</ul></div>'
    gq = f'/apply?area={quote(a["form"])}'
    ghead = hero_split(gd['h1'], gd['lead'], ['Plain English', 'General information, not advice', f'About {a["name"].lower()}'],
                       f'<a href="{gq}" class="button"><div>Get matched</div></a><a href="/guides" class="ll-ghost-light">All guides</a>', area_img(gd['area'], CG.GUIDES.index(gd)),
                       crumbs='<nav class="ll-crumbs" aria-label="Breadcrumb"><a href="/guides">Guides</a><span>/</span><span>' + a['name'] + '</span></nav>')
    more_g = [x for x in CG.GUIDES if x['slug'] != gd['slug']][:3]
    page(f'{PUB}/guides/{gd["slug"]}.html', gd['title'], gd['desc'],
         ghead + f'<section class="ll-docsec"><div class="ll-doc-wrap">{key[:0]}<div class="cs-docmain">{key}{blocks_html(blocks)}</div>{aside}</div></section>'
         + cs_fees(gd['area'], a['name']) + cs_things(a['considerations'])
         + cs_steps('Need help with your own matter?', a['how'], gq, lead='We introduce you to one regulated firm. Free to use, with no obligation.')
         + section('<h2 class="cs-h2 cs-center">More guides</h2><div class="ll-ggrid cs-gg">' + ''.join(f'<a class="ll-pcard" href="/guides/{x["slug"]}"><img src="{area_img(x["area"], i)}" alt="" loading="lazy"/><div><span class="ll-gcat">{AREA[x["area"]]["name"]}</span><b>{x["h1"]}</b><p>{x["lead"]}</p></div></a>' for i, x in enumerate(more_g)) + '</div>', cls='section cs-sec'),
         f'<link rel="canonical" href="{SITE}/guides/{gd["slug"]}"/>', backup=False)
    _count['guide'] += 1
_gcards = ''.join(f'<a class="ll-pcard" href="/guides/{gd["slug"]}"><img src="{area_img(gd["area"], i)}" alt="" loading="lazy"/><div><span class="ll-gcat">{AREA[gd["area"]]["name"]}</span><b>{gd["h1"]}</b><p>{gd["lead"]}</p></div></a>' for i, gd in enumerate(CG.GUIDES))
page(f'{PUB}/guides.html', f'Legal Guides for Property, Family, Immigration and More | {BRAND}',
     'Plain English guides to conveyancing, leasehold, divorce, choosing an immigration adviser and motoring hearings. General information, not legal advice.',
     page_head('Guides', 'Plain English guides to common legal questions. General information, not legal advice.') + f'<section class="ll-docsec"><div class="ll-guides"><div class="ll-ggrid">{_gcards}</div></div></section>'
     + cta('Need help with your matter?', 'Answer a few quick questions and we will introduce you to a specialist.', '/apply', 'Get matched'), backup=False)

# ---------------------------------------------------------------- law firm pages
PH_POOL = [PH.photo(k) for k in PH.PARTNER]  # generic law firm pages; practice area lead pages use their area's own photos (owner 2026-11-21)
_ph = [0]


def ph_hero(h1, lead, ticks=None, btns=None, img=None):
    img = img or PH_POOL[_ph[0] % len(PH_POOL)]
    _ph[0] += 1
    return hero_split(h1, lead, ticks or ['Exclusive, with each enquiry sent to one firm', 'Pre-screened, with paid help confirmed', 'Sent to your inbox or CRM while fresh'],
                      btns or '<a href="/partners/apply" class="button"><div>Become a partner firm</div></a><a href="/partners/how-it-works" class="ll-ghost-light">How it works</a>', img)


def seo_blocks(blocks):
    return ''.join(f'<p>{b}</p>' if isinstance(b, str) else '<ul>' + ''.join(f'<li>{x}</li>' for x in b['list']) + '</ul>' for b in blocks)


P_DISC = ('<p class="ll-disclaimer">Leaflegal is a trading name of Vertical Brands Ltd and an introducer, not a law firm. It is not regulated by the SRA and does not '
          'give legal or immigration advice. Partner firms are responsible for their own regulatory position.</p>')
P_SIDE_CTA = ('<div class="ll-gside ll-gside-cta"><h2>Start receiving enquiries</h2><p>Book a 30-minute call with our team. See a sample lead before you commit.</p>'
              '<a href="/partners/apply" class="button">Become a partner firm</a></div>')


import cfb_legal as _cfb
CFB = _cfb.parts(ICON, TICK, LC)


P_WHY = ('<section class="cfb-sec cfb-anat"><div class="cfb-wrap"><div class="cfb-head"><h2>Why law firms work with Leaflegal</h2><p>Enquiries that are worth calling, on terms that suit your firm.</p></div><div class="cfb-anat-grid"><ol class="cfb-points">' + ''.join(f'<li><b>{t}</b><p>{d}</p></li>' for t, d in [
    ('One firm per enquiry', 'Every enquiry goes to one firm only. You are never racing three other practices to the same phone number.'),
    ('Clients who want paid help', 'We screen out people looking only for free advice or legal aid, so your fee earners spend time on work they can take on.'),
    ('Your areas, your matters', 'Choose the practice areas, matter types and locations you want. Change them whenever your capacity changes.'),
    ('Compliant introductions', 'Clients are told we are an introducer paid by the firms we work with, and you receive the consent wording with every lead.'),
    ('Fast delivery', 'Leads reach your inbox or CRM as soon as they are checked, while the client is still expecting a call.'),
    ('No long contracts', 'A monthly minimum of 10 leads and the freedom to pause. If leads do not work for you, you are not tied in.'),
]) + '</ol></div></div></section>')


def p_related(url):
    g = [d for d in PS.GUIDES if f'/partners/{d["slug"]}' != url][:3]
    return ('<section class="cfb-sec cfb-anat"><div class="cfb-wrap"><div class="cfb-head"><h2>Guides for law firms</h2></div><div class="ll-ggrid cs-gg">' + ''.join(
        f'<a class="ll-pcard" href="/partners/{d["slug"]}"><img src="{PH_POOL[i % len(PH_POOL)]}" alt="" loading="lazy"/><div><span class="ll-gcat">Guide for law firms</span><b>{d["h1"]}</b><p>{d["summary"]}</p></div></a>' for i, d in enumerate(g)) + '</div></div></section>')


def partner_page(url, d, side_title, side_links, crumbs, extra_top='', img=None, lead_page=False):
    cur = ' aria-current="page"'
    side = ''.join(f'<li><a href="{h}"{cur if h == url else ""}>{t}</a></li>' for h, t in side_links)
    body = (ph_hero(d['h1'], re.split(r'(?<=[.])\s', d['summary'], maxsplit=1)[0], img=img) + CFB['factbar'] + extra_top
            + '<section class="ll-docsec"><div class="ll-guide-wrap"><article><div class="ll-doc">'
            + f'<p><b>{d["summary"]}</b></p>' + ''.join(f'<h2>{h2}</h2>{seo_blocks(bl)}' for h2, bl in d['sections']) + '</div>' + P_DISC
            + f'</article><aside>{P_SIDE_CTA}<div class="ll-gside"><h2>{side_title}</h2><ul>{side}</ul></div></aside></div></section>'
            + CFB['anatomy'] + P_WHY + p_related(url) + CFB['how']
            + faq(d['faqs'], 'Prefer to talk first?', 'Book a call with our team.', '/partners/apply', 'Book a call')
            + cta(d['cta_h2'], 'Book a 30-minute call and see a sample lead.', '/partners/apply', 'Become a partner firm'))
    os.makedirs(os.path.dirname(f'{PUB}{url}.html'), exist_ok=True)
    page(f'{PUB}{url}.html', d['title'], d['description'], body,
         '<link href="/assets/cfb.css?v=17" rel="stylesheet"/>' + f'<link rel="canonical" href="{SITE}{url}"/>' + ld(org_ld, svc_ld(d['h1'], url, d['description']), faq_ld(d['faqs']), crumb_ld(('Law firms', '/partners'), *crumbs, (d['h1'], url))),
         header='PARTNERS_HEADER', backup=False)
    _count['partner'] += 1


for d in PS.PILLARS:
    partner_page(f'/partners/{d["slug"]}', d, 'Lead generation', [(f'/partners/{s}', PPAGES[s]['nav']) for s in P_PILLARS], [])
for d in PS.INFO:
    partner_page(f'/partners/{d["slug"]}', d, 'How it works', [(f'/partners/{s}', PPAGES[s]['nav']) for s in P_INFO + ['sra-referral-rules', 'data-protection']], [])
for d in PS.GUIDES:
    partner_page(f'/partners/{d["slug"]}', d, 'Guides', [(f'/partners/{s}', PPAGES[s]['nav']) for s in P_GUIDES], [('Guides', '/partners/guides')])

# practice area lead pages and matter lead pages
LC_AREA = {s: x for s, x in zip(['conveyancing', 'immigration', 'family-law', 'debt-recovery', 'motoring-offences', 'licensing', 'lease-extensions'], LC.AREAS)}
_lead_faq = [qa for _, qas in LC.FAQ_GROUPS for qa in qas]
for a in AC.AREAS:
    s = a['slug']
    al = AL[s]
    ic, nm, short, detail, typical = LC_AREA[s]
    base = f'/partners/{al["slug"]}'
    mlinks = [(f'{base}/{m["slug"]}', f'{m["name"]} leads') for m in MAT[s]]
    d = {'h1': al['kw'], 'title': f'{al["kw"]} for Solicitors | Exclusive, Pay Per Lead | {BRAND}',
         'description': f'{al["kw"]} for UK law firms. Exclusive, pre-screened {nm.lower()} enquiries, sent to one firm only. Pay per lead, minimum 10 a month.',
         'summary': f'{BRAND} generates exclusive {nm.lower()} enquiries from people and businesses who have asked to speak to a solicitor. {short}',
         'sections': [(f'What {nm.lower()} enquiries look like', [detail]),
                      ('What’s in every lead', [{'list': al['fields'] + ['Verified UK mobile and email', 'Recorded consent to be contacted']}]),
                      ('Matter types you can choose', ['Choose the matters you want and leave out the ones you don’t.', {'list': [f'<a href="{h}">{t}</a>' for h, t in mlinks]}]),
                      ('Who these leads suit', [al['suits'], al['reg']]),
                      ('Pricing and volume', [LC.PRICING[0], LC.PRICING[2]])],
         'faqs': [(f'Are {nm.lower()} leads exclusive?', 'Yes. Each enquiry goes to one firm only and is never resold.'),
                  (f'Can I choose locations for {nm.lower()} leads?', 'Yes. Tell us the towns, counties or regions you cover, or national.')] + _lead_faq[6:9],
         'cta_h2': f'Ready for exclusive {nm.lower()} leads?'}
    partner_page(base, d, 'Leads by practice area', [(f'/partners/{AL[x["slug"]]["slug"]}', AL[x['slug']]['kw']) for x in AC.AREAS], [('Leads', '/partners/lead-generation-for-law-firms')], img=PH.photo(PH.AREA[s][0]), lead_page=True)
    for m in MAT[s]:
        u = f'{base}/{m["slug"]}'
        md = {'h1': f'{short_name(m["name"])} leads',
              'title': f'{m["name"]} Leads for Law Firms | {BRAND}',
              'description': f'Exclusive {m["name"].lower()} leads for UK law firms. Pre-screened enquiries, sent to one firm only. Pay per lead.',
              'summary': f'Exclusive {m["name"].lower()} enquiries from people who have asked to speak to {"a regulated adviser" if s == "immigration" else "a solicitor"}. {m["firm"]}',
              'sections': [('What the client is looking for', [m['short'], m['intro'][0]]),
                           ('What the client expects from you', [{'list': m['help']}]),
                           ('What’s in every lead', [{'list': al['fields'] + ['Verified UK mobile and email', 'Recorded consent to be contacted']}]),
                           ('Compliance', [al['reg'], 'Every client is told Leaflegal is an introducer paid by the firms it introduces, and we send you the consent wording with each lead.']),
                           ('Pricing', ['Pay per lead at a price agreed with you. The minimum is 10 leads a month across your chosen matters, and you can pause at any time.'])],
              'faqs': [(f'Can I receive only {m["name"].lower()} leads?', f'Yes, you can choose {m["name"].lower()} on its own or alongside other {nm.lower()} matters, subject to the monthly minimum.'),
                       ('Are these leads shared?', 'No. Each enquiry goes to one firm only.'),
                       ('How quickly do leads arrive?', 'As soon as the enquiry is checked, so you can call while it is fresh.')],
              'cta_h2': f'Get {m["name"].lower()} leads for your firm'}
        partner_page(u, md, f'{al["kw"]} by matter', mlinks, [('Leads', '/partners/lead-generation-for-law-firms'), (al['kw'], base)], lead_page=True, img=PH.photo(PH.AREA[s][len(mlinks) and [x for x, _ in mlinks].index(u) % 2]))

# partner guides hub and FAQ
_pg = ''.join(f'<a class="ll-pcard" href="/partners/{d["slug"]}"><img src="{PH_POOL[i % len(PH_POOL)]}" alt="" loading="lazy"/><div><span class="ll-gcat">Guide for law firms</span><b>{d["h1"]}</b><p>{d["summary"]}</p></div></a>' for i, d in enumerate(PS.GUIDES))
page(f'{PUB}/partners/guides.html', f'Guides for Law Firms on Converting Legal Enquiries | {BRAND}',
     'Practical guides for solicitors on speed to lead, first call scripts, converting and following up legal enquiries, and marketing by practice area.',
     page_head('Guides for law firms', 'Practical help for turning legal enquiries into instructions.') + f'<section class="ll-docsec"><div class="ll-guides"><div class="ll-ggrid">{_pg}</div></div></section>'
     + cta('Ready for exclusive enquiries?', 'Book a call and see a sample lead.', '/partners/apply', 'Become a partner firm'),
     f'<link rel="canonical" href="{SITE}/partners/guides"/>', header='PARTNERS_HEADER', backup=False)
page(f'{PUB}/partners/faq.html', f'Questions and Answers for Law Firms | {BRAND}',
     'Answers for solicitors about Leaflegal leads, covering exclusivity, matching, pricing, delivery, compliance and lead quality.',
     page_head('Questions and answers', 'Everything firms ask about Leaflegal leads.') + section(faq_tabs(LC.FAQ_GROUPS), cls='section ll-compact')
     + cta('Still have a question?', 'Book a call with our team.', '/partners/apply', 'Book a call'),
     f'<link rel="canonical" href="{SITE}/partners/faq"/>' + ld(faq_ld(LC.FAQ)), '<script src="/assets/tabs.js?v=2"></script>', header='PARTNERS_HEADER', backup=False)
print('seo pages', _count)
