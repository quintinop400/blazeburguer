import { createFileRoute } from "@tanstack/react-router";
import { usePageEditor } from "@/lib/page-content";
import { AdminInput, AdminSection, SaveBar } from "@/components/admin/PageFormBits";

export const Route = createFileRoute("/_authenticated/admin/paginas/faq")({
  component: FaqPageAdmin,
});

type Content = { title: string; subtitle: string; description: string };

function FaqPageAdmin() {
  const { value, setValue, save, saving } = usePageEditor<Content>("faq");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Página FAQ — Textos</h1>
        <p className="text-sm text-muted-foreground">Edite os textos do cabeçalho da FAQ. (As perguntas são editadas no menu “FAQ”.)</p>
      </div>
      <AdminSection title="Cabeçalho">
        <AdminInput label="Título" value={value.title} onChange={(v) => setValue({ ...value, title: v })} className="sm:col-span-2" />
        <AdminInput label="Subtítulo" value={value.subtitle} onChange={(v) => setValue({ ...value, subtitle: v })} className="sm:col-span-2" />
        <AdminInput label="Descrição" value={value.description} onChange={(v) => setValue({ ...value, description: v })} textarea className="sm:col-span-2" />
      </AdminSection>
      <SaveBar save={save} saving={saving} />
    </div>
  );
}
