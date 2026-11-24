# Builds every Leaflegal page (client side, practice areas, law-firm partner pages, company pages) from the site's own shell (head, footer, scripts)
# and theme sections, and puts the shared header and footer on every page. Run from the repo root:  python3 tools/build_pages.py
# Copy rules: plain English, no em dashes, no eyebrow labels. Leaflegal never gives legal or immigration advice.
import glob, os, re
from urllib.parse import quote

PUB = 'public'
os.makedirs('backup', exist_ok=True)
import sys as _sys
_sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seo_keywords import SEO, AUTO_LINKS, LOCAL_TITLE  # keyword targets from Ahrefs UK data


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
    'tag': I('<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
    'chat': I('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>'),
    'calendar': I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14h2M14 14h2M8 17.5h2"/>'),
    'sliders': I('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    'pen': I('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4M14 20h6"/>'),
    'phonecall': I('<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/><path d="M15 3a6 6 0 0 1 6 6M15 7a2 2 0 0 1 2 2"/>'),
    'rocket': I('<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>'),
    'check': I('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 10"/>'),
    'bolt': I('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
    'unlock': I('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.7-1.5M12 15v2"/>'),
    'form': I('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3M9 10h6M9 14h6M9 18h3"/>'),
    'pin': I('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
}
# Client how it works steps (tell us, one regulated firm, they contact you). Icons, never step numbers (Aran, 24 Nov).
STEP_ICONS = ['form', 'shield', 'phonecall']
TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'
CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>'
ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'


def checks(items, white=False):
    icon = asset('interface-icon-checkmark-white.svg' if white else 'interface-icon-checkmark.svg')
    border = ' white-border' if white else ''
    return '<div class="check-list">' + ''.join(
        f'<div class="check-item"><div class="check-circle{border}"><img src="{icon}" alt="" class="check-circle-icon"/></div><div>{t}</div></div>'
        for t in items) + '</div>'


# homepage card title -> matching option in the form's area step
def cards(items, cls='', more_label='Get a quote'):
    """items: (icon, title, text, href or None)"""
    out = []
    for ic, t, d, href in items:
        tag, attr = ('a', f' href="{href}"') if href else ('div', '')
        if href and t in PURPOSE: attr += f' data-area="{PURPOSE[t]}"'
        more = f'<span class="ll-more">{more_label} {ARROW}</span>' if href else ''
        out.append(f'<{tag} class="ll-card"{attr}><span class="ll-card-ico">{ICON[ic]}</span><b>{t}</b><p>{d}</p>{more}</{tag}>')
    return f'<div class="ll-cards {cls}">' + ''.join(out) + '</div>'


def process(steps, cta_href, cta_label, title='How it works'):
    arrow1, arrow2 = asset('process-arrow.svg'), asset('process-arrow-2.svg')
    (a, b, c) = steps
    return f'''<section class="section"><div class="container---main"><div class="vertical-section-content reduced-gap">
<h2 class="heading-two">{title}</h2>
<div class="process-wrapper">
<div class="process-step align-top-right"><div class="process-box step-1"><div class="process-number-circle">{ICON["form"]}</div><div class="process-box-text"><div class="heading-four">{a}</div></div></div><img src="{arrow1}" alt="" class="process-arrow step-1"/></div>
<div class="process-box large-box"><div class="process-number-circle">{ICON["shield"]}</div><div class="process-box-text"><div class="heading-four">{b}</div></div></div>
<div class="process-step align-bottom-left"><img src="{arrow2}" alt="" class="process-arrow step-3"/><div class="process-box bg-base-100"><div class="process-number-circle">{ICON["phonecall"]}</div><div class="process-box-text"><div class="heading-four">{c}</div></div></div></div>
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


NAV_JS = '<script src="/assets/nav.js?v=3"></script>'
NAV_RE = re.compile(r'(<div class="announcement-bar">.*?</div></div></div>)?<div class="navbar-wrapper">.*?class="nav-menu-close"/></div>|<header class="ll-nav">.*?</header>|<header class="llb-head">.*?</header>', re.S)
ACTIVE = {'index.html': 'home', 'partners.html': 'partners', 'about.html': 'about', 'contact.html': 'contact'}

FOOT_RE = re.compile(r'<div class="footer">.*?(?=<script)|<footer class="llf">.*?</footer>', re.S)


OG_IMG = '<meta property="og:image" content="https://leaflegal.co/assets/og-default.png"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta name="twitter:image" content="https://leaflegal.co/assets/og-default.png"/>'


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
        h = re.sub(r'/assets/masthead\.css\?v=\d+', '/assets/masthead.css?v=26', h)
    else:
        h = h.replace('</head>', '<link href="/assets/masthead.css?v=26" rel="stylesheet"/></head>', 1)
    h = re.sub(r'<script src="/assets/masthead\.js[^"]*"></script>', '', h)
    h = h.replace('</body>', '<script src="/assets/masthead.js?v=6"></script></body>', 1)
    h = re.sub(r'/assets/site\.css\?v=\d+', '/assets/site.css?v=48', h)
    if 'assets/site.css' not in h:
        h = h.replace('</head>', '<link href="/assets/site.css?v=48" rel="stylesheet"/></head>', 1)
    h = re.sub(r'<script src="/assets/nav\.js[^"]*"></script>', '', h)
    h = h.replace('</body>', NAV_JS + '</body>', 1)
    return h


SHELL = open('backup/contact.html' if os.path.exists('backup/contact.html') else f'{PUB}/contact.html').read()  # original page shell (contact.html is now generated)


def _deep_key(path):
    rel = os.path.relpath(path, PUB)[:-5]
    top = {'index': 'page__home', 'how-it-works': 'page__how-it-works', 'about': 'page__about', 'how-we-make-money': 'page__how-we-make-money',
           'legal-services': 'page__legal-services', 'solicitors': 'page__solicitors', 'guides': 'page__guides', 'partners': 'partner__index'}
    if rel in top:
        return top[rel], None
    if rel.startswith('guides/'):
        return 'guide__' + rel[7:], None
    if rel.startswith('partners/'):
        k = 'partner__' + rel[9:].replace('/', '--')
        parent = 'partner__' + rel[9:].split('/')[0] if '/' in rel[9:] else None
        return k, parent
    if rel.startswith('solicitors/') and rel.count('/') == 1:
        return 'page__solicitors', None
    return None, None


def _add_deep(path, body):
    if 'cs-deep' in body or 'deep' not in globals():
        return body, False
    key, parent = _deep_key(path)
    if not key:
        return body, False
    d = deep(key)
    rot = 0
    if not d and parent:
        d = deep(parent)
        rot = sum(map(ord, path)) % 7
    if not d:
        return body, False
    partner = key.startswith('partner__')
    about = d['about'][rot % len(d['about']):] + d['about'][:rot % len(d['about'])]
    lead = 'Pick a topic to read more.'
    sec = cs_deep('Everything you need to know', {'about': about}, lead=lead)
    if partner:
        sec = sec.replace('<section class="section cs-sec">', '<section class="cfb-sec cfb-anat cs-sec">', 1)
    if 'id="faq"' not in body:
        groups = [(g, [tuple(x) for x in qas]) for g, qas in d['faqs']]
        if rot:
            groups = groups[rot % len(groups):] + groups[:rot % len(groups)]
        href = '/partners/apply' if partner else '/apply'
        sec += cs_faqs('Questions and answers', groups, 'Prefer to talk first?' if partner else 'Ready to get started?',
                       'Book a call with our team.' if partner else 'One short form. One specialist firm contacts you.', href, 'Book a call' if partner else 'Get matched')
    i = body.find('id="faq"')
    if i == -1:
        i = body.rfind('<div class="ll-cta">')
    if i != -1:
        i = body.rfind('<section', 0, i)
        body = body[:i] + sec + body[i:]
    else:
        body += sec
    return body, True


_TOPUP_SKIP = ('404', 'apply', 'contact', 'press', 'accessibility', 'complaints', 'cookie-policy', 'privacy-policy', 'terms-conditions', 'partners/apply', 'partners/faq')


def _words(html_):
    t = re.sub(r'<(script|style|nav)[^>]*>.*?</\1>', '', html_, flags=re.S)
    return len(re.sub(r'<[^>]+>', ' ', t).split())


def _pool(rel):
    parts = rel.split('/')
    areas = [a['slug'] for a in AC.AREAS]
    if parts[0] == 'partners':
        if len(parts) == 3:  # partner matter page, show what clients ask
            area = {AL[a]['slug']: a for a in AL}.get(parts[1]) if 'AL' in globals() else None
            if area:
                return [f'{area}__{parts[2]}', area]
        return [os.path.basename(x)[:-5] for x in sorted(glob.glob(os.path.join(_DEEP_DIR, 'partner__*.json')))]
    if parts[0] == 'guides' and len(parts) == 2:
        g = next((x for x in CG.GUIDES if x['slug'] == parts[1]), None)
        if g:
            return [g['area']] + [f'{g["area"]}__{m["slug"]}' for m in MAT[g['area']]]
    if parts[0] in areas:
        return [f'{parts[0]}__{m["slug"]}' for m in MAT[parts[0]]] + [parts[0]]
    return areas


def _topup(path, body, target=5150):
    rel = os.path.relpath(path, PUB)[:-5]
    if rel in _TOPUP_SKIP or rel.startswith('enquire/') or '/platform' in path or 'deep' not in globals():
        return body
    need = target - _words(body)
    if need <= 0:
        return body
    pool = [k for k in _pool(rel) if os.path.exists(os.path.join(_DEEP_DIR, k + '.json'))]
    if not pool:
        return body
    h = sum(map(ord, rel))
    used = set(re.findall(r'<summary class="large-text bold-text">(.*?)<svg', body))
    groups, got = [], 0
    for j in range(len(pool)):
        k = pool[(h + j) % len(pool)] if not rel.startswith('partners/') or rel.count('/') != 2 else pool[j]
        d = deep(k)
        for gname, qas in d['faqs']:
            qs = [tuple(x) for x in qas if x[0] not in used]
            if not qs:
                continue
            groups.append((gname, qs))
            used.update(q for q, _ in qs)
            got += sum(len((q + ' ' + a).split()) for q, a in qs)
            if got >= need + 150 or len(groups) >= 6:
                break
        if got >= need + 150 or len(groups) >= 6:
            break
    if not groups:
        return body
    partner = rel.startswith('partners')
    title = 'What clients ask' if partner and rel.count('/') == 2 else 'More questions people ask'
    sec = cs_faqs(title, groups, 'Prefer to talk first?' if partner else 'Ready to get started?',
                  'Book a call with our team.' if partner else 'One short form. One specialist firm contacts you.',
                  '/partners/apply' if partner else '/apply', 'Book a call' if partner else 'Get matched', uid='faq2')
    i = body.rfind('<div class="ll-cta">')
    if i != -1:
        i = body.rfind('<section', 0, i)
        return body[:i] + sec + body[i:]
    return body + sec


def page(path, title, desc, body, extra_head='', extra_js='', header=None, backup=True):
    body, _added = _add_deep(path, body)
    body = _topup(path, body)
    _url = '/' + os.path.relpath(path, PUB)[:-5]
    if _url in SEO:
        title, desc = SEO[_url]['title'], SEO[_url]['desc']
    if 'auto_link' in globals() and not _url[1:].startswith(_SKIP_LINK) and _url != '/index':
        body = auto_link(_url, body)
    if 'data-tabs' in body and 'tabs.js' not in extra_js + extra_head:
        extra_js += '<script src="/assets/tabs.js?v=2"></script>'
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
    # Partner pages: "Become a partner" links open the enquiry + book-a-call pop-up. No live chat (LoanLeaf's Chatra is not reused).
    if '/partners' in path or name.startswith('partners'):
        h = h.replace('</body>', '<script src="/assets/partner-popup.js?v=1" defer></script></body>', 1)
    if '/partners' in path:  # partner (law firm) side of the site: dark, deep-green theme
        h = h.replace('<body', '<body data-theme="partner"', 1).replace('</head>', '<link href="/assets/partners-dark.css?v=25" rel="stylesheet"/></head>', 1)
    if header == 'PARTNERS_HEADER':
        header = header_b('partners.html')
    elif header == 'LEGAL_HEADER':
        header = header_b('legal')
    open(path, 'w').write(with_nav(h, name, header))



CHEV = '<svg class="llb-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
def dd(label, links, wide=False):
    items = ''.join(f'<a href="{h}">{ic}<span>{t}</span></a>' for h, t, ic in links)
    return (f'<div class="llb-dd"><button type="button" class="llb-dd-btn" aria-expanded="false">{label}{CHEV}</button>'
            f'<div class="llb-dd-panel{" wide" if wide else ""}">{items}</div></div>')

ARR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'


def mega(label, items, subs, card, foot=('/apply', 'Not sure? Get a quote')):
    """Mega menu: plain list with arrows (left), a tinted column of related links that follows the hovered item (middle), photo card (right).
    items: [(href, name, sub_key)]; subs: {key: (heading, [(href, name)])}; card: (img, title, text, href, link label)."""
    first = items[0][2]
    left = ''.join(f'<a href="{h}" class="llb-mi{" on" if i == 0 else ""}" data-k="{k}"><span>{t}</span>{ARR}</a>' for i, (h, t, k) in enumerate(items))
    left = f'<div class="llb-mlist{" three" if len(items) > 18 else " two" if len(items) > 10 else ""}">{left}</div><a href="{foot[0]}" class="llb-mfoot">{foot[1]}</a>'
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


def accordion(items, icons=None):
    """icons: optional list of ICON keys, one per item, shown in a circle before the title (Aran, 24 Nov: icons, never step numbers)."""
    rows = ''.join(f'<details class="ll-faq"><summary class="large-text bold-text"><span>{f"<i class=ll-acc-ico>{ICON[icons[i]]}</i>" if icons else ""}{t}</span>{CHEV_D}</summary><div class="ll-faq-a">{d}</div></details>' for i, (t, d) in enumerate(items))
    return f'<div class="ll-acc">{rows}</div>'


def read_more(paras):
    first, rest = paras[0], paras[1:]
    return (f'<div class="ll-prose"><p>{first}</p></div>'
            + (f'<details class="ll-more"><summary>Read more {CHEV_D}</summary><div class="ll-prose">' + ''.join(f'<p>{p}</p>' for p in rest) + '</div></details>' if rest else ''))


def faq_tabs(groups):
    chev = CHEV_D
    return tabs('faq', [(name, ''.join(f'<details class="ll-faq"><summary class="large-text bold-text">{q}{chev}</summary><div class="ll-faq-a">{a}</div></details>' for q, a in qas)) for name, qas in groups], faq_panels=True)




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
        elif kind == 'tip': out.append(f'<div class="cs-tip"><b>Tip</b><p>{v}</p></div>')
    return '<div class="ll-doc">' + ''.join(out) + '</div>'


def doc_page(path, title, desc, h1, lead, blocks, kicker='', aside=''):
    body = page_head(h1, lead, kicker) + f'<section class="ll-docsec"><div class="ll-doc-wrap">{blocks_html(blocks)}{aside}</div></section>'
    page(path, title, desc, body, backup=False)

# ---------------------------------------------------------------- brand
import json as _json
import sys as _sys
_sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import areas_content as AC
import legal_partners_content as LC

BRAND = 'Leaflegal'
SITE = 'https://leaflegal.co'
EMAIL = 'hello@leaflegal.co'
LOGO_LIGHT = asset('Leaflegal_Logo_White')       # on dark surfaces
LOGO_DARK = asset('Leaflegal_Logo_Deep_Green')   # on light surfaces
AREA_URL = lambda s: f'/{s}'
# homepage card / ?area= value -> the option in the form's first step (assets/enquire.js)
PURPOSE = {a['name']: a['form'] for a in AC.AREAS}


def area_cards(areas=AC.AREAS, link=True, label='Learn more'):
    return cards([(a['icon'], a['name'], a['short'], AREA_URL(a['slug']) if link else None) for a in areas], 'three', more_label=label)


NOTE = (f'{BRAND} is a trading name of Vertical Brands Ltd. We are not a law firm and we do not give legal advice. We are not regulated by the Solicitors Regulation Authority. '
        'We introduce people and businesses to independent solicitors and regulated legal firms, who are responsible for the advice they give. '
        'We receive a fee from the firm we introduce you to, which does not change what the firm charges you, and the firm will tell you about it in writing. '
        'We do not give immigration advice or provide immigration services. Immigration enquiries are only passed to firms and advisers regulated to give immigration advice. '
        'We do not handle personal injury, clinical negligence, housing disrepair or financial claims.')
COPY = f'© 2026 Vertical Brands Ltd. {BRAND} is a trading name of Vertical Brands Ltd, registered in England and Wales, company number 14254961. VAT number GB425344608. Registered office at 20–22 Wenlock Road, London, N1 7GU.'


def footer_html(strip=True, minimal=False):
    col = lambda title, links: f'<div class="llf-col"><h2>{title}</h2><ul>' + ''.join(f'<li><a href="{h}"{a}>{t}</a></li>' for t, h, a in links) + '</ul></div>'
    areas = [(a['name'], AREA_URL(a['slug']), '') for a in AC.AREAS] + [('All legal services', '/legal-services', '')]
    res = [('How it works', '/how-it-works', ''), ('Questions and answers', '/#faq', ''), ('Get matched', '/apply', '')]
    comp = [('About us', '/about', ''), ('For law firms', '/partners', ''), ('How we make money', '/how-we-make-money', ''), ('Press', '/press', ''), ('Contact', '/contact', '')]
    legal = [('Terms of Service', '/terms-conditions', ''), ('Privacy Policy', '/privacy-policy', ''), ('Cookie Policy', '/cookie-policy', ''), ('Complaints', '/complaints', ''), ('Accessibility', '/accessibility', ''), ('Cookie settings', '#', ' data-cookie-settings')]
    cta_strip = f"""<div class="llf-cta"><div class="llf-in"><div><h2>Find the right solicitor</h2><p>Answer a few quick questions and we'll introduce you to a specialist law firm.</p></div>
<div class="llf-cta-btns"><a href="/apply" class="button"><div>Get matched</div></a><a href="/partners" class="llf-ghost">I'm a law firm</a></div></div></div>""" if strip else ''
    if minimal:  # ad landing page: the legal text and legal links only
        return f"""<footer class="llf llf-lp"><div class="llf-base"><div class="llf-in">
<p class="llf-note">{NOTE}</p>
<p class="llf-lp-links">{' · '.join(f'<a href="{h}"{a}>{t}</a>' for t, h, a in [('For law firms', '/partners', ''), *legal])}</p>
<p>{COPY}</p>
</div></div></footer>"""
    return f"""<footer class="llf">{cta_strip}
<div class="llf-main"><div class="llf-in">
<div class="llf-brand"><a href="/" aria-label="{BRAND} home"><img src="{LOGO_LIGHT}" width="170" alt="{BRAND}" loading="lazy"/></a>
<p>Introductions to specialist solicitors and regulated law firms in England and Wales.</p><a class="llf-mail" href="mailto:{EMAIL}">{EMAIL}</a></div>
{col('Legal help', areas)}{col('Resources', res)}{col('Company', comp)}{col('Legal', legal)}
</div></div>
<div class="llf-base"><div class="llf-in">
<p class="llf-note">{NOTE}</p>
<p>{COPY}</p>
</div></div></footer>"""


# ---------------------------------------------------------------- header (two tiers: audience bar + main menu)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_menus.py')).read())  # CLIENT_MENU, PARTNER_MENU, matter/location data
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'client_sections.py')).read())  # richer client page sections


PLOGO_ANIM = ('<span class="llb-logo-tag">Partners</span><video class="llb-logo-vid" muted loop playsinline preload="auto" aria-hidden="true"></video>'
  '<script>(function(){var a=document.currentScript.parentNode;if(matchMedia("(prefers-reduced-motion: reduce)").matches){a.classList.add("noanim");return}'
  'var v=a.querySelector("video"),u=navigator.userAgent,h=/iP(hone|ad|od)/.test(u)||(/Safari/.test(u)&&!/Chrome|Chromium|Edg|Firefox|OPR/.test(u));'
  'v.src="/assets/logo-anim/leaflegal-partners-dark"+(h?"-hevc.mov":".webm");'
  'var want="L",first=1,seen=performance.now(),busy=0;function go(){var p=v.play();p&&p.catch(function(e){if(e.name!="AbortError"&&!a.classList.contains("anim"))a.classList.add("noanim")})}'
  'function tick(){var t=v.currentTime,n=performance.now();if(!busy&&!v.paused&&(want=="L"?t<.62||t>=2.65:t>=1.05&&t<2.22)){'
  'var rem=want=="P"?2.22-t:(t>=2.65?3.6-t+.62:.62-t),ms=Math.max(0,(want=="P"?4000:first?2000:4500)-(n-seen)-rem*1000);'
  'busy=1;v.pause();first=0;setTimeout(function(){var c=v.currentTime;seen=performance.now()+1000*(want=="L"?(c<.62?1.05-c:3.6-c+1.05):2.65-c);want=want=="L"?"P":"L";busy=0;go()},ms)}requestAnimationFrame(tick)}'
  'v.addEventListener("playing",function(){a.classList.add("anim")},{once:true});v.addEventListener("error",function(){a.classList.add("noanim")});go();requestAnimationFrame(tick)})()</script>')
# Safari plays the HEVC-with-alpha .mov, everything else the webm.


def header_b(page=''):
    cur = ' aria-current="page"'
    partner = page == 'partners.html'
    cta_href, cta_label = ('/partners/apply', 'Become a partner firm') if partner else (('#quote' if page == 'index.html' else '/apply'), 'Get matched')
    menu = PARTNER_MENU if partner else CLIENT_MENU
    extra = '<a href="/">For people and businesses</a>' if partner else '<a href="/partners">For law firms</a>'
    signin = ''  # platform sign-in comes back when the law-firm platform exists
    return f'''<header class="llb-head">
<div class="llb-top"><div class="llb-in"><nav class="llb-top-l" aria-label="Audience"><a href="/"{"" if partner else cur}>Clients</a><a href="/partners"{cur if partner else ""}>Law firms</a></nav>
<div class="llb-top-r"><a href="/how-it-works">How it works</a><a href="/contact">Contact us</a></div></div></div>
<div class="llb-main"><div class="llb-in">
<a href="{'/partners' if partner else '/'}" class="llb-logo{' llb-logo-p' if partner else ''}" aria-label="{BRAND + ' Partners' if partner else BRAND + ' home'}"><img src="{LOGO_LIGHT}" width="150" alt="{BRAND}"/>{PLOGO_ANIM if partner else ''}</a>
<button type="button" class="llb-toggle" aria-expanded="false" aria-controls="llb-menu" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
<nav class="llb-menu" id="llb-menu" aria-label="Main">{menu}
<div class="llb-mobile-extra">{extra}<a href="/about">About us</a><a href="mailto:{EMAIL}">{EMAIL}</a></div>
{signin}<a href="{cta_href}" class="button llb-cta{' llb-cta-pair' if signin else ''}"><div>{cta_label}</div></a></nav>
</div></div></header>'''


# ---------------------------------------------------------------- shared blocks
TRUST = [('shield', 'No obligation', 'You choose whether to go ahead'), ('clock', 'About two minutes', 'One short form, plain English'),
         ('scale', 'Regulated firms', 'Matched to your type of matter'), ('doc', 'Kept private', 'Only shared with your consent')]
TRUST_STRIP = ('<section class="ll-trust" aria-label="Why Leaflegal"><div class="ll-trust-in">' + ''.join(
    f'<div class="ll-trust-item"><span class="ll-trust-ico">{ICON[ic]}</span><div><b>{t}</b><span>{d}</span></div></div>' for ic, t, d in TRUST) + '</div></section>')
_ok = '<span class="ll-ui-ok">' + TICK + '</span>'

FORM = f'''<div class="ap-card" id="ap"><div class="ap-head"><div class="ap-meta"><button type="button" class="ap-back">&larr; Back</button><span class="ap-count" aria-live="polite"></span></div><div class="ap-bar" role="presentation"></div></div>
<div class="ap-body"><noscript><p>Please enable JavaScript, or email <a href="mailto:{EMAIL}">{EMAIL}</a>.</p></noscript></div></div>'''
APPLY_HEAD = '<link href="/assets/apply.css?v=65" rel="stylesheet"/><link href="/assets/enquire.css?v=4" rel="stylesheet"/>'
APPLY_JS = '<script type="module" src="/assets/enquire.js?v=9"></script>'


def ENQ_URL(area, matter=None):
    """The separate enquiry form page for an area, started on a matter when given."""
    return f'/enquire/{area}' + (f'?matter={matter}' if matter else '')


ENQ_LABEL = 'Make an Enquiry'


def enq_btn(area, matter=None):
    return f'<a href="{ENQ_URL(area, matter)}" class="button"><div>{ENQ_LABEL}</div></a>'


def form_card(area=None, matter=None):
    """The qualifying form card (assets/enquire.js), started inside an area and matter when given."""
    attrs = (f' data-area="{area}"' if area else '') + (f' data-matter="{matter}"' if matter else '')
    return FORM.replace('id="ap"', 'id="ap"' + attrs, 1)
ld = lambda *xs: ''.join(f'<script type="application/ld+json">{_json.dumps(x, ensure_ascii=False)}</script>' for x in xs)
faq_ld = lambda qas: {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
    {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', a)}} for q, a in qas]}

# ---------------------------------------------------------------- keyword targeting and internal links (tools/seo_keywords.py)
_SKIP_LINK = ('enquire/', 'partners', 'apply', 'contact', 'press', 'accessibility', 'complaints', 'cookie-policy', 'privacy-policy', 'terms-conditions', '404', 'platform')
_AL = sorted(AUTO_LINKS, key=lambda x: -len(x[0]))
_AL_RE = [(re.compile(r'(?<![\w-])(' + re.escape(ph) + r')(?![\w-])', re.I), url) for ph, url in _AL]


def auto_link(url, body, limit=12):
    """Link the first plain-text mention of key phrases in body paragraphs to the page that targets them.
    One link per paragraph, each target once, never to the page itself, and only in <p> tags with no other links."""
    used, n = {url}, [0]

    def para(m):
        inner = m.group(1)
        if n[0] >= limit or '<a ' in inner:
            return m.group(0)
        parts = re.split(r'(<[^>]+>)', inner)
        for rx, target in _AL_RE:
            if target in used:
                continue
            for i, t in enumerate(parts):
                if not t or t.startswith('<'):
                    continue
                mm = rx.search(t)
                if mm:
                    parts[i] = t[:mm.start()] + f'<a href="{target}">{mm.group(1)}</a>' + t[mm.end():]
                    used.add(target)
                    n[0] += 1
                    return '<p>' + ''.join(parts) + '</p>'
        return m.group(0)
    keep = []

    def mask(m):  # paragraphs inside links (cards) are left alone
        keep.append(m.group(0))
        return f'\x00{len(keep) - 1}\x00'
    body = re.sub(r'<a\b[^>]*>.*?</a>', mask, body, flags=re.S)
    body = re.sub(r'<p>(.*?)</p>', para, body, flags=re.S)
    return re.sub(r'\x00(\d+)\x00', lambda m: keep[int(m.group(1))], body)


_ANCHOR_FALLBACK = {'/solicitors': 'Find a solicitor near you', '/guides': 'Legal guides', '/legal-services': 'All legal services'}


def seo_anchor(u):
    if u in SEO:
        return SEO[u]['anchor']
    if u.startswith('/guides/'):
        g = next((x for x in CG.GUIDES if f'/guides/{x["slug"]}' == u), None)
        return g['h1'] if g else u
    return _ANCHOR_FALLBACK.get(u, u)


def seo_h1(u, default):
    return (SEO.get(u) or {}).get('h1') or default


def seo_faqs(u):
    return [tuple(x) for x in (SEO.get(u) or {}).get('faqs', [])]


def seo_block(u):
    """Short keyword-led section placed under the intro of area and matter pages."""
    e = SEO.get(u)
    if not e or not e['paras']:
        return ''
    kw = e['kw'][0].upper() + e['kw'][1:]
    return section(f'<div class="cs-deep cs-kw"><h2 class="cs-h2">{kw} in brief</h2>' + ''.join(f'<p>{p}</p>' for p in e['paras']) + '</div>', cls='section cs-sec')


def seo_related(u, title, urls):
    """Related pages with keyword-rich anchors: the area, sibling matters and a few cross-area links."""
    seen, links = {u}, []
    for x in urls + (SEO.get(u) or {}).get('cross', []):
        if x not in seen:
            seen.add(x)
            links.append((x, seo_anchor(x)))
    return cs_links(title, links) if links else ''

compact = lambda body: re.sub(r'<section class="section(?! padding-btm-0| ll-compact| legal-hero)', '<section class="section ll-compact', body)

HOME_FAQ = [
    (f'Is {BRAND} a law firm?', f'No. {BRAND} is an introduction service. We pass your enquiry to one independent, regulated law firm, and their lawyers give you the advice. We don&#39;t give legal advice ourselves.'),
    ('Does it cost anything?', 'Our service is free to use. We are paid by the law firm we introduce you to. The firm will explain its own fees before you agree to anything, and must tell you about the fee it pays us.'),
    ('Who will contact me?', 'One law firm that handles your type of matter, usually by phone. We don&#39;t pass your details to a list of firms.'),
    ('Which areas do you cover?', 'Conveyancing, family law, licensing, lease extensions and business debt recovery in England and Wales, plus trademarks and related IP and introductions to regulated immigration lawyers across the UK.'),
    ('Can you help with legal aid?', 'We introduce people looking for paid legal help. If you think you may qualify for legal aid, GOV.UK has a checker and can point you to a legal aid adviser.'),
    ('What happens to my information?', 'We only share your details with the firm we introduce you to, and only if you agree. We never share the details of your matter with advertisers. Read our <a href="/privacy-policy">Privacy Policy</a> for the full details.'),
]
STEPS3 = ('Tell us what you need help with', 'We introduce you to one specialist firm', 'The firm contacts you to talk it through')


def _gpick():
    seen, out = set(), []
    for x in CG.GUIDES:
        if x['area'] not in seen:
            seen.add(x['area']); out.append(x)
    return out[:3]


def cs_guides_home():
    g = ''.join(f'<a class="ll-pcard" href="/guides/{x["slug"]}"><img src="{PH.photo(PH.AREA[x["area"]][0], 700)}" alt="" loading="lazy"/><div><span class="ll-gcat">Guide</span><b>{x["h1"]}</b><p>{x["lead"]}</p></div></a>' for x in _gpick())
    return section(f'<h2 class="cs-h2 cs-center">Helpful guides</h2><div class="ll-ggrid cs-gg">{g}</div><div class="ll-actions" style="justify-content:center;margin-top:28px"><a href="/guides" class="button"><div>All guides</div></a></div>', cls='section cs-sec')


# ---------------------------------------------------------------- homepage
# Hero photo (Unsplash+ ARr07aQKrt4, licensed download, man taking notes at a laptop, chosen by Aran). Self hosted WebP, already mirrored so he sits on the right. Never use handshake photos.
HOME_HERO_IMG = lambda w: f'/assets/home-hero-{w}.webp'
home = f'''
<section class="ll-hero ll-hero-photo ll-hero-noform" id="quote">
<img class="ll-hero-bg" src="{HOME_HERO_IMG(2200)}" srcset="{HOME_HERO_IMG(900)} 900w, {HOME_HERO_IMG(1400)} 1400w, {HOME_HERO_IMG(2200)} 2200w" sizes="100vw" alt="" fetchpriority="high"/>
<div class="ll-hero-in"><div class="ll-hero-copy">
<h1>Find the right solicitor for you</h1>
<p class="ll-lead">Tell us what you need help with and we'll introduce you to a specialist, regulated law firm that handles your kind of matter.</p>
<div class="ll-borrow ll-need"><p class="ll-borrow-q">What do you need help with?</p>
<div class="ll-need-opts">{''.join(f'<a href="/enquire/{a["slug"]}">{a["name"]}</a>' for a in AC.AREAS)}</div></div>
<ul class="ll-hero-points"><li>{TICK}No obligation to proceed</li><li>{TICK}One regulated firm, not a call centre</li><li>{TICK}Your details are kept private</li></ul>
</div></div></section>
{TRUST_STRIP}
{section(f"""<div class="ll-section-title"><h2 class="heading-two">What do you need help with?</h2><div class="large-text serif-typeface">Pick an area to start and we will introduce you to a firm that handles it.</div></div>
{cards([(a['icon'], a['name'], a['short'], f"/enquire/{a['slug']}") for a in AC.AREAS], more_label='Get matched')}""")}

<div id="how-it-works"></div>
{process(STEPS3, '#quote', 'Get matched')}

{section(split(PH.photo('lawyer-desk'), f"""<h2 class="heading-two">Less searching. Better first conversations.</h2>
<div class="large-text serif-typeface">Instead of ringing round firms, you fill in one form and speak to a lawyer who already knows what your matter is about.</div>
{checks(['One short form instead of calling round', 'A firm that handles your kind of matter', 'Your enquiry goes to one firm, not a list', 'No obligation to go ahead'])}
<div class="ll-actions" style="margin-top:32px"><a href="#quote" class="button w-inline-block"><div>Get matched</div></a></div>""", alt='A solicitor talking with a client'))}

{photo_box(PH.photo('golden-street'), f"""<div class="section-title"><h2 class="heading-two">Who we can help</h2><div class="large-text serif-typeface">People and businesses looking for paid legal help.</div><div class="horizontal-line"></div></div>
{checks(['Homeowners, buyers and sellers in England and Wales', 'People going through a separation', 'Drivers facing points, a ban or a court date', 'Businesses owed money, needing a licence or protecting a brand'], white=True)}
<a href="#quote" class="button w-inline-block"><div>Get matched</div></a>""", cls='section padding-btm-0', photo=True, alt='A woman at a desk')}

{cs_intro('Why people use Leaflegal', [
  'Finding a solicitor usually means a search, a list of names and an afternoon of phone calls. Many firms only handle some kinds of work, some are not taking on new clients, and it is hard to know who will be a good fit until you have already explained everything twice.',
  'Leaflegal does the first part for you. You tell us what is going on in a short form, in your own words. We read it, check which kind of matter it is, and introduce you to one regulated firm that handles that type of work and covers your area.',
  'The firm gets in touch, usually the same working day. They already know the basics, so the first call is about your situation, what they can do and what it will cost. You are free to decide whether to go ahead.'],
  [('Cost to you', 'Free'), ('Time to fill in', 'About two minutes'), ('Who contacts you', 'One regulated firm'), ('Areas covered', 'England and Wales'), ('Obligation', 'None')])}

{cs_things([
  ('Have your paperwork ready', 'Letters, contracts, court papers or a sale memo all help the firm understand your matter quickly. A photo on your phone is fine for the first call.'),
  ('Note any deadlines', 'Court dates, completion dates and reply-by dates matter. Mention them in the form so the firm knows how fast to move.'),
  ('Ask about fees early', 'A good firm will explain how it charges before any work starts and confirm it in writing. Fixed fees are common for many matters.'),
  ('Check they are regulated', 'Every firm we introduce is regulated. You can check a solicitor on the SRA register or a licensed conveyancer with the CLC.'),
  ('You stay in control', 'Speaking to a firm does not commit you to anything. Take your time, ask questions and only instruct them if it feels right.'),
  ('Your details stay private', 'We only share your enquiry with the one firm we introduce, and never with advertisers or data brokers.'),
])}

{cs_guides_home()}

{cs_faqs('Questions and answers', faq_groups(HOME_FAQ, deep('page__home')), 'Ready to get started?', 'It only takes a couple of minutes.', '#quote', 'Get matched')}

{cta('Find the right solicitor', 'Answer a few quick questions and we will do the matching.', '#quote', 'Get matched')}
'''
org_ld = {'@context': 'https://schema.org', '@type': 'Organization', '@id': f'{SITE}/#organization', 'name': BRAND, 'url': SITE,
          'legalName': 'Vertical Brands Ltd', 'description': f'{BRAND} is a trading name of Vertical Brands Ltd.', 'email': EMAIL, 'logo': SITE + LOGO_DARK,
          'identifier': {'@type': 'PropertyValue', 'propertyID': 'Companies House company number', 'value': '14254961'},
          'address': {'@type': 'PostalAddress', 'streetAddress': '20-22 Wenlock Road', 'addressLocality': 'London', 'postalCode': 'N1 7GU', 'addressCountry': 'GB'}}
page(f'{PUB}/index.html', f'Find a Solicitor in England and Wales | {BRAND}',
     'Get matched with a specialist, regulated law firm for conveyancing, family law, licensing, lease extensions, debt recovery, trademarks or immigration. No obligation to proceed.',
     home, ld(org_ld, faq_ld(HOME_FAQ)))

# ---------------------------------------------------------------- /apply: form-only page
LP_TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
LP_TICKS = ('No obligation to proceed', 'One regulated firm, not a call centre', 'Your details are kept private')


def lp_body(h1='Find the right solicitor for your matter', ticks=LP_TICKS, form=None, img=None):
    pic = f'<div class="ap-lp-photo"><img src="{img}" alt="" loading="eager" fetchpriority="high"/></div>' if img else ''
    return (f'<section class="ap-section ap-solo ap-lp{" ap-has-photo" if img else ""}" id="quote">{pic}<div class="ap-wrap"><div class="ap-lp-grid">'
            f'<div class="ap-lp-head"><h1>{h1}</h1>'
            '<ul>' + ''.join(f'<li><span class="ap-lp-tick">{LP_TICK}</span><span>{t}</span></li>' for t in ticks) + '</ul></div>'
            + (form or FORM) + '</div></div></section>')


LP_HEADER = f'<header class="llb-head llb-lp"><div class="llb-main"><div class="llb-in"><a href="/" class="llb-logo" aria-label="{BRAND} home"><img src="{LOGO_LIGHT}" width="150" alt="{BRAND}"/></a></div></div></header>'
page(f'{PUB}/apply.html', f'Get Matched With a Solicitor | {BRAND}',
     'Answer a few quick questions and we will introduce you to one specialist, regulated law firm. No obligation to proceed.',
     lp_body(), APPLY_HEAD, APPLY_JS, header=LP_HEADER, backup=False)

# ---------------------------------------------------------------- practice area pages + /legal-services hub
os.makedirs(f'{PUB}/legal-services', exist_ok=True)
AREA_IMG = {'conveyancing': 'stock-home', 'immigration': 'stock-legal-call', 'family-law': 'stock-about', 'debt-recovery': 'stock-invoice',
            'licensing': 'stock-ind-restaurants-and-hospitality', 'lease-extensions': 'stock-legal-meet', 'trademarks': 'stock-legal-meet'}
ENQ_H1 = {'conveyancing': 'Get matched with a trusted conveyancer', 'immigration': 'Get matched with an immigration expert',
          'family-law': 'Speak to a family law specialist', 'debt-recovery': 'Get the money your business is owed',
          'licensing': 'Get expert help with your licence',
          'lease-extensions': 'Extend your lease with a specialist', 'trademarks': 'Protect your brand with a specialist'}
for a in AC.AREAS:
    q = ENQ_URL(a['slug'])
    where = 'Introductions to regulated immigration advisers across the UK' if a.get('referral_only') else ('For businesses in England and Wales' if a.get('business_only') else ('Introductions across the whole of the UK' if a.get('uk_wide') else 'For matters in England and Wales'))
    head = (f'<section class="ll-pagehead ll-hero-split"><div class="ll-hero-grid"><div><nav class="ll-crumbs" aria-label="Breadcrumb"><a href="/legal-services">Legal services</a><span>/</span><span>{a["name"]}</span></nav>'
            f'<h1>{seo_h1(AREA_URL(a["slug"]), a["h1"])}</h1><p class="ll-lead">{a["lead"]}</p>'
            f'<ul class="ll-hero-ticks"><li>{TICK}No obligation to proceed</li><li>{TICK}One regulated firm, not a list</li><li>{TICK}{where}</li></ul>'
            f'<div class="ll-head-btns">{enq_btn(a["slug"])}</div></div>'
            f'<div class="ll-hero-media"><img src="{PH.photo(PH.AREA[a["slug"]][0])}" alt="" loading="eager" fetchpriority="high"/></div></div></section>')
    crumb_ld = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Legal services', 'item': f'{SITE}/legal-services'},
        {'@type': 'ListItem', 'position': 2, 'name': a['name'], 'item': f'{SITE}{AREA_URL(a["slug"])}'}]}
    notice = ('<p class="ll-note">Leaflegal is not regulated to give immigration advice and does not do so. Any advice about your situation comes from the regulated firm we introduce you to.</p>'
              if a.get('referral_only') else '')
    others = [x for x in AC.AREAS if x['slug'] != a['slug']][:6]
    imm_a = bool(a.get('referral_only'))
    glance = [('Who it is for', AREA_EXTRA[a['slug']]['who']), ('Who contacts you', 'One regulated immigration firm or adviser' if imm_a else 'One regulated law firm'),
              ('Where', 'Across the UK' if imm_a or a.get('uk_wide') else ('Businesses in England and Wales' if a.get('business_only') else 'England and Wales')),
              ('Matters covered', f'{len(MAT[a["slug"]])} types, from {MAT[a["slug"]][0]["name"].lower()} to {MAT[a["slug"]][-1]["name"].lower()}'), ('Your commitment', 'None, you choose whether to go ahead')]
    body = ''.join([
        head, TRUST_STRIP,
        cs_intro(f'About {a["name"].lower()}', a['intro'] + [AREA_EXTRA[a['slug']]['more']], glance, notice),
        seo_block(AREA_URL(a['slug'])),
        cs_deep(f'{a["name"]} explained', deep(a['slug']), lead='Pick a topic to read more.'),
        section('<div id="matters"></div><h2 class="cs-h2 cs-center">What the firms help with</h2>' + cards([(a['icon'], m['name'], m['short'], M_URL(a['slug'], m['slug'])) for m in MAT[a['slug']]], 'three', more_label='Learn more'), cls='section cs-sec'),
        cs_steps('How it works', a['how'], q, lead='Three simple steps, and nothing to pay us.'),
        cs_fees(a['slug'], a['name']),
        cs_things(a['considerations']),
        cs_faqs(f'{a["name"]} questions and answers', faq_groups(seo_faqs(AREA_URL(a['slug'])) + a['faqs'], deep(a['slug'])), 'Ready to get started?', 'One short form. One specialist firm contacts you.', q, ENQ_LABEL),
        seo_related(AREA_URL(a['slug']), f'Popular {a["name"].lower()} services', [M_URL(a['slug'], m['slug']) for m in MAT[a['slug']]]),
        cs_guides(a['slug'], AREA_GUIDES.get(a['slug'], [])),
        cs_links(f'{LOCAL_NAME[a["slug"]]} near you', [(LOC_URL(c[0], a['slug']), c[1]) for c in MC.CITIES]) if a['slug'] in MC.LOCAL_AREAS else '',
        section('<h2 class="cs-h2 cs-center">Other legal services</h2>' + area_cards(others), cls='section cs-sec'),
    ])
    # The separate enquiry page for this area (like /apply, with the area fixed). Matter pages link here with ?matter=.
    os.makedirs(f'{PUB}/enquire', exist_ok=True)
    page(f'{PUB}/enquire/{a["slug"]}.html', f'{a["name"]} Enquiry | {BRAND}',
         f'Answer a few quick questions about your {a["name"].lower()} matter and we will introduce you to one regulated firm. No obligation to proceed.',
         lp_body(ENQ_H1[a['slug']], ('No obligation to proceed', 'One regulated firm', 'UK wide' if imm_a or a.get('uk_wide') else 'England and Wales'), form_card(a['slug'])),
         APPLY_HEAD + '<meta name="robots" content="noindex"/>', APPLY_JS, header=LP_HEADER, backup=False)
    page(f'{PUB}/{a["slug"]}.html', a['title'], a['desc'], compact(body), APPLY_HEAD + ld(faq_ld([qa for _, g in faq_groups(seo_faqs(AREA_URL(a['slug'])) + a['faqs'], deep(a['slug'])) for qa in g]), crumb_ld), '<script src="/assets/tabs.js?v=2"></script>' + APPLY_JS, backup=False)

hub = (page_head('Legal services', 'The areas of law we introduce people and businesses to. Pick one to find out more, or answer a few quick questions and we will do the matching.')
       + TRUST_STRIP + section(area_cards())
       + section(title_block('Not sure which you need?', 'You don’t have to know. Tell us what is happening and we will introduce you to a firm that can help.')
                 + '<div class="ll-actions" style="justify-content:center"><a href="/apply" class="button"><div>Get matched</div></a><a href="/how-it-works" class="button bg-base-50"><div>How it works</div></a></div>'))
page(f'{PUB}/legal-services.html', f'Legal Services from Specialist Solicitors | {BRAND}',
     'Conveyancing, family law, debt recovery, licensing, lease extensions, trademarks and introductions to regulated immigration lawyers.', hub, backup=False)

# ---------------------------------------------------------------- how it works
HIW_STEPS = [
    ('Tell us what you need help with', 'Answer a few quick questions about the type of matter, how urgent it is and where you are. It takes about two minutes and costs nothing.'),
    ('We introduce you to one firm', 'We pass your enquiry to one regulated law firm that handles your type of matter and covers your area. Never to a list.'),
    ('The firm contacts you', 'The firm gets in touch, usually by phone, to understand your situation, explain how they can help and tell you their fees. There is no obligation to instruct them.'),
]
HIW_AFTER = [
    ('clock', 'Straight away', 'Your enquiry goes to the firm as soon as you submit it. You will see a confirmation on screen.'),
    ('phone', 'Usually the same working day', 'The firm calls or emails to introduce themselves and ask a few questions.'),
    ('doc', 'Before any work starts', 'The firm explains its fees in writing, including the fee it pays us, and what happens next.'),
    ('shield', 'Your choice', 'You decide whether to instruct the firm. The firm also decides whether it can take on your matter.'),
]
HIW_FAQ = [
    ('How long does the form take?', 'About two minutes. It is a short set of multiple-choice questions, followed by your name and contact details.'),
    (f'How much does {BRAND} cost?', f'Nothing. {BRAND} is free to use. We are paid by the firm we introduce you to. The firm will explain its own fees before you agree to anything.'),
    ('Who will contact me?', 'One law firm that handles your type of matter. We don’t pass your details to a list of firms.'),
    ('Do I have to go ahead?', 'No. There is no obligation at any stage.'),
    ('Will the firm definitely take my case?', 'Not always. The firm decides whether it can help once it understands your situation. If it can’t, it should tell you.'),
    (f'Is {BRAND} a law firm?', f'No. {BRAND} is an introduction service run by Vertical Brands Ltd. We don’t give legal advice and we are not regulated by the Solicitors Regulation Authority.'),
]
hiw = ''.join([
    f'<section class="ll-pagehead ll-hero-split"><div class="ll-hero-grid"><div><h1>One short form. The right specialist.</h1>'
    f'<p class="ll-lead">{BRAND} introduces people and businesses to a regulated law firm that handles their kind of matter, so the first conversation is a useful one.</p>'
    f'<ul class="ll-hero-ticks"><li>{TICK}About two minutes to complete</li><li>{TICK}One regulated firm, not a list</li><li>{TICK}No obligation to proceed</li></ul>'
    f'<div class="ll-head-btns"><a href="/apply" class="button"><div>Get matched</div></a><a href="#steps" class="ll-ghost-light">See the steps</a></div></div>'
    f'<div class="ll-hero-media"><img src="{PH.photo('desk-warm')}" alt="A woman working at a desk" loading="eager" fetchpriority="high"/></div></div></section>',
    TRUST_STRIP,
    '<div id="steps"></div>',
    process(tuple(t for t, _ in HIW_STEPS), '/apply', 'Get matched', title='Three simple steps'),
    section(title_block('Each step in detail') + accordion(HIW_STEPS, icons=STEP_ICONS), cls='section ll-tight'),
    section(title_block('What happens after you submit', 'A clear timeline, so you always know what comes next.') + cards([(ic, t, d, None) for ic, t, d in HIW_AFTER], 'four')),
    section(title_block(f'Who {BRAND} is for') + yes_no('We can help', ['People and businesses looking for paid legal help', 'Matters in England and Wales', 'Introductions to regulated immigration lawyers', 'Businesses recovering debts from other businesses', 'Trademark and IP matters across the UK'],
                                                      'We can’t help', ['Personal injury or clinical negligence claims', 'Housing disrepair claims', 'Financial mis-selling claims', 'Legal aid only matters'])),
    section(split(PH.photo('keys'), '<h2 class="heading-two">How we are paid</h2><div class="large-text serif-typeface">' + BRAND + ' is free for you.</div>'
                  '<p class="ll-split-p-text">We are paid by the firm we introduce you to, so you never pay us. The firm must tell you about that fee in writing, and it does not change what the firm charges you.</p>'
                  '<a href="/how-we-make-money" class="button bg-base-50" style="margin-top:24px"><div>How we make money</div></a>', flip=True)),
    cs_faqs('Questions about how it works', faq_groups(HIW_FAQ, deep('page__how-it-works')), 'Ready to get started?', 'It takes about two minutes.', '/apply', 'Get matched'),
])
howto_ld = {'@context': 'https://schema.org', '@type': 'HowTo', 'name': f'How to find a solicitor with {BRAND}', 'totalTime': 'PT2M',
            'step': [{'@type': 'HowToStep', 'position': i, 'name': t, 'text': d} for i, (t, d) in enumerate(HIW_STEPS, 1)]}
page(f'{PUB}/how-it-works.html', f'How It Works, Find a Solicitor in 3 Steps | {BRAND}',
     f'How {BRAND} works. Answer a few quick questions, get introduced to one regulated law firm and talk through your matter. No obligation to proceed.',
     compact(hiw), ld(howto_ld, faq_ld(HIW_FAQ)), backup=False)

# ---------------------------------------------------------------- partners (law firms): /partners and /partners/apply
APPLY_L = '/partners/apply'
L_HEAD = f'<link rel="canonical" href="{SITE}/partners"/>' + ld(
    {'@context': 'https://schema.org', '@type': 'Service', 'name': 'Client enquiries for solicitors and law firms',
     'serviceType': 'Pay per lead legal client lead generation', 'areaServed': 'GB', 'provider': {'@id': f'{SITE}/#organization'}, 'description': LC.DESC},
    org_ld, faq_ld(LC.FAQ))


def feat_photo(name, alt=''):
    return f'<div class="ll-feat-photo"><img src="/assets/stock-{name}.webp" alt="{alt}" loading="lazy"/></div>'


def feature(ui, title, text, ticks, ui_first=True):
    copy = (f'<div class="horizontal-section-half"><div class="container---s"><div class="section-contents"><div class="section-title-small">'
            f'<div class="heading-four">{title}</div><div>{text}</div></div>{checks(ticks)}</div></div></div>')
    return f'<div class="horizontal-section">{ui + copy if ui_first else copy + ui}</div>'


L_HERO = (f'<section class="section legal-hero"><div class="photo-section-image-wrapper"><img src="{asset("photo-landscape-10.webp")}" loading="eager" alt="" class="photo-section-background-image"/></div>'
          f'<div class="container---main"><div class="photo-section-box"><div class="section-box-contents">'
          f'<div class="section-title"><h1>{LC.HERO_H1}</h1><div class="large-text serif-typeface">{LC.HERO_LEAD}</div></div>'
          f'{checks(LC.HERO_TICKS, white=True)}'
          f'<div class="ll-actions"><a href="{APPLY_L}" class="button w-inline-block"><div>Become a partner firm</div></a></div>'
          '</div></div></div></section>')
L_FEATURES = section('<div class="section-title text-center"><h2 class="heading-two">Built for legal intake teams</h2><div class="large-text serif-typeface">Everything you need to make a confident first call.</div></div>'
    + feature(feat_photo('legal-meet'), 'Screened before they reach you', 'Our enquiry flow asks the questions your intake team would ask, and filters out people you can’t help before they are submitted.',
              ['Paid legal help confirmed, not legal aid', 'Matched to your practice areas and locations', 'UK mobile and email checked on submission'])
    + feature(feat_photo('legal-call'), 'Delivered while the enquiry is fresh', 'Leads arrive quickly with the source, timestamp and every answer the client gave, so you can call while it is fresh.',
              ['Email, CRM or case management delivery', 'No shared or recycled leads'], ui_first=False))
import cfb_legal
page(f'{PUB}/partners.html', LC.TITLE, LC.DESC, cfb_legal.build(ICON, TICK, faq_tabs(LC.FAQ_GROUPS), LC.FAQ_H2, LC, PS.AREA_LEADS, PH.photo('partner-call')),
     L_HEAD + '<link href="/assets/cfb.css?v=18" rel="stylesheet"/>', '<script src="/assets/tabs.js?v=2"></script>', header='PARTNERS_HEADER', backup=False)

os.makedirs(f'{PUB}/partners', exist_ok=True)
# Law firm enquiry: details, then book a call with Aran (assets/partner-enquiry.js). The same flow opens as a pop-up from any
# "Become a partner" link (assets/partner-popup.js).
firm_apply = ('<section class="ap-section"><div class="ap-wrap pe-wrap"><h1 class="ap-page-title">Get client enquiries for your firm</h1>'
              f'<div id="pe"><noscript><p style="padding:32px">Please enable JavaScript, or email <a href="mailto:{EMAIL}">{EMAIL}</a>.</p></noscript></div>'
              '</div></section>')
page(f'{PUB}/partners/apply.html', f'Become a Partner Firm | Leads for Solicitors | {BRAND}',
     'Get exclusive, pre-screened client enquiries for your law firm. Leave your details, then book a 30-minute call with our team.',
     firm_apply, APPLY_HEAD + '<link href="/assets/partner-enquiry.css?v=1" rel="stylesheet"/><meta name="robots" content="noindex"/>',
     '<script src="/assets/partner-enquiry.js?v=91"></script>', header='PARTNERS_HEADER', backup=False)

# ---------------------------------------------------------------- about
about = f'''
<section class="section legal-hero ll-tall"><div class="photo-section-image-wrapper"><img src="{asset('photo-landscape-04.webp')}" loading="eager" alt="" class="photo-section-background-image"/></div>
<div class="container---main"><div class="photo-section-box"><div class="section-box-contents">
<div class="section-title"><h1>About {BRAND}</h1><div class="large-text serif-typeface">We help people and businesses find the right solicitor, without the legwork.</div></div>
<div class="ll-actions"><a href="/apply" class="button w-inline-block"><div>Get matched</div></a></div>
</div></div></div></section>

{section(f"""<div class="ll-section-title"><h2 class="heading-two">Finding a solicitor shouldn't be hard</h2>
<div class="large-text serif-typeface">Most people only need a lawyer a few times in their life, and don't know where to start. {BRAND} turns that into one short form. We use your answers to introduce you to a regulated firm that handles your kind of matter, so the first conversation is a useful one.</div></div>""")}

{cs_intro('Why we started Leaflegal', [
  'Legal problems tend to arrive at stressful moments. A house sale, a separation, a court letter or an unpaid invoice all come with deadlines, and the last thing anyone wants is to spend days working out which firm to call.',
  'We built Leaflegal to make that first step simple. We focus on seven areas of law where people often need a specialist, and we work with regulated firms that handle that work every day.',
  'We are open about how we are paid. The firm pays us a fee for each introduction, it never changes what you pay them, and they will tell you about it in writing.'],
  [('Who we are', 'Vertical Brands Ltd'), ('What we do', 'Introductions'), ('Areas of law', 'Seven'), ('Where', 'England and Wales'), ('Paid by', 'The law firm, not you')])}

{section(f"""<div class="ll-section-title"><h2 class="heading-two">How we work</h2></div>
{cards([
  ('clock', 'Simple', 'One short form, in plain English, that takes about two minutes.', None),
  ('eye', 'Honest', 'We are clear about who we are, what we do and how we are paid.', None),
  ('target', 'Focused', 'We only work in seven areas of law, so the firms we introduce can really help.', None),
], 'three')}""")}

{section(split(PH.photo('desk-warm'), f"""<h2 class="heading-two">What we are, and what we aren't</h2>
<div class="large-text serif-typeface">We think you should know exactly who you're dealing with.</div>
<div class="ll-isnt" style="margin-top:28px;grid-template-columns:1fr">
<div class="ll-yes"><h3>{BRAND} is</h3><ul><li>{TICK}An introduction service</li><li>{TICK}Run by Vertical Brands Ltd</li><li>{TICK}Paid by the firms we introduce, never by you</li></ul></div>
<div class="ll-no"><h3>{BRAND} is not</h3><ul><li>{CROSS}A law firm</li><li>{CROSS}A source of legal or immigration advice</li><li>{CROSS}Regulated by the Solicitors Regulation Authority</li></ul></div>
</div>""", flip=True, alt='A person at a wooden table'))}

{section(f"""<div class="ll-section-title"><h2 class="heading-two">Company details</h2></div>
<dl class="ll-company"><div><dt>Trading name of</dt><dd>Vertical Brands Ltd</dd></div><div><dt>Company number</dt><dd>14254961, registered in England and Wales</dd></div><div><dt>Registered office</dt><dd>20–22 Wenlock Road, London, N1 7GU</dd></div><div><dt>VAT number</dt><dd>GB425344608</dd></div><div><dt>Email</dt><dd><a href="mailto:{EMAIL}">{EMAIL}</a></dd></div><div><dt>Legal</dt><dd><a href="/terms-conditions">Terms of Service</a> · <a href="/privacy-policy">Privacy Policy</a></dd></div></dl>""")}

{cta('Ready to find the right solicitor?', 'Answer a few quick questions and we will do the matching.', '/apply', 'Get matched')}
'''
page(f'{PUB}/about.html', f'About Us | {BRAND}', f'{BRAND} is an introduction service that matches people and businesses with specialist, regulated law firms.', about, backup=False)

# ---------------------------------------------------------------- company pages, contact, 404
doc_page(f'{PUB}/how-we-make-money.html', f'How We Make Money | {BRAND}',
    f'{BRAND} is free for you. We are paid by the law firms we introduce you to. Here is exactly how that works.',
    'How we make money', f'{BRAND} is free for you. Here is exactly how we are paid, and what that means for you.', [
    ('h2', 'You never pay us'),
    ('p', f'Using {BRAND} costs you nothing. There is no fee to complete the form, no fee to be introduced and no obligation to instruct the firm we introduce you to.'),
    ('h2', 'Law firms pay us'),
    ('p', 'We are paid by the law firms we introduce people and businesses to. Each partner firm pays us an agreed fee for each enquiry we send them. That is how we cover the cost of running the website, our advertising and the checks we carry out on every enquiry.'),
    ('h2', 'What that means for you'),
    ('ul', ['Each enquiry goes to one firm, chosen because it handles your type of matter and covers your area.',
            'We don’t recommend lawyers based on who pays us most, and we don’t give legal advice.',
            'Solicitors must tell you in writing about any fee they pay for an introduction, and it must not affect the advice they give you.',
            'The fee the firm pays us does not change what the firm charges you. The firm will explain its own fees before any work starts.']),
    ('h2', f'Who runs {BRAND}'),
    ('p', f'{BRAND} is a trading name of Vertical Brands Ltd, registered in England and Wales (company number 14254961). We are an introduction service. We are not a law firm and we are not regulated by the Solicitors Regulation Authority.'),
    ('p', f'Questions about how we work? Email <a href="mailto:{EMAIL}">{EMAIL}</a>.'),
])

doc_page(f'{PUB}/complaints.html', f'Complaints | {BRAND}',
    f'How to make a complaint about {BRAND}, what happens next and how long it takes. Complaints about a law firm go to that firm first.',
    'Complaints', 'If something has gone wrong, we want to put it right. Here is how to tell us and what happens next.', [
    ('h2', 'How to complain to us'),
    ('p', f'Email <a href="mailto:{EMAIL}?subject=Complaint">{EMAIL}</a> with the subject “Complaint”. Tell us your name, the email address or phone number you used on our form, what went wrong and what you would like us to do.'),
    ('h2', 'What happens next'),
    ('ul', ['We confirm we have received your complaint within <strong>3 working days</strong>.',
            'We investigate and send you a full written response within <strong>15 working days</strong>.',
            'If we need longer, we will tell you why and when to expect our answer.']),
    ('h2', 'Complaints about a law firm'),
    ('p', 'Once we have introduced you, the law firm is a separate business, responsible for its own service and advice. Please raise complaints about its advice, service or fees with the firm first. Every regulated firm must have a complaints procedure. If you are unhappy with how a firm we introduced treated you, tell us as well. We take it seriously and may stop working with firms that don’t treat people fairly.'),
    ('h2', 'If you are still unhappy'),
    ('p', 'If the firm doesn’t resolve your complaint about its service within eight weeks, you may be able to take it to the <a href="https://www.legalombudsman.org.uk" rel="noopener">Legal Ombudsman</a>. Concerns about a solicitor’s professional conduct can be reported to the <a href="https://www.sra.org.uk" rel="noopener">Solicitors Regulation Authority</a>. Complaints about how we have used your personal data can be raised with the Information Commissioner’s Office at <a href="https://ico.org.uk" rel="noopener">ico.org.uk</a>.'),
])

doc_page(f'{PUB}/accessibility.html', f'Accessibility Statement | {BRAND}',
    'Our commitment to making leaflegal.co usable for everyone, the standard we aim for and how to tell us about any accessibility problems.',
    'Accessibility statement', 'We want everyone to be able to use leaflegal.co, whatever device or assistive technology they use.', [
    ('h2', 'Our standard'),
    ('p', 'We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. Our forms work with a keyboard alone, our text can be resized up to 200% without losing content, and we use proper headings, labels and colour contrast so the site works with screen readers.'),
    ('h2', 'What we have done'),
    ('ul', ['Every form field has a visible label and clear error messages.', 'Buttons and links can be reached and used with a keyboard.',
            'We respect your device’s reduced motion setting.', 'Pages work on phones, tablets and desktops, at any zoom level.']),
    ('h2', 'Tell us about a problem'),
    ('p', f'If you have trouble using any part of the site, or need information in a different format, email <a href="mailto:{EMAIL}?subject=Accessibility">{EMAIL}</a>. We will reply within 3 working days.'),
    ('p', 'This statement was last reviewed on 21 November 2026.'),
])

doc_page(f'{PUB}/press.html', f'Press and Media | {BRAND}',
    f'Press and media information for {BRAND}, with company boilerplate, brand assets and contact details for journalists and partners.',
    'Press and media', f'Information for journalists, partners and anyone writing about {BRAND}.', [
    ('h2', f'About {BRAND}'),
    ('p', f'{BRAND} is a legal introduction service for people and businesses in England and Wales. People answer a short set of questions about their matter, and {BRAND} introduces each enquiry to one regulated law firm that handles that kind of work. The service is free for clients. {BRAND} is a trading name of Vertical Brands Ltd.'),
    ('h2', 'Brand assets'),
    ('ul', [f'<a href="{LOGO_DARK}" download>Logo, deep green (SVG)</a>', f'<a href="{LOGO_LIGHT}" download>Logo, white (SVG)</a>']),
    ('p', f'Please write the name as one word, <strong>{BRAND}</strong>. Don’t alter, recolour or stretch the logo.'),
    ('h2', 'Media enquiries'),
    ('p', f'Email <a href="mailto:{EMAIL}?subject=Media%20enquiry">{EMAIL}</a> with “Media enquiry” in the subject and we will get back to you within one working day.'),
])

CONTACT_FORM = '''<form class="ll-cf" id="ll-contact" novalidate>
<div class="ll-cf-grid">
<label><span>Your name</span><input name="name" autocomplete="name" required></label>
<label><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
<label><span>Phone <small>(optional)</small></span><input name="phone" type="tel" autocomplete="tel"></label>
<label><span>Topic</span><select name="topic"><option>My enquiry</option><option>Becoming a partner firm</option><option>Press or media</option><option>A complaint</option><option>Something else</option></select></label>
<label class="full"><span>Message</span><textarea name="message" rows="5" required minlength="5" placeholder="How can we help? Please don’t include details of your legal matter here."></textarea></label>
</div>
<div class="ap-hp" aria-hidden="true"><label>Leave blank<input name="hp" tabindex="-1" autocomplete="off"></label></div>
<p class="ll-cf-note">We use your details only to reply to your message. See our <a href="/privacy-policy">Privacy Policy</a>.</p>
<button type="submit" class="button">Send message</button><div class="ll-cf-msg" role="alert"></div>
</form>'''
CONTACT_ASIDE = f'''<aside class="ll-cf-aside">
<div><h2>Looking for a solicitor?</h2><p>The quickest way is our short form. One specialist firm will contact you.</p><a href="/apply" class="button">Get matched</a></div>
<div><h2>Email</h2><p><a href="mailto:{EMAIL}">{EMAIL}</a><br>We reply within one working day, Monday to Friday.</p></div>
<div><h2>Law firms</h2><p><a href="/partners">Become a partner firm</a></p></div>
<div><h2>Registered office</h2><p>Vertical Brands Ltd<br>20–22 Wenlock Road<br>London, N1 7GU</p></div>
</aside>'''
page(f'{PUB}/contact.html', f'Contact Us | {BRAND}', f'Contact {BRAND} about an enquiry, becoming a partner firm, press or anything else. We reply within one working day.',
     page_head('Contact us', 'Questions about an enquiry, becoming a partner firm or anything else? Send us a message.')
     + f'<section class="ll-docsec"><div class="ll-cf-wrap">{CONTACT_FORM}{CONTACT_ASIDE}</div></section>',
     extra_js='<script src="/assets/contact.js?v=1"></script>')

page(f'{PUB}/404.html', f'Page Not Found | {BRAND}', 'The page you were looking for could not be found.',
     page_head('We can’t find that page', 'It may have moved, or the link may be out of date.')
     + section(cards([('scale', 'Find a solicitor', 'Answer a few quick questions and get matched with a specialist firm.', '/apply'),
                      ('doc', 'Legal services', 'The areas of law we can help with.', '/legal-services'),
                      ('briefcase', 'For law firms', 'Exclusive client enquiries for solicitors.', '/partners')], 'three')),
     extra_head='<meta name="robots" content="noindex"/>', backup=False)

exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_seo.py')).read())

# ---------------------------------------------------------------- shared nav on every other page (legal pages from tools/legal.py)
for f in glob.glob(f'{PUB}/**/*.html', recursive=True):
    name = os.path.relpath(f, PUB)
    if name in ('privacy-policy.html', 'terms-conditions.html', 'cookie-policy.html'):
        h = open(f).read()
        h2 = with_nav(h, os.path.basename(f))
        if h2 != h:
            open(f, 'w').write(h2)
print('built')

# ---------------------------------------------------------------- sitemap + robots
_urls = []
for f in sorted(glob.glob(f'{PUB}/**/*.html', recursive=True)):
    h = open(f).read()
    if 'name="robots" content="noindex"' in h or f.endswith('404.html') or '/platform/' in f:
        continue
    rel = os.path.relpath(f, PUB)[:-5]
    _urls.append(SITE + ('/' if rel == 'index' else '/' + rel))
open(f'{PUB}/sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
                                      + ''.join(f'<url><loc>{u}</loc></url>' for u in _urls) + '</urlset>\n')
open(f'{PUB}/robots.txt', 'w').write(f'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: {SITE}/sitemap.xml\n')
print('sitemap', len(_urls))
