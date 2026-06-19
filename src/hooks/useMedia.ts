import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MediaCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type MediaAsset = {
  id: string;
  url: string;
  name: string;
  mime_type: string | null;
  storage_path: string;
  category_id?: string;
  width?: number;
  height?: number;
  alt?: string;
  tags?: string[];
  created_at: string;
};

export function useMediaCategories() {
  return useQuery({
    queryKey: ["media_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_categories")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MediaCategory[];
    },
  });
}

export function useMediaAssets(categoryId?: string, searchQuery?: string) {
  return useQuery({
    queryKey: ["media_assets", categoryId, searchQuery],
    queryFn: async () => {
      let query = supabase.from("media_assets").select("*");

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (searchQuery) {
        query = query.or(`filename.ilike.%${searchQuery}%,alt.ilike.%${searchQuery}%`);
      }

        const { data, error } = await query.order("created_at", { ascending: false });
        console.log("[MEDIA_QUERY] Resposta do Supabase", { categoryId, searchQuery, count: data?.length, data, error });
      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        id: r.id,
        url: r.public_url ?? r.url ?? "",
        name: r.filename ?? r.name ?? "",
        mime_type: r.mime_type,
        storage_path: r.path ?? r.storage_path,
        category_id: r.category_id,
        width: r.width,
        height: r.height,
        alt: r.alt,
        tags: r.tags,
        created_at: r.created_at,
      })) as MediaAsset[];
    },
  });
}

export function useUpdateMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; category_id?: string; alt?: string; tags?: string[] }) => {
      const { error } = await supabase
        .from("media_assets")
        .update({
          category_id: updates.category_id,
          alt: updates.alt,
          tags: updates.tags,
        })
        .eq("id", updates.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media_assets"] });
    },
  });
}

export function useDeleteMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: { id: string; storage_path: string }) => {
      const { error: storageError } = await supabase.storage
        .from("media")
        .remove([asset.storage_path]);
      if (storageError) throw storageError;

      const { error: rowError } = await supabase.from("media_assets").delete().eq("id", asset.id);
      if (rowError) throw rowError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media_assets"] });
    },
  });
}
