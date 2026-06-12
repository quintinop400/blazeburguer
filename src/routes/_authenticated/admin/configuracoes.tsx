import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Clock, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { BusinessHoursConfig } from "@/lib/business-hours";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: SettingsPage,
});

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const DEFAULT_HOURS: BusinessHoursConfig = {
  enabled: false,
  schedule: Object.fromEntries(Array.from({ length: 7 }, (_, i) => [String(i), { open: true, from: "11:00", to: "22:00" }])) as BusinessHoursConfig["schedule"],
  closed_message: "Estamos fechados no momento. Volte em breve!",
};

async function upsertSetting(key: string, value: unknown) {
  // tenta update, se nada atingido faz insert
  const { data: existing } = await supabase.from("settings").select("key").eq("key", key).maybeSingle();
  if (existing) {
    return supabase.from("settings").update({ value: value as never }).eq("key", key);
  }
  return supabase.from("settings").insert({ key, value: value as never });
}

function SettingsPage() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: whatsapp = "" } = useQuery({
    queryKey: ["settings", "whatsapp_number"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "whatsapp_number").maybeSingle();
      const raw = data?.value;
      const v = typeof raw === "string" ? raw : (raw as { number?: string } | null)?.number ?? "";
      return v as string;
    },
  });

  const { data: hours } = useQuery({
    queryKey: ["settings", "business_hours"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "business_hours").maybeSingle();
      const value = data?.value as Partial<BusinessHoursConfig> | null;
      if (!value || typeof value !== "object") return DEFAULT_HOURS;
      return { ...DEFAULT_HOURS, ...value, schedule: { ...DEFAULT_HOURS.schedule, ...(value.schedule ?? {}) } } as BusinessHoursConfig;
    },
  });

  const [phone, setPhone] = useState("");
  const [cfg, setCfg] = useState<BusinessHoursConfig>(DEFAULT_HOURS);

  useEffect(() => { setPhone(maskPhone(whatsapp || "")); }, [whatsapp]);
  useEffect(() => { if (hours) setCfg(hours); }, [hours]);

  async function save() {
    setSaving(true);
    try {
      const digits = phone.replace(/\D/g, "");
      await upsertSetting("whatsapp_number", digits);
      await upsertSetting("business_hours", cfg);
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["business-hours"] });
      qc.invalidateQueries({ queryKey: ["whatsapp-number"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const previewWa = phone.replace(/\D/g, "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">WhatsApp e horário de funcionamento da loja</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-500" />
          <h2 className="font-display text-lg font-bold">WhatsApp da loja</h2>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Número (com DDD)</span>
          <input
            value={phone}
            onChange={e => setPhone(maskPhone(e.target.value))}
            placeholder="(11) 9 9999-9999"
            className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
          />
          {previewWa && (
            <p className="text-xs text-muted-foreground">Preview: <span className="text-brand">wa.me/55{previewWa}</span></p>
          )}
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-flame" />
          <h2 className="font-display text-lg font-bold">Horário de funcionamento</h2>
        </div>

        <label className="mb-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={cfg.enabled}
            onChange={e => setCfg({ ...cfg, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-sm font-semibold">Ativar controle de horário (bloqueia pedidos fora do horário)</span>
        </label>

        <div className="space-y-2">
          {DAYS.map((name, i) => {
            const day = cfg.schedule[String(i)] ?? { open: false };
            return (
              <div key={i} className="grid grid-cols-[100px_80px_1fr_1fr] items-center gap-3 rounded-lg bg-surface p-3">
                <span className="text-sm font-medium">{name}</span>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={day.open}
                    onChange={e => setCfg({ ...cfg, schedule: { ...cfg.schedule, [String(i)]: { ...day, open: e.target.checked } } })}
                  />
                  <span>{day.open ? "Aberto" : "Fechado"}</span>
                </label>
                {day.open ? (
                  <>
                    <input
                      type="time"
                      value={day.from ?? "11:00"}
                      onChange={e => setCfg({ ...cfg, schedule: { ...cfg.schedule, [String(i)]: { ...day, from: e.target.value } } })}
                      className="h-9 rounded-md border border-border bg-card px-2 text-sm"
                    />
                    <input
                      type="time"
                      value={day.to ?? "22:00"}
                      onChange={e => setCfg({ ...cfg, schedule: { ...cfg.schedule, [String(i)]: { ...day, to: e.target.value } } })}
                      className="h-9 rounded-md border border-border bg-card px-2 text-sm"
                    />
                  </>
                ) : <div className="col-span-2 text-xs text-muted-foreground">—</div>}
              </div>
            );
          })}
        </div>

        <label className="mt-4 flex flex-col gap-2">
          <span className="text-sm font-semibold">Mensagem quando fechado</span>
          <input
            value={cfg.closed_message ?? ""}
            onChange={e => setCfg({ ...cfg, closed_message: e.target.value })}
            placeholder="Voltamos amanhã às 11h!"
            className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex h-11 items-center gap-2 rounded-xl gradient-flame px-6 font-semibold text-white glow-brand disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
