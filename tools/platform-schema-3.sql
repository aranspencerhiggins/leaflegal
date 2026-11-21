-- Loanleaf Platform v3: onboarding details, first-month trial flag, signed partner agreements.
alter table public.brokers add column if not exists company_number text;
alter table public.brokers add column if not exists address text;
alter table public.brokers add column if not exists signer_title text;
alter table public.brokers add column if not exists trial_used boolean not null default false;
alter table public.brokers add column if not exists onboarded_at timestamptz;
create table if not exists public.agreements (
  id bigint generated always as identity primary key,
  broker uuid not null references public.brokers on delete cascade,
  version text not null,
  terms_hash text not null,
  company text not null,
  company_number text,
  address text,
  signer_name text not null,
  signer_title text not null,
  signer_email text not null,
  ip text,
  user_agent text,
  signature text not null,
  created_at timestamptz not null default now()
);
create index if not exists agreements_broker on public.agreements (broker, created_at desc);
alter table public.agreements enable row level security;
