import { useMemo, useRef, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, Image as ImageIcon, Loader2, Search, Video, FolderOpen, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/uploads";
import { useMediaAssets, useMediaCategories, useDeleteMediaAsset } from "@/hooks/useMedia";

type Asset = { id: string; url: string; name: string; mime_type: string | null; storage_path: string; category_id?: string };

export function MediaLibrary() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  const { data: categories = [] } = useMediaCategories();
  const { data: assets = [], isLoading, error } = useMediaAssets(selectedCategory || undefined, query);
  const deleteMediaMutation = useDeleteMediaAsset();

  // AUDIT LOGS
  useEffect(() => {
    console.log("[AUDIT] Hook data received", {
      categoriesCount: categories.length,
      assetsCount: assets.length,
      isLoading,
      error,
      selectedCategory,
      query,
      assets: assets,
    });
  }, [assets, categories, isLoading, error, selectedCategory, query]);

  const filteredAssets = useMemo(() => {
    const filtered = assets.filter((asset) => {
      const matchesQuery =
        query.trim().length === 0
          ? true
          : asset.name.toLowerCase().includes(query.toLowerCase()) || asset.url.toLowerCase().includes(query.toLowerCase());
      return matchesQuery;
    });
    console.log("[AUDIT] Filtered assets", { totalAssets: assets.length, filteredCount: filtered.length, filtered });
    return filtered;
  }, [assets, query]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    console.log("[UPLOAD] Starting upload for files", { count: files.length, selectedCategory });
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        console.log(`[UPLOAD] Uploading file: ${f.name}`);
        await uploadMedia(f, selectedCategory);
      }
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso`);
      console.log("[UPLOAD] All files uploaded, invalidating query");
      qc.invalidateQueries({ queryKey: ["media_assets"] });
    } catch (e) {
      console.error("[UPLOAD] Error during upload", e);
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleDeleteAsset(asset: Asset) {
    if (confirm("Tem certeza que deseja deletar este arquivo?")) {
      deleteMediaMutation.mutate(
        { id: asset.id, storage_path: asset.storage_path },
        {
          onSuccess: () => {
            toast.success("Arquivo deletado com sucesso");
            setSelectedAsset(null);
          },
          onError: (e) => toast.error((e as Error).message),
        }
      );
    }
  }

  return (
    <div className="grid h-screen grid-cols-1 gap-6 overflow-hidden md:grid-cols-[350px_1fr]">
      {/* Sidebar de Categorias */}
      <div className="flex flex-col border-r border-border bg-surface">
        <div className="border-b border-border p-4">
          <h2 className="font-display text-lg font-bold">Categorias</h2>
          <p className="text-xs text-muted-foreground">Organize suas imagens</p>
        </div>

        <div className="flex-1 overflow-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full px-4 py-3 text-left text-sm transition ${
              selectedCategory === null
                ? "border-l-4 border-brand bg-brand/10 font-semibold text-brand"
                : "border-l-4 border-transparent hover:bg-card/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" /> Todos os arquivos
            </div>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full px-4 py-3 text-left text-sm transition ${
                selectedCategory === cat.id
                  ? "border-l-4 border-brand bg-brand/10 font-semibold text-brand"
                  : "border-l-4 border-transparent hover:bg-card/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span> {cat.name}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {assets.filter((a) => a.category_id === cat.id).length} itens
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Galeria Principal */}
      <div className="flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Biblioteca de Mídia</h2>
            <p className="text-sm text-muted-foreground">Gerencie suas imagens e vídeos</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-11 items-center gap-2 rounded-xl gradient-flame px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-border bg-card/50 p-4">
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>

        {/* Galeria */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="grid h-full place-items-center text-center text-muted-foreground">
              <div>
                <Loader2 className="mx-auto h-10 w-10 animate-spin opacity-50" />
                <p className="mt-2 text-sm">Carregando...</p>
              </div>
            </div>
          ) : error ? (
            <div className="grid h-full place-items-center text-center text-destructive">
              <div>
                <p className="mt-2 text-sm">Erro ao carregar: {(error as Error).message}</p>
              </div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-muted-foreground">
              <div>
                <ImageIcon className="mx-auto h-10 w-10 opacity-50" />
                <p className="mt-2 text-sm">Nenhum arquivo encontrado.</p>
                <p className="text-xs">Total de assets no hook: {assets.length}</p>
                <p className="text-sm">Use o upload para adicionar novos arquivos.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition hover:border-brand ${
                    selectedAsset?.id === asset.id ? "border-brand shadow-lg" : "border-border"
                  }`}
                >
                  {asset.mime_type?.startsWith("image") ? (
                    <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Asset Details Panel */}
        {selectedAsset && (
          <div className="border-t border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2 text-sm">
                <p>
                  <strong>Nome:</strong> {selectedAsset.name}
                </p>
                <p>
                  <strong>Tipo:</strong> {selectedAsset.mime_type}
                </p>
                <p>
                  <strong>ID:</strong> {selectedAsset.id}
                </p>
                <p className="break-all text-xs text-muted-foreground">
                  <strong>URL:</strong> {selectedAsset.url}
                </p>
              </div>
              <div className="flex gap-2">
                <a href={selectedAsset.url} download target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-card p-2 hover:bg-card/80">
                  <Download className="h-4 w-4" />
                </a>
                <button onClick={() => handleDeleteAsset(selectedAsset)} className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive hover:bg-destructive/20">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => handleFiles(e.currentTarget.files)}
        className="hidden"
      />
    </div>
  );
}
