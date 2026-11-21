-- Loanleaf Platform: email suppression list (migration "email_suppressions", 2026-11-11).
-- Anyone who unsubscribes (invite or CRM email) is never emailed again by the platform or CRM, unless they register an account.
create table if not exists public.email_suppressions (
  email text primary key,
  reason text,
  source text,
  created_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
