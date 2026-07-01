-- =============================================================================
-- UniBookClub — Storage bucket + سياسات الرفع
-- نفّذ في SQL Editor بعد إنشاء bucket من الواجهة (أو استخدم هذا)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- رفع: المستخدم المسجّل لمجلده فقط
DROP POLICY IF EXISTS "listing_images_insert_own" ON storage.objects;
CREATE POLICY "listing_images_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = 'listings'
    AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
  );

-- قراءة: المستخدم يرى ملفاته (للتحميل الموقّع من الخادم)
DROP POLICY IF EXISTS "listing_images_select_own" ON storage.objects;
CREATE POLICY "listing_images_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = 'listings'
    AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
  );

-- حذف: المستخدم يحذف ملفاته
DROP POLICY IF EXISTS "listing_images_delete_own" ON storage.objects;
CREATE POLICY "listing_images_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = 'listings'
    AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
  );

-- الخادم (service role) يقرأ كل الملفات عبر createPublicSupabaseClient / signed URLs
-- لا تفعّل public على الـ bucket
