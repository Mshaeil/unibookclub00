-- Fix: conversations_buyer_id_fkey when auth user has no profiles row yet.
-- Run in Supabase SQL Editor after 012.

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_listing_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  sid uuid;
  cid uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Ensure caller has a profiles row (FK: conversations.buyer_id -> profiles.id)
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = uid) THEN
    INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role)
    SELECT
      au.id,
      COALESCE(
        NULLIF(TRIM(au.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(TRIM(au.raw_user_meta_data ->> 'name'), ''),
        NULLIF(TRIM(SPLIT_PART(COALESCE(au.email, ''), '@', 1)), ''),
        'مستخدم'
      ),
      NULLIF(TRIM(au.raw_user_meta_data ->> 'phone'), ''),
      NULLIF(TRIM(au.raw_user_meta_data ->> 'whatsapp'), ''),
      au.email,
      'user'
    FROM auth.users au
    WHERE au.id = uid
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      full_name = CASE
        WHEN TRIM(COALESCE(public.profiles.full_name, '')) IN ('', 'مستخدم')
        THEN COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), public.profiles.full_name)
        ELSE public.profiles.full_name
      END;
  END IF;

  SELECT seller_id INTO sid FROM public.listings WHERE id = p_listing_id;
  IF sid IS NULL THEN
    RAISE EXCEPTION 'listing not found';
  END IF;
  IF sid = uid THEN
    RAISE EXCEPTION 'cannot message yourself';
  END IF;

  SELECT c.id INTO cid
  FROM public.conversations c
  WHERE c.listing_id = p_listing_id AND c.buyer_id = uid;

  IF cid IS NOT NULL THEN
    RETURN cid;
  END IF;

  INSERT INTO public.conversations (listing_id, buyer_id, seller_id)
  VALUES (p_listing_id, uid, sid)
  RETURNING id INTO cid;

  RETURN cid;
END;
$$;
