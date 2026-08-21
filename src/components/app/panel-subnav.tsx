import { Link } from "@tanstack/react-router";

// Yan menüdeki her hub'ın sekmeleri. Menü ile haplar aynı hiyerarşiyi anlatır.
export const VISIBILITY_SUBNAV = [
  { to: "/app/prompts", label: "Promptlar & Ölçüm" },
  { to: "/app/citation-discovery", label: "Seçilen Kaynaklar" },
  { to: "/app/competitors", label: "Rakip Takibi" },
];

export const OPPORTUNITY_SUBNAV = [
  { to: "/app/prompt-demand", label: "AI Talep Keşfi" },
  { to: "/app/prompt-discovery", label: "Prompt Keşfi" },
];

export const ACTIONS_SUBNAV = [
  { to: "/app/geo-tasks", label: "Bulgular & Aksiyonlar" },
  { to: "/app/report", label: "Müşteri Raporu" },
];

export const KNOWLEDGE_SUBNAV = [
  { to: "/app/graph", label: "Özet & Varlık Grafiği" },
  { to: "/app/knowledge-base", label: "Kaynaklar & Crawl" },
  { to: "/app/claims", label: "Onaylı Gerçekler" },
];

export const WORKSPACE_SUBNAV = [
  { to: "/app/settings", label: "Ayarlar" },
  { to: "/app/integrations", label: "Entegrasyonlar" },
  { to: "/app/system-prompts", label: "Sistem Talimatları" },
  { to: "/app/account", label: "Hesabım" },
  { to: "/app/pricing", label: "Plan" },
];

// Sadeleştirilmiş yan menüde yer almayan alt sayfalara bağlam içi erişim.
export function PanelSubnav({ items }: { items: Array<{ to: string; label: string }> }) {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border pb-3 print:hidden"
      aria-label="Alt sayfalar"
    >
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          activeProps={{
            className:
              "rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-medium text-primary",
          }}
          activeOptions={{ exact: true }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
