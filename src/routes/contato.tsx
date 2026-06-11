import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { MessageCircle, Phone, Mail, MapPin, Clock, Send, Loader2, Instagram, Facebook } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { submitContactMessage } from "@/lib/contact.functions";
import { usePageContent } from "@/lib/page-content";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — BlazeBurger" },
      { name: "description", content: "Fale com a equipe BlazeBurger. WhatsApp, telefone, e-mail, endereço e formulário direto." },
      { property: "og:title", content: "Contato — BlazeBurger" },
      { property: "og:description", content: "Fale com a equipe BlazeBurger." },
    ],
  }),
  component: ContactPage,
});

const Schema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1, "Escreva uma mensagem").max(2000),
});

type ContatoContent = {
  title: string;
  subtitle: string;
  description: string;
  phone: string;
  whatsapp: string;
  whatsapp_label: string;
  email: string;
  address: string;
  hours: string;
  map_embed: string;
  cta_label: string;
  social: { instagram: string; facebook: string; tiktok: string };
};

function ContactPage() {
  const c = usePageContent<ContatoContent>("contato");
  const submit = useServerFn(submitContactMessage);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setLoading(true);
    try {
      await submit({ data: parsed.data });
      toast.success("Mensagem enviada! Vamos responder em breve.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  }

  const social = c.social ?? { instagram: "", facebook: "", tiktok: "" };

  return (
    <AppShell>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 gradient-flame opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">{c.subtitle}</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">{c.title}</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">{c.description}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {c.whatsapp && (
            <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-brand">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white"><MessageCircle className="h-5 w-5" /></div>
              <div>
                <p className="font-display font-semibold">WhatsApp</p>
                <p className="text-sm text-muted-foreground">{c.cta_label}</p>
                <p className="mt-1 text-sm text-brand">{c.whatsapp_label || c.whatsapp}</p>
              </div>
            </a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone.replace(/[^+\d]/g, "")}`} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-brand">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-flame text-white"><Phone className="h-5 w-5" /></div>
              <div>
                <p className="font-display font-semibold">Telefone</p>
                <p className="mt-1 text-sm text-brand">{c.phone}</p>
              </div>
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-brand">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-flame text-white"><Mail className="h-5 w-5" /></div>
              <div>
                <p className="font-display font-semibold">E-mail</p>
                <p className="mt-1 text-sm text-brand">{c.email}</p>
              </div>
            </a>
          )}
          {c.address && (
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-flame text-white"><MapPin className="h-5 w-5" /></div>
              <div>
                <p className="font-display font-semibold">Endereço</p>
                <p className="text-sm text-muted-foreground">{c.address}</p>
              </div>
            </div>
          )}
          {c.hours && (
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-flame text-white"><Clock className="h-5 w-5" /></div>
              <div>
                <p className="font-display font-semibold">Horários</p>
                <p className="text-sm text-muted-foreground">{c.hours}</p>
              </div>
            </div>
          )}
          {(social.instagram || social.facebook || social.tiktok) && (
            <div className="flex flex-wrap gap-2">
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-brand hover:text-brand">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-brand hover:text-brand">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {social.tiktok && (
                <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-muted-foreground hover:border-brand hover:text-brand">
                  TikTok
                </a>
              )}
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md sm:p-8">
          <h2 className="font-display text-2xl font-bold">Mande sua mensagem</h2>
          <p className="mt-1 text-sm text-muted-foreground">Preencha o formulário que a gente retorna pra você.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand" placeholder="Seu nome" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand" placeholder="voce@email.com" />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone (opcional)</span>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand" placeholder="(11) 99999-0000" />
          </label>
          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mensagem</span>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-brand" placeholder="Como podemos te ajudar?" />
          </label>

          <button type="submit" disabled={loading} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-flame px-6 text-sm font-semibold text-white glow-brand transition hover:scale-[1.01] disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      </section>

      {c.map_embed && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="aspect-[16/7] overflow-hidden rounded-2xl border border-border">
            <iframe title="Mapa" src={c.map_embed} className="h-full w-full" loading="lazy" />
          </div>
        </section>
      )}
    </AppShell>
  );
}
