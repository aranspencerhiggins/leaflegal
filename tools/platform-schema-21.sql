-- Brokers can archive a bought lead (hidden from their main list, still exportable). Set/cleared via action 'archive'.
alter table public.leads add column if not exists archived_at timestamptz;
