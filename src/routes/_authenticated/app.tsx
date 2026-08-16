// AppShell layout: fixed left sidebar (desktop) / slide-over sheet (mobile).
// Session, brand switcher and role gating come from Lovable Cloud.
import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard, Sparkles, Settings, Menu, Building2, Gauge,
  KanbanSquare, BookOpen, PenSquare, Waypoints,
  Users, Lock, LogOut, Plus,
} from "lucide-react";
import BrandLogo from "@/components/site/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { initials, useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact: boolean;
  children?: Array<{ to: string; label: string }>;
};
type NavGroup = { label: string; items: NavItem[]; adminOnly?: boolean };

// Yan menü, sayfa içi hap menüleriyle birebir aynı hiyerarşiyi gösterir.
const NAV_GROUPS: NavGroup[] = [
  {
    label: "İzle",
    items: [
      { to: "/app", label: "Komuta Merkezi", icon: LayoutDashboard, exact: true },
      {
        to: "/app/prompts",
        label: "Görünürlük",
        icon: Gauge,
        exact: false,
        children: [
          { to: "/app/prompts", label: "Promptlar" },
          { to: "/app/prompt-discovery", label: "Prompt Keşfi" },
          { to: "/app/measurement", label: "Ölçüm & Skor" },
          { to: "/app/citation-discovery", label: "Atıf Kaynakları" },
          { to: "/app/report", label: "Rapor" },
        ],
      },
    ],
  },
  {
    label: "Anla",
    items: [
      {
        to: "/app/graph",
        label: "Marka Zekası",
        icon: Waypoints,
        exact: false,
      },
      {
        to: "/app/knowledge-base",
        label: "Bilgi Bankası",
        icon: BookOpen,
        exact: false,
        children: [
          { to: "/app/knowledge-base", label: "Kaynaklar" },
          { to: "/app/claims", label: "Marka İddiaları" },
        ],
      },
    ],
  },
  {
    label: "Harekete geç",
    items: [
      { to: "/app/content", label: "İçerik Üretimi", icon: PenSquare, exact: false },
      { to: "/app/geo-tasks", label: "Görevler", icon: KanbanSquare, exact: false },
    ],
  },
  {
    label: "Çalışma Alanı",
    items: [
      { to: "/app/onboarding", label: "Kurulum", icon: Sparkles, exact: false },
      {
        to: "/app/settings",
        label: "Ayarlar",
        icon: Settings,
        exact: false,
        children: [
          { to: "/app/settings", label: "Marka ayarları" },
          { to: "/app/integrations", label: "Entegrasyonlar" },
          { to: "/app/system-prompts", label: "Sistem Talimatları" },
          { to: "/app/account", label: "Hesabım" },
          { to: "/app/pricing", label: "Plan" },
        ],
      },
    ],
  },
  {
    label: "Yönetim",
    adminOnly: true,
    items: [{ to: "/app/admin", label: "Admin", icon: Users, exact: false }],
  },
];

const ALWAYS_OPEN = new Set(["/app", "/app/onboarding", "/app/account", "/app/pricing"]);

function itemPaths(item: NavItem): string[] {
  return item.children ? item.children.map((child) => child.to) : [item.to];
}

function BrandWorkspaceCard() {
  const { brands, brand, selectBrand } = useActiveBrand();

  return (
    <section className="px-3" aria-label="Marka çalışma alanı">
      {brands.length > 0 ? (
        <Select value={brand?.id ?? ""} onValueChange={(value) => selectBrand(value)}>
          <SelectTrigger className="h-9 w-full text-[13px] font-semibold" aria-label="Marka seç">
            <span className="flex min-w-0 items-center gap-2">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder="Marka seç" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Button asChild size="sm" variant="secondary" className="h-9 w-full justify-start text-[13px]">
          <Link to="/app/onboarding"><Plus className="mr-1.5 h-3.5 w-3.5" /> Marka ekle</Link>
        </Button>
      )}
    </section>
  );
}

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const location = useLocation();
  const { brand, isAdmin } = useActiveBrand();
  const setupDone = Boolean(brand?.onboarding_completed);

  return (
    <nav className="flex-1 space-y-3 overflow-y-auto px-3 pb-2" aria-label="Ana menü">
      {NAV_GROUPS.filter((group) => !group.adminOnly || isAdmin).map((group) => (
        <section key={group.label} aria-label={group.label}>
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
            {group.label}
          </p>
          <div className="space-y-px">
            {group.items.map((item) => {
              const { to, label, icon: Icon, exact } = item;
              const locked = !setupDone && !ALWAYS_OPEN.has(to);
              const active = exact
                ? location.pathname === to
                : itemPaths(item).some((path) => location.pathname.startsWith(path));

              if (locked) {
                return (
                  <div
                    key={to}
                    title="Kurulumu tamamlayınca açılır"
                    className="flex cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground/50"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    <Lock className="h-3 w-3" aria-hidden="true" />
                  </div>
                );
              }

              return (
                <div key={to}>
                  <Link
                    to={to}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                      active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                  {item.children ? (
                    <div className="ml-[1.4rem] mt-px space-y-px border-l border-border pl-2">
                      {item.children.map((child) => {
                        const childActive = location.pathname === child.to;
                        return (
                          <Link
                            key={child.to}
                            to={child.to}
                            onClick={onNavigate}
                            aria-current={childActive ? "page" : undefined}
                            className={`block rounded-md px-2 py-1 text-[12px] transition-colors ${
                              childActive ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function UserFooter() {
  const { profile, isAdmin } = useActiveBrand();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex items-center gap-2 border-t border-border px-4 pt-3">
      <Avatar className="h-8 w-8">
        {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
        <AvatarFallback className="text-xs">{initials(profile?.full_name, profile?.email)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{profile?.full_name ?? profile?.email ?? "Kullanıcı"}</p>
        <p className="truncate text-[10px] text-muted-foreground">{isAdmin ? "Yönetici" : "Çalışma alanı üyesi"}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Çıkış yap" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col gap-3 py-4">
      <Link to="/app" onClick={onNavigate} className="flex items-center px-4" aria-label="OneCite paneli">
        <BrandLogo variant="horizontal" size="sm" />
      </Link>
      <BrandWorkspaceCard />
      <NavList onNavigate={onNavigate} />
      <UserFooter />
    </div>
  );
}

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLoading, brands, brand } = useActiveBrand();
  const location = useLocation();
  const navigate = useNavigate();

  const needsSetup = !isLoading && (brands.length === 0 || !brand?.onboarding_completed);
  const onSetupRoute = location.pathname.startsWith("/app/onboarding");

  useEffect(() => {
    if (needsSetup && !onSetupRoute && !ALWAYS_OPEN.has(location.pathname)) {
      navigate({ to: "/app/onboarding", replace: true });
    }
  }, [needsSetup, onSetupRoute, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/50 lg:flex print:hidden">
        <SidebarContent />
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden print:hidden">
        <Link to="/app" className="flex items-center" aria-label="OneCite paneli">
          <BrandLogo variant="icon" size="sm" />
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
