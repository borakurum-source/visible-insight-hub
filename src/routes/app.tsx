// AppShell layout: fixed left sidebar (desktop) / slide-over sheet (mobile).
// Ported from client/src/components/app-shell.tsx, wouter -> TanStack Router,
// Clerk UserButton -> static demo user, live client/domain query -> mock data.
import { useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Sparkles,
  Waypoints,
  Plug,
  Settings,
  CreditCard,
  Menu,
  Building2,
  ListChecks,
  Compass,
  Radar,
  KanbanSquare,
  ShieldCheck,
  FileBarChart,
  PenSquare,
  UserCog,
  Users,
  Star,
  Quote,
} from "lucide-react";
import { activeBrand, activeDomains, demoUser } from "@/lib/panel-mock/clients";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const NAV_GROUPS = [
  {
    label: "Genel Bakış",
    items: [{ to: "/app", label: "Komuta Merkezi", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Keşfet",
    items: [
      { to: "/app/prompts", label: "Promptlar", icon: ListChecks, exact: false },
      { to: "/app/prompt-discovery", label: "Prompt Keşfi", icon: Compass, exact: false },
      { to: "/app/citation-discovery", label: "Kaynak Keşfi", icon: Radar, exact: false },
    ],
  },
  {
    label: "Kanıtı Yönet",
    items: [
      { to: "/app/knowledge-base", label: "Bilgi Bankası", icon: Sparkles, exact: false },
      { to: "/app/claims", label: "Marka İddiaları", icon: ShieldCheck, exact: false },
      { to: "/app/graph", label: "Bilgi Grafiği", icon: Waypoints, exact: false },
    ],
  },
  {
    label: "Uygula",
    items: [
      { to: "/app/content", label: "İçerik Üretimi", icon: PenSquare, exact: false },
      { to: "/app/geo-tasks", label: "GEO Görev Panosu", icon: KanbanSquare, exact: false },
    ],
  },
  {
    label: "Ölç ve Paylaş",
    items: [
      { to: "/app/report", label: "Rapor", icon: FileBarChart, exact: false },
      { to: "/app/integrations", label: "Entegrasyonlar", icon: Plug, exact: false },
    ],
  },
  {
    label: "Çalışma Alanı",
    items: [
      { to: "/app/settings", label: "Ayarlar", icon: Settings, exact: false },
      { to: "/app/account", label: "Hesabım", icon: UserCog, exact: false },
      { to: "/app/pricing", label: "Fiyatlandırma", icon: CreditCard, exact: false },
    ],
  },
  {
    label: "Yönetim",
    items: [{ to: "/app/admin", label: "Admin", icon: Users, exact: false }],
  },
] as const;

function BrandWorkspaceCard() {
  return (
    <section className="px-3" aria-label="Marka çalışma alanı">
      <div className="rounded-xl border border-border bg-muted/40 p-3 shadow-sm">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> Marka çalışma alanı
        </p>
        <div className="flex h-9 w-full items-center rounded-md border border-border bg-background px-3 text-sm font-semibold">
          {activeBrand.name}
        </div>
        <div className="mt-3 border-t border-border pt-2.5">
          <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">Analiz domainleri</p>
          <div className="space-y-1">
            {activeDomains.map((domain) => (
              <div
                key={domain.id}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                  domain.isPrimary ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                {domain.isPrimary ? <Star className="h-3 w-3 shrink-0 fill-current" /> : <Building2 className="h-3 w-3 shrink-0" />}
                <span className="truncate">{domain.domain}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const location = useLocation();
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-2" aria-label="Ana menü">
      {NAV_GROUPS.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? location.pathname === to : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                    active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col gap-4 py-4">
      <Link to="/app" onClick={onNavigate} className="flex items-center gap-2 px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Quote className="size-4" />
        </span>
        <span className="font-display text-base font-semibold">OneCite</span>
      </Link>
      <BrandWorkspaceCard />
      <NavList onNavigate={onNavigate} />
      <div className="flex items-center gap-2 border-t border-border px-4 pt-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{demoUser.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{demoUser.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{demoUser.role}</p>
        </div>
      </div>
    </div>
  );
}

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/50 lg:flex print:hidden">
        <SidebarContent />
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden print:hidden">
        <Link to="/app" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Quote className="size-3.5" />
          </span>
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Menü</SheetTitle>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <main className="lg:pl-64 print:pl-0">
        <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
