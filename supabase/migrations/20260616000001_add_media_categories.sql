-- Create media_categories table
CREATE TABLE public.media_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add category_id to media_assets
ALTER TABLE public.media_assets 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.media_categories(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_assets_category ON public.media_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON public.media_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_categories_slug ON public.media_categories(slug);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_categories TO authenticated;
GRANT ALL ON public.media_categories TO service_role;

-- Enable RLS
ALTER TABLE public.media_categories ENABLE ROW LEVEL SECURITY;

-- Policies for media_categories
CREATE POLICY "staff read categories" ON public.media_categories FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "staff manage categories" ON public.media_categories FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff update categories" ON public.media_categories FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff delete categories" ON public.media_categories FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- Insert default categories
INSERT INTO public.media_categories (name, slug, description, icon, order_index) VALUES
('Home', 'home', 'Imagens para a página inicial', '🏠', 0),
('Produtos', 'produtos', 'Fotos de produtos e cardápio', '🍔', 1),
('Promoções', 'promocoes', 'Banners e imagens de promoções', '🎯', 2),
('Sobre', 'sobre', 'Fotos da empresa e equipe', '👥', 3),
('Depoimentos', 'depoimentos', 'Fotos de clientes e depoimentos', '⭐', 4),
('Outros', 'outros', 'Outras imagens', '📁', 5)
ON CONFLICT (slug) DO NOTHING;
