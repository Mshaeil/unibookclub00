-- إحصاء كل المسجّلين (auth.users) + قائمة الأدمن الكاملة — نفّذ في Supabase SQL Editor
-- يحل: ظهور مستخدم واحد فقط إذا كان RLS أو البيانات محصورة في profiles

-- ---------------------------------------------------------------------------
-- تأكيد قراءة profiles للجميع (إن وُجدت سياسة أخرى تمنع ذلك)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all"
  ON public.profiles FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- عدد كل الحسابات في auth (قوقل + بريد + قديم وجديد) — للزوار والمستخدمين
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_platform_registered_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint FROM auth.users;
$$;

REVOKE ALL ON FUNCTION public.get_platform_registered_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_registered_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_platform_registered_count() TO authenticated;

-- ---------------------------------------------------------------------------
-- قائمة المستخدمين للأدمن: auth.users مدمج مع profiles
-- ---------------------------------------------------------------------------
-- NOTE: return type can change across versions (e.g. account_status). Drop first to avoid errors.
DROP FUNCTION IF EXISTS public.admin_list_registered_users();

CREATE FUNCTION public.admin_list_registered_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  whatsapp text,
  role text,
  is_active boolean,
  account_status text,
  created_at timestamptz,
  email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    COALESCE(
      NULLIF(TRIM(p.full_name), ''),
      NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
      NULLIF(TRIM(SPLIT_PART(COALESCE(u.email::text, ''), '@', 1)), ''),
      'مستخدم'
    )::text AS full_name,
    p.phone::text,
    p.whatsapp::text,
    COALESCE(p.role, 'user')::text AS role,
    COALESCE(p.is_active, true) AS is_active,
    COALESCE(NULLIF(TRIM(p.account_status), ''), 'active')::text AS account_status,
    COALESCE(p.created_at, u.created_at) AS created_at,
    u.email::text AS email
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE EXISTS (
    SELECT 1 FROM public.profiles ad
    WHERE ad.id = auth.uid() AND ad.role = 'admin'
  )
  ORDER BY COALESCE(p.created_at, u.created_at) DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_registered_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_registered_users() TO authenticated;

-- ---------------------------------------------------------------------------
-- (اختياري) إنشاء صفوف profiles الناقصة من auth — شغّل مرة واحدة إن رغبت
-- ---------------------------------------------------------------------------
-- INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role)
-- SELECT
--   u.id,
--   COALESCE(
--     NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''),
--     NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
--     NULLIF(TRIM(SPLIT_PART(COALESCE(u.email::text, ''), '@', 1)), ''),
--     'مستخدم'
--   ),
--   NULLIF(TRIM(u.raw_user_meta_data ->> 'phone'), ''),
--   NULLIF(TRIM(u.raw_user_meta_data ->> 'whatsapp'), ''),
--   u.email::text,
--   'user'
-- FROM auth.users u
-- WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
-- ON CONFLICT (id) DO NOTHING;
