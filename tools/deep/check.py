import json, re, sys
for p in sys.argv[1:]:
    d = json.load(open(p)); bad = []; words = 0
    def chk(t):
        global words
        words += len(re.sub(r'<[^>]+>', ' ', t).split())
        if re.search(r'[;—–]|\w: |:\s|:$', re.sub(r'<a [^>]+>', '', t)): bad.append(t[:90])
        if re.search(r'\bAran\b|founder', t, re.I): bad.append('FOUNDER ' + t[:60])
    for tab, blocks in d['about']:
        chk(tab)
        for b in blocks:
            if isinstance(b, str): chk(b)
            elif 'h3' in b: chk(b['h3'])
            else: [chk(x) for x in b['list']]
    nq = 0
    for g, qas in d['faqs']:
        chk(g)
        for q, a in qas: chk(q); chk(a); nq += 1
    print(p, 'words', words, 'faqs', nq, 'tabs', len(d['about']), 'groups', len(d['faqs']))
    for b in bad: print('  BAD', b)
    if words < 3600: print('  SHORT, aim for 4000+')
    if not bad and words >= 3600: print('  OK')
