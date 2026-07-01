-- =============================================================================
-- UniBookClub — دوال RPC (شغّل بعد 01_install.sql)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE email = lower(trim((auth.jwt() ->> 'email')::text))
  );
$$;

CREATE OR REPLACE FUNCTION public.get_platform_registered_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint FROM auth.users;
$$;

DROP FUNCTION IF EXISTS public.admin_list_registered_users();
CREATE FUNCTION public.admin_list_registered_users()
RETURNS TABLE (
  id uuid, full_name text, phone text, whatsapp text, role text,
  is_active boolean, account_status text, created_at timestamptz, email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    COALESCE(NULLIF(TRIM(p.full_name), ''), NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
      NULLIF(TRIM(SPLIT_PART(COALESCE(u.email::text, ''), '@', 1)), ''), 'مستخدم')::text,
    p.phone::text, p.whatsapp::text,
    COALESCE(p.role, 'user')::text,
    COALESCE(p.is_active, true),
    COALESCE(NULLIF(TRIM(p.account_status), ''), 'active')::text,
    COALESCE(p.created_at, u.created_at),
    u.email::text
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE public.is_admin()
  ORDER BY COALESCE(p.created_at, u.created_at) DESC
  LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION public.admin_promote_by_email(target_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF target_email IS NULL OR trim(target_email) = '' THEN RETURN 0; END IF;
  UPDATE public.profiles p SET role = 'admin'
  FROM auth.users u
  WHERE u.id = p.id AND lower(trim(u.email::text)) = lower(trim(target_email));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_account_status(p_target_user_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_target_role text;
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('active', 'suspended', 'banned') THEN RAISE EXCEPTION 'invalid_status'; END IF;
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF p_target_user_id = (SELECT auth.uid()) THEN RAISE EXCEPTION 'cannot_modify_self'; END IF;
  SELECT p.role INTO v_target_role FROM public.profiles p WHERE p.id = p_target_user_id;
  IF COALESCE(v_target_role, 'user') = 'admin' AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'only_super_admin_can_manage_admin_accounts';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_user_id) THEN
    UPDATE public.profiles SET is_active = (p_status = 'active'), account_status = p_status, updated_at = now()
    WHERE id = p_target_user_id;
  ELSE
    INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role, is_active, account_status)
    SELECT u.id,
      COALESCE(NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''), NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
        NULLIF(TRIM(SPLIT_PART(COALESCE(u.email::text, ''), '@', 1)), ''), 'مستخدم'),
      NULL, NULL, u.email::text, 'user', (p_status = 'active'), p_status
    FROM auth.users u WHERE u.id = p_target_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS TABLE (id uuid, email text, full_name text, role text, is_active boolean, account_status text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT p.id, u.email::text, COALESCE(p.full_name, '')::text, p.role::text,
    COALESCE(p.is_active, true), COALESCE(NULLIF(TRIM(p.account_status), ''), 'active')::text,
    COALESCE(p.created_at, u.created_at)
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE p.role = 'admin'
  ORDER BY COALESCE(p.created_at, u.created_at) DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_target_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_target_role text;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_target_user_id = (SELECT auth.uid()) THEN RAISE EXCEPTION 'cannot_modify_self'; END IF;
  IF p_role IS NULL OR p_role NOT IN ('user', 'admin') THEN RAISE EXCEPTION 'invalid_role'; END IF;
  SELECT role INTO v_target_role FROM public.profiles WHERE id = p_target_user_id;
  IF p_role = 'user' AND COALESCE(v_target_role, 'user') <> 'admin' THEN RAISE EXCEPTION 'target_not_admin'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_user_id) THEN
    UPDATE public.profiles SET role = p_role, updated_at = now() WHERE id = p_target_user_id;
  ELSE
    INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role, is_active, account_status)
    SELECT u.id,
      COALESCE(NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''), 'مستخدم'),
      NULL, NULL, u.email::text, p_role, true, 'active'
    FROM auth.users u WHERE u.id = p_target_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_my_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_user_id uuid; v_jwt jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_user_id) THEN RETURN; END IF;
  INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role)
  SELECT u.id,
    COALESCE(NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''), NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
      NULLIF(TRIM(SPLIT_PART(COALESCE(u.email::text, ''), '@', 1)), ''), 'مستخدم'),
    NULLIF(TRIM(u.raw_user_meta_data ->> 'phone'), ''), NULLIF(TRIM(u.raw_user_meta_data ->> 'whatsapp'), ''),
    NULLIF(TRIM(u.email::text), ''), 'user'
  FROM auth.users u WHERE u.id = v_user_id
  ON CONFLICT (id) DO NOTHING;
  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_user_id) THEN RETURN; END IF;
  v_jwt := auth.jwt();
  IF v_jwt IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role)
    VALUES (v_user_id,
      COALESCE(NULLIF(TRIM(v_jwt #>> '{user_metadata,full_name}'), ''), NULLIF(TRIM(v_jwt #>> '{user_metadata,name}'), ''), 'مستخدم'),
      NULLIF(TRIM(v_jwt #>> '{user_metadata,phone}'), ''), NULLIF(TRIM(v_jwt #>> '{user_metadata,whatsapp}'), ''),
      NULLIF(TRIM(v_jwt ->> 'email'), ''), 'user')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_user_id) THEN RAISE EXCEPTION 'profile_create_failed'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_my_profile(
  p_full_name text, p_phone text DEFAULT NULL, p_whatsapp text DEFAULT NULL,
  p_faculty_id uuid DEFAULT NULL, p_major_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_user_id uuid; v_email text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  v_email := NULLIF(TRIM((auth.jwt() ->> 'email')::text), '');
  INSERT INTO public.profiles (id, full_name, phone, whatsapp, faculty_id, major_id, email, role)
  VALUES (v_user_id, COALESCE(NULLIF(TRIM(p_full_name), ''), 'مستخدم'),
    NULLIF(TRIM(p_phone), ''), NULLIF(TRIM(p_whatsapp), ''), p_faculty_id, p_major_id, v_email, 'user')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, whatsapp = EXCLUDED.whatsapp,
    faculty_id = EXCLUDED.faculty_id, major_id = EXCLUDED.major_id,
    email = COALESCE(EXCLUDED.email, public.profiles.email), updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_points_balance(p_user_id uuid DEFAULT auth.uid())
RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE(SUM(delta_points), 0)::int FROM public.points_ledger WHERE user_id = p_user_id; $$;

CREATE OR REPLACE FUNCTION public.get_seller_rating_stats(p_seller_id uuid)
RETURNS TABLE(avg_rating numeric, review_count bigint)
LANGUAGE sql STABLE PARALLEL SAFE SECURITY INVOKER SET search_path = public
AS $$
  SELECT COALESCE(AVG(rating::numeric), 0)::numeric, COUNT(*)::bigint
  FROM public.seller_reviews WHERE seller_id = p_seller_id;
$$;

CREATE OR REPLACE FUNCTION public.create_order_reserve_listing(
  p_listing_id uuid, p_fulfillment_type text, p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_user_id uuid; v_listing record; v_order_id uuid; v_jwt jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  PERFORM public.ensure_my_profile();
  IF p_fulfillment_type IS NULL OR p_fulfillment_type NOT IN ('campus_pickup', 'delivery') THEN
    RAISE EXCEPTION 'invalid_fulfillment';
  END IF;
  SELECT id, seller_id, price, status, availability INTO v_listing
  FROM public.listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'listing_not_found'; END IF;
  IF v_listing.status <> 'approved' THEN RAISE EXCEPTION 'listing_not_active'; END IF;
  IF COALESCE(v_listing.availability, 'available') <> 'available' THEN RAISE EXCEPTION 'listing_not_available'; END IF;
  IF v_listing.seller_id = v_user_id THEN RAISE EXCEPTION 'cannot_buy_own_listing'; END IF;
  INSERT INTO public.orders (listing_id, seller_id, buyer_id, status, fulfillment_type, delivery_note, price)
  VALUES (p_listing_id, v_listing.seller_id, v_user_id, 'reserved', p_fulfillment_type, NULLIF(TRIM(p_note), ''), v_listing.price)
  RETURNING id INTO v_order_id;
  UPDATE public.listings SET availability = 'reserved', updated_at = now() WHERE id = p_listing_id;
  INSERT INTO public.order_events(order_id, actor_id, from_status, to_status, note)
  VALUES (v_order_id, v_user_id, NULL, 'reserved', NULLIF(TRIM(p_note), ''));
  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.order_set_status(p_order_id uuid, p_next_status text, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user_id uuid; v_order record; v_prev text; v_points int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_next_status IS NULL OR p_next_status NOT IN ('reserved', 'in_delivery', 'delivered', 'received', 'cancelled') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  v_prev := v_order.status;
  IF v_user_id <> v_order.buyer_id AND v_user_id <> v_order.seller_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_next_status = 'in_delivery' AND (v_user_id <> v_order.seller_id OR v_prev NOT IN ('reserved')) THEN RAISE EXCEPTION 'invalid_transition'; END IF;
  IF p_next_status = 'delivered' AND (v_user_id <> v_order.seller_id OR v_prev NOT IN ('reserved', 'in_delivery')) THEN RAISE EXCEPTION 'invalid_transition'; END IF;
  IF p_next_status = 'received' AND (v_user_id <> v_order.buyer_id OR v_prev NOT IN ('delivered', 'in_delivery')) THEN RAISE EXCEPTION 'invalid_transition'; END IF;
  IF p_next_status = 'cancelled' AND v_prev IN ('received', 'cancelled') THEN RAISE EXCEPTION 'invalid_transition'; END IF;
  UPDATE public.orders SET status = p_next_status WHERE id = p_order_id;
  INSERT INTO public.order_events(order_id, actor_id, from_status, to_status, note)
  VALUES (p_order_id, v_user_id, v_prev, p_next_status, NULLIF(TRIM(p_note), ''));
  IF p_next_status = 'cancelled' THEN
    UPDATE public.listings SET availability = 'available', updated_at = now() WHERE id = v_order.listing_id;
  END IF;
  IF p_next_status = 'received' THEN
    UPDATE public.listings SET availability = 'sold', status = 'sold', updated_at = now() WHERE id = v_order.listing_id;
    v_points := GREATEST(floor(COALESCE(v_order.price, 0) * 5)::int, 0);
    IF NOT EXISTS (SELECT 1 FROM public.points_ledger pl WHERE pl.order_id = p_order_id AND pl.reason = 'order_received_earn') THEN
      INSERT INTO public.points_ledger(user_id, order_id, delta_points, reason) VALUES (v_order.buyer_id, p_order_id, v_points, 'order_received_earn');
      UPDATE public.orders SET points_earned = v_points WHERE id = p_order_id;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_points_for_order(p_order_id uuid, p_points int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user_id uuid; v_order record; v_balance int; v_redeemed int; v_max_points int; v_use int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_points IS NULL OR p_points <= 0 THEN RAISE EXCEPTION 'invalid_points'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.buyer_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_order.status IN ('cancelled', 'received') THEN RAISE EXCEPTION 'order_closed'; END IF;
  v_balance := public.get_points_balance(v_user_id);
  IF p_points > v_balance THEN RAISE EXCEPTION 'insufficient_points'; END IF;
  SELECT COALESCE(-SUM(delta_points), 0)::int INTO v_redeemed FROM public.points_ledger
  WHERE user_id = v_user_id AND order_id = p_order_id AND reason = 'order_discount_redeem';
  v_max_points := GREATEST(floor(COALESCE(v_order.price, 0) * 100)::int, 0);
  v_use := LEAST(p_points, GREATEST(v_max_points - v_redeemed, 0));
  IF v_use <= 0 THEN RAISE EXCEPTION 'redeem_limit_reached'; END IF;
  INSERT INTO public.points_ledger(user_id, order_id, delta_points, reason) VALUES (v_user_id, p_order_id, -v_use, 'order_discount_redeem');
  RETURN v_use;
END;
$$;

-- صلاحيات التنفيذ
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.get_platform_registered_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_registered_count() TO anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_list_registered_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_registered_users() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_promote_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_promote_by_email(text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_set_account_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_list_admins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_admins() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.ensure_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO authenticated;
REVOKE ALL ON FUNCTION public.upsert_my_profile(text, text, text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_my_profile(text, text, text, uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_points_balance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_points_balance(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_seller_rating_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_seller_rating_stats(uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.create_order_reserve_listing(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_reserve_listing(uuid, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.order_set_status(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.order_set_status(uuid, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.redeem_points_for_order(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_points_for_order(uuid, int) TO authenticated;
