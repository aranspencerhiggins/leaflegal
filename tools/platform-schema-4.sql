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
