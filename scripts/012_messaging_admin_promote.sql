-- Admin: promote user to admin by email
-- This script was previously used for in-app messaging. Messaging has been removed.
-- Keep only admin_promote_by_email, used by AdminSecurityPanel in the app.

CREATE OR REPLACE FUNCTION public.admin_promote_by_email(target_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF target_email IS NULL OR trim(target_email) = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.profiles p
  SET role = 'admin'
  FROM auth.users u
  WHERE u.id = p.id
    AND lower(trim(u.email::text)) = lower(trim(target_email));

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_promote_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_promote_by_email(text) TO authenticated;
