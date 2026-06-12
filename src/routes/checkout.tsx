import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, CreditCard, Banknote, QrCode, MessageCircle, Tag, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useCart, formatBRL } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessHours } from "@/lib/business-hours";

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

type AppliedCoupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  amount: number;
};

type AddressRow = {
  id: string;
  label: string | null;
  street: string;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string;
  is_default: boolean;
};

function formatAddress(a: AddressRow) {
  const parts = [`${a.street}${a.number ? ", " + a.number : ""}`];
  if (a.complement) parts.push(a.complement);
  if (a.neighborhood) parts.push(a.neighborhood);
  parts.push(a.city);
  return parts.join(" - ");
}

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen, closedMessage } = useBusinessHours();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedAddrId, setSelectedAddrId] = useState<string | "manual">("manual");
  const [payment, setPayment] = useState<PaymentId>("pix");
  const [saving, setSaving] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [validating, setValidating] = useState(false);

  const pixQuery = useQuery({
    queryKey: ["checkout", "pix-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "payment_pix").maybeSingle();
      return data?.value as { enabled?: boolean; key?: string; qr_url?: string; instructions?: string } | null;
    },
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["my-addresses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("addresses").select("*").eq("user_id", user!.id).order("is_default", { ascending: false });
      return (data ?? []) as AddressRow[];
    },
  });

  // auto-selecionar endereço padrão
  useEffect(() => {
    if (addresses.length > 0 && selectedAddrId === "manual") {
      const def = addresses.find(a => a.is_default) ?? addresses[0];
      setSelectedAddrId(def.id);
      setAddress(formatAddress(def));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.length]);

  const delivery = subtotal >= 60 || subtotal === 0 ? 0 : 7.9;
  const discount = coupon?.amount ?? 0;
  const total = Math.max(0, subtotal + delivery - discount);
  const canPlace = name && phone && address && items.length > 0 && !saving && isOpen;

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setValidating(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return toast.error("Cupom não encontrado");
      if (data.expires_at && new Date(data.expires_at) < new Date()) return toast.error("Cupom expirado");
      if (data.max_uses != null && data.used_count >= data.max_uses) return toast.error("Cupom esgotado");
      if (data.min_order != null && subtotal < Number(data.min_order)) {
        return toast.error(`Pedido mínimo: ${formatBRL(Number(data.min_order))}`);
      }
      const val = Number(data.discount_value);
      const amount = data.discount_type === "percent" ? Math.round((subtotal * val) * 0.01 * 100) / 100 : val;
      const applied: AppliedCoupon = { id: data.id, code: data.code, discount_type: data.discount_type, discount_value: val, amount };
      setCoupon(applied);
      toast.success(`Cupom aplicado! Você economizou ${formatBRL(amount)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao validar cupom");
    } finally {
      setValidating(false);
    }
  }

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
          coupon_code: coupon?.code ?? null,
          discount: discount || null,
        })
        .select("id, order_number")
        .single();
      if (orderErr) throw orderErr;

      const itemsPayload = items.map(({ product, qty, notes }) => ({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: qty,
        subtotal: product.price * qty,
        notes: notes ?? null,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      if (coupon) {
        await supabase.from("coupons").update({ used_count: (await supabase.from("coupons").select("used_count").eq("id", coupon.id).single()).data?.used_count + 1 || 1 }).eq("id", coupon.id);
      }

      // sugerir salvar endereço manual
      if (user && selectedAddrId === "manual" && address.trim()) {
        const exists = addresses.some(a => formatAddress(a).toLowerCase() === address.trim().toLowerCase());
        if (!exists) {
          toast("Salvar este endereço?", {
            action: {
              label: "Salvar",
              onClick: async () => {
                await supabase.from("addresses").insert({
                  user_id: user.id,
                  label: "Endereço",
                  street: address,
                  city: "—",
                  is_default: addresses.length === 0,
                });
                toast.success("Endereço salvo no perfil");
              },
            },
          });
        }
      }

      toast.success(`Pedido #${order.order_number} enviado!`);
      clear();
      navigate({ to: "/pedido/$orderNumber", params: { orderNumber: String(order.order_number) } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar pedido");
    } finally {
      setSaving(false);
    }
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

            {user && addresses.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Selecionar endereço</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {addresses.map(a => (
                    <button
                      key={a.id}
                      onClick={() => { setSelectedAddrId(a.id); setAddress(formatAddress(a)); }}
                      className={`rounded-xl border p-3 text-left text-sm transition ${
                        selectedAddrId === a.id ? "border-brand bg-brand/10" : "border-border bg-surface hover:border-brand/60"
                      }`}
                    >
                      <p className="font-semibold">{a.label ?? "Endereço"}{a.is_default ? " · padrão" : ""}</p>
                      <p className="text-xs text-muted-foreground">{formatAddress(a)}</p>
                    </button>
                  ))}
                  <button
                    onClick={() => { setSelectedAddrId("manual"); setAddress(""); }}
                    className={`rounded-xl border p-3 text-left text-sm transition ${
                      selectedAddrId === "manual" ? "border-brand bg-brand/10" : "border-border bg-surface hover:border-brand/60"
                    }`}
                  >
                    <p className="font-semibold">+ Outro endereço</p>
                    <p className="text-xs text-muted-foreground">Digitar manualmente</p>
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome completo" value={name} onChange={setName} placeholder="João Silva" />
              <Field label="Telefone (WhatsApp)" value={phone} onChange={setPhone} placeholder="(11) 99999-9999" />
              <div className="sm:col-span-2">
                <Field label="Endereço completo" value={address} onChange={(v) => { setAddress(v); setSelectedAddrId("manual"); }} placeholder="Rua, número, bairro, complemento" />
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
                    ) : null}
                    {pixQuery.data.qr_url ? (
                      <img src={pixQuery.data.qr_url} alt="QR Code PIX" className="mt-2 max-h-48 w-full rounded-2xl object-contain" />
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">PIX ainda não está configurado.</div>
                )}
              </div>
            ) : null}
          </div>

          {/* Cupom */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <Tag className="h-5 w-5 text-flame" /> Cupom de desconto
            </h2>
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <div>
                  <p className="font-semibold text-emerald-300">{coupon.code} aplicado</p>
                  <p className="text-xs text-emerald-200/80">Você economizou {formatBRL(coupon.amount)}</p>
                </div>
                <button onClick={() => { setCoupon(null); setCouponCode(""); }} className="grid h-8 w-8 place-items-center rounded-full text-emerald-300 hover:bg-emerald-500/20" aria-label="Remover cupom">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Digite seu cupom"
                  className="h-11 flex-1 rounded-lg border border-border bg-surface px-3 text-sm uppercase outline-none focus:border-brand"
                />
                <button
                  onClick={applyCoupon}
                  disabled={validating || !couponCode.trim()}
                  className="h-11 rounded-lg gradient-flame px-5 text-sm font-semibold text-white glow-brand disabled:opacity-50"
                >
                  {validating ? "Validando…" : "Aplicar"}
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-20">
          <h2 className="mb-4 font-display text-lg font-bold">Resumo do pedido</h2>
          <ul className="space-y-3 border-b border-border pb-4">
            {items.map(({ product, qty, notes }) => (
              <li key={product.id + (notes ?? "")} className="flex items-start gap-3 text-sm">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-xl">{product.emoji}</div>
                <div className="flex-1 leading-tight">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{qty}x · {formatBRL(product.price)}</p>
                  {notes ? <p className="mt-0.5 text-xs italic text-muted-foreground">“{notes}”</p> : null}
                </div>
                <span className="font-semibold">{formatBRL(product.price * qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 py-4 text-sm">
            <Row k="Subtotal" v={formatBRL(subtotal)} />
            <Row k="Entrega" v={delivery === 0 ? "Grátis" : formatBRL(delivery)} accent={delivery === 0} />
            {coupon && (
              <div className="flex items-center justify-between">
                <dt className="text-emerald-400">Desconto ({coupon.code})</dt>
                <dd className="font-semibold text-emerald-400">-{formatBRL(coupon.amount)}</dd>
              </div>
            )}
          </dl>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-display text-base font-semibold">Total</span>
            <span className="font-display text-2xl font-extrabold text-gradient-flame">{formatBRL(total)}</span>
          </div>

          {!isOpen && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">⏰ {closedMessage}</p>
          )}

          <button
            onClick={placeOrder}
            disabled={!canPlace}
            title={!isOpen ? "Estamos fechados agora" : undefined}
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

// silence unused
void Plus;
