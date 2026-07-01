-- =============================================================================
-- UniBookClub — مسؤول أعلى + ترقية أول مدير
-- 1) غيّر البريدين أدناه
-- 2) سجّل حساباً بالبريد الأول من الموقع
-- 3) شغّل هذا السكربت
-- =============================================================================

-- المسؤول الأعلى (يدير حسابات المدراء)
INSERT INTO public.super_admins (email)
VALUES ('your-super-admin@asu.edu.jo')
ON CONFLICT (email) DO NOTHING;

-- ترقية أول مدير
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE lower(trim(email::text)) = lower(trim('your-admin@asu.edu.jo'))
  LIMIT 1
);
