import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ContactInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(2000),
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ContactInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject?.trim() || "Contato pelo site",
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });
