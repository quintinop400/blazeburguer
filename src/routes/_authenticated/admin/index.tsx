import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, ShoppingBag, Users, TrendingUp, Activity, XCircle, Trophy, Clock } from "lucide-react";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/cart-store";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

const STATUS_COLORS: Record<string, string> = {
  received: "#fbbf24",
  confirmed: "#818cf8",
  preparing: "#fb923c",
  ready: "#f59e0b",
  out_for_delivery: "#a78bfa",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};
const STATUS_LABELS: Record<string, string> = {
  received: "Recebido", confirmed: "Confirmado", preparing: "Em preparo",
  ready: "Pronto", out_for_delivery: "Em entrega", delivered: "Entregue", cancelled: "Cancelado",
};

function Dashboard() {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["dash"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  // 1) Vendas 7 dias
  const sales7d = useQuery({
    queryKey: ["dash", "sales7d"],
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 6);
      const { data } = await supabase
        .from("orders").select("created_at,total,status")
        .gte("created_at", start.toISOString())
        .neq("status", "cancelled");
      const days: { day: string; total: number }[] = [];
      const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const map = new Map<string, number>();
      for (let i = 0; i < 7; i++) {
        const d = new Date(start); d.setDate(d.getDate() + i);
        map.set(d.toISOString().slice(0, 10), 0);
      }
      (data ?? []).forEach(o => {
        const k = o.created_at.slice(0, 10);
        map.set(k, (map.get(k) ?? 0) + Number(o.total));
      });
      Array.from(map.entries()).forEach(([d, total]) => {
        days.push({ day: names[new Date(d).getDay()], total: Number(total.toFixed(2)) });
      });
      return days;
    },
  });

  // 2) Status hoje
  const statusToday = useQuery({
    queryKey: ["dash", "statusToday"],
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data } = await supabase.from("orders").select("status").gte("created_at", start.toISOString());
      const counts = new Map<string, number>();
      (data ?? []).forEach(o => counts.set(o.status, (counts.get(o.status) ?? 0) + 1));
      return Array.from(counts.entries()).map(([status, value]) => ({
        name: STATUS_LABELS[status] ?? status, value, color: STATUS_COLORS[status] ?? "#888",
      }));
    },
  });

  // 3) Top 5 produtos (últimos 30 dias)
  const topProducts = useQuery({
    queryKey: ["dash", "top5"],
    queryFn: async () => {
      const start = new Date(); start.setDate(start.getDate() - 30);
      const { data: recentOrders } = await supabase
        .from("orders").select("id").gte("created_at", start.toISOString()).neq("status", "cancelled");
      const ids = (recentOrders ?? []).map(o => o.id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("order_items").select("product_name,quantity").in("order_id", ids);
      const map = new Map<string, number>();
      (data ?? []).forEach(it => map.set(it.product_name, (map.get(it.product_name) ?? 0) + Number(it.quantity)));
      return Array.from(map.entries()).map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty).slice(0, 5);
    },
  });

  // 4) Métricas
  const metrics = useQuery({
    queryKey: ["dash", "metrics"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - 7);

      const [todayOrders, monthOrders, weekOrders, customers] = await Promise.all([
        supabase.from("orders").select("total,status").gte("created_at", today.toISOString()),
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
        supabase.from("orders").select("status").gte("created_at", weekStart.toISOString()),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const validToday = (todayOrders.data ?? []).filter(o => o.status !== "cancelled");
      const sumToday = validToday.reduce((s, o) => s + Number(o.total), 0);
      const ticket = validToday.length > 0 ? sumToday / validToday.length : 0;
      const weekAll = (weekOrders.data ?? []).length;
      const weekCancelled = (weekOrders.data ?? []).filter(o => o.status === "cancelled").length;
      const cancelRate = weekAll > 0 ? (weekCancelled / weekAll) * 100 : 0;
      return {
        ticket, monthOrders: monthOrders.count ?? 0,
        cancelRate, customers: customers.count ?? 0,
      };
    },
  });

  // 5) Últimos 5 pedidos
  const recent = useQuery({
    queryKey: ["dash", "recent5"],
    queryFn: async () => {
      const { data } = await supabase.from("orders")
        .select("id,order_number,customer_name,total,status,created_at")
        .order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  function timeAgo(iso: string) {
    const min = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (min < 60) return `${min} min`;
    if (min < 1440) return `${Math.floor(min / 60)}h`;
    return `${Math.floor(min / 1440)}d`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral em tempo real do negócio</p>
      </div>

      {/* Card 4: Métricas rápidas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={DollarSign} label="Ticket médio (hoje)" value={metrics.isLoading ? "—" : formatBRL(metrics.data?.ticket ?? 0)} accent />
        <Kpi icon={TrendingUp} label="Pedidos do mês" value={metrics.isLoading ? "—" : String(metrics.data?.monthOrders ?? 0)} />
        <Kpi icon={XCircle} label="Cancelamento (7d)" value={metrics.isLoading ? "—" : `${(metrics.data?.cancelRate ?? 0).toFixed(1)}%`} />
        <Kpi icon={Users} label="Total de clientes" value={metrics.isLoading ? "—" : String(metrics.data?.customers ?? 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card 1: Faturamento 7 dias */}
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold">Faturamento — últimos 7 dias</h2>
          <div className="h-72">
            {sales7d.isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer>
                <BarChart data={sales7d.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis dataKey="day" tick={{ fill: "oklch(0.7 0.01 25)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "oklch(0.7 0.01 25)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip contentStyle={{ background: "oklch(0.205 0.007 25)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="total" fill="#FF4D00" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Card 2: Status hoje */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Status (hoje)</h2>
          <div className="h-72">
            {statusToday.isLoading ? <Skeleton className="h-full w-full" /> : (statusToday.data ?? []).length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">Sem pedidos hoje</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusToday.data ?? []} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                    {(statusToday.data ?? []).map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 3: Top 5 produtos */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-flame" />
            <h2 className="font-display text-lg font-bold">Top 5 produtos (30 dias)</h2>
          </div>
          {topProducts.isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (topProducts.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem vendas no período</p>
          ) : (
            <ol className="space-y-2">
              {(topProducts.data ?? []).map((p, i, arr) => {
                const max = arr[0].qty;
                const pct = (p.qty / max) * 100;
                return (
                  <li key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">#{i + 1} {p.name}</span>
                      <span className="text-muted-foreground">{p.qty} un</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface">
                      <div className="h-full bg-gradient-to-r from-flame to-amber-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Card 5: Últimos 5 pedidos */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand" />
            <h2 className="font-display text-lg font-bold">Últimos pedidos</h2>
          </div>
          {recent.isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (recent.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido ainda</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-1">#</th><th>Cliente</th><th>Total</th><th>Status</th><th>Há</th></tr>
              </thead>
              <tbody>
                {(recent.data ?? []).map(o => (
                  <tr key={o.id} className="border-t border-border/60">
                    <td className="py-2 font-mono">#{o.order_number}</td>
                    <td className="truncate">{o.customer_name}</td>
                    <td className="font-semibold">{formatBRL(Number(o.total))}</td>
                    <td>
                      <span className="rounded-md px-2 py-0.5 text-xs font-bold" style={{ background: `${STATUS_COLORS[o.status]}22`, color: STATUS_COLORS[o.status] }}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground">{timeAgo(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-3 text-right">
            <Link to="/admin/pedidos" className="text-xs text-brand hover:underline">Ver todos →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: typeof DollarSign; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 transition hover:border-brand/50 ${accent ? "glow-brand" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${accent ? "gradient-flame text-white" : "bg-surface text-flame"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-2xl font-extrabold">{value}</div>
    </div>
  );
}

void Activity; void ShoppingBag;
