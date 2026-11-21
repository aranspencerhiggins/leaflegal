-- Loanleaf Platform v2: pipeline stages, notes, refund requests, admin flag, editable pricing.
alter table public.brokers add column if not exists is_admin boolean not null default false;
alter table public.leads add column if not exists stage text not null default 'new' check (stage in ('new','contacted','application','funded','lost'));
alter table public.leads add column if not exists stage_at timestamptz;
alter table public.leads add column if not exists funded_amount integer;
create table if not exists public.lead_notes (
  id bigint generated always as identity primary key,
  lead_id bigint not null references public.leads on delete cascade,
  broker uuid not null references public.brokers on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists lead_notes_lead on public.lead_notes (lead_id, created_at);
create table if not exists public.returns (
  id bigint generated always as identity primary key,
  lead_id bigint not null unique references public.leads on delete cascade,
  broker uuid not null references public.brokers on delete cascade,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create table if not exists public.settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
alter table public.lead_notes enable row level security;
alter table public.returns enable row level security;
alter table public.settings enable row level security;
update public.brokers set is_admin = true where email = 'aran+broker@verticalbrands.co';
