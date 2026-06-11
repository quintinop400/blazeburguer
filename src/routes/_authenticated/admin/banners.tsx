import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/banners")({ component: Page });

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  cta_label: string | null;
  position: number;
  is_active: boolean;
};

function emptyBanner(): Partial<Banner> {
  return { is_active: true, position: 0 };
}

function Page() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);

  const { data: banners = [] } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id,title,subtitle,image_url,link_url,cta_label,position,is_active")
        .order("position");
      if (error) throw error;
      return data as Banner[];
    },
  });

  async function save() {
    if (!editing) return;
    if (!editing.title) return toast.error("Título obrigatório");
    const payload = {
      title: editing.title,
      subtitle: editing.subtitle || null,
      image_url: editing.image_url || null,
      link_url: editing.link_url || null,
      cta_label: editing.cta_label || null,
      position: Number(editing.position ?? 0),
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("banners").update(payload).eq("id", editing.id)
      : await supabase.from("banners").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Banner salvo");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir banner?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  }

  async function toggle(b: Banner) {
    await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Banners</h1>
          <p className="text-sm text-muted-foreground">Promoções em destaque na home</p>
        </div>
        <button onClick={() => setEditing(emptyBanner())} className="flex h-11 items-center gap-2 rounded-xl gradient-flame px-4 font-display font-semibold text-white glow-brand">
          <Plus className="h-4 w-4" /> Novo banner
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-brand/50">
            <div className="relative aspect-[16/9] bg-surface">
              {b.image_url
                ? <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
                : <div className="grid h-full place-items-center text-muted-foreground"><ImageIcon className="h-10 w-10 opacity-50" /></div>}
              <button onClick={() => toggle(b)} className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold transition ${b.is_active ? "bg-emerald-500/90 text-white" : "bg-muted text-muted-foreground"}`}>
                {b.is_active ? "Ativo" : "Inativo"}
              </button>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <h3 className="font-display font-bold line-clamp-1">{b.title}</h3>
                {b.subtitle && <p className="line-clamp-1 text-xs text-muted-foreground">{b.subtitle}</p>}
              </div>
              <div className="flex justify-end gap-1">
                <button onClick={() => setEditing(b)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(b.id)} className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
            <ImageIcon className="mx-auto h-10 w-10 opacity-50" />
            <p className="mt-2 text-sm">Crie seu primeiro banner.</p>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{editing.id ? "Editar banner" : "Novo banner"}</h2>
              <button onClick={() => setEditing(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <F label="Título" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} className="sm:col-span-2" />
              <F label="Subtítulo" value={editing.subtitle ?? ""} onChange={(v) => setEditing({ ...editing, subtitle: v })} />
              <F label="Texto do botão" value={editing.cta_label ?? ""} onChange={(v) => setEditing({ ...editing, cta_label: v })} />
              <F label="URL da imagem" value={editing.image_url ?? ""} onChange={(v) => setEditing({ ...editing, image_url: v })} className="sm:col-span-2" placeholder="https://..." />
              <F label="Link do botão" value={editing.link_url ?? ""} onChange={(v) => setEditing({ ...editing, link_url: v })} placeholder="/menu" className="sm:col-span-2" />
              <F label="Ordem" type="number" value={String(editing.position ?? 0)} onChange={(v) => setEditing({ ...editing, position: Number(v) })} />
              <label className="flex items-center gap-2 sm:col-span-2">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                <span className="text-sm">Ativo</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="h-11 rounded-xl border border-border px-4 text-sm font-medium hover:bg-surface">Cancelar</button>
              <button onClick={save} className="h-11 rounded-xl gradient-flame px-5 font-display font-semibold text-white glow-brand">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, value, onChange, type = "text", className = "", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; className?: string; placeholder?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand" />
    </label>
  );
}
