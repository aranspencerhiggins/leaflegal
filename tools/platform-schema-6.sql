-- Applied 2026-11-06: Bird live checks stored on each lead (phone reachable, email verdict).
alter table public.leads add column if not exists checks jsonb;
-- Applied 2026-11-06: Companies House details picked on the enquiry form.
alter table public.leads add column if not exists company jsonb;
