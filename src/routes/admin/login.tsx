import { createFileRoute, Link, redirect, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Flame, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/hooks/useAuth";

type LoginSearch = { redirect?: string; error?: string };

export const Route = createFileRoute("/admin/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  head: () => ({ meta: [{ title: "Admin Login — BlazeBurger" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const isAdmin = (roles ?? []).some(r => r.role === "admin");
      if (isAdmin) throw redirect({ to: "/admin" });
    }
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { redirect, error } = useSearch({ from: "/admin/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const target = redirect && redirect.startsWith("/") ? redirect : "/admin";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        throw new Error("Falha ao autenticar");
      }

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      if (rolesError) throw rolesError;

      const isAdmin = (roles ?? []).some(r => r.role === "admin");
      if (!isAdmin) {
        await signOut();
        throw new Error("Acesso negado. Conta não é administrador.");
      }

      toast.success("Login administrativo realizado com sucesso.");
      navigate({ to: target });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-surface lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,oklch(0.62_0.22_27/0.35),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,oklch(0.72_0.2_50/0.3),transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl gradient-flame glow-brand">
              <Flame className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-2xl font-bold">BLAZE<span className="text-gradient-flame">BURGER</span></span>
          </Link>
          <div>
            <h2 className="font-display text-5xl font-extrabold leading-tight">
              Acesso seguro ao<br />painel administrativo.
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Apenas usuários com perfil administrador podem acessar o painel de gestão.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">© BlazeBurger</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-flame">
              <Flame className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold">BLAZE<span className="text-gradient-flame">BURGER</span></span>
          </Link>

          <h1 className="font-display text-3xl font-bold">Login administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre com suas credenciais de administrador para acessar o painel.
          </p>
          {error ? (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label="E-mail" value={email} onChange={setEmail} icon={Mail} type="email" required />
            <Field label="Senha" value={password} onChange={setPassword} icon={Lock} type="password" required />

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-flame font-display font-semibold text-white transition hover:scale-[1.01] glow-brand disabled:opacity-50"
            >
              Entrar <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Não é administrador?</p>
            <Link to="/auth" className="font-semibold text-brand hover:underline">
              Usar login normal
            </Link>
          </div>

          <div className="mt-4 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <p>Novo administrador?</p>
            <Link to="/admin/register" className="font-semibold text-brand hover:underline">
              Registrar acesso admin
            </Link>
          </div>

          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/auth" });
            }}
            className="mt-4 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-left text-muted-foreground hover:bg-surface"
          >
            Sair de qualquer sessão atual
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, icon: Icon, type = "text", required }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: typeof Mail;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
      <span>{label}</span>
      <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-card px-3 transition focus-within:border-brand">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          type={type}
          required={required}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </label>
  );
}
