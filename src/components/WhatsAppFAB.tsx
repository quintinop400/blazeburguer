import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_NUMBER = "5511999990000";
const DEFAULT_MESSAGE = "Olá! Vim pelo site da BlazeBurger e gostaria de mais informações.";

export function WhatsAppFAB() {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState(DEFAULT_NUMBER);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("settings")
      .select("value")
      .eq("key", "whatsapp_number")
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const v = data?.value;
        const raw = typeof v === "string" ? v : typeof v === "object" && v && "number" in v ? String((v as { number: unknown }).number ?? "") : "";
        const digits = raw.replace(/\D/g, "");
        if (digits.length >= 10) setNumber(digits);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const href = `https://wa.me/${number}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="w-72 animate-fade-in rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold">Fala com a gente!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Atendimento rápido pelo WhatsApp. Tira dúvidas, faz pedido ou pede dicas do chef. 🔥
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 grid h-10 w-full place-items-center rounded-lg bg-[#25D366] text-sm font-semibold text-white transition hover:brightness-110"
          >
            Iniciar conversa
          </a>
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="group relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-2xl transition hover:scale-105"
        aria-label="Abrir WhatsApp"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30" />
        <MessageCircle className="relative h-7 w-7" />
      </button>
    </div>
  );
}
