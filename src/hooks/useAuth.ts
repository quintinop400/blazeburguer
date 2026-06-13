import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "staff" | "customer";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AUTH STATE] onAuthStateChange", {
        event,
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        hasSession: Boolean(session),
      });
      setUser(session?.user ?? null);
      if (session?.user) {
        // defer to avoid recursion
        setTimeout(() => loadRoles(session.user.id), 0);
      } else {
        setRoles([]);
      }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("[AUTH STATE] getSession", {
        userId: data.session?.user?.id ?? null,
        email: data.session?.user?.email ?? null,
        hasSession: Boolean(data.session),
        error: error
          ? {
              message: error.message,
              name: error.name,
              status: (error as any)?.status,
              code: (error as any)?.code,
            }
          : null,
      });
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadRoles(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadRoles(uid: string) {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (error) {
      console.error("[AUTH STATE] loadRoles_error", {
        userId: uid,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      setRoles([]);
      return;
    }
    const nextRoles = (data ?? []).map(r => r.role as AppRole);
    console.log("[AUTH STATE] loadRoles_success", { userId: uid, roles: nextRoles });
    setRoles(nextRoles);
  }

  const isStaff = roles.includes("admin") || roles.includes("staff");
  const isAdmin = roles.includes("admin");

  return { user, roles, loading, isStaff, isAdmin };
}

export async function signOut() {
  console.log("[AUTH STATE] signOut_submit");
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[AUTH STATE] signOut_error", {
      message: error.message,
      name: error.name,
      status: (error as any)?.status,
      code: (error as any)?.code,
    });
    throw error;
  }
  console.log("[AUTH STATE] signOut_success");
}
