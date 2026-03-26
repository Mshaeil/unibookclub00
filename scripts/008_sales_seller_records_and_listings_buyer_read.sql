-- Buyer contact on sale (seller fills after deal)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_email TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_account TEXT;

-- One sale record per listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_one_sale_per_listing ON public.sales(listing_id);

-- NOTE: do not redefine handle_new_user here.
-- It is maintained in scripts/009_listing_discount_profile_email_rls_fixes.sql to also sync email.

-- Listings: buyers who appear on a sale can open the listing (e.g. to rate seller)
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
        )
    )
  );

-- Sales: only the seller can create a sale for their own available listing
DROP POLICY IF EXISTS "Users can insert sales when authenticated" ON public.sales;
CREATE POLICY "Seller inserts sale for own listing"
  ON public.sales FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.seller_id = auth.uid()
        AND l.status = 'approved'
        AND l.availability IN ('available', 'reserved')
    )
  );

-- Sales: buyers matched by email in JWT can see their purchases
DROP POLICY IF EXISTS "Users can view their own sales" ON public.sales;
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
    OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
