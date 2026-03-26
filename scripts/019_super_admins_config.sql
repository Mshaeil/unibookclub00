-- Super admins configuration + safer admin account management
-- Run after scripts/016_account_status_super_admin.sql

-- ---------------------------------------------------------------------------
-- Table: super_admins
-- Add the emails that are allowed to manage admin accounts.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.super_admins (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Only admins can read the list (optional)
DROP POLICY IF EXISTS "super_admins_read_admin" ON public.super_admins;
CREATE POLICY "super_admins_read_admin"
  ON public.super_admins FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Only super-admins can modify the list
DROP POLICY IF EXISTS "super_admins_write_super" ON public.super_admins;
CREATE POLICY "super_admins_write_super"
  ON public.super_admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.super_admins sa
      WHERE sa.email = lower(trim((auth.jwt() ->> 'email')::text))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.super_admins sa
      WHERE sa.email = lower(trim((auth.jwt() ->> 'email')::text))
    )
  );

-- Seed suggestion (run manually, adjust email):
-- INSERT INTO public.super_admins(email) VALUES ('you@example.com') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Helper: super admin check
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE email = lower(trim((auth.jwt() ->> 'email')::text))
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- Patch: admin_set_account_status (super-admin required only when target is admin)
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

  SELECT p.role INTO v_target_role
  FROM public.profiles p
  WHERE p.id = p_target_user_id;

  IF COALESCE(v_target_role, 'user') = 'admin' AND NOT public.is_super_admin() THEN
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
-- Patch: admin_list_admins (super-admin only)
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
BEGIN
  IF NOT public.is_super_admin() THEN
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

