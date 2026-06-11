import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, Clock, Truck, Shield } from "lucide-react";
import heroBurger from "@/assets/hero-burger.jpg";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { fetchCategories, fetchProducts } from "@/lib/products";
import { usePageContent } from "@/lib/page-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BlazeBurger — Hambúrgueres artesanais com entrega rápida" },
      { name: "description", content: "Smash burgers, combos, pizzas e porções com qualidade premium e entrega em casa." },
      { property: "og:title", content: "BlazeBurger — Sabor que arde" },
      { property: "og:description", content: "Peça agora os melhores smash burgers da cidade." },
    ],
  }),
  component: Home,
});

type HomeContent = {
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  hero_cta_link: string;
};

function Home() {
  const c = usePageContent<HomeContent>("home");
  const featuredQuery = useQuery({ queryKey: ["products", "featured"], queryFn: () => fetchProducts({ featured: true }) });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const featured = featuredQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  return (
    <AppShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,oklch(0.62_0.22_27/0.18),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,oklch(0.72_0.2_50/0.15),transparent_55%)]" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20 lg:py-28">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
              <Flame className="h-3.5 w-3.5" /> {c.hero_eyebrow}
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              {c.hero_title}
            </h1>
            <p className="max-w-md text-base text-muted-foreground sm:text-lg">
              {c.hero_subtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={c.hero_cta_link || "/menu"} className="inline-flex h-12 items-center gap-2 rounded-xl gradient-flame px-6 font-display font-semibold text-white transition hover:scale-105 glow-brand">
                {c.hero_cta} <ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/menu" className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-surface px-6 font-display font-semibold text-foreground transition hover:border-brand">
                Promoções 🔥
              </Link>
            </div>
            <div className="flex flex-wrap gap-5 pt-2">
              {[
                { i: Clock, t: "30 min" },
                { i: Truck, t: "Entrega grátis acima de R$ 60" },
                { i: Shield, t: "Pagamento seguro" },
              ].map(({ i: I, t }) => (
                <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <I className="h-4 w-4 text-flame" /> {t}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[3rem] bg-gradient-to-br from-brand/30 to-flame/20 blur-3xl" />
            <img
              src={heroBurger}
              alt="Smash burger artesanal com bacon e cheddar"
              width={1536}
              height={1280}
              className="mx-auto w-full max-w-lg drop-shadow-[0_30px_60px_rgba(229,57,53,0.35)]"
            />
          </div>
        </div>
      </section>

      <HeroCarousel />

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(c => (
            <Link
              key={c.id}
              to="/menu"
              search={{ cat: c.slug }}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              <span className="text-lg">{c.emoji}</span> {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Mais pedidos 🔥</h2>
            <p className="text-sm text-muted-foreground">Os queridinhos dos nossos clientes</p>
          </div>
          <Link to="/menu" className="hidden text-sm font-semibold text-brand hover:underline sm:inline-flex">
            Ver tudo →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </AppShell>
  );
}
