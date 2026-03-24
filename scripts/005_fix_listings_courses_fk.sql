-- Fix PostgREST relationship discovery for listings -> courses
-- Apply this in Supabase SQL Editor on the target database.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'listings'
      AND column_name = 'course_id'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'courses'
      AND column_name = 'id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'listings_course_id_fkey'
    ) THEN
      ALTER TABLE public.listings
      ADD CONSTRAINT listings_course_id_fkey
      FOREIGN KEY (course_id)
      REFERENCES public.courses(id)
      ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;
