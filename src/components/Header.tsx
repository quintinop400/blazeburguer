import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, Flame, Search, User as UserIcon, LogIn, ShieldCheck, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/hooks/useAuth";

type NavLink = { to: string; label: string; exact?: boolean };
const NAV: NavLink[] = [
  { to: "/", label: "Home", exact: true },
  { to: "/menu", label: "Cardápio" },
  { to: "/menu", label: "Promoções" },
  { to: "/quem-somos", label: "Quem Somos" },
  { to: "/contato", label: "Contato" },
];

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-flame glow-brand">
            <Flame className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            BLAZE<span className="text-gradient-flame">BURGER</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV.map((n, i) => (
            <Link
              key={`${n.to}-${i}`}
              to={n.to}
              activeOptions={n.exact ? { exact: true } : undefined}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground [&.active]:text-foreground"
            >
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-brand transition hover:bg-brand/10">
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link to="/menu" className="hidden h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-muted-foreground transition hover:text-foreground xl:flex">
            <Search className="h-4 w-4" />
            <span>Buscar lanches…</span>
          </Link>

          {user ? (
            <Link to="/perfil" className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface transition hover:border-brand hover:text-brand" aria-label="Perfil">
              <UserIcon className="h-5 w-5" />
            </Link>
          ) : (
            <Link to="/auth" className="hidden h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition hover:border-brand hover:text-brand sm:flex">
              <LogIn className="h-4 w-4" /> Login
            </Link>
          )}

          <button
            onClick={onCartClick}
            className="relative grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface transition hover:border-brand hover:text-brand"
            aria-label="Abrir carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full gradient-flame px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen(v => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface text-foreground lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV.map((n, i) => (
              <Link
                key={`m-${n.to}-${i}`}
                to={n.to}
                onClick={() => setMobileOpen(false)}
                activeOptions={n.exact ? { exact: true } : undefined}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground [&.active]:text-foreground"
              >
                {n.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <LogIn className="h-4 w-4" /> Login
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-brand"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
