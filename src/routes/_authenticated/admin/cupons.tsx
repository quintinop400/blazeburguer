import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, X, Ticket } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/cupons")({ component: Page });

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
};

function Page() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);

  const { data: coupons = [] } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  async function save() {
    if (!editing) return;
    if (!editing.code) return toast.error("Código obrigatório");
    const payload = {
      code: editing.code.toUpperCase().trim(),
      description: editing.description || null,
      discount_type: editing.discount_type ?? "percent",
      discount_value: Number(editing.discount_value ?? 0),
      min_order: editing.min_order != null ? Number(editing.min_order) : 0,
      max_uses: editing.max_uses != null && String(editing.max_uses) !== "" ? Number(editing.max_uses) : null,
      expires_at: editing.expires_at || null,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("coupons").update(payload).eq("id", editing.id)
      : await supabase.from("coupons").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Cupom salvo");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir cupom?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Cupons</h1>
          <p className="text-sm text-muted-foreground">{coupons.length} cadastrados</p>
        </div>
        <button onClick={() => setEditing({ discount_type: "percent", is_active: true })} className="flex h-11 items-center gap-2 rounded-xl gradient-flame px-4 font-display font-semibold text-white glow-brand">
          <Plus className="h-4 w-4" /> Novo cupom
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Desconto</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Expira</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => {
              const usagePercent = c.max_uses ? (c.used_count / c.max_uses) * 100 : 0;
              const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
              return (
                <tr key={c.id} className="border-t border-border hover:bg-surface/50 transition">
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-2 rounded-lg bg-surface px-2 py-1 font-mono font-bold text-sm"><Ticket className="h-3.5 w-3.5" /> {c.code}</span></td>
                  <td className="px-4 py-3 font-semibold text-gradient-flame">{c.discount_type === "percent" ? `${c.discount_value}%` : `R$ ${Number(c.discount_value).toFixed(2)}`}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : " uso(s)"}</div>
                      {c.max_uses && (
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                          <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all" style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {isExpired ? <span className="text-red-400">Expirado</span> : c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${c.is_active && !isExpired ? "bg-emerald-500/20 text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                      {isExpired ? "Expirado" : c.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(c)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface transition"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(c.id)} className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10 transition"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">Nenhum cupom cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{editing.id ? "Editar cupom" : "Novo cupom"}</h2>
              <button onClick={() => setEditing(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <F label="Código" value={editing.code ?? ""} onChange={v => setEditing({ ...editing, code: v })} className="sm:col-span-2" />
              <F label="Descrição" value={editing.description ?? ""} onChange={v => setEditing({ ...editing, description: v })} className="sm:col-span-2" />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Tipo</span>
                <select value={editing.discount_type ?? "percent"} onChange={e => setEditing({ ...editing, discount_type: e.target.value as Coupon["discount_type"] })} className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand">
                  <option value="percent">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </label>
              <F label="Valor" type="number" value={String(editing.discount_value ?? "")} onChange={v => setEditing({ ...editing, discount_value: Number(v) })} />
              <F label="Pedido mínimo (R$)" type="number" value={String(editing.min_order ?? 0)} onChange={v => setEditing({ ...editing, min_order: Number(v) })} />
              <F label="Máx. usos (vazio = ilimitado)" type="number" value={String(editing.max_uses ?? "")} onChange={v => setEditing({ ...editing, max_uses: v === "" ? null : Number(v) })} />
              <F label="Expira em" type="datetime-local" value={editing.expires_at?.slice(0, 16) ?? ""} onChange={v => setEditing({ ...editing, expires_at: v ? new Date(v).toISOString() : null })} className="sm:col-span-2" />
              <label className="flex items-center gap-2 sm:col-span-2">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
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

function F({ label, value, onChange, type = "text", className = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand" />
    </label>
  );
}
