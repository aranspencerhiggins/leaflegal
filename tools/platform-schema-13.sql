-- Loanleaf Platform: admin can hide leads (migration "lead_hidden_at", 2026-11-14).
-- Hidden leads drop out of Admin → All leads (unless filtered for), Opportunities, the dashboard, digests, and can't be bought.
alter table public.leads add column if not exists hidden_at timestamptz;
