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
