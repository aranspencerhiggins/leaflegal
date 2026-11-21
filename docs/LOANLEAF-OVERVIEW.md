# Loanleaf: business, platform and infrastructure overview

*Last updated 8 November 2026. Keys and passwords are deliberately not in this file; only their names.*

## 1. What Loanleaf is

Loanleaf (one word) is a trading name of **Vertical Brands Ltd**. It is a **free introduction service** for UK businesses that need finance.

- **Customers:** UK **limited companies and LLPs** fill in a short enquiry at loanleaf.co.
- **Brokers:** Loanleaf sells each enquiry as an **exclusive lead** to **one** specialist commercial finance broker, through its own platform at platform.loanleaf.co.
- **What Loanleaf is not:** a lender, a broker or an adviser. It is **not FCA-authorised**.
- **Who pays:** brokers pay. Businesses never do.
- **Second line:** a law-firm leads offer exists at /partners/legal, covering immigration, family, wills and probate, employment, motoring, inheritance disputes, landlord and possession, and business disputes. Personal injury, housing disrepair and mis-selling are excluded on purpose. There is no consumer funnel for legal leads yet.

**Contacts**
- Owner: Aran Spencer-Higgins (aran@verticalbrands.co).
- Public email: hello@loanleaf.co, which is also the sender address for all emails.
- Live chat: Chatra, on the platform and the partner pages only.

## 2. How it works, end to end

1. **Enquiry:** a business owner completes the enquiry form on loanleaf.co (on the homepage, or at /apply).
2. **Checks:**
   - **Phone and email:** the mobile is checked as live and the mailbox as real (Bird Lookup).
   - **Email domain:** checked for typos and for mail servers (MX).
   - **Company:** looked up on Companies House.
   - **Repeats:** the same phone or email within 7 days goes back to the broker who bought it, at no extra cost; after that, a broker never gets the same business again and never pays twice.
3. **Lead created:** the lead goes onto the broker platform with a **price in credits**.
4. **Auto-buy:** brokers on auto-buy whose criteria match get it automatically, in fair rotation (whoever auto-bought longest ago goes first). A lead whose phone or email check failed is **never** auto-bought.
5. **Manual buyers:** if no one auto-buys it, matching manual brokers get a "new lead" email and can buy it on **Opportunities**.
6. **Delivery:** the buyer gets full contact details by email, on the platform and by CRM webhook (manual buys too).
7. **Customer told:** the business gets a "you've been matched" email showing the broker's public profile (logo, contact buttons).
8. **Discount:** unsold leads drop to **50% off after 72 hours**.

## 3. Customer enquiry form (/apply and the homepage)

**Steps:**
1. Amount (£5k to £2m+)
2. Purpose
3. Timeline
4. Structure
5. Annual revenue
6. Company name (must be the registered name; checks the Ltd or LLP suffix)
7. Trading time
8. Missed payments, defaults or CCJs in the last 6 years
9. Existing finance (if yes: amount left to repay, and monthly repayments)
10. Full name, email, UK mobile

**Who is turned away:** sole traders, general partnerships, businesses not trading yet, revenue under £50k, and trading under 6 months. They see "Sorry, we can't help with this one".

**Consent:** one required tickbox: "I agree to the Terms and Privacy Policy. Loanleaf will share my details with a broker who may contact me about my enquiry." The consent version (currently 2026-11-08) and timestamp are stored with each enquiry.

**Copy rules for this form:**
- Use "business loan", never "funding".
- No helper subtitles under questions.
- No eyebrow or kicker labels.
- Customer-facing copy must not state whether brokers are FCA authorised.

## 4. Broker platform (platform.loanleaf.co)

### Getting brokers on board
- **Partner page** (/partners): a long SEO page with tabs and FAQs. "Apply now" leads to /partners/apply.
- **/partners/apply** starts with a choice:
  - **Book a call:** the calendar comes first, with 30-minute Google Meet calls on weekday afternoons, 12pm to 5pm UK time. The broker then gives their details (below). The booking goes straight into the team's Google Calendar with an invite.
  - **Send an enquiry:** the details only.
  - **Details asked:** full name, company name, work email, phone, leads per month on average, and monthly budget for leads.
- **Self-serve signup:** brokers can sign up directly at **platform.loanleaf.co/register**. The partner form passes its answers over in an encrypted link so they're filled in already.
- **Invites from admin:** the invite email can be **scheduled**. Invited firms are approved automatically. 14 broker invites are queued for **8:00am on Monday 9 November 2026**.

### Onboarding steps
1. Account
2. Company (company name, FCA ref, registered address, full name, position, phone)
3. Leads (auto or manual mode, plus criteria)
4. Public profile
5. Plan
6. Partner agreement (click to accept; a PDF copy is emailed)
7. Payment (Stripe, embedded on the page)

Brokers can't buy until they're approved, have signed the agreement and have credits.

### Main areas for brokers
- **Dashboard**
- **Opportunities:** masked contact details before purchase, Companies House summary, quality score, filters.
- **My leads:** pipeline stages New, Contacted, Application, Funded, Lost, plus notes.
- **Auto-buy:** criteria and limits per day, per month and per lead, plus delivery by email and up to 5 CRM webhooks.
- **Public profile**
- **Billing**
- **Account**

**Copy rule:** broker labels and headings don't use you, your, my or me ("Full name", "Company name", "Position").

### Refunds
Brokers can request a refund within 72 hours, **only for invalid contact details**:
- the phone number is not in service;
- the phone number belongs to someone else;
- the email address bounces or doesn't exist.

### Admin (admin users only)
- **Finance:** revenue (Stripe plus manually invoiced amounts), VAT, Stripe fees, Meta ad spend, profit, cost per lead, "profit if every lead sold", and profit by client.
- **Clients:**
  - approve brokers;
  - edit every detail, including the login email;
  - add or remove credits, with an optional invoiced amount;
  - set up **invoiced monthly plans**;
  - **suspend** or lift a suspension;
  - **delete** (only for brokers who never bought a lead);
  - cancel a Stripe subscription;
  - view and download the agreement.
- **Refunds, All leads** (view, reprice, assign, delete), **Pricing** (formula weights), **Activity log**.

## 5. Pricing

### Lead prices
- **1 credit = £1.** Each lead costs **20 to 300 credits**. This went up from 15 on 8 November 2026, and the 15 unsold leads were repriced.
- **Formula:** price = 20 + 230 × (size × affordability × age × revenue × credit), rounded to 5.
  - **Size:** bigger loans are worth more, on a log scale.
  - **Affordability:** asks far above the business's revenue are worth little.
  - **Age and revenue:** weights by time trading and turnover band.
  - **Credit:** ×0.75 if there are adverse marks, ×0.9 if "not sure".
- **Examples:**

| Lead | Price |
|---|---|
| £15k, £250k–£500k revenue, 5+ years | 40 |
| £25k, £100k–£250k revenue, 1–2 years | 40 |
| £100k, £250k–£500k revenue, 2–5 years | 105 |
| £250k, £1m–£5m revenue, 5+ years | 165 |
| £1m, £1m–£5m revenue, 2–5 years | 230 |
| £5m ask, 6–12 months trading, £100k–£250k revenue | 20 |

- **Discount:** unsold after 72 hours, a lead is 50% off.
- **Editing:** weights can be changed in Admin → Pricing.
- **Agreement:** the partner agreement says prices can change without notice.

### Broker plans (subscription only, prices exclude VAT at 20%)

| Plan | Price a month | Credits a month |
|---|---|---|
| First-month offer (new partners) | £1,000 | 1,000, then moves to Starter |
| Starter | £2,500 | 2,500 |
| Growth | £5,000 | 5,000 |
| Custom | £6,000 to £250,000 in £1,000 steps | 1 credit per £1, up to 20,000 credits a month online |
| Invoiced plan (set up by admin) | any | any; credits added automatically each month |

- **How plans behave:**
  - Unused credits roll over while the subscription is active.
  - Upgrades are charged and applied straight away. Downgrades apply at renewal.
  - Promo codes work through Stripe promotion codes.
- **Larger custom plans:** above 20,000 credits a month, the broker sends a request and the plan is agreed with the team (see North Bridge in section 9).
- **Low credits:** a warning email goes out once, when a balance drops below 100 credits.

## 6. Infrastructure

| Part | Detail |
|---|---|
| Code | Private GitHub repo **aranspencerhiggins/loanleaf-site** (branch `main`), working copy in `~/loanleaf-site`. |
| Hosting | Vercel, team **vertical-brands**, project **loanleaf-site**. Functions run in **dub1 (Dublin)**, next to the database. |
| Domains | **loanleaf.co** (www redirects to it) and **platform.loanleaf.co**. DNS is at **GoDaddy** with Google Workspace email; don't move the nameservers. |
| Website build | Static HTML generated by Python scripts. Full rebuild: `./tools/build_all.sh` (legal pages, then pages, then clean-up, then tests). Content lives in `tools/*_content.py` and `tools/build_pages.py`. |
| Platform front end | `public/platform/index.html` + `public/assets/platform.js` / `platform.css`. A single-page app served at the root of platform.loanleaf.co (`/dashboard`, `/register`, `/signin`…) by `middleware.js`. Old `/platform/...` links redirect to the clean addresses. |
| Server code | Vercel functions in `api/`: `enquiry.js` (business enquiries), `platform.js` (the whole broker platform and Stripe webhook), `partner.js` (partner applications and call booking), `contact.js`, `company.js`, `track.js` (Meta events). Shared code in `api/_lib/`. |
| Database | **Supabase** project `tefpljuzuvdchczcfjlz` (West EU, Ireland), owned by aran@verticalbrands.co. Tables: brokers, leads, ledger, agreements, returns, lead_notes, invites, settings, audit_log, rate_events. Row-level security is on and only the server can read or write. Credits move through SQL functions (`buy_lead`, `add_credits`), so purchases are atomic and grants happen once. |
| Payments | **Stripe** (live), account "Loanleaf - Vertical Brands". Embedded checkout, subscriptions, customer portal, and a webhook at `/api/platform?action=stripe`. |
| Email | **Resend**, sending from hello@loanleaf.co, in branded templates (no rounded corners). |
| Calendar | **Google Calendar** API (OAuth) for partner call booking: free/busy check, event with a Meet link, invite to the broker. |
| Contact checks | **Bird Lookup** (phone live, mailbox exists) and **Companies House** API. |
| Tracking | **Meta Pixel** 658905286613269 (only after marketing-cookie consent) and the **Meta Conversions API** (server-side, every enquiry). Funnel events: ViewContent, FormStart, FormStep, Lead, SubmitApplication, Schedule. Meta ad spend is pulled into Finance. |
| Scheduled job | Daily at 7am UTC: adds monthly credits for invoiced plans (`/api/platform?action=cron-plans`). |
| Security | CSP and HSTS headers, per-IP rate limits, signed links, SSRF-safe webhooks, honeypots, admin audit log. Cloudflare Turnstile is built in but **off** (keys not set). |
| Tests | `node tools/test_flows.mjs` (62 end-to-end checks with every outside service faked) and `node tools/test_platform.mjs` (pricing and matching). Run before every deploy. |
| Deploy | **Push to `main` on GitHub** (private repo `aranspencerhiggins/loanleaf-site`) and Vercel deploys production automatically. Other branches get preview deployments. Run the tests first. |

**Environment variables set in Vercel (names only):**
SUPABASE_SECRET_KEY, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, ENQUIRY_FROM, META_CAPI_TOKEN, META_ADS_TOKEN, BIRD_API_KEY, COMPANIESHOUSE_API, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN.

**Not set yet:** TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY (bot checks).

**Optional:** ENQUIRY_TO (defaults to aran@verticalbrands.co), GOOGLE_CALENDAR_ID, META_PIXEL_ID, META_AD_ACCOUNT, PLATFORM_URL.

## 7. Website pages

- **Home:** form in the hero.
- **Customer pages:** /apply, /business-loans (hub plus 9 loan types), /business-loan-calculator, /guides (6), /blog (10), /how-it-works, /how-we-make-money, /about, /contact, /press, /complaints, /accessibility.
- **Legal pages:** privacy policy, terms of service, cookie policy.
- **Broker pages:** /partners (plus SEO pages for asset finance, bridging, business loan, commercial finance, commercial mortgage and MCA leads), /partners/apply, /partners/legal, /partners/legal/apply.
- **Sitewide:** two-tier header (Businesses / Partners), full footer disclaimer, and a cookie banner (Accept all and Reject all with equal weight).

## 8. Legal and compliance position

- **Status:** introducer only, not FCA-authorised, and Loanleaf may be paid by brokers. All of this is stated in the footer, the terms and the privacy policy.
- **Data retention:** 24 months for enquiries, 6 years for consent records.
- **Meta Conversions API:** runs for every enquiry. The privacy policy keeps a neutral line that limited, hashed data goes to Meta. The site must not say this happens regardless of cookie choice.
- **Partner Agreement:** current version **2026-11-08**. It is accepted online, and a signed copy is stored and emailed. A solicitor review is recommended.
- **ICO:** Aran is registered; the registration number still needs adding to the footer and privacy policy.

## 9. Current state (8 November 2026)

- **Brokers:** 3 accounts, 2 approved.
- **Leads:** 15 on the platform, none sold yet.
- **Invites:** 14 scheduled for Monday 8am.
- **North Bridge:** North Bridge Finance (Roger Willis) asked for a custom plan of about £44k a month. Not set up yet.

**Open to-dos**
- **Turnstile:** add the keys to switch bot checks on.
- **Supabase:** review the Auth settings (public sign-ups).
- **North Bridge:** set up their plan, probably as an invoiced plan.
- **Leads #14 and #17:** delete them (Aran to run).
- **Payments:** test a real payment and refund end to end.
- **Promo codes:** tag them.
- **Email:** set the sender avatar for emails.
- **Logos:** test a real broker logo upload on production.
- **ICO:** add the registration number.
- **Legal:** solicitor review of the Partner Agreement and terms.
