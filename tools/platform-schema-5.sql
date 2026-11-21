-- Loanleaf Platform: 50% off leads left unsold for 72 hours.
-- Run once in the Supabase SQL editor BEFORE deploying the matching code.
-- Keep the 72 hours / 50% in step with DISCOUNT in api/_lib/platform.js.

-- Original price of a lead that sold at a discount (null when sold at full price).
alter table public.leads add column if not exists list_price integer;

-- Same as before, but a lead older than 72 hours costs half (rounded up).
-- On a sale, leads.price becomes the price actually paid, so refunds and revenue use the real figure.
create or replace function public.buy_lead(p_lead bigint, p_broker uuid, p_auto boolean default false)
returns boolean language plpgsql set search_path = public as $$
declare v_list int; v_price int; v_created timestamptz;
begin
  select price, created_at into v_list, v_created from leads where id = p_lead and buyer is null for update;
  if not found then return false; end if;
  v_price := case when v_created < now() - interval '72 hours' then greatest(1, ceil(v_list * 0.5))::int else v_list end;
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
