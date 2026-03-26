-- حالات الحساب: active / suspended / banned + مسؤول أعلى (بريد محدد) لإدارة المدراء
-- نفّذ في Supabase SQL Editor بعد 015_registered_users_stats_and_admin_list.sql
-- يجب أن يطابق البريد في الدالة env التطبيق: SUPER_ADMIN_EMAIL

-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';

-- إزالة قيود قديمة إن وُجدت ثم إضافة CHECK
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'suspended', 'banned'));

UPDATE public.profiles
SET account_status = CASE
  WHEN COALESCE(is_active, true) IS FALSE THEN 'suspended'
  ELSE 'active'
END;

UPDATE public.profiles
SET is_active = true
WHERE account_status = 'active' AND is_active IS FALSE;

UPDATE public.profiles
SET is_active = false
WHERE account_status IN ('suspended', 'banned');

-- ---------------------------------------------------------------------------
-- تحديث قائمة المستخدمين للأدمن لتضمين account_status
-- لا يمكن تغيير صف الأعمدة بـ CREATE OR REPLACE — حذف ثم إنشاء
-- ---------------------------------------------------------------------------
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
-- تغيير حالة حساب مستخدم (إنشاء صف profiles إن لم يوجد) — أدمن عادي لا يمس حسابات أخرى لها role admin
-- المسؤول الأعلى: البريد أدناه فقط يمكنه تعليق/حظر/تفعيل المدراء
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_account_status(
  p_target_user_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_admin boolean;
  v_target_role text;
  v_super boolean;
  v_caller_email text;
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('active', 'suspended', 'banned') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
  INTO v_caller_admin;

  IF NOT v_caller_admin THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_modify_self';
  END IF;

  SELECT lower(trim(email::text)) INTO v_caller_email FROM auth.users WHERE id = auth.uid();
  v_super := (v_caller_email = lower(trim('mshaeili0111@gmail.com')));

  SELECT p.role INTO v_target_role
  FROM public.profiles p
  WHERE p.id = p_target_user_id;

  IF COALESCE(v_target_role, 'user') = 'admin' AND NOT v_super THEN
    RAISE EXCEPTION 'only_super_admin_can_manage_admin_accounts';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_user_id) THEN
    UPDATE public.profiles
    SET
      is_active = (p_status = 'active'),
      account_status = p_status,
      updated_at = now()
    WHERE id = p_target_user_id;
  ELSE
    INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role, is_active, account_status)
    SELECT
      u.id,
      COALESCE(
        NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
        NULLIF(TRIM(SPLIT_PART(COALESCE(u.email::text, ''), '@', 1)), ''),
        'مستخدم'
      ),
      NULL,
      NULL,
      u.email::text,
      'user',
      (p_status = 'active'),
      p_status
    FROM auth.users u
    WHERE u.id = p_target_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_account_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- قائمة المدراء — للمسؤول الأعلى فقط (نفس البريد)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  is_active boolean,
  account_status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_super boolean;
  v_email text;
BEGIN
  SELECT lower(trim(email::text)) INTO v_email FROM auth.users WHERE id = auth.uid();
  v_super := (v_email = lower(trim('mshaeili0111@gmail.com')));

  IF NOT v_super THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    COALESCE(p.full_name, '')::text,
    p.role::text,
    COALESCE(p.is_active, true),
    COALESCE(NULLIF(TRIM(p.account_status), ''), 'active')::text,
    COALESCE(p.created_at, u.created_at)
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE p.role = 'admin'
  ORDER BY COALESCE(p.created_at, u.created_at) DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_admins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_admins() TO authenticated;
