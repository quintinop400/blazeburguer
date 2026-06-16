import { Fragment } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Flame,
  Clock,
  Truck,
  Shield,
  CheckCircle2,
  Heart,
  Star,
  ChefHat,
  IceCream,
  Coffee,
  Package,
  Sparkles,
} from "lucide-react";
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
      { name: "description", content: "Smash burgers, combos, porções e sobremesas premium para entrega rápida." },
      { property: "og:title", content: "BlazeBurger — Sabor que arde" },
      { property: "og:description", content: "Peça agora e receba hambúrgueres premium com entrega expressa." },
    ],
  }),
  component: Home,
});

type SectionKey =
  | "hero"
  | "categories"
  | "features"
  | "combos"
  | "highlights"
  | "numbers"
  | "testimonials"
  | "how_it_works";

type HomeContent = {
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  hero_cta_link: string;
  hero_image_url: string;
  hero_cta2?: string;
  hero_cta2_link?: string;
  hero_promo_label?: string;
  hero_promo_text?: string;
  hero_secondary_image_url?: string;
  section_order?: SectionKey[];
  section_visibility?: Record<SectionKey, boolean>;
};

const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "hero",
  "categories",
  "features",
  "combos",
  "highlights",
  "numbers",
  "testimonials",
  "how_it_works",
];

const DEFAULT_SECTION_VISIBILITY: Record<SectionKey, boolean> = {
  hero: true,
  categories: true,
  features: true,
  combos: true,
  highlights: true,
  numbers: true,
  testimonials: true,
  how_it_works: true,
};

const features = [
  { icon: CheckCircle2, title: "Ingredientes frescos", description: "Carnes e pães preparados todos os dias." },
  { icon: Truck, title: "Entrega rápida", description: "Em média 30 minutos na sua casa." },
  { icon: Star, title: "Qualidade premium", description: "Receitas com ingredientes selecionados." },
  { icon: Shield, title: "Pagamento seguro", description: "Checkout confiável e protegido." },
];

const comboItems = [
  {
    icon: Package,
    title: "Combo Premium",
    description: "Hambúrguer + batata + bebida gelada.",
    badge: "Mais pedido",
  },
  {
    icon: ChefHat,
    title: "Combo Crocante",
    description: "Batata crocante com molho especial.",
    badge: "Oferta",
  },
  {
    icon: IceCream,
    title: "Doce Final",
    description: "Sobremesa perfeita para terminar bem.",
    badge: "Novo",
  },
];

const stats = [
  { value: "18k+", label: "Pedidos realizados" },
  { value: "12k+", label: "Clientes satisfeitos" },
  { value: "4.9/5", label: "Avaliação média" },
  { value: "28 min", label: "Tempo médio de entrega" },
];

const testimonials = [
  {
    name: "Ana Silva",
    rating: "5.0",
    comment: "O melhor delivery da cidade — sabor incrível e entrega sempre rápida.",
  },
  {
    name: "Lucas Oliveira",
    rating: "4.9",
    comment: "Os burgers são suculentos e os combos valem muito a pena.",
  },
  {
    name: "Mariana Costa",
    rating: "5.0",
    comment: "Ótimo atendimento, embalagem segura e tudo quentinho.",
  },
];

function Home() {
  const c = usePageContent<HomeContent>("home");
  const featuredQuery = useQuery({ queryKey: ["products", "featured"], queryFn: () => fetchProducts({ featured: true }) });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const featured = featuredQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const loadingCategories = categoriesQuery.isLoading;
  const loadingFeatured = featuredQuery.isLoading;
  const sectionOrder = c.section_order ?? DEFAULT_SECTION_ORDER;
  const sectionVisibility = c.section_visibility ?? DEFAULT_SECTION_VISIBILITY;

  const sections: Record<SectionKey, JSX.Element> = {
    hero: (
      <>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(255,131,63,0.14),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_75%,rgba(234,88,12,0.12),transparent_55%)]" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.8fr] md:py-20 lg:py-28">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
                <Flame className="h-3.5 w-3.5" /> {c.hero_eyebrow}
              </span>
              <h1 className="font-display text-4xl font-extrabold leading-[1.03] sm:text-5xl lg:text-6xl">
                {c.hero_title}
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                {c.hero_subtitle}
              </p>

              <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
                <a
                  href={c.hero_cta_link || "/menu"}
                  className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-3xl gradient-flame px-6 py-4 font-display text-sm font-semibold text-white transition hover:scale-[1.02] glow-brand"
                >
                  {c.hero_cta} <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/menu"
                  className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-3xl border border-border bg-surface px-6 py-4 font-display text-sm font-semibold text-foreground transition hover:border-brand"
                >
                  Ver Cardápio
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Clock, label: "30 min" },
                  { icon: Truck, label: "Frete grátis acima de R$ 60" },
                  { icon: Shield, label: "Pagamento seguro" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/70 px-4 py-3 text-xs text-muted-foreground shadow-sm">
                    <Icon className="h-4 w-4 text-flame" /> {label}
                  </div>
                ))}
              </div>

              <div className="grid gap-3 rounded-[2rem] border border-border bg-card/70 p-5 shadow-xl shadow-brand/10 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{c.hero_promo_label}</p>
                  <p className="text-sm font-semibold">{c.hero_promo_text}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Entrega</p>
                  <p className="text-sm font-semibold">Rápida, segura e sem complicação</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Satisfação</p>
                  <p className="text-sm font-semibold">Clientes amam nosso sabor premium</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-gradient-to-br from-brand/20 via-transparent to-flame/10 p-5 shadow-2xl shadow-brand/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,153,79,0.18),transparent_35%)]" />
              <div className="absolute bottom-0 right-0 -z-10 h-48 w-48 rounded-full bg-flame/20 blur-3xl" />
              <img
                src={c.hero_image_url || heroBurger}
                alt="Hambúrguer premium com bacon e cheddar"
                width={1536}
                height={1280}
                className="mx-auto w-full rounded-[2rem] object-cover shadow-[0_30px_60px_rgba(229,57,53,0.32)]"
                loading="lazy"
              />
              {c.hero_secondary_image_url && (
                <div className="mt-3">
                  <img src={c.hero_secondary_image_url} alt="Imagem secundária" className="mx-auto w-48 rounded-xl object-cover" loading="lazy" />
                </div>
              )}
            </div>
          </div>
        </section>
        <HeroCarousel />
      </>
    ),
    categories: (
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="inline-flex gap-3">
            {(loadingCategories ? Array.from({ length: 5 }) : categories).map((category, index) => {
              const item = category ?? { id: `placeholder-${index}`, slug: "", name: "", emoji: "" };
              return (
                <Link
                  key={item.id}
                  to="/menu"
                  search={{ cat: item.slug }}
                  className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-3xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-brand hover:text-brand"
                >
                  <span className="text-lg">{item.emoji}</span> {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    ),
    features: (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-flame">Descubra o sabor premium</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">O delivery que combina sabor e experiência.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Uma home page com clareza, velocidade e imagens que valorizam cada item do cardápio. Pedidos fáceis, saborosos e com embalagem feita para chegar perfeito.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-[1.75rem] border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-brand">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
    combos: (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-brand/10 via-transparent to-flame/10 p-6 shadow-lg shadow-brand/10 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand">Combos imperdíveis</p>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Combos exclusivos para toda a família.</h2>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Nossos combos foram criados para trazer variedade e valor em uma única escolha. Ideal para jantares rápidos, encontros e aquela refeição completa.
              </p>
              <Link
                to="/menu"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-3xl gradient-flame px-6 font-display text-sm font-semibold text-white transition hover:scale-[1.02] glow-brand"
              >
                Ver combos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {comboItems.map((combo) => {
                const Icon = combo.icon;
                return (
                  <div key={combo.title} className="group overflow-hidden rounded-[1.75rem] border border-border bg-background/70 p-5 transition hover:-translate-y-1 hover:border-brand">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-flame/10 text-flame">
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{combo.badge}</p>
                    <h3 className="mt-3 font-display text-xl font-semibold">{combo.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{combo.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    ),
    highlights: (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-flame">Destaques</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Favoritos dos clientes</h2>
          </div>
          <Link to="/menu" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
            Ver todo o cardápio <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loadingFeatured
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-72 rounded-[1.75rem] border border-border bg-card p-6" />
              ))
            : featured.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
    ),
    numbers: (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand">Nossos números</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Mais de 18 mil pedidos com sabor garantido.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((item) => (
              <div key={item.label} className="rounded-[1.75rem] border border-border bg-card p-6 text-center transition hover:-translate-y-1 hover:border-brand">
                <p className="text-3xl font-display font-extrabold text-flame">{item.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
    testimonials: (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="rounded-[2rem] border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand/10 text-brand text-2xl">{testimonial.name[0]}</div>
                <div>
                  <p className="font-display text-base font-semibold">{testimonial.name}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-flame" /> {testimonial.rating}
                  </div>
                </div>
              </div>
              <p className="mt-6 text-sm leading-7 text-muted-foreground">“{testimonial.comment}”</p>
            </div>
          ))}
        </div>
      </section>
    ),
    how_it_works: (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 rounded-[2rem] border border-border bg-gradient-to-br from-brand/10 via-transparent to-flame/10 p-8 shadow-lg shadow-brand/10 sm:p-10 lg:grid-cols-3">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand">Como funciona</p>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Peça em três passos simples.</h2>
            <p className="text-muted-foreground">
              Escolha, finalize e receba. A experiência premium de delivery desenhada para quem quer sabor sem perda de tempo.
            </p>
          </div>

          {[
            { icon: Sparkles, title: "Escolha seu pedido", description: "Encontre burgers, combos e sobremesas com fotos e descrições claras." },
            { icon: Package, title: "Finalize a compra", description: "Pagamento protegido e confirmação instantânea do pedido." },
            { icon: Truck, title: "Receba em casa", description: "Seu pedido chega quente e pronto para matar a fome." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-[1.75rem] border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-brand">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    ),
  };

  return (
    <AppShell>
      {sectionOrder.map((section) =>
        sectionVisibility[section] ? <Fragment key={section}>{sections[section]}</Fragment> : null
      )}
    </AppShell>
  );
}
