import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, AlertTriangle, Shield, Database, FileText, Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: settings = {} } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("key,value")
        .order("key");
      if (error) throw error;
      const obj: Record<string, string> = {};
      (data ?? []).forEach(row => {
        obj[row.key] = typeof row.value === "string" ? row.value : JSON.stringify(row.value ?? "");
      });
      return obj;
    },
  });

  const [formData, setFormData] = useState(settings);

  async function save() {
    setLoading(true);
    try {
      const keys = Object.keys(formData);
      for (const key of keys) {
        const existing = (Object.keys(settings)).includes(key);
        if (existing) {
          await supabase.from("settings").update({ value: formData[key] }).eq("key", key);
        } else {
          await supabase.from("settings").insert({ key, value: formData[key] });
        }
      }
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie as configurações gerais do sistema</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand" />
            <h2 className="font-display text-lg font-bold">Informações da loja</h2>
          </div>
          <div className="space-y-4">
            <Field
              label="Nome da loja"
              value={formData.store_name ?? "BlazeBurger"}
              onChange={v => setFormData({ ...formData, store_name: v })}
            />
            <Field
              label="Telefone"
              value={formData.store_phone ?? ""}
              onChange={v => setFormData({ ...formData, store_phone: v })}
              placeholder="(11) 99999-9999"
              type="tel"
            />
            <Field
              label="E-mail"
              value={formData.store_email ?? ""}
              onChange={v => setFormData({ ...formData, store_email: v })}
              placeholder="contato@blazeburger.com"
              type="email"
            />
            <Field
              label="Endereço"
              value={formData.store_address ?? ""}
              onChange={v => setFormData({ ...formData, store_address: v })}
              placeholder="Rua exemplo, 123"
            />
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-flame" />
            <h2 className="font-display text-lg font-bold">Entrega</h2>
          </div>
          <div className="space-y-4">
            <Field
              label="Taxa de entrega (R$)"
              value={formData.delivery_fee ?? "0"}
              onChange={v => setFormData({ ...formData, delivery_fee: v })}
              type="number"
              step="0.01"
            />
            <Field
              label="Tempo mínimo de preparo (min)"
              value={formData.min_prep_time ?? "20"}
              onChange={v => setFormData({ ...formData, min_prep_time: v })}
              type="number"
            />
            <Field
              label="Tempo máximo de entrega (min)"
              value={formData.max_delivery_time ?? "60"}
              onChange={v => setFormData({ ...formData, max_delivery_time: v })}
              type="number"
            />
            <Field
              label="Raio de entrega (km)"
              value={formData.delivery_radius ?? "15"}
              onChange={v => setFormData({ ...formData, delivery_radius: v })}
              type="number"
              step="0.5"
            />
          </div>
        </div>

        {/* PIX Settings */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <h2 className="font-display text-lg font-bold">PIX</h2>
          </div>
          <div className="space-y-4">
            <Field
              label="Chave PIX"
              value={formData.pix_key ?? ""}
              onChange={v => setFormData({ ...formData, pix_key: v })}
              placeholder="Sua chave PIX"
            />
            <Field
              label="Tipo de chave"
              value={formData.pix_key_type ?? "cpf"}
              onChange={v => setFormData({ ...formData, pix_key_type: v })}
              as="select"
              options={["cpf", "email", "phone", "random"]}
            />
            <Field
              label="Nome do recebedor"
              value={formData.pix_receiver_name ?? ""}
              onChange={v => setFormData({ ...formData, pix_receiver_name: v })}
              placeholder="Nome completo"
            />
          </div>
        </div>

        {/* Business Hours */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-500" />
            <h2 className="font-display text-lg font-bold">Horário de funcionamento</h2>
          </div>
          <div className="space-y-4">
            <Field
              label="Abre em (HH:MM)"
              value={formData.opens_at ?? "10:00"}
              onChange={v => setFormData({ ...formData, opens_at: v })}
              type="time"
            />
            <Field
              label="Fecha em (HH:MM)"
              value={formData.closes_at ?? "22:00"}
              onChange={v => setFormData({ ...formData, closes_at: v })}
              type="time"
            />
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.closed_today !== "false"}
                onChange={e => setFormData({ ...formData, closed_today: e.target.checked ? "true" : "false" })}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm">Fechado hoje</span>
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="font-display text-lg font-bold text-destructive">Zona de perigo</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Ações que não podem ser desfeitas</p>
        <button className="mt-4 rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition">
          Limpar cache
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={() => setFormData(settings)}
          className="h-11 rounded-xl border border-border px-6 font-semibold hover:bg-surface"
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={loading}
          className="flex h-11 items-center gap-2 rounded-xl gradient-flame px-6 font-semibold text-white glow-brand disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  as,
  options,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  as?: "select";
  options?: string[];
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      {as === "select" ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
        >
          {(options ?? []).map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          step={step}
          className="h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
        />
      )}
    </label>
  );
}
