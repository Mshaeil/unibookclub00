-- =============================================================================
-- UniBookClub — Storage (شغّل بعد 03_seed.sql)
-- إذا فشل: أنشئ الـ bucket يدوياً من Storage → New bucket → listing-images (private)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "listing_images_insert_own" ON storage.objects;
CREATE POLICY "listing_images_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND split_part(name, '/', 1) = 'listings'
    AND split_part(name, '/', 2) = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "listing_images_select_own" ON storage.objects;
CREATE POLICY "listing_images_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND split_part(name, '/', 1) = 'listings'
    AND split_part(name, '/', 2) = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "listing_images_delete_own" ON storage.objects;
CREATE POLICY "listing_images_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND split_part(name, '/', 1) = 'listings'
    AND split_part(name, '/', 2) = (SELECT auth.uid()::text)
  );

SELECT '04_storage.sql completed OK' AS status;
