-- Broker CRM (applied to Supabase tefpljuzuvdchczcfjlz as migration "crm").
create table public.crm_contacts (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  name text not null default '', company text not null default '', email text, phone text, position text, website text,
  source text not null default 'Other', source_detail text, utm jsonb,
  stage text not null default 'new' check (stage in ('new','contacted','call_booked','proposal','onboarding','won','nurture','lost')),
  stage_changed_at timestamptz not null default now(), lost_reason text,
  leads_per_month text, budget text, value integer, tags text[] not null default '{}',
  next_action text, next_action_at timestamptz, last_contacted_at timestamptz,
  broker_id uuid references public.brokers(id) on delete set null, invite_email text,
  flows_paused boolean not null default false, unsubscribed_at timestamptz
);
create unique index crm_contacts_email_key on public.crm_contacts (lower(email)) where email is not null;
create index crm_contacts_stage_idx on public.crm_contacts (stage, stage_changed_at);
create index crm_contacts_next_idx on public.crm_contacts (next_action_at) where next_action_at is not null;
create table public.crm_activities (
  id bigint generated always as identity primary key,
  contact_id bigint not null references public.crm_contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('note','email','sms','call','stage','system','flow')),
  subject text, body text, meta jsonb, by_id uuid
);
create index crm_activities_contact_idx on public.crm_activities (contact_id, created_at desc);
create table public.crm_flow_sends (
  contact_id bigint not null references public.crm_contacts(id) on delete cascade,
  step text not null, sent_at timestamptz not null default now(), email_id text,
  primary key (contact_id, step)
);
alter table public.crm_contacts enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_flow_sends enable row level security;
