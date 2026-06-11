import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, ShoppingBag, TrendingUp, Search } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/cart-store";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: CustomersAdmin,
});

function CustomersAdmin() {
  const [search, setSearch] = useState("");

  const { data: customers = [] } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: customerStats = [] } = useQuery({
    queryKey: ["admin", "customer-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_customer_order_stats");
      if (error) console.error(error);
      return data ?? [];
    },
  });

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      (c.full_name?.toLowerCase().includes(q) ?? false) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.includes(q) ?? false)
    );
  });

  const stats = customerStats.reduce((acc, s) => {
    acc[s.user_id] = { orders: s.order_count, total: s.total_spent };
    return acc;
  }, {} as Record<string, any>);

  const topCustomers = filtered
    .map(c => ({ ...c, ...stats[c.id] }))
    .sort((a, b) => (b.total || 0) - (a.total || 0))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">{customers.length} cadastrados • {filtered.length} resultado(s)</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome, email ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand"
        />
      </div>

      {/* Top Customers Stats */}
      {topCustomers.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-display text-lg font-bold">Top Clientes</h3>
          <div className="space-y-3">
            {topCustomers.slice(0, 5).map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg bg-surface/50 p-3">
                <div className="text-lg font-bold text-muted-foreground">#{i + 1}</div>
                <div className="flex-1">
                  <p className="font-semibold">{c.full_name ?? c.email ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gradient-flame">{formatBRL(c.total ?? 0)}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <ShoppingBag className="h-3 w-3" /> {c.orders ?? 0} pedido(s)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Atividade</th>
              <th className="px-4 py-3">Cadastrado em</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const stat = stats[c.id] ?? { orders: 0, total: 0 };
              return (
                <tr key={c.id} className="border-t border-border hover:bg-surface/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full gradient-flame font-bold text-white text-sm">
                        {(c.full_name ?? c.email ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{c.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1 text-xs">
                      {c.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </div>
                      )}
                      {!c.phone && <span className="text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-3 w-3 text-orange-500" />
                        <span>{stat.orders ?? 0} pedido(s)</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        {formatBRL(stat.total ?? 0)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum cliente encontrado
          </div>
        )}
      </div>
    </div>
  );
}
