import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const registerAdminAccount = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    registrationKey: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const { email, password, name, registrationKey } = data;

    // Validate the admin registration key server-side
    const expectedKey = process.env.ADMIN_REGISTRATION_KEY;
    if (!expectedKey) {
      throw new Error("Registro de administrador não está disponível no momento.");
    }
    if (registrationKey !== expectedKey) {
      throw new Error("Chave de registro inválida.");
    }

    try {
      // Create user via service role
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          email,
          full_name: name,
        });
      if (profileError) throw profileError;

      // Create admin role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "admin",
        });
      if (roleError) throw roleError;

      return {
        success: true,
        message: "Administrador criado com sucesso! Faça login agora.",
      };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Erro ao criar admin");
    }
  });
