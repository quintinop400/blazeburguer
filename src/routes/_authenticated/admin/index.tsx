import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, AlertTriangle, Activity, Clock, Award } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/cart-store";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  const daysMap = { "7d": 6, "30d": 29, "90d": 89 };
  const rangeLabel = { "7d": "últimos 7 dias", "30d": "últimos 30 dias", "90d": "últimos 90 dias" };

  const stats = useQuery({
    queryKey: ["admin", "stats", timeRange],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const rangeStart = new Date(today); rangeStart.setDate(rangeStart.getDate() - daysMap[timeRange]); rangeStart.setHours(0, 0, 0, 0);

      const [todayOrders, monthOrders, rangeOrders, totalOrders, lowStock, customers, topProducts, recentOrders] = await Promise.all([
        supabase.from("orders").select("total").gte("created_at", today.toISOString()).neq("status", "cancelled"),
        supabase.from("orders").select("total").gte("created_at", monthStart.toISOString()).neq("status", "cancelled"),
        supabase.from("orders").select("created_at,total,status").gte("created_at", rangeStart.toISOString()).neq("status", "cancelled"),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id,name,stock").lte("stock", 10).eq("is_active", true).order("stock"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("order_items").select("product_id,quantity").order("quantity", { ascending: false }).limit(5),
        supabase.from("orders").select("created_at,total,status,customer_name").gte("created_at", rangeStart.toISOString()).order("created_at", { ascending: false }).limit(10),
      ]);

      const sumToday = (todayOrders.data ?? []).reduce((s, o) => s + Number(o.total), 0);
      const sumMonth = (monthOrders.data ?? []).reduce((s, o) => s + Number(o.total), 0);

      // chart data by day
      const byDay = new Map<string, number>();
      const dayCount = daysMap[timeRange] + 1;
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(rangeStart); d.setDate(d.getDate() + i);
        byDay.set(d.toISOString().slice(0, 10), 0);
      }
      for (const o of rangeOrders.data ?? []) {
        if (o.status === "cancelled") continue;
        const k = o.created_at.slice(0, 10);
        byDay.set(k, (byDay.get(k) ?? 0) + Number(o.total));
      }
      const chartData = Array.from(byDay.entries()).map(([d, v]) => ({
        day: new Date(d).toLocaleDateString("pt-BR", { weekday: "short" }),
        date: d,
        total: Number(v.toFixed(2)),
      }));

      // status distribution
      const statusCounts = new Map<string, number>();
      const statusColors: Record<string, string> = {
        received: "oklch(0.62 0.22 27)",
        confirmed: "oklch(0.5 0.15 280)",
        preparing: "oklch(0.72 0.2 50)",
        ready: "oklch(0.75 0.18 60)",
        out_for_delivery: "oklch(0.65 0.18 300)",
        delivered: "oklch(0.65 0.15 140)",
        cancelled: "oklch(0.5 0.1 10)",
      };
      for (const o of rangeOrders.data ?? []) {
        statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
      }
      const statusData = Array.from(statusCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([status, count]) => ({
          name: status === "received" ? "Recebido" : status === "confirmed" ? "Confirmado" : status === "preparing" ? "Em preparo" : status === "ready" ? "Pronto" : status === "out_for_delivery" ? "Em entrega" : status === "delivered" ? "Entregue" : "Cancelado",
          value: count,
          color: statusColors[status] || "oklch(0.7 0.1 0)",
        }));

      return {
        salesToday: sumToday,
        salesMonth: sumMonth,
        ordersToday: (todayOrders.data ?? []).length,
        totalOrders: totalOrders.count ?? 0,
        customers: customers.count ?? 0,
        lowStock: lowStock.data ?? [],
        chartData,
        statusData,
        topProducts: topProducts.data ?? [],
        recentOrders: recentOrders.data ?? [],
      };
    },
  });

  // realtime refresh
  useEffect(() => {
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => stats.refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [stats]);

  const s = stats.data;
  const avgOrder = s && s.ordersToday > 0 ? s.salesToday / s.ordersToday : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral em tempo real do seu negócio</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {(["7d", "30d", "90d"] as const).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                timeRange === r ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "7d" ? "7 dias" : r === "30d" ? "30 dias" : "90 dias"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card icon={DollarSign} label="Vendas hoje" value={formatBRL(s?.salesToday ?? 0)} accent />
        <Card icon={TrendingUp} label="Vendas do mês" value={formatBRL(s?.salesMonth ?? 0)} />
        <Card icon={ShoppingBag} label="Pedidos hoje" value={String(s?.ordersToday ?? 0)} sub={`Ticket: ${formatBRL(avgOrder)}`} />
        <Card icon={Users} label="Clientes" value={String(s?.customers ?? 0)} />
        <Card icon={Activity} label="Total de pedidos" value={String(s?.totalOrders ?? 0)} />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart */}
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold">Vendas {rangeLabel[timeRange]}</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={s?.chartData ?? []}>
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="oklch(0.62 0.22 27)" />
                    <stop offset="100%" stopColor="oklch(0.72 0.2 50)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="day" tick={{ fill: "oklch(0.7 0.01 25)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.7 0.01 25)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "oklch(0.205 0.007 25)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} formatter={(v: number) => formatBRL(v)} />
                <Line type="monotone" dataKey="total" stroke="url(#lg)" strokeWidth={3} dot={{ fill: "oklch(0.72 0.2 50)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Status dos pedidos</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={s?.statusData ?? []} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="value">
                  {(s?.statusData ?? []).map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            {(s?.statusData ?? []).map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-flame" />
            <h2 className="font-display text-lg font-bold">Estoque baixo</h2>
          </div>
          {(s?.lowStock ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tudo abastecido 🎉</p>
          ) : (
            <div className="space-y-2">
              {(s?.lowStock ?? []).slice(0, 10).map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${p.stock === 0 ? "bg-destructive/20 text-destructive" : "bg-flame/20 text-flame"}`}>
                    {p.stock} un
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand" />
            <h2 className="font-display text-lg font-bold">Pedidos recentes</h2>
          </div>
          {(s?.recentOrders ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido ainda</p>
          ) : (
            <div className="space-y-2 text-sm">
              {(s?.recentOrders ?? []).slice(0, 6).map((o, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                  <div>
                    <p className="font-semibold">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <span className="font-semibold">{formatBRL(Number(o.total))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value, sub, accent }: { icon: typeof DollarSign; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 transition hover:border-brand/50 ${accent ? "glow-brand" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${accent ? "gradient-flame text-white" : "bg-surface text-flame"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-2xl font-extrabold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

