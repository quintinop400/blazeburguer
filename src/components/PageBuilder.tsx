import { useState, ReactNode } from "react";
import { GripVertical, Copy, Trash2, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PageBuilderSection<TKey extends string = string> {
  key: TKey;
  label: string;
  icon?: ReactNode;
  description?: string;
  preview?: ReactNode;
  isDuplicable?: boolean;
  isDeletable?: boolean;
  isVisible?: boolean;
}

interface PageBuilderProps<TKey extends string = string> {
  sections: PageBuilderSection<TKey>[];
  onReorder: (sections: TKey[]) => void;
  onDuplicate: (sectionKey: TKey) => void;
  onDelete: (sectionKey: TKey) => void;
  onToggleVisibility: (sectionKey: TKey, visible: boolean) => void;
  onPreview: () => void;
  canDelete?: (sectionKey: TKey) => boolean;
  previewContent?: ReactNode;
  isDragging?: boolean;
  isSaving?: boolean;
}

export function PageBuilder<TKey extends string = string>({
  sections,
  onReorder,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onPreview,
  canDelete = () => true,
  previewContent,
  isDragging = false,
  isSaving = false,
}: PageBuilderProps<TKey>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [localSections, setLocalSections] = useState(sections);

  // Sync local sections with props
  if (JSON.stringify(localSections) !== JSON.stringify(sections)) {
    setLocalSections(sections);
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(index: number, e: React.DragEvent) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...localSections];
    const draggedSection = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedSection);

    setLocalSections(newOrder);
    onReorder(newOrder.map((s) => s.key));
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleMove(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localSections.length) return;

    const newOrder = [...localSections];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

    setLocalSections(newOrder);
    onReorder(newOrder.map((s) => s.key));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">Layout das Seções</h3>
          <p className="text-sm text-muted-foreground">Arraste para reordenar, ou use os botões abaixo</p>
        </div>
        <Button onClick={onPreview} disabled={isSaving} variant="outline" className="gap-2">
          <Eye className="h-4 w-4" />
          Pré-visualizar
        </Button>
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
        {localSections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma seção disponível</p>
          </div>
        ) : (
          localSections.map((section, index) => (
            <div
              key={`${section.key}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(index, e)}
              onDrop={() => handleDrop(index)}
              onDragLeave={() => setDragOverIndex(null)}
              className={`group relative rounded-xl border-2 transition-all ${
                dragOverIndex === index
                  ? "border-brand bg-brand/5"
                  : draggedIndex === index
                    ? "border-brand/50 bg-brand/10 opacity-60"
                    : "border-border bg-surface hover:border-border/80"
              } ${isDragging ? "cursor-grabbing" : "cursor-grab"} p-4`}
            >
              {/* Drag handle and info */}
              <div className="flex items-start gap-3">
                <div className="mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="font-semibold">{section.label}</p>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                  {section.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{section.description}</p>
                  )}
                </div>

                {/* Visibility toggle */}
                <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm">
                  <input
                    type="checkbox"
                    checked={section.isVisible ?? true}
                    onChange={(e) => onToggleVisibility(section.key, e.target.checked)}
                    className="rounded border-border"
                    disabled={isSaving}
                  />
                  Ativo
                </label>
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => handleMove(index, "up")}
                  disabled={index === 0 || isSaving}
                  title="Mover para cima"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  Acima
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => handleMove(index, "down")}
                  disabled={index === localSections.length - 1 || isSaving}
                  title="Mover para baixo"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  Abaixo
                </Button>

                {section.isDuplicable !== false && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => onDuplicate(section.key)}
                    disabled={isSaving}
                    title="Duplicar seção"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Duplicar
                  </Button>
                )}

                {section.isDeletable !== false && canDelete(section.key) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteConfirm(section.key)}
                    disabled={isSaving}
                    title="Excluir seção"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </Button>
                )}
              </div>

              {/* Preview if available */}
              {section.preview && (
                <div className="mt-3 rounded-lg border border-border bg-background/40 p-2 text-xs text-muted-foreground max-h-16 overflow-hidden">
                  {section.preview}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Excluir seção?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir esta seção? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  onDelete(deleteConfirm as TKey);
                  setDeleteConfirm(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização da Home</DialogTitle>
            <DialogDescription>Veja como sua página ficará antes de publicar</DialogDescription>
          </DialogHeader>
          <div className="mt-6 rounded-xl border border-border overflow-hidden bg-background">
            {previewContent ? (
              previewContent
            ) : (
              <div className="p-8 text-center text-muted-foreground">Carregando pré-visualização...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper: Convert PageBuilder sections into display format
export function createPageBuilderSection<TKey extends string>(
  key: TKey,
  label: string,
  options?: {
    icon?: ReactNode;
    description?: string;
    preview?: ReactNode;
    isDuplicable?: boolean;
    isDeletable?: boolean;
    isVisible?: boolean;
  }
): PageBuilderSection<TKey> {
  return {
    key,
    label,
    ...options,
  };
}
