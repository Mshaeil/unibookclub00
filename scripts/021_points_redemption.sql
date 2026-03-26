-- Points redemption for order discount (offsite payment)
-- Requires scripts/020_orders_cart_points.sql
-- Discount scale: 100 points = 1.00 JOD

CREATE OR REPLACE FUNCTION public.redeem_points_for_order(
  p_order_id uuid,
  p_points int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_order record;
  v_balance int;
  v_redeemed int;
  v_max_points int;
  v_use int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'invalid_points';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_order.buyer_id <> v_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_order.status IN ('cancelled', 'received') THEN
    RAISE EXCEPTION 'order_closed';
  END IF;

  v_balance := public.get_points_balance(v_user_id);

  IF p_points > v_balance THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;

  SELECT COALESCE(-SUM(delta_points), 0)::int INTO v_redeemed
  FROM public.points_ledger
  WHERE user_id = v_user_id
    AND order_id = p_order_id
    AND reason = 'order_discount_redeem';

  v_max_points := floor(COALESCE(v_order.price, 0) * 100)::int;
  IF v_max_points < 0 THEN v_max_points := 0; END IF;

  v_use := LEAST(p_points, GREATEST(v_max_points - v_redeemed, 0));
  IF v_use <= 0 THEN
    RAISE EXCEPTION 'redeem_limit_reached';
  END IF;

  INSERT INTO public.points_ledger(user_id, order_id, delta_points, reason)
  VALUES (v_user_id, p_order_id, -v_use, 'order_discount_redeem');

  RETURN v_use;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_points_for_order(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_points_for_order(uuid, int) TO authenticated;

