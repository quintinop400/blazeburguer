import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Flame, Lock, Mail, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { registerAdminAccount } from "@/lib/admin-registration.functions";

export const Route = createFileRoute("/admin/register")({
  head: () => ({ meta: [{ title: "Admin Registration — BlazeBurger" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminRegisterPage,
});

function AdminRegisterPage() {
  const registerFn = useServerFn(registerAdminAccount);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationKey, setRegistrationKey] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email || !password || !name || !confirmPassword || !registrationKey) {
        return toast.error("Preencha todos os campos");
      }
      if (password.length < 6) {
        return toast.error("Senha deve ter pelo menos 6 caracteres");
      }

      if (password !== confirmPassword) {
        return toast.error("As senhas não conferem");
      }

      await registerFn({ data: { email, password, name, registrationKey } });
      toast.success("Admin criado! Redirecionando para login...");
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar admin");
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
              Criar conta de<br /><span className="text-gradient-flame">administrador.</span>
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Acesso completo ao painel administrativo da BlazeBurger.
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

          <h1 className="font-display text-3xl font-bold">Registrar administrador</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie uma conta com acesso ao painel de gestão da loja.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field
              label="Nome completo"
              icon={UserIcon}
              placeholder="Seu nome"
              value={name}
              onChange={setName}
              required
            />
            <Field
              label="E-mail"
              icon={Mail}
              placeholder="seu@email.com"
              type="email"
              value={email}
              onChange={setEmail}
              required
            />
            <Field
              label="Senha"
              icon={Lock}
              placeholder="Mín. 6 caracteres"
              type="password"
              value={password}
              onChange={setPassword}
              required
              minLength={6}
            />
            <Field
              label="Confirmar senha"
              icon={Lock}
              placeholder="Repita a senha"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />
            <Field
              label="Chave de registro"
              icon={Lock}
              placeholder="Chave fornecida pelo responsável"
              type="password"
              value={registrationKey}
              onChange={setRegistrationKey}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-flame font-display font-semibold text-white transition hover:scale-[1.01] glow-brand disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar admin"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Já é administrador?</p>
            <Link to="/admin/login" className="font-semibold text-brand hover:underline">
              Fazer login
            </Link>
          </div>

          <Link to="/" className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  minLength,
}: {
  label: string;
  icon: typeof Mail;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
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
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </label>
  );
}
