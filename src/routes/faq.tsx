import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { usePageContent } from "@/lib/page-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas Frequentes — BlazeBurger" },
      { name: "description", content: "Tire suas dúvidas sobre pedidos, entrega, pagamento e mais na BlazeBurger." },
      { property: "og:title", content: "Perguntas Frequentes — BlazeBurger" },
      { property: "og:description", content: "Perguntas frequentes sobre a BlazeBurger." },
    ],
  }),
  component: FaqPage,
});

type FaqRow = { id: string; question: string; answer: string; sort_order: number };

function FaqPage() {
  const c = usePageContent<{ title: string; subtitle: string; description: string }>("faq");
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faqs", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("id,question,answer,sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as FaqRow[];
    },
  });

  return (
    <AppShell>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 gradient-flame opacity-10" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-flame text-white glow-brand">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-display text-4xl font-extrabold sm:text-5xl">{c.title}</h1>
          <p className="mt-3 text-muted-foreground">
            {c.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Nenhuma pergunta cadastrada ainda.
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map(f => (
              <AccordionItem
                key={f.id}
                value={f.id}
                className="overflow-hidden rounded-2xl border border-border bg-card px-5 transition hover:border-brand"
              >
                <AccordionTrigger className="font-display text-base font-semibold hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>
    </AppShell>
  );
}
