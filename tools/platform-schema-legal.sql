-- Leaflegal Platform database: one consolidated schema for a FRESH Supabase project (Leaflegal, ref qrdpvsqsfifmgkxinank).
-- Replaces the 22 incremental LoanLeaf files (platform-schema.sql, platform-schema-2..22.sql), which stay in the repo for history.
-- Safe to re-run: tables, columns and indexes use "if not exists", functions use "create or replace".
-- Only the server touches the data (SUPABASE_SECRET_KEY, service_role). RLS is on for every table with no policies, so the
-- publishable key (used by the browser for Supabase Auth only) can read or write nothing.
-- "brokers" is the firm account table. The name is kept internally so the API code didn't need a rename.

-- ---------------------------------------------------------------- firms
create table if not exists public.brokers (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  company text not null,                                   -- firm name
  contact_name text,
  phone text,
  regulators jsonb not null default '[]'::jsonb,           -- [{ id: 'SRA'|'CILEX'|'CLC'|'IAA', number }]
  regulator_checked_at timestamptz,                        -- admin ticked it after checking the register
  company_number text,
  address text,
  signer_title text,
  approved boolean not null default false,
  suspended_at timestamptz,
  suspend_reason text,
  is_admin boolean not null default false,
  credits integer not null default 0 check (credits >= 0),
  mode text not null default 'manual' check (mode in ('manual', 'auto')),
  filters jsonb not null default '{}'::jsonb,              -- lead criteria, see docs/PLATFORM-LEGAL-SPEC.md
  monthly_cap integer not null default 0 check (monthly_cap >= 0),
  last_auto_at timestamptz,                                -- fair rotation between auto-buy firms
  notify boolean not null default true,
  notify_emails text,
  deliver_on boolean not null default true,
  deliver_emails text,
  webhook_on boolean not null default true,
  webhook_url text,
  webhook_urls text[],
  webhook_secret text,
  hubspot jsonb,
  pipedrive jsonb,
  stripe_customer text,
  plan jsonb,
  pricing text not null default 'credit',                  -- unused (LoanLeaf tier pricing), kept so a stray select can't fail
  trial_used boolean not null default false,
  profile jsonb,                                           -- public profile (logo, about, site)
  backlog_at timestamptz,
  leads_exported_at timestamptz,
  email_verified_at timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists brokers_email on public.brokers (email);

-- ---------------------------------------------------------------- leads (legal enquiries)
create table if not exists public.leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  area text,                                               -- practice area slug (api/_lib/taxonomy.js)
  area_label text,
  matter text,                                             -- matter slug or 'other'
  matter_label text,
  audience text,                                           -- individual / business
  urgency text,                                            -- one of URGENCY labels
  deadline date,                                           -- court date, visa expiry, hearing
  postcode text,                                           -- full, only shown after purchase
  postcode_district text,                                  -- outward code, shown before purchase
  postcode_area text,                                      -- letters only, e.g. SW
  region text,
  country text,
  value_band text,
  value_label text,
  value_min integer,
  value_max integer,
  private_pay text,                                        -- yes / quote
  business_name text,
  company_number text,
  company jsonb,                                           -- Companies House record (business leads)
  answers jsonb not null default '[]'::jsonb,              -- [{ id, q, a }]
  tags text[] not null default '{}',
  score integer,
  grade text,
  summary text,                                            -- free text, only shown after purchase
  full_name text,
  email text,
  phone text,
  checks jsonb,                                            -- live phone and email checks
  flags text[] not null default '{}',
  consent jsonb,
  source jsonb,
  form_version text,
  price integer not null check (price > 0),                -- credits (1 credit = £1 + VAT). Becomes the price paid on a sale
  list_price integer,                                      -- original price when sold at a discount
  price_fixed boolean not null default false,              -- priced by hand, so no automatic 72 hour discount
  buyer uuid references public.brokers on delete set null,
  bought_at timestamptz,
  auto boolean not null default false,
  stage text not null default 'new' check (stage in ('new', 'contacted', 'consultation', 'instructed', 'lost')),
  stage_at timestamptz,
  instructed_value integer,
  archived_at timestamptz,
  hidden_at timestamptz,                                   -- hidden leads are never shown, sold or auto-bought
  exclude_brokers uuid[] not null default '{}'             -- firms that bought this person before (7 day repeat rule)
);
create index if not exists leads_created on public.leads (created_at desc);
create index if not exists leads_open on public.leads (created_at desc) where buyer is null and hidden_at is null;
create index if not exists leads_buyer on public.leads (buyer, bought_at desc);
create index if not exists leads_phone on public.leads (phone);
create index if not exists leads_email on public.leads (email);
create index if not exists leads_area on public.leads (area, matter);

-- ---------------------------------------------------------------- credits
create table if not exists public.ledger (
  id bigint generated always as identity primary key,
  broker uuid not null references public.brokers on delete cascade,
  created_at timestamptz not null default now(),
  delta integer not null,
  reason text not null,
  lead_id bigint references public.leads on delete set null,
  ref text unique,                                         -- Stripe invoice id etc., makes add_credits idempotent
  invoiced numeric(12,2)                                   -- £ ex VAT invoiced by hand for this top-up (Admin, Finance)
);
create index if not exists ledger_broker on public.ledger (broker, created_at desc);
create index if not exists ledger_lead on public.ledger (lead_id);

-- ---------------------------------------------------------------- notes, refunds, agreements, team
create table if not exists public.lead_notes (
  id bigint generated always as identity primary key,
  lead_id bigint not null references public.leads on delete cascade,
  broker uuid not null references public.brokers on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists lead_notes_lead on public.lead_notes (lead_id, created_at);

-- Foreign key names returns_lead_id_fkey and returns_broker_fkey are used by the API's embeds.
create table if not exists public.returns (
  id bigint generated always as identity primary key,
  lead_id bigint not null references public.leads on delete cascade,
  broker uuid not null references public.brokers on delete cascade,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  credits integer,                                         -- what the refund gave back
  decision text,                                           -- why it was declined
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index if not exists returns_lead_broker_key on public.returns (lead_id, broker);

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

create table if not exists public.team_members (
  id bigserial primary key,
  broker uuid not null references public.brokers (id) on delete cascade,
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

-- ---------------------------------------------------------------- invites (firms invited to the platform before they sign up)
-- email_id: Resend email id, or 'sent' / 'queued' / 'paused' / 'accepted'. digest: weekly round-up instead of one email per lead.
create table if not exists public.invites (
  email text primary key,
  name text not null default '',
  company text,
  token text,
  expires_at timestamptz,
  alerts boolean not null default true,
  digest boolean not null default false,
  batch text,                                              -- CSV upload it came from
  send_at timestamptz,
  email_id text,
  created_at timestamptz not null default now()
);
create index if not exists invites_batch on public.invites (batch);
create index if not exists invites_token on public.invites (token);
create index if not exists invites_queue on public.invites (email_id, send_at);

-- ---------------------------------------------------------------- admin, settings, limits
create table if not exists public.settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  admin uuid references public.brokers on delete set null,
  action text not null,
  target text,
  detail jsonb
);
create index if not exists audit_log_action on public.audit_log (action, at desc);

create table if not exists public.rate_events (key text not null, at timestamptz not null default now());
create index if not exists rate_events_key on public.rate_events (key, at);

-- Commission a client pays and ad spend behind their leads (admin only). broker null = business-wide spend tagged by channel.
create table if not exists public.commission_entries (
  id bigint generated always as identity primary key,
  broker uuid references public.brokers on delete cascade,
  kind text not null check (kind in ('commission', 'spend')),
  amount numeric(12,2) not null check (amount > 0),
  date date not null,
  note text,
  channel text,
  created_at timestamptz not null default now()
);
create index if not exists commission_entries_broker on public.commission_entries (broker, date);

-- Anyone who unsubscribes (invite or CRM email) is never emailed again by the platform or CRM, unless they register.
create table if not exists public.email_suppressions (
  email text primary key,
  reason text,
  source text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- firm acquisition CRM (Admin, CRM)
create table if not exists public.crm_contacts (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null default '',
  company text not null default '',
  email text,
  phone text,
  position text,
  website text,
  source text not null default 'Other',
  source_detail text,
  utm jsonb,
  stage text not null default 'new' check (stage in ('new', 'contacted', 'call_booked', 'proposal', 'onboarding', 'won', 'nurture', 'lost')),
  stage_changed_at timestamptz not null default now(),
  lost_reason text,
  leads_per_month text,
  budget text,
  value integer,
  tags text[] not null default '{}',
  next_action text,
  next_action_at timestamptz,
  last_contacted_at timestamptz,
  broker_id uuid references public.brokers (id) on delete set null,
  invite_email text,
  flows_paused boolean not null default false,
  unsubscribed_at timestamptz
);
create unique index if not exists crm_contacts_email_key on public.crm_contacts (lower(email)) where email is not null;
create index if not exists crm_contacts_stage_idx on public.crm_contacts (stage, stage_changed_at);
create index if not exists crm_contacts_next_idx on public.crm_contacts (next_action_at) where next_action_at is not null;

create table if not exists public.crm_activities (
  id bigint generated always as identity primary key,
  contact_id bigint not null references public.crm_contacts (id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('note', 'email', 'sms', 'call', 'stage', 'system', 'flow')),
  subject text,
  body text,
  meta jsonb,
  by_id uuid
);
create index if not exists crm_activities_contact_idx on public.crm_activities (contact_id, created_at desc);

create table if not exists public.crm_flow_sends (
  contact_id bigint not null references public.crm_contacts (id) on delete cascade,
  step text not null,
  sent_at timestamptz not null default now(),
  email_id text,
  primary key (contact_id, step)
);

-- ---------------------------------------------------------------- row level security: on everywhere, no policies
do $$
declare t text;
begin
  foreach t in array array['brokers', 'leads', 'ledger', 'lead_notes', 'returns', 'agreements', 'team_members', 'invites', 'settings',
    'audit_log', 'rate_events', 'commission_entries', 'email_suppressions', 'crm_contacts', 'crm_activities', 'crm_flow_sends'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- functions (service_role only)

-- Atomic purchase. The lead must be unsold, not hidden and not excluded for this firm. The firm must be approved, not
-- suspended and have enough credits. A lead left unsold for 72 hours costs half (rounded up) unless it was priced by hand
-- (price_fixed). On a sale leads.price becomes the price actually paid and list_price keeps the original.
-- Keep the 72 hours and 50% in step with DISCOUNT in api/_lib/platform.js.
create or replace function public.buy_lead(p_lead bigint, p_broker uuid, p_auto boolean default false)
returns boolean language plpgsql set search_path = public as $$
declare v_list int; v_price int; v_created timestamptz; v_fixed boolean;
begin
  select price, created_at, price_fixed into v_list, v_created, v_fixed
    from leads
   where id = p_lead and buyer is null and hidden_at is null and not (p_broker = any(exclude_brokers))
   for update;
  if not found then return false; end if;
  v_price := case when not v_fixed and v_created < now() - interval '72 hours'
              then greatest(1, ceil(v_list * 0.5))::int else v_list end;
  update brokers set credits = credits - v_price,
         last_auto_at = case when p_auto then now() else last_auto_at end
   where id = p_broker and approved and suspended_at is null and credits >= v_price;
  if not found then return false; end if;
  update leads set buyer = p_broker, bought_at = now(), auto = p_auto, price = v_price,
         list_price = case when v_price <> v_list then v_list when v_fixed then list_price end
   where id = p_lead;
  insert into ledger (broker, delta, reason, lead_id)
  values (p_broker, -v_price,
          case when p_auto then 'Auto-bought lead' when v_price <> v_list then 'Bought lead (50% off)' else 'Bought lead' end, p_lead);
  return true;
end $$;

-- Idempotent credit change: a repeated ref (e.g. a Stripe invoice id) is ignored.
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

-- Credits a firm has spent on auto-buys this calendar month (for the monthly cap).
create or replace function public.auto_spend_this_month(p_broker uuid)
returns int language sql stable set search_path = public as $$
  select coalesce(-sum(delta), 0)::int from ledger
  where broker = p_broker and reason = 'Auto-bought lead' and created_at >= date_trunc('month', now());
$$;

-- Rate limiting: records a hit for key and returns true if it is within max hits per window (seconds).
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

revoke execute on function public.buy_lead(bigint, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.add_credits(uuid, int, text, text) from public, anon, authenticated;
revoke execute on function public.auto_spend_this_month(uuid) from public, anon, authenticated;
revoke execute on function public.hit_rate(text, int, int) from public, anon, authenticated;
grant execute on function public.buy_lead(bigint, uuid, boolean) to service_role;
grant execute on function public.add_credits(uuid, int, text, text) to service_role;
grant execute on function public.auto_spend_this_month(uuid) to service_role;
grant execute on function public.hit_rate(text, int, int) to service_role;

-- ---------------------------------------------------------------- storage: firm logos (public profile)
-- api/platform.js uploads a resized PNG to the public "logos" bucket with the secret key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 1048576, array['image/png'])
on conflict (id) do nothing;

-- First admin: after signing up on leaflegal.co/platform, run
--   update public.brokers set is_admin = true, approved = true where email = '<admin email>';
