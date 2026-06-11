import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  name: z.string().min(1).max(120),
  hints: z.string().max(500).optional(),
});

export const generateProductDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const prompt = `Você é um copywriter para uma lanchonete premium e moderna. Gere UMA descrição curta (1 a 2 frases, máximo 220 caracteres) em português do Brasil, apetitosa, sensorial, sem repetir o nome do produto. Use linguagem natural, evite emojis e clichês.

Produto: ${data.name}
${data.hints ? `Ingredientes/observações: ${data.hints}` : ""}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AI gateway falhou (${res.status}): ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { description: text.replace(/^["'`]|["'`]$/g, "") };
  });
