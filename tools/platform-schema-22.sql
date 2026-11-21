-- Direct Pipedrive delivery: { token, on } set in Auto-buy → Delivery. Each bought lead becomes an org, person, deal and note.
alter table public.brokers add column if not exists pipedrive jsonb;
