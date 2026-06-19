import { useMemo, useRef, useState } from "react";
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
  const { data: assets = [] } = useMediaAssets(selectedCategory || undefined, query);
  const deleteMediaMutation = useDeleteMediaAsset();

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesQuery =
        query.trim().length === 0
          ? true
          : asset.name.toLowerCase().includes(query.toLowerCase()) || asset.url.toLowerCase().includes(query.toLowerCase());
      return matchesQuery;
    });
  }, [assets, query]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        await uploadMedia(f, selectedCategory);
      }
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso`);
      qc.invalidateQueries({ queryKey: ["media_assets"] });
    } catch (e) {
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
          {filteredAssets.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-muted-foreground">
              <div>
                <ImageIcon className="mx-auto h-10 w-10 opacity-50" />
                <p className="mt-2 text-sm">Nenhum arquivo encontrado.</p>
                <p className="text-sm">Use o upload para adicionar novos arquivos.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`group relative overflow-hidden rounded-2xl border-2 transition ${
                    selectedAsset?.id === asset.id
                      ? "border-brand bg-brand/10"
                      : "border-border hover:border-brand"
                  }`}
                >
                  <div className="aspect-square bg-slate-950/5">
                    {asset.mime_type?.startsWith("video") ? (
                      <video src={asset.url} muted className="h-full w-full object-cover" />
                    ) : (
                      <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/80 to-transparent p-2 text-left text-xs text-white opacity-0 transition group-hover:opacity-100">
                    <div className="truncate font-semibold">{asset.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Painel de Detalhes */}
      {selectedAsset && (
        <div className="flex flex-col border-l border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display text-sm font-bold">Detalhes</h3>
            <button onClick={() => setSelectedAsset(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-card">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Preview */}
            <div className="rounded-2xl border border-border bg-card p-3">
              {selectedAsset.mime_type?.startsWith("video") ? (
                <video src={selectedAsset.url} controls className="w-full rounded-xl" />
              ) : (
                <img src={selectedAsset.url} alt={selectedAsset.name} className="w-full rounded-xl" />
              )}
            </div>

            {/* Info */}
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-muted-foreground">Nome</p>
                <p className="truncate font-semibold">{selectedAsset.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-semibold">{selectedAsset.mime_type || "Desconhecido"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-card/50 p-2 font-mono text-[9px]">{selectedAsset.url}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedAsset.url);
                      toast.success("URL copiada");
                    }}
                    className="grid h-8 w-8 place-items-center rounded hover:bg-card"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => handleDeleteAsset(selectedAsset)}
              disabled={deleteMediaMutation.isPending}
              className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-500/20 disabled:opacity-60"
            >
              {deleteMediaMutation.isPending ? "Deletando..." : "Deletar"}
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
