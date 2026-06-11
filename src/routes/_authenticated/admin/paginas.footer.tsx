import { createFileRoute } from "@tanstack/react-router";
import { usePageEditor } from "@/lib/page-content";
import { AdminInput, AdminSection, SaveBar } from "@/components/admin/PageFormBits";

export const Route = createFileRoute("/_authenticated/admin/paginas/footer")({
  component: FooterAdmin,
});

type FooterContent = {
  about: string;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  copyright: string;
};

function FooterAdmin() {
  const { value, setValue, save, saving } = usePageEditor<FooterContent>("footer");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Rodapé</h1>
        <p className="text-sm text-muted-foreground">Textos e links do rodapé do site.</p>
      </div>
      <AdminSection title="Marca">
        <AdminInput label="Sobre" value={value.about} onChange={(v) => setValue({ ...value, about: v })} textarea className="sm:col-span-2" />
        <AdminInput label="Copyright" value={value.copyright} onChange={(v) => setValue({ ...value, copyright: v })} className="sm:col-span-2" />
      </AdminSection>
      <AdminSection title="Contato">
        <AdminInput label="Telefone" value={value.phone} onChange={(v) => setValue({ ...value, phone: v })} />
        <AdminInput label="E-mail" value={value.email} onChange={(v) => setValue({ ...value, email: v })} />
        <AdminInput label="Endereço" value={value.address} onChange={(v) => setValue({ ...value, address: v })} className="sm:col-span-2" />
      </AdminSection>
      <AdminSection title="Redes sociais">
        <AdminInput label="Instagram (URL)" value={value.instagram} onChange={(v) => setValue({ ...value, instagram: v })} />
        <AdminInput label="Facebook (URL)" value={value.facebook} onChange={(v) => setValue({ ...value, facebook: v })} />
      </AdminSection>
      <SaveBar save={save} saving={saving} />
    </div>
  );
}
