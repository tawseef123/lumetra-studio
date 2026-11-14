LUMETRA STUDIO CMS V1.0 STARTER

Open admin/index.html after configuring admin/config.js with Supabase project URL and anon key.
Run supabase/schema.sql in Supabase SQL Editor, create an Auth user, then insert its UUID into public.admin_users (see CMS_SETUP_BN.md).

This starter includes a secure-by-RLS admin dashboard scaffold for Portfolio, Assets, Services, FAQs, Page Content, and Media Library. The public V6.7 site remains unchanged and currently uses its local content.js fallback. Live public-site Supabase content rendering is the next integration phase.
