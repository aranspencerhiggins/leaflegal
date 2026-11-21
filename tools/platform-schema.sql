-- Loanleaf Platform database. Run once in the Supabase SQL editor of the platform project.
create table if not exists public.brokers (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  company text not null,
  contact_name text,
  phone text,
  fca_number text,
  approved boolean not null default false,
  credits integer not null default 0 check (credits >= 0),
  mode text not null default 'manual' check (mode in ('manual','auto')),
  filters jsonb not null default '{}'::jsonb,
  monthly_cap integer not null default 0 check (monthly_cap >= 0),
  notify boolean not null default true,
  deliver_emails text,
  webhook_url text,
  stripe_customer text,
  last_auto_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  amount integer,
  purpose text, timeline text, structure text, turnover text, trading text, credit text,
  debt text, debt_left text, debt_monthly text,
  business text, full_name text, email text, phone text,
  consent jsonb, source jsonb,
  price integer not null check (price > 0),
  buyer uuid references public.brokers on delete set null,
  bought_at timestamptz,
  auto boolean not null default false
);
create index if not exists leads_open on public.leads (created_at desc) where buyer is null;
create index if not exists leads_buyer on public.leads (buyer, bought_at desc);

create table if not exists public.ledger (
  id bigint generated always as identity primary key,
  broker uuid not null references public.brokers on delete cascade,
  created_at timestamptz not null default now(),
  delta integer not null,
  reason text not null,
  lead_id bigint references public.leads on delete set null,
  ref text unique
);
create index if not exists ledger_broker on public.ledger (broker, created_at desc);

-- Only the server (secret key) touches these tables.
alter table public.brokers enable row level security;
alter table public.leads enable row level security;
alter table public.ledger enable row level security;

-- Atomic purchase: the lead must be unsold and the broker approved with enough credits.
create or replace function public.buy_lead(p_lead bigint, p_broker uuid, p_auto boolean default false)
returns boolean language plpgsql set search_path = public as $$
declare v_price int;
begin
  select price into v_price from leads where id = p_lead and buyer is null for update;
  if not found then return false; end if;
  update brokers set credits = credits - v_price,
         last_auto_at = case when p_auto then now() else last_auto_at end
   where id = p_broker and approved and credits >= v_price;
  if not found then return false; end if;
  update leads set buyer = p_broker, bought_at = now(), auto = p_auto where id = p_lead;
  insert into ledger (broker, delta, reason, lead_id)
  values (p_broker, -v_price, case when p_auto then 'Auto-bought lead' else 'Bought lead' end, p_lead);
  return true;
end $$;

-- Idempotent credit top-up: a repeated ref (e.g. a Stripe invoice id) is ignored.
create or replace function public.add_credits(p_broker uuid, p_delta int, p_reason text, p_ref text default null)
returns boolean language plpgsql set search_path = public as $$
declare n int;
begin
  insert into ledger (broker, delta, reason, ref) values (p_broker, p_delta, p_reason, p_ref)
  on conflict (ref) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return false; end if;
  update brokers set credits = credits + p_delta where id = p_broker;
  return true;
end $$;

-- Credits a broker has spent on auto-buys this calendar month (for the monthly cap).
create or replace function public.auto_spend_this_month(p_broker uuid)
returns int language sql stable set search_path = public as $$
  select coalesce(-sum(delta), 0)::int from ledger
  where broker = p_broker and reason = 'Auto-bought lead' and created_at >= date_trunc('month', now());
$$;

revoke execute on function public.buy_lead(bigint, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.add_credits(uuid, int, text, text) from public, anon, authenticated;
revoke execute on function public.auto_spend_this_month(uuid) from public, anon, authenticated;
grant execute on function public.buy_lead(bigint, uuid, boolean) to service_role;
grant execute on function public.add_credits(uuid, int, text, text) to service_role;
grant execute on function public.auto_spend_this_month(uuid) to service_role;
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
-- Loanleaf Platform v4: rate limiting and admin audit log.
create table if not exists public.rate_events (key text not null, at timestamptz not null default now());
create index if not exists rate_events_key on public.rate_events (key, at);
alter table public.rate_events enable row level security;
-- Records a hit for key and returns true if it is within max hits per window.
create or replace function public.hit_rate(p_key text, p_window int, p_max int)
returns boolean language plpgsql set search_path = public as $$
declare n int;
begin
  delete from rate_events where at < now() - interval '1 day';
  select count(*) into n from rate_events where key = p_key and at > now() - make_interval(secs => p_window);
  if n >= p_max then return false; end if;
  insert into rate_events (key) values (p_key);
  return true;
end $$;
revoke execute on function public.hit_rate(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate(text, int, int) to service_role;
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  admin uuid references public.brokers on delete set null,
  action text not null,
  target text,
  detail jsonb
);
alter table public.audit_log enable row level security;
