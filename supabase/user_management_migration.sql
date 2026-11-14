-- Lumetra CMS: Owner / Editor permissions (V1)
-- Apply in Supabase SQL Editor after reviewing. Existing owner rows are preserved.
create or replace function public.is_lumetra_owner()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.admin_users where user_id=auth.uid() and role='owner') $$;

create or replace function public.is_lumetra_editor()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.admin_users where user_id=auth.uid() and role in ('owner','editor','admin')) $$;

-- Authenticated CMS roles can manage content; footer/contact keys are owner-only.
do $$ declare t text; begin
 foreach t in array array['projects','assets','services','faqs','project_categories','asset_categories'] loop
  execute format('drop policy if exists "Admins manage %1$s" on public.%1$I',t);
  execute format('drop policy if exists "Editors manage %1$s" on public.%1$I',t);
  execute format('create policy "Editors manage %1$s" on public.%1$I for all to authenticated using (public.is_lumetra_editor()) with check (public.is_lumetra_editor())',t);
 end loop;
end $$;

alter table public.site_content enable row level security;
drop policy if exists "Admins manage site_content" on public.site_content;
drop policy if exists "Editors manage non-footer site content" on public.site_content;
create policy "Editors manage non-footer site content" on public.site_content
 for all to authenticated
 using (public.is_lumetra_editor() and section <> 'footer')
 with check (public.is_lumetra_editor() and section <> 'footer');
drop policy if exists "Owners manage footer site content" on public.site_content;
create policy "Owners manage footer site content" on public.site_content
 for all to authenticated
 using (public.is_lumetra_owner() and section = 'footer')
 with check (public.is_lumetra_owner() and section = 'footer');

-- Admin directory: each user can read their own role; only owner can manage non-owner accounts.
drop policy if exists "Admins read own admin record" on public.admin_users;
drop policy if exists "Owner manages editor accounts" on public.admin_users;
create policy "Users read own role" on public.admin_users
 for select to authenticated using (user_id=auth.uid() or public.is_lumetra_owner());
create policy "Owner manages editor accounts" on public.admin_users
 for all to authenticated
 using (public.is_lumetra_owner() and role <> 'owner')
 with check (public.is_lumetra_owner() and role in ('editor','admin'));

-- Keep storage operations restricted to authenticated CMS users.
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
