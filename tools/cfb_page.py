# /partners: the broker sales page. Styles: public/assets/cfb.css.
# Facts must match partners_content.py and the platform (prices, plans, criteria, refunds). Imported by build_pages.py.

APPLY = '/partners/apply'
import os, re
_LOGOS = os.path.join(os.path.dirname(__file__), 'logos')


def logo(name):  # Simple Icons (CC0) + Pipedrive's own mark, inlined so they take currentColor
    svg = open(os.path.join(_LOGOS, f'{name}.svg')).read()
    return re.sub(r'<title>.*?</title>', '', svg).replace('role="img"', 'aria-hidden="true" fill="currentColor"')


def build(ICON, TICK, faq_html, faq_h2):
    star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>'
    arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
    ok = f'<i class="cfb-ok">{TICK}</i>'
    fit = f'<span class="cfb-fit">{ICON["target"]}Fits your criteria</span>'

    # Hero photo (owner: lead screenshots looked cheap; full-bleed photo instead, like the business pages).
    hero_cards = ''
    hero_photo = '<div class="cfb-photo" aria-hidden="true"><img src="/assets/stock-partners-hero.webp" alt="" fetchpriority="high"/></div>'

    join = f'<div class="cfb-ctas cfb-join"><a class="cfb-btn dark" href="{APPLY}">Become a partner{arrow}</a></div>'

    hero = f'''<section class="ll-pagehead ll-hero-split cfb-hero-split"><div class="ll-hero-grid"><div>
<h1>Business loan leads for <span>commercial finance brokers</span></h1>
<p class="ll-lead">Exclusive. Verified. Pay per lead.</p>
<ul class="ll-hero-ticks"><li>{TICK}Filter by loan size, revenue, years trading and credit history</li><li>{TICK}Phone, email and Companies House verified</li><li>{TICK}Exclusive to you and sent straight to your email or CRM</li></ul>
<div class="ll-head-btns"><a class="cfb-btn" href="{APPLY}">Become a partner{arrow}</a></div>
</div><div class="ll-hero-media"><img src="/assets/stock-partners-cafe.webp" alt="" loading="eager" fetchpriority="high" style="object-position:60% 30%"/></div></div></section>'''

    facts = [('target', 'Filtered', 'By revenue, years trading, loan size and credit'), ('user', 'Exclusive', 'Sold to one broker only, never resold'),
             ('phone', 'Verified', 'Phone and email checked live'), ('doc', 'Companies House', 'Company number and age checked')]
    factbar = '<section class="cfb-facts"><div class="cfb-wrap"><ul>' + ''.join(f'<li><i>{ICON[ic]}</i><div><b>{a}</b><span>{b}</span></div></li>' for ic, a, b in facts) + '</ul></div></section>'

    points = [('Checked at Companies House', 'We look the company up as they type, so you see its number, age and whether the person enquiring is a listed director.'),
              ('Contact details tested live', 'The mobile is checked on the network and the mailbox is checked for delivery. Leads that fail are never auto-bought.'),
              ('Consent recorded', 'The business agreed to be contacted by a broker about finance. The wording and time are kept with the lead.'),
              ('Scored for fundability', 'Time trading, revenue and whether the amount is realistic for the size of the business give every lead a score, so the strongest stand out.')]
    anatomy = f'''<section class="cfb-sec cfb-anat"><div class="cfb-wrap"><div class="cfb-head"><h2>The first call, answered before you dial</h2>
<p>Each lead is the complete record of what the business told us, in their own answers. No scraped data, no guesswork.</p></div>
<div class="cfb-anat-grid"><ol class="cfb-points">{''.join(f'<li><b>{t}</b><p>{d}</p></li>' for t, d in points)}</ol></div>{join}</div></section>'''

    yes = ['UK limited companies and LLPs', 'Trading for at least 6 months', 'Annual revenue of £50,000 or more', 'Looking for £5,000 or more', 'A valid UK mobile and a real email address', 'Recorded consent to be contacted']
    no = ['Sole traders and ordinary partnerships', 'Start-ups not yet trading', 'Under 6 months trading', 'Revenue under £50,000', 'Personal or consumer borrowing', 'No consent to be contacted']
    x = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
    filt = f'''<section class="cfb-sec cfb-filter"><div class="cfb-wrap"><div class="cfb-head"><h2>Filtered before it costs you anything</h2>
<p>The form asks what you would ask on a first call. Businesses most lenders would decline are told politely that we can’t help, so they never become a lead.</p></div>
<div class="cfb-split"><div class="cfb-col in"><h3>Reaches you</h3><ul>{''.join(f'<li>{ok}{v}</li>' for v in yes)}</ul></div>
<div class="cfb-col out"><h3>Turned away</h3><ul>{''.join(f'<li><i class="cfb-no">{x}</i>{v}</li>' for v in no)}</ul></div></div></div></section>'''

    chips = ''.join(f'<span class="on">{c}</span>' for c in ['Growth and expansion', 'Cash flow', '£30k to £2m+', '2+ years trading', '£250k+ revenue', 'Clean credit']) + '<span>Equipment</span><span>Property</span>'
    modes = f'''<section class="cfb-sec cfb-modes"><div class="cfb-wrap"><div class="cfb-head"><h2>Buy the way your team works</h2>
<p>Pick leads by hand, let auto-buy take the ones that fit, or both. Change it any time.</p></div>
<div class="cfb-mode-grid">
<div class="cfb-mode dark"><span class="cfb-tag">Auto-buy</span><h3>Set it once. Leads find you.</h3><p>Choose what you fund and auto-buy takes each matching lead the second it lands, then sends it to your inbox and CRM.</p>
<div class="cfb-crit" aria-hidden="true"><div class="cfb-crit-h"><b>Your criteria</b><em>On</em></div><div class="cfb-chips">{chips}</div>
<div class="cfb-limits"><div><dt>Up to</dt><dd>3 a day</dd></div><div><dt>Delivered to</dt><dd>Inbox and CRM</dd></div><div><dt>Status</dt><dd>Live</dd></div></div></div></div>
<div class="cfb-mode"><span class="cfb-tag">Manual</span><h3>Browse, then buy</h3><p>Every live lead shows its purpose, amount, revenue, trading history and credit. Contact details unlock the moment you buy, and nobody else can buy it after you.</p>
<ul><li>{ok}See the full details before you commit</li><li>{ok}Matching leads emailed to you as they arrive</li><li>{ok}Contact details unlock instantly</li></ul></div>
</div>{join}</div></section>'''

    factors = [('cash', 'Loan size', 'How much the business wants to borrow'), ('chart', 'Revenue', 'Annual turnover, from £50k up'),
               ('clock', 'Time trading', 'From 6 months to 5+ years'), ('shield', 'Credit history', 'Clean, adverse or unsure')]
    cost = f'''<section class="cfb-sec cfb-cost"><div class="cfb-wrap cfb-cost-in"><div class="cfb-cost-copy"><h2>Cost per lead</h2>
<p>Each lead costs between £20 and £300, priced by how fundable it is. An established business asking for a sensible amount costs more than a young one asking for many times its revenue, so you pay for real opportunities.</p>
<ul class="cfb-cost-notes"><li>{ok}See the price of every lead before you buy</li><li>{ok}Set a maximum price and auto-buy never pays more</li></ul>
<div class="cfb-ctas"><a class="cfb-btn dark" href="{APPLY}">Become a partner{arrow}</a><a class="cfb-btn line" href="/partners/cost-per-lead-calculator">Cost per lead calculator</a></div></div>
<div class="cfb-cost-card"><div class="cfb-range"><span><small>From</small><b>£20</b></span><i aria-hidden="true"></i><span><small>Up to</small><b>£300</b></span></div>
<p class="cfb-cost-h">What sets the price</p><ul class="cfb-factors">{''.join(f'<li><i>{ICON[ic]}</i><div><b>{t}</b><span>{d}</span></div></li>' for ic, t, d in factors)}</ul></div></div></section>'''

    funding = [('growth', 'Growth and expansion', '/partners/business-loan-leads'), ('cash', 'Cash flow and working capital', '/partners/mca-leads'), ('equip', 'Equipment and vehicles', '/partners/asset-finance-leads'),
               ('property', 'Commercial property', '/partners/commercial-mortgage-leads'), ('refi', 'Refinancing', '/partners/commercial-finance-leads'), ('stock', 'Stock and inventory', None),
               ('tax', 'Tax and VAT bills', None), ('other', 'Acquisitions and other', None)]
    fgrid = ''.join((f'<a class="cfb-fund" href="{u}">' if u else '<div class="cfb-fund">') + f'<span>{ICON[ic]}</span><b>{t}</b>' + ('</a>' if u else '</div>') for ic, t, u in funding)
    fund = f'''<section class="cfb-sec cfb-fundsec"><div class="cfb-wrap"><div class="cfb-head"><h2>Every kind of commercial finance enquiry</h2>
<p>Tell us which types you arrange and you only see the ones that fit.</p></div><div class="cfb-fgrid">{fgrid}</div>{join}</div></section>'''

    direct = [('hubspot', 'HubSpot', '#ff7a59', 'Each lead becomes a HubSpot contact through your own HubSpot form. Works on every HubSpot plan, free included.',
               ['Contact created or updated by email', 'Loan details in the contact’s message', 'Set up by pasting your form’s embed code']),
              ('pipedrive', 'Pipedrive', '#203232', 'Each lead becomes a deal, with its organisation, person and a note of everything the business told us.',
               ['Deal valued at the loan amount', 'Set up by pasting your API token', 'Send a test lead to check it works'])]
    cards = ''.join(f'''<div class="cfb-crm"><div class="cfb-crm-h"><span class="cfb-crm-logo" style="color:{c}">{logo(k)}</span><div><b>{n}</b><em>Direct integration</em></div></div>
<p>{d}</p><ul>{''.join(f'<li>{ok}{t}</li>' for t in ticks)}</ul></div>''' for k, n, c, d, ticks in direct)
    hook = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/></svg>'
    tools_ = [('zapier', 'Zapier'), ('make', 'Make'), ('salesforce', 'Salesforce'), ('zoho', 'Zoho CRM'), ('googlesheets', 'Google Sheets'), ('airtable', 'Airtable'), ('slack', 'Slack')]
    strip = ''.join(f'<li>{logo(k)}<span>{n}</span></li>' for k, n in tools_) + f'<li>{hook}<span>Any webhook</span></li>'
    crm = f'''<section class="cfb-sec cfb-int"><div class="cfb-wrap"><div class="cfb-head"><h2>Leads land where you already work</h2>
<p>Direct connections to HubSpot and Pipedrive, plus Zapier, Make and any CRM that accepts a webhook. Every lead arrives the moment it’s bought, alongside the email.</p></div>
<div class="cfb-crm-grid">{cards}<div class="cfb-crm cfb-crm-any"><div class="cfb-crm-h"><span class="cfb-crm-logo">{hook}</span><div><b>Every other CRM</b><em>Zapier, Make or webhook</em></div></div>
<p>Each lead is posted as JSON to up to five webhook addresses, signed if you want. Connect it through Zapier or Make in a few clicks, or point it at your own system.</p>
<ul class="cfb-logos">{strip}</ul></div></div></div></section>'''

    steps = [('Become a partner', 'Tell us about your firm and the finance you arrange. It takes a couple of minutes.'),
             ('Set your criteria', 'Loan sizes, purposes, revenue, time trading and credit. Then buy by hand or switch on auto-buy.'),
             ('Get approved', 'We check every new partner, usually within one working day, then leads start flowing.'),
             ('Call the business', 'Leads arrive by email, webhook or CRM the moment they are submitted. Call while they are still at their desk.')]
    how = f'''<section class="cfb-sec cfb-how"><div class="cfb-wrap"><div class="cfb-head"><h2>Live in an afternoon</h2><p>No sales call needed, though we are happy to talk.</p></div>
<ol class="cfb-steps">{''.join(f'<li><span>{i}</span><b>{t}</b><p>{d}</p></li>' for i, (t, d) in enumerate(steps, 1))}</ol>{join}</div></section>'''

    calc = '<a href="/partners/cost-per-lead-calculator">cost per lead calculator</a>'
    faq = f'''<section class="cfb-sec cfb-faq" id="faq"><div class="cfb-wrap"><div class="cfb-head"><h2>{faq_h2}</h2>
<p>Choose a topic to see the questions brokers ask us most. To see what a lead costs, try our {calc}.</p></div>{faq_html}</div></section>'''

    final = f'''<section class="cfb-final"><div class="cfb-wrap cfb-final-in"><div><h2>Your next client could be filling in the form right now</h2>
<p>Tell us what you fund. Book a call with the team, or get set up straight away.</p></div>
<div class="cfb-ctas"><a class="cfb-btn dark" href="{APPLY}">Become a partner{arrow}</a><a class="cfb-link" href="/partners/cost-per-lead-calculator">Cost per lead calculator</a></div></div></section>'''

    return hero + factbar + anatomy + modes + crm + cost + fund + how + faq + final
