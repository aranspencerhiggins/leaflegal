> Live templates (Bird, WABA 1125294846930531, number +447893986207): `loanleaf_matched_v2` (no WhatsApp line) and
> `loanleaf_matched_wa` (adds "WhatsApp: {{whatsapp}}", used when the broker's profile shows one). Both add
> "for {{business}}" after "with Loanleaf". The original `loanleaf_matched` below is superseded.

# WhatsApp template: loanleaf_matched

Create in Bird (WhatsApp → Templates) on Loanleaf's own WhatsApp Business Account, then submit for Meta review.

- Slug: `loanleaf_matched`
- Category: **Utility** (it's about the enquiry they just sent)
- Language: English (`en`)
- Variables (named): first_name, broker, contact, amount, phone, email

**Body**

Hi {{first_name}}, thanks for your business finance enquiry with Loanleaf ✅

We've matched you with *{{broker}}*, one of our recommended brokers. {{contact}} will be in touch shortly about your {{amount}} request.

📞 {{phone}}
✉️ {{email}}

Save their number so you know it's them when they call. There's no obligation to go ahead.

**Footer**: Loanleaf · loanleaf.co

**Sample values for Meta's review**: Sam · Aureum Finance · Daniel McCaffrey · £150,000 · 0161 496 0000 · daniel@aureumfinance.co.uk

Once approved, add the sending number to Vercel as `BIRD_WA_FROM` (E.164, e.g. +4420…). Texts go out from `BIRD_SMS_FROM` when WhatsApp isn't possible.
