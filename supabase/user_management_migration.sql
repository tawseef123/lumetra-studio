-- Lumetra CMS: Owner / Editor permissions
-- Safe for the existing schema.sql: admin_users.user_id references auth.users(id).
-- Set the intended owner using the email confirmed by the site owner.
do $$
declare owner_id uuid;
begin
  select id into owner_id from auth.users
   where lower(email) = lower('tawseefkhan2001@gmail.com');
  if owner_id is null then
    raise exception 'Owner account email not found in Supabase Auth. No role changes were made.';
  end if;
  if (select count(*) from auth.users where lower(email)=lower('tawseefkhan2001@gmail.com')) <> 1 then
    raise exception 'Owner email is not unique. No role changes were made.';
  end if;
  insert into public.admin_users(user_id,role)
    values(owner_id,'owner')
    on conflict(user_id) do update set role='owner';
  update public.admin_users set role='editor'
   where user_id <> owner_id and role in ('admin','editor');
end $$;

create or replace function public.is_lumetra_owner()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.admin_users where user_id=auth.uid() and role='owner') $$;

create or replace function public.is_lumetra_editor()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.admin_users where user_id=auth.uid() and role in ('owner','editor')) $$;

-- Rebuild content write policies, preserving public published-content reads.
do $$ declare t text; begin
 foreach t in array array['projects','assets','services','faqs'] loop
  execute format('drop policy if exists "Admins manage %1$s" on public.%1$I',t);
  execute format('drop policy if exists "Editors manage %1$s" on public.%1$I',t);
  execute format('create policy "Editors manage %1$s" on public.%1$I for all to authenticated using (public.is_lumetra_editor()) with check (public.is_lumetra_editor())',t);
 end loop;
end $$;

-- Owner-only footer/contact settings. Editors may manage other site_content sections.
alter table public.site_content enable row level security;
drop policy if exists "Admins manage site_content" on public.site_content;
drop policy if exists "Editors manage non-footer site content" on public.site_content;
create policy "Editors manage non-footer site content" on public.site_content
 for all to authenticated using (public.is_lumetra_editor() and lower(section) not in ('footer','contact'))
 with check (public.is_lumetra_editor() and lower(section) not in ('footer','contact'));
drop policy if exists "Owners manage footer site content" on public.site_content;
create policy "Owners manage footer site content" on public.site_content
 for all to authenticated using (public.is_lumetra_owner() and lower(section) in ('footer','contact'))
 with check (public.is_lumetra_owner() and lower(section) in ('footer','contact'));

-- A user can read their own role; Owner can read/manage editor role records.
alter table public.admin_users enable row level security;
drop policy if exists "Admins read own admin record" on public.admin_users;
drop policy if exists "Users read own role" on public.admin_users;
drop policy if exists "Owner manages editor accounts" on public.admin_users;
create policy "Users read own role" on public.admin_users
 for select to authenticated using (user_id=auth.uid() or public.is_lumetra_owner());
create policy "Owner manages editor accounts" on public.admin_users
 for all to authenticated using (public.is_lumetra_owner() and role <> 'owner')
 with check (public.is_lumetra_owner() and role='editor');

-- Existing public media-read policy is retained; authenticated editors can manage media.
drop policy if exists "Admins upload Lumetra media" on storage.objects;
create policy "Editors upload Lumetra media" on storage.objects for insert to authenticated
 with check (bucket_id='lumetra-media' and public.is_lumetra_editor());
drop policy if exists "Admins update Lumetra media" on storage.objects;
create policy "Editors update Lumetra media" on storage.objects for update to authenticated
 using (bucket_id='lumetra-media' and public.is_lumetra_editor())
 with check (bucket_id='lumetra-media' and public.is_lumetra_editor());
drop policy if exists "Admins delete Lumetra media" on storage.objects;
create policy "Editors delete Lumetra media" on storage.objects for delete to authenticated
 using (bucket_id='lumetra-media' and public.is_lumetra_editor());
