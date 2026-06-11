import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Phone, MapPin, ChevronDown, Check, AlertCircle, Truck, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/cart-store";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: Orders,
});

const STATUSES = [
  { id: "received", label: "Recebido", color: "bg-blue-500/20 text-blue-300", icon: AlertCircle },
  { id: "confirmed", label: "Confirmado", color: "bg-indigo-500/20 text-indigo-300", icon: Check },
  { id: "preparing", label: "Em preparo", color: "bg-flame/20 text-flame", icon: Package },
  { id: "ready", label: "Pronto", color: "bg-amber-500/20 text-amber-300", icon: Package },
  { id: "out_for_delivery", label: "Em entrega", color: "bg-purple-500/20 text-purple-300", icon: Truck },
  { id: "delivered", label: "Entregue", color: "bg-emerald-500/20 text-emerald-300", icon: Check },
  { id: "cancelled", label: "Cancelado", color: "bg-red-500/20 text-red-300", icon: AlertCircle },
] as const;

type StatusId = typeof STATUSES[number]["id"];

function Orders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["admin", "orders", filter],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filter === "active") q = q.not("status", "in", "(delivered,cancelled)");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  async function updateStatus(id: string, status: StatusId) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  }

  const statusOrder = ["received", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Atualizações em tempo real • {orders.length} pedido(s)</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {(["active", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                filter === f ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "active" ? "Ativos" : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          Nenhum pedido por aqui ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => {
            const st = STATUSES.find(s => s.id === o.status)!;
            const isExpanded = expanded === o.id;
            const progress = Math.floor((statusOrder.indexOf(o.status) / (statusOrder.length - 1)) * 100);

            return (
              <div key={o.id} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-brand/50">
                {/* Header - Clicável para expandir */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : o.id)}
                  className="w-full px-6 py-4 text-left hover:bg-surface/50 transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-lg font-bold">#{o.order_number}</h3>
                        <span className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium">{o.customer_name}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{o.customer_phone}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.delivery_address}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-extrabold text-gradient-flame">{formatBRL(Number(o.total))}</div>
                      <div className="text-xs text-muted-foreground">{(o.order_items ?? []).length} item(ns)</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-flame to-emerald-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border px-6 py-4 space-y-4">
                    {/* Items */}
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">ITENS DO PEDIDO</h4>
                      <div className="space-y-2 rounded-lg bg-surface/50 p-3">
                        {(o.order_items ?? []).map((it: { id: string; quantity: number; product_name: string; subtotal: number }) => (
                          <div key={it.id} className="flex items-center justify-between text-sm">
                            <span>{it.quantity}x {it.product_name}</span>
                            <span className="font-semibold">{formatBRL(Number(it.subtotal))}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">FLUXO DO PEDIDO</h4>
                      <div className="space-y-2">
                        {STATUSES.map((s, idx) => {
                          const isActive = statusOrder.indexOf(o.status) >= idx;
                          const Icon = s.icon;
                          return (
                            <div key={s.id} className="flex items-center gap-3 text-sm">
                              <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${isActive ? "bg-brand text-white" : "bg-surface text-muted-foreground"}`}>
                                <Icon className="h-3 w-3" />
                              </div>
                              <span className={isActive ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Update */}
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-muted-foreground">ALTERAR STATUS</h4>
                      <div className="relative">
                        <select
                          value={o.status}
                          onChange={e => updateStatus(o.id, e.target.value as StatusId)}
                          className="h-10 w-full appearance-none rounded-lg border border-border bg-surface px-3 pr-9 text-sm font-medium outline-none focus:border-brand"
                        >
                          {STATUSES.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
