import { createFileRoute, Outlet, Link, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ListOrdered, FolderTree, LogOut, Flame, Users, Image, Megaphone, Ticket, CreditCard, Settings, HelpCircle, FileText, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/admin/login", search: { redirect: location.href } });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    const isAdmin = (roles ?? []).some(r => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/admin/unauthorized", search: {} as never });
  },
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/pedidos", label: "Pedidos", icon: ListOrdered },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { to: "/admin/banners", label: "Banners", icon: Megaphone },
  { to: "/admin/midia", label: "Mídia", icon: Image },
  { to: "/admin/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/admin/cupons", label: "Cupons", icon: Ticket },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/paginas/home", label: "Pág. Home", icon: FileText },
  { to: "/admin/personalizacao/home", label: "Personalização Home", icon: FileText },
  { to: "/admin/paginas/quem-somos", label: "Pág. Quem Somos", icon: FileText },
  { to: "/admin/paginas/contato", label: "Pág. Contato", icon: FileText },
  { to: "/admin/paginas/faq", label: "Pág. FAQ (textos)", icon: FileText },
  { to: "/admin/paginas/trabalhe-conosco", label: "Pág. Trabalhe Conosco", icon: FileText },
  { to: "/admin/paginas/footer", label: "Rodapé", icon: FileText },
  { to: "/admin/faq", label: "FAQ (perguntas)", icon: HelpCircle },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface/40 md:flex">
        <Link to="/" className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-flame">
            <Flame className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-base font-bold">BLAZE<span className="text-gradient-flame">ADMIN</span></span>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as "/admin"}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "gradient-flame text-white glow-brand"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          className="m-3 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-brand"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-surface/60 px-4 md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg gradient-flame">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-sm font-bold">ADMIN</span>
          </Link>
          <nav className="ml-auto flex gap-1 overflow-x-auto scrollbar-hide">
            {NAV.map(item => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to as "/admin"}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    active ? "gradient-flame text-white" : "text-muted-foreground"
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
