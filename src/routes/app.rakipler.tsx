import { createFileRoute } from "@tanstack/react-router";
import { PanelHeader } from "@/components/app/PanelHeader";

export const Route = createFileRoute("/app/rakipler")({
  component: Page,
});

function Page() {
  return (
    <>
      <PanelHeader title="Rakipler" />
      <main className="flex-1 p-8">
        <div className="surface-panel flex h-64 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
          Rakipler modülü burada geliştirilecek.
        </div>
      </main>
    </>
  );
}
