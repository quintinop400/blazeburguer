CREATE OR REPLACE FUNCTION public.get_customer_order_stats()
RETURNS TABLE(user_id uuid, order_count bigint, total_spent numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.user_id, COUNT(*)::bigint AS order_count, COALESCE(SUM(o.total),0)::numeric AS total_spent
  FROM public.orders o
  WHERE o.user_id IS NOT NULL
  GROUP BY o.user_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_customer_order_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_customer_order_stats() TO authenticated;