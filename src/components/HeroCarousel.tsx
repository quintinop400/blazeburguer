import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchBanners } from "@/lib/banners";

export function HeroCarousel() {
  const { data: banners = [] } = useQuery({ queryKey: ["banners", "home"], queryFn: () => fetchBanners("home") });
  const [i, setI] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const b = banners[i];

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card glow-brand">
        {b.image_url && (
          <img src={b.image_url} alt={b.title} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
        <div className="relative grid gap-3 p-6 sm:p-10 md:max-w-xl md:p-14">
          {b.subtitle && (
            <span className="w-fit rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
              {b.subtitle}
            </span>
          )}
          <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">{b.title}</h2>
          {b.cta_label && b.link_url && (
            <a href={b.link_url} className="mt-2 inline-flex h-12 w-fit items-center gap-2 rounded-xl gradient-flame px-5 font-display font-semibold text-white glow-brand">
              {b.cta_label} <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>

        {banners.length > 1 && (
          <>
            <button aria-label="Anterior" onClick={() => setI((v) => (v - 1 + banners.length) % banners.length)} className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/70 backdrop-blur hover:bg-background">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button aria-label="Próximo" onClick={() => setI((v) => (v + 1) % banners.length)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/70 backdrop-blur hover:bg-background">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {banners.map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} aria-label={`Banner ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 gradient-flame" : "w-2 bg-muted"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
