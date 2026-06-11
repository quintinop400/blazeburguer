import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, CreditCard, Banknote, QrCode, MessageCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useCart, formatBRL } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — BlazeBurger" }] }),
  component: Checkout,
});

const PAYMENTS = [
  { id: "pix", label: "PIX", icon: QrCode },
  { id: "credit", label: "Crédito", icon: CreditCard },
  { id: "debit", label: "Débito", icon: CreditCard },
  { id: "cash", label: "Dinheiro", icon: Banknote },
] as const;

type PaymentId = typeof PAYMENTS[number]["id"];

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<PaymentId>("pix");
  const [placed, setPlaced] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const pixQuery = useQuery({
    queryKey: ["checkout", "pix-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "payment_pix")
        .maybeSingle();
      if (error) throw error;
      return data?.value as { enabled?: boolean; key?: string; qr_url?: string; instructions?: string } | null;
    },
  });

  const delivery = subtotal >= 60 || subtotal === 0 ? 0 : 7.9;
  const total = subtotal + delivery;
  const canPlace = name && phone && address && items.length > 0 && !saving;

  async function placeOrder() {
    if (!canPlace) return;
    setSaving(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id ?? null,
          customer_name: name,
          customer_phone: phone,
          delivery_address: address,
          payment_method: payment,
          subtotal,
          delivery_fee: delivery,
          total,
          status: "received",
        })
        .select("id, order_number")
        .single();
      if (orderErr) throw orderErr;

      const itemsPayload = items.map(({ product, qty }) => ({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: qty,
        subtotal: product.price * qty,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      toast.success(`Pedido #${order.order_number} enviado!`);
      setPlaced(order.order_number);
      clear();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar pedido");
    } finally {
      setSaving(false);
    }
  }

  if (placed !== null) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full gradient-flame glow-brand">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold">Pedido #{placed} confirmado!</h1>
          <p className="text-muted-foreground">Estamos preparando tudo. Acompanhe pelo seu perfil.</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => navigate({ to: "/" })} className="h-12 rounded-xl border border-border px-5 font-display font-semibold">Voltar ao início</button>
            {user && (
              <button onClick={() => navigate({ to: "/perfil" })} className="h-12 rounded-xl gradient-flame px-5 font-display font-semibold text-white glow-brand">
                Ver pedido
              </button>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  if (items.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="text-6xl">🛒</div>
          <h1 className="mt-3 font-display text-2xl font-bold">Carrinho vazio</h1>
          <p className="mt-1 text-muted-foreground">Adicione itens antes de finalizar.</p>
          <Link to="/menu" className="mt-6 inline-flex h-12 items-center rounded-xl gradient-flame px-6 font-display font-semibold text-white">
            Ver cardápio
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <Link to="/menu" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Finalizar pedido</h1>
        {!user && (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link to="/auth" search={{ redirect: "/checkout" }} className="font-semibold text-brand hover:underline">Entre</Link> para salvar e acompanhar seus pedidos.
          </p>
        )}
      </div>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <MapPin className="h-5 w-5 text-flame" /> Entrega
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome completo" value={name} onChange={setName} placeholder="João Silva" />
              <Field label="Telefone (WhatsApp)" value={phone} onChange={setPhone} placeholder="(11) 99999-9999" />
              <div className="sm:col-span-2">
                <Field label="Endereço completo" value={address} onChange={setAddress} placeholder="Rua, número, bairro, complemento" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <CreditCard className="h-5 w-5 text-flame" /> Pagamento
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PAYMENTS.map(p => {
                const I = p.icon;
                const active = payment === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPayment(p.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition ${
                      active ? "border-brand bg-brand/10 text-brand glow-brand" : "border-border bg-surface hover:border-brand/60"
                    }`}
                  >
                    <I className="h-6 w-6" /> {p.label}
                  </button>
                );
              })}
            </div>
            {payment === "pix" ? (
              <div className="mt-4 rounded-2xl border border-flame/20 bg-flame/5 p-4 text-sm text-foreground">
                {pixQuery.isLoading ? (
                  <p>Carregando dados do PIX...</p>
                ) : pixQuery.data?.key ? (
                  <div className="space-y-3">
                    <div className="font-semibold">PIX configurado</div>
                    <div className="rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm">
                      <div className="text-xs text-muted-foreground">Chave PIX</div>
                      <div className="mt-1 break-all">{pixQuery.data.key}</div>
                    </div>
                    {pixQuery.data.instructions ? (
                      <p className="text-sm text-muted-foreground">{pixQuery.data.instructions}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Configure as instruções de PIX no admin para exibir mais detalhes.</p>
                    )}
                    {pixQuery.data.qr_url ? (
                      <img src={pixQuery.data.qr_url} alt="QR Code PIX" className="mt-2 max-h-48 w-full rounded-2xl object-contain" />
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">PIX ainda não está configurado. Configure a chave no painel administrativo.</div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-20">
          <h2 className="mb-4 font-display text-lg font-bold">Resumo do pedido</h2>
          <ul className="space-y-3 border-b border-border pb-4">
            {items.map(({ product, qty }) => (
              <li key={product.id} className="flex items-center gap-3 text-sm">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-xl">{product.emoji}</div>
                <div className="flex-1 leading-tight">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{qty}x · {formatBRL(product.price)}</p>
                </div>
                <span className="font-semibold">{formatBRL(product.price * qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 py-4 text-sm">
            <Row k="Subtotal" v={formatBRL(subtotal)} />
            <Row k="Entrega" v={delivery === 0 ? "Grátis" : formatBRL(delivery)} accent={delivery === 0} />
          </dl>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-display text-base font-semibold">Total</span>
            <span className="font-display text-2xl font-extrabold text-gradient-flame">{formatBRL(total)}</span>
          </div>
          <button
            onClick={placeOrder}
            disabled={!canPlace}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-flame font-display font-semibold text-white transition hover:scale-[1.02] glow-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <MessageCircle className="h-5 w-5" /> {saving ? "Enviando..." : "Confirmar pedido"}
          </button>
        </aside>
      </section>
    </AppShell>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition focus:border-brand"
      />
    </label>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={accent ? "font-semibold text-flame" : "font-semibold"}>{v}</dd>
    </div>
  );
}
