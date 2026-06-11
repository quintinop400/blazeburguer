import { createFileRoute } from "@tanstack/react-router";
import { usePageEditor } from "@/lib/page-content";
import { AdminInput, AdminSection, SaveBar } from "@/components/admin/PageFormBits";

export const Route = createFileRoute("/_authenticated/admin/paginas/home")({
  component: HomeAdmin,
});

type HomeContent = {
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  hero_cta_link: string;
};

function HomeAdmin() {
  const { value, setValue, save, saving } = usePageEditor<HomeContent>("home");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Página Home</h1>
        <p className="text-sm text-muted-foreground">Edite o hero principal da página inicial.</p>
      </div>
      <AdminSection title="Hero">
        <AdminInput label="Eyebrow (etiqueta no topo)" value={value.hero_eyebrow} onChange={(v) => setValue({ ...value, hero_eyebrow: v })} className="sm:col-span-2" />
        <AdminInput label="Título" value={value.hero_title} onChange={(v) => setValue({ ...value, hero_title: v })} className="sm:col-span-2" />
        <AdminInput label="Subtítulo" value={value.hero_subtitle} onChange={(v) => setValue({ ...value, hero_subtitle: v })} textarea className="sm:col-span-2" />
        <AdminInput label="Texto do botão" value={value.hero_cta} onChange={(v) => setValue({ ...value, hero_cta: v })} />
        <AdminInput label="Link do botão" value={value.hero_cta_link} onChange={(v) => setValue({ ...value, hero_cta_link: v })} placeholder="/menu" />
      </AdminSection>
      <SaveBar save={save} saving={saving} />
    </div>
  );
}
