import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";


export const registerAdminAccount = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    registrationKey: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const { password, registrationKey } = data;
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();

    // Validate the admin registration key server-side
    const expectedKey = process.env.ADMIN_REGISTRATION_KEY;
    if (!expectedKey) {
      throw new Error("Registro de administrador não está disponível no momento.");
    }
    if (registrationKey !== expectedKey) {
      throw new Error("Chave de registro inválida.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let createdUserId: string | null = null;

    try {
      const { data: usersPage, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (listUsersError) throw listUsersError;

      const existingUser = usersPage.users.find((user) => user.email?.toLowerCase() === email);

      let userId = existingUser?.id ?? null;

      if (existingUser) {
        const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: {
            ...(existingUser.user_metadata ?? {}),
            full_name: name,
            name,
          },
        });

        if (updateUserError) throw updateUserError;
      } else {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: name, name },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Falha ao criar usuário");

        userId = authData.user.id;
        createdUserId = authData.user.id;
      }

      if (!userId) throw new Error("Falha ao localizar usuário");

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            email,
            full_name: name,
          },
          { onConflict: "id" },
        );
      if (profileError) throw profileError;

      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            role: "admin",
          },
          { onConflict: "user_id,role" },
        );
      if (roleError) throw roleError;

      return {
        success: true,
        message: "Administrador criado com sucesso! Faça login agora.",
      };
    } catch (err) {
      if (createdUserId) {
        await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
      }
      throw new Error(err instanceof Error ? err.message : "Erro ao criar admin");
    }
  });
