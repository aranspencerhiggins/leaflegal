# Richer sections for client pages (area, matter and location pages). Run inside tools/build_pages.py (exec), so it shares
# its helpers. Owner (2026-11-21): "nicer sections, more text". No em dashes, colons or semicolons in copy.
# Immigration copy must never advise: it only describes fees, what to ask and how the introduction works.

AREA_EXTRA = {
    'conveyancing': {
        'more': 'A good conveyancer keeps you updated without you having to chase, explains anything unusual in the paperwork in plain English and works with your estate agent and mortgage broker to keep the chain moving. When we introduce you, the firm will explain how they work and what they need from you to get started.',
        'who': 'Home buyers, sellers, landlords and anyone remortgaging or transferring ownership',
        'fees': ['Most conveyancing firms quote a fixed legal fee for the transaction, plus disbursements. Disbursements are costs the firm pays on your behalf, such as searches, Land Registry fees, identity checks and bank transfer fees. If you are buying, Stamp Duty Land Tax may also be due, and the firm usually pays it for you from the money you send them.',
                 'Leasehold work, new builds, shared ownership and buying with a company usually cost more because there is more to check. A good firm puts everything in writing before you instruct them, so you can compare quotes like for like and avoid surprises at completion.'],
        'ask': ['Is your quote fixed, and what could make it change?', 'Which disbursements are included, and which are extra?', 'Are you on my mortgage lender’s panel?', 'Who will handle my file day to day, and how do I reach them?', 'How long do purchases like mine usually take with you?'],
        'act': ['As soon as your offer is accepted or you agree a sale', 'Before your mortgage offer or a fixed rate runs out', 'When your buyer or seller has already instructed a firm', 'If you are buying at auction, where deadlines are short'],
    },
    'lease-extensions': {
        'more': 'A specialist leasehold solicitor checks your lease, explains your options and deals with the freeholder for you, working alongside a surveyor who values the premium. When we introduce you, the firm will explain the likely timescale and costs for your particular lease.',
        'who': 'Owners of leasehold flats and houses, and groups of flat owners buying their freehold',
        'fees': ['A lease extension usually involves two professionals. A solicitor handles the legal process, and a surveyor values the premium you pay the freeholder. Each will quote separately, and many solicitors work with surveyors they can recommend.',
                 'At present, if you use the statutory route you usually also pay the freeholder’s reasonable legal and valuation costs. The law on leasehold is changing, so ask the firm which rules apply to your lease and how that affects the overall cost.'],
        'ask': ['Do you recommend the statutory route or an informal deal for my lease?', 'Can you recommend a surveyor, and how do your fees fit together?', 'What costs might I have to pay the freeholder?', 'How long is the process likely to take?', 'What happens if the freeholder can’t be found or doesn’t reply?'],
        'act': ['When your lease drops towards 90 years', 'Before you put the flat on the market', 'Before you remortgage, as lenders look closely at lease length', 'If you have received a notice from your freeholder'],
    },
    'immigration': {
        'more': 'A regulated adviser looks at your circumstances, explains your options and prepares and submits applications on your behalf. Leaflegal does not give advice of any kind. We simply introduce you to a regulated firm or adviser who can.',
        'who': 'Individuals, families and employers looking for a regulated immigration adviser',
        'fees': ['Immigration advisers usually charge a fixed fee for each application or stage of work, and some charge hourly for complex matters. Home Office application fees and any Immigration Health Surcharge are separate from the adviser’s fee and are paid to the Home Office.',
                 'Ask for the fee and what it covers in writing before you agree to anything. A regulated adviser must explain their costs clearly and tell you how to complain if something goes wrong.'],
        'ask': ['Who regulates you, and at what level?', 'What is your fee, and what does it include?', 'Are Home Office fees separate, and roughly how much are they?', 'Who will handle my case day to day?', 'How will you keep me updated?'],
        'act': ['When you have a decision letter or a deadline', 'Well before a visa or permission runs out', 'If you have been asked for more information', 'Before you send any application you are unsure about'],
    },
    'family-law': {
        'more': 'A good family solicitor listens first, explains your options calmly and helps you find the least stressful way forward, which often means agreeing things without going to court. When we introduce you, the firm will explain how they can help and what it is likely to cost.',
        'who': 'People going through a separation, divorce or arrangements for children',
        'fees': ['Family solicitors charge in different ways. Many offer a fixed fee first meeting, fixed fees for set stages such as a divorce application or a consent order, and hourly rates for work that is harder to predict, such as contested finances.',
                 'Leaflegal is for people who are paying privately. Legal aid is only available in limited family cases, usually where there is evidence of domestic abuse or child protection concerns. A firm can tell you whether you might qualify before you go further.'],
        'ask': ['Do you offer a fixed fee first meeting?', 'Which parts of my matter can you do on a fixed fee?', 'Do you support mediation or other ways to avoid court?', 'Who will I deal with, and how quickly do you reply?', 'How do you keep costs under control?'],
        'act': ['Before you agree anything about money or property', 'If you have received court papers or a deadline', 'If arrangements for children are breaking down', 'Before applying for a final order if finances are not settled'],
    },
    'licensing': {
        'more': 'A licensing solicitor deals with the licensing authority, the police and other responsible authorities for you, prepares your application or response and represents you at any hearing. When we introduce you, the firm will explain the process and timescales for your premises.',
        'who': 'Pubs, bars, restaurants, shops, venues and the people who run them',
        'fees': ['Licensing solicitors often quote a fixed fee for straightforward applications, such as a new premises licence or a variation, and hourly rates for reviews, objections and hearings. Council application fees are separate and set by the licensing authority.',
                 'If your licence is under review, early advice can make a real difference to the outcome and to the total cost. Ask the firm for an estimate that covers each stage, including any hearing.'],
        'ask': ['What will the council fee be, on top of yours?', 'How long will the application take?', 'Will you attend a hearing with me if one is needed?', 'Do you deal with the police and the licensing authority directly?', 'What can I do now to strengthen my position?'],
        'act': ['When a licence review has been called', 'Before you buy or take over licensed premises', 'If the police or council raise concerns', 'Before changing your hours, layout or activities'],
    },
    'trademarks': {
        'more': 'A trademark solicitor or chartered trade mark attorney checks whether your brand is free to use and register, files and prosecutes your application at the UK IPO, and acts for you if someone copies your brand or objects to your mark. When we introduce you, the firm will explain the process, the official fees and their own charges.',
        'who': 'Founders, small businesses, brand owners, creators and product businesses',
        'fees': ['Many trademark firms charge fixed fees for clearance searches, filing a UK application and answering a straightforward examination report. Official UK IPO fees are paid on top and depend on how many classes your application covers.',
                 'Oppositions, infringement claims and other disputes are usually charged in stages or by the hour. Ask the firm for an estimate for each stage, and whether a quick letter or a negotiated settlement could resolve things sooner.'],
        'ask': ['Is my name or logo likely to be accepted?', 'Which classes do I need, and what will the official fees be?', 'Should I search before I file?', 'What happens if someone opposes my application?', 'Do I need protection outside the UK?'],
        'act': ['Before you launch or rebrand', 'When you receive an examination report or a notice of opposition', 'If someone is using a name or logo like yours', 'When a renewal date is coming up'],
    },
    'debt-recovery': {
        'more': 'A debt recovery solicitor can send a formal letter before action, issue a claim at court and use enforcement options if a judgment is not paid. Often the letter alone gets the invoice paid. When we introduce you, the firm will explain the steps and costs for your debt.',
        'who': 'Businesses owed money by other businesses',
        'fees': ['Debt recovery solicitors often charge fixed fees for a letter before action and for issuing a claim, with further fees if the debt is defended or needs enforcing. Court fees depend on the amount you claim.',
                 'For business to business debts you may be able to add statutory interest and fixed compensation under the Late Payment of Commercial Debts (Interest) Act 1998. The firm can tell you what you can claim and how much of your costs you might recover.'],
        'ask': ['What will a letter before action cost?', 'What are the court fees for a claim of my size?', 'Can I add late payment interest and compensation?', 'What happens if the debt is disputed?', 'How do you enforce a judgment if they still don’t pay?'],
        'act': ['When an invoice is well past its due date', 'If the customer stops replying', 'If you think the customer may be in financial trouble', 'Before the debt gets close to six years old'],
    },
}

_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
_Q = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4M12 17h.01"/></svg>'


def cs_glance(rows, title='At a glance'):
    return (f'<aside class="cs-glance"><p class="cs-glance-h">{title}</p><dl>'
            + ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in rows) + '</dl></aside>')


def cs_intro(h2, paras, rows, note=''):
    """Text on the left, an 'at a glance' card on the right."""
    return section(f'<div class="cs-intro"><div class="cs-intro-text"><h2 class="cs-h2">{h2}</h2>{prose(paras)}{note}</div>{cs_glance(rows)}</div>', cls='section cs-sec')


def cs_help(h_help, items, h_ready, ready, ready_note):
    cards_ = ''.join(f'<li><span class="cs-tick">{_CHECK}</span><span>{t}</span></li>' for t in items)
    rl = ''.join(f'<li><b>{ICON["doc"]}</b><span>{t}</span></li>' for t in ready)
    return section(f'<div class="cs-help"><div class="cs-help-main"><h2 class="cs-h2">{h_help}</h2><ul class="cs-helpgrid">{cards_}</ul></div>'
                   f'<div class="cs-ready"><h3>{h_ready}</h3><ol>{rl}</ol><p>{ready_note}</p></div></div>', cls='section cs-sec')


def cs_steps(h2, steps, href, label='Get matched', lead=''):
    ics = STEP_ICONS + ['check'] * max(0, len(steps) - len(STEP_ICONS))
    li = ''.join(f'<li><span class="cs-num">{ICON[ic]}</span><h3>{t}</h3><p>{d}</p></li>' for ic, (t, d) in zip(ics, steps))
    return (f'<section class="cs-steps" id="how"><div class="cs-steps-in"><div class="cs-steps-head"><h2>{h2}</h2>'
            + (f'<p>{lead}</p>' if lead else '') + f'</div><ol>{li}</ol><a href="{href}" class="button"><div>{label}</div></a></div></section>')


def cs_fees(a_slug, name):
    x = AREA_EXTRA[a_slug]
    ask = ''.join(f'<li><span class="cs-q">{_Q}</span>{q}</li>' for q in x['ask'])
    act = ''.join(f'<li><span class="cs-q">{_CLOCK}</span>{q}</li>' for q in x['act'])
    return section(f'<div class="cs-fees"><div class="cs-fees-text"><h2 class="cs-h2">Fees and costs</h2>{prose(x["fees"])}'
                   f'<p class="cs-small">Leaflegal is free for you to use. The firm pays us a fee for the introduction, and they will tell you about it in writing.</p></div>'
                   f'<div class="cs-fees-side"><div class="cs-box"><h3>Questions to ask the firm</h3><ul>{ask}</ul></div>'
                   f'<div class="cs-box cs-box-warm"><h3>When to get help</h3><ul>{act}</ul></div></div></div>', cls='section cs-sec')


def cs_things(items):
    return section(f'<h2 class="cs-h2 cs-center">Things to know</h2><div class="cs-things">'
                   + ''.join(f'<div class="cs-thing"><h3>{t}</h3><p>{d}</p></div>' for t, d in items) + '</div>', cls='section cs-sec')


def cs_guides(a_slug, guides):
    if not guides:
        return ''
    g = ''.join(f'<a class="ll-pcard" href="/guides/{x["slug"]}"><img src="{PH.photo(PH.AREA[a_slug][i % 2], 700)}" alt="" loading="lazy"/><div><span class="ll-gcat">Guide</span><b>{x["h1"]}</b><p>{x["lead"]}</p></div></a>'
                for i, x in enumerate(guides))
    return section(f'<h2 class="cs-h2 cs-center">Helpful guides</h2><div class="ll-ggrid cs-gg">{g}</div>', cls='section cs-sec')


def cs_links(h2, links):
    return section(f'<h2 class="cs-h2 cs-center">{h2}</h2>' + f'<ul class="ll-linkgrid">' + ''.join(f'<li><a href="{h}">{t}{ARR}</a></li>' for h, t in links) + '</ul>', cls='section cs-sec')


# ---------------------------------------------------------------- long-form content from tools/deep/*.json
import json as _djson
_DEEP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'deep')


def deep(key):
    p = os.path.join(_DEEP_DIR, key + '.json')
    return _djson.load(open(p)) if os.path.exists(p) else None


def _dblocks(blocks):
    out = []
    for b in blocks:
        if isinstance(b, str):
            out.append(f'<p>{b}</p>')
        elif 'h3' in b:
            out.append(f'<h3>{b["h3"]}</h3>')
        else:
            out.append('<ul>' + ''.join(f'<li>{x}</li>' for x in b['list']) + '</ul>')
    return ''.join(out)


def cs_deep(h2, d, uid='about', lead=''):
    if not d:
        return ''
    return section(f'<h2 class="cs-h2 cs-center">{h2}</h2>' + (f'<p class="cs-deep-lead">{lead}</p>' if lead else '')
                   + tabs(uid, [(t, f'<div class="cs-deep">{_dblocks(bl)}</div>') for t, bl in d['about']]), cls='section cs-sec')


def faq_groups(base, d, base_label='Common questions'):
    groups = [(base_label, base)] if base else []
    return groups + ([(g, [tuple(x) for x in qas]) for g, qas in d['faqs']] if d else [])


def cs_faqs(title, groups, cta_title, cta_text, href, label, uid='faq'):
    tabs_html = tabs(uid, [(name, ''.join(f'<details class="ll-faq"><summary class="large-text bold-text">{q}{CHEV_D}</summary><div class="ll-faq-a">{a}</div></details>' for q, a in qas)) for name, qas in groups], faq_panels=True)
    return f'''<section class="section" id="{uid}"><div class="container---main"><div class="vertical-section-content reduced-gap">
<h2 class="cs-h2 cs-center">{title}</h2>{tabs_html}
<div class="faq-cta"><div class="heading-four">{cta_title}</div><div class="large-text">{cta_text}</div><a href="{href}" class="button bg-base-50 w-inline-block"><div>{label}</div></a></div>
</div></div></section>'''
