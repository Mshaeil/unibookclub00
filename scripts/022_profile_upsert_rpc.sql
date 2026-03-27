-- Robust self-profile upsert via RPC (avoids client-side RLS mismatch issues)
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.upsert_my_profile(
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_whatsapp text DEFAULT NULL,
  p_faculty_id uuid DEFAULT NULL,
  p_major_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_email := NULLIF(TRIM((auth.jwt() ->> 'email')::text), '');

  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    whatsapp,
    faculty_id,
    major_id,
    email,
    role
  )
  VALUES (
    v_user_id,
    COALESCE(NULLIF(TRIM(p_full_name), ''), 'مستخدم'),
    NULLIF(TRIM(p_phone), ''),
    NULLIF(TRIM(p_whatsapp), ''),
    p_faculty_id,
    p_major_id,
    v_email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    faculty_id = EXCLUDED.faculty_id,
    major_id = EXCLUDED.major_id,
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_my_profile(text, text, text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_my_profile(text, text, text, uuid, uuid) TO authenticated;

