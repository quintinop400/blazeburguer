import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_QUEM_SOMOS,
  mergeQuemSomos,
  type QuemSomosContent,
} from "@/lib/quem-somos-content";
import { AdminImageField } from "@/components/admin/PageFormBits";

export const Route = createFileRoute("/_authenticated/admin/paginas/quem-somos")({
  component: QuemSomosAdmin,
});

const ICON_OPTIONS = [
  "Leaf", "Truck", "Sparkles", "ChefHat", "ShieldCheck", "CreditCard",
  "Award", "Flame", "Users", "Clock", "ThumbsUp", "Utensils", "Coffee",
  "Pizza", "Gift", "Smile", "Zap", "Heart", "Star",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls = "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand";
const taCls = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function QuemSomosAdmin() {
  const qc = useQueryClient();
  const [c, setC] = useState<QuemSomosContent>(DEFAULT_QUEM_SOMOS);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "page_quem_somos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings").select("value").eq("key", "page_quem_somos").maybeSingle();
      if (error) throw error;
      return mergeQuemSomos(data?.value);
    },
  });

  useEffect(() => { if (data) setC(data); }, [data]);

  async function save() {
    setSaving(true);
    const value = JSON.parse(JSON.stringify(c));
    const { error: updErr, count } = await supabase
      .from("settings")
      .update({ value }, { count: "exact" })
      .eq("key", "page_quem_somos");
    if (updErr) { setSaving(false); return toast.error(updErr.message); }
    if (!count) {
      const { error: insErr } = await supabase
        .from("settings").insert({ key: "page_quem_somos", value });
      if (insErr) { setSaving(false); return toast.error(insErr.message); }
    }
    setSaving(false);
    toast.success("Página atualizada");
    qc.invalidateQueries({ queryKey: ["admin", "page_quem_somos"] });
    qc.invalidateQueries({ queryKey: ["page", "quem_somos"] });
  }

  // generic list helpers
  function updateArr<T>(arr: T[], i: number, patch: Partial<T>): T[] {
    return arr.map((x, idx) => (idx === i ? { ...x, ...patch } : x));
  }
  function removeAt<T>(arr: T[], i: number): T[] { return arr.filter((_, idx) => idx !== i); }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Página: Quem Somos</h1>
          <p className="text-sm text-muted-foreground">
            Edite todos os blocos da página institucional. As alterações refletem no site após salvar.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/quem-somos"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:border-brand"
          >
            <ExternalLink className="h-4 w-4" /> Ver página
          </a>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg gradient-flame px-5 text-sm font-semibold text-white glow-brand disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar alterações
          </button>
        </div>
      </div>

      {/* HERO */}
      <SectionCard title="Hero (topo)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Selo (badge)">
            <input className={inputCls} value={c.hero.badge}
              onChange={e => setC({ ...c, hero: { ...c.hero, badge: e.target.value } })} />
          </Field>
          <AdminImageField label="Imagem do hero" value={c.hero.image_url}
            onChange={(v) => setC({ ...c, hero: { ...c.hero, image_url: v } })} />

          <Field label="Título — primeira parte">
            <input className={inputCls} value={c.hero.title_part1}
              onChange={e => setC({ ...c, hero: { ...c.hero, title_part1: e.target.value } })} />
          </Field>
          <Field label="Título — destaque">
            <input className={inputCls} value={c.hero.title_highlight}
              onChange={e => setC({ ...c, hero: { ...c.hero, title_highlight: e.target.value } })} />
          </Field>
          <Field label="CTA primário">
            <input className={inputCls} value={c.hero.cta_primary_label}
              onChange={e => setC({ ...c, hero: { ...c.hero, cta_primary_label: e.target.value } })} />
          </Field>
          <Field label="CTA secundário">
            <input className={inputCls} value={c.hero.cta_secondary_label}
              onChange={e => setC({ ...c, hero: { ...c.hero, cta_secondary_label: e.target.value } })} />
          </Field>
        </div>
        <Field label="Subtítulo">
          <textarea rows={3} className={taCls} value={c.hero.subtitle}
            onChange={e => setC({ ...c, hero: { ...c.hero, subtitle: e.target.value } })} />
        </Field>
      </SectionCard>

      {/* HISTÓRIA */}
      <SectionCard title="Nossa História">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow"><input className={inputCls} value={c.historia.eyebrow}
            onChange={e => setC({ ...c, historia: { ...c.historia, eyebrow: e.target.value } })} /></Field>
          <Field label="URL da imagem"><input className={inputCls} value={c.historia.image_url}
            onChange={e => setC({ ...c, historia: { ...c.historia, image_url: e.target.value } })} /></Field>
        </div>
        <Field label="Título"><input className={inputCls} value={c.historia.title}
          onChange={e => setC({ ...c, historia: { ...c.historia, title: e.target.value } })} /></Field>
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parágrafos</span>
          {c.historia.paragraphs.map((p, i) => (
            <div key={i} className="flex gap-2">
              <textarea rows={2} className={taCls} value={p}
                onChange={e => setC({ ...c, historia: { ...c.historia, paragraphs: c.historia.paragraphs.map((x, idx) => idx === i ? e.target.value : x) } })} />
              <button onClick={() => setC({ ...c, historia: { ...c.historia, paragraphs: removeAt(c.historia.paragraphs, i) } })}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button onClick={() => setC({ ...c, historia: { ...c.historia, paragraphs: [...c.historia.paragraphs, ""] } })}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <Plus className="h-4 w-4" /> Adicionar parágrafo
          </button>
        </div>
      </SectionCard>

      {/* DNA */}
      <SectionCard title="Missão · Visão · Valores">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow"><input className={inputCls} value={c.dna.eyebrow}
            onChange={e => setC({ ...c, dna: { ...c.dna, eyebrow: e.target.value } })} /></Field>
          <Field label="Título"><input className={inputCls} value={c.dna.title}
            onChange={e => setC({ ...c, dna: { ...c.dna, title: e.target.value } })} /></Field>
        </div>
        <div className="space-y-3">
          {c.dna.cards.map((card, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Card #{i + 1}</span>
                <button onClick={() => setC({ ...c, dna: { ...c.dna, cards: removeAt(c.dna.cards, i) } })}
                  className="text-destructive hover:underline text-xs"><Trash2 className="inline h-3.5 w-3.5" /> Remover</button>
              </div>
              <input className={`${inputCls} mt-2`} placeholder="Título" value={card.title}
                onChange={e => setC({ ...c, dna: { ...c.dna, cards: updateArr(c.dna.cards, i, { title: e.target.value }) } })} />
              <textarea rows={2} className={`${taCls} mt-2`} placeholder="Descrição" value={card.desc}
                onChange={e => setC({ ...c, dna: { ...c.dna, cards: updateArr(c.dna.cards, i, { desc: e.target.value }) } })} />
            </div>
          ))}
          <button onClick={() => setC({ ...c, dna: { ...c.dna, cards: [...c.dna.cards, { title: "", desc: "" }] } })}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <Plus className="h-4 w-4" /> Adicionar card
          </button>
        </div>
      </SectionCard>

      {/* DIFERENCIAIS */}
      <SectionCard title="Diferenciais">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow"><input className={inputCls} value={c.diferenciais.eyebrow}
            onChange={e => setC({ ...c, diferenciais: { ...c.diferenciais, eyebrow: e.target.value } })} /></Field>
          <Field label="Título"><input className={inputCls} value={c.diferenciais.title}
            onChange={e => setC({ ...c, diferenciais: { ...c.diferenciais, title: e.target.value } })} /></Field>
        </div>
        <Field label="Subtítulo"><input className={inputCls} value={c.diferenciais.subtitle}
          onChange={e => setC({ ...c, diferenciais: { ...c.diferenciais, subtitle: e.target.value } })} /></Field>
        <div className="space-y-3">
          {c.diferenciais.items.map((it, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Item #{i + 1}</span>
                <button onClick={() => setC({ ...c, diferenciais: { ...c.diferenciais, items: removeAt(c.diferenciais.items, i) } })}
                  className="text-destructive hover:underline text-xs"><Trash2 className="inline h-3.5 w-3.5" /> Remover</button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <select className={inputCls} value={it.icon}
                  onChange={e => setC({ ...c, diferenciais: { ...c.diferenciais, items: updateArr(c.diferenciais.items, i, { icon: e.target.value }) } })}>
                  {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <input className={inputCls} placeholder="Título" value={it.title}
                  onChange={e => setC({ ...c, diferenciais: { ...c.diferenciais, items: updateArr(c.diferenciais.items, i, { title: e.target.value }) } })} />
              </div>
              <textarea rows={2} className={`${taCls} mt-2`} placeholder="Descrição" value={it.desc}
                onChange={e => setC({ ...c, diferenciais: { ...c.diferenciais, items: updateArr(c.diferenciais.items, i, { desc: e.target.value }) } })} />
            </div>
          ))}
          <button onClick={() => setC({ ...c, diferenciais: { ...c.diferenciais, items: [...c.diferenciais.items, { icon: "Sparkles", title: "", desc: "" }] } })}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <Plus className="h-4 w-4" /> Adicionar diferencial
          </button>
        </div>
      </SectionCard>

      {/* EQUIPE */}
      <SectionCard title="Equipe">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow"><input className={inputCls} value={c.equipe.eyebrow}
            onChange={e => setC({ ...c, equipe: { ...c.equipe, eyebrow: e.target.value } })} /></Field>
          <Field label="Título"><input className={inputCls} value={c.equipe.title}
            onChange={e => setC({ ...c, equipe: { ...c.equipe, title: e.target.value } })} /></Field>
        </div>
        <div className="space-y-3">
          {c.equipe.members.map((m, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Membro #{i + 1}</span>
                <button onClick={() => setC({ ...c, equipe: { ...c.equipe, members: removeAt(c.equipe.members, i) } })}
                  className="text-destructive hover:underline text-xs"><Trash2 className="inline h-3.5 w-3.5" /> Remover</button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input className={inputCls} placeholder="Nome" value={m.name}
                  onChange={e => setC({ ...c, equipe: { ...c.equipe, members: updateArr(c.equipe.members, i, { name: e.target.value }) } })} />
                <input className={inputCls} placeholder="Cargo" value={m.role}
                  onChange={e => setC({ ...c, equipe: { ...c.equipe, members: updateArr(c.equipe.members, i, { role: e.target.value }) } })} />
              </div>
              <input className={`${inputCls} mt-2`} placeholder="URL da foto" value={m.img}
                onChange={e => setC({ ...c, equipe: { ...c.equipe, members: updateArr(c.equipe.members, i, { img: e.target.value }) } })} />
              <textarea rows={2} className={`${taCls} mt-2`} placeholder="Descrição" value={m.desc}
                onChange={e => setC({ ...c, equipe: { ...c.equipe, members: updateArr(c.equipe.members, i, { desc: e.target.value }) } })} />
            </div>
          ))}
          <button onClick={() => setC({ ...c, equipe: { ...c.equipe, members: [...c.equipe.members, { name: "", role: "", desc: "", img: "" }] } })}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <Plus className="h-4 w-4" /> Adicionar membro
          </button>
        </div>
      </SectionCard>

      {/* STATS */}
      <SectionCard title="Estatísticas (números)">
        <div className="space-y-3">
          {c.stats.items.map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Stat #{i + 1}</span>
                <button onClick={() => setC({ ...c, stats: { items: removeAt(c.stats.items, i) } })}
                  className="text-destructive hover:underline text-xs"><Trash2 className="inline h-3.5 w-3.5" /> Remover</button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <input type="number" step="any" className={inputCls} placeholder="Valor" value={s.value}
                  onChange={e => setC({ ...c, stats: { items: updateArr(c.stats.items, i, { value: Number(e.target.value) }) } })} />
                <input className={inputCls} placeholder="Sufixo (ex: +)" value={s.suffix}
                  onChange={e => setC({ ...c, stats: { items: updateArr(c.stats.items, i, { suffix: e.target.value }) } })} />
                <input type="number" className={inputCls} placeholder="Decimais" value={s.decimals}
                  onChange={e => setC({ ...c, stats: { items: updateArr(c.stats.items, i, { decimals: Number(e.target.value) }) } })} />
                <input className={inputCls} placeholder="Label" value={s.label}
                  onChange={e => setC({ ...c, stats: { items: updateArr(c.stats.items, i, { label: e.target.value }) } })} />
              </div>
            </div>
          ))}
          <button onClick={() => setC({ ...c, stats: { items: [...c.stats.items, { value: 0, label: "", suffix: "", decimals: 0 }] } })}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <Plus className="h-4 w-4" /> Adicionar estatística
          </button>
        </div>
      </SectionCard>

      {/* GALERIA */}
      <SectionCard title="Galeria de fotos">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow"><input className={inputCls} value={c.galeria.eyebrow}
            onChange={e => setC({ ...c, galeria: { ...c.galeria, eyebrow: e.target.value } })} /></Field>
          <Field label="Título"><input className={inputCls} value={c.galeria.title}
            onChange={e => setC({ ...c, galeria: { ...c.galeria, title: e.target.value } })} /></Field>
        </div>
        <div className="space-y-2">
          {c.galeria.images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} placeholder="URL da imagem" value={url}
                onChange={e => setC({ ...c, galeria: { ...c.galeria, images: c.galeria.images.map((x, idx) => idx === i ? e.target.value : x) } })} />
              <button onClick={() => setC({ ...c, galeria: { ...c.galeria, images: removeAt(c.galeria.images, i) } })}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button onClick={() => setC({ ...c, galeria: { ...c.galeria, images: [...c.galeria.images, ""] } })}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <Plus className="h-4 w-4" /> Adicionar foto
          </button>
        </div>
      </SectionCard>

      {/* DEPOIMENTOS */}
      <SectionCard title="Depoimentos">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow"><input className={inputCls} value={c.depoimentos.eyebrow}
            onChange={e => setC({ ...c, depoimentos: { ...c.depoimentos, eyebrow: e.target.value } })} /></Field>
          <Field label="Título"><input className={inputCls} value={c.depoimentos.title}
            onChange={e => setC({ ...c, depoimentos: { ...c.depoimentos, title: e.target.value } })} /></Field>
        </div>
        <div className="space-y-3">
          {c.depoimentos.items.map((t, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Depoimento #{i + 1}</span>
                <button onClick={() => setC({ ...c, depoimentos: { ...c.depoimentos, items: removeAt(c.depoimentos.items, i) } })}
                  className="text-destructive hover:underline text-xs"><Trash2 className="inline h-3.5 w-3.5" /> Remover</button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input className={inputCls} placeholder="Nome" value={t.name}
                  onChange={e => setC({ ...c, depoimentos: { ...c.depoimentos, items: updateArr(c.depoimentos.items, i, { name: e.target.value }) } })} />
                <input type="number" min={1} max={5} className={inputCls} placeholder="Nota (1-5)" value={t.rating}
                  onChange={e => setC({ ...c, depoimentos: { ...c.depoimentos, items: updateArr(c.depoimentos.items, i, { rating: Number(e.target.value) }) } })} />
              </div>
              <textarea rows={2} className={`${taCls} mt-2`} placeholder="Texto" value={t.text}
                onChange={e => setC({ ...c, depoimentos: { ...c.depoimentos, items: updateArr(c.depoimentos.items, i, { text: e.target.value }) } })} />
            </div>
          ))}
          <button onClick={() => setC({ ...c, depoimentos: { ...c.depoimentos, items: [...c.depoimentos.items, { name: "", text: "", rating: 5 }] } })}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <Plus className="h-4 w-4" /> Adicionar depoimento
          </button>
        </div>
      </SectionCard>

      {/* LOCALIZAÇÃO */}
      <SectionCard title="Localização">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow"><input className={inputCls} value={c.localizacao.eyebrow}
            onChange={e => setC({ ...c, localizacao: { ...c.localizacao, eyebrow: e.target.value } })} /></Field>
          <Field label="Título"><input className={inputCls} value={c.localizacao.title}
            onChange={e => setC({ ...c, localizacao: { ...c.localizacao, title: e.target.value } })} /></Field>
          <Field label="Endereço"><input className={inputCls} value={c.localizacao.address}
            onChange={e => setC({ ...c, localizacao: { ...c.localizacao, address: e.target.value } })} /></Field>
          <Field label="Horário"><input className={inputCls} value={c.localizacao.hours}
            onChange={e => setC({ ...c, localizacao: { ...c.localizacao, hours: e.target.value } })} /></Field>
        </div>
        <Field label="Descrição">
          <textarea rows={2} className={taCls} value={c.localizacao.description}
            onChange={e => setC({ ...c, localizacao: { ...c.localizacao, description: e.target.value } })} />
        </Field>
        <Field label="URL do mapa (embed do Google Maps)">
          <input className={inputCls} value={c.localizacao.map_url}
            onChange={e => setC({ ...c, localizacao: { ...c.localizacao, map_url: e.target.value } })} />
        </Field>
      </SectionCard>

      {/* SOCIAL */}
      <SectionCard title="Responsabilidade Social">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow"><input className={inputCls} value={c.social.eyebrow}
            onChange={e => setC({ ...c, social: { ...c.social, eyebrow: e.target.value } })} /></Field>
          <Field label="Título"><input className={inputCls} value={c.social.title}
            onChange={e => setC({ ...c, social: { ...c.social, title: e.target.value } })} /></Field>
          <Field label="CTA"><input className={inputCls} value={c.social.cta_label}
            onChange={e => setC({ ...c, social: { ...c.social, cta_label: e.target.value } })} /></Field>
          <Field label="URL da imagem de fundo"><input className={inputCls} value={c.social.image_url}
            onChange={e => setC({ ...c, social: { ...c.social, image_url: e.target.value } })} /></Field>
        </div>
        <Field label="Descrição">
          <textarea rows={3} className={taCls} value={c.social.description}
            onChange={e => setC({ ...c, social: { ...c.social, description: e.target.value } })} />
        </Field>
      </SectionCard>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-lg gradient-flame px-6 text-sm font-semibold text-white glow-brand disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar alterações
        </button>
      </div>
    </div>
  );
}
