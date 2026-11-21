-- Loanleaf Platform: commission clients (migration "commission_entries", 2026-11-10).
-- Admin-only log of commission a client pays Loanleaf and the ad spend behind their leads. Read/written by the API (service role) only.
create table if not exists public.commission_entries (
  id bigint generated always as identity primary key,
  broker uuid not null references public.brokers on delete cascade,
  kind text not null check (kind in ('commission', 'spend')),
  amount numeric(12,2) not null check (amount > 0),
  date date not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists commission_entries_broker on public.commission_entries (broker, date);
alter table public.commission_entries enable row level security;
