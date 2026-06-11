import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  component: CategoriesAdmin,
});

type Cat = { id: string; name: string; slug: string; emoji: string | null; sort_order: number; is_active: boolean };

function CategoriesAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Cat> | null>(null);
  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories", "full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Cat[];
    },
  });

  async function save() {
    if (!editing) return;
    if (!editing.name || !editing.slug) return toast.error("Nome e slug obrigatórios");
    const payload = {
      name: editing.name,
      slug: editing.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      emoji: editing.emoji ?? null,
      sort_order: Number(editing.sort_order ?? 0),
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir categoria? Produtos ficarão sem categoria.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categorias</p>
        </div>
        <button onClick={() => setEditing({ is_active: true, sort_order: categories.length + 1 })} className="flex h-11 items-center gap-2 rounded-xl gradient-flame px-4 font-display font-semibold text-white glow-brand">
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(c => (
          <div key={c.id} className="group rounded-2xl border border-border bg-card p-4 transition hover:border-brand/50 hover:bg-card/80">
            <div className="flex items-start justify-between mb-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface text-2xl group-hover:bg-brand/20 transition">{c.emoji || "📁"}</div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(c)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface transition" title="Editar"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(c.id)} className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10 transition" title="Excluir"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold line-clamp-1">{c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
              <div className="flex items-center gap-2 pt-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                  {c.is_active ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{editing.id ? "Editar" : "Nova categoria"}</h2>
              <button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid gap-3">
              <Inp label="Nome" v={editing.name ?? ""} on={v => setEditing({ ...editing, name: v })} />
              <Inp label="Slug" v={editing.slug ?? ""} on={v => setEditing({ ...editing, slug: v })} />
              <Inp label="Emoji" v={editing.emoji ?? ""} on={v => setEditing({ ...editing, emoji: v })} />
              <Inp label="Ordem" v={String(editing.sort_order ?? 0)} on={v => setEditing({ ...editing, sort_order: Number(v) })} type="number" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_active ?? true} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /> Ativo</label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="h-10 rounded-xl border border-border px-4 text-sm">Cancelar</button>
              <button onClick={save} className="h-10 rounded-xl gradient-flame px-4 font-semibold text-white">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Inp({ label, v, on, type = "text" }: { label: string; v: string; on: (s: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input value={v} onChange={e => on(e.target.value)} type={type} className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand" />
    </label>
  );
}
