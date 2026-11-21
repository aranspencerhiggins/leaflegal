# Builds the redesigned homepage, Partners and About pages from the site's own shell (head, footer, scripts)
# and theme sections, and puts the shared nav on every page.  Run from ~/loanleaf-site:  python3 tools/build_pages.py
import glob, os, re
from urllib.parse import quote

PUB = 'public'
os.makedirs('backup', exist_ok=True)


def asset(key):
    """Full /assets path for a file whose name contains `key` (largest rendition)."""
    hits = [f for f in os.listdir(f'{PUB}/assets') if key in f and '-p-' not in f]
    assert hits, key
    return '/assets/' + sorted(hits, key=len)[0]


I = lambda d: f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'
ICON = {
    'growth': I('<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>'),
    'cash': I('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'),
    'equip': I('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'),
    'stock': I('<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),
    'property': I('<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6M9 10h.01M15 10h.01"/>'),
    'refi': I('<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>'),
    'tax': I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h4"/>'),
    'other': I('<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>'),
    'user': I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    'shield': I('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    'chart': I('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'),
    'link': I('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
    'phone': I('<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>'),
    'doc': I('<path d="M9 12l2 2 4-4"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>'),
    'clock': I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    'eye': I('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    'target': I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    'globe': I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    'heart': I('<path d="M12 20s-7-4.5-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.5-9 9-9 9z"/>'),
    'scroll': I('<path d="M8 3h11v14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-1h11v1a3 3 0 0 0 3 3"/><path d="M8 3a3 3 0 0 0-3 3v10M11 8h5M11 12h5"/>'),
    'briefcase': I('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'),
    'car': I('<path d="M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M3 17v-5l2-5h14l2 5v5M3 12h18"/>'),
    'scale': I('<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>'),
    'key': I('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>'),
    'pin': I('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
}
TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'
CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>'
ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'


def checks(items, white=False):
    icon = asset('interface-icon-checkmark-white.svg' if white else 'interface-icon-checkmark.svg')
    border = ' white-border' if white else ''
    return '<div class="check-list">' + ''.join(
        f'<div class="check-item"><div class="check-circle{border}"><img src="{icon}" alt="" class="check-circle-icon"/></div><div>{t}</div></div>'
        for t in items) + '</div>'


# homepage card title -> matching option in the form's purpose step
PURPOSE = {'Growth and expansion': 'Growth and expansion', 'Cash flow': 'Cash flow', 'Equipment and vehicles': 'Equipment or vehicles',
           'Stock and inventory': 'Stock and inventory', 'Commercial property': 'Commercial property', 'Refinancing': 'Refinance existing debt',
           'Tax and VAT bills': 'Tax or VAT bill', 'Something else': 'Something else'}


def cards(items, cls='', more_label='Get a quote'):
    """items: (icon, title, text, href or None)"""
    out = []
    for ic, t, d, href in items:
        tag, attr = ('a', f' href="{href}"') if href else ('div', '')
        if href and t in PURPOSE: attr += f' data-purpose="{PURPOSE[t]}"'
        more = f'<span class="ll-more">{more_label} {ARROW}</span>' if href else ''
        out.append(f'<{tag} class="ll-card"{attr}><span class="ll-card-ico">{ICON[ic]}</span><b>{t}</b><p>{d}</p>{more}</{tag}>')
    return f'<div class="ll-cards {cls}">' + ''.join(out) + '</div>'


def process(steps, cta_href, cta_label, title='How it works'):
    arrow1, arrow2 = asset('process-arrow.svg'), asset('process-arrow-2.svg')
    (a, b, c) = steps
    return f'''<section class="section"><div class="container---main"><div class="vertical-section-content reduced-gap">
<h2 class="heading-two">{title}</h2>
<div class="process-wrapper">
<div class="process-step align-top-right"><div class="process-box step-1"><div class="process-number-circle"><div class="heading-four">1</div></div><div class="process-box-text"><div class="heading-four">{a}</div></div></div><img src="{arrow1}" alt="" class="process-arrow step-1"/></div>
<div class="process-box large-box"><div class="process-number-circle"><div class="heading-four">2</div></div><div class="process-box-text"><div class="heading-four">{b}</div></div></div>
<div class="process-step align-bottom-left"><img src="{arrow2}" alt="" class="process-arrow step-3"/><div class="process-box bg-base-100"><div class="process-number-circle"><div class="heading-four text-base-100">3</div></div><div class="process-box-text"><div class="heading-four">{c}</div></div></div></div>
</div><a href="{cta_href}" class="button w-inline-block"><div>{cta_label}</div></a></div></div></section>'''


def faq(qas, cta_title, cta_text, cta_href, cta_label, title='Questions'):
    chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
    items = ''.join(f'<details class="ll-faq"><summary class="large-text bold-text">{q}{chev}</summary><div class="ll-faq-a">{a}</div></details>' for q, a in qas)
    return f'''<section class="section" id="faq"><div class="container---main"><div class="vertical-section-content reduced-gap align-left-desktop">
<h2 class="heading-two">{title}</h2><div class="faq-wrapper">{items}</div>
<div class="faq-cta"><div class="heading-four">{cta_title}</div><div class="large-text">{cta_text}</div><a href="{cta_href}" class="button bg-base-50 w-inline-block"><div>{cta_label}</div></a></div>
</div></div></section>'''


GRAD = '<div class="ll-grad-bg" aria-hidden="true"></div>'
grad = lambda ui='': GRAD + (f'<div class="ll-grad-visual" aria-hidden="true">{ui}</div>' if ui else '')


def photo_box(img, inner, cls='section', visual='', photo=False, alt=''):
    bg = f'<img src="{img}" loading="lazy" alt="{alt}" class="photo-section-background-image"/>' if photo else grad(visual)
    return f'''<section class="{cls}"><div class="photo-section-image-wrapper">{bg}</div>
<div class="container---main"><div class="photo-section-box"><div class="section-box-contents">{inner}</div></div></div></section>'''


def split(img, inner, flip=False, alt=''):
    media = img if img.startswith('<') else f'<img src="{img}" loading="lazy" alt="{alt}"/>'
    return f'<div class="ll-split{" flip" if flip else ""}"><div class="ll-split-media{" ui" if img.startswith("<") else ""}">{media}</div><div>{inner}</div></div>'


def section(inner, cls='section'):
    return f'<section class="{cls}"><div class="container---main"><div class="vertical-section-content">{inner}</div></div></section>'


def cta(title, text, href, label):
    return section(f'<div class="ll-cta"><h2 class="heading-two">{title}</h2><div class="large-text serif-typeface">{text}</div><a href="{href}" class="button w-inline-block"><div>{label}</div></a></div>')


# ---------------------------------------------------------------- shell + nav
NAV_LINKS = [('/#how-it-works', 'How it works', 'how'), ('/partners', 'For brokers', 'partners'), ('/about', 'About', 'about'), ('/contact', 'Contact', 'contact')]


def nav(active=''):
    cur = ' aria-current="page"'
    links = ''.join(f'<a href="{h}"{cur if k == active else ""}>{t}</a>' for h, t, k in NAV_LINKS)
    cta_href = '#quote' if active == 'home' else '/apply'
    return f'''<header class="ll-nav"><div class="ll-nav-in"><a href="/" class="ll-nav-logo" aria-label="Loanleaf home"><img src="{asset('Loanleaf_Logo_Deep_Green')}" width="150" alt="Loanleaf"/></a>
<button type="button" class="ll-nav-toggle" aria-expanded="false" aria-controls="ll-nav-links" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
<nav class="ll-nav-links" id="ll-nav-links">{links}<a href="{cta_href}" class="button w-inline-block"><div>Get a quote</div></a></nav></div></header>'''


NAV_JS = '<script src="/assets/nav.js?v=3"></script>'
NAV_RE = re.compile(r'(<div class="announcement-bar">.*?</div></div></div>)?<div class="navbar-wrapper">.*?class="nav-menu-close"/></div>|<header class="ll-nav">.*?</header>|<header class="llb-head">.*?</header>', re.S)
ACTIVE = {'index.html': 'home', 'partners.html': 'partners', 'about.html': 'about', 'contact.html': 'contact'}


FOOT_LOANS = [('Growth and expansion', 'Growth and expansion'), ('Cash flow', 'Cash flow'), ('Equipment and vehicles', 'Equipment or vehicles'),
              ('Commercial property', 'Commercial property'), ('Refinancing', 'Refinance existing debt'), ('Tax and VAT bills', 'Tax or VAT bill')]


NOTE = 'Loanleaf is a trading name of Vertical Brands Ltd. We are not authorised or regulated by the Financial Conduct Authority. We are an introducer, not a lender or a broker, and we do not give financial advice. We only introduce UK limited companies and limited liability partnerships to specialist commercial finance brokers. Any figures shown by our business loan calculator or elsewhere on this website are illustrative only, do not constitute an offer of finance and are subject to the lender’s own assessment, underwriting and credit approval. We receive a fee from the broker we introduce you to. Using Loanleaf is free for you, and brokers and lenders may charge their own fees or receive commission, which they must explain before you proceed. Finance is subject to status.'
COPY = '© 2026 Vertical Brands Ltd. Loanleaf is a trading name of Vertical Brands Ltd, registered in England and Wales, company number 14254961. VAT number GB425344608. Registered office: 20–22 Wenlock Road, London, N1 7GU.'


def footer_html(strip=True, minimal=False):
    col = lambda title, links: f'<div class="llf-col"><h2>{title}</h2><ul>' + ''.join(f'<li><a href="{h}"{a}>{t}</a></li>' for t, h, a in links) + '</ul></div>'
    loans = [(l['name'], f'/business-loans/{l["slug"]}', '') for l in _LN.LOANS[:6]] + [('All business loans', '/business-loans', '')]
    res = [('Business loan calculator', '/business-loan-calculator', ''), ('Guides', '/guides', ''), *([('Blog', '/blog', '')] if os.path.exists('tools/blog_content.py') else []), ('Growth Guarantee Scheme', '/guides/growth-guarantee-scheme', ''), ('How it works', '/how-it-works', ''), ('Questions and answers', '/#faq', '')]
    comp = [('About us', '/about', ''), ('For brokers', '/partners', ''), ('How we make money', '/how-we-make-money', ''), ('Press', '/press', ''), ('Contact', '/contact', '')]
    legal = [('Terms of Service', '/terms-conditions', ''), ('Privacy Policy', '/privacy-policy', ''), ('Cookie Policy', '/cookie-policy', ''), ('Complaints', '/complaints', ''), ('Accessibility', '/accessibility', ''), ('Cookie settings', '#', ' data-cookie-settings')]
    cta_strip = f"""<div class="llf-cta"><div class="llf-in"><div><h2>Find the right business loan</h2><p>Answer a few quick questions and we'll match you with a specialist broker.</p></div>
<div class="llf-cta-btns"><a href="/apply" class="button"><div>Get a quote</div></a><a href="/partners" class="llf-ghost">I'm a broker</a></div></div></div>""" if strip else ''
    if minimal:  # ad landing page: the legal text and legal links only, nothing else to click away to
        return f"""<footer class="llf llf-lp"><div class="llf-base"><div class="llf-in">
<p class="llf-note">{NOTE}</p>
<p class="llf-lp-links">{' · '.join(f'<a href="{h}"{a}>{t}</a>' for t, h, a in [('For partners', '/partners', ''), *legal])}</p>
<p>{COPY}</p>
</div></div></footer>"""
    return f"""<footer class="llf">{cta_strip}
<div class="llf-main"><div class="llf-in">
<div class="llf-brand"><a href="/" aria-label="Loanleaf home"><img src="{asset('Loanleaf_Logo_White')}" width="170" alt="Loanleaf" loading="lazy"/></a>
<p>Business loans for UK limited companies and LLPs, matched to a specialist broker.</p><a class="llf-mail" href="mailto:hello@loanleaf.co">hello@loanleaf.co</a></div>
{col('Business loans', loans)}{col('Resources', res)}{col('Company', comp)}{col('Legal', legal)}
</div></div>
<div class="llf-base"><div class="llf-in">
<p class="llf-note">{NOTE}</p>
<p>{COPY}</p>
</div></div></footer>"""


FOOT_RE = re.compile(r'<div class="footer">.*?(?=<script)|<footer class="llf">.*?</footer>', re.S)


OG_IMG = '<meta property="og:image" content="https://loanleaf.co/assets/og-default.png"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta name="twitter:image" content="https://loanleaf.co/assets/og-default.png"/>'


def with_nav(h, page, header=None):
    keep_bar = page != 'index.html'
    if 'og:image' not in h:
        h = h.replace('</head>', OG_IMG + '</head>', 1)
    def sub(m):
        bar = (m.group(1) or '') if keep_bar else ''
        return header if header else bar + header_b(page)
    h = NAV_RE.sub(sub, h, count=1)
    h = re.sub(r'<nav class="ll-crumbs"[^>]*>.*?</nav>', '', h, flags=re.S)  # no visible breadcrumbs (owner); BreadcrumbList JSON-LD stays
    h = FOOT_RE.sub(lambda m: footer_html(strip=page not in ('apply.html', 'business-finance.html', 'partners.html'), minimal=header is not None and 'llb-lp' in header), h, count=1)  # form-only pages: no CTA strip
    if 'assets/masthead.css' in h:  # bump the version in place: stylesheet order matters (apply.css overrides the header on form pages)
        h = re.sub(r'/assets/masthead\.css\?v=\d+', '/assets/masthead.css?v=24', h)
    else:
        h = h.replace('</head>', '<link href="/assets/masthead.css?v=24" rel="stylesheet"/></head>', 1)
    h = re.sub(r'<script src="/assets/masthead\.js[^"]*"></script>', '', h)
    h = h.replace('</body>', '<script src="/assets/masthead.js?v=6"></script></body>', 1)
    if 'assets/site.css' not in h:
        h = h.replace('</head>', '<link href="/assets/site.css?v=38" rel="stylesheet"/></head>', 1)
    h = re.sub(r'<script src="/assets/nav\.js[^"]*"></script>', '', h)
    h = h.replace('</body>', NAV_JS + '</body>', 1)
    return h


SHELL = open('backup/contact.html' if os.path.exists('backup/contact.html') else f'{PUB}/contact.html').read()  # original page shell (contact.html is now generated)


def page(path, title, desc, body, extra_head='', extra_js='', header=None, backup=True):
    h = SHELL
    s = h.index('<section')
    e = h.index('<footer class="llf">') if '<footer class="llf">' in h else h.index('<div class="footer"')
    h = h[:s] + body + h[e:]
    h = re.sub(r'<title>[^<]*</title>', f'<title>{title}</title>', h)
    # replace any existing title/description meta with one complete, consistent set
    h = re.sub(r'<meta [^>]*(?:name|property)="(?:description|og:title|og:description|og:type|twitter:title|twitter:description|twitter:card)"[^>]*/?>', '', h)
    meta = (f'<meta name="description" content="{desc}"/><meta property="og:title" content="{title}"/><meta property="og:description" content="{desc}"/>'
            f'<meta property="og:type" content="website"/><meta name="twitter:card" content="summary_large_image"/>'
            f'<meta name="twitter:title" content="{title}"/><meta name="twitter:description" content="{desc}"/>')
    h = h.replace('</title>', '</title>' + meta, 1)
    h = h.replace(' aria-current="page" class="large-text footer-link w--current"', ' class="large-text footer-link"')
    h = h.replace('</head>', extra_head + '</head>', 1).replace('</body>', extra_js + '</body>', 1)
    name = os.path.basename(path)
    if backup and os.path.exists(path) and not os.path.exists(f'backup/{name}'):
        os.rename(path, f'backup/{name}')
    if header in ('PARTNERS_HEADER', 'LEGAL_HEADER') or path.endswith('/partners.html'):  # partner pages (brokers + law firms) get Chatra live chat; business pages don't
        h = h.replace('</body>', '<script src="/assets/chatra.js?v=1" defer></script></body>', 1)
    if header == 'PARTNERS_HEADER' or path.endswith('/partners.html'):  # broker pages: "Become a partner" opens the form in a pop-up
        h = h.replace('</body>', '<script src="/assets/partner-popup.js?v=6" defer></script></body>', 1)
    if '/partners' in path:  # partner (broker) side of the site: dark, deep-green theme
        h = h.replace('<body', '<body data-theme="partner"', 1).replace('</head>', '<link href="/assets/partners-dark.css?v=23" rel="stylesheet"/></head>', 1)
    if header == 'PARTNERS_HEADER':
        header = header_b('partners.html')
    elif header == 'LEGAL_HEADER':
        header = header_b('legal')
    open(path, 'w').write(with_nav(h, name, header))


TRUST = [('shield', 'Free to use', 'No fees for businesses, ever'), ('clock', 'About a minute', 'One short form, plain English'),
         ('user', 'Specialist brokers', 'Matched to your type of finance'), ('doc', 'Your data protected', 'Only shared with your consent')]
TRUST_STRIP = ('<section class="ll-trust" aria-label="Why Loanleaf"><div class="ll-trust-in">' + ''.join(
    f'<div class="ll-trust-item"><span class="ll-trust-ico">{ICON[ic]}</span><div><b>{t}</b><span>{d}</span></div></div>' for ic, t, d in TRUST) + '</div></section>')

_okk = '<span class="ll-ui-ok">' + TICK + '</span>'
UI_MATCH = f'''<div class="ll-ui" aria-hidden="true"><div class="ll-ui-card">
<div class="ll-ui-head"><b>Your broker match</b><span class="ll-ui-pill">Matched {TICK}</span></div>
<dl class="ll-ui-grid"><div><dt>Specialist in</dt><dd>Equipment finance</dd></div><div><dt>Business loan</dt><dd>£150,000</dd></div>
<div><dt>For</dt><dd>New machinery</dd></div><div><dt>Business</dt><dd>Limited company</dd></div>
<div class="full"><dt>Next step</dt><dd>Your broker calls to talk through options {_okk}</dd></div></dl></div></div>'''
UI_ABOUT = f'''<div class="ll-ui" aria-hidden="true"><div class="ll-ui-card">
<div class="ll-ui-head"><b>Loanleaf</b><span class="ll-ui-pill">Introduction service</span></div>
<dl class="ll-ui-grid"><div><dt>Cost to you</dt><dd>Free {_okk}</dd></div><div><dt>Obligation</dt><dd>None {_okk}</dd></div>
<div><dt>We are</dt><dd>An introducer</dd></div><div><dt>We are not</dt><dd>A lender or broker</dd></div>
<div class="full"><dt>Run by</dt><dd>Vertical Brands Ltd, company 14254961</dd></div></dl></div></div>'''
UI_CALC = f'''<div class="ll-ui" aria-hidden="true"><div class="ll-ui-card">
<div class="ll-ui-head"><b>Illustrative example</b><span class="ll-ui-pill">10% a year</span></div>
<dl class="ll-ui-grid"><div><dt>Borrow</dt><dd>£100,000</dd></div><div><dt>Over</dt><dd>5 years</dd></div>
<div><dt>Monthly</dt><dd>£2,124.70</dd></div><div><dt>Total repaid</dt><dd>£127,482.27</dd></div>
<div class="full"><dt>Your rate</dt><dd>Depends on the lender and your business</dd></div></dl></div></div>'''


# ---------------------------------------------------------------- homepage
FORM = '''<div class="ap-card" id="ap"><div class="ap-head"><div class="ap-meta"><button type="button" class="ap-back">&larr; Back</button><span class="ap-count" aria-live="polite"></span></div><div class="ap-bar" role="presentation"></div></div>
<div class="ap-body"><noscript><p>Please enable JavaScript, or email <a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a>.</p></noscript></div></div>'''

home = f'''
<section class="ll-hero" id="quote">
<div class="ll-hero-in"><div>
<h1>Business finance, matched to you</h1>
<p class="ll-lead">Tell us what your business needs and we'll introduce you to a specialist finance broker.</p>
<ul class="ll-hero-points"><li>{TICK}Loans from £5,000 to £2m+</li><li>{TICK}Free to use, no obligation</li><li>{TICK}For UK limited companies and LLPs</li></ul>
</div>{FORM}</div></section>
{TRUST_STRIP}
<!--HOME-REST-->
<!--EXPLORE-->{section(f"""<div class="ll-section-title"><h2 class="heading-two">Funding for whatever comes next</h2><div class="large-text serif-typeface">Whatever you need it for, start with one short form.</div></div>
{cards([
  ('growth', 'Growth and expansion', 'Hiring, new premises, marketing or a bigger contract.', '#quote'),
  ('cash', 'Cash flow', 'Working capital to cover gaps between paying out and getting paid.', '#quote'),
  ('equip', 'Equipment and vehicles', 'Machinery, technology or a fleet, without paying all up front.', '#quote'),
  ('stock', 'Stock and inventory', 'Buy in bulk or get ready for your busy season.', '#quote'),
  ('property', 'Commercial property', 'Buy, build or refurbish premises for your business.', '#quote'),
  ('refi', 'Refinancing', 'Bring existing borrowing together or lower your repayments.', '#quote'),
  ('tax', 'Tax and VAT bills', 'Spread the cost of a large bill over time.', '#quote'),
  ('other', 'Something else', 'Tell us what you need and we will find the right broker.', '#quote'),
])}""")}

<div id="how-it-works"></div>
{process(('Tell us what your business needs', 'We match you with a specialist broker', 'The broker contacts you with options'), '#quote', 'Get a quote')}
<!--CALC-->

{section(split('/assets/stock-home.webp', f"""<h2 class="heading-two">Less searching. Better conversations.</h2>
<div class="large-text serif-typeface">Instead of calling round lenders yourself, you fill in one form and speak to a broker who already understands what you need.</div>
{checks(['One short form instead of lots of applications', 'A broker who specialises in your type of funding', 'Your enquiry goes to one broker, not a list', 'Free to use, with no obligation to go ahead'])}
<div class="ll-actions" style="margin-top:32px"><a href="#quote" class="button w-inline-block"><div>Get a quote</div></a></div>""", alt='Business owner working at a table'))}

{photo_box(asset('Man_Woman_MacBook'), f"""<div class="section-title"><h2 class="heading-two">Who we can help</h2><div class="large-text serif-typeface">Our brokers work with established UK businesses.</div><div class="horizontal-line"></div></div>
{checks(['A UK limited company or LLP', 'Trading for at least 6 months', 'Annual revenue of £50,000 or more', 'Looking to borrow from £5,000 to £2m+'], white=True)}
<a href="#quote" class="button w-inline-block"><div>Check your options</div></a>""", cls='section padding-btm-0', photo=True)}

{faq([
  ('Is Loanleaf a lender?', 'No. Loanleaf is a free introduction service. We pass your enquiry to a specialist business finance broker who can look at the options for your business. We are not a lender or a broker, we don&#39;t give financial advice, and we are not authorised by the FCA.'),
  ('Does it cost anything?', 'No. Our service is free to use. We may be paid by the broker we introduce you to. Any fees a broker or lender charges should be explained to you before you agree to anything.'),
  ('Will filling in the form affect my credit score?', 'No. Our form doesn&#39;t involve a credit check. A broker or lender may run checks later on, and they should tell you before they do.'),
  ('Who will contact me?', 'One independent finance broker we match you with, usually by phone, email or text.'),
  ('How much can my business borrow?', 'Brokers can help with funding from around £5,000 to over £2m. What&#39;s available depends on your business, its revenue and its credit history.'),
  ('Can sole traders or start-ups apply?', 'Not at the moment. We can only help UK limited companies and LLPs that have been trading for at least 6 months, with annual revenue of £50,000 or more.'),
  ('What happens to my information?', 'We only share your details with the broker we match you with, and only if you agree. Read our <a href="/privacy-policy">Privacy Policy</a> for the full details.'),
], 'Ready to get started?', 'It only takes a minute.', '#quote', 'Get a quote')}

{cta('Find the right finance for your business', 'Answer a few quick questions and we will do the matching.', '#quote', 'Get a quote')}
'''
HOME_REST = home.split('<!--HOME-REST-->', 1)[1]
home = home.replace('<!--HOME-REST-->', '')


# Broker-page UI mock-ups (HTML, so the content matches business finance rather than the old law-firm images)
_ok = '<span class="ll-ui-ok">' + TICK + '</span>'
UI_LEAD = f'''<div class="ll-ui" aria-hidden="true"><div class="ll-ui-card">
<div class="ll-ui-head"><b>New lead</b><span class="ll-ui-pill">Qualified</span></div>
<dl class="ll-ui-grid"><div><dt>Name</dt><dd>Sam Patel</dd></div><div><dt>Business</dt><dd>Northfield Joinery Ltd</dd></div>
<div><dt>Mobile</dt><dd>07700 900123 {_ok}</dd></div><div><dt>Email</dt><dd>sam@northfield.co.uk {_ok}</dd></div>
<div><dt>Amount</dt><dd>£150,000</dd></div><div><dt>For</dt><dd>Equipment or vehicles</dd></div>
<div><dt>Structure</dt><dd>Limited company</dd></div><div><dt>Revenue</dt><dd>£500k to £1m</dd></div>
<div><dt>Trading</dt><dd>5+ years</dd></div><div><dt>CCJs / defaults</dt><dd>No</dd></div></dl></div></div>'''
UI_DELIVERY = f'''<div class="ll-ui" aria-hidden="true"><div class="ll-ui-card">
<div class="ll-ui-head"><b>LL-10482</b><span class="ll-ui-pill">Delivered to CRM {TICK}</span></div>
<dl class="ll-ui-grid"><div><dt>Received</dt><dd>Today, 09:42</dd></div><div><dt>Delivered</dt><dd>Today, 09:42</dd></div>
<div><dt>Source</dt><dd>Google search</dd></div><div><dt>Consent</dt><dd>Recorded {_ok}</dd></div>
<div class="full"><dt>Funding need</dt><dd>£75,000 cash flow, within 2 weeks</dd></div></dl></div></div>'''
UI_CHAT = '''<div class="ll-ui" aria-hidden="true"><div class="ll-ui-chat">
<div class="ll-ui-msg"><b>Loanleaf</b>Hi Jo, a new cash flow lead has just gone to your CRM: £75k, limited company, trading 3 years.</div>
<div class="ll-ui-msg me">Thanks. Was the mobile number checked?</div>
<div class="ll-ui-msg"><b>Loanleaf</b>Yes, the mobile and email were both checked when the form was submitted.</div></div></div>'''


# ---------------------------------------------------------------- index-b: two-tier menu + illustrated hero (layout test)
CHEV = '<svg class="llb-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
LOAN_LINKS = [('growth', 'Growth and expansion'), ('cash', 'Cash flow'), ('equip', 'Equipment and vehicles'), ('stock', 'Stock and inventory'),
              ('property', 'Commercial property'), ('refi', 'Refinancing'), ('tax', 'Tax and VAT bills'), ('other', 'Something else')]


def dd(label, links, wide=False):
    items = ''.join(f'<a href="{h}">{ic}<span>{t}</span></a>' for h, t, ic in links)
    return (f'<div class="llb-dd"><button type="button" class="llb-dd-btn" aria-expanded="false">{label}{CHEV}</button>'
            f'<div class="llb-dd-panel{" wide" if wide else ""}">{items}</div></div>')


import sys as _s0; _s0.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import loans_content as _LN
ARR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'


def mega(label, items, subs, card, foot=('/apply', 'Not sure? Get a quote')):
    """Mega menu: plain list with arrows (left), a tinted column of related links that follows the hovered item (middle), photo card (right).
    items: [(href, name, sub_key)]; subs: {key: (heading, [(href, name)])}; card: (img, title, text, href, link label)."""
    first = items[0][2]
    left = ''.join(f'<a href="{h}" class="llb-mi{" on" if i == 0 else ""}" data-k="{k}"><span>{t}</span>{ARR}</a>' for i, (h, t, k) in enumerate(items))
    left = f'<div class="llb-mlist{" two" if len(items) > 10 else ""}">{left}</div><a href="{foot[0]}" class="llb-mfoot">{foot[1]}</a>'
    def sub(k, v):
        if isinstance(v, tuple):
            v = {'groups': [v]}
        head = f'<a class="llb-mhead" href="{v["head"][0]}">{v["head"][1]}{ARR}</a>' if v.get('head') else ''
        groups = ''.join(f'<div class="llb-mgrp"><h3>{hd}</h3>' + ''.join(f'<a href="{h}">{t}</a>' for h, t in links) + '</div>' for hd, links in v['groups'] if links)
        return f'<div class="llb-msub{" on" if k == first else ""}" data-k="{k}">{head}<div class="llb-mgrps">{groups}</div></div>'
    mid = ''.join(sub(k, v) for k, v in subs.items())
    right = ''
    if card:
        img, ct, cx, ch, cl = card
        right = f'<div class="llb-mcard2"><img src="{img}" alt="" loading="lazy"/><div><b>{ct}</b><p>{cx}</p><a href="{ch}">{cl}</a></div></div>'
    return (f'<div class="llb-dd llb-mega-dd"><button type="button" class="llb-dd-btn" aria-expanded="false">{label}{CHEV}</button>'
            f'<div class="llb-dd-panel llb-mega"><div class="llb-mega-in"><div class="llb-mleft">{left}</div><div class="llb-mright{"" if card else " wide"}"><div class="llb-mmid">{mid}</div>{right}</div></div></div></div>')


import sys as _s0; _s0.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import loans_content as _LN
try:
    import needs_content as _ND, industries_content as _IN
    NEEDS, INDS = _ND.NEEDS, _IN.INDUSTRIES
except ImportError:
    NEEDS, INDS = [], []
_LNAME = {l['slug']: l['name'] for l in _LN.LOANS}
import json as _jc
COMBO = {}  # 'a|b' -> copy, from tools/combos/*.json (only pages with copy are built and linked)
for _f in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'combos', '*.json'))):
    if not _f.endswith('batches.json'):
        COMBO.update(_jc.load(open(_f)))
_s0.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'combos'))
import matrix as MX
_NNAME = {n['slug']: n['name'] for n in NEEDS}
_INAME = {n['slug']: n['name'] for n in INDS}
low = lambda t: t[0].lower() + t[1:]
_suits = lambda x: ('Finance that often suits', [(f'/business-loans/{s}', _LNAME[s]) for s in x['loans']])
_used_for = lambda slug: ('Often used for', [(f'/business-needs/{n["slug"]}', n['name']) for n in NEEDS if slug in n['loans']][:6] or [('/business-needs', 'All business needs')])
loans_dd = mega('Business loans', [(f'/business-loans/{l["slug"]}', l['name'], l['slug']) for l in _LN.LOANS] + [('/business-loans', 'Compare all business loans', 'all')],
                {**{l['slug']: {'head': (f'/business-loans/{l["slug"]}', f'{l["name"]}: overview'),
                                'groups': [(f'{l["name"]} for', [(f'/business-loans/{l["slug"]}/{n}', _NNAME[n]) for n in MX.LOAN_NEEDS.get(l['slug'], []) if f'{l["slug"]}|{n}' in COMBO]),
                                           ('By industry', [(f'/business-loans/{l["slug"]}/{i}', _INAME[i]) for i, ls in MX.INDUSTRY_LOANS.items() if l['slug'] in ls and f'{l["slug"]}|{i}' in COMBO])]}
                   for l in _LN.LOANS},
                 'all': ('Work it out', [('/business-loan-calculator', 'Business loan calculator'), ('/guides/secured-vs-unsecured-business-loans', 'Secured vs unsecured'), ('/guides/growth-guarantee-scheme', 'Growth Guarantee Scheme')])},
                None)
needs_dd = mega('Business needs', [(f'/business-needs/{n["slug"]}', n['name'], n['slug']) for n in NEEDS] + [('/business-needs', 'All business needs', 'alln')],
                {**{n['slug']: {'head': (f'/business-needs/{n["slug"]}', f'{n["name"]}: overview'),
                                'groups': [('By loan type', [(f'/business-loans/{l}/{n["slug"]}', _LNAME[l]) for l, ns in MX.LOAN_NEEDS.items() if n['slug'] in ns and f'{l}|{n["slug"]}' in COMBO]),
                                           ('By industry', [(f'/industries/{i}/{n["slug"]}', _INAME[i]) for i in MX.INDUSTRY_LOANS if f'{n["slug"]}|{i}' in COMBO])]}
                   for n in NEEDS},
                 'alln': ('Most popular', [(f'/business-needs/{n["slug"]}', n['name']) for n in NEEDS[:5]])}, None) if NEEDS else ''
inds_dd = mega('Industries', [(f'/industries/{n["slug"]}', n['name'], n['slug']) for n in INDS] + [('/industries', 'All industries', 'alli')],
               {**{n['slug']: {'head': (f'/industries/{n["slug"]}', f'{n["name"]}: overview'),
                               'groups': [('By loan type', [(f'/business-loans/{l}/{n["slug"]}', _LNAME[l]) for l in MX.INDUSTRY_LOANS.get(n['slug'], []) if f'{l}|{n["slug"]}' in COMBO]),
                                          ('By business need', [(f'/industries/{n["slug"]}/{x}', _NNAME[x]) for x in MX.NEEDS_ORDER if f'{x}|{n["slug"]}' in COMBO])]}
                  for n in INDS},
                'alli': ('Popular', [(f'/industries/{n["slug"]}', n['name']) for n in INDS[:5]])}, None) if INDS else ''
_guides = ('Guides', [(f'/guides/{g}', t) for g, t in [('how-to-get-a-business-loan', 'How to get a business loan'), ('what-lenders-look-for', 'What lenders look for'),
                                                      ('documents-you-need-for-a-business-loan', 'Documents you need'), ('secured-vs-unsecured-business-loans', 'Secured vs unsecured'),
                                                      ('business-loans-with-bad-credit', 'Business loans with bad credit'), ('growth-guarantee-scheme', 'Growth Guarantee Scheme')]])
res_dd = mega('Resources', [('/business-loan-calculator', 'Business loan calculator', 'g'), ('/how-it-works', 'How Loanleaf works', 'g'), ('/guides', 'Guides', 'g'), ('/blog', 'Blog', 'b'), ('/#faq', 'Questions and answers', 'g')],
              {'g': _guides, 'b': ('Latest from the blog', [('/blog/getting-your-accounts-lender-ready', 'Getting your accounts lender-ready'), ('/blog/planning-for-a-vat-bill', 'Planning for a VAT bill'),
                                                            ('/blog/questions-to-ask-a-finance-broker', 'Questions to ask a finance broker'), ('/blog/what-a-personal-guarantee-really-means', 'What a personal guarantee really means')])},
              ('/assets/stock-calc.webp', 'Work out the cost first', 'See what a loan could cost each month before you speak to anyone.', '/business-loan-calculator', 'Open the calculator'), foot=('/apply', 'Ready? Get a quote'))
about_dd = mega('About', [('/about', 'About us', 'a'), ('/how-we-make-money', 'How we make money', 'a'), ('/press', 'Press', 'a'), ('/contact', 'Contact us', 'c'), ('/complaints', 'Complaints', 'c')],
                {'a': ('More about Loanleaf', [('/how-it-works', 'How it works'), ('/partners', 'For finance brokers'), ('/privacy-policy', 'Privacy Policy'), ('/terms-conditions', 'Terms of Service')]),
                 'c': ('Get in touch', [('mailto:hello@loanleaf.co', 'hello@loanleaf.co'), ('/contact', 'Contact form'), ('/accessibility', 'Accessibility')])},
                ('/assets/stock-need-hiring-staff.webp', 'An introducer, not a lender', 'We match UK businesses with specialist finance brokers. We never lend or give advice.', '/how-we-make-money', 'How we make money'), foot=('/apply', 'Get a quote'))



# ---------------------------------------------------------------- partner (broker) mega menu: pages from tools/partner_pages/*.json + lead pages in tools/seo_content
PP = {}
for _f in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'partner_pages', '*.json'))):
    _d = _jc.load(open(_f)); PP[_d['slug']] = _d
_SEO_LIST = [_jc.load(open(_f)) for _f in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'seo_content', '*.json')))]
_pp = lambda slugs: [(f'/partners/{s}', PP[s].get('nav', PP[s]['h1']), 's') for s in slugs if s in PP]
P_START = ('Get started', [('/partners/apply', 'Book a call or apply'), ('https://platform.loanleaf.co/register', 'Create a platform account'),
                           ('/partners/pricing' if 'pricing' in PP else '/partners', 'See pricing'), ('/partners/faq', 'Partner questions and answers'),
                           ('https://platform.loanleaf.co/signin', 'Sign in')])
P_GUIDES = ['guides/speed-to-lead', 'guides/first-call-script', 'guides/converting-business-finance-leads', 'guides/qualifying-business-finance-enquiries',
            'guides/following-up-quiet-leads', 'guides/handling-lead-data']
p_how = mega('How it works', _pp(['how-it-works', 'getting-started', 'lead-generation', 'lead-verification', 'exclusive-leads', 'lead-delivery', 'refunds', 'custom-campaigns']) or [('/partners', 'How it works', 's')],
             {'s': P_START}, ('/assets/stock-broker-call.webp', 'Exclusive leads, in real time', 'Business owners who asked to be contacted about finance, sold to one broker only.', '/partners/apply', 'Become a partner'), foot=('/partners/apply', 'Book a call with the team'))
p_plat = mega('Platform', _pp(['platform', 'platform/opportunities', 'platform/auto-buy', 'platform/lead-management', 'platform/crm-integrations', 'platform/broker-profile', 'platform/credits-and-billing'])
              or [('https://platform.loanleaf.co/signin', 'Loanleaf Platform', 's')],
              {'s': P_START}, ('/assets/stock-broker-desk.webp', 'Built for busy brokers', 'Pick leads yourself or let auto-buy take the ones that fit, straight into your CRM.', 'https://platform.loanleaf.co/register', 'Create an account'), foot=('https://platform.loanleaf.co/register', 'Create an account'))
_LEAD_LABEL = lambda slug: {'mca-leads': 'MCA leads', 'vat-and-tax-loan-leads': 'VAT and tax loan leads', 'revolving-credit-leads': 'Revolving credit leads'}.get(slug, slug.replace('-', ' ').capitalize())
p_leads = mega('Leads', [(f'/partners/{d["slug"]}', _LEAD_LABEL(d['slug']), 's') for d in _SEO_LIST],
               {'s': ('Pricing', [(f'/partners/{x}', PP[x].get('nav', PP[x]['h1'])) for x in ('pricing', 'lead-quality-score') if x in PP] + [('/partners/cost-per-lead-calculator', 'Cost per lead calculator'), ('/partners/refunds' if 'refunds' in PP else '/partners', 'Refunds')])},
               ('/assets/stock-broker-support.webp', 'Every lead is a UK Ltd or LLP', 'Trading 6 months or more, revenue of £50k+, borrowing £5,000 to £2m+.', '/partners/lead-verification' if 'lead-verification' in PP else '/partners', 'How leads are checked'), foot=('/partners/apply', 'Become a partner'))
p_price = mega('Pricing', _pp(['pricing', 'lead-quality-score']) + [('/partners/cost-per-lead-calculator', 'Cost per lead calculator', 's')] + _pp(['platform/credits-and-billing', 'refunds']),
               {'s': P_START}, ('/assets/stock-calc.webp', 'From £20 per lead', 'Each lead is priced by how fundable it is. Monthly plans, cancel any time.', '/partners/cost-per-lead-calculator', 'Work out your cost per deal'), foot=('/partners/apply', 'Become a partner'))
p_res = mega('Resources', ([('/partners/guides', 'Broker guides', 's')] if any(g in PP for g in P_GUIDES) else []) + _pp(P_GUIDES) + [('/partners/faq', 'Questions and answers', 's')],
             {'s': ('More help', [('/partners/hubspot-guide.pdf', 'HubSpot setup guide (PDF)'), ('/partners/platform/crm-integrations' if 'platform/crm-integrations' in PP else '/partners', 'CRM integrations'), ('/contact', 'Contact the team'), ('/about', 'About Loanleaf')])},
             ('/assets/stock-broker-call.webp', 'Turn more leads into deals', 'Practical guides on speed to lead, first calls and follow-up.', '/partners/guides' if any(g in PP for g in P_GUIDES) else '/partners', 'Read the guides'), foot=('/partners/apply', 'Become a partner'))
PARTNER_MENU = p_how + p_plat + p_leads + p_price + p_res


PLOGO_ANIM = ('<span class="llb-logo-tag">Partners</span><video class="llb-logo-vid" muted loop playsinline preload="auto" aria-hidden="true"></video>'
              '<script>(function(){var a=document.currentScript.parentNode;if(matchMedia("(prefers-reduced-motion: reduce)").matches){a.classList.add("noanim");return}'
              'var v=a.querySelector("video"),u=navigator.userAgent,h=/iP(hone|ad|od)/.test(u)||(/Safari/.test(u)&&!/Chrome|Chromium|Edg|Firefox|OPR/.test(u));'
              'v.src="/assets/logo-anim/loanleaf-partners-dark"+(h?"-hevc.mov":".webm");'
              # clip: Loanleaf to Partners 0.62-1.05s, Partners to Loanleaf 2.22-2.65s. Hold each word: Loanleaf 2s at first, then Partners 4s, Loanleaf 4.5s
              'var want="L",first=1,seen=performance.now(),busy=0;function go(){var p=v.play();p&&p.catch(function(e){if(e.name!="AbortError"&&!a.classList.contains("anim"))a.classList.add("noanim")})}'
              'function tick(){var t=v.currentTime,n=performance.now();if(!busy&&!v.paused&&(want=="L"?t<.62||t>=2.65:t>=1.05&&t<2.22)){'
              'var rem=want=="P"?2.22-t:(t>=2.65?3.6-t+.62:.62-t),ms=Math.max(0,(want=="P"?4000:first?2000:4500)-(n-seen)-rem*1000);'
              'busy=1;v.pause();first=0;setTimeout(function(){var c=v.currentTime;seen=performance.now()+1000*(want=="L"?(c<.62?1.05-c:3.6-c+1.05):2.65-c);want=want=="L"?"P":"L";busy=0;go()},ms)}requestAnimationFrame(tick)}'
              'v.addEventListener("playing",function(){a.classList.add("anim")},{once:true});v.addEventListener("error",function(){a.classList.add("noanim")});go();requestAnimationFrame(tick)})()</script>')


def header_b(page=''):
    cur = ' aria-current="page"'
    partner = page in ('partners.html', 'legal')
    brk, law = (cur if page == 'partners.html' else ''), (cur if page == 'legal' else '')
    if page == 'legal':
        cta_href, cta_label = '/partners/legal/apply', 'Apply now'
    elif partner:
        cta_href, cta_label = '/partners/apply', 'Become a partner'
    else:
        cta_href, cta_label = ('#quote' if page == 'index.html' else '/apply'), 'Get a quote'
    menu = (PARTNER_MENU if partner
            else f'{loans_dd}{needs_dd}{inds_dd}{res_dd}{about_dd}')
    extra = ('<a href="/">For businesses</a>' if partner else '<a href="/partners">For partners</a>')
    # Broker platform sign-in sits next to "Apply now" on the finance broker pages (law firms don't use the platform).
    signin = '<a href="https://platform.loanleaf.co/signin" class="llb-signin">Sign in</a>' if partner and page != 'legal' else ''
    return f'''<header class="llb-head">
<div class="llb-top"><div class="llb-in"><nav class="llb-top-l" aria-label="Audience"><a href="/"{"" if partner else cur}>Businesses</a><a href="/partners"{cur if partner else ""}>Partners</a></nav>
<div class="llb-top-r"><a href="/how-it-works">How it works</a><a href="/contact">Contact us</a></div></div></div>
<div class="llb-main"><div class="llb-in">
<a href="{'/partners' if partner else '/'}" class="llb-logo{' llb-logo-p' if partner else ''}" aria-label="{'Loanleaf Partners' if partner else 'Loanleaf home'}"><img src="{asset('Loanleaf_Logo_White')}" width="150" alt="Loanleaf"/>{PLOGO_ANIM if partner else ''}</a>
<button type="button" class="llb-toggle" aria-expanded="false" aria-controls="llb-menu" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
<nav class="llb-menu" id="llb-menu" aria-label="Main">{menu}
<div class="llb-mobile-extra">{extra}<a href="/about">About us</a><a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a></div>
{signin}<a href="{cta_href}" class="button llb-cta{' llb-cta-pair' if signin else ''}"><div>{cta_label}</div></a></nav>
</div></div></header>'''

PHONE = f'''<div class="llb-art" aria-hidden="true">
<div class="llb-blob"></div>
<span class="llb-float a">{ICON['cash']}</span><span class="llb-float b"><b>£</b></span>
<div class="llb-phone"><div class="llb-screen">
<div class="llb-screen-t">Your broker match</div>
<div class="llb-mcard on"><div class="llb-mtop"><b>Equipment finance specialist</b><span class="llb-tag">Matched {TICK}</span></div>
<dl><div><dt>Funding</dt><dd>£150,000</dd></div><div><dt>For</dt><dd>New machinery</dd></div><div><dt>Business</dt><dd>Limited company</dd></div><div><dt>Contact</dt><dd>By phone</dd></div></dl></div>
<div class="llb-mcard"><div class="llb-mtop"><b>Cash flow specialist</b><span class="llb-box"></span></div>
<dl><div><dt>Funding</dt><dd>£50k to £250k</dd></div><div><dt>For</dt><dd>Working capital</dd></div></dl></div>
</div></div>
<div class="llb-photo"><img src="{asset('photo-portrait-04')}" alt=""/></div>
</div>'''

HERO_B = f'''<section class="llb-hero"><div class="llb-hero-in">
<div class="llb-copy">
<p class="llb-kicker">Business finance for UK limited companies and LLPs</p>
<h1>Find the right business loan with a specialist broker</h1>
<ul class="llb-ticks"><li>{TICK}No credit check to get started</li><li>{TICK}A broker who specialises in your type of funding</li><li>{TICK}Funding from £5,000 to £2m+</li><li>{TICK}Free to use, with no obligation</li></ul>
<a href="/apply" class="button llb-big"><div>Get a quote</div></a>
</div>{PHONE}</div></section>'''

rest_b = re.sub(r'href="#quote" data-purpose="([^"]+)"', lambda m: f'href="/apply?purpose={quote(m.group(1))}"', HOME_REST).replace('href="#quote"', 'href="/apply"')
page(f'{PUB}/index.html', 'Business Loans & Finance for UK Companies | Loanleaf',
     'Find business loans and finance from £5,000 to £2m+. Answer a few quick questions and get matched with a specialist UK finance broker.',
     home, '<link href="/assets/apply.css?v=64" rel="stylesheet"/>', '<script src="/assets/apply.js?v=72"></script>')

# £500k+ Meta campaign landing page: form only, like /apply. data-variant tags every enquiry from it
# (api/enquiry.js only reports £500k+ revenue enquiries from this page to Meta). Ads only, so kept out of search.
# Ad landing page: what it's for and why, then the form (starting at £250k). No menu or footer links to leave by (see header/footer below).
LP_TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
# First question rendered in the HTML so the card is never blank while apply.js loads (apply.js redraws the same step).
def first_step(amount=100000):
    amounts = [5e3,1e4,15e3,2e4,25e3,3e4,4e4,5e4,6e4,75e3,1e5,125e3,15e4,2e5,25e4,3e5,4e5,5e5,75e4,1e6,15e5,2e6]
    i = amounts.index(amount)
    chip = lambda j: f'<button type="button" class="ap-chip{" sel" if j == i else ""}" data-j="{j}">{"£" + (f"{int(amounts[j] / 1e6)}m" if amounts[j] >= 1e6 else f"{int(amounts[j] / 1e3)}k")}</button>'
    return (f'<div class="ap-step on"><h2 class="ap-q" tabindex="-1">How much would you like to borrow?</h2><div class="ap-amount">£{amount:,}</div>'
            f'<input class="ap-range" type="range" min="0" max="{len(amounts) - 1}" step="1" value="{i}" aria-label="Business loan amount">'
            '<div class="ap-scale"><span>£5,000</span><span>£2,000,000+</span></div>'
            f'<div class="ap-chips">{"".join(chip(j) for j in (2, 7, 10, 13, 17, 19))}</div>'
            '<div class="ap-actions"><button type="button" class="button ap-next" data-next>Continue →</button></div>'
            '<p class="ap-quick"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2h4M12 2v3"/></svg>Takes about a minute</p></div>')
LP_TICKS = ('Won’t affect your credit score', 'Free to use, no obligation', 'More lenders, so you could<br class="ap-br"> borrow more and pay less')
def lp_body(card_attrs='', amount=100000, h1='Find the right funding for your business', ticks=LP_TICKS):  # ad-style form page: headline and benefit ticks beside the form (/business-finance, /apply)
    return ('<section class="ap-section ap-solo ap-lp" id="quote"><div class="ap-wrap"><div class="ap-lp-grid">'
            f'<div class="ap-lp-head"><h1>{h1}</h1>'
            '<ul>' + ''.join(f'<li><span class="ap-lp-tick">{LP_TICK}</span><span>{t}</span></li>' for t in ticks) + '</ul></div>'
            + FORM.replace('<div class="ap-card" id="ap">', f'<div class="ap-card" id="ap"{card_attrs}>', 1)
                  .replace('<div class="ap-bar" role="presentation"></div>', '<div class="ap-bar" role="presentation"><i class="ap-fill" style="width:9%"></i></div>', 1).replace('<noscript>', first_step(amount) + '<noscript>', 1) + '</div></div></section>')
home_500k = lp_body(' data-variant="500k" data-amount="250000"', 250000)
LP_HEADER = f'<header class="llb-head llb-lp"><div class="llb-main"><div class="llb-in"><span class="llb-logo"><img src="{asset("Loanleaf_Logo_White")}" width="150" alt="Loanleaf"/></span></div></div></header>'
assert home_500k.count('data-variant') == 1
page(f'{PUB}/business-finance.html', 'Find the Right Funding for Your Business | Loanleaf',
     'Business loans from £100k to £2m+ for UK companies turning over £500k or more. One short form, matched with a specialist business loan broker.',
     home_500k, '<link href="/assets/apply.css?v=64" rel="stylesheet"/><meta name="robots" content="noindex"/>', '<script src="/assets/apply.js?v=72"></script>',
     header=LP_HEADER, backup=False)
page(f'{PUB}/apply.html', 'Find the Right Funding for Your Business | Loanleaf',
     'Business finance from £5,000 to £2m+ for UK limited companies. Answer a few quick questions and we’ll find the right funding options for your business. Free, with no obligation.',
     lp_body(), '<link href="/assets/apply.css?v=64" rel="stylesheet"/>', '<script src="/assets/apply.js?v=72"></script>',
     header=LP_HEADER, backup=False)

# /business-loans-uk: ad landing page. Light, centred layout: hero with the form, key facts, who can apply (photo + checklist),
# how it works, questions, a last call to action. Own header (logo + one button) and the minimal legal footer. Styles: assets/lp-uk.css.
# Ads only, so kept out of search. Never says "broker" (landing-page copy rule): the person we introduce is a "finance specialist".
_uk_ico = lambda k: f'<span class="lk-ico">{ICON[k]}</span>'
_uk_btn = lambda label, cls='': f'<a href="#quote" class="lk-btn{cls}">{label} {ARROW}</a>'
_uk_facts = [('£5k to £2m+', 'available to borrow'), ('About a minute', 'to tell us what you need'), ('One specialist', 'matched to your business'), ('No obligation', 'the choice is yours')]
_uk_rules = [('briefcase', 'A limited company or LLP', 'Registered at Companies House'), ('clock', 'Trading for 6 months or more', 'Enough history to show how you’re doing'),
             ('chart', '£50,000+ annual revenue', 'Total sales over the last twelve months'), ('cash', 'Borrowing £5,000 or more', 'Up to £2m and beyond')]
_uk_steps = [('Share what you need', 'The amount, what it’s for and a few details about your company. It takes about a minute.'),
             ('We find the right fit', 'We look at your answers and introduce you to the finance specialist best placed to help.'),
             ('Compare your options', 'They contact you, look at what could work for your business and talk you through it. No obligation.')]
_uk_faq = [
  ('Will this affect my credit score?', 'No. Our form doesn&#39;t involve a credit check. If you decide to go ahead, a lender may run checks later on, and you should be told before they do.'),
  ('Is Loanleaf a lender?', 'No. Loanleaf is a free introduction service, not a lender. We pass your enquiry to a finance specialist who can look at the options for your business.'),
  ('How much can my business borrow?', 'From around £5,000 to over £2m. What&#39;s available depends on your business, its revenue and its credit history. Finance is subject to status.'),
  ('Do I have to accept an offer?', 'No. You are under no obligation to go ahead with anything you are shown.'),
  ('How is Loanleaf paid?', 'Our service is free for you. We receive a fee from the finance specialist we introduce you to. Any fees they or a lender charge should be explained before you agree to anything.'),
  ('What happens to my information?', 'We only share your details with the finance specialist we match you with, and only if you agree. Read our <a href="/privacy-policy">Privacy Policy</a> for the full details.'),
]
_uk_plus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
UK_HEADER = (f'<header class="lk-head llb-lp"><div class="lk-in lk-head-in"><span class="lk-logo"><img src="{asset("Loanleaf_Logo_Deep_Green")}" width="140" alt="Loanleaf"/></span>'
             '<a href="#quote" class="lk-btn lk-btn-line">Check your options</a></div></header>')
lp_uk = (
    '<section class="lk-hero" id="quote"><div class="lk-in">'
    f'<span class="lk-pill">{TICK}For UK limited companies and LLPs</span>'
    '<h1>Business loans for <mark>growing</mark> UK&nbsp;companies</h1>'
    '<p class="lk-lead">Borrow from £5,000 to £2m+. Answer a few quick questions and we’ll introduce you to a finance specialist who looks at the options for you.</p>'
    + FORM.replace('<div class="ap-bar" role="presentation"></div>', '<div class="ap-bar" role="presentation"><i class="ap-fill" style="width:9%"></i></div>', 1).replace('<noscript>', first_step() + '<noscript>', 1)
    + '<p class="lk-note">A rough figure is fine. No obligation to go ahead.</p>'
    '<div class="lk-facts">' + ''.join(f'<div><b>{t}</b><span>{d}</span></div>' for t, d in _uk_facts) + '</div>'
    f'<p class="lk-legal">{ICON["shield"]}Loanleaf is an introducer, not a lender. Finance subject to status.</p>'
    '</div></section>'
    '<section class="lk-sec"><div class="lk-in lk-split">'
    f'<div class="lk-photo"><img src="{asset("photo-portrait-04")}" loading="lazy" alt="Smiling business owner in an apron"/></div>'
    '<div><p class="lk-eyebrow">Who we help</p><h2>Can your business apply?</h2>'
    '<p class="lk-sub">We work with established UK businesses. If all four of these fit, you can get started today.</p>'
    '<ul class="lk-rules">' + ''.join(f'<li>{_uk_ico(ic)}<div><b>{t}</b><span>{d}</span></div><span class="lk-ok">{TICK}</span></li>' for ic, t, d in _uk_rules) + '</ul>'
    '<p class="lk-sub">Use it for <b>growth, equipment, stock, cash flow, refinancing or a tax bill</b>.</p>'
    + _uk_btn('Check your options') + '</div></div></section>'
    '<section class="lk-sec lk-tint"><div class="lk-in lk-center"><p class="lk-eyebrow">How it works</p>'
    '<h2>Tell us once. We’ll find the right fit.</h2><p class="lk-sub">No calling round lenders and no filling in the same details again and again.</p>'
    '<ol class="lk-steps">' + ''.join(f'<li><span class="lk-num">{i:02d}</span><b>{t}</b><p>{d}</p></li>' for i, (t, d) in enumerate(_uk_steps, 1)) + '</ol>'
    '</div></section>'
    '<section class="lk-sec" id="faq"><div class="lk-in lk-center"><p class="lk-eyebrow">Questions</p><h2>Common questions</h2>'
    '<div class="lk-faq">' + ''.join(f'<details><summary>{q}{_uk_plus}</summary><p>{a}</p></details>' for q, a in _uk_faq) + '</div></div></section>'
    '<section class="lk-sec lk-sec-end"><div class="lk-in"><div class="lk-cta"><h2>See what your business could borrow</h2>'
    '<p>It takes about a minute, and there’s no obligation.</p>' + _uk_btn('Check your options') + '</div></div></section>')
assert 'broker' not in lp_uk.lower() and 'broker' not in UK_HEADER.lower()
page(f'{PUB}/business-loans-uk.html', 'Business Loans for UK Companies | Loanleaf',
     'Business loans from £5,000 to £2m+ for established UK limited companies and LLPs. One short form, free and with no obligation. Finance subject to status.',
     lp_uk, '<link href="/assets/apply.css?v=64" rel="stylesheet"/><link href="/assets/lp-uk.css?v=1" rel="stylesheet"/><meta name="robots" content="noindex"/>',
     '<script src="/assets/apply.js?v=72"></script>', header=UK_HEADER, backup=False)


# ---------------------------------------------------------------- partners (brokers)
import json as _json
import sys as _sys
_sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import partners_content as PC


def prose(paras):
    return '<div class="ll-prose">' + ''.join(f'<p>{p}</p>' for p in paras) + '</div>'


def text_grid(items, numbered=False, cols=2):
    out = []
    for i, (t, d) in enumerate(items, 1):
        num = f'<span class="ll-tg-num">{i}</span>' if numbered else ''
        out.append(f'<div class="ll-tg-item">{num}<h3>{t}</h3><p>{d}</p></div>')
    return f'<div class="ll-tg cols-{cols}">' + ''.join(out) + '</div>'


def title_block(h2, lead=''):
    return f'<div class="ll-section-title"><h2 class="heading-two">{h2}</h2>' + (f'<div class="large-text serif-typeface">{lead}</div>' if lead else '') + '</div>'


def yes_no(yes_title, yes, no_title, no):
    y = ''.join(f'<li>{TICK}{t}</li>' for t in yes)
    n = ''.join(f'<li>{CROSS}{t}</li>' for t in no)
    return f'<div class="ll-isnt"><div class="ll-yes"><h3>{yes_title}</h3><ul>{y}</ul></div><div class="ll-no"><h3>{no_title}</h3><ul>{n}</ul></div></div>'


CHEV_D = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'


def tabs(uid, items, faq_panels=False):
    """items: (label, inner_html). All panels are rendered; assets/tabs.js hides inactive ones."""
    tl = ''.join(f'<button type="button" class="ll-tab" role="tab" id="{uid}-t{i}" aria-controls="{uid}-p{i}" aria-selected="{str(i == 0).lower()}">{label}</button>' for i, (label, _) in enumerate(items))
    ps = ''.join(f'<div class="ll-panel{" faq-panel" if faq_panels else ""}" role="tabpanel" id="{uid}-p{i}" aria-labelledby="{uid}-t{i}" tabindex="0">{inner}</div>' for i, (_, inner) in enumerate(items))
    return f'<div class="ll-tabs" data-tabs><div class="ll-tablist" role="tablist">{tl}</div>{ps}</div>'


def accordion(items, numbered=False):
    rows = ''.join(f'<details class="ll-faq"><summary class="large-text bold-text"><span>{f"<b class=ll-acc-num>{i}</b>" if numbered else ""}{t}</span>{CHEV_D}</summary><div class="ll-faq-a">{d}</div></details>' for i, (t, d) in enumerate(items, 1))
    return f'<div class="ll-acc">{rows}</div>'


def read_more(paras):
    first, rest = paras[0], paras[1:]
    return (f'<div class="ll-prose"><p>{first}</p></div>'
            + (f'<details class="ll-more"><summary>Read more {CHEV_D}</summary><div class="ll-prose">' + ''.join(f'<p>{p}</p>' for p in rest) + '</div></details>' if rest else ''))


def faq_tabs(groups):
    chev = CHEV_D
    return tabs('faq', [(name, ''.join(f'<details class="ll-faq"><summary class="large-text bold-text">{q}{chev}</summary><div class="ll-faq-a">{a}</div></details>' for q, a in qas)) for name, qas in groups], faq_panels=True)


APPLY_P = '/partners/apply'
SEO_LINK = {'growth': '/partners/business-loan-leads', 'cash': '/partners/mca-leads', 'equip': '/partners/asset-finance-leads',
            'property': '/partners/commercial-mortgage-leads', 'refi': '/partners/commercial-finance-leads'}
faq_schema = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
    {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', a)}} for q, a in PC.FAQ]}
org_schema = {'@context': 'https://schema.org', '@type': 'Organization', '@id': 'https://loanleaf.co/#organization', 'name': 'Loanleaf', 'url': 'https://loanleaf.co',
              'legalName': 'Vertical Brands Ltd', 'description': 'Loanleaf is a trading name of Vertical Brands Ltd.', 'email': 'hello@loanleaf.co',
              'logo': 'https://loanleaf.co/assets/Loanleaf_Logo_Deep_Green_PNG_500x100_72DPI.png',
              'identifier': {'@type': 'PropertyValue', 'propertyID': 'Companies House company number', 'value': '14254961'},
              'address': {'@type': 'PostalAddress', 'streetAddress': '20-22 Wenlock Road', 'addressLocality': 'London', 'postalCode': 'N1 7GU', 'addressCountry': 'GB'}}
svc_schema = {'@context': 'https://schema.org', '@type': 'Service', 'name': 'Business loan leads for UK finance brokers',
              'serviceType': 'Business loan lead generation', 'areaServed': {'@type': 'Country', 'name': 'United Kingdom', 'identifier': 'GB'},
              'provider': {'@id': 'https://loanleaf.co/#organization'}, 'url': 'https://loanleaf.co/partners', 'description': PC.DESC,
              'offers': {'@type': 'AggregateOffer', 'priceCurrency': 'GBP', 'lowPrice': '15', 'highPrice': '300', 'offerCount': '1',
                         'description': 'Price per exclusive business loan lead, paid from monthly credit plans starting at £2,500 + VAT.'}}
PARTNER_HEAD = '<link rel="canonical" href="https://loanleaf.co/partners"/>' + ''.join(f'<script type="application/ld+json">{_json.dumps(x, ensure_ascii=False)}</script>' for x in (org_schema, svc_schema, faq_schema))



partner_apply = ('<section class="ap-section"><div class="ap-wrap"><h1 class="ap-page-title">Apply to become a partner</h1>'
                 '<div class="ap-card" id="ap"><div class="ap-head"><div class="ap-meta"><button type="button" class="ap-back">&larr; Back</button><span class="ap-count" aria-live="polite"></span></div><div class="ap-bar" role="presentation"></div></div>'
                 '<div class="ap-body"><noscript><p>Please enable JavaScript, or email <a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a>.</p></noscript></div></div>'
                 '</div></section>')
os.makedirs(f'{PUB}/partners', exist_ok=True)
# Brokers: grouped stages + call booking (partner-enquiry.js). Law firms below keep the one-question-per-step form.
broker_enquiry = ('<section class="ap-section"><div class="ap-wrap pe-wrap"><h1 class="ap-page-title">Become a Loanleaf partner</h1>'
                  '<div id="pe"><noscript><p style="padding:32px">Please enable JavaScript, or email <a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a>.</p></noscript></div>'
                  '</div></section>')
page(f'{PUB}/partners/apply.html', 'Apply to Become a Partner | Business Loan Leads for Brokers | Loanleaf',
     'Apply to receive exclusive, pre-screened business loan leads. Tell us what you fund, then book a call with the team.',
     broker_enquiry, '<link href="/assets/apply.css?v=64" rel="stylesheet"/><link href="/assets/partner-enquiry.css?v=10" rel="stylesheet"/><meta name="robots" content="noindex"/>',
     '<script src="/assets/partner-enquiry.js?v=16"></script>', header='PARTNERS_HEADER', backup=False)

# ---------------------------------------------------------------- partners: commercial finance brokers (standalone sales page)
def feat_photo(name, alt=''):
    return f'<div class="ll-feat-photo"><img src="/assets/stock-{name}.webp" alt="{alt}" loading="lazy"/></div>'


def feature(ui, title, text, ticks, ui_first=True):
    copy = (f'<div class="horizontal-section-half"><div class="container---s"><div class="section-contents"><div class="section-title-small">'
            f'<div class="heading-four">{title}</div><div>{text}</div></div>{checks(ticks)}</div></div></div>')
    return f'<div class="horizontal-section">{ui + copy if ui_first else copy + ui}</div>'


import cfb_page
page(f'{PUB}/partners.html', PC.TITLE, PC.DESC, cfb_page.build(ICON, TICK, faq_tabs(PC.FAQ_GROUPS), PC.FAQ_H2),
     PARTNER_HEAD + '<link href="/assets/cfb.css?v=17" rel="stylesheet"/>', '<script src="/assets/tabs.js?v=2"></script>', header='PARTNERS_HEADER', backup=False)

# ---------------------------------------------------------------- partners: cost per lead calculator
_chips = lambda key, lab, opts: (f'<div class="ll-calc-field"><div class="ll-calc-row"><label>{lab}</label></div><div class="pe-chips" role="group" aria-label="{lab}">'
                                 + ''.join(f'<button type="button" class="pe-chip" data-k="{key}" data-v="{v}">{t}</button>' for v, t in opts) + '</div></div>')
_rev = ['£50k to £100k', '£100k to £250k', '£250k to £500k', '£500k to £1m', '£1m to £5m', '£5m+']
_age = ['6 to 12 months', '1 to 2 years', '2 to 5 years', '5+ years']
CPL = f"""<section class="ll-calc-sec"><div class="ll-calc-in">
<div class="ll-calc-head"><h1>Cost per lead calculator</h1><p class="ll-lead">Every lead is priced on what the business needs and how fundable it is. Pick the details to see what a lead like that costs.</p></div>
<div class="ll-calc" id="cpl">
<div class="ll-calc-inputs">
<div class="ll-calc-field"><div class="ll-calc-row"><label for="cpl-amount">Loan amount</label><output id="cpl-amount-o" class="ll-calc-val"></output></div>
<input class="ap-range" type="range" id="cpl-amount"><div class="ap-scale"><span>£5,000</span><span>£2,000,000</span></div></div>
{_chips('turnover', 'Annual revenue', [(v, v) for v in _rev])}
{_chips('trading', 'Time trading', [(v, v) for v in _age])}
{_chips('credit', 'Missed payments, defaults or CCJs in the last 6 years', [('No', 'No'), ('Not sure', 'Not sure'), ('Yes', 'Yes')])}
</div>
<div class="ll-calc-out" aria-live="polite">
<div class="ll-calc-label">Price of this lead</div><div class="ll-calc-big" data-out="price"></div>
<div class="ll-calc-sub" data-out="credits"></div>
<dl class="ll-calc-dl"><div><dt>Leads like this on £2,500 a month</dt><dd data-out="starter"></dd></div><div><dt>Leads like this on £5,000 a month</dt><dd data-out="growth"></dd></div><div><dt>Price range for all leads</dt><dd data-out="range"></dd></div></dl>
<a href="{APPLY_P}" class="button ll-calc-cta"><div>Become a partner</div></a>
</div></div>
<p class="ll-calc-note">Bigger loans from older, larger businesses with clean credit cost more because they are easier to fund. Requests that are unrealistic for the size of the business cost less. You see the price of every lead before you buy it. 1 credit = £1, prices exclude VAT.</p>
</div></section>"""
page(f'{PUB}/partners/cost-per-lead-calculator.html', 'Cost Per Lead Calculator for Finance Brokers | Loanleaf',
     'See what an exclusive business loan lead costs on Loanleaf, based on loan amount, revenue, time trading and credit history.',
     CPL + cta('Start receiving business loan leads', 'Book a call with our team or send an enquiry. It takes under a minute.', APPLY_P, 'Become a partner'),
     '<link href="/assets/apply.css?v=64" rel="stylesheet"/><link href="/assets/partner-enquiry.css?v=10" rel="stylesheet"/><link rel="canonical" href="https://loanleaf.co/partners/cost-per-lead-calculator"/>',
     '<script src="/assets/cpl-calculator.js?v=8"></script>', header='PARTNERS_HEADER', backup=False)

# ---------------------------------------------------------------- partners: law firms (/partners/legal)
import legal_partners_content as LC

APPLY_L = '/partners/legal/apply'
L_HEAD = ''.join(f'<script type="application/ld+json">{_json.dumps(x, ensure_ascii=False)}</script>' for x in (
    {'@context': 'https://schema.org', '@type': 'Service', 'name': 'Legal leads for solicitors and law firms',
     'serviceType': 'Pay per lead legal client lead generation', 'areaServed': 'GB',
     'provider': {'@type': 'Organization', 'name': 'Loanleaf', 'legalName': 'Vertical Brands Ltd', 'email': 'hello@loanleaf.co'}, 'description': LC.DESC},
    {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', a)}} for q, a in LC.FAQ]}))

L_UI_LEAD = f'''<div class="ll-ui" aria-hidden="true"><div class="ll-ui-card">
<div class="ll-ui-head"><b>New lead</b><span class="ll-ui-pill">Immigration</span></div>
<dl class="ll-ui-grid"><div><dt>Name</dt><dd>Priya Shah</dd></div><div><dt>Location</dt><dd>Leicester</dd></div>
<div><dt>Mobile</dt><dd>07700 900456 {_ok}</dd></div><div><dt>Email</dt><dd>priya.shah@gmail.com {_ok}</dd></div>
<div><dt>Matter</dt><dd>Spouse visa extension</dd></div><div><dt>Urgency</dt><dd>Visa expires in 6 weeks</dd></div>
<div><dt>Paid help</dt><dd>Yes {_ok}</dd></div><div><dt>Best time</dt><dd>After 5pm</dd></div>
<div class="full"><dt>In their words</dt><dd>“First extension, husband is British, want to make sure we get it right.”</dd></div></dl></div></div>'''
L_UI_DELIVERY = f'''<div class="ll-ui" aria-hidden="true"><div class="ll-ui-card">
<div class="ll-ui-head"><b>LL-L2291</b><span class="ll-ui-pill">Delivered to intake {TICK}</span></div>
<dl class="ll-ui-grid"><div><dt>Received</dt><dd>Today, 19:06</dd></div><div><dt>Delivered</dt><dd>Today, 19:06</dd></div>
<div><dt>Source</dt><dd>Facebook campaign</dd></div><div><dt>Consent</dt><dd>Recorded {_ok}</dd></div>
<div class="full"><dt>Matter</dt><dd>Drink driving charge, court date in 3 weeks</dd></div></dl></div></div>'''

L_HERO = (f'<section class="section legal-hero"><div class="photo-section-image-wrapper"><img src="{asset("photo-landscape-10.webp")}" loading="eager" alt="" class="photo-section-background-image"/></div>'
          f'<div class="container---main"><div class="photo-section-box"><div class="section-box-contents">'
          f'<div class="section-title"><h1>{LC.HERO_H1}</h1><div class="large-text serif-typeface">{LC.HERO_LEAD}</div></div>'
          f'{checks(LC.HERO_TICKS, white=True)}'
          f'<div class="ll-actions"><a href="{APPLY_L}" class="button w-inline-block"><div>Apply to become a partner firm</div></a></div>'
          '</div></div></div></section>')

L_FEATURES = section('<div class="section-title text-center"><h2 class="heading-two">Built for legal intake teams</h2><div class="large-text serif-typeface">Everything you need to make a confident first call.</div></div>'
    + feature(feat_photo('legal-meet'), 'Screened before they reach you', 'Our enquiry flow asks the questions your intake team would ask, and filters out people you can’t help before they are submitted.',
              ['Paid legal help confirmed, not legal aid', 'Matched to your practice areas and locations', 'UK mobile and email checked on submission'])
    + feature(feat_photo('legal-call'), 'Delivered while the enquiry is fresh', 'Leads arrive in real time with the source, timestamp and every answer the client gave, so you can call within minutes.',
              ['Email, CRM or case management delivery', 'No shared or recycled leads'], ui_first=False))

legal_p = ''.join([
    L_HERO,
    section(title_block(LC.AREAS_H2, LC.AREAS_LEAD) + tabs('area', [
        (name, f'<h3>{name}</h3><p>{detail}</p><div class="ll-matters"><b>Typical matters</b>{checks(matters)}</div>')
        for ic, name, short, detail, matters in LC.AREAS])),
    section(title_block('What’s in every lead', LC.LEAD_CONTENTS_TEXT) + cards([(ic, t, d, None) for ic, t, d in LC.LEAD_CONTENTS], 'three')),
    '<div id="how-it-works"></div>',
    process(LC.PROCESS_STEPS, APPLY_L, 'Apply to become a partner firm'),
    section(title_block('Each step in detail') + accordion(LC.PROCESS_DETAIL, numbered=True), cls='section ll-tight'),
    section(title_block(LC.QUAL_H2, LC.QUAL_LEAD) + yes_no('Every lead is', LC.QUAL_YES, 'We don’t send', LC.QUAL_NO) + f'<p class="ll-note">{LC.QUAL_NOTE}</p>'),
    L_FEATURES,
    section(title_block(LC.PRICING_H2) + read_more(LC.PRICING)),
    section(title_block(LC.COMPLIANCE_H2) + tabs('comp', [(t, f'<h3>{t}</h3><p>{d}</p>') for t, d in LC.COMPLIANCE])),
    section(title_block(LC.FIRMS_H2) + cards([(ic, t, d, None) for ic, t, d in LC.FIRMS], 'three')),
    section(title_block(LC.INTRO_H2) + read_more(LC.INTRO)),
    section(title_block(LC.GUIDE_H2, LC.GUIDE_LEAD) + accordion(LC.GUIDE, numbered=True)),
    section(title_block(LC.FAQ_H2, 'Choose a topic to see the questions firms ask us most.') + faq_tabs(LC.FAQ_GROUPS), cls='section" id="faq'),
    cta('Start receiving client enquiries', 'Exclusive, pre-screened leads in the practice areas you choose, delivered in real time.', APPLY_L, 'Apply to become a partner firm'),
])
legal_p = re.sub(r'<section class="section(?! legal-hero)(?! padding-btm-0)', '<section class="section ll-compact', legal_p)
page(f'{PUB}/partners/legal.html', LC.TITLE, LC.DESC, legal_p, L_HEAD, '<script src="/assets/tabs.js?v=2"></script>', header='LEGAL_HEADER', backup=False)

os.makedirs(f'{PUB}/partners/legal', exist_ok=True)
page(f'{PUB}/partners/legal/apply.html', 'Apply to Become a Partner Firm | Legal Leads for Solicitors | Loanleaf',
     'Apply to receive exclusive, pre-screened client enquiries for your law firm. Tell us your practice areas and how many leads you want each month.',
     partner_apply.replace('Apply to become a partner<', 'Apply to become a partner firm<').replace('id="ap"', 'id="ap" data-form="legal"'),
     '<link href="/assets/apply.css?v=64" rel="stylesheet"/><meta name="robots" content="noindex"/>',
     '<script src="/assets/partner-apply.js?v=11"></script>', header='LEGAL_HEADER', backup=False)

# ---------------------------------------------------------------- about
about = f'''
<section class="section legal-hero ll-tall"><div class="photo-section-image-wrapper"><img src="{asset('photo-landscape-04.webp')}" loading="eager" alt="" class="photo-section-background-image"/></div>
<div class="container---main"><div class="photo-section-box"><div class="section-box-contents">
<div class="section-title"><h1>About Loanleaf</h1><div class="large-text serif-typeface">We help UK businesses find the right finance, without the legwork.</div></div>
<div class="ll-actions"><a href="/apply" class="button w-inline-block"><div>Get a quote</div></a></div>
</div></div></div></section>

{section(f"""<div class="ll-section-title"><h2 class="heading-two">Finding business finance shouldn't be hard</h2>
<div class="large-text serif-typeface">Most business owners don't have time to research lenders, compare products and fill in application after application. Loanleaf turns that into one short form. We use your answers to introduce you to a broker who specialises in the kind of funding you need, so the first conversation is a useful one.</div></div>""")}

{section(f"""<div class="ll-section-title"><h2 class="heading-two">How we work</h2></div>
{cards([
  ('clock', 'Simple', 'One short form, in plain English, that takes about a minute.', None),
  ('eye', 'Honest', 'We are clear about who we are, what we do and how we are paid.', None),
  ('target', 'Focused', 'We only work with UK limited companies and LLPs, so the brokers we introduce can really help.', None),
], 'three')}""")}

{section(split('/assets/stock-about.webp', f"""<h2 class="heading-two">What we are, and what we aren't</h2>
<div class="large-text serif-typeface">We think you should know exactly who you're dealing with.</div>
<div class="ll-isnt" style="margin-top:28px;grid-template-columns:1fr">
<div class="ll-yes"><h3>Loanleaf is</h3><ul><li>{TICK}A free introduction service for UK businesses</li><li>{TICK}Run by Vertical Brands Ltd</li><li>{TICK}Free for you to use</li></ul></div>
<div class="ll-no"><h3>Loanleaf is not</h3><ul><li>{CROSS}A lender or a broker</li><li>{CROSS}A source of financial advice</li><li>{CROSS}Authorised or regulated by the FCA</li></ul></div>
</div>""", flip=True, alt='Business owner at a wooden table'))}

{section(f"""<div class="ll-section-title"><h2 class="heading-two">Company details</h2></div>
<dl class="ll-company"><div><dt>Trading name of</dt><dd>Vertical Brands Ltd</dd></div><div><dt>Company number</dt><dd>14254961, registered in England and Wales</dd></div><div><dt>Registered office</dt><dd>20–22 Wenlock Road, London, N1 7GU</dd></div><div><dt>VAT number</dt><dd>GB425344608</dd></div><div><dt>Email</dt><dd><a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a></dd></div><div><dt>Legal</dt><dd><a href="/terms-conditions">Terms of Service</a> · <a href="/privacy-policy">Privacy Policy</a></dd></div></dl>""")}

{cta('Ready to find the right finance?', 'Answer a few quick questions and we will do the matching.', '/apply', 'Get a quote')}
'''
page(f'{PUB}/about.html', 'About Us | Loanleaf',
     'Loanleaf is a free introduction service that helps UK limited companies and LLPs find business finance through specialist brokers.', about)

# ---------------------------------------------------------------- business loan calculator
import calc_content as CC
_sl = lambda key, lab, out, rng, scale: (f'<div class="ll-calc-field"><div class="ll-calc-row"><label for="{key}">{lab}</label>{out}</div>'
                                        f'<input class="ap-range" type="range" id="{key}-r" {rng} aria-label="{lab}"><div class="ap-scale"><span>{scale[0]}</span><span>{scale[1]}</span></div></div>')
CALC = f"""<section class="ll-calc-sec"><div class="ll-calc-in">
<div class="ll-calc-head"><h1>{CC.H1}</h1><p class="ll-lead">{CC.LEAD}</p></div>
<div class="ll-calc" id="calc">
<div class="ll-calc-inputs">
{_sl('calc-amount', 'Loan amount', '<span class="ll-calc-box"><span>£</span><input id="calc-amount" inputmode="numeric" autocomplete="off"></span>', 'min="0" max="21" step="1"', ('£5,000', '£2,000,000'))}
{_sl('calc-term', 'Repayment term', '<output id="calc-term-o" class="ll-calc-val"></output>', 'min="0" max="13" step="1"', ('3 months', '10 years'))}
{_sl('calc-rate', 'Interest rate (per year)', '<span class="ll-calc-box"><input id="calc-rate" inputmode="decimal" autocomplete="off"><span>%</span></span>', 'min="1" max="40" step="0.1"', ('1%', '40%'))}
</div>
<div class="ll-calc-out" aria-live="polite">
<div class="ll-calc-label">Estimated monthly repayment</div><div class="ll-calc-big" data-out="monthly"></div>
<div class="ll-calc-sub">over <span data-out="term"></span></div>
<dl class="ll-calc-dl"><div><dt>Total to repay</dt><dd data-out="total"></dd></div><div><dt>Total interest</dt><dd data-out="interest"></dd></div><div><dt>Cost per £1 borrowed</dt><dd data-out="perpound"></dd></div></dl>
<div class="ll-split-bar" aria-hidden="true"><span class="ll-split-p"></span></div><div class="ll-split-key" data-out="split"></div>
<a href="/apply" class="button ll-calc-cta" data-cta><div>Get matched</div></a>
</div></div>
<details class="ll-calc-sched" id="calc-sched-wrap"><summary>See the year-by-year breakdown {CHEV_D}</summary>
<div class="ll-calc-table"><table id="calc-sched"><thead><tr><th>Year</th><th>Paid</th><th>Loan repaid</th><th>Interest</th><th>Balance left</th></tr></thead><tbody></tbody></table></div></details>
<p class="ll-calc-note">{CC.NOTE}</p>
</div></section>"""
calc_schema = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
    {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', a)}} for q, a in CC.FAQ]}
app_schema = {'@context': 'https://schema.org', '@type': 'WebApplication', 'name': 'Business loan calculator', 'applicationCategory': 'FinanceApplication',
              'operatingSystem': 'Any', 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'GBP'}, 'description': CC.DESC}
calc_body = ''.join([
    CALC,
    section(title_block(CC.HOW_H2) + prose(CC.HOW), cls='section ll-compact'),
    section(title_block(CC.COST_H2) + text_grid(CC.COST), cls='section ll-compact'),
    section(title_block(CC.FORMULA_H2) + read_more(CC.FORMULA), cls='section ll-compact'),
    section(split('/assets/stock-calc.webp', f'<h2 class="heading-two">{CC.BORROW_H2}</h2>' + ''.join(f'<p class="ll-split-p-text">{p}</p>' for p in CC.BORROW)
                  + '<div class="ll-actions" style="margin-top:28px"><a href="/apply" class="button w-inline-block"><div>Get a quote</div></a></div>', alt='Business owner at a table'), cls='section ll-compact'),
    section(title_block(CC.DOCS_H2) + f'<div class="ll-docs">{checks(CC.DOCS)}</div>', cls='section ll-compact'),
    faq(CC.FAQ, 'Ready to see your options?', 'Answer a few quick questions and we will match you with a specialist broker.', '/apply', 'Get a quote', title='Business loan calculator FAQs'),
    cta('Find the right business loan', 'Tell us what you need and we will introduce you to a specialist finance broker.', '/apply', 'Get a quote'),
])
calc_body = re.sub(r'<section class="section"(?= id="faq")', '<section class="section ll-compact"', calc_body)
page(f'{PUB}/business-loan-calculator.html', CC.TITLE, CC.DESC, calc_body,
     '<link href="/assets/apply.css?v=64" rel="stylesheet"/>' + ''.join(f'<script type="application/ld+json">{_json.dumps(x, ensure_ascii=False)}</script>' for x in (app_schema, calc_schema)),
     '<script src="/assets/loan-math.js?v=1"></script><script src="/assets/calculator.js?v=3"></script>', backup=False)

# ---------------------------------------------------------------- company pages, contact, 404
def page_head(h1, lead, kicker=''):
    k = ''  # no eyebrow labels (owner feedback)
    return f'<section class="ll-pagehead"><div class="ll-pagehead-in">{k}<h1>{h1}</h1><p class="ll-lead">{lead}</p></div></section>'


def blocks_html(blocks):
    out = []
    for kind, v in blocks:
        if kind == 'h2': out.append(f'<h2>{v}</h2>')
        elif kind == 'p': out.append(f'<p>{v}</p>')
        elif kind == 'ul': out.append('<ul>' + ''.join(f'<li>{x}</li>' for x in v) + '</ul>')
    return '<div class="ll-doc">' + ''.join(out) + '</div>'


def doc_page(path, title, desc, h1, lead, blocks, kicker='', aside=''):
    body = page_head(h1, lead, kicker) + f'<section class="ll-docsec"><div class="ll-doc-wrap">{blocks_html(blocks)}{aside}</div></section>'
    page(path, title, desc, body, backup=False)


doc_page(f'{PUB}/how-we-make-money.html', 'How We Make Money | Loanleaf',
    'Loanleaf is free for businesses. We are paid by the broker partners we introduce you to. Here is exactly how that works.',
    'How we make money', 'Loanleaf is free for businesses. Here is exactly how we are paid, and what that means for you.', [
    ('h2', 'You never pay us'),
    ('p', 'Using Loanleaf costs your business nothing. There is no fee to complete the form, no fee to be introduced and no obligation to go ahead with anything a broker offers you.'),
    ('h2', 'Our partners pay us'),
    ('p', 'We are paid by the finance brokers we introduce businesses to. Each partner pays us an agreed fee for each enquiry we send them. That is how we cover the cost of running the website, our advertising and the checks we carry out on every enquiry.'),
    ('h2', 'What that means for you'),
    ('ul', ['Each enquiry goes to one broker, chosen because they arrange the type of finance you asked about.',
            'We don’t recommend lenders or products, and we don’t give financial advice.',
            'Your broker will explain their own fees, if they charge any, before you agree to anything.',
            'Lenders set their own rates and decide whether to lend. We have no say in that decision.']),
    ('h2', 'Who runs Loanleaf'),
    ('p', 'Loanleaf is a trading name of Vertical Brands Ltd, registered in England and Wales (company number 14254961). We are an introduction service. We are not a lender or a broker and we are not authorised or regulated by the Financial Conduct Authority.'),
    ('p', 'Questions about how we work? Email <a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a>.'),
], kicker='Company')

doc_page(f'{PUB}/complaints.html', 'Complaints | Loanleaf',
    'How to make a complaint about Loanleaf, what happens next and how long it takes. Complaints about a broker or lender go to that firm first.',
    'Complaints', 'If something has gone wrong, we want to put it right. Here is how to tell us and what happens next.', [
    ('h2', 'How to complain to us'),
    ('p', 'Email <a href="mailto:hello@loanleaf.co?subject=Complaint">hello@loanleaf.co</a> with the subject “Complaint”. Tell us your name, the email address or phone number you used on our form, what went wrong and what you would like us to do.'),
    ('h2', 'What happens next'),
    ('ul', ['We confirm we have received your complaint within <strong>3 working days</strong>.',
            'We investigate and send you a full written response within <strong>15 working days</strong>.',
            'If we need longer, we will tell you why and when to expect our answer.']),
    ('h2', 'Complaints about a broker or lender'),
    ('p', 'Once we have introduced you, the broker and any lender are separate businesses, responsible for their own service. Please raise complaints about advice, fees, products or a lending decision with that firm directly. If you are unhappy with how a broker we introduced treated you, tell us as well. We take it seriously and may stop working with partners who don’t treat businesses fairly.'),
    ('h2', 'If you are still unhappy'),
    ('p', 'If your complaint is about a firm authorised by the Financial Conduct Authority, you may be able to refer it to the Financial Ombudsman Service once that firm has responded. Complaints about how we have used your personal data can be raised with the Information Commissioner’s Office at <a href="https://ico.org.uk" rel="noopener">ico.org.uk</a>.'),
], kicker='Company')

doc_page(f'{PUB}/accessibility.html', 'Accessibility Statement | Loanleaf',
    'Our commitment to making loanleaf.co usable for everyone, the standard we aim for and how to tell us about any accessibility problems.',
    'Accessibility statement', 'We want everyone to be able to use loanleaf.co, whatever device or assistive technology they use.', [
    ('h2', 'Our standard'),
    ('p', 'We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. Our forms work with a keyboard alone, our text can be resized up to 200% without losing content, and we use proper headings, labels and colour contrast so the site works with screen readers.'),
    ('h2', 'What we have done'),
    ('ul', ['Every form field has a visible label and clear error messages.', 'Buttons and links can be reached and used with a keyboard.',
            'We respect your device’s reduced motion setting.', 'Pages work on phones, tablets and desktops, at any zoom level.']),
    ('h2', 'Known issues'),
    ('p', 'Some older articles may not yet meet every part of the standard. We are reviewing them and fixing problems as we find them.'),
    ('h2', 'Tell us about a problem'),
    ('p', 'If you have trouble using any part of the site, or need information in a different format, email <a href="mailto:hello@loanleaf.co?subject=Accessibility">hello@loanleaf.co</a>. We will reply within 3 working days.'),
    ('p', 'This statement was last reviewed on 4 November 2026.'),
], kicker='Company')

doc_page(f'{PUB}/press.html', 'Press and Media | Loanleaf',
    'Press and media information for Loanleaf: company boilerplate, brand assets and contact details for journalists and partners.',
    'Press and media', 'Information for journalists, partners and anyone writing about Loanleaf.', [
    ('h2', 'About Loanleaf'),
    ('p', 'Loanleaf is a business finance introduction service for UK limited companies and LLPs. Business owners answer a short set of questions about the finance they need, and Loanleaf matches each enquiry with a specialist broker who arranges that type of finance. The service is free for businesses. Loanleaf is a trading name of Vertical Brands Ltd.'),
    ('h2', 'Brand assets'),
    ('ul', [f'<a href="{asset("Loanleaf_Logo_Deep_Green")}" download>Logo, deep green (PNG)</a>', f'<a href="{asset("Loanleaf_Logo_White")}" download>Logo, white (PNG)</a>']),
    ('p', 'Please write the name as one word: <strong>Loanleaf</strong>. Don’t alter, recolour or stretch the logo.'),
    ('h2', 'Media enquiries'),
    ('p', 'Email <a href="mailto:hello@loanleaf.co?subject=Media%20enquiry">hello@loanleaf.co</a> with “Media enquiry” in the subject and we will get back to you within one working day.'),
], kicker='Company')

CONTACT_FORM = '''<form class="ll-cf" id="ll-contact" novalidate>
<div class="ll-cf-grid">
<label><span>Your name</span><input name="name" autocomplete="name" required></label>
<label><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
<label><span>Phone <small>(optional)</small></span><input name="phone" type="tel" autocomplete="tel"></label>
<label><span>Topic</span><select name="topic"><option>My loan enquiry</option><option>Becoming a partner</option><option>Press or media</option><option>A complaint</option><option>Something else</option></select></label>
<label class="full"><span>Message</span><textarea name="message" rows="5" required minlength="5" placeholder="How can we help?"></textarea></label>
</div>
<div class="ap-hp" aria-hidden="true"><label>Leave blank<input name="hp" tabindex="-1" autocomplete="off"></label></div>
<p class="ll-cf-note">We use your details only to reply to your message. See our <a href="/privacy-policy">Privacy Policy</a>.</p>
<button type="submit" class="button">Send message</button><div class="ll-cf-msg" role="alert"></div>
</form>'''
CONTACT_ASIDE = '''<aside class="ll-cf-aside">
<div><h2>Looking for a business loan?</h2><p>The quickest way is our short form. A specialist broker will contact you.</p><a href="/apply" class="button">Get a quote</a></div>
<div><h2>Email</h2><p><a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a><br>We reply within one working day, Monday to Friday.</p></div>
<div><h2>Partners</h2><p><a href="/partners">Finance brokers</a> · <a href="/partners/legal">Law firms</a></p></div>
<div><h2>Registered office</h2><p>Vertical Brands Ltd<br>20–22 Wenlock Road<br>London, N1 7GU</p></div>
</aside>'''
page(f'{PUB}/contact.html', 'Contact Us | Loanleaf', 'Contact Loanleaf about a business loan enquiry, becoming a partner, press or anything else. We reply within one working day.',
     page_head('Contact us', 'Questions about an enquiry, becoming a partner or anything else? Send us a message.')
     + f'<section class="ll-docsec"><div class="ll-cf-wrap">{CONTACT_FORM}{CONTACT_ASIDE}</div></section>',
     extra_js='<script src="/assets/contact.js?v=1"></script>')

page(f'{PUB}/404.html', 'Page Not Found | Loanleaf', 'The page you were looking for could not be found.',
     page_head('We can’t find that page', 'It may have moved, or the link may be out of date.', kicker='Error 404')
     + section(cards([('growth', 'Get a business loan quote', 'Answer a few quick questions and get matched with a specialist broker.', '/apply'),
                      ('chart', 'Business loan calculator', 'Work out monthly repayments and total cost.', '/business-loan-calculator'),
                      ('user', 'For partners', 'Exclusive leads for finance brokers and law firms.', '/partners')], 'three')),
     extra_head='<meta name="robots" content="noindex"/>', backup=False)

# ---------------------------------------------------------------- loan-type pages + /business-loans hub
import loans_content as LN
LOAN_NAMES = {l['slug']: l['name'] for l in LN.LOANS}
os.makedirs(f'{PUB}/business-loans', exist_ok=True)


LOAN_IMG = {k: f'/assets/stock-{v}.webp' for k, v in {'unsecured-business-loans': 'unsecured', 'secured-business-loans': 'secured', 'asset-finance': 'asset',
            'invoice-finance': 'invoice', 'merchant-cash-advance': 'mca', 'revolving-credit-facility': 'rcf', 'commercial-mortgages': 'commercial',
            'bridging-loans': 'bridging', 'vat-and-tax-loans': 'tax'}.items()}


def match_card(l):
    return (f'<div class="ll-ui" aria-hidden="true"><div class="ll-ui-card"><div class="ll-ui-head"><b>Your broker match</b><span class="ll-ui-pill">Matched {TICK}</span></div>'
            f'<dl class="ll-ui-grid"><div class="full"><dt>Specialist in</dt><dd>{l["name"]}</dd></div><div><dt>Business</dt><dd>Limited company</dd></div>'
            f'<div><dt>Trading</dt><dd>3 years</dd></div><div class="full"><dt>Next step</dt><dd>Your broker calls to talk through options {_okk}</dd></div></dl></div></div>')


def loan_cards(loans):
    return cards([(l['icon'], l['name'], l['short'], f'/business-loans/{l["slug"]}') for l in loans], 'three').replace('Get a quote ' + ARROW, 'Learn more ' + ARROW)


for l in LN.LOANS:
    q = f'/apply?purpose={quote(l["purpose"])}'
    head = (f'<section class="ll-pagehead ll-hero-split"><div class="ll-hero-grid"><div><nav class="ll-crumbs" aria-label="Breadcrumb"><a href="/business-loans">Business loans</a><span>/</span><span>{l["name"]}</span></nav>'
            f'<h1>{l["h1"]}</h1><p class="ll-lead">{l["lead"]}</p>'
            f'<ul class="ll-hero-ticks"><li>{TICK}Free to use, no obligation</li><li>{TICK}£5,000 to £2m+ for UK limited companies and LLPs</li><li>{TICK}Matched to a broker who arranges {l["name"][0].lower() + l["name"][1:]}</li></ul>'
            f'<div class="ll-head-btns"><a href="{q}" class="button"><div>Get a quote</div></a><a href="/business-loan-calculator" class="ll-ghost-light">Calculate repayments</a></div></div>'
            f'<div class="ll-hero-media"><img src="{LOAN_IMG[l["slug"]]}" alt="" loading="eager" fetchpriority="high"/></div></div></section>')
    faq_ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': fq, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', fa)}} for fq, fa in l['faqs']]}
    crumb_ld = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Business loans', 'item': 'https://loanleaf.co/business-loans'},
        {'@type': 'ListItem', 'position': 2, 'name': l['name'], 'item': f'https://loanleaf.co/business-loans/{l["slug"]}'}]}
    related = [x for x in LN.LOANS if x['slug'] in l['related']]
    body = ''.join([
        head, TRUST_STRIP,
        section(title_block(f'What {l["name"][0].lower() + l["name"][1:]} are' if l['name'].endswith('s') else f'What {l["name"][0].lower() + l["name"][1:]} is') + prose(l['intro'])),
        section(title_block('What businesses use it for') + text_grid(l['uses'])),
        section(title_block('How it works') + accordion(l['how'], numbered=True), cls='section ll-tight'),
        section(title_block('What lenders look at', 'Every lender has its own criteria, but these are the things they usually check.')
                + f'<div class="ll-lenders"><div class="ll-lenders-list">{checks(l["eligibility"])}</div><div class="ll-lenders-card"><h3>To use Loanleaf</h3><ul><li>{TICK}UK limited company or LLP</li><li>{TICK}Trading for 6 months or more</li><li>{TICK}Annual revenue of £50,000+</li><li>{TICK}Borrowing £5,000 or more</li></ul><a href="{q}" class="button"><div>Check your options</div></a></div></div>'),
        section(title_block('Things to consider') + tabs('cons', [(t, f'<h3>{t}</h3><p>{d}</p>') for t, d in l['considerations']])),
        faq(l['faqs'], 'Ready to compare your options?', 'One short form. A specialist broker calls you.', q, 'Get a quote', title=f'{l["name"]} questions and answers'),
        section(title_block('Related finance') + loan_cards(related)),
    ])
    body = re.sub(r'<section class="section(?! padding-btm-0)', '<section class="section ll-compact', body)
    page(f'{PUB}/business-loans/{l["slug"]}.html', l['title'], l['desc'], body,
         ''.join(f'<script type="application/ld+json">{_json.dumps(x, ensure_ascii=False)}</script>' for x in (faq_ld, crumb_ld)),
         '<script src="/assets/tabs.js?v=2"></script>', backup=False)

hub = (page_head('Business loans for UK companies', 'Compare the main types of business finance, then answer a few quick questions to get matched with a specialist broker.', kicker='Business loans')
       + TRUST_STRIP + section(loan_cards(LN.LOANS))
       + section(title_block('Not sure which type you need?', 'You don’t have to know. Tell us what the loan is for and we will match you with a broker who can explain your options.')
                 + '<div class="ll-actions" style="justify-content:center"><a href="/apply" class="button"><div>Get a quote</div></a><a href="/guides" class="button bg-base-50"><div>Read our guides</div></a></div>'))
page(f'{PUB}/business-loans.html', 'Business Loans for UK Companies: Types of Finance | Loanleaf',
     'Unsecured and secured business loans, asset finance, invoice finance, merchant cash advances, commercial mortgages, bridging and tax loans for UK companies.', hub, backup=False)

# ---------------------------------------------------------------- v2: business-needs + industries pages (Funding Circle-style product layout)
MINI_CALC = f'''<section class="section ll-compact"><div class="container---main"><div class="v2-calc" data-minicalc>
<div class="v2-calc-copy"><h2 class="heading-two">What could it cost each month?</h2><p class="large-text">An illustration only. The rate you’re offered depends on the lender and your business.</p>
<a href="/business-loan-calculator" class="v2-link">Open the full calculator {ARROW}</a></div>
<div class="v2-calc-card"><div class="v2-calc-fields">
<label>Amount to borrow<span class="v2-pre"><b>£</b><input type="text" inputmode="numeric" name="amount" value="50,000"></span></label>
<label>Repay over<select name="term"><option value="6">6 months</option><option value="12">1 year</option><option value="24">2 years</option><option value="36" selected>3 years</option><option value="48">4 years</option><option value="60">5 years</option><option value="84">7 years</option><option value="120">10 years</option></select></label>
<label>Interest rate a year<span class="v2-pre v2-post"><input type="text" inputmode="decimal" name="rate" value="10"><b>%</b></span></label></div>
<div class="v2-calc-out"><span>Monthly repayment</span><output data-o="monthly">£0</output>
<details><summary>Show breakdown</summary><dl><div><dt>Amount borrowed</dt><dd data-o="amount"></dd></div><div><dt>Interest</dt><dd data-o="interest"></dd></div><div><dt>Total repayable</dt><dd data-o="total"></dd></div></dl></details>
<a href="/apply" class="button" data-o="cta"><div>Get matched with a broker</div></a></div></div></div></div></section>'''
V2_STEPS = [('Tell us what you need', 'One short form about your business and the loan. It takes about a minute and won’t affect your credit score.'),
            ('We match you', 'We pick a specialist broker who arranges this type of finance for businesses like yours.'),
            ('The broker calls you', 'They talk through your options and approach lenders that fit your circumstances.'),
            ('You decide', 'Compare any offers. There’s no obligation to go ahead, and Loanleaf is free to use.')]


def v2_steps(href):
    li = ''.join(f'<li><span class="v2-step-n">{i}</span><h3>{t}</h3><p>{d}</p></li>' for i, (t, d) in enumerate(V2_STEPS, 1))
    return section(title_block('Get matched without affecting your credit score') + f'<ol class="v2-steps">{li}</ol><div class="ll-actions" style="justify-content:center"><a href="{href}" class="button"><div>Get a quote</div></a></div>', cls='section ll-compact')


V2_RES = [('/business-loan-calculator', 'Business loan calculator'), ('/guides/how-to-get-a-business-loan', 'How to get a business loan'), ('/guides/what-lenders-look-for', 'What lenders look for'),
          ('/guides/documents-you-need-for-a-business-loan', 'Documents you need'), ('/guides/secured-vs-unsecured-business-loans', 'Secured vs unsecured loans'),
          ('/guides/growth-guarantee-scheme', 'Growth Guarantee Scheme'), ('/how-it-works', 'How Loanleaf works'), ('/business-loans', 'All business loans')]


def v2_resources():
    links = ''.join(f'<li><a href="{h}">{t}{ARROW}</a></li>' for h, t in V2_RES)
    return section(title_block('Related resources') + f'<ul class="v2-res">{links}</ul>', cls='section ll-compact')


V2_HEAD = '<link href="/assets/v2.css?v=4" rel="stylesheet"/>'
V2_JS = '<script src="/assets/tabs.js?v=2"></script><script src="/assets/loan-math.js"></script><script src="/assets/minicalc.js?v=1"></script>'
learn = lambda html: html.replace('Get a quote ' + ARROW, 'Learn more ' + ARROW)


def v2_page(base, crumb, x, siblings):
    q = f'/apply?purpose={quote(x["purpose"])}'
    head = (f'<section class="hl-hero"><div class="hl-in"><div class="hl-copy">'
            f'<h1>{x["h1"]}</h1><p class="hl-lead">{x["lead"]}</p>'
            f'<div class="hl-btns"><a href="{q}" class="button"><div>Get a quote</div></a><a href="#calc" class="hl-ghost">Estimate repayments</a></div>'
            f'<ul class="hl-ticks"><li>{TICK}Our form won’t affect your credit score</li><li>{TICK}£5,000 to £2m+ for UK limited companies and LLPs</li><li>{TICK}Free to use, no obligation</li></ul></div>'
            f'<div class="hl-media"><img src="/assets/{x["img"]}.webp" alt="" loading="eager" fetchpriority="high"/>'
            f'</div></div></section>')
    loans = [l for s in x['loans'] for l in LN.LOANS if l['slug'] == s]
    faq_ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': fq, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', fa)}} for fq, fa in x['faqs']]}
    crumb_ld = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': crumb, 'item': f'https://loanleaf.co/{base}'},
        {'@type': 'ListItem', 'position': 2, 'name': x['name'], 'item': f'https://loanleaf.co/{base}/{x["slug"]}'}]}
    others = [o for o in siblings if o['slug'] != x['slug']][:6]
    body = ''.join([
        head, TRUST_STRIP,
        section(title_block('The basics') + prose(x['intro'])),
        section(title_block('What businesses use it for') + text_grid(x['uses'])),
        MINI_CALC.replace('data-minicalc>', f'id="calc" data-minicalc data-purpose="{x["purpose"]}">', 1),
        section(title_block('Finance that often suits', 'A broker will tell you which of these fit your business. You don’t need to choose before you start.') + learn(loan_cards(loans))),
        v2_steps(q),
        section(title_block('Things to consider') + tabs('cons', [(t, f'<h3>{t}</h3><p>{d}</p>') for t, d in x['considerations']])),
        faq(x['faqs'], 'Ready to see your options?', 'One short form. A specialist broker calls you.', q, 'Get a quote', title='Questions and answers'),
        section(title_block(f'More {crumb.lower()}') + learn(cards([(o['icon'], o['name'], o['short'], f'/{base}/{o["slug"]}') for o in others], 'three'))),
        v2_resources(),
    ])
    body = re.sub(r'<section class="section(?! padding-btm-0| ll-compact)', '<section class="section ll-compact', body)
    page(f'{PUB}/{base}/{x["slug"]}.html', x['title'], x['desc'], body,
         V2_HEAD + ''.join(f'<script type="application/ld+json">{_json.dumps(d, ensure_ascii=False)}</script>' for d in (faq_ld, crumb_ld)),
         V2_JS, backup=False)


for base, crumb, items, h1, lead, title, desc in (
        ('business-needs', 'Business needs', NEEDS, 'What do you need finance for?', 'Pick what the loan is for to see how businesses usually finance it, then get matched with a broker who specialises in it.',
         'Business Finance by Need: Cash Flow, Equipment, Stock, Tax | Loanleaf', 'How UK companies finance working capital, growth, equipment, vehicles, stock, hiring, refurbishment and tax bills. Matched to a specialist broker, free.'),
        ('industries', 'Industries', INDS, 'Business loans for your industry', 'Every sector borrows differently. See how businesses like yours use finance, then get matched with a broker who knows your industry.',
         'Business Loans by Industry | Loanleaf', 'Business finance for restaurants, construction, retail, manufacturing, transport, healthcare, ecommerce and professional services. Free broker matching.')):
    if not items:
        continue
    os.makedirs(f'{PUB}/{base}', exist_ok=True)
    for x in items:
        v2_page(base, crumb, x, items)
    hub = (page_head(h1, lead) + TRUST_STRIP + section(learn(cards([(x['icon'], x['name'], x['short'], f'/{base}/{x["slug"]}') for x in items], 'three')))
           + MINI_CALC + v2_steps('/apply') + v2_resources())
    page(f'{PUB}/{base}.html', title, desc, hub, V2_HEAD, V2_JS, backup=False)


# ---------------------------------------------------------------- combination pages: loan x need, loan x industry, need x industry (copy in tools/combos/*.json)
_LOAN = {l['slug']: l for l in LN.LOANS}
_NEED = {n['slug']: n for n in NEEDS}
_IND = {n['slug']: n for n in INDS}


def link_list(title, links):
    links = [(h, t) for h, t in links if h]
    return section(title_block(title) + '<ul class="v2-res">' + ''.join(f'<li><a href="{h}">{t}{ARROW}</a></li>' for h, t in links) + '</ul>', cls='section ll-compact') if links else ''


def combo_page(kind, a, b, c):
    if kind == 'ln':
        L, X = _LOAN[a], _NEED[b]; path, crumbs, img, purpose = f'business-loans/{a}/{b}', [('/business-loans', 'Business loans'), (f'/business-loans/{a}', L['name'])], X['img'], X['purpose']
        help_what = f'{low(L["name"])} for {low(X["name"])}'
        rel1 = (f'More about {low(L["name"])}', [(f'/business-loans/{a}', f'{L["name"]}: overview')] + [(f'/business-loans/{a}/{n}', f'For {low(_NNAME[n])}') for n in MX.LOAN_NEEDS[a] if n != b and f'{a}|{n}' in COMBO]
                + [(f'/business-loans/{a}/{i}', f'For {low(_INAME[i])}') for i, ls in MX.INDUSTRY_LOANS.items() if a in ls and f'{a}|{i}' in COMBO][:4])
        rel2 = (f'Other ways to finance {low(X["name"])}', [(f'/business-needs/{b}', f'{X["name"]}: overview')] + [(f'/business-loans/{l}/{b}', _LNAME[l]) for l, ns in MX.LOAN_NEEDS.items() if b in ns and l != a and f'{l}|{b}' in COMBO]
                + [(f'/industries/{i}/{b}', f'{X["name"]} for {low(_INAME[i])}') for i in MX.INDUSTRY_LOANS if f'{b}|{i}' in COMBO][:4])
    elif kind == 'li':
        L, X = _LOAN[a], _IND[b]; path, crumbs, img, purpose = f'business-loans/{a}/{b}', [('/business-loans', 'Business loans'), (f'/business-loans/{a}', L['name'])], X['img'], L['purpose']
        help_what = f'{low(L["name"])} for {low(X["name"])} businesses'
        rel1 = (f'More about {low(L["name"])}', [(f'/business-loans/{a}', f'{L["name"]}: overview')] + [(f'/business-loans/{a}/{i}', f'For {low(_INAME[i])}') for i, ls in MX.INDUSTRY_LOANS.items() if a in ls and i != b and f'{a}|{i}' in COMBO]
                + [(f'/business-loans/{a}/{n}', f'For {low(_NNAME[n])}') for n in MX.LOAN_NEEDS[a] if f'{a}|{n}' in COMBO][:4])
        rel2 = (f'Finance for {low(X["name"])}', [(f'/industries/{b}', f'{X["name"]}: overview')] + [(f'/business-loans/{l}/{b}', _LNAME[l]) for l in MX.INDUSTRY_LOANS[b] if l != a and f'{l}|{b}' in COMBO]
                + [(f'/industries/{b}/{n}', _NNAME[n]) for n in MX.NEEDS_ORDER if f'{n}|{b}' in COMBO][:4])
    else:  # 'ni': need a in industry b
        X, I = _NEED[a], _IND[b]; path, crumbs, img, purpose = f'industries/{b}/{a}', [('/industries', 'Industries'), (f'/industries/{b}', I['name'])], I['img'], X['purpose']
        help_what = f'{low(I["name"])} businesses looking at {low(X["name"])}'
        rel1 = (f'Finance for {low(I["name"])}', [(f'/industries/{b}', f'{I["name"]}: overview')] + [(f'/industries/{b}/{n}', _NNAME[n]) for n in MX.NEEDS_ORDER if n != a and f'{n}|{b}' in COMBO]
                + [(f'/business-loans/{l}/{b}', _LNAME[l]) for l in MX.INDUSTRY_LOANS[b] if f'{l}|{b}' in COMBO][:4])
        rel2 = (f'{X["name"]} in other industries', [(f'/business-needs/{a}', f'{X["name"]}: overview')] + [(f'/industries/{i}/{a}', _INAME[i]) for i in MX.INDUSTRY_LOANS if i != b and f'{a}|{i}' in COMBO]
                + [(f'/business-loans/{l}/{a}', _LNAME[l]) for l, ns in MX.LOAN_NEEDS.items() if a in ns and f'{l}|{a}' in COMBO][:4])
    q = f'/apply?purpose={quote(purpose)}'
    name = c['h1']
    nav = ''.join(f'<a href="{h}">{t}</a><span>/</span>' for h, t in crumbs)
    head = (f'<section class="ll-pagehead ll-hero-split"><div class="ll-hero-grid"><div><nav class="ll-crumbs" aria-label="Breadcrumb">{nav}<span>{name}</span></nav>'
            f'<h1>{name}</h1><p class="ll-lead">{c["lead"]}</p>'
            f'<ul class="ll-hero-ticks"><li>{TICK}Our form won’t affect your credit score</li><li>{TICK}£5,000 to £2m+ for UK limited companies and LLPs</li><li>{TICK}Free to use, no obligation</li></ul>'
            f'<div class="ll-head-btns"><a href="{q}" class="button"><div>Get a quote</div></a><a href="#calc" class="ll-ghost-light">Estimate repayments</a></div></div>'
            f'<div class="ll-hero-media"><img src="/assets/{img}.webp" alt="" loading="eager" fetchpriority="high"/></div></div></section>')
    faqs = [tuple(x) for x in c['faqs']] + [LN._help(help_what)]
    lds = [{'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
               {'@type': 'Question', 'name': fq, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', fa)}} for fq, fa in faqs]},
           {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
               {'@type': 'ListItem', 'position': i + 1, 'name': t, 'item': f'https://loanleaf.co{h}'} for i, (h, t) in enumerate(crumbs + [(f'/{path}', name)])]}]
    body = ''.join([
        head, TRUST_STRIP,
        section(title_block('The basics') + prose(c['intro'])),
        section(title_block('What businesses use it for') + text_grid([tuple(x) for x in c['uses']])),
        section(title_block('How it fits') + text_grid([tuple(x) for x in c['fit']], cols=3)),
        MINI_CALC.replace('data-minicalc>', f'id="calc" data-minicalc data-purpose="{purpose}">', 1),
        v2_steps(q),
        section(title_block('Things to consider') + tabs('cons', [(t, f'<h3>{t}</h3><p>{d}</p>') for t, d in c['considerations']])),
        faq(faqs, 'Ready to see your options?', 'One short form. A specialist broker calls you.', q, 'Get a quote', title='Questions and answers'),
        link_list(*rel1), link_list(*rel2),
    ])
    body = re.sub(r'<section class="section(?! padding-btm-0| ll-compact)', '<section class="section ll-compact', body)
    os.makedirs(os.path.dirname(f'{PUB}/{path}.html'), exist_ok=True)
    page(f'{PUB}/{path}.html', c['title'], c['desc'], body,
         V2_HEAD + ''.join(f'<script type="application/ld+json">{_json.dumps(d, ensure_ascii=False)}</script>' for d in lds), V2_JS, backup=False)


_n_combo = 0
for kind, pairs in (('ln', MX.LOAN_NEED), ('li', MX.LOAN_IND), ('ni', MX.NEED_IND)):
    for a, b in pairs:
        if f'{a}|{b}' in COMBO:
            combo_page(kind, a, b, COMBO[f'{a}|{b}'])
            _n_combo += 1
print('combo pages', _n_combo)


# v2 homepage: Funding Circle-style "explore" groups instead of the purpose cards, plus the repayment calculator
def explore():
    col = lambda ic, t, d, base, items, all_label: (f'<div class="v2-ex"><span class="ll-card-ico">{ICON[ic]}</span><h3>{t}</h3><p>{d}</p><ul>'
        + ''.join(f'<li><a href="/{base}/{x["slug"]}">{x["name"]}{ARROW}</a></li>' for x in items) + f'</ul><a class="v2-link" href="/{base}">{all_label} {ARROW}</a></div>')
    return section(title_block('Explore business finance', 'Start with the type of loan, what it’s for or your industry. Or skip straight to the form.')
                   + '<div class="v2-explore">' + col('cash', 'Types of business loan', 'From unsecured loans to invoice finance and commercial mortgages.', 'business-loans', LN.LOANS[:7], 'All business loans')
                   + col('target', 'What it’s for', 'Cash flow, equipment, vehicles, stock, staff, premises or a tax bill.', 'business-needs', NEEDS, 'All business needs')
                   + col('briefcase', 'Your industry', 'How businesses in your sector use finance, and what lenders look at.', 'industries', INDS, 'All industries') + '</div>')
if NEEDS and INDS:
    _h = re.sub(r'<!--EXPLORE-->.*?(?=\n\n<div id="how-it-works">)', lambda m: explore(), home, count=1, flags=re.S).replace('<!--CALC-->', MINI_CALC.replace('href="/apply" class="button" data-o="cta"', 'href="#quote" class="button" data-o="cta"'))
    page(f'{PUB}/index.html', 'Business Loans & Finance for UK Companies | Loanleaf',
         'Find business loans and finance from £5,000 to £2m+. Answer a few quick questions and get matched with a specialist UK finance broker.',
         _h, '<link href="/assets/apply.css?v=64" rel="stylesheet"/>' + V2_HEAD, '<script src="/assets/apply.js?v=72"></script><script src="/assets/loan-math.js"></script><script src="/assets/minicalc.js?v=1"></script>')

# ---------------------------------------------------------------- how it works
HIW_STEPS = [
    ('Tell us what your business needs', 'Answer a few quick questions about how much you want to borrow, what it is for, how your business is set up and how long it has been trading. It takes about a minute, there is no credit check and it costs nothing.'),
    ('We match you with a specialist broker', 'We use your answers to find a broker who arranges the type of finance you are looking for, such as asset finance, invoice finance or an unsecured business loan. Your enquiry goes to that one broker only, never to a list.'),
    ('Your broker calls you with options', 'The broker contacts you, usually the same working day, to understand your business and talk through the options available from their lenders. There is no obligation to go ahead with anything they suggest.'),
]
HIW_AFTER = [
    ('clock', 'Within minutes', 'Your enquiry is sent to your matched broker as soon as you submit it. You will see a confirmation on screen.'),
    ('phone', 'Usually the same working day', 'Your broker calls or emails to introduce themselves and ask a few questions about your business and plans.'),
    ('doc', 'When you are ready', 'If you want to proceed, your broker tells you which documents lenders need, explains any fees and approaches suitable lenders.'),
    ('shield', 'Before you sign', 'Lenders make their own decision. You will see the full terms, costs and any security before you agree to anything.'),
]
HIW_NEED = ['Your business name and company structure', 'Roughly how much you want to borrow and what for', 'Your approximate annual revenue',
            'How long the business has been trading', 'A UK mobile number and an email address']
HIW_FAQ = [
    ('How long does the form take?', 'About a minute. It is a short set of multiple-choice questions, followed by your name and contact details.'),
    ('Does it affect my credit score?', 'No. Completing our form does not involve a credit check. A lender may carry out checks later if you decide to apply, and your broker will tell you before that happens.'),
    ('How much does Loanleaf cost?', 'Nothing. Loanleaf is free for businesses. We are paid by the brokers we introduce you to. Your broker will explain any fees of their own before you agree to anything.'),
    ('Who will contact me?', 'One specialist broker who arranges the type of finance you asked about. We don’t pass your details to a list of firms.'),
    ('Do I have to go ahead?', 'No. There is no obligation at any stage. You can talk through your options and decide not to proceed.'),
    ('Who can use Loanleaf?', 'UK limited companies and LLPs that have been trading for at least 6 months, with annual revenue of £50,000 or more, looking to borrow £5,000 or more.'),
    ('Is Loanleaf a lender or a broker?', 'Neither. Loanleaf is an introduction service run by Vertical Brands Ltd. We don’t give advice, arrange finance or make lending decisions, and we are not authorised by the FCA.'),
]
howto_ld = {'@context': 'https://schema.org', '@type': 'HowTo', 'name': 'How to find a business loan with Loanleaf', 'totalTime': 'PT1M',
            'step': [{'@type': 'HowToStep', 'position': i, 'name': t, 'text': d} for i, (t, d) in enumerate(HIW_STEPS, 1)]}
hiw_faq_ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
    {'@type': 'Question', 'name': fq, 'acceptedAnswer': {'@type': 'Answer', 'text': fa}} for fq, fa in HIW_FAQ]}
hiw = ''.join([
    f'<section class="ll-pagehead ll-hero-split"><div class="ll-hero-grid"><div><h1>One short form. The right specialist.</h1>'
    f'<p class="ll-lead">Loanleaf matches UK businesses with a broker who specialises in the finance they need, so the first conversation is a useful one.</p>'
    f'<ul class="ll-hero-ticks"><li>{TICK}About a minute to complete</li><li>{TICK}No credit check to get started</li><li>{TICK}Free, with no obligation</li></ul>'
    f'<div class="ll-head-btns"><a href="/apply" class="button"><div>Get a quote</div></a><a href="#steps" class="ll-ghost-light">See the steps</a></div></div>'
    f'<div class="ll-hero-media"><img src="/assets/stock-home.webp" alt="Café owner taking a payment at the counter" loading="eager" fetchpriority="high"/></div></div></section>',
    TRUST_STRIP,
    '<div id="steps"></div>',
    process(tuple(t for t, _ in HIW_STEPS), '/apply', 'Get a quote', title='Three simple steps'),
    section(title_block('Each step in detail') + accordion(HIW_STEPS, numbered=True), cls='section ll-tight'),
    section(title_block('What happens after you submit', 'A clear timeline, so you always know what comes next.') + cards([(ic, t, d, None) for ic, t, d in HIW_AFTER], 'four')),
    section(split('/assets/stock-tax.webp', f'<h2 class="heading-two">What you’ll need</h2><div class="large-text serif-typeface">No documents to start. Just a few details about your business.</div>{checks(HIW_NEED)}'
                  '<p class="ll-note" style="margin-top:24px">Your broker will tell you if lenders need anything else, such as bank statements or filed accounts, once you decide to go ahead.</p>')),
    section(title_block('Who Loanleaf is for') + yes_no('We can help', ['UK limited companies', 'Limited liability partnerships (LLPs)', 'Trading for 6 months or more', 'Annual revenue of £50,000 or more', 'Borrowing £5,000 to £2m+'],
                                                       'We can’t help', ['Sole traders', 'Ordinary partnerships', 'Businesses not yet trading', 'Personal or consumer borrowing'])),
    section(split('/assets/stock-about.webp', '<h2 class="heading-two">How we are paid</h2><div class="large-text serif-typeface">Loanleaf is free for businesses.</div>'
                  '<p class="ll-split-p-text">We are paid by the broker we introduce you to, so you never pay us. Your broker will explain any fees of their own, and lenders set their own rates and decide whether to lend.</p>'
                  '<a href="/how-we-make-money" class="button bg-base-50" style="margin-top:24px"><div>How we make money</div></a>', flip=True)),
    faq(HIW_FAQ, 'Ready to get started?', 'It takes about a minute.', '/apply', 'Get a quote', title='Questions about how it works'),
])
hiw = re.sub(r'<section class="section(?! padding-btm-0)', '<section class="section ll-compact', hiw)
page(f'{PUB}/how-it-works.html', 'How It Works: Find a Business Loan in 3 Steps | Loanleaf',
     'How Loanleaf works: answer a few quick questions, get matched with a specialist UK finance broker and talk through your business loan options. Free, no obligation.',
     hiw, ''.join(f'<script type="application/ld+json">{_json.dumps(x, ensure_ascii=False)}</script>' for x in (howto_ld, hiw_faq_ld)), backup=False)

# ---------------------------------------------------------------- guides hub + guide pages
import guides_content as GC
from datetime import date as _date
_fmt = lambda d: _date.fromisoformat(d).strftime('%-d %B %Y')
LOAN_NAMES = globals().get('LOAN_NAMES', {})  # filled by the loan-types block: slug -> name
os.makedirs(f'{PUB}/guides', exist_ok=True)


def guide_card(g):
    return (f'<a class="ll-gcard" href="/guides/{g["slug"]}"><span class="ll-gcat">{g["category"]}</span>'
            f'<b>{g["title"]}</b><p>{g["summary"]}</p><span class="ll-gmeta">{g["read_mins"]} min read</span></a>')


cats = []
for g in GC.GUIDES:
    if g['category'] not in cats: cats.append(g['category'])
hub = (page_head('Business finance guides', 'Plain-English guides to help UK business owners understand their options before they borrow.', kicker='Guides')
       + '<section class="ll-docsec"><div class="ll-guides"><div class="ll-ggrid">' + ''.join(guide_card(g) for g in GC.GUIDES) + '</div></div></section>' + cta('Ready to talk to a specialist?', 'Answer a few quick questions and we will match you with a broker.', '/apply', 'Get a quote'))
page(f'{PUB}/guides.html', 'Business Finance Guides for UK Companies | Loanleaf',
     'Plain-English guides to business loans: how to apply, what lenders look for, secured vs unsecured, documents you need and the Growth Guarantee Scheme.', hub, backup=False)


def loan_links(slugs):
    items = ''.join(f'<li><a href="/business-loans/{s}">{LOAN_NAMES.get(s, s.replace("-", " ").capitalize())}</a></li>' for s in slugs)
    return f'<div class="ll-gside"><h2>Related finance</h2><ul>{items}</ul></div>' if items else ''


for g in GC.GUIDES:
    others = [o for o in GC.GUIDES if o['slug'] != g['slug']][:3]
    art = {'@context': 'https://schema.org', '@type': 'Article', 'headline': g['title'], 'description': g['desc'], 'dateModified': g['updated'],
           'author': {'@type': 'Organization', 'name': 'Loanleaf'}, 'publisher': {'@type': 'Organization', 'name': 'Loanleaf', 'legalName': 'Vertical Brands Ltd'},
           'mainEntityOfPage': f'https://loanleaf.co/guides/{g["slug"]}'}
    crumbs = f'<nav class="ll-crumbs" aria-label="Breadcrumb"><a href="/guides">Guides</a><span>/</span><span>{g["category"]}</span></nav>'
    head = (f'<section class="ll-pagehead"><div class="ll-pagehead-in">{crumbs}<h1>{g["title"]}</h1>'
            f'<p class="ll-gmeta-head">Updated {_fmt(g["updated"])} · {g["read_mins"]} min read · By the Loanleaf team</p></div></section>')
    body = (head + f'<section class="ll-docsec"><div class="ll-guide-wrap"><article>{blocks_html(g["body"])}'
            '<p class="ll-disclaimer">This guide is general information, not financial advice. Loanleaf is an introduction service, not a lender or broker, and is not authorised by the FCA. Check the details with your broker or lender before you borrow.</p>'
            f'</article><aside>{loan_links(g["related_loans"])}<div class="ll-gside ll-gside-cta"><h2>Find the right business loan</h2><p>One short form. A specialist broker calls you.</p><a href="/apply" class="button">Get a quote</a></div></aside></div></section>'
            + section(title_block('More guides') + '<div class="ll-ggrid">' + ''.join(guide_card(o) for o in others) + '</div>'))
    page(f'{PUB}/guides/{g["slug"]}.html', g['meta_title'], g['desc'], body,
         f'<script type="application/ld+json">{_json.dumps(art, ensure_ascii=False)}</script>', backup=False)


# ---------------------------------------------------------------- partner keyword landing pages (tools/seo_content/*.json)
# Partner hero photos, rotated so neighbouring pages never share one (owner: not the same photo on every page).
# (file, mirror, horizontal focus) - mirrored ones have the person on the left in the original.
PH_POOL = [('stock-p-desk-review', False, 50), ('stock-p-present-screen', False, 40), ('stock-p-cafe-meeting', False, 50),
           ('stock-p-window-desk', False, 60), ('stock-p-tablet-chat', False, 55), ('stock-p-coffee-project', False, 50),
           ('stock-p-two-women', False, 60), ('stock-p-city-window', False, 65),
           ('stock-p-round-table', False, 50), ('stock-p-reports', False, 45), ('stock-p-standing-desk', False, 62),
           ('stock-p-cafe-laptop', False, 65), ('stock-p-brick-meeting', False, 55), ('stock-p-loft-desk', False, 80),
           ('stock-p-boardroom', False, 50)]
_ph_n = [0]


def ph_hero(h1, lead, ticks, btns):
    """Partner pages: split hero (copy left, photo right), same layout as the business pages."""
    f, flip, x = PH_POOL[_ph_n[0] % len(PH_POOL)]
    _ph_n[0] += 1
    li = ''.join(f'<li>{TICK}{t}</li>' for t in ticks)
    img = f'/assets/{f}.webp'
    style = f' style="object-position:{x}% 30%"'
    return (f'<section class="ll-pagehead ll-hero-split"><div class="ll-hero-grid"><div>'
            f'<h1>{h1}</h1><p class="ll-lead">{lead}</p><ul class="ll-hero-ticks">{li}</ul><div class="ll-head-btns">{btns}</div></div>'
            f'<div class="ll-hero-media"><img class="{"ph-flip" if flip else ""}" src="{img}" alt="" loading="eager" fetchpriority="high"{style}/></div></div></section>')


SEO_PAGES = [_json.load(open(f)) for f in sorted(glob.glob('tools/seo_content/*.json'))]
SEO_NAMES = {d['slug']: d['h1'] for d in SEO_PAGES}
SEO_IMG = {'asset-finance-leads': 'asset', 'bridging-finance-leads': 'bridging', 'business-loan-leads': 'broker-desk',
           'commercial-finance-leads': 'broker-call', 'mca-leads': 'mca', 'commercial-mortgage-leads': 'commercial'}


def seo_blocks(blocks):
    return ''.join(f'<p>{b}</p>' if isinstance(b, str) else '<ul>' + ''.join(f'<li>{x}</li>' for x in b['list']) + '</ul>' for b in blocks)


for d in SEO_PAGES:
    url = f'https://loanleaf.co/partners/{d["slug"]}'
    lead1 = re.split(r'(?<=[.])\s', d['summary'], maxsplit=1)[0]
    strip = lambda x: re.sub(r'<[^>]+>', '', x)
    schemas = [org_schema,
               {**svc_schema, 'name': d['h1'], 'url': url, 'description': d['description']},
               {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
                   {'@type': 'Question', 'name': f['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': strip(f['a'])}} for f in d['faqs']]},
               {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
                   {'@type': 'ListItem', 'position': 1, 'name': 'Partners', 'item': 'https://loanleaf.co/partners'},
                   {'@type': 'ListItem', 'position': 2, 'name': d['h1'], 'item': url}]}]
    head_extra = f'<link rel="canonical" href="{url}"/>' + ''.join(f'<script type="application/ld+json">{_json.dumps(x, ensure_ascii=False)}</script>' for x in schemas)
    crumbs = '<nav class="ll-crumbs" aria-label="Breadcrumb"><a href="/partners">Partners</a><span>/</span><span>Lead types</span></nav>'
    others = ''.join(f'<li><a href="/partners/{s}">{n}</a></li>' for s, n in SEO_NAMES.items() if s != d['slug'])
    body = (ph_hero(d['h1'], lead1, ['Exclusive: each lead sold to one broker only', '£20 to £300 per lead, priced by fundability', 'Delivered in real time to email, platform or CRM'],
                    '<a href="/partners/apply" class="button"><div>Become a partner</div></a>')
            + '<section class="ll-docsec"><div class="ll-guide-wrap"><article><div class="ll-doc">'
            + f'<p><b>{d["summary"]}</b></p>' + ''.join(f'<h2>{s["h2"]}</h2>{seo_blocks(s["blocks"])}' for s in d['sections']) + '</div>'
            + '<p class="ll-disclaimer">Loanleaf is a trading name of Vertical Brands Ltd and an introducer, not a lender or broker. It is not authorised by the FCA. Partners are responsible for their own regulatory position.</p>'
            '</article><aside><div class="ll-gside ll-gside-cta"><h2>Start buying leads</h2><p>Book a call with our team or send an enquiry. It takes under a minute.</p>'
            '<a href="/partners/apply" class="button">Become a partner</a></div>'
            f'<div class="ll-gside"><h2>Other lead types</h2><ul>{others}</ul></div></aside></div></section>'
            + faq([(f['q'], f['a']) for f in d['faqs']], 'Prefer to talk first?', 'Book a call with our team or send an enquiry.', '/partners/apply', 'Become a partner')
            + cta(d['cta_h2'], 'Book a call with our team or send an enquiry. It takes under a minute.', '/partners/apply', 'Become a partner'))
    page(f'{PUB}/partners/{d["slug"]}.html', d['title'], d['description'], body, head_extra, header='PARTNERS_HEADER', backup=False)
print('seo pages', len(SEO_PAGES))

# ---------------------------------------------------------------- partner info pages (tools/partner_pages/*.json): how it works, platform, pricing, guides
P_SECTIONS = [('How it works', ['how-it-works', 'getting-started', 'lead-generation', 'lead-verification', 'exclusive-leads', 'lead-delivery', 'refunds', 'custom-campaigns']),
              ('Platform', ['platform', 'platform/opportunities', 'platform/auto-buy', 'platform/lead-management', 'platform/crm-integrations', 'platform/broker-profile', 'platform/credits-and-billing']),
              ('Pricing', ['pricing', 'lead-quality-score']),
              ('Guides', P_GUIDES)]
PF_LOCK = {'platform': ('Platform', 'The broker portal, explained'), 'platform/opportunities': ('Opportunities', 'The live lead marketplace'),
           'platform/auto-buy': ('Autobuy', 'Get matching leads the moment they arrive'), 'platform/lead-management': ('My leads', 'Work your pipeline, lead by lead'),
           'platform/crm-integrations': ('Integrations', 'Send every lead to your CRM by webhook'), 'platform/broker-profile': ('Profile', 'What the business owner sees when matched'),
           'platform/credits-and-billing': ('Billing', 'Credits, plans and invoices')}
CPL_EMBED = CPL.replace('<h1>Cost per lead calculator</h1>', '<h2 class="heading-two">What would a lead cost?</h2>', 1)
P_IMG = {'How it works': 'broker-call', 'Platform': 'broker-desk', 'Pricing': 'calc', 'Guides': 'broker-support'}
for sec, slugs in P_SECTIONS:
    for slug in slugs:
        d = PP.get(slug)
        if not d:
            continue
        url = f'https://loanleaf.co/partners/{slug}'
        lead1 = re.split(r'(?<=[.])\s', d['summary'], maxsplit=1)[0]
        strip = lambda x: re.sub(r'<[^>]+>', '', x)
        hub = '/partners/guides' if sec == 'Guides' else f'/partners/{slugs[0]}'
        schemas = [org_schema,
                   {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
                       {'@type': 'Question', 'name': f['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': strip(f['a'])}} for f in d['faqs']]},
                   {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
                       {'@type': 'ListItem', 'position': 1, 'name': 'Partners', 'item': 'https://loanleaf.co/partners'},
                       {'@type': 'ListItem', 'position': 2, 'name': sec, 'item': f'https://loanleaf.co{hub}'},
                       {'@type': 'ListItem', 'position': 3, 'name': d['h1'], 'item': url}]}]
        head_extra = f'<link rel="canonical" href="{url}"/>' + ''.join(f'<script type="application/ld+json">{_json.dumps(x, ensure_ascii=False)}</script>' for x in schemas)
        crumbs = f'<nav class="ll-crumbs" aria-label="Breadcrumb"><a href="/partners">Partners</a><span>/</span><a href="{hub}">{sec}</a><span>/</span><span>{d.get("nav", d["h1"])}</span></nav>'
        _cur = ' aria-current="page"'
        others = ''.join(f'<li><a href="/partners/{s}"{_cur if s == slug else ""}>{PP[s].get("nav", PP[s]["h1"])}</a></li>' for s in slugs if s in PP)
        h1 = d['h1']
        if slug in PF_LOCK:  # platform feature pages: leaf + feature name in the logo style, then the title
            nm, ttl = PF_LOCK[slug]
            h1 = f'<span class="pf-lock"><img src="/assets/loanleaf-leaf-white.png" alt="" width="46" height="46"/><span>{nm}</span></span><span class="pf-title">{ttl}</span>'
        body = (ph_hero(h1, lead1, ['Exclusive: each lead sold to one broker only', 'UK limited companies and LLPs, £5,000 to £2m+', 'Delivered in real time to email, platform or CRM'],
                        '<a href="/partners/apply" class="button"><div>Become a partner</div></a><a href="https://platform.loanleaf.co/register" class="ll-ghost-light">Create an account</a>')
                + (CPL_EMBED if slug in ('pricing', 'lead-quality-score') else '')
                + '<section class="ll-docsec"><div class="ll-guide-wrap"><article><div class="ll-doc">'
                + f'<p><b>{d["summary"]}</b></p>' + ''.join(f'<h2>{s["h2"]}</h2>{seo_blocks(s["blocks"])}' for s in d['sections']) + '</div>'
                + '<p class="ll-disclaimer">Loanleaf is a trading name of Vertical Brands Ltd and an introducer, not a lender or broker. It is not authorised by the FCA. Partners are responsible for their own regulatory position.</p>'
                f'</article><aside><div class="ll-gside"><h2>{sec}</h2><ul>{others}</ul></div>'
                '<div class="ll-gside ll-gside-cta"><h2>Start buying leads</h2><p>Book a call with our team or send an enquiry. It takes under a minute.</p>'
                '<a href="/partners/apply" class="button">Become a partner</a></div></aside></div></section>'
                + faq([(f['q'], f['a']) for f in d['faqs']], 'Prefer to talk first?', 'Book a call with our team or send an enquiry.', '/partners/apply', 'Become a partner')
                + cta(d['cta_h2'], d.get('cta_text', 'Book a call with our team or send an enquiry.'), '/partners/apply', 'Become a partner'))
        if slug in ('pricing', 'lead-quality-score'):  # pricing pages carry the cost per lead calculator
            head_extra += '<link href="/assets/apply.css?v=64" rel="stylesheet"/><link href="/assets/partner-enquiry.css?v=10" rel="stylesheet"/>'
        os.makedirs(os.path.dirname(f'{PUB}/partners/{slug}.html'), exist_ok=True)
        page(f'{PUB}/partners/{slug}.html', d['title'], d['description'], body, head_extra,
             '<script src="/assets/cpl-calculator.js?v=8"></script>' if slug in ('pricing', 'lead-quality-score') else '', header='PARTNERS_HEADER', backup=False)

# guides hub
_gl = [g for g in P_GUIDES if g in PP]
_first = lambda t: re.split(r'(?<=[.])\s', t, maxsplit=1)[0]
if _gl:
    cards_html = ''.join(f'<a class="ll-pcard" href="/partners/{g}"><img src="/assets/stock-{["broker-call", "broker-desk", "broker-support"][i % 3]}.webp" alt="" loading="lazy"/><div><span class="ll-gcat">Broker guide</span><b>{PP[g]["h1"]}</b><p>{_first(PP[g]["summary"])}</p></div></a>' for i, g in enumerate(_gl))
    page(f'{PUB}/partners/guides.html', 'Guides for Finance Brokers: Converting Business Loan Leads | Loanleaf',
         'Practical guides for UK finance brokers: speed to lead, first call scripts, qualifying enquiries, follow-up and handling lead data.',
         page_head('Guides for finance brokers', 'Practical help for turning business finance enquiries into completed deals.') + f'<section class="ll-docsec"><div class="ll-guides"><div class="ll-ggrid">{cards_html}</div></div></section>'
         + cta('Ready for exclusive leads?', 'Book a call with our team or send an enquiry. It takes under a minute.', '/partners/apply', 'Become a partner'),
         header='PARTNERS_HEADER', backup=False)

# partner questions and answers (the full FAQ set from the partners page)
page(f'{PUB}/partners/faq.html', 'Questions and Answers for Finance Brokers | Loanleaf',
     'Answers for UK finance brokers about Loanleaf leads: exclusivity, qualification, pricing, auto-buy, delivery, refunds and getting started.',
     page_head('Questions and answers', 'Everything brokers ask about Loanleaf leads, the platform and pricing.')
     + section(faq_tabs(PC.FAQ_GROUPS), cls='section ll-compact')
     + cta('Still have a question?', 'Book a call with our team or send an enquiry.', '/partners/apply', 'Talk to the team'),
     '<link rel="canonical" href="https://loanleaf.co/partners/faq"/>', '<script src="/assets/tabs.js?v=2"></script>', header='PARTNERS_HEADER', backup=False)
print('partner pages', sum(s in PP for _, sl in P_SECTIONS for s in sl))

# ---------------------------------------------------------------- blog
import blog_content as BC
os.makedirs(f'{PUB}/blog', exist_ok=True)
BLOG_IMG = ['stock-home', 'stock-calc', 'stock-unsecured', 'stock-invoice', 'stock-rcf', 'stock-tax', 'stock-secured', 'stock-commercial', 'stock-mca', 'stock-about']
POST_IMG, _n = {}, 0  # API posts carry their own image; hand-written ones keep the rotation they always had
for p in BC.POSTS:
    if p.get('img'): POST_IMG[p['slug']] = p['img']
    else: POST_IMG[p['slug']] = f'/assets/{BLOG_IMG[_n % len(BLOG_IMG)]}.webp'; _n += 1
open(f'{PUB}/blog-posts.json', 'w').write(_json.dumps([{k: p[k] for k in ('slug', 'title', 'category', 'date', 'summary')} for p in BC.POSTS], ensure_ascii=False, indent=1) + '\n')


def post_card(p, big=False):
    return (f'<a class="ll-pcard{" big" if big else ""}" href="/blog/{p["slug"]}"><img src="{POST_IMG[p["slug"]]}" alt="" loading="{"eager" if big else "lazy"}"/>'
            f'<div><span class="ll-gcat">{p["category"]}</span><b>{p["title"]}</b><p>{p["summary"]}</p>'
            f'<span class="ll-gmeta">{_fmt(p["date"])} · {p["read_mins"]} min read</span></div></a>')


blog_hub = (page_head('The Loanleaf blog', 'Practical ideas on cash flow, borrowing and growth for UK business owners.', kicker='Blog')
            + '<section class="ll-docsec"><div class="ll-guides">' + post_card(BC.POSTS[0], big=True)
            + '<div class="ll-ggrid">' + ''.join(post_card(p) for p in BC.POSTS[1:]) + '</div></div></section>'
            + cta('Looking for a business loan?', 'Answer a few quick questions and we will match you with a specialist broker.', '/apply', 'Get a quote'))
page(f'{PUB}/blog.html', 'Business Finance Blog for UK Companies | Loanleaf',
     'Practical articles on cash flow, borrowing, tax and growth for UK limited companies and LLPs, from the Loanleaf team.', blog_hub, backup=False)

for p in BC.POSTS:
    others = [o for o in BC.POSTS if o['slug'] != p['slug']][:3]
    art = {'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': p['title'], 'description': p['desc'], 'datePublished': p['date'],
           'image': f'https://loanleaf.co{POST_IMG[p["slug"]]}', 'author': {'@type': 'Organization', 'name': 'Loanleaf'},
           'publisher': {'@type': 'Organization', 'name': 'Loanleaf', 'legalName': 'Vertical Brands Ltd'}, 'mainEntityOfPage': f'https://loanleaf.co/blog/{p["slug"]}'}
    head = (f'<section class="ll-pagehead"><div class="ll-pagehead-in"><nav class="ll-crumbs" aria-label="Breadcrumb"><a href="/blog">Blog</a><span>/</span><span>{p["category"]}</span></nav>'
            f'<h1>{p["title"]}</h1><p class="ll-gmeta-head">{_fmt(p["date"])} · {p["read_mins"]} min read · By the Loanleaf team</p></div></section>')
    body = (head + f'<section class="ll-docsec"><div class="ll-guide-wrap"><article><img class="ll-post-img" src="{POST_IMG[p["slug"]]}" alt="" loading="eager"/>{blocks_html(p["body"])}'
            '<p class="ll-disclaimer">This article is general information, not financial advice. Loanleaf is an introduction service, not a lender or broker, and is not authorised by the FCA.</p>'
            f'</article><aside>{loan_links(p["related_loans"])}<div class="ll-gside ll-gside-cta"><h2>Find the right business loan</h2><p>One short form. A specialist broker calls you.</p><a href="/apply" class="button">Get a quote</a></div></aside></div></section>'
            + section(title_block('More from the blog') + '<div class="ll-ggrid">' + ''.join(post_card(o) for o in others) + '</div>'))
    page(f'{PUB}/blog/{p["slug"]}.html', p['meta_title'], p['desc'], body,
         f'<script type="application/ld+json">{_json.dumps(art, ensure_ascii=False)}</script>', backup=False)


# ---------------------------------------------------------------- immigration landing (homepage layout, immigration enquiry form in the hero)
# Form logic lives in public/immigration/enquire.js (same as /immigration/enquire). Kept out of search for now.
IM_TRUST = [('shield', 'Free first consultation', '15 minutes with a solicitor'), ('clock', 'A call from a solicitor', 'To talk through where you stand'),
            ('scale', 'Specialist solicitors', 'UK immigration law, nothing else'), ('doc', 'Your data protected', 'Only shared with your consent')]
im_trust = ('<section class="ll-trust" aria-label="Why Loanleaf"><div class="ll-trust-in">' + ''.join(
    f'<div class="ll-trust-item"><span class="ll-trust-ico">{ICON[ic]}</span><div><b>{t}</b><span>{d}</span></div></div>' for ic, t, d in IM_TRUST) + '</div></section>')
immigration = f'''
<section class="ll-hero" id="quote">
<div class="ll-hero-in"><div>
<h1 class="im-title"><span>Free 15-Minute Consultation</span> With a UK Immigration Solicitor</h1>
<p class="ll-lead">Tell us what you need and we'll match you with a specialist UK immigration solicitor, who will call you.</p>
<ul class="ll-hero-points"><li>{TICK}Free 15-minute phone consultation</li><li>{TICK}A call back from a solicitor</li><li>{TICK}England, Scotland, Wales and Northern Ireland</li></ul>
</div>{FORM}</div></section>
{im_trust}
{section(f"""<div class="ll-section-title"><h2 class="heading-two">Immigration help for employers and families</h2><div class="large-text serif-typeface">Whatever your situation, start with one short form.</div></div>
{cards([
  ('briefcase', 'Sponsor licences', 'Apply for a licence so your business can employ workers from overseas.', '#quote'),
  ('doc', 'Skilled Worker visas', 'Certificates of Sponsorship and visa applications for new or existing staff.', '#quote'),
  ('shield', 'Sponsor compliance', 'Right to work checks, record keeping and Home Office audits.', '#quote'),
  ('heart', 'Spouse, partner and family visas', 'Bring your partner or family to the UK, or extend their stay.', '#quote'),
  ('key', 'Indefinite leave to remain', 'Settle in the UK permanently once you qualify.', '#quote'),
  ('pin', 'British citizenship', 'Naturalisation and registration as a British citizen.', '#quote'),
  ('globe', 'Standard Visitor visas', 'Visit the UK for tourism, family or business.', '#quote'),
  ('growth', 'Global Talent and Innovator Founder', 'Routes for leaders in their field and new business founders.', '#quote'),
], more_label='Book a free call')}""")}
{process(('Tell us what you need', 'We match you with a specialist solicitor', 'They call you for a free 15-minute consultation'), '#quote', 'Book a free call')}
{section(split('/assets/stock-legal-meet.webp', f"""<h2 class="heading-two">Speak to a solicitor, not a call centre.</h2>
<div class="large-text serif-typeface">Instead of ringing round firms, you fill in one form and speak to an immigration solicitor who already knows what you need.</div>
{checks(['One short form instead of calling round firms', 'A solicitor who specialises in UK immigration law', 'Your enquiry goes to one firm, not a list', 'A free first consultation, with no obligation'])}
<div class="ll-actions" style="margin-top:32px"><a href="#quote" class="button w-inline-block"><div>Book a free call</div></a></div>""", alt='A solicitor talking with a client'))}
{photo_box('/assets/stock-legal-call.webp', f"""<div class="section-title"><h2 class="heading-two">Who we can help</h2><div class="large-text serif-typeface">Our solicitors work with employers and individuals across the UK.</div><div class="horizontal-line"></div></div>
{checks(['Employers sponsoring or hiring overseas staff', 'People applying for a visa, settlement or citizenship', 'Anyone with a visa deadline coming up', 'Clients in England, Scotland, Wales and Northern Ireland'], white=True)}
<a href="#quote" class="button w-inline-block"><div>Book a free call</div></a>""", cls='section padding-btm-0', photo=True, alt='A woman checking her phone at a desk')}
{faq([
  ('Is Loanleaf a law firm?', 'No. Loanleaf is a free introduction service. We pass your enquiry to one specialist UK immigration law firm, and their solicitors give you the advice. We don&#39;t give legal advice ourselves.'),
  ('Is the first consultation really free?', 'Yes. Your first call is a free 15-minute phone consultation with a solicitor. If you want them to act for you after that, they&#39;ll explain their fees before any work starts.'),
  ('When will someone call me?', 'The solicitor will call you to talk it through, so please give a mobile number you can answer.'),
  ('Do you cover Scotland, Wales and Northern Ireland?', 'Yes. Our partner firm advises clients across the whole of the UK.'),
  ('Can you help with asylum?', 'No. Asylum and refugee protection are outside the services our partner firm offers. GOV.UK and the Refugee Council can point you to free specialist help.'),
  ('Can you find me a job or a sponsor?', 'No. The solicitors advise employers and people who already have a route into the UK. They can&#39;t find you a job or a sponsoring employer.'),
  ('What happens to my information?', 'We only share your details with the law firm we match you with, and only if you agree. Read our <a href="/privacy-policy">Privacy Policy</a> for the full details.'),
], 'Ready to talk to a solicitor?', 'It only takes a couple of minutes.', '#quote', 'Book a free call')}
{cta('Speak to a UK immigration solicitor', 'Answer a few quick questions and a solicitor will call you back.', '#quote', 'Book a free call')}
'''
page(f'{PUB}/immigration/index.html', 'Free 15-Minute Consultation With a UK Immigration Solicitor | Loanleaf',
     'Talk to a specialist UK immigration solicitor. Free 15-minute phone consultation for employers, visas, settlement and citizenship.',
     immigration, '<link href="/assets/apply.css?v=64" rel="stylesheet"/><link href="/immigration/immigration.css?v=4" rel="stylesheet"/><meta name="robots" content="noindex"/>',
     '<script src="/immigration/enquire.js?v=10"></script>',
     header=header_b('index.html').replace('<div>Get a quote</div>', '<div>Book a free call</div>'), backup=False)

# ---------------------------------------------------------------- shared nav on every other page
for f in glob.glob(f'{PUB}/**/*.html', recursive=True):
    name = os.path.relpath(f, PUB)
    if name in ('index.html', 'business-finance.html', 'apply.html', 'business-loans-uk.html', 'partners.html', 'about.html', 'contact.html', '404.html', 'how-it-works.html', 'how-we-make-money.html', 'complaints.html', 'accessibility.html', 'press.html', 'partners/apply.html', 'partners/cost-per-lead-calculator.html', 'partners/legal.html', 'partners/legal/apply.html', 'business-loan-calculator.html', 'platform/index.html', 'immigration/index.html', 'immigration/enquire.html') or name.startswith('partners/'):  # partner pages are all built with the partner header
        continue
    h = open(f).read()
    h2 = with_nav(h, os.path.basename(f))
    if h2 != h:
        open(f, 'w').write(h2)
print('built')

# ---------------------------------------------------------------- sitemap + robots
_urls = []
for f in sorted(glob.glob(f'{PUB}/**/*.html', recursive=True)):
    h = open(f).read()
    if 'name="robots" content="noindex"' in h or f.endswith('404.html'):
        continue
    rel = os.path.relpath(f, PUB)[:-5]
    _urls.append('https://loanleaf.co' + ('/' if rel == 'index' else '/' + rel))
open(f'{PUB}/sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
                                      + ''.join(f'<url><loc>{u}</loc></url>' for u in _urls) + '</urlset>\n')
open(f'{PUB}/robots.txt', 'w').write('User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://loanleaf.co/sitemap.xml\n')
print('sitemap', len(_urls))

