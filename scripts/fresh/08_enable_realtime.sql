-- تفعيل Realtime لجدول الإعلانات (للتحديث الفوري والإشعارات)
-- إذا فشل: فعّل يدوياً من Database → Replication → listings

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN
    RAISE NOTICE 'Publication supabase_realtime not found — enable Replication in Supabase Dashboard for table listings';
END $$;

SELECT '08_enable_realtime.sql completed OK' AS status;
