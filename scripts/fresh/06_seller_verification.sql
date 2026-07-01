-- تحقق البائع: بريد جامعي + صورة الهوية
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seller_status TEXT NOT NULL DEFAULT 'none'
    CHECK (seller_status IN ('none', 'pending', 'verified', 'rejected'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seller_university_email TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seller_id_image_path TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seller_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_seller_status ON public.profiles(seller_status);

-- سياسة رفع صور الهوية في storage (مسار seller-id/{user_id}/...)
DROP POLICY IF EXISTS "seller_id_insert_own" ON storage.objects;
CREATE POLICY "seller_id_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND split_part(name, '/', 1) = 'seller-id'
    AND split_part(name, '/', 2) = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "seller_id_select_own" ON storage.objects;
CREATE POLICY "seller_id_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND split_part(name, '/', 1) = 'seller-id'
    AND split_part(name, '/', 2) = (SELECT auth.uid()::text)
  );

SELECT '06_seller_verification.sql completed OK' AS status;
