import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/avaliacoes")({
  component: Reviews,
});

type ReviewRow = {
  id: string;
  order_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

function Stars({ value, size = 4 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-${size} w-${size} ${i <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
      ))}
    </span>
  );
}

function Reviews() {
  const [filterStar, setFilterStar] = useState<number | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
  });

  const orderIds = Array.from(new Set(reviews.map(r => r.order_id)));
  const { data: ordersMap = {} } = useQuery({
    queryKey: ["admin", "reviews", "orders", orderIds.join(",")],
    enabled: orderIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id,order_number,customer_name").in("id", orderIds);
      const map: Record<string, { order_number: number; customer_name: string }> = {};
      (data ?? []).forEach(o => { map[o.id] = { order_number: o.order_number, customer_name: o.customer_name }; });
      return map;
    },
  });

  const filtered = filterStar ? reviews.filter(r => r.rating === filterStar) : reviews;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Avaliações</h1>
        <p className="text-sm text-muted-foreground">Feedback dos clientes sobre os pedidos.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <Stars value={Math.round(avg)} size={8} />
        </div>
        <p className="mt-2 font-display text-3xl font-extrabold">{avg.toFixed(1)} / 5.0</p>
        <p className="text-sm text-muted-foreground">{reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterStar(null)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filterStar === null ? "gradient-flame text-white glow-brand" : "border border-border bg-card"}`}>Todas</button>
        {[5, 4, 3, 2, 1].map(s => (
          <button key={s} onClick={() => setFilterStar(s)} className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold ${filterStar === s ? "gradient-flame text-white glow-brand" : "border border-border bg-card"}`}>
            {s} <Star className="h-3 w-3 fill-current" />
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">Nenhuma avaliação.</div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(r => {
            const o = ordersMap[r.order_id];
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{o?.customer_name ?? "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">Pedido #{o?.order_number ?? "—"} · {new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Stars value={r.rating} />
                </div>
                {r.comment ? <p className="mt-3 text-sm text-foreground/90">{r.comment}</p> : <p className="mt-3 text-sm italic text-muted-foreground">Sem comentário</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
