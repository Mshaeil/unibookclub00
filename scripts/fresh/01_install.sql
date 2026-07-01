-- =============================================================================
-- UniBookClub — تثبيت نظيف (مشروع Supabase جديد)
-- نفّذ هذا الملف مرة واحدة في: SQL Editor → New query → Run
-- لا تشغّله على قاعدة فيها بيانات إنتاج إلا إذا كنت تريد مسح كل شيء (انظر README)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- أنواع ENUM
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('pending_review', 'approved', 'rejected', 'sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE book_condition AS ENUM ('new', 'like_new', 'good', 'acceptable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE listing_availability AS ENUM ('available', 'reserved', 'sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE listing_item_type AS ENUM ('original', 'notes', 'reference', 'summary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM ('inappropriate', 'spam', 'fake', 'offensive', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- جداول أساسية
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.majors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  major_id UUID NOT NULL REFERENCES public.majors(id) ON DELETE CASCADE,
  code TEXT,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  faculty_id UUID REFERENCES public.faculties(id) ON DELETE SET NULL,
  major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  edition TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  original_price DECIMAL(10, 2) CHECK (original_price IS NULL OR original_price >= 0),
  discount_expires_at TIMESTAMPTZ,
  condition book_condition NOT NULL DEFAULT 'good',
  item_type listing_item_type NOT NULL DEFAULT 'original',
  negotiable BOOLEAN NOT NULL DEFAULT FALSE,
  availability listing_availability NOT NULL DEFAULT 'available',
  whatsapp TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  faculty_id UUID REFERENCES public.faculties(id) ON DELETE SET NULL,
  major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  status listing_status NOT NULL DEFAULT 'pending_review',
  rejection_reason TEXT,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  details TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_email TEXT,
  buyer_account TEXT,
  reference_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_one_sale_per_listing ON public.sales(listing_id);

CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reviewer_id, listing_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'reserved',
  fulfillment_type TEXT NOT NULL,
  delivery_note TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  points_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_one_active_per_listing
  ON public.orders(listing_id)
  WHERE status IN ('reserved', 'in_delivery', 'delivered');

CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  delta_points INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.super_admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- فهارس الأداء (مهمة للتصفح السريع)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_majors_faculty ON public.majors(faculty_id);
CREATE INDEX IF NOT EXISTS idx_courses_major ON public.courses(major_id);
CREATE INDEX IF NOT EXISTS idx_profiles_faculty ON public.profiles(faculty_id);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON public.listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_approved_browse ON public.listings(created_at DESC) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_listings_availability ON public.listings(availability);
CREATE INDEX IF NOT EXISTS idx_listings_faculty ON public.listings(faculty_id);
CREATE INDEX IF NOT EXISTS idx_listings_course ON public.listings(course_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing ON public.favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_listing ON public.reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_sales_listing ON public.sales(listing_id);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON public.sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_buyer ON public.sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller ON public.seller_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_listing ON public.seller_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_created ON public.orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_created ON public.orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON public.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_points_user ON public.points_ledger(user_id);

-- ---------------------------------------------------------------------------
-- دوال مساعدة
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.phone_last10_match(a TEXT, b TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    length(regexp_replace(COALESCE(a, ''), '\D', '', 'g')) >= 10
    AND length(regexp_replace(COALESCE(b, ''), '\D', '', 'g')) >= 10
    AND right(regexp_replace(COALESCE(a, ''), '\D', '', 'g'), 10)
      = right(regexp_replace(COALESCE(b, ''), '\D', '', 'g'), 10);
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role, faculty_id, major_id)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''), NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''), 'مستخدم'),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'phone'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'whatsapp'), ''),
    NEW.email,
    'user',
    CASE
      WHEN COALESCE(TRIM(NEW.raw_user_meta_data ->> 'faculty_id'), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      THEN (TRIM(NEW.raw_user_meta_data ->> 'faculty_id'))::uuid
      ELSE NULL
    END,
    CASE
      WHEN COALESCE(TRIM(NEW.raw_user_meta_data ->> 'major_id'), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      THEN (TRIM(NEW.raw_user_meta_data ->> 'major_id'))::uuid
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = CASE
      WHEN COALESCE(TRIM(public.profiles.full_name), '') IN ('', 'مستخدم')
      THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END;
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_profile_email_from_auth();

DROP TRIGGER IF EXISTS update_faculties_updated_at ON public.faculties;
CREATE TRIGGER update_faculties_updated_at BEFORE UPDATE ON public.faculties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_majors_updated_at ON public.majors;
CREATE TRIGGER update_majors_updated_at BEFORE UPDATE ON public.majors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_listings_updated_at ON public.listings;
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faculties_read_all" ON public.faculties;
CREATE POLICY "faculties_read_all" ON public.faculties FOR SELECT USING (true);
DROP POLICY IF EXISTS "faculties_admin_insert" ON public.faculties;
DROP POLICY IF EXISTS "faculties_admin_update" ON public.faculties;
DROP POLICY IF EXISTS "faculties_admin_delete" ON public.faculties;
DROP POLICY IF EXISTS "faculties_admin_write" ON public.faculties;
CREATE POLICY "faculties_admin_insert" ON public.faculties FOR INSERT
  WITH CHECK (public.is_admin());
CREATE POLICY "faculties_admin_update" ON public.faculties FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "faculties_admin_delete" ON public.faculties FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "majors_read_all" ON public.majors;
CREATE POLICY "majors_read_all" ON public.majors FOR SELECT USING (true);
DROP POLICY IF EXISTS "majors_admin_insert" ON public.majors;
DROP POLICY IF EXISTS "majors_admin_update" ON public.majors;
DROP POLICY IF EXISTS "majors_admin_delete" ON public.majors;
DROP POLICY IF EXISTS "majors_admin_write" ON public.majors;
CREATE POLICY "majors_admin_insert" ON public.majors FOR INSERT
  WITH CHECK (public.is_admin());
CREATE POLICY "majors_admin_update" ON public.majors FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "majors_admin_delete" ON public.majors FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "courses_read_all" ON public.courses;
CREATE POLICY "courses_read_all" ON public.courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "courses_admin_insert" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_update" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_delete" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_write" ON public.courses;
CREATE POLICY "courses_admin_insert" ON public.courses FOR INSERT
  WITH CHECK (public.is_admin());
CREATE POLICY "courses_admin_update" ON public.courses FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "courses_admin_delete" ON public.courses FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "listings_read_approved" ON public.listings;
CREATE POLICY "listings_read_approved" ON public.listings FOR SELECT USING (
  status = 'approved'
  OR seller_id = (SELECT auth.uid())
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.listing_id = listings.id
      AND (
        s.buyer_id = (SELECT auth.uid())
        OR (
          s.buyer_email IS NOT NULL
          AND (auth.jwt() ->> 'email') IS NOT NULL
          AND lower(trim(s.buyer_email)) = lower(trim(auth.jwt() ->> 'email'))
        )
        OR public.phone_last10_match(s.buyer_phone, (SELECT phone FROM public.profiles WHERE id = (SELECT auth.uid())))
        OR public.phone_last10_match(s.buyer_phone, (SELECT whatsapp FROM public.profiles WHERE id = (SELECT auth.uid())))
      )
  )
);
DROP POLICY IF EXISTS "listings_insert_own" ON public.listings;
CREATE POLICY "listings_insert_own" ON public.listings FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = seller_id);
DROP POLICY IF EXISTS "listings_update_own" ON public.listings;
CREATE POLICY "listings_update_own" ON public.listings FOR UPDATE
  USING (seller_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "listings_delete_own" ON public.listings;
CREATE POLICY "listings_delete_own" ON public.listings FOR DELETE
  USING (seller_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "favorites_read_own" ON public.favorites;
CREATE POLICY "favorites_read_own" ON public.favorites FOR SELECT USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "reports_read_own" ON public.reports;
CREATE POLICY "reports_read_own" ON public.reports FOR SELECT
  USING (reporter_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = reporter_id);
DROP POLICY IF EXISTS "reports_admin_update" ON public.reports;
CREATE POLICY "reports_admin_update" ON public.reports FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Seller inserts sale for own listing" ON public.sales;
CREATE POLICY "Seller inserts sale for own listing" ON public.sales FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.seller_id = (SELECT auth.uid())
        AND l.status = 'approved' AND l.availability IN ('available', 'reserved')
    )
  );
DROP POLICY IF EXISTS "Users can view relevant sales" ON public.sales;
CREATE POLICY "Users can view relevant sales" ON public.sales FOR SELECT TO authenticated
  USING (
    seller_id = (SELECT auth.uid())
    OR buyer_id = (SELECT auth.uid())
    OR (
      buyer_email IS NOT NULL AND (auth.jwt() ->> 'email') IS NOT NULL
      AND lower(trim(buyer_email)) = lower(trim(auth.jwt() ->> 'email'))
    )
    OR public.phone_last10_match(buyer_phone, (SELECT phone FROM public.profiles WHERE id = (SELECT auth.uid())))
    OR public.phone_last10_match(buyer_phone, (SELECT whatsapp FROM public.profiles WHERE id = (SELECT auth.uid())))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "seller_reviews_insert" ON public.seller_reviews;
CREATE POLICY "seller_reviews_insert" ON public.seller_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "seller_reviews_read" ON public.seller_reviews;
CREATE POLICY "seller_reviews_read" ON public.seller_reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "orders_read_parties" ON public.orders;
CREATE POLICY "orders_read_parties" ON public.orders FOR SELECT TO authenticated
  USING (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "orders_insert_none" ON public.orders;
CREATE POLICY "orders_insert_none" ON public.orders FOR INSERT TO authenticated WITH CHECK (false);
DROP POLICY IF EXISTS "orders_update_none" ON public.orders;
CREATE POLICY "orders_update_none" ON public.orders FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS "order_events_read_parties" ON public.order_events;
CREATE POLICY "order_events_read_parties" ON public.order_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.buyer_id = (SELECT auth.uid()) OR o.seller_id = (SELECT auth.uid()))
    ) OR public.is_admin()
  );
DROP POLICY IF EXISTS "order_events_insert_none" ON public.order_events;
CREATE POLICY "order_events_insert_none" ON public.order_events FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "points_read_own" ON public.points_ledger;
CREATE POLICY "points_read_own" ON public.points_ledger FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "points_write_none" ON public.points_ledger;
CREATE POLICY "points_write_none" ON public.points_ledger FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "super_admins_read_admin" ON public.super_admins;
CREATE POLICY "super_admins_read_admin" ON public.super_admins FOR SELECT TO authenticated
  USING (public.is_admin());

SELECT '01_install.sql completed OK' AS status;
