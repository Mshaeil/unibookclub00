# UniBookClub — دليل النشر

## المتطلبات

- Node.js 20+
- مشروع [Supabase](https://supabase.com)
- (اختياري) [Resend](https://resend.com) للبريد
- (موصى به) [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- استضافة [Vercel](https://vercel.com) أو ما يعادلها

## 1. متغيرات البيئة

انسخ `env.example` إلى `.env.local` (محلياً) أو أضف المتغيرات في Vercel:

| المتغير | الوصف |
|---------|--------|
| `NEXT_PUBLIC_SITE_URL` | النطاق الكامل، مثل `https://unibookclub.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | المفتاح العام (anon) |
| `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` | نطاقات البريد الجامعي، مثل `asu.edu.jo` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | مفتاح Turnstile العام |
| `TURNSTILE_SECRET_KEY` | مفتاح Turnstile السري (للخادم فقط) |
| `RESEND_API_KEY` | مفتاح Resend |
| `CONTACT_TO_EMAIL` | بريد استقبال رسائل التواصل |
| `CONTACT_FROM_EMAIL` | بريد المرسل (نطاق موثّق في Resend) |

## 2. قاعدة البيانات (Supabase SQL)

نفّذ السكربتات بالترتيب في **SQL Editor**:

```
001_create_schema.sql
002_seed_base.sql
003_seed_sample_listings.sql   ← تخطّه في الإنتاج
004_promote_admin.sql
005_fix_listings_courses_fk.sql
006_add_profiles_is_active.sql
007_add_sales_and_seller_reviews.sql
008_sales_seller_records_and_listings_buyer_read.sql
009_listing_discount_profile_email_rls_fixes.sql
010_discount_expires_at.sql
011_listings_admin_delete_rls.sql
012_messaging_admin_promote.sql
015_registered_users_stats_and_admin_list.sql
016_account_status_super_admin.sql
018_profiles_update_with_check.sql
019_super_admins_config.sql
020_orders_cart_points.sql
021_points_redemption.sql
022_profile_upsert_rpc.sql
023_ensure_my_profile_rpc.sql
024_indexes_from_user_request.sql
025_performance_boost.sql
```

بعد التنفيذ، رقِّ أول مدير يدوياً عبر `004_promote_admin.sql` أو لوحة الإدارة.

## 3. Supabase Auth

في **Authentication → URL Configuration**:

- **Site URL:** `https://your-domain.com`
- **Redirect URLs:**
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/reset-password`
  - `http://localhost:3000/reset-password`

فعّل **Email** و(اختياري) **Google** من Providers.

إذا فعّلت CAPTCHA في Supabase، اضبط Turnstile في Auth settings وأضف مفاتيح Turnstile في `.env`.

## 4. Supabase Storage

أنشئ bucket باسم `listing-images`:

- **Public:** لا (الوصول عبر `/api/file` للصور فقط)
- **سياسات RLS:** السماح للمستخدمين المسجّلين بالرفع إلى `listings/{user_id}/`
- PDF والمرفقات تُحمّل عبر `/api/listings/[id]/pdf` بعد الشراء والتقييم

## 5. التشغيل المحلي

```bash
npm install
npm run dev
```

## 6. البناء والنشر

```bash
npm run lint
npm run build
```

ارفع المشروع إلى Vercel واربط متغيرات البيئة. النشر التلقائي يعمل عبر GitHub Actions (`.github/workflows/ci.yml`).

## 7. بعد الإطلاق

- [ ] اختبر: تسجيل → إعلان → حجز → بيع → تقييم → PDF
- [ ] تحقق من `/privacy` و`/terms` و`/robots.txt` و`/sitemap.xml`
- [ ] راقب الأخطاء في Vercel Logs
- [ ] لا تشغّل `003_seed_sample_listings.sql` على الإنتاج
