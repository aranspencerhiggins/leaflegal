-- 17 Nov 2026 (user): tier pricing paused. Every broker back on original credit pricing, and new brokers start on it.
-- Tier columns, trigger and code stay in place (dormant: nothing tier-related shows to a broker on 'credit').
alter table brokers alter column pricing set default 'credit';
update brokers set pricing = 'credit' where pricing <> 'credit';
