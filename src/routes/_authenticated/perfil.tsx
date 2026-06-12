import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, MapPin, Package, LogOut, ShieldCheck, Star, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { signOut, useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/lib/cart-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: Profile,
});

const STATUS_LABEL: Record<string, string> = {
  received: "Recebido", confirmed: "Confirmado", preparing: "Em preparo",
  ready: "Pronto", out_for_delivery: "Saiu para entrega",
  delivered: "Entregue", cancelled: "Cancelado",
};

type AddressRow = {
  id: string;
  label: string | null;
  zip_code: string | null;
  street: string;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string;
  is_default: boolean;
};

function Profile() {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders").select("*, order_items(*)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
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

  const { data: reviews = [] } = useQuery({
    queryKey: ["my-reviews", user?.id],
    enabled: !!user && orders.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("order_reviews").select("order_id,rating").eq("user_id", user!.id);
      return data ?? [];
    },
  });
  const reviewByOrder = new Map(reviews.map(r => [r.order_id, r.rating]));

  const [reviewingOrder, setReviewingOrder] = useState<{ id: string; number: number } | null>(null);
  const [addrEdit, setAddrEdit] = useState<Partial<AddressRow> | null>(null);

  async function saveProfile() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
  }

  async function deleteAddress(id: string) {
    if (!confirm("Excluir endereço?")) return;
    await supabase.from("addresses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-addresses"] });
    toast.success("Endereço excluído");
  }

  async function makeDefault(id: string) {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-addresses"] });
    toast.success("Endereço padrão atualizado");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Minha conta</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-2 rounded-xl border border-brand bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
                <ShieldCheck className="h-4 w-4" /> Painel admin
              </Link>
            )}
            <button onClick={() => signOut()} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><User className="h-5 w-5 text-flame" /> Dados pessoais</h2>
              <div className="space-y-3">
                <Inp label="Nome completo" v={name} on={setName} />
                <Inp label="Telefone" v={phone} on={setPhone} />
                <button onClick={saveProfile} className="mt-2 h-11 w-full rounded-xl gradient-flame font-display font-semibold text-white glow-brand">
                  Salvar
                </button>
              </div>
            </div>

            {/* Endereços */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold"><MapPin className="h-5 w-5 text-flame" /> Meus endereços</h2>
                <button onClick={() => setAddrEdit({})} className="flex items-center gap-1 rounded-lg gradient-flame px-3 py-1.5 text-xs font-semibold text-white">
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>
              {addresses.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhum endereço salvo.</p>
              ) : (
                <ul className="space-y-2">
                  {addresses.map(a => (
                    <li key={a.id} className="rounded-xl border border-border bg-surface p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="flex items-center gap-2 text-sm font-semibold">
                            {a.label ?? "Endereço"}
                            {a.is_default && <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-bold text-brand">PADRÃO</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{a.street}{a.number ? ", " + a.number : ""}{a.neighborhood ? " - " + a.neighborhood : ""}, {a.city}</p>
                        </div>
                        <div className="flex gap-1">
                          {!a.is_default && (
                            <button onClick={() => makeDefault(a.id)} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-card">Padrão</button>
                          )}
                          <button onClick={() => setAddrEdit(a)} className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-card"><Pencil className="h-3 w-3" /></button>
                          <button onClick={() => deleteAddress(a.id)} className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-card hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><Package className="h-5 w-5 text-flame" /> Histórico de pedidos</h2>
            {orders.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <MapPin className="mx-auto mb-2 h-8 w-8 opacity-50" />
                Você ainda não fez pedidos.<br />
                <Link to="/menu" className="text-brand hover:underline">Ver o cardápio →</Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {orders.map(o => {
                  const reviewed = reviewByOrder.get(o.id);
                  return (
                    <li key={o.id} className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link to="/pedido/$orderNumber" params={{ orderNumber: String(o.order_number) }} className="font-display font-bold hover:text-brand">
                            Pedido #{o.order_number}
                          </Link>
                          <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-card px-2.5 py-1 text-xs font-bold">{STATUS_LABEL[o.status] ?? o.status}</span>
                          <p className="mt-1 font-display text-lg font-extrabold text-gradient-flame">{formatBRL(Number(o.total))}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {(o.order_items ?? []).map((it: { id: string; quantity: number; product_name: string }) => `${it.quantity}x ${it.product_name}`).join(" • ")}
                      </p>
                      {o.status === "delivered" && (
                        <div className="mt-3">
                          {reviewed ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                              <Star className="h-3 w-3 fill-amber-400" /> Avaliado ({reviewed}/5)
                            </span>
                          ) : (
                            <button onClick={() => setReviewingOrder({ id: o.id, number: o.order_number })} className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-400/20">
                              <Star className="h-3 w-3" /> Avaliar
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {reviewingOrder && (
        <ReviewDialog
          order={reviewingOrder}
          userId={user!.id}
          onClose={() => setReviewingOrder(null)}
          onDone={() => { setReviewingOrder(null); qc.invalidateQueries({ queryKey: ["my-reviews"] }); }}
        />
      )}

      {addrEdit && (
        <AddressDialog
          initial={addrEdit}
          userId={user!.id}
          onClose={() => setAddrEdit(null)}
          onDone={() => { setAddrEdit(null); qc.invalidateQueries({ queryKey: ["my-addresses"] }); }}
        />
      )}
    </AppShell>
  );
}

function Inp({ label, v, on }: { label: string; v: string; on: (s: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input value={v} onChange={e => on(e.target.value)} className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand" />
    </label>
  );
}

function ReviewDialog({ order, userId, onClose, onDone }: { order: { id: string; number: number }; userId: string; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const { error } = await supabase.from("order_reviews").insert({
      order_id: order.id, user_id: userId, rating, comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Avaliação enviada! Obrigado.");
    onDone();
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar pedido #{order.number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Sua nota</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setRating(i)} aria-label={`${i} estrelas`}>
                  <Star className={`h-9 w-9 transition ${i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Comentário (opcional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 300))}
              rows={3}
              placeholder="Conte como foi sua experiência..."
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{comment.length}/300</p>
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm">Cancelar</button>
          <button onClick={submit} disabled={saving} className="h-10 rounded-lg gradient-flame px-4 text-sm font-semibold text-white glow-brand disabled:opacity-50">
            {saving ? "Enviando..." : "Enviar avaliação"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddressDialog({ initial, userId, onClose, onDone }: { initial: Partial<AddressRow>; userId: string; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    label: initial.label ?? "",
    zip_code: initial.zip_code ?? "",
    street: initial.street ?? "",
    number: initial.number ?? "",
    complement: initial.complement ?? "",
    neighborhood: initial.neighborhood ?? "",
    city: initial.city ?? "",
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial.id;

  async function submit() {
    if (!f.street.trim() || !f.city.trim()) return toast.error("Rua e cidade são obrigatórios");
    setSaving(true);
    const payload = {
      label: f.label || null, zip_code: f.zip_code || null,
      street: f.street, number: f.number || null,
      complement: f.complement || null, neighborhood: f.neighborhood || null,
      city: f.city,
    };
    const res = isEdit
      ? await supabase.from("addresses").update(payload).eq("id", initial.id!)
      : await supabase.from("addresses").insert({ ...payload, user_id: userId });
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(isEdit ? "Endereço atualizado" : "Endereço adicionado");
    onDone();
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar endereço" : "Novo endereço"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Inp label="Apelido" v={f.label} on={v => setF({ ...f, label: v })} />
          <Inp label="CEP" v={f.zip_code} on={v => setF({ ...f, zip_code: v })} />
          <div className="sm:col-span-2"><Inp label="Rua" v={f.street} on={v => setF({ ...f, street: v })} /></div>
          <Inp label="Número" v={f.number} on={v => setF({ ...f, number: v })} />
          <Inp label="Complemento" v={f.complement} on={v => setF({ ...f, complement: v })} />
          <Inp label="Bairro" v={f.neighborhood} on={v => setF({ ...f, neighborhood: v })} />
          <Inp label="Cidade" v={f.city} on={v => setF({ ...f, city: v })} />
        </div>
        <DialogFooter>
          <button onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm">Cancelar</button>
          <button onClick={submit} disabled={saving} className="h-10 rounded-lg gradient-flame px-4 text-sm font-semibold text-white glow-brand disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
