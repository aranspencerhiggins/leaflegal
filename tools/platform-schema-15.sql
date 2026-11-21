-- Homeowner or tenant, asked before the CCJ question.
alter table public.leads add column if not exists property text;
-- HubSpot form delivery: { portal, form, on }.
alter table public.brokers add column if not exists hubspot jsonb;
-- Budget tiers: which of the broker's tiers an auto-bought lead counted against (index into filters.tiers).
alter table public.leads add column if not exists auto_tier smallint;
-- Webhook signing secret (HMAC-SHA256, X-Loanleaf-Signature).
alter table public.brokers add column if not exists webhook_secret text;
