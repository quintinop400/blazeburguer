import { Link } from "@tanstack/react-router";
import { Plus, Star, Clock } from "lucide-react";
import type { Product } from "@/lib/products";
import { useCart, formatBRL } from "@/lib/cart-store";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-brand/40 hover:glow-brand">
      <Link to="/produto/$id" params={{ id: product.id }} className="relative block aspect-[4/3] overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-110" />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-surface-2 to-surface text-7xl transition group-hover:scale-110">
            {product.emoji}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full gradient-flame px-2.5 py-1 text-[10px] font-bold tracking-wider text-white">
            {product.badge}
          </span>
        )}
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs font-semibold backdrop-blur">
          <Star className="h-3 w-3 fill-accent text-accent" /> {product.rating.toFixed(1)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-base font-semibold leading-tight">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> {product.prepTime}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-col">
            {product.oldPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatBRL(product.oldPrice)}
              </span>
            )}
            <span className="font-display text-lg font-bold text-gradient-flame">
              {formatBRL(product.price)}
            </span>
          </div>
          <button
            onClick={() => add(product)}
            className="grid h-10 w-10 place-items-center rounded-xl gradient-flame text-white transition hover:scale-105 active:scale-95"
            aria-label={`Adicionar ${product.name}`}
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
