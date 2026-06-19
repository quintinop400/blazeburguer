import { useState } from "react";
import { X, Image as ImageIcon, Download, Eye } from "lucide-react";
import { MediaPicker } from "@/components/MediaPicker";

type Asset = { id: string; url: string; name: string; mime_type: string | null; storage_path: string; category_id?: string };

export function MediaSelector({
  open,
  onClose,
  onSelect,
  title = "Selecionar imagem",
  description = "Escolha uma imagem para usar",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  title?: string;
  description?: string;
}) {
  const [selectedMedia, setSelectedMedia] = useState<Asset | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  function handleMediaSelected(asset: Asset) {
    setSelectedMedia(asset);
    setShowPicker(false);
  }

  function handleConfirm() {
    if (selectedMedia) {
      onSelect(selectedMedia);
      onClose();
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
        <div
          className="w-full max-w-2xl space-y-6 rounded-3xl border border-border bg-card p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <h2 className="font-display text-2xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {selectedMedia ? (
            <div className="space-y-4">
              {/* Preview */}
              <div className="overflow-hidden rounded-2xl border border-border bg-slate-950/5">
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  className="h-64 w-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="truncate font-semibold">{selectedMedia.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">URL</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-slate-950/5 p-2 font-mono text-xs">
                      {selectedMedia.url}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMedia.url);
                      }}
                      className="grid h-8 w-8 place-items-center rounded hover:bg-card"
                      title="Copiar URL"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedMedia(null);
                    setShowPicker(true);
                  }}
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold transition hover:border-brand hover:text-brand"
                >
                  <ImageIcon className="inline h-4 w-4 mr-2" /> Escolher outra
                </button>
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="rounded-xl border border-brand/20 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand transition hover:bg-brand/20"
                >
                  <Eye className="inline h-4 w-4 mr-2" /> Pré-visualizar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl gradient-flame px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                >
                  Confirmar
                </button>
              </div>
            </div>
          ) : showPicker ? (
            <MediaPicker
              open={true}
              onClose={() => setShowPicker(false)}
              onPick={handleMediaSelected}
            />
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowPicker(true)}
                className="w-full rounded-2xl border border-dashed border-border bg-surface/50 py-12 text-center transition hover:border-brand hover:bg-surface"
              >
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-semibold">Selecionar imagem</p>
                <p className="text-xs text-muted-foreground">Clique para abrir a biblioteca de mídia</p>
              </button>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded hover:bg-card"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && selectedMedia && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <img
            src={selectedMedia.url}
            alt={selectedMedia.name}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl"
          />
        </div>
      )}
    </>
  );
}
