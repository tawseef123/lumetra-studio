-- Lumetra Studio CMS V3.0: Asset description field (run once in Supabase SQL Editor)
-- The old count and image columns are retained for backward compatibility.
-- New asset cards automatically use their selected category thumbnail.
alter table public.assets add column if not exists description text not null default '';
