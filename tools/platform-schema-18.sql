-- Credit history in the tier rule (user, 17 Nov 2026): missed payments / CCJs in the last 6 years ('Yes') drop a lead one
-- tier, on top of any trading-time drop. 'Not sure' and 'No' don't. Bronze stays the floor. Applied 2026-11-17.
drop function if exists public.lead_tier(text, text, text, text, timestamptz);
create or replace function public.lead_tier(p_turnover text, p_trading text, p_property text, p_inc text, p_at timestamptz, p_credit text)
returns text language sql immutable set search_path to 'public' as $$
  with x as (
    select case p_turnover when '£50k to £100k' then 0 when '£100k to £250k' then 1 when '£250k to £500k' then 2
             when '£500k to £1m' then 3 when '£1m to £5m' then 4 when '£5m+' then 4 end as base,
           case when coalesce(p_inc, '') ~ '^\d{4}-\d{2}-\d{2}' then (coalesce(p_at, now())::date - left(p_inc, 10)::date) / 365.25
                else case p_trading when 'Under 6 months' then 0.25 when '6 to 12 months' then 0.75 when '1 to 2 years' then 1.5
                       when '2 to 5 years' then 3 when '5+ years' then 6 end end as age)
  select case when base is null then null else (array['Bronze', 'Silver', 'Gold', 'Platinum', 'Platinum+'])[
    greatest(base
      - case when age is not null and (age < 1 or (age < 2 and coalesce(p_property, '') <> 'Homeowner')) then 1 else 0 end
      - case when p_credit = 'Yes' then 1 else 0 end, 0) + 1] end
  from x
$$;
create or replace function public.leads_set_tier() returns trigger language plpgsql set search_path to 'public' as $$
begin
  new.tier := lead_tier(new.turnover, new.trading, new.property, new.company ->> 'incorporated', new.created_at, new.credit);
  new.tier_price := tier_price_of(new.tier);
  return new;
end $$;
drop trigger if exists leads_tier on leads;
create trigger leads_tier before insert or update of turnover, trading, property, company, credit on leads
  for each row execute function leads_set_tier();
update leads set turnover = turnover;
