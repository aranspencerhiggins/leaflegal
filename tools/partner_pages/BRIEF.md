# Brief: Loanleaf partner (broker) pages

Repo ~/loanleaf-site. Write ONLY the JSON files named in your task, in tools/partner_pages/. Do not edit, commit, push or build anything else.

Audience: UK commercial finance brokers and lenders who buy business finance leads from Loanleaf. These pages explain how Loanleaf works for them, the broker platform, pricing and practical guides.

## Read first
1. tools/seo_content/BRIEF.md: follow its "Hard rules" and use ONLY its "Facts you may use" (British English, no em/en dashes, no invented stats, customers, testimonials or lender names, no "UK's leading", no FCA compliance advice beyond "you are responsible for your own regulatory position").
2. tools/partners_content.py: the live /partners sales copy. Where it and the brief disagree on a price or rule, follow partners_content.py. Don't copy its sentences; write fresh copy.
3. LOANLEAF-OVERVIEW.md sections 2 and 4 for extra platform detail (onboarding steps: account, company details incl. FCA reference, lead criteria and mode, public profile, plan, partner agreement, card payment; firms can't buy until approved, agreement signed and credits added; the business owner is sent a "you’ve been matched" email showing the broker’s public profile with logo and contact buttons; unsold leads drop to 50% off after 72 hours; auto-buy never takes a lead whose phone or email check failed; up to 5 CRM webhooks; a low-credit warning email).

Do NOT mention: the admin area, Loanleaf’s internal CRM, lead tiers, Bird, Resend, Stripe by name (say "card payment"), Meta by name except where the facts brief allows, number of partners or leads, any partner or prospect name.

## Format
Each page is one JSON file in the same format as tools/seo_content/BRIEF.md "Output format", plus one extra key:
- "nav": short menu label, ≤ 28 characters (e.g. "Auto-buy", "Speed to lead").
"slug" is the URL path after /partners/ given in your task (it may contain a slash, e.g. "platform/auto-buy"). File name = slug with "/" replaced by "--" plus .json (e.g. tools/partner_pages/platform--auto-buy.json).

Length: 900 to 1,500 words of body (sections + FAQs) unless your task says otherwise; 5 to 8 sections; 4 to 6 FAQs. Practical and specific: what the broker sees and does, step by step, with concrete examples using the real lead fields. Link with <a href="/partners/...">…</a> to 2 to 4 sibling pages listed in your task and to /partners/apply once.

Run the word-count/dash check from the seo brief on each file (it works unchanged) and fix until it passes. Reply with one line per file: path and word count.
