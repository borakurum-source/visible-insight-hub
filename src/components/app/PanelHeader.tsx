import { Button } from "@/components/ui/button";

export function PanelHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-8">
      <h1 className="text-lg font-semibold">{title}</h1>
      {action ?? (
        <Button variant="subtle" size="sm">
          Yeni tarama
        </Button>
      )}
    </header>
  );
}