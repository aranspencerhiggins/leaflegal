# Removes every trace of the original template / site builder from public/ (safe to re-run).
# Run LAST, after legal.py and build_pages.py:  python3 tools/detemplate.py
#  - HTML: builder comments, generator meta, data-wf-* / data-w-id attributes, builder scripts and their
#          inline fade-in states, the template name in titles/descriptions, builder class/id prefixes.
#  - CSS:  the same class prefixes, builder font names and badge rules.
#  - Assets: builder ID prefixes stripped from file names (references updated everywhere); builder JS,
#            jQuery, badge images and the template's sample PDF deleted (nothing uses them any more).
import glob, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB, ASSETS = os.path.join(ROOT, 'public'), os.path.join(ROOT, 'public', 'assets')

DESC = 'Loanleaf helps UK limited companies and LLPs find business loans from £5,000 to £2m+ by matching them with a specialist finance broker.'

# ---------------------------------------------------------------- 1. asset files
DELETE = re.compile(r'(jquery-[\d.]+\.min|webflow\.(schunk|[0-9a-f]{8})\.|webflow-badge|_Webflow_Ebook|image-placeholder\.svg)', re.I)
renames = {}
taken = set(os.listdir(ASSETS))
for name in sorted(os.listdir(ASSETS)):
    path = os.path.join(ASSETS, name)
    if DELETE.search(name):
        os.remove(path); renames[name] = None; continue
    m = re.match(r'^[0-9a-f]{6}-(?:[0-9a-f]{24}_)?(.+)$', name)
    if not m:
        continue
    new = m.group(1)
    if re.search(r'webflow\.shared\.[0-9a-f]+\.css$', new):
        new = 'base.css'
    stem, ext = os.path.splitext(new)
    cand, i = new, 2
    while cand in taken and cand != name:
        cand = f'{stem}-{i}{ext}'; i += 1
    taken.discard(name); taken.add(cand)
    os.rename(path, os.path.join(ASSETS, cand))
    renames[name] = cand

# ---------------------------------------------------------------- 2. text rewrites
def css_fix(t):
    t = re.sub(r'\.w--current\b', '.is-current', t)
    t = re.sub(r'(?<![\w-])\.w-(?=[a-z0-9])', '.u-', t)
    t = re.sub(r'#w-node-', '#u-node-', t)
    t = re.sub(r'(\[class[\^*$|~]?=["\'] ?)w-', r'\1u-', t)
    t = t.replace('webflow-icons', 'site-icons')
    t = re.sub(r'[^{}]*\.u-webflow-badge[^{}]*\{[^}]*\}', '', t)   # badge rules
    return t


def html_fix(h):
    h = re.sub(r'<!--.*?-->', '', h, flags=re.S)
    h = re.sub(r'<meta content="Webflow" name="generator"\s*/?>', '', h)
    h = re.sub(r'\s+data-wf-[a-z-]+="[^"]*"', '', h)
    h = re.sub(r'\s+data-w-id="[^"]*"', '', h)
    h = re.sub(r'\s+style="[^"]*opacity:0[^"]*"', '', h)        # builder fade-in start states (no longer animated)
    h = re.sub(r'<script[^>]*>\s*window\.__WEBFLOW_CURRENCY_SETTINGS.*?</script>', '', h, flags=re.S)
    h = re.sub(r'<script[^>]*>!function\(o,c\)\{var n=c\.documentElement,t=" w-mod-".*?</script>', '', h, flags=re.S)
    h = re.sub(r'<script src="[^"]*(?:jquery|webflow)[^"]*"[^>]*></script>', '', h)
    # template name in titles / meta
    h = re.sub(r'\s*\|\s*Waystone - Webflow HTML Website Template', ' | Loanleaf', h)
    h = re.sub(r'(<meta[^>]*content=")[^"]*Waystone[^"]*(")', lambda m: m.group(1) + DESC + m.group(2), h)
    h = re.sub(r'(content=")[^"]*Waystone[^"]*(")', lambda m: m.group(1) + DESC + m.group(2), h)
    h = h.replace('Waystone offices', 'Loanleaf offices').replace('Waystone', 'Loanleaf')
    # builder class / id prefixes
    def cls(m):
        toks = ['is-current' if c == 'w--current' else ('u-' + c[2:] if c.startswith('w-') else c) for c in m.group(2).split()]
        return f'{m.group(1)}{" ".join(toks)}"'
    h = re.sub(r'(\sclass=")([^"]*)"', cls, h)
    h = re.sub(r'(\sid=")w-node-', r'\1u-node-', h)
    h = re.sub(r'(id|name|data-name)="wf-form-', r'\1="form-', h)
    h = re.sub(r'\s+data-wf-[a-z-]+', '', h)
    return h


# list text files AFTER renaming, so renamed CSS/JS files are included under their new names
TEXT_FILES = [f for pat in ('public/**/*.html', 'public/assets/*.css', 'public/assets/*.js', 'tools/*.py', 'api/*.js')
              for f in glob.glob(os.path.join(ROOT, pat), recursive=True) if not f.endswith('detemplate.py')]
changed = 0
for f in TEXT_FILES:
    t = open(f, encoding='utf-8', errors='surrogateescape').read()
    o = t
    for old, new in renames.items():
        if old in t:
            t = t.replace(f'/assets/{old}', f'/assets/{new}' if new else '/assets/_removed') if new else t
    if f.endswith('.html'):
        t = html_fix(t)
    elif f.endswith('.css'):
        t = css_fix(t)
    if t != o:
        open(f, 'w', encoding='utf-8', errors='surrogateescape').write(t); changed += 1

# ---------------------------------------------------------------- 3. report anything left
left = []
for f in glob.glob(os.path.join(PUB, '**/*'), recursive=True):
    if os.path.isfile(f) and f.endswith(('.html', '.css', '.js')):
        t = open(f, encoding='utf-8', errors='ignore').read()
        for pat in ('webflow', 'Webflow', 'waystone', 'Waystone', 'data-wf-', 'data-w-id', '_removed'):
            if pat in t:
                left.append((os.path.relpath(f, PUB), pat, t.count(pat)))
print(f'renamed {sum(1 for v in renames.values() if v)} assets, deleted {sum(1 for v in renames.values() if v is None)}, rewrote {changed} files')
for l in left:
    print('  still contains:', *l)
