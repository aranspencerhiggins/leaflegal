# Brief: Loanleaf combination pages (copy only)

Repo ~/loanleaf-site, branch main. Write ONLY your own output file `tools/combos/<batch>.json`. Do not edit, commit, push or build anything else. No photos needed.

## About Loanleaf (rules every page must follow)
- Loanleaf (one word) is a free UK introduction service. A business fills in one short form and is matched with ONE specialist commercial finance broker.
- Loanleaf is NOT a lender, broker or adviser and gives no advice. Never quote interest rates, approval odds, speed promises or guarantees. Figures in examples are illustrative ("for example, a café borrowing £40,000…") and never promise terms.
- Who it's for: UK limited companies and LLPs, trading 6+ months, annual revenue £50k+, borrowing £5,000 to £2m+. No sole traders, no start-ups.
- Don't say whether brokers are FCA authorised. Say "business loan" / "finance"; avoid the word "funding".
- UK English, curly apostrophes (’). Calm, plain, specific sentences. No hype, no clichés ("unlock", "fuel your growth", "seamless", "tailored solutions", "in today's fast-paced"), no em dashes, no exclamation marks.

## Read first
- `tools/loans_content.py` (the 9 loan types: how each works, eligibility, considerations)
- `tools/needs_content.py` (8 business needs) and `tools/industries_content.py` (8 industries)
Your pages sit UNDER these parent pages, so don't repeat their text. Go narrower: what is specific about THIS loan type for THIS need/industry (or this need in this industry): typical amounts and terms in that situation, what lenders look at for it, worked situations, how the security/repayment structure fits the cash cycle, sector quirks (seasonality, payment terms, retentions, card takings, stock cycles, VAT quarters, equipment lifespans), when it is NOT a good fit and what a broker might suggest instead (link-free mention is fine).

Every page must be genuinely different from its siblings. If two pages in your batch would say the same thing, make the angle different. Google penalises near-duplicate pages, so no swapped-noun templates.

## Output format
`tools/combos/<batch>.json` = a JSON object keyed by page key (given in your task, e.g. "unsecured-business-loans|business-expansion"), each value:
```json
{
  "h1": "Unsecured business loans for business expansion",        // sentence case, ≤ 70 chars
  "title": "Unsecured Business Loans for Business Expansion | Loanleaf",  // title case, ≤ 70 chars incl. suffix (shorten wording if needed)
  "desc": "…",                    // meta description, 120–160 chars
  "lead": "…",                    // one sentence, ≤ 25 words
  "intro": ["…", "…"],            // 2 paragraphs, 70–110 words each
  "uses": [["Short title", "1–2 sentences"], … 4 items],   // concrete situations
  "fit": [["Short title", "2–3 sentences"], … 3 items],    // how this finance fits this case: amounts, terms, security, what lenders check
  "considerations": [["Short title", "2–3 sentences"], … 3 items],  // risks, costs, when it isn't right
  "faqs": [["Question?", "Answer 40–80 words"], … 5 items]           // do NOT include a "How can Loanleaf help?" FAQ; the build adds it
}
```
Write valid JSON (escape quotes; use ’ for apostrophes so you rarely need escaping). When done, validate: `python3 -c "import json;d=json.load(open('tools/combos/<batch>.json'));print(len(d));[print(k,len(v['faqs']),len(v['uses'])) for k,v in d.items()]"` and check the key list exactly matches your task.

Report back only: the file path, the number of pages, and anything you were unsure about (one line each).
