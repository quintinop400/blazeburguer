
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.banners REPLICA IDENTITY FULL;
ALTER TABLE public.coupons REPLICA IDENTITY FULL;
ALTER TABLE public.settings REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.categories; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.banners;    EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;    EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;   EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
