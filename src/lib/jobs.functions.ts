import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_BYTES = 4 * 1024 * 1024;

const JobInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  position: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  resumeBase64: z.string().min(1).max(8_000_000),
  resumeFilename: z.string().min(1).max(180),
  resumeMime: z.string().min(1).max(120),
});

export const submitJobApplication = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => JobInput.parse(d))
  .handler(async ({ data }) => {
    if (data.resumeMime !== "application/pdf") {
      throw new Error("O currículo precisa ser um arquivo PDF.");
    }
    const buf = Buffer.from(data.resumeBase64, "base64");
    if (buf.byteLength === 0) throw new Error("Arquivo vazio.");
    if (buf.byteLength > MAX_BYTES) throw new Error("Arquivo maior que 4MB.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const safeName = data.resumeFilename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path = `resumes/${crypto.randomUUID()}-${safeName}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("media")
      .upload(path, buf, { contentType: "application/pdf", upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("media")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (sErr || !signed) throw new Error(sErr?.message ?? "Falha ao gerar URL do currículo.");

    const subject = data.position?.trim()
      ? `Candidatura — ${data.position.trim()}`
      : "Candidatura — Trabalhe Conosco";
    const body = [
      data.message?.trim() ? data.message.trim() : "(Sem mensagem)",
      "",
      `Currículo: ${signed.signedUrl}`,
    ].join("\n");

    const { error: insErr } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject,
      message: body,
    });
    if (insErr) throw new Error(insErr.message);

    return { success: true };
  });
