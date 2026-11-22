# Leaflegal long-form page content brief

Leaflegal (leaflegal.co) is a free UK introduction service. People and businesses fill in a short form and Leaflegal introduces them to ONE regulated law firm (or, for immigration, a regulated adviser) that handles their kind of matter. The firm pays Leaflegal a fee for the introduction, which never changes what the client pays. Leaflegal is NOT a law firm and gives NO legal advice.

Each matter page needs about 4,000 NEW words of genuinely useful, specific content, organised so the page does not feel long:
- "about": 5 or 6 tabs (about 1,800 to 2,200 words in total). Tab names short (1 to 3 words), e.g. Overview, How it works, Timescales, Costs, Common problems, Your options. Pick tabs that suit the matter.
- "faqs": 4 or 5 groups (tab names, 1 to 3 words), 28 to 36 questions in total, answers 50 to 110 words each (about 2,200 words).

Format: one JSON file per page, exactly like the pilot file immigration__sponsor-licences.json in this folder (read it first, it is the model for tone and structure, but yours must be longer). Structure:
{"about": [[tab_name, [blocks...]], ...], "faqs": [[group_name, [[question, answer], ...]], ...]}
A block is a paragraph string, {"h3": "Subheading"} or {"list": ["item", ...]}. Plain text only, no HTML except you may use <a href="/..."> sparingly (no other links).

STRICT copy rules (a validator checks these):
1. No colons, semicolons or em dashes (—) or en dashes used as dashes anywhere in the text. Rewrite naturally. Lists are fine.
2. Never mention a founder or any named person at Leaflegal.
3. No legal advice. Give general information about how things usually work in England and Wales, and say a solicitor (or regulated adviser) will look at the person's own situation. Do not tell the reader what they should do in their case.
4. Immigration content must never advise and must contain NO eligibility rules, requirements, qualifying conditions, routes to qualify, residence periods or tests (IAA 1999 s84 compliance rule set by the owner). Focus instead on what the matter is in plain terms, why people seek help, how working with a regulated adviser usually goes, what the first consultation is like, what to have ready in general terms, how to choose and check an adviser, questions to ask, how fees usually work, timelines in general, what to do if you receive a letter or a deadline, and Leaflegal's role. Use "a regulated adviser" and keep a line that Leaflegal does not give immigration advice.
5. British English. Law of England and Wales (immigration is UK wide).
6. Be accurate. Do not quote specific fees, salary thresholds, stamp duty rates or other figures that change often. Say they change and point to GOV.UK or the firm. Stable facts (e.g. 12 points totting up, 90 year statutory lease extension, 20 week divorce reflection period, 6 week and 1 day final order wait, 6 year limitation for debts) are fine if correct.
7. Do not invent statistics, case results or testimonials. Do not promise outcomes.
8. Write for the client (a member of the public or a business owner), warm and plain, short sentences.
9. Each page must be distinct from the other matters in the same area. Do not copy paragraphs between files.
10. Mention once per page (in Costs or similar) that Leaflegal is free to use and the firm pays for the introduction.

Area files (<area>.json) use the same format and cover the practice area as a whole (overview of the area, which matters it covers, how to choose a firm, costs in general, timescales, what to prepare), same length targets.

Validate every file you write with: python3 /home/claude/leaflegal/tools/deep/check.py <file>
Fix anything it reports until it prints OK. Only write files in /home/claude/leaflegal/tools/deep/. Do not edit any other file and do not run git.

## Law firm (partner) pages
Some files are for the law firm side of the site (/partners/...). Audience is solicitors, conveyancers and immigration advisers who buy exclusive leads. Same JSON format, same copy rules and length targets. Name files partner__<slug>.json where <slug> is the page path after /partners/ with "/" replaced by "--" (for example partner__guides--speed-to-lead.json, partner__conveyancing-leads.json).
Facts about the service must match the existing site copy in /home/claude/leaflegal/tools/legal_partners_content.py, partner_seo_content.py and cfb_legal.py (read them). Key facts: each enquiry goes to one firm only and is never resold, enquiries are pre-screened with paid help confirmed and UK mobile and email verified, consent wording and time are recorded and sent with each lead, leads are delivered by email or CRM as soon as checked, firms choose practice areas, matter types and locations, pay per lead at a price agreed individually (never quote a price), minimum 10 leads a month, can pause, written agreement covering pricing, billing, delivery and invalid lead rules, onboarding starts with a 30-minute call with our team and a sample lead. There is no online platform or login. Never invent conversion rates or statistics. SRA referral rules require firms to tell clients about the referral fee in writing, and referral fees are banned for personal injury and clinical negligence (which Leaflegal does not cover). Never name any person.
In partner files, rule 10 is replaced by: do not say Leaflegal is free for firms.
