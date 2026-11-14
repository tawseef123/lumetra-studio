# Lumetra Studio CMS — Setup Guide

এই CMS বর্তমান V6.7 static website-এর ওপর যুক্ত করা হয়েছে। Public website GitHub Pages-এ থাকতে পারে; Supabase database, authentication ও media storage দেবে।

## 1) Supabase project তৈরি
1. https://supabase.com/dashboard এ account/project তৈরি করো।
2. Project তৈরি হলে **Project Settings → API** থেকে Project URL ও anon/publishable key নাও।
3. `admin/config.js` ফাইলে `YOUR-PROJECT` ও `YOUR_SUPABASE_ANON_KEY` placeholder বদলে দাও। এখানে কখনো `service_role` বা secret key দেবে না।

## 2) Database ও security setup
1. Supabase → SQL Editor → New query খোলো।
2. `supabase/schema.sql`-এর সম্পূর্ণ SQL paste করে Run করো।
3. এটি projects, assets, services, faqs, site_content tables, RLS policies এবং `lumetra-media` storage bucket তৈরি করবে।

## 3) প্রথম Admin তৈরি
1. Supabase → Authentication → Users → Add user থেকে নিজের admin email/password দিয়ে user তৈরি করো।
2. ওই user-এর UUID কপি করো।
3. SQL Editor-এ চালাও (UUID বদলে):

```sql
insert into public.admin_users(user_id, role)
values ('PASTE-AUTH-USER-UUID-HERE', 'owner');
```

Public sign-up চালু করার প্রয়োজন নেই। Admin user শুধু Supabase Dashboard থেকে তৈরি করো।

## 4) Deploy
- সম্পূর্ণ website folder GitHub repository-তে upload করো।
- `/admin/` path-এ CMS পাওয়া যাবে: `https://YOUR-DOMAIN/admin/`
- Supabase URL ও anon key public frontend-এ থাকা স্বাভাবিক; নিরাপত্তা নিশ্চিত করে RLS policies। Secret/service-role key কখনো browser code-এ রাখবে না।

## 5) CMS-এ কী আছে
- Email/password admin login
- Overview dashboard ও content counts
- Portfolio CRUD + draft/published status
- Assets CRUD + download URL
- Services CRUD
- FAQ CRUD
- Page content key/value editor
- Supabase Storage media upload/browse
- Search, status filter, publish/unpublish, delete confirmation

## Important current integration status
এই প্রথম CMS build-এ admin dashboard ও Supabase schema প্রস্তুত করা হয়েছে। Public pages এখনো তাদের V6.7 local `content.js` fallback content ব্যবহার করে। পরবর্তী integration step-এ public pages-কে Supabase-এর published rows থেকে data load করাতে হবে; তারপর admin থেকে publish করা content live website-এ দেখা যাবে। CMS connection setup সম্পন্ন না হওয়া পর্যন্ত Supabase-dependent actions কাজ করবে না।


## V2.4 Portfolio Category Update
1. Portfolio-এর জন্য `supabase/portfolio_categories_migration.sql` একবার Run করো।
2. Asset category চালু করতে `supabase/asset_categories_migration.sql`-এর সম্পূর্ণ SQL একবার Run করো।
3. CMS-এ `Portfolio Categories` থেকে Category Name ও JPG Thumbnail upload করে Publish করো।
4. এরপর `Portfolio Content` থেকে Title, Category dropdown, YouTube link দিয়ে project Publish করো।
5. Homepage-এ published category card দেখাবে। Portfolio page-এ প্রতিটি category আলাদা segment হবে। Video card-এ click করলে embedded popup player খুলবে।

পুরোনো category নামগুলো migration-এর সময় auto-create হবে; সেগুলোর thumbnail default placeholder থাকবে। CMS থেকে category Edit করে নিজের JPG thumbnail upload করে দেবে।


## V2.9 Asset Category Update
1. Supabase SQL Editor-এ `supabase/asset_categories_migration.sql` একবার Run করো।
2. CMS sidebar থেকে `Asset Categories` খুলে Category Name, JPG Thumbnail, Display Order ও Publishing Status দিয়ে category তৈরি করো।
3. `Assets` section-এ asset যোগ করার সময় `Asset category` dropdown থেকে category নির্বাচন করো। Existing image URL/storage path ও download URL field আগের মতোই থাকবে।
4. Homepage-এর Assets section-এ published category thumbnail card সর্বোচ্চ দুই row-তে auto-resize হয়ে দেখাবে। Category card click করলে Assets page-এর সংশ্লিষ্ট segment-এ যাবে।
5. Assets page-এ প্রতিটি category আলাদা segment হিসেবে তার published asset cards দেখাবে।

পুরোনো asset records অক্ষত থাকবে। Migration category_id column যোগ করে; existing assets-কে নতুন category-তে CMS থেকে Edit করে assign করতে হবে।


### V3.0 Asset description update
Supabase SQL Editor-এ `supabase/assets_description_migration_v3_0.sql` একবার Run করো। Asset form থেকে Display Count ও Thumbnail URL সরানো হয়েছে; Description যোগ হয়েছে। Asset card-এর image নির্বাচিত Category-র thumbnail থেকে আসবে।
