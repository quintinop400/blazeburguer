import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, AlertCircle, Check, Package, Truck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/cart-store";
import { useStoreWhatsApp } from "@/lib/business-hours";

export const Route = createFileRoute("/pedido/$orderNumber")({
  head: () => ({ meta: [{ title: "Rastrear pedido — BlazeBurger" }] }),
  component: TrackOrder,
});

const STATUSES = [
  { id: "received", label: "Recebido", icon: AlertCircle },
  { id: "confirmed", label: "Confirmado", icon: Check },
  { id: "preparing", label: "Em preparo", icon: Package },
  { id: "ready", label: "Pronto", icon: Package },
  { id: "out_for_delivery", label: "Em entrega", icon: Truck },
  { id: "delivered", label: "Entregue", icon: Check },
] as const;

type OrderRow = {
  id: string;
  order_number: number;
  status: string;
  customer_name: string;
  delivery_address: string | null;
  payment_method: string | null;
  total: number;
  coupon_code: string | null;
  discount: number | null;
  created_at: string;
  order_items: Array<{ id: string; product_name: string; quantity: number; subtotal: number; notes?: string | null }>;
};

function TrackOrder() {
  const { orderNumber } = Route.useParams();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const wa = useStoreWhatsApp();

  const { data, isLoading } = useQuery({
    queryKey: ["order-track", orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_number", Number(orderNumber))
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as OrderRow) ?? null;
    },
  });

  useEffect(() => { if (data) setOrder(data); }, [data]);

  useEffect(() => {
    if (!data?.id) return;
    const ch = supabase
      .channel(`order-track-${data.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${data.id}` },
        (payload) => setOrder(prev => prev ? { ...prev, ...(payload.new as Partial<OrderRow>) } : prev))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [data?.id]);

  if (isLoading) {
    return <AppShell><div className="p-20 text-center text-muted-foreground">Carregando pedido…</div></AppShell>;
  }
  if (!order) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md p-12 text-center">
          <p className="font-display text-xl font-bold">Pedido não encontrado</p>
          <Link to="/menu" className="mt-3 inline-block text-brand hover:underline">Voltar ao cardápio</Link>
        </div>
      </AppShell>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentIdx = STATUSES.findIndex(s => s.id === order.status);
  const waMsg = encodeURIComponent(`Olá! Meu pedido #${order.order_number} - preciso de ajuda.`);
  const waUrl = wa ? `https://wa.me/55${wa}?text=${waMsg}` : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Início
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Pedido</p>
            <h1 className="font-display text-4xl font-extrabold">#{order.order_number}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")}</p>
          </div>
          <span className="font-display text-3xl font-extrabold text-gradient-flame">{formatBRL(Number(order.total))}</span>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Status do pedido</h2>
          {isCancelled ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center font-semibold text-red-300">
              Pedido cancelado
            </div>
          ) : (
            <ol className="relative space-y-5 pl-4">
              <span className="absolute left-[15px] top-1 bottom-1 w-px bg-border" />
              {STATUSES.map((s, i) => {
                const Icon = s.icon;
                const done = i < currentIdx;
                const current = i === currentIdx;
                return (
                  <li key={s.id} className="relative flex items-center gap-4">
                    <div className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
                      done ? "border-emerald-500 bg-emerald-500 text-white" :
                      current ? "animate-pulse border-flame bg-flame text-white glow-brand" :
                      "border-border bg-surface text-muted-foreground"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-sm ${current ? "font-bold" : done ? "font-medium" : "text-muted-foreground"}`}>{s.label}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</h3>
            <p className="font-medium">{order.customer_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{order.delivery_address}</p>
            <p className="mt-2 text-xs text-muted-foreground">Pagamento: {order.payment_method ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Itens</h3>
            <ul className="space-y-2 text-sm">
              {order.order_items.map(it => (
                <li key={it.id}>
                  <div className="flex justify-between">
                    <span>{it.quantity}x {it.product_name}</span>
                    <span className="font-semibold">{formatBRL(Number(it.subtotal))}</span>
                  </div>
                  {it.notes ? <p className="text-xs italic text-muted-foreground">“{it.notes}”</p> : null}
                </li>
              ))}
            </ul>
            {order.discount && Number(order.discount) > 0 ? (
              <p className="mt-3 text-xs text-emerald-400">Cupom {order.coupon_code}: -{formatBRL(Number(order.discount))}</p>
            ) : null}
          </div>
        </div>

        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 font-display font-semibold text-white transition hover:scale-[1.01]"
          >
            <MessageCircle className="h-5 w-5" /> Falar com a loja no WhatsApp
          </a>
        )}
      </div>
    </AppShell>
  );
}
