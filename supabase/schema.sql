-- Lumetra Studio CMS schema (run in Supabase SQL Editor)
create extension if not exists pgcrypto;
create table if not exists public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade, role text not null default 'admin' check (role in ('owner','admin','editor')), created_at timestamptz not null default now());
create or replace function public.is_lumetra_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()) $$;
create table if not exists public.projects (id uuid primary key default gen_random_uuid(), title text not null, category text not null default 'Commercial', type text not null default '', image text not null default '', url text not null default '', sort_order integer not null default 0, status text not null default 'draft' check(status in ('draft','published')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.assets (id uuid primary key default gen_random_uuid(), title text not null, count text not null default '', image text not null default '', drive_url text not null default '', sort_order integer not null default 0, status text not null default 'draft' check(status in ('draft','published')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.services (id uuid primary key default gen_random_uuid(), title text not null, description text not null default '', icon text not null default '', sort_order integer not null default 0, status text not null default 'draft' check(status in ('draft','published')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.faqs (id uuid primary key default gen_random_uuid(), question text not null, answer text not null, sort_order integer not null default 0, status text not null default 'draft' check(status in ('draft','published')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.site_content (id uuid primary key default gen_random_uuid(), section text not null, content_key text not null, content_value text not null default '', status text not null default 'draft' check(status in ('draft','published')), updated_at timestamptz not null default now(), unique(section,content_key));
-- Public visitors can read only published content. Only authenticated admins can write.
do $$ declare t text; begin foreach t in array array['projects','assets','services','faqs','site_content'] loop execute format('alter table public.%I enable row level security',t); execute format('drop policy if exists "Public read published %1$s" on public.%1$I',t); execute format('create policy "Public read published %1$s" on public.%1$I for select using (status = ''published'')',t); execute format('drop policy if exists "Admins manage %1$s" on public.%1$I',t); execute format('create policy "Admins manage %1$s" on public.%1$I for all to authenticated using (public.is_lumetra_admin()) with check (public.is_lumetra_admin())',t); end loop; end $$;
alter table public.admin_users enable row level security;
drop policy if exists "Admins read own admin record" on public.admin_users;
create policy "Admins read own admin record" on public.admin_users for select to authenticated using (user_id=auth.uid());
-- Storage bucket for images/videos. Public read, admin-only upload/update/delete.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('lumetra-media','lumetra-media',true,52428800,array['image/jpeg','image/png','image/webp','image/svg+xml','video/mp4','video/webm']) on conflict(id) do nothing;
drop policy if exists "Public read Lumetra media" on storage.objects;
create policy "Public read Lumetra media" on storage.objects for select using (bucket_id='lumetra-media');
drop policy if exists "Admins upload Lumetra media" on storage.objects;
create policy "Admins upload Lumetra media" on storage.objects for insert to authenticated with check (bucket_id='lumetra-media' and public.is_lumetra_admin());
drop policy if exists "Admins update Lumetra media" on storage.objects;
create policy "Admins update Lumetra media" on storage.objects for update to authenticated using (bucket_id='lumetra-media' and public.is_lumetra_admin()) with check (bucket_id='lumetra-media' and public.is_lumetra_admin());
drop policy if exists "Admins delete Lumetra media" on storage.objects;
create policy "Admins delete Lumetra media" on storage.objects for delete to authenticated using (bucket_id='lumetra-media' and public.is_lumetra_admin());
