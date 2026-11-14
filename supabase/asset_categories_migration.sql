-- Lumetra Studio CMS: Asset Categories (run once in Supabase SQL Editor)
create table if not exists public.asset_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  thumbnail text not null,
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.assets add column if not exists category_id uuid references public.asset_categories(id) on delete set null;
-- Create Asset Categories manually in CMS after running this migration.
alter table public.asset_categories enable row level security;
drop policy if exists "Public read published asset categories" on public.asset_categories;
create policy "Public read published asset categories" on public.asset_categories for select using (status='published');
drop policy if exists "Admins manage asset categories" on public.asset_categories;
create policy "Admins manage asset categories" on public.asset_categories for all to authenticated using (public.is_lumetra_admin()) with check (public.is_lumetra_admin());
