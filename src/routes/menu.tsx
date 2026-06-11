import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { PromoStrip } from "@/components/PromoStrip";
import { fetchCategories, fetchProducts } from "@/lib/products";

type MenuSearch = { cat?: string };

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Cardápio — BlazeBurger" },
      { name: "description", content: "Cardápio completo: hambúrgueres, smash, combos, pizzas, porções e mais." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): MenuSearch => ({
    cat: typeof s.cat === "string" ? s.cat : undefined,
  }),
  component: Menu,
});

function Menu() {
  const { cat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const active = cat ?? "all";

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: products = [] } = useQuery({
    queryKey: ["products", active],
    queryFn: () => fetchProducts({ category: active }),
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? products.filter(p => (p.name + p.description).toLowerCase().includes(s)) : products;
  }, [products, q]);

  return (
    <AppShell>
      <PromoStrip />
      <section className="border-b border-border bg-gradient-to-b from-surface/40 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Cardápio completo</h1>
          <p className="mt-1 text-muted-foreground">Escolha seus favoritos e finalize o pedido em segundos.</p>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card px-4 focus-within:border-brand">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar por nome ou ingrediente…"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <CatPill label="Todos" emoji="🔥" active={active === "all"} onClick={() => navigate({ search: { cat: undefined } })} />
            {categories.map(c => (
              <CatPill key={c.id} label={c.name} emoji={c.emoji ?? ""} active={c.slug === active} onClick={() => navigate({ search: { cat: c.slug } })} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <div className="text-5xl">🔎</div>
            <p className="mt-3 font-display text-lg font-semibold">Nada encontrado</p>
            <p className="text-sm text-muted-foreground">Tente outra categoria ou termo de busca.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function CatPill({ label, emoji, active, onClick }: { label: string; emoji: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active ? "border-transparent gradient-flame text-white glow-brand" : "border-border bg-card text-muted-foreground hover:border-brand hover:text-foreground"
      }`}
    >
      <span>{emoji}</span> {label}
    </button>
  );
}
