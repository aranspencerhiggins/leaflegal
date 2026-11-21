-- Lead tiers (Bronze to Platinum+) and per-broker pricing: 'credit' = the original calculated price (leads.price),
-- 'tier' = a flat price per tier (leads.tier_price, from settings.tier_prices). New brokers start on tiers; brokers who
-- had paid by 17 Nov 2026 stay on credit pricing. Admins switch brokers in Admin → client.

-- Tier rule: revenue band sets the base tier; under 1 year trading drops one tier, 1 to 2 years drops one unless a
-- homeowner; Bronze is the floor. Trading age from the Companies House incorporation date at the time of the enquiry,
-- else the declared band. Under £50k revenue (or no revenue answer) has no tier. Mirrored in leadTier() (api/_lib/platform.js).
create or replace function public.lead_tier(p_turnover text, p_trading text, p_property text, p_inc text, p_at timestamptz)
returns text language sql immutable set search_path to 'public' as $$
  with x as (
    select case p_turnover when '£50k to £100k' then 0 when '£100k to £250k' then 1 when '£250k to £500k' then 2
             when '£500k to £1m' then 3 when '£1m to £5m' then 4 when '£5m+' then 4 end as base,
           case when coalesce(p_inc, '') ~ '^\d{4}-\d{2}-\d{2}' then (coalesce(p_at, now())::date - left(p_inc, 10)::date) / 365.25
                else case p_trading when 'Under 6 months' then 0.25 when '6 to 12 months' then 0.75 when '1 to 2 years' then 1.5
                       when '2 to 5 years' then 3 when '5+ years' then 6 end end as age)
  select case when base is null then null else (array['Bronze', 'Silver', 'Gold', 'Platinum', 'Platinum+'])[
    greatest(base - case when age is not null and (age < 1 or (age < 2 and coalesce(p_property, '') <> 'Homeowner')) then 1 else 0 end, 0) + 1] end
  from x
$$;

insert into settings (key, value) values ('tier_prices', '{"Bronze": 25, "Silver": 50, "Gold": 80, "Platinum": 150, "Platinum+": 220}')
on conflict (key) do nothing;

create or replace function public.tier_price_of(p_tier text) returns int language sql stable set search_path to 'public' as $$
  select coalesce((select (value ->> p_tier)::int from settings where key = 'tier_prices'),
    case p_tier when 'Bronze' then 25 when 'Silver' then 50 when 'Gold' then 80 when 'Platinum' then 150 when 'Platinum+' then 220 end)
$$;

alter table leads add column if not exists tier text, add column if not exists tier_price int;

create or replace function public.leads_set_tier() returns trigger language plpgsql set search_path to 'public' as $$
begin
  new.tier := lead_tier(new.turnover, new.trading, new.property, new.company ->> 'incorporated', new.created_at);
  new.tier_price := tier_price_of(new.tier);
  return new;
end $$;
drop trigger if exists leads_tier on leads;
create trigger leads_tier before insert or update of turnover, trading, property, company on leads
  for each row execute function leads_set_tier();
update leads set turnover = turnover; -- backfill every lead through the trigger

alter table brokers add column if not exists pricing text not null default 'tier' check (pricing in ('credit', 'tier'));
update brokers set pricing = 'credit' where company in ('Ignite Commercial Finance Ltd', 'Magna Money', 'Aureum Finance', 'Hillwater Ltd', 'Moorgate Finance');

-- buy_lead now charges by the broker's pricing: tier brokers pay the lead's tier price (prices set by hand don't apply to
-- them; the 72-hour 50% discount does, same turnovers excepted). The lead's price becomes what was paid, as before.
drop function if exists public.buy_lead(bigint, uuid, boolean);
create or replace function public.buy_lead(p_lead bigint, p_broker uuid, p_auto boolean default false)
 returns boolean language plpgsql set search_path to 'public' as $function$
declare v_list int; v_price int; v_created timestamptz; v_turnover text; v_fixed boolean; v_tier_price int; v_pricing text;
begin
  select price, created_at, turnover, price_fixed, tier_price into v_list, v_created, v_turnover, v_fixed, v_tier_price
    from leads where id = p_lead and buyer is null for update;
  if not found then return false; end if;
  select pricing into v_pricing from brokers where id = p_broker;
  if v_pricing = 'tier' then
    if v_tier_price is null then return false; end if; -- no tier (under £50k revenue): not sold on tiers
    v_list := v_tier_price; v_fixed := false;
  end if;
  v_price := case when not v_fixed and v_created < now() - interval '72 hours'
                   and coalesce(v_turnover, '') not in ('£250k to £500k', '£500k to £1m', '£1m to £5m', '£5m+')
              then greatest(1, ceil(v_list * 0.5))::int else v_list end;
  update brokers set credits = credits - v_price,
         last_auto_at = case when p_auto then now() else last_auto_at end
   where id = p_broker and approved and credits >= v_price;
  if not found then return false; end if;
  update leads set buyer = p_broker, bought_at = now(), auto = p_auto, price = v_price,
         list_price = case when v_price <> v_list then v_list when v_fixed then list_price end
   where id = p_lead;
  insert into ledger (broker, delta, reason, lead_id)
  values (p_broker, -v_price,
          case when p_auto then 'Auto-bought lead' when v_price <> v_list then 'Bought lead (50% off)' else 'Bought lead' end, p_lead);
  return true;
end $function$;
revoke execute on function public.buy_lead(bigint, uuid, boolean) from public, anon, authenticated;
grant execute on function public.buy_lead(bigint, uuid, boolean) to service_role;
