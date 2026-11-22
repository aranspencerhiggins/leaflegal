# /partners: the law firm sales page, in the same design as loanleaf.co/partners (styles: public/assets/cfb.css).
# Facts must match legal_partners_content.py: exclusive, pay per lead at an agreed price, minimum 10 a month, no platform yet,
# delivery by email or CRM. No em dashes.

APPLY = '/partners/apply'


def build(ICON, TICK, faq_html, faq_h2, LC, AREA_LEADS, hero_img):
    arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
    ok = f'<i class="cfb-ok">{TICK}</i>'
    join = f'<div class="cfb-ctas cfb-join"><a class="cfb-btn dark" href="{APPLY}">Become a partner firm{arrow}</a></div>'

    hero = f'''<section class="ll-pagehead ll-hero-split cfb-hero-split"><div class="ll-hero-grid"><div>
<h1>Client enquiries for <span>solicitors and law firms</span></h1>
<p class="ll-lead">Exclusive. Pre-screened. Pay per lead.</p>
<ul class="ll-hero-ticks"><li>{TICK}Choose your practice areas, matter types and locations</li><li>{TICK}Verified mobile and email, paid help confirmed</li><li>{TICK}Exclusive to your firm, sent straight to your inbox or CRM</li></ul>
<div class="ll-head-btns"><a class="cfb-btn" href="{APPLY}">Become a partner firm{arrow}</a></div>
</div><div class="ll-hero-media"><img src="{hero_img}" alt="A solicitor on the phone with a client" loading="eager" fetchpriority="high" style="object-position:50% 30%"/></div></div></section>'''

    facts = [('target', 'Matched', 'By practice area, matter type and location'), ('user', 'Exclusive', 'Sent to one firm only, never resold'),
             ('phone', 'Verified', 'UK mobile and email checked'), ('doc', 'Consent recorded', 'Wording and time kept with every lead')]
    factbar = '<section class="cfb-facts"><div class="cfb-wrap"><ul>' + ''.join(f'<li><i>{ICON[ic]}</i><div><b>{a}</b><span>{b}</span></div></li>' for ic, a, b in facts) + '</ul></div></section>'

    anatomy = f'''<section class="cfb-sec cfb-anat"><div class="cfb-wrap"><div class="cfb-head"><h2>The first call, answered before you dial</h2>
<p>{LC.LEAD_CONTENTS_TEXT}</p></div>
<div class="cfb-anat-grid"><ol class="cfb-points">{''.join(f'<li><b>{t}</b><p>{d}</p></li>' for _, t, d in LC.LEAD_CONTENTS)}</ol></div>{join}</div></section>'''

    x = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
    filt = f'''<section class="cfb-sec cfb-filter"><div class="cfb-wrap"><div class="cfb-head"><h2>Filtered before it reaches you</h2>
<p>{LC.QUAL_LEAD}</p></div>
<div class="cfb-split"><div class="cfb-col in"><h3>Reaches you</h3><ul>{''.join(f'<li>{ok}{v}</li>' for v in LC.QUAL_YES)}</ul></div>
<div class="cfb-col out"><h3>Turned away</h3><ul>{''.join(f'<li><i class="cfb-no">{x}</i>{v}</li>' for v in LC.QUAL_NO)}</ul></div></div></div></section>'''

    slugs = ['conveyancing', 'immigration', 'family-law', 'debt-recovery', 'motoring-offences', 'licensing', 'lease-extensions', 'trademarks']
    fgrid = ''.join(f'<a class="cfb-fund" href="/partners/{AREA_LEADS[s]["slug"]}"><span>{ICON[ic]}</span><b>{name}</b></a>' for s, (ic, name, *_rest) in zip(slugs, LC.AREAS))
    fund = f'''<section class="cfb-sec cfb-fundsec" id="areas"><div class="cfb-wrap"><div class="cfb-head"><h2>{LC.AREAS_H2}</h2>
<p>{LC.AREAS_LEAD}</p></div><div class="cfb-fgrid">{fgrid}<a class="cfb-fund" href="/partners/lead-generation-for-law-firms"><span>{ICON['other']}</span><b>All practice areas</b></a></div>{join}</div></section>'''

    chips = ''.join(f'<span class="on">{c}</span>' for c in ['Family law', 'Contested finances', 'Child arrangements', 'Manchester', 'Stockport', '20 a month']) + '<span>Conveyancing</span><span>National</span>'
    modes = f'''<section class="cfb-sec cfb-modes"><div class="cfb-wrap"><div class="cfb-head"><h2>Only the work you want</h2>
<p>Tell us what you do and where you do it. We only send enquiries that fit, up to the volume your team can call back quickly.</p></div>
<div class="cfb-mode-grid">
<div class="cfb-mode dark"><span class="cfb-tag">Your criteria</span><h3>Set once. Change any time.</h3><p>Practice areas, matter types, locations and a monthly cap. Pause whenever your team is at capacity.</p>
<div class="cfb-crit" aria-hidden="true"><div class="cfb-crit-h"><b>Example criteria</b><em>On</em></div><div class="cfb-chips">{chips}</div>
<div class="cfb-limits"><div><dt>Up to</dt><dd>20 a month</dd></div><div><dt>Delivered to</dt><dd>Inbox and CRM</dd></div><div><dt>Status</dt><dd>Live</dd></div></div></div></div>
<div class="cfb-mode"><span class="cfb-tag">Delivery</span><h3>Straight to your intake team</h3><p>Every lead arrives the moment it is checked, with every answer, the source, a timestamp and the consent record.</p>
<ul><li>{ok}Email to one or more addresses</li><li>{ok}A shared intake inbox</li><li>{ok}Your CRM or case management system by webhook</li></ul></div>
</div>{join}</div></section>'''

    factors = [('scale', 'Practice area', 'A contested finances case is worth more than a remortgage'), ('target', 'Matter type', 'Choose the matters you want'),
               ('pin', 'Location', 'From one town to national coverage'), ('chart', 'Volume', 'Minimum 10 a month, then you choose')]
    cost = f'''<section class="cfb-sec cfb-cost" id="pricing"><div class="cfb-wrap cfb-cost-in"><div class="cfb-cost-copy"><h2>{LC.PRICING_H2}</h2>
<p>{LC.PRICING[0]}</p>
<ul class="cfb-cost-notes"><li>{ok}Price agreed with you before you start</li><li>{ok}Set a monthly cap and pause at any time</li><li>{ok}Invalid lead rules set out in your agreement</li></ul>
<div class="cfb-ctas"><a class="cfb-btn dark" href="{APPLY}">Become a partner firm{arrow}</a><a class="cfb-btn line" href="/partners/pricing">How pricing works</a></div></div>
<div class="cfb-cost-card"><div class="cfb-range"><span><small>Pay</small><b>Per lead</b></span><i aria-hidden="true"></i><span><small>Minimum</small><b>10 / month</b></span></div>
<p class="cfb-cost-h">What sets the price</p><ul class="cfb-factors">{''.join(f'<li><i>{ICON[ic]}</i><div><b>{t}</b><span>{d}</span></div></li>' for ic, t, d in factors)}</ul></div></div></section>'''

    comp = ''.join(f'<div class="cfb-crm"><div class="cfb-crm-h"><span class="cfb-crm-logo">{ICON[ic]}</span><div><b>{t}</b></div></div><p>{d}</p></div>'
                   for ic, (t, d) in zip(['scroll', 'shield', 'doc', 'eye', 'scale'], LC.COMPLIANCE[:3]))
    compliance = f'''<section class="cfb-sec cfb-int" id="compliance"><div class="cfb-wrap"><div class="cfb-head"><h2>Built around your professional duties</h2>
<p>Referral disclosure, consent and data protection are part of every lead. <a href="/partners/sra-referral-rules">How we work with the SRA rules</a>.</p></div>
<div class="cfb-crm-grid">{comp}</div></div></section>'''

    steps = [('Book a call', 'Leave your details and pick a time for a 30-minute call with our team.'),
             ('Agree your criteria', 'Practice areas, matter types, locations, monthly volume and your price per lead. See a sample lead first.'),
             ('Sign your agreement', 'Pricing, billing, delivery and invalid lead rules, all in writing before you start.'),
             ('Call your clients', 'Leads arrive by email or CRM the moment they are checked. Call while the enquiry is fresh.')]
    how = f'''<section class="cfb-sec cfb-how" id="how-it-works"><div class="cfb-wrap"><div class="cfb-head"><h2>From first call to first lead</h2><p>No platform to learn and no long contract to read alone. We set it up with you.</p></div>
<ol class="cfb-steps">{''.join(f'<li><span>{i}</span><b>{t}</b><p>{d}</p></li>' for i, (t, d) in enumerate(steps, 1))}</ol>{join}</div></section>'''

    faq = f'''<section class="cfb-sec cfb-faq" id="faq"><div class="cfb-wrap"><div class="cfb-head"><h2>{faq_h2}</h2>
<p>Choose a topic to see the questions firms ask us most.</p></div>{faq_html}</div></section>'''

    final = f'''<section class="cfb-final"><div class="cfb-wrap cfb-final-in"><div><h2>Your next client could be filling in the form right now</h2>
<p>Tell us what you do. Book a call and see a sample lead.</p></div>
<div class="cfb-ctas"><a class="cfb-btn dark" href="{APPLY}">Become a partner firm{arrow}</a><a class="cfb-link" href="/partners/how-it-works">How it works</a></div></div></section>'''

    return hero + factbar + anatomy + fund + filt + modes + cost + compliance + how + faq + final


def parts(ICON, TICK, LC):
    """Reusable /partners sections for the other law firm pages (fact bar, lead contents, steps)."""
    arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
    join = f'<div class="cfb-ctas cfb-join"><a class="cfb-btn dark" href="{APPLY}">Become a partner firm{arrow}</a></div>'
    facts = [('target', 'Matched', 'By practice area, matter type and location'), ('user', 'Exclusive', 'Sent to one firm only, never resold'),
             ('phone', 'Verified', 'UK mobile and email checked'), ('doc', 'Consent recorded', 'Wording and time kept with every lead')]
    factbar = '<section class="cfb-facts"><div class="cfb-wrap"><ul>' + ''.join(f'<li><i>{ICON[ic]}</i><div><b>{a}</b><span>{b}</span></div></li>' for ic, a, b in facts) + '</ul></div></section>'
    anatomy = (f'<section class="cfb-sec cfb-anat"><div class="cfb-wrap"><div class="cfb-head"><h2>What every lead includes</h2><p>{LC.LEAD_CONTENTS_TEXT}</p></div>'
               f'<div class="cfb-anat-grid"><ol class="cfb-points">' + ''.join(f'<li><b>{t}</b><p>{d}</p></li>' for _, t, d in LC.LEAD_CONTENTS) + '</ol></div></div></section>')
    steps = [('Book a call', 'Leave your details and pick a time for a 30-minute call with our team.'),
             ('Agree your criteria', 'Practice areas, matter types, locations, monthly volume and your price per lead. See a sample lead first.'),
             ('Sign your agreement', 'Pricing, billing, delivery and invalid lead rules, all in writing before you start.'),
             ('Call your clients', 'Leads arrive by email or CRM the moment they are checked. Call while the enquiry is fresh.')]
    how = (f'<section class="cfb-sec cfb-how"><div class="cfb-wrap"><div class="cfb-head"><h2>From first call to first lead</h2><p>No platform to learn and no long contract to read alone. We set it up with you.</p></div>'
           f'<ol class="cfb-steps">' + ''.join(f'<li><span>{i}</span><b>{t}</b><p>{d}</p></li>' for i, (t, d) in enumerate(steps, 1)) + f'</ol>{join}</div></section>')
    return {'factbar': factbar, 'anatomy': anatomy, 'how': how}
