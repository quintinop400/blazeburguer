import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Star, Minus, Plus, ShoppingBag } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { fetchProductById, fetchProductsByCategoryId } from "@/lib/products";
import { useCart, formatBRL } from "@/lib/cart-store";

export const Route = createFileRoute("/produto/$id")({
  head: () => ({ meta: [{ title: "Produto — BlazeBurger" }] }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const [qty, setQty] = useState(1);
  const { add } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id),
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related", product?.category_id],
    enabled: !!product?.category_id,
    queryFn: () => fetchProductsByCategoryId(product!.category_id!),
  });

  if (isLoading) {
    return <AppShell><div className="p-20 text-center text-muted-foreground">Carregando…</div></AppShell>;
  }
  if (!product) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md p-12 text-center">
          <p className="font-display text-xl font-bold">Produto não encontrado</p>
          <Link to="/menu" className="mt-3 inline-block text-brand hover:underline">Voltar ao cardápio</Link>
        </div>
      </AppShell>
    );
  }

  const relatedFiltered = related.filter(p => p.id !== product.id).slice(0, 4);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Link to="/menu" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao cardápio
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="aspect-square h-full w-full object-cover" />
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface-2 to-surface">
              <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_center,oklch(0.72_0.2_50/0.2),transparent_70%)]" />
              <div className="grid aspect-square place-items-center text-[14rem]">{product.emoji}</div>
            </div>
          )}
          {product.badge && (
            <span className="absolute left-4 top-4 rounded-full gradient-flame px-3 py-1.5 text-xs font-bold tracking-wider text-white">
              {product.badge}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" /> {product.rating.toFixed(1)}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {product.prepTime}</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight">{product.name}</h1>
          <p className="mt-3 text-muted-foreground">{product.description}</p>

          <div className="mt-6 flex items-end gap-3">
            {product.oldPrice && <span className="text-lg text-muted-foreground line-through">{formatBRL(product.oldPrice)}</span>}
            <span className="font-display text-4xl font-extrabold text-gradient-flame">{formatBRL(product.price)}</span>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-card"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-display text-lg font-bold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-card"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              onClick={() => add(product, qty)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl gradient-flame font-display font-semibold text-white transition hover:scale-[1.02] glow-brand"
            >
              <ShoppingBag className="h-5 w-5" /> Adicionar — {formatBRL(product.price * qty)}
            </button>
          </div>
        </div>
      </section>

      {relatedFiltered.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="mb-5 font-display text-2xl font-bold">Você também vai gostar</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedFiltered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </AppShell>
  );
}
