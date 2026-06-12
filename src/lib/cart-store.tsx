import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "./products";

export type CartItem = { product: Product; qty: number; notes?: string };

type CartCtx = {
  items: CartItem[];
  add: (p: Product, qty?: number, notes?: string) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  setNotes: (id: string, notes: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE = "blaze_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE, JSON.stringify(items));
  }, [items, hydrated]);

  const add: CartCtx["add"] = (p, qty = 1, notes) =>
    setItems(prev => {
      const ex = prev.find(i => i.product.id === p.id && (i.notes ?? "") === (notes ?? ""));
      if (ex) return prev.map(i => i === ex ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product: p, qty, notes: notes || undefined }];
    });

  const remove: CartCtx["remove"] = id =>
    setItems(prev => prev.filter(i => i.product.id !== id));

  const setQty: CartCtx["setQty"] = (id, qty) =>
    setItems(prev => qty <= 0
      ? prev.filter(i => i.product.id !== id)
      : prev.map(i => i.product.id === id ? { ...i, qty } : i));

  const setNotes: CartCtx["setNotes"] = (id, notes) =>
    setItems(prev => prev.map(i => i.product.id === id ? { ...i, notes: notes || undefined } : i));

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.product.price, 0);

  return (
    <Ctx.Provider value={{ items, add, remove, setQty, setNotes, clear, count, subtotal }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
