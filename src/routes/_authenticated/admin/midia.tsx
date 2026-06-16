import { createFileRoute } from "@tanstack/react-router";
import { MediaLibrary } from "@/components/MediaLibrary";

export const Route = createFileRoute("/_authenticated/admin/midia")({
  head: () => ({
    meta: [{ title: "Biblioteca de Mídia — Admin" }],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden">
      <MediaLibrary />
    </div>
  );
}
