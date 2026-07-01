# قاعدة بيانات نظيفة — UniBookClub

## لماذا قاعدة جديدة؟

إذا كانت القاعدة الحالية **بطيئة أو تعلق**، السبب غالباً أحد هذه:

1. تشغيل **25 سكربت متفرّق** مع تكرار وتعارض
2. بيانات تجريبية كثيرة (`003_seed_sample_listings.sql`)
3. فهارس ناقصة أو RLS ثقيل
4. مشروع Supabase مجاني **متوقف (paused)** أو بعيد جغرافياً
5. سكربت البذور القديم `002` يستخدم عمود `name` غير موجود (أخطاء صامتة)

**الحل:** مشروع Supabase **جديد** + سكربتات `scripts/fresh/` الموحّدة.

---

## الخطوات (بالترتيب)

### ⚠️ إذا ظهر FAILED — اقرأ هذا أولاً

| السبب الشائع | الحل |
|--------------|------|
| شغّلت على قاعدة **قديمة** فيها جداول مختلفة | شغّل `00_reset.sql` ثم أعد من `01` |
| فشل في المنتصف وأعدت التشغيل | شغّل `00_reset.sql` ثم أعد الكل |
| فشل `04_storage` | أنشئ bucket يدوياً: **Storage → New bucket → `listing-images` (Private)** ثم أعد `04` |
| رسالة `column "name_ar" does not exist` | القاعدة قديمة — شغّل `00_reset.sql` |

**مهم:** انسخ **ملفاً واحداً كاملاً** في SQL Editor ثم اضغط **Run**. لا تنسخ أكثر من ملف دفعة واحدة.

---

### 1) أنشئ مشروع Supabase جديد (أو امسح القديم)

1. ادخل [supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project**
3. اختر:
   - **Region:** الأقرب للأردن (مثل `eu-central-1` Frankfurt)
   - كلمة مرور قاعدة قوية (احفظها)
4. انتظر حتى يصبح المشروع **Active** (أخضر)

> لا تستخدم المشروع القديم البطيء — أنشئ واحداً جديداً تماماً.

---

### 2) نفّذ السكربتات (SQL Editor)

من لوحة Supabase: **SQL Editor → New query**

شغّل **بالترتيب** (كل ملف لصق → Run → انتظر Success):

| # | الملف | النتيجة المتوقعة |
|---|--------|------------------|
| 0 | `00_reset.sql` | `public schema reset OK` ← **شغّله إذا فشل أي خطوة** |
| 1 | `01_install.sql` | `01_install.sql completed OK` |
| 2 | `02_functions.sql` | `02_functions.sql completed OK` |
| 3 | `03_seed.sql` | `03_seed.sql completed OK` |
| 4 | `04_storage.sql` | `04_storage.sql completed OK` |
| 5 | `05_admin_setup.sql` | بعد تعديل البريدين داخله |
| 6 | `06_seller_verification.sql` | تحقق البائع (بريد جامعي + هوية) |
| 7 | `07_asu_expansion.sql` | تخصصات إضافية (أمن سيبراني، AI...) |
| 8 | `08_enable_realtime.sql` | تحديث فوري للإعلانات والإشعارات |

**تفعيل Google OAuth:** Authentication → Providers → Google (أضف Client ID/Secret من Google Cloud).

**Realtime يدوياً إن فشل 08:** Database → Replication → فعّل جدول `listings`.

---

### 3) إعداد Auth

**Authentication → URL Configuration:**

- Site URL: `https://unibookclub.com` (أو `http://localhost:3000` للتطوير)
- Redirect URLs:
  ```
  http://localhost:3000/auth/callback
  http://localhost:3000/reset-password
  https://unibookclub.com/auth/callback
  https://unibookclub.com/reset-password
  ```

فعّل **Email** من Providers.

---

### 4) ربط الموقع بالمشروع الجديد

في `.env.local` (محلياً) و Vercel (إنتاج):

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

من Supabase: **Project Settings → API** — انسخ URL و `anon` key.

**أعد تشغيل** السيرفر بعد التغيير:

```bash
npm run dev
```

---

### 5) أول مدير

1. عدّل `scripts/fresh/05_admin_setup.sql` — ضع بريدك
2. **سجّل حساباً** من الموقع بنفس البريد
3. شغّل السكربت في SQL Editor
4. سجّل خروج ودخول → افتح `/admin`

---

## التحقق السريع

بعد التنفيذ، في SQL Editor:

```sql
SELECT count(*) FROM public.faculties;   -- يجب 7
SELECT count(*) FROM public.majors;      -- يجب 12
SELECT count(*) FROM public.courses;     -- يجب 16
```

من الموقع:

- `/browse` يفتح بدون تعليق
- `/register` تظهر الكليات
- إنشاء إعلان يعمل

---

## السكربتات القديمة (`scripts/001` … `025`)

| الحالة | الملفات |
|--------|---------|
| **استخدم للمشروع الجديد** | `scripts/fresh/*` فقط |
| **لا تشغّل** | `003_seed_sample_listings.sql` على الإنتاج |
| **قديم / للمرجع** | `001`–`025` (ترقيات تدريجية للقواعد القديمة) |

---

## إن أردت مسح مشروع قديم (حذر!)

لا يُنصح به إن كان فيه مستخدمون حقيقيون. للمشروع الجديد **لا حاجة** — أنشئ مشروعاً جديداً بدلاً من المسح.

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| الموقع يعلق عند التحميل | تأكد المشروع غير Paused في Supabase |
| `relation does not exist` | لم تُنفَّذ `01_install.sql` |
| الحجز لا يعمل | لم تُنفَّذ `02_functions.sql` |
| الكليات فارغة | لم تُنفَّذ `03_seed.sql` |
| رفع الصور يفشل | نفّذ `04_storage.sql` |
| CAPTCHA يفشل | اضبط Turnstile في Supabase + `.env` |
