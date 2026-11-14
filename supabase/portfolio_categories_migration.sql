-- Lumetra Studio CMS V2.4: Portfolio categories + YouTube embeds
-- Run once in Supabase SQL Editor. Existing project records are preserved.
create table if not exists public.project_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  thumbnail text not null,
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects add column if not exists category_id uuid references public.project_categories(id) on delete set null;
alter table public.projects add column if not exists youtube_url text not null default '';
-- Create category records for existing legacy category names so existing projects remain grouped.
insert into public.project_categories(name, thumbnail, sort_order, status)
select distinct trim(category), 'assets/work-brandfilm.webp', row_number() over(order by trim(category))*10, 'published'
from public.projects where nullif(trim(category),'') is not null
on conflict (name) do nothing;
update public.projects p set category_id=c.id
from public.project_categories c where p.category_id is null and lower(trim(p.category))=lower(c.name);
-- Existing video URLs are carried forward as YouTube URLs where they look like YouTube links.
update public.projects set youtube_url=url where youtube_url='' and (url ilike '%youtube.com/%' or url ilike '%youtu.be/%');
alter table public.project_categories enable row level security;
drop policy if exists "Public read published project categories" on public.project_categories;
create policy "Public read published project categories" on public.project_categories for select using (status='published');
drop policy if exists "Admins manage project categories" on public.project_categories;
create policy "Admins manage project categories" on public.project_categories for all to authenticated using (public.is_lumetra_admin()) with check (public.is_lumetra_admin());
