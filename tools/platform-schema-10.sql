-- Loanleaf Platform: bulk invites + lead export (migration "invite_digest_batch_export", 2026-11-10).
-- digest: invited firm gets one weekly round-up of new leads instead of an email per lead (used for bulk CSV uploads).
-- batch: the CSV upload an invite came from, so a whole upload can be deleted. leads_exported_at: "export since last export".
alter table public.invites add column if not exists digest boolean not null default false;
alter table public.invites add column if not exists batch text;
create index if not exists invites_batch on public.invites (batch);
alter table public.brokers add column if not exists leads_exported_at timestamptz;
