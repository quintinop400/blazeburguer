import { Link } from "@tanstack/react-router";
import { Flame, Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { usePageContent } from "@/lib/page-content";

type FooterContent = {
  about: string;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  copyright: string;
};

export function Footer() {
  const c = usePageContent<FooterContent>("footer");
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-flame glow-brand">
              <Flame className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold">
              BLAZE<span className="text-gradient-flame">BURGER</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{c.about}</p>
          {(c.instagram || c.facebook) && (
            <div className="mt-4 flex gap-2">
              {c.instagram && (
                <a href={c.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition hover:border-brand hover:text-brand">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {c.facebook && (
                <a href={c.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition hover:border-brand hover:text-brand">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Navegação</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="transition hover:text-foreground">Home</Link></li>
            <li><Link to="/menu" className="transition hover:text-foreground">Cardápio</Link></li>
            <li><Link to="/quem-somos" className="transition hover:text-foreground">Quem Somos</Link></li>
            <li><Link to="/contato" className="transition hover:text-foreground">Contato</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Ajuda</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/faq" className="transition hover:text-foreground">Perguntas Frequentes</Link></li>
            <li><Link to="/trabalhe-conosco" className="transition hover:text-foreground">Trabalhe Conosco</Link></li>
            <li><Link to="/contato" className="transition hover:text-foreground">Fale Conosco</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Contato</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {c.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{c.address}</span>
              </li>
            )}
            {c.phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-brand" />
                <a href={`tel:${c.phone.replace(/[^+\d]/g, "")}`} className="transition hover:text-foreground">{c.phone}</a>
              </li>
            )}
            {c.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand" />
                <a href={`mailto:${c.email}`} className="transition hover:text-foreground">{c.email}</a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>{c.copyright.replace("©", `© ${new Date().getFullYear()}`)}</p>
          <p>Feito com 🔥 para quem ama um bom burger.</p>
        </div>
      </div>
    </footer>
  );
}
