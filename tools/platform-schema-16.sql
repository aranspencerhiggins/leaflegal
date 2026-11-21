-- Team members: extra sign-ins on a broker account, with permissions. Service role only (RLS on, no policies).
create table if not exists public.team_members (
  id bigserial primary key,
  broker uuid not null references public.brokers(id) on delete cascade,
  email text not null,
  name text,
  perms jsonb not null default '{}'::jsonb,
  user_id uuid unique,
  token text unique,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists team_members_live_email on public.team_members (broker, lower(email)) where removed_at is null;
alter table public.team_members enable row level security;
