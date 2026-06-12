import { Clock } from "lucide-react";
import { useBusinessHours } from "@/lib/business-hours";

export function BusinessHoursBanner() {
  const { isOpen, nextOpenTime, closedMessage, config } = useBusinessHours();
  if (!config.enabled || isOpen) return null;
  return (
    <div className="sticky top-0 z-40 w-full border-b border-red-500/30 bg-gradient-to-r from-red-600/90 to-orange-600/90 px-4 py-2 text-center text-sm font-medium text-white">
      <span className="inline-flex items-center gap-2">
        <Clock className="h-4 w-4" />
        🔴 {closedMessage}
        {nextOpenTime ? <span className="opacity-80">· Voltamos {nextOpenTime}</span> : null}
      </span>
    </div>
  );
}
