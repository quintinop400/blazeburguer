import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, Loader2, Copy, Search, Image as ImageIcon, Video, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia, deleteMedia } from "@/lib/uploads";

export const Route = createFileRoute("/_authenticated/admin/midia")({ component: Page });

type Asset = { id: string; url: string; name: string; mime_type: string | null; storage_path: string; size_bytes: number | null; created_at: string };
type AssetFilter = "all" | "image" | "video";

function Page() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AssetFilter>("all");

  const { data: assets = [] } = useQuery({
    queryKey: ["media_assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_assets")
        .select("id,public_url,path,filename,mime_type,size_bytes,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        url: r.public_url ?? "",
        name: r.filename ?? "",
        mime_type: r.mime_type,
        storage_path: r.path,
        size_bytes: r.size_bytes,
        created_at: r.created_at,
      })) as Asset[];
    },
  });

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "image"
            ? asset.mime_type?.startsWith("image")
            : asset.mime_type?.startsWith("video");
      const matchesQuery = query.trim().length === 0
        ? true
        : asset.name.toLowerCase().includes(query.toLowerCase()) || asset.url.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [assets, filter, query]);

  const imageCount = assets.filter(a => a.mime_type?.startsWith("image")).length;
  const videoCount = assets.filter(a => a.mime_type?.startsWith("video")).length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) await uploadMedia(f);
      toast.success(`${files.length} arquivo(s) enviado(s)`);
      qc.invalidateQueries({ queryKey: ["media_assets"] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function remove(a: Asset) {
    if (!confirm(`Excluir ${a.name}?`)) return;
    try {
      await deleteMedia(a);
      toast.success("Excluído");
      qc.invalidateQueries({ queryKey: ["media_assets"] });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Biblioteca de mídia</h1>
          <p className="text-sm text-muted-foreground">Envie, gerencie e insira imagens e vídeos diretamente nos produtos.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-11 items-center gap-2 rounded-xl gradient-flame px-4 font-display font-semibold text-white glow-brand disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Enviar arquivos
          </button>
          <button onClick={() => { setQuery(""); setFilter("all"); }} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:border-brand">
            <Sparkles className="h-4 w-4" /> Resetar filtros
          </button>
        </div>

        <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_280px]">
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nome ou URL"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between text-sm font-semibold text-muted-foreground">
                <span>Resumo</span>
                <span className="text-foreground">{assets.length}</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground"><ImageIcon className="h-3.5 w-3.5" /> Imagens</span>
                  <span className="font-semibold">{imageCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground"><Video className="h-3.5 w-3.5" /> Vídeos</span>
                  <span className="font-semibold">{videoCount}</span>
                </div>
                <div className="rounded-2xl bg-surface p-3 text-xs text-muted-foreground">
                  Mostrando <span className="font-semibold text-foreground">{filteredAssets.length}</span> de <span className="font-semibold text-foreground">{assets.length}</span> arquivos.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "image", "video"] as AssetFilter[]).map(value => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${filter === value ? "gradient-flame text-white glow-brand" : "border-border bg-card text-muted-foreground hover:border-brand"}`}
              >
                {value === "all" ? "Todos" : value === "image" ? "Imagens" : "Vídeos"}
              </button>
            ))}
          </div>

          {filteredAssets.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-16 text-center text-muted-foreground">
              <Upload className="mx-auto h-10 w-10" />
              <p className="mt-3 font-display text-lg font-semibold">Nenhum arquivo encontrado</p>
              <p className="text-sm">Ajuste o termo de busca ou altere o filtro para encontrar o arquivo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredAssets.map(a => (
                <div key={a.id} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:shadow-md">
                  <div className="relative aspect-square bg-slate-950/5">
                    {a.mime_type?.startsWith("video") ? (
                      <video src={a.url} muted className="h-full w-full object-cover" />
                    ) : (
                      <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
                      {a.mime_type?.startsWith("video") ? "Vídeo" : "Imagem"}
                    </span>
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground" title={a.name}>{a.name}</div>
                      <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")} • {a.size_bytes ? `${(a.size_bytes / 1024).toFixed(0)} KB` : "—"}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { navigator.clipboard.writeText(a.url); toast.success("URL copiada"); }}
                        className="flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-brand hover:text-foreground"
                        title="Copiar URL"
                      ><Copy className="h-3 w-3 mx-auto" /></button>
                      <button
                        onClick={() => remove(a)}
                        className="rounded-lg border border-destructive bg-destructive/10 px-2 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/20"
                        title="Excluir"
                      ><Trash2 className="h-3 w-3 mx-auto" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
