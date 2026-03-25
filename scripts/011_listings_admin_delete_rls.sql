-- Ensure admins can DELETE any listing (and sellers their own).
-- If an old DB was missing the admin branch, DELETE affected 0 rows with no error.
DROP POLICY IF EXISTS "listings_delete_own" ON public.listings;

CREATE POLICY "listings_delete_own" ON public.listings FOR DELETE
  USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
