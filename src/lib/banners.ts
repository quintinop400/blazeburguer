import { supabase } from "@/integrations/supabase/client";

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  cta_label: string | null;
  position: number;
  is_active: boolean;
};

export async function fetchBanners(_placement?: "home" | "menu"): Promise<Banner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("id,title,subtitle,image_url,link_url,cta_label,position,is_active")
    .eq("is_active", true)
    .order("position");
  if (error) throw error;
  return (data ?? []) as Banner[];
}
