-- Original / compare-at price (before discount). Final sale price stays in listings.price
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2) NULL
  CHECK (original_price IS NULL OR original_price >= 0);

COMMENT ON COLUMN public.listings.original_price IS 'Optional pre-discount price; must be >= price when both set (app validates)';

-- Mirror auth email into profiles for admin visibility (sync on signup + email change)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', null),
    COALESCE(NEW.raw_user_meta_data ->> 'whatsapp', null),
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_email_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_profile_email_from_auth();

-- Match sale buyer_phone to profile phone/whatsapp (last 10 digits)
CREATE OR REPLACE FUNCTION public.phone_last10_match(a TEXT, b TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  da TEXT := regexp_replace(COALESCE(a, ''), '\D', '', 'g');
  db TEXT := regexp_replace(COALESCE(b, ''), '\D', '', 'g');
BEGIN
  IF length(da) < 10 OR length(db) < 10 THEN
    RETURN FALSE;
  END IF;
  RETURN right(da, 10) = right(db, 10);
END;
$$;

-- Listings: buyers matched by phone on sale (replaces email-only match; keeps buyer_id + email match for legacy)
DROP POLICY IF EXISTS "listings_read_approved" ON public.listings;
CREATE POLICY "listings_read_approved" ON public.listings FOR SELECT
  USING (
    status = 'approved'
    OR seller_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.listing_id = listings.id
        AND (
          s.buyer_id = auth.uid()
          OR (
            s.buyer_email IS NOT NULL
            AND (auth.jwt() ->> 'email') IS NOT NULL
            AND lower(trim(s.buyer_email)) = lower(trim((auth.jwt() ->> 'email')::text))
          )
          OR (
            public.phone_last10_match(s.buyer_phone, (SELECT phone FROM public.profiles WHERE id = auth.uid()))
            OR public.phone_last10_match(s.buyer_phone, (SELECT whatsapp FROM public.profiles WHERE id = auth.uid()))
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can view relevant sales" ON public.sales;
CREATE POLICY "Users can view relevant sales"
  ON public.sales FOR SELECT
  TO authenticated
  USING (
    seller_id = auth.uid()
    OR buyer_id = auth.uid()
    OR (
      buyer_email IS NOT NULL
      AND (auth.jwt() ->> 'email') IS NOT NULL
      AND lower(trim(buyer_email)) = lower(trim((auth.jwt() ->> 'email')::text))
    )
    OR (
      public.phone_last10_match(buyer_phone, (SELECT phone FROM public.profiles WHERE id = auth.uid()))
      OR public.phone_last10_match(buyer_phone, (SELECT whatsapp FROM public.profiles WHERE id = auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Reports: admin UPDATE needs WITH CHECK (fixes silent failures on some Postgres versions)
DROP POLICY IF EXISTS "reports_admin_update" ON public.reports;
CREATE POLICY "reports_admin_update" ON public.reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Optional: backfill emails from auth (run once if needed; requires privileged access)
-- UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND (p.email IS NULL OR p.email = '');
