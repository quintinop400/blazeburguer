import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePageEditor } from "@/lib/page-content";
import { AdminInput, AdminSection, AdminImageField, SaveBar } from "@/components/admin/PageFormBits";
import { PageBuilder, PageBuilderSection } from "@/components/PageBuilder";
import { HomePreview } from "@/components/HomePreview";

export const Route = createFileRoute("/_authenticated/admin/personalizacao/home")({
  component: HomePersonalization,
});

type SectionKey =
  | "hero"
  | "categories"
  | "features"
  | "combos"
  | "highlights"
  | "numbers"
  | "testimonials"
  | "how_it_works";

type HomeContent = {
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  hero_cta_link: string;
  hero_cta2?: string;
  hero_cta2_link?: string;
  hero_promo_label?: string;
  hero_promo_text?: string;
  hero_image_url: string;
  hero_secondary_image_url?: string;
  section_order?: SectionKey[];
  section_visibility?: Record<SectionKey, boolean>;
};

const SECTION_KEYS: Array<{ key: SectionKey; label: string; description?: string }> = [
  { key: "hero", label: "🎯 Hero", description: "Seção principal com CTA e imagem destacada" },
  { key: "categories", label: "🏷️ Categorias", description: "Menu de navegação por categorias" },
  { key: "features", label: "✨ Destaques", description: "4 benefícios principais" },
  { key: "combos", label: "📦 Combos", description: "Combos especiais com descontos" },
  { key: "highlights", label: "⭐ Favoritos", description: "Produtos mais vendidos" },
  { key: "numbers", label: "📊 Números", description: "Estatísticas de satisfação" },
  { key: "testimonials", label: "💬 Depoimentos", description: "Avaliações de clientes" },
  { key: "how_it_works", label: "🚀 Como funciona", description: "Guia de 4 passos" },
];

const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "hero",
  "categories",
  "features",
  "combos",
  "highlights",
  "numbers",
  "testimonials",
  "how_it_works",
];

const DEFAULT_SECTION_VISIBILITY: Record<SectionKey, boolean> = {
  hero: true,
  categories: true,
  features: true,
  combos: true,
  highlights: true,
  numbers: true,
  testimonials: true,
  how_it_works: true,
};

function HomePersonalization() {
  const { value, setValue, save, saving } = usePageEditor<HomeContent>("home");
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const sectionOrder = value.section_order ?? DEFAULT_SECTION_ORDER;
  const sectionVisibility = value.section_visibility ?? DEFAULT_SECTION_VISIBILITY;

  function handleReorder(newOrder: SectionKey[]) {
    setValue({
      ...value,
      section_order: newOrder,
    });
  }

  function handleDuplicate(sectionKey: SectionKey) {
    // Can't really duplicate sections since they're not independent data
    // But we could re-add a section that's disabled, or show a toast
    const currentIndex = sectionOrder.indexOf(sectionKey);
    if (currentIndex === -1) {
      // Add back disabled section
      const newOrder = [...sectionOrder, sectionKey];
      setValue({
        ...value,
        section_order: newOrder,
        section_visibility: {
          ...sectionVisibility,
          [sectionKey]: true,
        },
      });
    }
  }

  function handleDelete(sectionKey: SectionKey) {
    // Remove from order
    const newOrder = sectionOrder.filter((s) => s !== sectionKey);
    setValue({
      ...value,
      section_order: newOrder,
    });
  }

  function handleToggleVisibility(sectionKey: SectionKey, visible: boolean) {
    setValue({
      ...value,
      section_visibility: {
        ...sectionVisibility,
        [sectionKey]: visible,
      },
    });
  }

  function handlePreview() {
    setPreviewOpen(true);
  }

  const pageBuilderSections: PageBuilderSection<SectionKey>[] = sectionOrder.map((sectionKey) => {
    const sectionConfig = SECTION_KEYS.find((s) => s.key === sectionKey);
    return {
      key: sectionKey,
      label: sectionConfig?.label || sectionKey,
      description: sectionConfig?.description,
      isVisible: sectionVisibility[sectionKey] ?? true,
      isDuplicable: false,
      isDeletable: true,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Personalização da Home</h1>
        <p className="text-sm text-muted-foreground">Edite textos, CTAs, imagens, reordene seções e visualize antes de publicar.</p>
      </div>

      <AdminSection title="📸 Hero - Seção Principal">
        <AdminInput label="Eyebrow (etiqueta no topo)" value={value.hero_eyebrow} onChange={(v) => setValue({ ...value, hero_eyebrow: v })} className="sm:col-span-2" />
        <AdminInput label="Título principal" value={value.hero_title} onChange={(v) => setValue({ ...value, hero_title: v })} className="sm:col-span-2" />
        <AdminInput label="Subtítulo" value={value.hero_subtitle} onChange={(v) => setValue({ ...value, hero_subtitle: v })} textarea className="sm:col-span-2" />
        <AdminInput label="Texto do botão primário" value={value.hero_cta} onChange={(v) => setValue({ ...value, hero_cta: v })} />
        <AdminInput label="Link do botão primário" value={value.hero_cta_link} onChange={(v) => setValue({ ...value, hero_cta_link: v })} placeholder="/menu" />
        <AdminInput label="Texto do botão secundário" value={value.hero_cta2 ?? ""} onChange={(v) => setValue({ ...value, hero_cta2: v })} />
        <AdminInput label="Link do botão secundário" value={value.hero_cta2_link ?? ""} onChange={(v) => setValue({ ...value, hero_cta2_link: v })} placeholder="/menu" />
        <AdminImageField label="Imagem do hero (principal)" value={value.hero_image_url} onChange={(v) => setValue({ ...value, hero_image_url: v })} className="sm:col-span-2" />
        <AdminImageField label="Imagem secundária" value={value.hero_secondary_image_url ?? ""} onChange={(v) => setValue({ ...value, hero_secondary_image_url: v })} />
      </AdminSection>

      <AdminSection title="🎁 Promoção">
        <AdminInput label="Etiqueta promocional" value={value.hero_promo_label ?? ""} onChange={(v) => setValue({ ...value, hero_promo_label: v })} />
        <AdminInput label="Texto promocional" value={value.hero_promo_text ?? ""} onChange={(v) => setValue({ ...value, hero_promo_text: v })} textarea className="sm:col-span-2" />
      </AdminSection>

      {previewOpen && (
        <div className="space-y-3 rounded-2xl border border-brand/20 bg-brand/5 p-4">
          <div className="max-h-96 overflow-y-auto">
            <HomePreview
              content={value}
              sectionOrder={sectionOrder}
              sectionVisibility={sectionVisibility}
              isLoading={saving}
            />
          </div>
          <div className="text-center">
            <button
              onClick={() => setPreviewOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Fechar preview
            </button>
          </div>
        </div>
      )}

      <PageBuilder
        sections={pageBuilderSections}
        onReorder={handleReorder}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggleVisibility={handleToggleVisibility}
        onPreview={handlePreview}
        isSaving={saving}
      />

      <SaveBar save={save} saving={saving} />
    </div>
  );
}
