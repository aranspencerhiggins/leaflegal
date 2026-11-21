-- Business-wide ad spend outside Meta (LinkedIn, Google…): commission_entries rows of kind 'spend' with no broker, tagged by channel.
alter table public.commission_entries alter column broker drop not null, add column if not exists channel text;
