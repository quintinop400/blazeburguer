import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Image as ImageIcon, X } from "lucide-react";
import { MediaPicker } from "@/components/MediaPicker";

export function AdminInput({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
        />
      )}
    </label>
  );
}

export function SaveBar({ save, saving }: { save: () => Promise<void>; saving: boolean }) {
  async function onSave() {
    try {
      await save();
      toast.success("Página atualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    }
  }
  return (
    <div className="sticky bottom-4 z-10 flex justify-end">
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-11 items-center gap-2 rounded-xl gradient-flame px-5 font-display font-semibold text-white glow-brand disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar
      </button>
    </div>
  );
}

export function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function AdminImageField({
  label,
  value,
  onChange,
  className = "",
  placeholder = "https://...",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`block ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 flex gap-2">
        {value ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-0 top-0 grid h-4 w-4 place-items-center rounded-bl bg-background/80 text-destructive"
              aria-label="Remover imagem"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-dashed border-border bg-surface/40 text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:border-brand hover:text-brand"
        >
          <ImageIcon className="h-3.5 w-3.5" /> Mídia
        </button>
      </div>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={(a) => {
          onChange(a.url);
          setOpen(false);
        }}
      />
    </div>
  );
}

