-- Run this FIRST if 024_indexes_from_user_request.sql fails.
-- You should see one row per name below. If a row is missing, run scripts/001_create_schema.sql first.

SELECT 'listings' AS tbl, column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'listings'
  AND column_name IN ('status', 'created_at', 'availability')
ORDER BY column_name;

SELECT 'reports' AS tbl, column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reports'
  AND column_name IN ('reporter_id', 'listing_id')
ORDER BY column_name;

-- Existing indexes (check names before creating)
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('listings', 'reports', 'favorites')
ORDER BY tablename, indexname;
