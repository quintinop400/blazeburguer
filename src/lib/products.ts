import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  emoji: string;
  badge?: string;
  rating: number;
  prepTime: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  image_url?: string | null;
};

type ProductRow = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | string;
  old_price: number | string | null;
  emoji: string | null;
  badge: string | null;
  rating: number | string;
  prep_time: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  image_url: string | null;
};

const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  category_id: r.category_id,
  name: r.name,
  description: r.description ?? "",
  price: Number(r.price),
  oldPrice: r.old_price != null ? Number(r.old_price) : undefined,
  emoji: r.emoji ?? "🍔",
  badge: r.badge ?? undefined,
  rating: Number(r.rating),
  prepTime: r.prep_time ?? "20-30 min",
  stock: r.stock,
  is_active: r.is_active,
  is_featured: r.is_featured,
  image_url: r.image_url || getFallbackProductImage(r.name, r.description ?? "", r.badge ?? ""),
});

function getFallbackProductImage(name: string, description: string, badge: string) {
  const text = `${name} ${description} ${badge}`.toLowerCase();

  const fallbacks: Array<{ pattern: RegExp; url: string }> = [
    {
      pattern: /\b(smash|hamb(?:u|ú)rguer|burger|x-bacon|x ?burger|x ?burguer|cheddar|bacon|picanha|costela)\b/i,
      url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
    },
    {
      pattern: /\b(pizza|calabresa|mussarela|portuguesa|napolitana|marguerita|margherita|4 queijos|quatro queijos)\b/i,
      url: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=1200&q=80",
    },
    {
      pattern: /\b(port(?:a|ã)o|porcao|porção|batata|fritas|onion|pizza\s?sticks|tira|palito)\b/i,
      url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80",
    },
    {
      pattern: /\b(bebida|refrigerante|coca|fanta|sprite|suco|agua|água|cerveja|milkshake|drink|chá|cha|juice)\b/i,
      url: "https://images.unsplash.com/photo-1542444459-db9fe97f90f0?auto=format&fit=crop&w=1200&q=80",
    },
    {
      pattern: /\b(sobremesa|doce|brownie|sorvete|pudim|torta|cheesecake|churros|milkshake)\b/i,
      url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
    },
    {
      pattern: /\b(combo|kit|duplo|familiar|promo(ç|c)(?:ão|ao)|combo)\b/i,
      url: "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  for (const fallback of fallbacks) {
    if (fallback.pattern.test(text)) return fallback.url;
  }

  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchProducts(opts?: { category?: string; featured?: boolean; includeInactive?: boolean }): Promise<Product[]> {
  let q = supabase.from("products").select("*").order("sort_order");
  if (!opts?.includeInactive) q = q.eq("is_active", true);
  if (opts?.featured) q = q.eq("is_featured", true);
  if (opts?.category && opts.category !== "all") {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", opts.category).single();
    if (cat) q = q.eq("category_id", cat.id);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => toProduct(r as ProductRow));
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toProduct(data as ProductRow) : null;
}

export async function fetchProductsByCategoryId(categoryId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(r => toProduct(r as ProductRow));
}
