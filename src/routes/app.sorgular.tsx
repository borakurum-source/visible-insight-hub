import { createFileRoute } from "@tanstack/react-router";
import { PanelHeader } from "@/components/app/PanelHeader";

export const Route = createFileRoute("/app/sorgular")({
  component: Page,
});

function Page() {
  return (
    <>
      <PanelHeader title="Sorgular" />
      <main className="flex-1 p-8">
        <div className="surface-panel flex h-64 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
          Sorgular modülü burada geliştirilecek.
        </div>
      </main>
    </>
  );
}
