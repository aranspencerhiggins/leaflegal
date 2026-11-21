-- Loanleaf Platform: leads from businesses with £250k+ revenue are never discounted (applied 2026-11-09 as migration
-- "no_discount_250k_revenue"). Keep NO_DISCOUNT_TURNOVERS in api/_lib/platform.js in step with the list below.
create or replace function public.buy_lead(p_lead bigint, p_broker uuid, p_auto boolean default false)
returns boolean language plpgsql set search_path = public as $$
declare v_list int; v_price int; v_created timestamptz; v_turnover text;
begin
  select price, created_at, turnover into v_list, v_created, v_turnover from leads where id = p_lead and buyer is null for update;
  if not found then return false; end if;
  v_price := case when v_created < now() - interval '72 hours'
                   and coalesce(v_turnover, '') not in ('£250k to £500k', '£500k to £1m', '£1m to £5m', '£5m+')
              then greatest(1, ceil(v_list * 0.5))::int else v_list end;
  update brokers set credits = credits - v_price,
         last_auto_at = case when p_auto then now() else last_auto_at end
   where id = p_broker and approved and credits >= v_price;
  if not found then return false; end if;
  update leads set buyer = p_broker, bought_at = now(), auto = p_auto, price = v_price,
         list_price = case when v_price <> v_list then v_list end
   where id = p_lead;
  insert into ledger (broker, delta, reason, lead_id)
  values (p_broker, -v_price,
          case when p_auto then 'Auto-bought lead' when v_price <> v_list then 'Bought lead (50% off)' else 'Bought lead' end, p_lead);
  return true;
end $$;
revoke execute on function public.buy_lead(bigint, uuid, boolean) from public, anon, authenticated;
grant execute on function public.buy_lead(bigint, uuid, boolean) to service_role;
