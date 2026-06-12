import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DaySchedule = { open: boolean; from?: string; to?: string };
export type BusinessHoursConfig = {
  enabled: boolean;
  schedule: Record<string, DaySchedule>;
  closed_message?: string;
};

const DEFAULT: BusinessHoursConfig = {
  enabled: false,
  schedule: {
    "0": { open: true, from: "11:00", to: "22:00" },
    "1": { open: true, from: "11:00", to: "22:00" },
    "2": { open: true, from: "11:00", to: "22:00" },
    "3": { open: true, from: "11:00", to: "22:00" },
    "4": { open: true, from: "11:00", to: "22:00" },
    "5": { open: true, from: "11:00", to: "23:00" },
    "6": { open: true, from: "11:00", to: "23:00" },
  },
  closed_message: "Estamos fechados no momento. Volte em breve!",
};

function parseHM(s?: string): number {
  if (!s) return 0;
  const [h, m] = s.split(":").map(n => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

export function evalHours(cfg: BusinessHoursConfig, now = new Date()) {
  if (!cfg.enabled) return { isOpen: true, nextOpenTime: "", closedMessage: cfg.closed_message ?? "" };
  const dow = now.getDay();
  const today = cfg.schedule[String(dow)] ?? { open: false };
  const minutes = now.getHours() * 60 + now.getMinutes();
  const isOpen = !!today.open && minutes >= parseHM(today.from) && minutes < parseHM(today.to);
  let nextOpenTime = "";
  if (!isOpen) {
    for (let i = 0; i < 7; i++) {
      const d = (dow + i) % 7;
      const sc = cfg.schedule[String(d)];
      if (sc?.open && sc.from) {
        if (i === 0 && minutes < parseHM(sc.from)) { nextOpenTime = `hoje às ${sc.from}`; break; }
        if (i === 0) continue;
        const names = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
        nextOpenTime = i === 1 ? `amanhã às ${sc.from}` : `${names[d]} às ${sc.from}`;
        break;
      }
    }
  }
  return { isOpen, nextOpenTime, closedMessage: cfg.closed_message ?? "" };
}

export function useBusinessHours() {
  const { data } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "business_hours").maybeSingle();
      const value = data?.value as Partial<BusinessHoursConfig> | null;
      if (!value || typeof value !== "object") return DEFAULT;
      return { ...DEFAULT, ...value, schedule: { ...DEFAULT.schedule, ...(value.schedule ?? {}) } } as BusinessHoursConfig;
    },
    staleTime: 60_000,
  });
  const cfg = data ?? DEFAULT;
  return { config: cfg, ...evalHours(cfg) };
}

export function useStoreWhatsApp() {
  const { data } = useQuery({
    queryKey: ["whatsapp-number"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "whatsapp_number").maybeSingle();
      const raw = data?.value;
      const v = typeof raw === "string" ? raw : (raw as { number?: string } | null)?.number ?? "";
      return (v || "").toString().replace(/\D/g, "");
    },
    staleTime: 60_000,
  });
  return data ?? "";
}
