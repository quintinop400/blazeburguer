import { useNavigate } from "@tanstack/react-router";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, formatBRL } from "@/lib/cart-store";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, setQty, remove, subtotal, count } = useCart();
  const navigate = useNavigate();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-lg font-bold">Seu pedido</h2>
            <p className="text-xs text-muted-foreground">{count} {count === 1 ? "item" : "itens"}</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-surface" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface text-3xl">🛒</div>
              <p className="font-display text-base font-semibold">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground">Adicione alguns lanches incríveis!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(({ product, qty, notes }) => (
                <li key={product.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-surface text-3xl">
                    {product.emoji}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-tight">{product.name}</h3>
                      <button onClick={() => remove(product.id)} className="text-muted-foreground transition hover:text-brand" aria-label="Remover">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {notes ? <p className="mt-0.5 text-xs italic text-muted-foreground">“{notes}”</p> : null}
                    <span className="text-sm font-bold text-gradient-flame">{formatBRL(product.price * qty)}</span>
                    <div className="mt-2 flex items-center gap-1">
                      <button onClick={() => setQty(product.id, qty - 1)} className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-surface"><Minus className="h-3 w-3" /></button>
                      <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                      <button onClick={() => setQty(product.id, qty + 1)} className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-surface"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border bg-surface/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-display text-xl font-bold">{formatBRL(subtotal)}</span>
            </div>
            <button
              onClick={() => { onClose(); navigate({ to: "/checkout" }); }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-flame font-display font-semibold text-white transition hover:scale-[1.02] glow-brand"
            >
              <ShoppingBag className="h-5 w-5" /> Finalizar pedido
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
