-- =============================================================================
-- UniBookClub — أداء إضافي: RPC للتقييمات + فهارس طلبات لوحة المستخدم
-- نفّذ في Supabase SQL Editor بعد 020_orders_cart_points.sql وما قبله.
-- =============================================================================

-- متوسط التقييم وعدد المراجعات في استعلام واحد (بدلاً من جلب مئات الصفوف في التطبيق)
CREATE OR REPLACE FUNCTION public.get_seller_rating_stats(p_seller_id uuid)
RETURNS TABLE(avg_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
PARALLEL SAFE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(AVG(rating::numeric), 0)::numeric AS avg_rating,
    COUNT(*)::bigint AS review_count
  FROM public.seller_reviews
  WHERE seller_id = p_seller_id;
$$;

REVOKE ALL ON FUNCTION public.get_seller_rating_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_seller_rating_stats(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_seller_rating_stats(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_seller_rating_stats(uuid) IS
  'Used by book detail page; respects RLS on seller_reviews.';

-- صفحة /dashboard/orders: فلترة buyer أو seller + ترتيب بالتاريخ
CREATE INDEX IF NOT EXISTS idx_orders_buyer_created_at
  ON public.orders (buyer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_seller_created_at
  ON public.orders (seller_id, created_at DESC);
