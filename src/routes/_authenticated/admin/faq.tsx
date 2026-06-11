import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/faq")({
  component: FaqAdmin,
});

type Row = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

function FaqAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["admin", "faq_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("id,question,answer,sort_order,is_active")
        .order("sort_order");
      if (error) throw error;
      return data as Row[];
    },
  });

  async function save() {
    if (!editing) return;
    if (!editing.question?.trim()) return toast.error("Pergunta obrigatória");
    if (!editing.answer?.trim()) return toast.error("Resposta obrigatória");
    setSaving(true);
    const payload = {
      question: editing.question.trim(),
      answer: editing.answer.trim(),
      sort_order: Number(editing.sort_order ?? 0),
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("faq_items").update(payload).eq("id", editing.id)
      : await supabase.from("faq_items").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("FAQ salva");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin", "faq_items"] });
    qc.invalidateQueries({ queryKey: ["faqs", "public"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta pergunta?")) return;
    const { error } = await supabase.from("faq_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    qc.invalidateQueries({ queryKey: ["admin", "faq_items"] });
    qc.invalidateQueries({ queryKey: ["faqs", "public"] });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">FAQ</h1>
          <p className="text-sm text-muted-foreground">Gerencie as perguntas frequentes do site.</p>
        </div>
        <button
          onClick={() => setEditing({ is_active: true, sort_order: rows.length })}
          className="inline-flex h-10 items-center gap-2 rounded-lg gradient-flame px-4 text-sm font-semibold text-white glow-brand"
        >
          <Plus className="h-4 w-4" /> Nova pergunta
        </button>
      </div>

      <div className="space-y-2">
        {rows.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Nenhuma FAQ cadastrada ainda.
          </div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-xs font-semibold text-muted-foreground">
              #{r.sort_order}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-display font-semibold">{r.question}</p>
                {!r.is_active && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    Inativa
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.answer}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => setEditing(r)} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:border-brand hover:text-brand" aria-label="Editar">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(r.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive hover:text-destructive-foreground" aria-label="Excluir">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 backdrop-blur-sm">
          <div className="mx-auto my-8 w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl sm:my-12">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">
                {editing.id ? "Editar pergunta" : "Nova pergunta"}
              </h2>
              <button onClick={() => setEditing(null)} className="rounded-md p-2 hover:bg-surface" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pergunta</span>
                <input
                  value={editing.question ?? ""}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                  className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resposta</span>
                <textarea
                  value={editing.answer ?? ""}
                  onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ordem</span>
                  <input
                    type="number"
                    value={editing.sort_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                    className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
                  />
                </label>
                <label className="mt-6 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_active ?? true}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  />
                  Ativa (visível no site)
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface">
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-lg gradient-flame px-5 text-sm font-semibold text-white glow-brand disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
