import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, QrCode, Save, X, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/cart-store";

export const Route = createFileRoute("/_authenticated/admin/pagamentos")({ component: Page });

type PixSettings = {
  enabled?: boolean;
  key: string;
  qr_url?: string;
  instructions?: string;
};

function Page() {
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(true);
  const [key, setKey] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["admin", "pix-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "payment_pix")
        .maybeSingle();
      if (error) throw error;
      return data?.value as PixSettings | null;
    },
  });

  const { data: paymentStats = { total: 0, pix_count: 0, avg_transaction: 0 } } = useQuery({
    queryKey: ["admin", "payment-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("total, payment_method")
        .eq("status", "delivered");
      if (error) throw error;
      const orders = data ?? [];
      const pixOrders = orders.filter(o => o.payment_method === "pix");
      return {
        total: orders.reduce((sum, o) => sum + Number(o.total), 0),
        pix_count: pixOrders.length,
        avg_transaction: pixOrders.length > 0 ? pixOrders.reduce((sum, o) => sum + Number(o.total), 0) / pixOrders.length : 0,
      };
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setEnabled(settingsQuery.data.enabled ?? true);
    setKey(settingsQuery.data.key ?? "");
    setQrUrl(settingsQuery.data.qr_url ?? "");
    setInstructions(settingsQuery.data.instructions ?? "");
  }, [settingsQuery.data]);

  async function save() {
    if (!key.trim()) {
      return toast.error("Informe a chave PIX");
    }

    setSaving(true);
    try {
      const existing = await supabase
        .from("settings")
        .select("key")
        .eq("key", "payment_pix")
        .maybeSingle();

      const payload = {
        key: key.trim(),
        qr_url: qrUrl.trim() || null,
        instructions: instructions.trim() || null,
        enabled,
      };

      const result = existing.data
        ? await supabase.from("settings").update({ value: payload }).eq("key", "payment_pix")
        : await supabase.from("settings").insert({ key: "payment_pix", value: payload });

      if (result.error) throw result.error;
      toast.success("Configuração de PIX salva");
      qc.invalidateQueries({ queryKey: ["admin", "pix-settings"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  }

  const pixConfig = settingsQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Pagamentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie PIX e visualize estatísticas de transações</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl gradient-flame px-4 font-display font-semibold text-white glow-brand disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar configuração"}
        </button>
      </div>

      {/* Payment Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">TOTAL EM VENDAS</p>
              <p className="mt-2 font-display text-3xl font-bold text-gradient-flame">{formatBRL(paymentStats.total)}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-orange-500/20">
              <DollarSign className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">PEDIDOS POR PIX</p>
              <p className="mt-2 font-display text-3xl font-bold">{paymentStats.pix_count}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-blue-500/20">
              <CreditCard className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">TICKET MÉDIO PIX</p>
              <p className="mt-2 font-display text-3xl font-bold">{formatBRL(paymentStats.avg_transaction)}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-500/20">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Ativar PIX</span>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                <span className="text-sm">Permitir pagamento por PIX durante o checkout</span>
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Chave PIX</span>
              <input
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="E-mail, CPF, telefone ou chave aleatória"
                className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">URL do QR Code (opcional)</span>
              <input
                value={qrUrl}
                onChange={e => setQrUrl(e.target.value)}
                placeholder="https://..."
                className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Instruções de pagamento</span>
              <textarea
                rows={4}
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="Ex: copie a chave e conclua o pagamento no seu app bancário"
                className="rounded-lg border border-border bg-surface p-3 text-sm outline-none focus:border-brand"
              />
            </label>
          </div>
        </div>

        <aside className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-[0.2em]">
            <QrCode className="h-4 w-4" /> Prévia do checkout
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold">PIX ativo</p>
              <p className="text-sm text-muted-foreground">O checkout exibirá essas informações quando o cliente selecionar PIX.</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
              <div className="mb-2 font-semibold">Chave</div>
              <div className="rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground">{key || "Nenhuma chave configurada"}</div>
            </div>

            {qrUrl ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-background p-4">
                <img src={qrUrl} alt="QR Code PIX" className="h-52 w-full rounded-2xl object-cover" />
              </div>
            ) : null}

            {instructions ? (
              <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">{instructions}</div>
            ) : null}
          </div>
        </aside>
      </div>

      {settingsQuery.isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Erro ao carregar configuração de PIX. Atualize a página e tente novamente.
        </div>
      )}
    </div>
  );
}
