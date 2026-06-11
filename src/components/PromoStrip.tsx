import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { fetchBanners } from "@/lib/banners";

export function PromoStrip() {
  const { data: banners = [] } = useQuery({ queryKey: ["banners", "menu"], queryFn: () => fetchBanners("menu") });
  const [i, setI] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const b = banners[i];
  const inner = (
    <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-center text-sm font-semibold">
      <Sparkles className="h-4 w-4 shrink-0 text-white" />
      <span className="text-white">
        <span className="font-bold">{b.title}</span>
        {b.subtitle && <span className="ml-2 hidden font-normal opacity-90 sm:inline">— {b.subtitle}</span>}
      </span>
      {b.cta_label && <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{b.cta_label} →</span>}
    </div>
  );

  return (
    <div className="gradient-flame">
      {b.link_url ? <a href={b.link_url} className="block">{inner}</a> : inner}
    </div>
  );
}
