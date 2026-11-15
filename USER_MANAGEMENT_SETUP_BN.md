# Lumetra CMS Owner / Editor Management

## Permission model
- Owner: full CMS control, including user invitations and footer/contact settings.
- Editor: can create, edit, publish, and delete portfolio projects/categories, assets/categories, services, FAQs, and non-footer page content.
- Editors cannot access footer/contact settings or manage users.
- Public sign-up remains disabled.

## Apply database migration
1. Open Supabase Dashboard → SQL Editor.
2. Review and run `supabase/user_management_migration.sql`.
3. Confirm the existing owner row in `public.admin_users` still has role `owner`.

## Deploy invitation Edge Function
1. Deploy `supabase/functions/invite-editor/index.ts` as an Edge Function named `invite-editor`.
2. Configure function secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Never put the service-role key in `admin/config.js` or any public file.
4. Set Supabase Auth email/redirect URL settings for your website domain.

## Important
This migration changes database authorization, not just the visible UI. Test using a separate editor account before inviting production team members. Do not change or share the owner's password.
