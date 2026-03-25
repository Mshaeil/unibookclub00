-- Promotional discount window: when set, strike-through / "خصم" shows only until this time.
-- NULL = no expiry (legacy listings behave as before).

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS discount_expires_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.listings.discount_expires_at IS
  'Promo discount (original_price vs price) visible until this instant; NULL means no time limit.';
