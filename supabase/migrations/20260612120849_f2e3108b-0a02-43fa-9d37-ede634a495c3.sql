
-- 1) Indexes + Realtime for order_reviews
CREATE INDEX IF NOT EXISTS idx_reviews_order ON public.order_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.order_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.order_reviews(rating);

ALTER TABLE public.order_reviews REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='order_reviews'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.order_reviews';
  END IF;
END $$;

-- Replace insert policy to enforce delivered + own order
DROP POLICY IF EXISTS "Users insert their own reviews" ON public.order_reviews;
CREATE POLICY "Users insert their own reviews"
  ON public.order_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.user_id = auth.uid()
        AND o.status = 'delivered'
    )
  );

-- 2) coupon_id in orders + trigger
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_coupon ON public.orders(coupon_id);

CREATE OR REPLACE FUNCTION public.increment_coupon_used_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.coupon_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.coupon_id IS DISTINCT FROM NEW.coupon_id) THEN
    UPDATE public.coupons SET used_count = used_count + 1 WHERE id = NEW.coupon_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_order_coupon_increment ON public.orders;
CREATE TRIGGER trg_order_coupon_increment
  AFTER INSERT OR UPDATE OF coupon_id ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.increment_coupon_used_count();

-- 3) Default settings
INSERT INTO public.settings (key, value) VALUES
('business_hours', '{
  "enabled": false,
  "closed_message": "Estamos fechados no momento. Volte em breve!",
  "schedule": {
    "0": {"open": false},
    "1": {"open": true, "from": "11:00", "to": "22:00"},
    "2": {"open": true, "from": "11:00", "to": "22:00"},
    "3": {"open": true, "from": "11:00", "to": "22:00"},
    "4": {"open": true, "from": "11:00", "to": "22:00"},
    "5": {"open": true, "from": "11:00", "to": "23:00"},
    "6": {"open": true, "from": "11:00", "to": "23:00"}
  }
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.settings (key, value) VALUES
('whatsapp_number', '"5511999999999"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4) Dashboard functions
CREATE OR REPLACE FUNCTION public.get_revenue_by_day(days_back INT DEFAULT 7)
RETURNS TABLE(day DATE, revenue NUMERIC, order_count BIGINT)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DATE(created_at) AS day,
         COALESCE(SUM(total), 0) AS revenue,
         COUNT(*) AS order_count
  FROM public.orders
  WHERE created_at >= (CURRENT_DATE - days_back)
    AND status != 'cancelled'
  GROUP BY DATE(created_at)
  ORDER BY day ASC;
$$;
GRANT EXECUTE ON FUNCTION public.get_revenue_by_day(INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_top_products(limit_count INT DEFAULT 5, days_back INT DEFAULT 30)
RETURNS TABLE(product_name TEXT, total_quantity BIGINT, total_revenue NUMERIC)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT oi.product_name,
         SUM(oi.quantity)::BIGINT AS total_quantity,
         SUM(oi.subtotal)::NUMERIC AS total_revenue
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.created_at >= (CURRENT_DATE - days_back)
    AND o.status != 'cancelled'
  GROUP BY oi.product_name
  ORDER BY total_quantity DESC
  LIMIT limit_count;
$$;
GRANT EXECUTE ON FUNCTION public.get_top_products(INT, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_today_metrics()
RETURNS JSON LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'orders_today', COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE),
    'revenue_today', COALESCE(SUM(total) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status != 'cancelled'), 0),
    'avg_ticket_today', COALESCE(AVG(total) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status != 'cancelled'), 0),
    'orders_month', COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)),
    'cancelled_week', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - 7 AND status = 'cancelled'),
    'total_week', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - 7)
  )
  FROM public.orders;
$$;
GRANT EXECUTE ON FUNCTION public.get_today_metrics() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_status_distribution_today()
RETURNS TABLE(status TEXT, count BIGINT)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT status::TEXT, COUNT(*)::BIGINT AS count
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE
  GROUP BY status;
$$;
GRANT EXECUTE ON FUNCTION public.get_status_distribution_today() TO authenticated;

-- 5) Public tracking by order_number
GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.order_items TO anon;

DROP POLICY IF EXISTS "public track by order_number" ON public.orders;
CREATE POLICY "public track by order_number" ON public.orders
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon read order items" ON public.order_items;
CREATE POLICY "anon read order items" ON public.order_items
  FOR SELECT TO anon USING (true);
