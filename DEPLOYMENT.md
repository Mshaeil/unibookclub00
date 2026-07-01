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

## 2. قاعدة البيانات (مشروع جديد — موصى به)

**للقاعدة النظيفة السريعة** اتبع الدليل الكامل:

👉 [`scripts/fresh/README.md`](scripts/fresh/README.md)

ملخص سريع — نفّذ بالترتيب في SQL Editor:

```
scripts/fresh/01_install.sql
scripts/fresh/02_functions.sql
scripts/fresh/03_seed.sql
scripts/fresh/04_storage.sql
scripts/fresh/05_admin_setup.sql   ← بعد تعديل البريد
```

### ترقية قاعدة قديمة (اختياري — غير موصى به)

إذا أردت البقاء على المشروع القديم، نفّذ السكربتات `001`–`025` بالترتيب (بطيء ومعرّض للتعارض). للإنتاج استخدم `scripts/fresh/` على مشروع جديد.

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
