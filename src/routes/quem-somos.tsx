import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Leaf, Truck, Sparkles, ChefHat, ShieldCheck, CreditCard, Star, Quote, MapPin, Heart,
  Award, Flame, Users, Clock, ThumbsUp, Utensils, Coffee, Pizza, Gift, Smile, Zap,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_QUEM_SOMOS, mergeQuemSomos } from "@/lib/quem-somos-content";

export const Route = createFileRoute("/quem-somos")({
  head: () => ({
    meta: [
      { title: "Quem Somos — BlazeBurger" },
      { name: "description", content: "Conheça a história, missão e equipe da BlazeBurger." },
      { property: "og:title", content: "Quem Somos — BlazeBurger" },
      { property: "og:description", content: "Conheça a história, missão e equipe da BlazeBurger." },
    ],
  }),
  component: QuemSomosPage,
});

const ICONS: Record<string, typeof Leaf> = {
  Leaf, Truck, Sparkles, ChefHat, ShieldCheck, CreditCard, Award, Flame, Users, Clock, ThumbsUp,
  Utensils, Coffee, Pizza, Gift, Smile, Zap, Heart, Star,
};

function useInView<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setInView(true)),
      { threshold: 0.3 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function CountUp({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  const display = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString("pt-BR");
  return <span ref={ref}>{display}{suffix}</span>;
}

function QuemSomosPage() {
  const { data: content = DEFAULT_QUEM_SOMOS } = useQuery({
    queryKey: ["page", "quem_somos"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "page_quem_somos").maybeSingle();
      return mergeQuemSomos(data?.value);
    },
  });

  const { hero, historia, dna, diferenciais, equipe, stats, galeria, depoimentos, localizacao, social } = content;

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={hero.image_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          <div className="absolute inset-0 gradient-flame opacity-20 mix-blend-overlay" />
        </div>
        <div className="relative mx-auto flex min-h-[60vh] max-w-7xl flex-col items-start justify-center px-4 py-24 sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> {hero.badge}
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl md:text-7xl">
            {hero.title_part1} <span className="text-gradient-flame">{hero.title_highlight}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">{hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/menu" className="inline-flex h-12 items-center rounded-xl gradient-flame px-6 text-sm font-semibold text-white glow-brand transition hover:scale-[1.02]">
              {hero.cta_primary_label}
            </Link>
            <Link to="/contato" className="inline-flex h-12 items-center rounded-xl border border-border bg-surface px-6 text-sm font-semibold transition hover:border-brand">
              {hero.cta_secondary_label}
            </Link>
          </div>
        </div>
      </section>

      {/* História */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="relative overflow-hidden rounded-3xl border border-border">
          <img src={historia.image_url} alt={historia.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-background/60 to-transparent" />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">{historia.eyebrow}</span>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{historia.title}</h2>
          {historia.paragraphs.map((p, i) => (
            <p key={i} className="mt-4 text-muted-foreground">{p}</p>
          ))}
        </div>
      </section>

      {/* Missão · Visão · Valores */}
      <section className="bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">{dna.eyebrow}</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{dna.title}</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {dna.cards.map(c => (
              <div key={c.title} className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md transition hover:border-brand hover:glow-brand">
                <h3 className="font-display text-xl font-bold text-gradient-flame">{c.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">{diferenciais.eyebrow}</span>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{diferenciais.title}</h2>
          <p className="mt-3 text-muted-foreground">{diferenciais.subtitle}</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {diferenciais.items.map(d => {
            const Icon = ICONS[d.icon] ?? Sparkles;
            return (
              <div key={d.title} className="group rounded-2xl border border-border bg-card/40 p-6 transition hover:-translate-y-1 hover:border-brand hover:bg-card">
                <div className="grid h-12 w-12 place-items-center rounded-xl gradient-flame text-white glow-brand transition group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{d.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Equipe */}
      <section className="bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">{equipe.eyebrow}</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{equipe.title}</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {equipe.members.map(p => (
              <div key={p.name} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-brand">
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold">{p.name}</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand">{p.role}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-flame opacity-95" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 text-center text-white sm:grid-cols-2 lg:grid-cols-4">
            {stats.items.map(s => (
              <div key={s.label}>
                <div className="font-display text-4xl font-extrabold sm:text-5xl">
                  <CountUp to={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </div>
                <p className="mt-2 text-sm font-medium uppercase tracking-wider opacity-90">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">{galeria.eyebrow}</span>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{galeria.title}</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {galeria.images.map((src, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-2xl border border-border">
              <img src={src} alt="" className="h-full w-full object-cover transition duration-500 hover:scale-110" />
            </div>
          ))}
        </div>
      </section>

      {/* Depoimentos */}
      <section className="bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">{depoimentos.eyebrow}</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{depoimentos.title}</h2>
          </div>
          <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 scrollbar-hide">
            {depoimentos.items.map((t, i) => (
              <div key={i} className="min-w-[280px] max-w-sm shrink-0 snap-start rounded-2xl border border-border bg-card p-6 sm:min-w-[340px]">
                <Quote className="h-6 w-6 text-brand" />
                <p className="mt-3 text-sm text-foreground">"{t.text}"</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-display text-sm font-semibold">{t.name}</span>
                  <div className="flex gap-0.5 text-flame">
                    {Array.from({ length: t.rating }).map((_, k) => (
                      <Star key={k} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Localização */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">{localizacao.eyebrow}</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{localizacao.title}</h2>
            <p className="mt-4 text-muted-foreground">{localizacao.description}</p>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-brand" /> {localizacao.address}</div>
              <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-brand" /> {localizacao.hours}</div>
            </div>
          </div>
          <div className="aspect-video overflow-hidden rounded-2xl border border-border">
            <iframe title="Mapa" src={localizacao.map_url} className="h-full w-full" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Responsabilidade social */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={social.image_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-background/85" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand">
              <Heart className="h-3.5 w-3.5" /> {social.eyebrow}
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{social.title}</h2>
            <p className="mt-4 text-muted-foreground">{social.description}</p>
            <Link to="/contato" className="mt-6 inline-flex h-11 items-center rounded-xl gradient-flame px-5 text-sm font-semibold text-white glow-brand transition hover:scale-[1.02]">
              {social.cta_label}
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
