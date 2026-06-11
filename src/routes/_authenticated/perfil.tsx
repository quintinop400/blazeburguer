import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, MapPin, Package, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { signOut, useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/lib/cart-store";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: Profile,
});

const STATUS_LABEL: Record<string, string> = {
  received: "Recebido", confirmed: "Confirmado", preparing: "Em preparo",
  ready: "Pronto", out_for_delivery: "Saiu para entrega",
  delivered: "Entregue", cancelled: "Cancelado",
};

function Profile() {
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

  async function saveProfile() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
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
                {orders.map(o => (
                  <li key={o.id} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display font-bold">Pedido #{o.order_number}</p>
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
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
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
