import { Link } from "@tanstack/react-router";

// Sadeleştirilmiş yan menüde yer almayan alt sayfalara bağlam içi erişim.
export function PanelSubnav({ items }: { items: Array<{ to: string; label: string }> }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3 print:hidden" aria-label="Alt sayfalar">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          activeProps={{ className: "rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-medium text-primary" }}
          activeOptions={{ exact: true }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
