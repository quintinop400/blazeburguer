import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { PromoStrip } from "@/components/PromoStrip";
import { fetchCategories, fetchProducts } from "@/lib/products";

type MenuSearch = { cat?: string };
type SortKey = "relevance" | "price-asc" | "price-desc" | "rating";

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
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<SortKey>("relevance");
  const active = cat ?? "all";

  // debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // limpar busca ao trocar de categoria
  useEffect(() => { setQ(""); setDebounced(""); }, [active]);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: products = [] } = useQuery({
    queryKey: ["products", active],
    queryFn: () => fetchProducts({ category: active }),
  });

  const filtered = useMemo(() => {
    const base = debounced ? products.filter(p => (p.name + p.description).toLowerCase().includes(debounced)) : products;
    const sorted = [...base];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "rating") sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return sorted;
  }, [products, debounced, sort]);

  return (
    <AppShell>
      <PromoStrip />
      <section className="border-b border-border bg-gradient-to-b from-surface/40 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Cardápio completo</h1>
          <p className="mt-1 text-muted-foreground">Escolha seus favoritos e finalize o pedido em segundos.</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-4 focus-within:border-brand">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar por nome ou ingrediente…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {q && (
                <button onClick={() => setQ("")} aria-label="Limpar" className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="h-12 rounded-xl border border-border bg-card px-3 text-sm font-medium outline-none focus:border-brand"
            >
              <option value="relevance">Relevância</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="rating">Melhor avaliados</option>
            </select>
          </div>

          {debounced && (
            <p className="mt-3 text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
          )}

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
            <p className="mt-3 font-display text-lg font-semibold">
              {debounced ? `Nenhum produto encontrado para "${debounced}"` : "Nada encontrado"}
            </p>
            <p className="text-sm text-muted-foreground">Tente outra categoria ou termo de busca.</p>
            {debounced && (
              <button onClick={() => setQ("")} className="mt-4 inline-flex h-10 items-center rounded-xl gradient-flame px-5 text-sm font-semibold text-white glow-brand">
                Limpar busca
              </button>
            )}
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
