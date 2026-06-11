import { createFileRoute } from "@tanstack/react-router";
import { usePageEditor } from "@/lib/page-content";
import { AdminInput, AdminSection, SaveBar } from "@/components/admin/PageFormBits";

export const Route = createFileRoute("/_authenticated/admin/paginas/contato")({
  component: ContatoAdmin,
});

type ContatoContent = {
  title: string;
  subtitle: string;
  description: string;
  phone: string;
  whatsapp: string;
  whatsapp_label: string;
  email: string;
  address: string;
  hours: string;
  map_embed: string;
  cta_label: string;
  social: { instagram: string; facebook: string; tiktok: string };
};

function ContatoAdmin() {
  const { value, setValue, save, saving } = usePageEditor<ContatoContent>("contato");
  const social = value.social ?? { instagram: "", facebook: "", tiktok: "" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Página de Contato</h1>
        <p className="text-sm text-muted-foreground">Edite os textos, contatos e mapa exibidos no site.</p>
      </div>

      <AdminSection title="Textos da página">
        <AdminInput label="Título" value={value.title} onChange={(v) => setValue({ ...value, title: v })} />
        <AdminInput label="Subtítulo (eyebrow)" value={value.subtitle} onChange={(v) => setValue({ ...value, subtitle: v })} />
        <AdminInput label="Descrição" value={value.description} onChange={(v) => setValue({ ...value, description: v })} textarea className="sm:col-span-2" />
        <AdminInput label="Texto do botão WhatsApp" value={value.cta_label} onChange={(v) => setValue({ ...value, cta_label: v })} />
      </AdminSection>

      <AdminSection title="Dados de contato">
        <AdminInput label="Telefone" value={value.phone} onChange={(v) => setValue({ ...value, phone: v })} placeholder="(11) 3000-0000" />
        <AdminInput label="E-mail" value={value.email} onChange={(v) => setValue({ ...value, email: v })} />
        <AdminInput label="WhatsApp (somente números, com DDI)" value={value.whatsapp} onChange={(v) => setValue({ ...value, whatsapp: v })} placeholder="5511999990000" />
        <AdminInput label="WhatsApp (rótulo exibido)" value={value.whatsapp_label} onChange={(v) => setValue({ ...value, whatsapp_label: v })} placeholder="(11) 99999-0000" />
        <AdminInput label="Endereço" value={value.address} onChange={(v) => setValue({ ...value, address: v })} className="sm:col-span-2" />
        <AdminInput label="Horários" value={value.hours} onChange={(v) => setValue({ ...value, hours: v })} className="sm:col-span-2" />
      </AdminSection>

      <AdminSection title="Redes sociais">
        <AdminInput label="Instagram (URL)" value={social.instagram} onChange={(v) => setValue({ ...value, social: { ...social, instagram: v } })} />
        <AdminInput label="Facebook (URL)" value={social.facebook} onChange={(v) => setValue({ ...value, social: { ...social, facebook: v } })} />
        <AdminInput label="TikTok (URL)" value={social.tiktok} onChange={(v) => setValue({ ...value, social: { ...social, tiktok: v } })} />
      </AdminSection>

      <AdminSection title="Mapa">
        <AdminInput
          label="URL de embed do Google Maps"
          value={value.map_embed}
          onChange={(v) => setValue({ ...value, map_embed: v })}
          placeholder="https://www.google.com/maps?q=...&output=embed"
          textarea
          className="sm:col-span-2"
        />
      </AdminSection>

      <SaveBar save={save} saving={saving} />
    </div>
  );
}
