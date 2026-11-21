-- Loanleaf Platform: repeat enquiries (migration "lead_exclude_brokers", 2026-11-15).
-- A business that enquires again after 7 days becomes a new lead, but never goes to a broker who bought it before:
-- exclude_brokers lists those brokers (kept off auto-buy, Opportunities, buying and lead emails).
alter table public.leads add column if not exists exclude_brokers uuid[] not null default '{}';
