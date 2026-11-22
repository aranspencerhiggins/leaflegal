# Leaflegal law firm platform: conversion spec

The repo already contains the LoanLeaf broker platform (business finance leads). This spec turns it into the Leaflegal
platform for law firms: firms sign up, see legal enquiries ("opportunities"), filter them, buy them with credits, set
auto-buy rules, and work them on My leads. Everything LoanLeaf's platform does stays (accounts, team members, onboarding,
Stripe plans and billing, refunds, public profile, notifications, webhooks, HubSpot and Pipedrive, admin, finance,
invites, CRM, activity log). What changes is the lead model, matching, pricing, firm onboarding, copy and hosting.

Shared lists live in `api/_lib/taxonomy.js` (areas, matter slugs, regulators, regions, urgency, grades, stages).
Import it on the server; the front end gets it from `GET /api/platform?action=taxonomy` (public, cached 5 min).

## Hosting

- The SPA is served at **leaflegal.co/platform/...** (no subdomain yet). `vercel.json`: drop the `/platform` redirects and
  rewrite `/platform` and `/platform/:path*` to `/platform/index.html`. The SPA already handles the `/platform` prefix (`P`).
- `PLATFORM_URL` default `https://leaflegal.co/platform`. Signed links (`signedUrl`) go to `https://leaflegal.co/api/platform?...`
  (use a `SITE_URL` const, default `https://leaflegal.co`). No `platform.leaflegal.co` or `platform.loanleaf.co` anywhere.
- Supabase is a **new, separate project** "Leaflegal" (ref `qrdpvsqsfifmgkxinank`, eu-west-1), URL
  `https://qrdpvsqsfifmgkxinank.supabase.co`, publishable key `sb_publishable_vZL7kU5KjOGWKSfcAAsnbg_9p9BBTUM` (public, fine
  as a default). Never use the LoanLeaf URL (`tefpljuzuvdchczcfjlz`) or its key anywhere, including the CSP in vercel.json.
  Server: `SUPABASE_URL` and `SUPABASE_SECRET_KEY` env vars. Front end: gets `supabaseUrl` and `supabaseKey` (publishable)
  from `GET /api/platform?action=config` (env `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`).
- Fresh database: one consolidated schema file `tools/platform-schema-legal.sql` replaces the 22 incremental LoanLeaf files.

## Words

Customer-facing and firm-facing copy: "firm" or "law firm" (never broker, lender, loan, finance, funded, business finance),
"enquiry" or "lead", "client" for the person who enquired, "instructed" for won. No colons or semicolons in UI copy or
email copy sentences (labels in a two-column table are fine without colons), no em dashes. Firm-facing labels don't use
you/your/my/me in labels and headings ("Firm name", "Practice areas"). Never mention the founder by name.
Brand: Leaflegal, a trading name of Vertical Brands Ltd. Not a law firm, gives no legal advice, not SRA regulated.

## Lead (table `leads`)

Written by `storeLead(lead)` in `api/_lib/leads.js`, called from `api/enquiry.js` (owned by the forms thread).
Input shape (from `api/_lib/lead-schema.js` on the forms branch, normalised):

```
{ area, areaLabel, matter, matterLabel, audience: 'individual'|'business',
  urgency: 'urgent'|'month'|'months'|'research' (or the four labels), deadline?: 'YYYY-MM-DD',
  postcode, postcodeArea ('SW'), region ('London'), country ('england'|'wales'|'scotland'|'ni'|'outside'),
  value: { band, min, max } | null, valueLabel?,
  privatePay: 'yes'|'quote'|null, business: { name, number } | null,
  answers: [{ id, q, a }], tags: [string], quality: { score 0-100, grade 'A'|'B'|'C' },
  summary, contact: { fullName, firstName, lastName, email, phone, phoneVerified, emailVerified },
  consent: { terms, share, version, at, text }, source: { page, referrer, utm, first }, createdAt,
  checks: { phone, email } (raw Bird results or null), flags: [string], formVersion? }
```

Columns:

| column | type | notes |
|---|---|---|
| id | bigint identity | |
| created_at | timestamptz | |
| area, matter | text | slugs (`toAreaSlug`), matter slug or `other` |
| area_label, matter_label | text | as shown to the person |
| audience | text | individual / business |
| urgency | text | one of `URGENCY` labels (`toUrgency`) |
| deadline | date null | court date, visa expiry, hearing |
| postcode | text | full, only after purchase |
| postcode_district | text | outward code e.g. SW1A, shown before purchase |
| postcode_area | text | letters only e.g. SW |
| region, country | text | |
| value_band, value_label | text null | e.g. "£250k to £500k", "Property price" |
| value_min, value_max | int null | pounds |
| private_pay | text null | yes / quote |
| business_name, company_number | text null | only after purchase |
| company | jsonb null | Companies House record if looked up (business leads), same shape LoanLeaf used |
| answers | jsonb | `[{id,q,a}]`, max 40, each a ≤300 chars |
| tags | text[] | |
| score, grade | int, text | from the form's quality |
| summary | text null | free text, **only after purchase** (could identify the person) |
| full_name, email, phone | text | email lower-case, only after purchase |
| checks, flags | jsonb, text[] | flagged leads are stored with `hidden_at = now()` and never sold or auto-bought |
| consent, source | jsonb | |
| form_version | text null | |
| price, list_price, price_fixed | int, int, bool | credits (1 credit = £1 + VAT) |
| buyer, bought_at, auto | uuid, timestamptz, bool | |
| stage, stage_at | text, timestamptz | `STAGES` = new, contacted, consultation, instructed, lost |
| instructed_value | int null | fee value the firm records when instructed (replaces funded_amount) |
| archived_at, hidden_at | timestamptz | |
| exclude_brokers | uuid[] | firms that bought this person before |

Removed from LoanLeaf: amount, purpose, timeline, structure, turnover, trading, property, credit, debt*, tier, tier_price,
auto_tier, funded_amount. Remove tier pricing (`pricing = 'tier'`, TIER_NAMES, tierPlan), tenant criteria, budget tiers
(`filters.tiers`), the starter-broker rule (STARTER_BROKER, isStarter), OPT_IN values, revenue-based rules and anything Meta
revenue-tier related. Keep: the 7 day repeat rule (`duplicateOf`, `followUp`, `rematchLead`, `exclude_brokers`), the 72 hour
50% discount on unsold leads (for all leads), masked contact, live-check badges, doubtful leads never auto-bought,
fair rotation (`last_auto_at`), monthly cap, daily leads / credits caps, maxPrice, invite alerts, missed-lead summaries.

Before purchase a firm sees (`withMask`): id, created_at, area, area_label, matter, matter_label, audience, urgency, deadline,
postcode_district, region, country, value_band, value_label, value_min, value_max, private_pay, answers, tags, grade, score,
has_summary (bool), price/list_price/discounted/discount_at, `contact` masked (name initial, email, phone, phoneLive,
emailVerified), `companies_house` preview for business leads. Not: name, email, phone, full postcode, business name,
company number, summary.

After purchase (`FULL`): all of the above plus full_name, email, phone, postcode, business_name, company_number, summary,
stage, stage_at, instructed_value, bought_at, auto, archived_at.

`leadOut` (webhooks, HubSpot, Pipedrive, CSV export): id, received_at, purchased_at, auto_bought, price_credits,
practice_area, practice_area_label, matter, matter_label, audience, urgency, deadline, contact_name, email, phone, postcode,
region, business_name, company_number, value_band, value_label, private_pay, grade, quality_score, tags, summary,
answers, consent {version, at, text}, stage, stage_at, instructed_value, archived_at. Webhook headers `X-Leaflegal-*`,
User-Agent `Leaflegal-Platform`, event `lead.purchased`.

## Firm criteria (`brokers.filters` jsonb)

```
{ areas: [slug],                       // required to auto-buy, empty = no leads
  matters: { [area]: [matterSlug] },    // missing or empty list for an area = every matter in it
  regions: [region],                    // empty = anywhere the area allows
  postcodeAreas: [ 'SW', 'M' ],         // optional extra narrowing, empty = any
  audiences: ['individual'|'business'], // empty = both
  urgencies: [label],                   // empty = any
  grades: ['A','B','C'],                // empty = any
  privatePayOnly: bool,                 // true = skip 'quote' leads
  valueMin, valueMax,                   // pounds, only applied to leads that have a value
  tagsAny: [tag], tagsNone: [tag],
  maxPrice, dailyLeads, dailyCredits, suggest: 'instant'|'daily'|'off', digestAt }
```

`missGroups(f, l)` returns `{k, v, label, why}` items like LoanLeaf (so the "Missed leads" UI and the "allow this" undo
buttons keep working): k is one of `areas`, `matters`, `regions`, `postcodeAreas`, `audiences`, `urgencies`, `grades`,
`privatePayOnly`, `valueMin`, `valueMax`, `tagsAny`, `tagsNone`; v the value to allow (for `matters` v = `area/matter`).
Also a hard rule, not a filter: a firm only matches areas its regulators allow (`allowedAreas`), so immigration leads
never go to a firm without SRA, CILEx or IAA authorisation.

## Firm account (`brokers` table, name kept internally)

Replace `fca_number` with `regulators jsonb` = `[{ id: 'SRA'|'CILEX'|'CLC'|'IAA', number }]` (at least one) and
`regulator_checked_at timestamptz` (admin ticks it after checking the register). Keep company (firm name), company_number
(optional), address, contact_name, signer_title, phone. Onboarding steps: Account, Firm (name, regulators and numbers,
address, contact, position, phone), Leads (practice areas, matters, regions, auto or manual), Public profile, Plan,
Agreement, Payment. Admin client drawer shows regulators with register links:
SRA `https://www.sra.org.uk/consumers/register/`, CILEx `https://cilexregulation.org.uk/`, CLC `https://www.clc-uk.org/`,
IAA `https://www.gov.uk/find-an-immigration-adviser`.

## Pricing (credits, `settings.pricing`)

```
DEFAULT_PRICING = { min: 15, max: 400,
  areas: { conveyancing: 35, immigration: 60, 'family-law': 55, 'debt-recovery': 45, 'motoring-offences': 50, licensing: 55, 'lease-extensions': 60 },
  matters: { 'immigration/sponsor-licences': 120, 'family-law/financial-settlements': 75, 'motoring-offences/drink-driving': 70,
             'motoring-offences/dangerous-driving': 80, 'licensing/premises-licence-applications': 70, 'lease-extensions/collective-enfranchisement': 110 },
  grade: { A: 1.3, B: 1, C: 0.7 }, urgent: 1.15, business: 1.1,
  value: [[1000000, 1.4], [500000, 1.25], [250000, 1.1]] }   // value_min at or above → multiplier, first match
price = clamp(round5(base × grade × (urgency 'Urgently' ? urgent : 1) × (business ? business : 1) × valueMult), min, max)
base = matters['area/matter'] ?? areas[area] ?? 50
```

`GET action=pricing` returns `{ pricing }`; the front end mirrors `price()` for the Credits page examples and calculator.
Admin → Pricing edits base per area, matter overrides and the multipliers. Plans (Starter, Growth, Custom, first-month
offer, invoiced plans) stay as they are.

## Refunds

Within 72 hours of purchase, reasons: phone not in service, phone belongs to someone else, email bounces, and (admin
reviewed) "Outside the practice area or region stated" and "Duplicate of a lead already bought".

## Partner agreement (`api/_lib/terms.js`)

Rewrite as a Law Firm Referral Agreement, new TERMS_VERSION. Must cover: Leaflegal is an introducer, not a law firm, no
legal advice; the firm must be and stay authorised by its stated regulator and tell Leaflegal at once if not; the firm
pays a fee for introductions and must comply with SRA Code of Conduct referral rules (tell the client in writing about
the referral arrangement and the fee before or when taking instructions, keep independence, act in the client's best
interests); no LASPO s56 banned work (personal injury, clinical negligence) is supplied or may be used to seek referral
fees; immigration leads only for SRA, CILEx or IAA regulated advisers; the firm decides whether to accept a matter, sets
its own fees and is responsible for its advice, client care letters and complaints (Legal Ombudsman); data protection:
each party an independent controller once delivered, special category and criminal offence data handled securely, used
only for the enquiry, no resale; exclusivity, credits, plans, refunds, liability, term and termination as now.
Placeholder company number and address as in the current file. Mark it as needing solicitor review.

## Emails

Same templates, legal wording. New-lead alert subject `New lead: {matter label}, {region} ({n} credits)`. Delivery email
subject `New lead: {full name}, {matter label}`. Matched email to the client: `You've been matched with {firm}`, saying
the firm will contact them, will explain fees before they agree to anything, and that Leaflegal receives a fee from the
firm. Never put matter details or answers in the client email or any email to an address that isn't the firm's.
Delivery email tips: call quickly, check for conflicts before discussing the matter, send the referral fee disclosure
in writing, update the stage.

## Out of scope for now

Resend, Bird, Stripe and Google keys are set later by the owner. Code must fail soft when keys are missing (as now).

## Server API notes

All actions go to `/api/platform?action=…`. Only changed or new shapes are listed here.

Public
- `config` (GET) returns `{turnstile, supabaseUrl, supabaseKey}`.
- `taxonomy` (GET, cached 300s) returns `taxonomy()` from `api/_lib/taxonomy.js`.
- `pricing` (GET) returns `{pricing}`, the merged pricing settings.

Firm
- `me` returns `pub.allowedAreas` (the areas the firm's regulators allow), `pricing` (with `avgLead`), `taxonomy`, and `options` as `{returnReasons, cancelReasons, returnHours}`. Tiers are gone.
- `opportunities` lists only leads in the firm's allowed areas. Each has `match` (true when it meets the saved criteria).
- `dashboard` totals are `{leads, instructed, instructed_value}`.
- `stage` body `{id, stage, instructed_value?}` (`funded_amount` still accepted) returns `{ok, stage, instructed_value}`.
- `buy` returns 403 when the lead is outside the firm's allowed areas.
- `settings` filters are `{areas, matters, regions, postcodeAreas, audiences, urgencies, grades, privatePayOnly, valueMin, valueMax, tagsAny, tagsNone, dailyLeads, dailyCredits, maxPrice, suggest, digestAt, missed, missedAt}`. Areas are limited to the allowed areas.
- `signup` and `onboard` take `regulators: [{id, number}]` (ids SRA, CILEX, CLC, IAA). `onboard` body is `{company, company_number, regulators, address, contact_name, signer_title, phone}` and returns 400 with no valid regulator. A change clears `regulator_checked_at`.
- Refund reasons are phone not in service, phone belongs to someone else, email bounces (ok), outside the practice area or region stated, duplicate of a lead already bought, something else (review), plus two not refundable. Decline keys are `valid, interest, brief, scope, duplicate, attempts, late` (`figures` removed).
- Lead delivery (`leadOut`, webhooks, CRMs) carries area, matter, labels, audience, urgency, location, value, private pay, grade, score, answers, summary, contact and business details. The test webhook sends a legal sample with `test: true`.

Admin
- `admin` returns `defaults`, `taxonomy` and `examples` (each with `price` and `parts`). Brokers include `regulators` and `regulator_checked_at`. Tier and turnover lists are gone.
- `admin-client` broker has `regulators: [{id, number, label, register}]`, `regulator_checked_at` and `allowed_areas`.
- `admin-regulator-check` (POST `{broker, checked}`) returns `{ok, regulator_checked_at}`. `checked: false` clears it.
- `admin-update` accepts `regulators: [{id, number}]` and clears the register check.
- `admin-lead` (GET) returns `brokers[].can_take`, `taxonomy`, `pricing`, `list_price_now` and `discount_at`.
- `admin-lead` (POST) op `reprice` returns `{ok, price}`. Op `relist` takes `area, matter, urgency, grade` and `price` ('full', 'half', 'recalc' or a number), and resets `instructed_value` when the lead had a buyer. Op `assign` refuses a firm whose regulators don't allow the lead's area.
- `admin-pricing` (POST `{min, max, urgent, business, areas{slug: n}, matters{'area/matter': n}, grade{A, B, C}, value[[minPounds, mult]], reprice?}`) returns `{ok, pricing, examples, repriced?}` where `repriced` is a count.
- `admin-reprice` (POST `{all?}`) returns `{ok, repriced, checked}`. Hand-priced leads are kept unless `all` is true.
- Removed: `admin-tier-prices`, and the pricing switch on `admin-broker`.

Enquiry intake
- `storeLead(lead)` in `api/_lib/leads.js` always returns an object. A sale returns `{id, matched: true, firm, price, buyer}`. No sale returns `{id, matched: false, price, buyer: null, alerted, invited}`. A flagged lead returns `{id, matched: false, hidden: true}`. A repeat within 7 days returns `{id, matched, firm?, duplicateOf, again, rematch}`.
