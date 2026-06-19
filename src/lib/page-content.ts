import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PageSlug = "contato" | "home" | "footer" | "trabalhe-conosco" | "faq";

export const DEFAULTS: Record<PageSlug, Record<string, unknown>> = {
  contato: {
    title: "Contato",
    subtitle: "Fale com a gente",
    description: "Dúvida, sugestão, parceria ou só pra elogiar — a gente quer ouvir você.",
    phone: "(11) 3000-0000",
    whatsapp: "5511999990000",
    whatsapp_label: "(11) 99999-0000",
    email: "contato@empresa.com",
    address: "Av. Brasil, 1500 — Centro, São Paulo / SP",
    hours: "Seg a Dom — 18h às 23h",
    map_embed: "https://www.google.com/maps?q=Avenida%20Brasil%201500%20S%C3%A3o%20Paulo&output=embed",
    cta_label: "Chamar no WhatsApp",
    social: { instagram: "", facebook: "", tiktok: "" },
  },
  home: {
    hero_eyebrow: "Aberto agora · Entrega em 30 min",
    hero_title: "Os Hambúrgueres Mais Saborosos da Cidade",
    hero_subtitle: "Ingredientes selecionados, preparo artesanal e entrega rápida na sua porta.",
    hero_cta: "Peça agora",
    hero_cta_link: "/menu",
    hero_image_url: "",
    hero_cta2: "Ver Cardápio",
    hero_cta2_link: "/menu",
    hero_promo_label: "Promoção do dia",
    hero_promo_text: "Combo Família com 20% OFF",
    hero_secondary_image_url: "",
    section_order: ["hero", "categories", "features", "combos", "highlights", "numbers", "testimonials", "how_it_works"],
    section_visibility: {
      hero: true,
      categories: true,
      features: true,
      combos: true,
      highlights: true,
      numbers: true,
      testimonials: true,
      how_it_works: true,
    },
  },
  footer: {
    about: "Smash burgers artesanais com ingredientes selecionados e entrega rápida na sua porta.",
    phone: "(11) 3000-0000",
    email: "contato@empresa.com",
    address: "Av. Brasil, 1500 — Centro, São Paulo / SP",
    instagram: "",
    facebook: "",
    copyright: "© BlazeBurger. Todos os direitos reservados.",
  },
  "trabalhe-conosco": {
    title: "Trabalhe Conosco",
    subtitle: "Faça parte do nosso time",
    description: "Tá afim de fazer parte do time? Manda seu currículo que a gente analisa com carinho.",
  },
  faq: {
    title: "Perguntas Frequentes",
    subtitle: "Tire suas dúvidas",
    description: "As respostas pras dúvidas mais comuns. Não achou o que procurava? Fala com a gente.",
  },
};

export function usePageContent<T extends Record<string, unknown>>(slug: PageSlug) {
  const fallback = DEFAULTS[slug] as T;
  const q = useQuery({
    queryKey: ["page_content", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_content")
        .select("content")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return { ...fallback, ...((data?.content as T) ?? {}) } as T;
    },
  });
  return q.data ?? fallback;
}

export function usePageEditor<T extends Record<string, unknown>>(slug: PageSlug) {
  const qc = useQueryClient();
  const fallback = DEFAULTS[slug] as T;
  const [value, setValue] = useState<T>(fallback);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "page_content", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_content")
        .select("content")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return { ...fallback, ...((data?.content as T) ?? {}) } as T;
    },
  });

  useEffect(() => {
    if (data) setValue(data);
  }, [data]);

  async function save() {
    setSaving(true);
    const content = JSON.parse(JSON.stringify(value));
    const { error } = await supabase
      .from("page_content")
      .upsert({ slug, content }, { onConflict: "slug" });
    setSaving(false);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["admin", "page_content", slug] });
    qc.invalidateQueries({ queryKey: ["page_content", slug] });
  }

  return { value, setValue, save, isLoading, saving };
}
