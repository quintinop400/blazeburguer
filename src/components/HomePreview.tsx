import { Fragment } from "react";
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
import { ProductCard } from "@/components/ProductCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { fetchCategories, fetchProducts } from "@/lib/products";
import { Link } from "@tanstack/react-router";

type SectionKey =
  | "hero"
  | "categories"
  | "features"
  | "combos"
  | "highlights"
  | "numbers"
  | "testimonials"
  | "how_it_works";

export interface HomePreviewProps {
  content: {
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
  };
  sectionOrder: SectionKey[];
  sectionVisibility: Record<SectionKey, boolean>;
  isLoading?: boolean;
}

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

export function HomePreview({ content, sectionOrder, sectionVisibility, isLoading }: HomePreviewProps) {
  const featuredQuery = useQuery({ queryKey: ["products", "featured"], queryFn: () => fetchProducts({ featured: true }) });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const featured = featuredQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const loadingCategories = categoriesQuery.isLoading || isLoading;
  const loadingFeatured = featuredQuery.isLoading || isLoading;

  const c = content;

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
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Por que pedir no BlazeBurger</h2>
          <p className="mt-4 text-lg text-muted-foreground">Qualidade, velocidade e sabor incomparável.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
                <Icon className="h-6 w-6 text-brand" />
              </div>
              <h3 className="mb-2 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    ),
    combos: (
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Combos Imperdíveis</h2>
          <p className="mt-4 text-lg text-muted-foreground">Aproveite nossos combos especiais e economize.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {comboItems.map(({ icon: Icon, title, description, badge }) => (
            <div key={title} className="relative rounded-2xl border border-border bg-card p-6">
              <div className="absolute right-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                {badge}
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
                <Icon className="h-6 w-6 text-brand" />
              </div>
              <h3 className="mb-2 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    ),
    highlights: (
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Nossos Favoritos</h2>
          <p className="mt-4 text-lg text-muted-foreground">Os produtos mais amados pelos clientes.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(loadingFeatured ? Array.from({ length: 4 }) : featured).map((product) => (
            <ProductCard key={product?.id} product={product} isLoading={loadingFeatured} />
          ))}
        </div>
      </section>
    ),
    numbers: (
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">By The Numbers</h2>
          <p className="mt-4 text-lg text-muted-foreground">Milhares de clientes satisfeitos no BlazeBurger.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={value} className="rounded-2xl border border-border bg-gradient-to-br from-brand/10 to-transparent p-8 text-center">
              <p className="font-display text-4xl font-bold">{value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>
    ),
    testimonials: (
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">O que nossos clientes falam</h2>
          <p className="mt-4 text-lg text-muted-foreground">Depoimentos reais de pessoas que amam BlazeBurger.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map(({ name, rating, comment }) => (
            <div key={name} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4"
                    fill={i < Math.floor(Number(rating)) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <p className="mb-4 text-sm">{comment}</p>
              <p className="font-semibold text-sm">{name}</p>
            </div>
          ))}
        </div>
      </section>
    ),
    how_it_works: (
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Como Funciona</h2>
          <p className="mt-4 text-lg text-muted-foreground">Simples, rápido e delicioso em 4 passos.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-4">
          {[
            { step: "1", icon: "🔍", title: "Escolha", description: "Navegue pelo cardápio" },
            { step: "2", icon: "🛒", title: "Compre", description: "Adicione ao carrinho" },
            { step: "3", icon: "💳", title: "Pague", description: "Checkout seguro" },
            { step: "4", icon: "🚗", title: "Receba", description: "Em 30 min" },
          ].map(({ step, icon, title, description }) => (
            <div key={step} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-3xl">
                {icon}
              </div>
              <h3 className="mb-2 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    ),
  };

  return (
    <div className="overflow-hidden">
      {sectionOrder.map((sectionKey) =>
        sectionVisibility[sectionKey] ? (
          <Fragment key={sectionKey}>{sections[sectionKey]}</Fragment>
        ) : null
      )}
    </div>
  );
}
