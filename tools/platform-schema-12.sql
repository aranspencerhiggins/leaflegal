-- Refund reasons + relisting returned leads.
-- price_fixed: an admin set this lead's price by hand (relisted, 50% off, etc.), so the automatic 72-hour discount is off.
alter table leads add column if not exists price_fixed boolean not null default false;
-- credits: what the refund gave back (the lead's price can change after it's relisted). decision: why it was declined.
alter table returns add column if not exists credits int, add column if not exists decision text;
update returns r set credits = l.price from leads l where l.id = r.lead_id and r.status = 'approved' and r.credits is null;
-- A relisted lead can be bought, and refund-requested, by a new broker.
alter table returns drop constraint if exists returns_lead_id_key;
create unique index if not exists returns_lead_broker_key on returns (lead_id, broker);

create or replace function public.buy_lead(p_lead bigint, p_broker uuid, p_auto boolean default false)
 returns boolean language plpgsql set search_path to 'public' as $function$
declare v_list int; v_price int; v_created timestamptz; v_turnover text; v_fixed boolean;
begin
  select price, created_at, turnover, price_fixed into v_list, v_created, v_turnover, v_fixed from leads where id = p_lead and buyer is null for update;
  if not found then return false; end if;
  -- 50% off after 72 hours unsold, except leads from businesses with £250k+ revenue, or priced by hand (price_fixed).
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
