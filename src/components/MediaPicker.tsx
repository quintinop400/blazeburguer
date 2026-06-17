import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, X, Image as ImageIcon, Loader2, Search, Video, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/uploads";
import { useMediaCategories } from "@/hooks/useMedia";

type Asset = { id: string; url: string; name: string; mime_type: string | null; storage_path: string; category_id?: string };

type AssetFilter = "all" | "image" | "video";

export function MediaPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (a: Asset) => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: categories = [] } = useMediaCategories();

  const { data: assets = [] } = useQuery({
    queryKey: ["media_assets", selectedCategory, query],
    queryFn: async () => {
      let q = supabase.from("media_assets").select("*");

      if (selectedCategory) {
        q = q.eq("category_id", selectedCategory);
      }

      const { data } = await q.order("created_at", { ascending: false });
      return (data ?? []).map((r) => ({
        id: r.id,
        url: r.public_url ?? r.url ?? "",
        name: r.filename ?? r.name ?? "",
        mime_type: r.mime_type,
        storage_path: r.path ?? r.storage_path,
        category_id: r.category_id,
      })) as Asset[];
    },
    enabled: open,
  });

  const filteredAssets = useMemo(() =>
    assets.filter((asset) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "image"
            ? asset.mime_type?.startsWith("image")
            : asset.mime_type?.startsWith("video");
      const matchesQuery =
        query.trim().length === 0
          ? true
          : asset.name.toLowerCase().includes(query.toLowerCase()) || asset.url.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    }),
    [assets, filter, query]
  );

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) await uploadMedia(f, selectedCategory || undefined);
      toast.success("Upload concluído");
      qc.invalidateQueries({ queryKey: ["media_assets"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Biblioteca de mídia</h2>
            <p className="text-sm text-muted-foreground">Selecione uma imagem ou vídeo para o produto.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-11 items-center gap-2 rounded-xl gradient-flame px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
            </button>
            <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface hover:border-brand">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Categorias Horizontais */}
        <div className="border-b border-border bg-card/50 p-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                selectedCategory === null
                  ? "gradient-flame text-white"
                  : "border border-border bg-surface text-muted-foreground hover:border-brand"
              }`}
            >
              <FolderOpen className="h-3 w-3" /> Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                  selectedCategory === cat.id
                    ? "gradient-flame text-white"
                    : "border border-border bg-surface text-muted-foreground hover:border-brand"
                }`}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nome ou URL"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(["all", "image", "video"] as AssetFilter[]).map(value => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === value ? "gradient-flame text-white" : "border border-border bg-surface text-muted-foreground hover:border-brand"}`}
              >
                {value === "all" ? "Todos" : value === "image" ? "Imagens" : "Vídeos"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {filteredAssets.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-muted-foreground">
              <div>
                <ImageIcon className="mx-auto h-10 w-10 opacity-50" />
                <p className="mt-2 text-sm">Nenhum arquivo encontrado.</p>
                <p className="text-sm">Use a busca ou altere o filtro para localizar ativos existentes.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredAssets.map(a => (
                <button
                  key={a.id}
                  onClick={() => { onPick(a); onClose(); }}
                  className="group relative overflow-hidden rounded-3xl border border-border bg-surface transition hover:border-brand"
                >
                  <div className="aspect-square bg-slate-950/5">
                    {a.mime_type?.startsWith("video") ? (
                      <video src={a.url} muted className="h-full w-full object-cover" />
                    ) : (
                      <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 rounded-b-3xl bg-gradient-to-t from-black/80 to-transparent p-3 text-left text-xs text-white opacity-0 transition group-hover:opacity-100">
                    <div className="truncate font-semibold">{a.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-white/80">
                      <Video className="h-3 w-3" /> {a.mime_type?.startsWith("video") ? "Vídeo" : "Imagem"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>
    </div>
  );
}
