-- Ensure current authenticated user has a row in public.profiles.
-- This is used by user actions that depend on FK to profiles (listings, favorites, reports, orders).

CREATE OR REPLACE FUNCTION public.ensure_my_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_jwt jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_user_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role)
  SELECT
    u.id,
    COALESCE(
      NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
      NULLIF(TRIM(SPLIT_PART(COALESCE(u.email::text, ''), '@', 1)), ''),
      'مستخدم'
    ),
    NULLIF(TRIM(u.raw_user_meta_data ->> 'phone'), ''),
    NULLIF(TRIM(u.raw_user_meta_data ->> 'whatsapp'), ''),
    NULLIF(TRIM(u.email::text), ''),
    'user'
  FROM auth.users u
  WHERE u.id = v_user_id
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_user_id) THEN
    RETURN;
  END IF;

  v_jwt := auth.jwt();
  IF v_jwt IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role)
    VALUES (
      v_user_id,
      COALESCE(
        NULLIF(TRIM(v_jwt #>> '{user_metadata,full_name}'), ''),
        NULLIF(TRIM(v_jwt #>> '{user_metadata,name}'), ''),
        NULLIF(TRIM(SPLIT_PART(COALESCE(NULLIF(TRIM(v_jwt ->> 'email'), ''), ''), '@', 1)), ''),
        'مستخدم'
      ),
      NULLIF(TRIM(v_jwt #>> '{user_metadata,phone}'), ''),
      NULLIF(TRIM(v_jwt #>> '{user_metadata,whatsapp}'), ''),
      NULLIF(TRIM(v_jwt ->> 'email'), ''),
      'user'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_user_id) THEN
    RAISE EXCEPTION 'profile_create_failed';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO authenticated;

