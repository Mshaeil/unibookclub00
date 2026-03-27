-- Orders (reservations) + points ledger
-- Run after base schema + listings/sales scripts.

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'reserved',
  fulfillment_type text NOT NULL,
  delivery_note text NULL,
  price numeric NOT NULL CHECK (price >= 0),
  points_earned int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- One active order per listing (reserved/in_delivery/delivered). Allow history after completion/cancel.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_one_active_per_listing
  ON public.orders(listing_id)
  WHERE status IN ('reserved', 'in_delivery', 'delivered');

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_read_parties" ON public.orders;
CREATE POLICY "orders_read_parties"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- No direct INSERT/UPDATE from client; use RPCs below (security definer).
DROP POLICY IF EXISTS "orders_insert_none" ON public.orders;
CREATE POLICY "orders_insert_none"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "orders_update_none" ON public.orders;
CREATE POLICY "orders_update_none"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (false);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Order events (audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_status text NULL,
  to_status text NOT NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_events_read_parties" ON public.order_events;
CREATE POLICY "order_events_read_parties"
  ON public.order_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "order_events_insert_none" ON public.order_events;
CREATE POLICY "order_events_insert_none"
  ON public.order_events FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- Points ledger
-- Points scale: 100 points = 1.00 JOD discount (1 point = 0.01 JOD)
-- Earned points = floor(order_price * 5) (i.e. 5% of price * 100)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  delta_points int NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_user_id ON public.points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_order_id ON public.points_ledger(order_id);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "points_read_own" ON public.points_ledger;
CREATE POLICY "points_read_own"
  ON public.points_ledger FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "points_write_none" ON public.points_ledger;
CREATE POLICY "points_write_none"
  ON public.points_ledger FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- RPC: points balance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_points_balance(p_user_id uuid DEFAULT auth.uid())
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(delta_points), 0)::int
  FROM public.points_ledger
  WHERE user_id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_points_balance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_points_balance(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: Create order and reserve listing (atomic)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_reserve_listing(
  p_listing_id uuid,
  p_fulfillment_type text,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_listing record;
  v_order_id uuid;
  v_jwt jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Ensure buyer profile exists (orders.buyer_id FK -> profiles.id).
  -- 1) Prefer auth.users (full metadata). 2) Fallback auth.jwt() if SELECT inserted 0 rows.
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_user_id) THEN
    INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role)
    SELECT
      u.id,
      COALESCE(
        NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
        NULLIF(TRIM(SPLIT_PART(COALESCE(u.email::text, ''), '@', 1)), ''),
        'مستخدم'
      ),
      NULLIF(TRIM(u.raw_user_meta_data ->> 'phone'), ''),
      NULLIF(TRIM(u.raw_user_meta_data ->> 'whatsapp'), ''),
      NULLIF(TRIM(u.email::text), ''),
      'user'
    FROM auth.users u
    WHERE u.id = v_user_id
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_user_id) THEN
    v_jwt := auth.jwt();
    IF v_jwt IS NOT NULL THEN
      INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role)
      VALUES (
        v_user_id,
        COALESCE(
          NULLIF(TRIM(v_jwt #>> '{user_metadata,full_name}'), ''),
          NULLIF(TRIM(v_jwt #>> '{user_metadata,name}'), ''),
          NULLIF(TRIM(SPLIT_PART(COALESCE(NULLIF(TRIM(v_jwt ->> 'email'), ''), ''), '@', 1)), ''),
          'مستخدم'
        ),
        NULLIF(TRIM(v_jwt #>> '{user_metadata,phone}'), ''),
        NULLIF(TRIM(v_jwt #>> '{user_metadata,whatsapp}'), ''),
        NULLIF(TRIM(v_jwt ->> 'email'), ''),
        'user'
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_user_id) THEN
    RAISE EXCEPTION 'buyer_profile_missing: could not create profiles row; run SQL from scripts/020 or sign in again';
  END IF;

  IF p_fulfillment_type IS NULL OR p_fulfillment_type NOT IN ('campus_pickup', 'delivery') THEN
    RAISE EXCEPTION 'invalid_fulfillment';
  END IF;

  SELECT id, seller_id, price, status, availability
  INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF v_listing.status <> 'approved' THEN
    RAISE EXCEPTION 'listing_not_active';
  END IF;

  IF COALESCE(v_listing.availability, 'available') <> 'available' THEN
    RAISE EXCEPTION 'listing_not_available';
  END IF;

  IF v_listing.seller_id = v_user_id THEN
    RAISE EXCEPTION 'cannot_buy_own_listing';
  END IF;

  INSERT INTO public.orders (listing_id, seller_id, buyer_id, status, fulfillment_type, delivery_note, price)
  VALUES (p_listing_id, v_listing.seller_id, v_user_id, 'reserved', p_fulfillment_type, NULLIF(TRIM(p_note), ''), v_listing.price)
  RETURNING id INTO v_order_id;

  UPDATE public.listings
  SET availability = 'reserved', updated_at = now()
  WHERE id = p_listing_id;

  INSERT INTO public.order_events(order_id, actor_id, from_status, to_status, note)
  VALUES (v_order_id, v_user_id, NULL, 'reserved', NULLIF(TRIM(p_note), ''));

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_reserve_listing(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_reserve_listing(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: Update order status with simple rules + award points on received
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.order_set_status(
  p_order_id uuid,
  p_next_status text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_order record;
  v_prev text;
  v_points int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_next_status IS NULL OR p_next_status NOT IN ('reserved', 'in_delivery', 'delivered', 'received', 'cancelled') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  v_prev := v_order.status;

  -- party check
  IF v_user_id <> v_order.buyer_id AND v_user_id <> v_order.seller_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- basic transitions
  IF p_next_status = 'in_delivery' THEN
    IF v_user_id <> v_order.seller_id OR v_prev NOT IN ('reserved') THEN
      RAISE EXCEPTION 'invalid_transition';
    END IF;
  ELSIF p_next_status = 'delivered' THEN
    IF v_user_id <> v_order.seller_id OR v_prev NOT IN ('reserved', 'in_delivery') THEN
      RAISE EXCEPTION 'invalid_transition';
    END IF;
  ELSIF p_next_status = 'received' THEN
    IF v_user_id <> v_order.buyer_id OR v_prev <> 'delivered' THEN
      RAISE EXCEPTION 'invalid_transition';
    END IF;
  ELSIF p_next_status = 'cancelled' THEN
    -- Allow buyer/seller cancel before delivered
    IF v_prev IN ('received', 'cancelled') THEN
      RAISE EXCEPTION 'invalid_transition';
    END IF;
  END IF;

  UPDATE public.orders
  SET status = p_next_status
  WHERE id = p_order_id;

  INSERT INTO public.order_events(order_id, actor_id, from_status, to_status, note)
  VALUES (p_order_id, v_user_id, v_prev, p_next_status, NULLIF(TRIM(p_note), ''));

  -- release listing on cancel
  IF p_next_status = 'cancelled' THEN
    UPDATE public.listings
    SET availability = 'available', updated_at = now()
    WHERE id = v_order.listing_id;
  END IF;

  -- on received: mark listing sold + award points once
  IF p_next_status = 'received' THEN
    UPDATE public.listings
    SET availability = 'sold', status = 'sold', updated_at = now()
    WHERE id = v_order.listing_id;

    v_points := floor(COALESCE(v_order.price, 0) * 5)::int;
    IF v_points < 0 THEN v_points := 0; END IF;

    -- award only if not already awarded for this order
    IF NOT EXISTS (
      SELECT 1 FROM public.points_ledger pl
      WHERE pl.order_id = p_order_id AND pl.reason = 'order_received_earn'
    ) THEN
      INSERT INTO public.points_ledger(user_id, order_id, delta_points, reason)
      VALUES (v_order.buyer_id, p_order_id, v_points, 'order_received_earn');

      UPDATE public.orders SET points_earned = v_points WHERE id = p_order_id;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.order_set_status(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.order_set_status(uuid, text, text) TO authenticated;

