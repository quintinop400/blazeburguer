import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Copy, X, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/cart-store";
import { MediaPicker } from "@/components/MediaPicker";
import { generateProductDescription } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  component: ProductsAdmin,
});

type Row = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  emoji: string | null;
  badge: string | null;
  prep_time: string | null;
  is_active: boolean;
  is_featured: boolean;
  category_id: string | null;
  sort_order: number;
  image_url: string | null;
};

function ProductsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [quickImageEdit, setQuickImageEdit] = useState<Row | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const genDesc = useServerFn(generateProductDescription);

  const { data: products = [] } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("sort_order");
      if (error) throw error;
      return data as Row[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name").order("sort_order");
      return data ?? [];
    },
  });

  async function save() {
    if (!editing) return;
    if (!editing.name) return toast.error("Nome obrigatório");
    const payload = {
      name: editing.name,
      description: editing.description ?? null,
      price: Number(editing.price ?? 0),
      old_price: editing.old_price ? Number(editing.old_price) : null,
      stock: Number(editing.stock ?? 0),
      emoji: editing.emoji ?? "🍔",
      badge: editing.badge || null,
      prep_time: editing.prep_time ?? "20-30 min",
      category_id: editing.category_id ?? null,
      is_active: editing.is_active ?? true,
      is_featured: editing.is_featured ?? false,
      image_url: editing.image_url ?? null,
    };

    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Produto salvo");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["products"], exact: false });
    qc.invalidateQueries({ queryKey: ["categories"], exact: false });
  }

  async function aiDescribe() {
    if (!editing?.name) return toast.error("Preencha o nome primeiro");
    setAiLoading(true);
    try {
      const { description } = await genDesc({ data: { name: editing.name, hints: editing.badge ?? undefined } });
      setEditing({ ...editing, description });
      toast.success("Descrição gerada por IA");
    } catch (e) { toast.error((e as Error).message); }
    finally { setAiLoading(false); }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["products"], exact: false });
  }

  async function duplicate(p: Row) {
    const { id, ...rest } = p;
    void id;
    const { error } = await supabase.from("products").insert({ ...rest, name: `${rest.name} (cópia)` });
    if (error) return toast.error(error.message);
    toast.success("Duplicado");
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  }

  async function toggleActive(p: Row) {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["products"], exact: false });
  }

  async function replaceProductImage(productId: string, url: string) {
    const { error } = await supabase.from("products").update({ image_url: url }).eq("id", productId);
    if (error) return toast.error(error.message);
    toast.success("Imagem atualizada");
    setQuickImageEdit(null);
    setPickerOpen(false);
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["products"], exact: false });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} cadastrados</p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="flex h-11 items-center gap-2 rounded-xl gradient-flame px-4 font-display font-semibold text-white glow-brand"
        >
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Imagem</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-border hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <div className="overflow-hidden rounded-xl border border-border bg-surface">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-10 w-10 object-cover" />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center text-xl">{p.emoji}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.badge ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatBRL(Number(p.price))}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= 10 ? "font-bold text-flame" : ""}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)} className={`rounded-full px-3 py-1 text-xs font-bold ${
                      p.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-muted text-muted-foreground"
                    }`}>
                      {p.is_active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setQuickImageEdit(p); setPickerOpen(true); }} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface" aria-label="Substituir imagem"><ImageIcon className="h-4 w-4" /></button>
                      <button onClick={() => setEditing(p)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => duplicate(p)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface" aria-label="Duplicar"><Copy className="h-4 w-4" /></button>
                      <button onClick={() => remove(p.id)} className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{editing.id ? "Editar produto" : "Novo produto"}</h2>
              <button onClick={() => setEditing(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Imagem</span>
                {editing.image_url ? (
                  <div className="relative overflow-hidden rounded-xl border border-border">
                    <img src={editing.image_url} alt="" className="h-40 w-full object-cover" />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <button onClick={() => setPickerOpen(true)} className="rounded-lg bg-background/90 px-3 py-1.5 text-xs font-semibold">Trocar</button>
                      <button onClick={() => setEditing({ ...editing, image_url: null })} className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white">Remover</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setPickerOpen(true)} className="grid h-28 w-full place-items-center rounded-xl border border-dashed border-border text-sm font-semibold text-muted-foreground hover:border-brand hover:text-brand">
                    <ImageIcon className="mb-1 h-6 w-6" /> Selecionar imagem
                  </button>
                )}
                <p className="mt-2 text-xs text-muted-foreground">Clique em Trocar para selecionar outra imagem na biblioteca de mídia ou fazer upload de uma foto de produto profissional.</p>
              </div>

              <Field label="Nome" value={editing.name ?? ""} onChange={v => setEditing({ ...editing, name: v })} className="sm:col-span-2" />

              <div className="sm:col-span-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Descrição</span>
                  <button onClick={aiDescribe} disabled={aiLoading} type="button" className="inline-flex items-center gap-1 rounded-lg border border-brand/40 bg-brand/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-brand hover:bg-brand/20 disabled:opacity-60">
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Gerar com IA
                  </button>
                </div>
                <textarea value={editing.description ?? ""} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-surface p-3 text-sm outline-none focus:border-brand" />
              </div>
              <Field label="Emoji" value={editing.emoji ?? ""} onChange={v => setEditing({ ...editing, emoji: v })} />
              <Field label="Badge (ex: NOVO)" value={editing.badge ?? ""} onChange={v => setEditing({ ...editing, badge: v })} />
              <Field label="Preço" value={String(editing.price ?? "")} onChange={v => setEditing({ ...editing, price: Number(v) })} type="number" />
              <Field label="Preço antigo (opcional)" value={String(editing.old_price ?? "")} onChange={v => setEditing({ ...editing, old_price: Number(v) || null })} type="number" />
              <Field label="Estoque" value={String(editing.stock ?? 0)} onChange={v => setEditing({ ...editing, stock: Number(v) })} type="number" />
              <Field label="Tempo de preparo" value={editing.prep_time ?? ""} onChange={v => setEditing({ ...editing, prep_time: v })} />

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">Categoria</span>
                <select
                  value={editing.category_id ?? ""}
                  onChange={e => setEditing({ ...editing, category_id: e.target.value || null })}
                  className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
                >
                  <option value="">— sem categoria —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
                <span className="text-sm">Ativo</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editing.is_featured ?? false} onChange={e => setEditing({ ...editing, is_featured: e.target.checked })} />
                <span className="text-sm">Destaque (home)</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="h-11 rounded-xl border border-border px-4 text-sm font-medium hover:bg-surface">Cancelar</button>
              <button onClick={save} className="h-11 rounded-xl gradient-flame px-5 font-display font-semibold text-white glow-brand">Salvar</button>
            </div>
          </div>
        </div>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setQuickImageEdit(null);
        }}
        onPick={(a) => {
          if (quickImageEdit) {
            void replaceProductImage(quickImageEdit.id, a.url);
            return;
          }
          setEditing(prev => ({ ...prev, image_url: a.url }));
        }}
      />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", textarea, className = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean; className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className="rounded-lg border border-border bg-surface p-3 text-sm outline-none focus:border-brand" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand" />
      )}
    </label>
  );
}
