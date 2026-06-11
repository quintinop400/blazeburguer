import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { WhatsAppFAB } from "./WhatsAppFAB";

export function AppShell({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("public-content-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        queryClient.invalidateQueries({ queryKey: ["products"], exact: false });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        queryClient.invalidateQueries({ queryKey: ["categories"], exact: false });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        queryClient.invalidateQueries({ queryKey: ["banners", "home"] });
        queryClient.invalidateQueries({ queryKey: ["banners", "menu"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => {
        queryClient.invalidateQueries({ queryKey: ["coupons"], exact: false });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onCartClick={() => setCartOpen(true)} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <WhatsAppFAB />
    </div>
  );
}
