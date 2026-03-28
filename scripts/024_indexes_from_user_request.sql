-- =============================================================================
-- UniBookClub - optional indexes (Supabase: SQL Editor -> paste -> Run)
-- If this fails, run 024_diagnose_indexes.sql first and read the error message.
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_listings_status_created_at ON public.listings (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listings_availability ON public.listings (availability);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports (reporter_id);

-- =============================================================================
-- Optional: full list you asked for (creates EXTRA btree on same columns as 001)
-- Only use if you prefer these names; safe but wastes space vs idx_listings_seller etc.
-- =============================================================================
-- CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings (seller_id);
-- CREATE INDEX IF NOT EXISTS idx_listings_course_id ON public.listings (course_id);
-- CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);
-- CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON public.favorites (listing_id);
-- CREATE INDEX IF NOT EXISTS idx_reports_listing_id ON public.reports (listing_id);
