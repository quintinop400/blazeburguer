import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldOff, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/unauthorized")({
  head: () => ({ meta: [{ title: "Acesso negado — BlazeBurger" }] }),
  component: Unauthorized,
});

function Unauthorized() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-10 text-center shadow-lg">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-destructive/10 text-destructive">
          <ShieldOff className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-bold">Acesso negado</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Você não tem permissão para acessar o painel administrativo.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:border-destructive/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao site
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Entrar com outra conta
          </Link>
        </div>
      </div>
    </div>
  );
}
