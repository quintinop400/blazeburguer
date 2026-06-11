import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { Briefcase, Upload, Loader2, Send, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { submitJobApplication } from "@/lib/jobs.functions";
import { usePageContent } from "@/lib/page-content";

export const Route = createFileRoute("/trabalhe-conosco")({
  head: () => ({
    meta: [
      { title: "Trabalhe Conosco — BlazeBurger" },
      { name: "description", content: "Envie seu currículo e faça parte da equipe BlazeBurger." },
      { property: "og:title", content: "Trabalhe Conosco — BlazeBurger" },
      { property: "og:description", content: "Envie seu currículo e faça parte da equipe BlazeBurger." },
    ],
  }),
  component: JobsPage,
});

const Schema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(40).optional(),
  position: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000).optional(),
});

const MAX_BYTES = 4 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function JobsPage() {
  const c = usePageContent<{ title: string; subtitle: string; description: string }>("trabalhe-conosco");
  const submit = useServerFn(submitJobApplication);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", position: "", message: "" });
  const fileRef = useRef<HTMLInputElement | null>(null);

  function onPickFile(f: File | null) {
    if (!f) return setFile(null);
    if (f.type !== "application/pdf") {
      toast.error("Envie um arquivo PDF.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("O PDF precisa ter no máximo 4MB.");
      return;
    }
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    if (!file) {
      toast.error("Anexe seu currículo em PDF.");
      return;
    }
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      await submit({
        data: {
          ...parsed.data,
          resumeBase64: base64,
          resumeFilename: file.name,
          resumeMime: file.type,
        },
      });
      toast.success("Candidatura enviada! Em breve nosso time entra em contato.");
      setForm({ name: "", email: "", phone: "", position: "", message: "" });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 gradient-flame opacity-10" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-flame text-white glow-brand">
            <Briefcase className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-display text-4xl font-extrabold sm:text-5xl">{c.title}</h1>
          <p className="mt-3 text-muted-foreground">
            {c.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome completo</span>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</span>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone</span>
              <input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand"
                placeholder="(11) 99999-0000"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cargo desejado</span>
              <input
                value={form.position}
                onChange={e => setForm({ ...form, position: e.target.value })}
                className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand"
                placeholder="Ex: Atendente, Cozinheiro..."
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mensagem (opcional)</span>
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              placeholder="Conta um pouco sobre você e por que quer trabalhar com a gente."
            />
          </label>

          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Currículo (PDF, até 4MB)</span>
            <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-background px-4 py-4 transition hover:border-brand">
              <div className="grid h-10 w-10 place-items-center rounded-lg gradient-flame text-white"><Upload className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                {file ? (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-brand" />
                    <span className="truncate">{file.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Clique pra escolher seu PDF</p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={e => onPickFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-flame px-6 text-sm font-semibold text-white glow-brand transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Enviando..." : "Enviar candidatura"}
          </button>
        </form>
      </section>
    </AppShell>
  );
}
