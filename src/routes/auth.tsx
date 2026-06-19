import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const ENABLE_GOOGLE_LOGIN = false;

type AuthSearch = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Entrar — BlazeBurger" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const target = redirect && redirect.startsWith("/") ? redirect : "/";

  function isStrongPassword(value: string) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    console.log("[AUTH] email_submit", {
      mode,
      email,
      hasName: Boolean(name?.trim()),
      passwordLength: password.length,
      target,
      origin: typeof window !== "undefined" ? window.location.origin : null,
    });
    try {
      if (mode === "signup") {
        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!trimmedName) {
          toast.error("Informe seu nome completo para continuar.");
          return;
        }

        if (!isStrongPassword(password)) {
          toast.error("Use uma senha forte com no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.");
          return;
        }

        const redirectUrl = `${window.location.origin}/auth?redirect=${encodeURIComponent(target)}`;
        const payload = {
          email: normalizedEmail,
          passwordLength: password.length,
          fullName: trimmedName,
          emailRedirectTo: redirectUrl,
          target,
          origin: typeof window !== "undefined" ? window.location.origin : null,
        };

        console.log("SIGNUP REQUEST", payload);
        console.log("[AUTH] signup_request", payload);

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: trimmedName },
          },
        });
        console.log("SIGNUP RESPONSE", data);
        console.log("[AUTH] signup_response", {
          hasUser: Boolean(data.user),
          hasSession: Boolean(data.session),
          userId: data.user?.id ?? null,
          email: data.user?.email ?? normalizedEmail,
          identities: data.user?.identities?.map((identity) => identity.provider) ?? [],
          requiresEmailConfirmation: !data.session,
          data,
          error: error
            ? {
                message: error.message,
                status: (error as any)?.status,
                code: (error as any)?.code,
                name: error.name,
                details: (error as any)?.details,
                hint: (error as any)?.hint,
                stack: (error as any)?.stack,
              }
            : null,
        });
        if (error) {
          console.error("SIGNUP ERROR", error);
          throw error;
        }
        if (!data.session) {
          toast.success("Conta criada! Enviamos um e-mail de confirmação. Abra o link para ativar sua conta e depois faça login.");
          setMode("login");
          return;
        }
        toast.success("Conta criada! Bem-vindo(a) 🔥");
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        console.log("[AUTH] login_response", {
          hasUser: Boolean(data.user),
          hasSession: Boolean(data.session),
          userId: data.user?.id ?? null,
          email: data.user?.email ?? normalizedEmail,
          error: error
            ? {
                message: error.message,
                status: (error as any)?.status,
                code: (error as any)?.code,
                name: error.name,
                details: (error as any)?.details,
                hint: (error as any)?.hint,
                stack: (error as any)?.stack,
              }
            : null,
        });
        if (error) throw error;
        toast.success("Login feito!");
      }
      console.log("[AUTH] email_success", { mode, email, target });
      navigate({ to: target });

    } catch (err: any) {
      if (mode === "signup") {
        console.error("SIGNUP ERROR", err);
      }
      console.error("[AUTH ERROR]", {
        stage: mode === "signup" ? "signup" : "login",
        mode,
        email,
        target,
        err,
        message: err?.message,
        status: err?.status,
        code: err?.code,
        name: err?.name,
        stack: err?.stack,
      });
      const raw = err?.message ?? "";
      let msg = raw || "Erro inesperado";
      if (/weak_password|pwned|known to be weak/i.test(raw)) {
        msg = "Senha muito fraca ou já vazada. Use uma senha forte (8+ caracteres, letras, números e símbolos).";
      } else if (/invalid login credentials/i.test(raw)) {
        msg = "E-mail ou senha incorretos.";
      } else if (/email not confirmed/i.test(raw)) {
        msg = "Confirme seu e-mail antes de entrar.";
      } else if (/user already registered/i.test(raw)) {
        msg = "Este e-mail já está cadastrado. Faça login.";
      } else if (/failed to fetch/i.test(raw)) {
        msg = "Falha de conexão. Tente novamente em alguns instantes.";
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    console.log("[AUTH] google_submit", {
      provider: "google",
      target,
      origin: typeof window !== "undefined" ? window.location.origin : null,
    });
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      console.log("[AUTH] google_response", {
        redirected: Boolean(result.redirected),
        hasTokens: Boolean((result as any)?.tokens),
        error: result.error
          ? {
              message: result.error.message,
              name: result.error.name,
              stack: result.error.stack,
            }
          : null,
      });
      if (result.error) {
        console.error("[GOOGLE OAUTH ERROR]", result.error);
        toast.error(`Falha ao entrar com Google: ${result.error.message ?? "erro desconhecido"}`);
        setLoading(false);
        return;
      }
      if (result.redirected) {
        console.log("[AUTH] google_redirected", { target });
        return;
      }
      console.log("[AUTH] google_success", { target });
      navigate({ to: target });
    } catch (e: any) {
      console.error("[GOOGLE OAUTH EXCEPTION]", {
        provider: "google",
        target,
        message: e?.message,
        name: e?.name,
        stack: e?.stack,
        error: e,
      });
      toast.error(`Falha ao entrar com Google: ${e?.message ?? "erro desconhecido"}`);
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
              Entre para o<br /><span className="text-gradient-flame">clube do sabor.</span>
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Acompanhe pedidos em tempo real, salve favoritos, acumule cupons e peça em segundos.
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

          <h1 className="font-display text-3xl font-bold">
            {mode === "login" ? "Bem-vindo de volta" : "Criar sua conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Faça login para continuar" : "Leva menos de 30 segundos"}
          </p>
          {ENABLE_GOOGLE_LOGIN && (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card font-medium transition hover:border-brand hover:bg-surface disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.5 2.2 2 6.7 2 12.2s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.8H12z"/>
                </svg>
                Continuar com Google
              </button>

              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <Field icon={UserIcon} placeholder="Nome completo" value={name} onChange={setName} required />
            )}
            <Field icon={Mail} placeholder="E-mail" value={email} onChange={setEmail} type="email" required />
            <Field icon={Lock} placeholder="Senha forte (mín. 8 caracteres)" value={password} onChange={setPassword} type="password" required minLength={8} />

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-flame font-display font-semibold text-white transition hover:scale-[1.01] glow-brand disabled:opacity-50"
            >
              {mode === "login" ? "Entrar" : "Criar conta"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-4">
            <Link
              to="/admin/register"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-destructive bg-destructive/10 text-destructive font-medium hover:bg-destructive/20"
            >
              Cadastrar Administrador
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-semibold text-brand hover:underline">
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, value, onChange, ...rest }: {
  icon: typeof Mail; value: string; onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-3 transition focus-within:border-brand">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <input
        {...rest}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}
