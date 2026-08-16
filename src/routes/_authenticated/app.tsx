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
  Users, Quote, Lock, LogOut, Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { initials, useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact: boolean; match?: string[] };
type NavGroup = { label: string; items: NavItem[]; adminOnly?: boolean };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "İzle",
    items: [
      { to: "/app", label: "Komuta Merkezi", icon: LayoutDashboard, exact: true },
      { to: "/app/onboarding", label: "Kurulum", icon: Sparkles, exact: false },
      {
        to: "/app/prompts",
        label: "Görünürlük",
        icon: Gauge,
        exact: false,
        match: ["/app/prompts", "/app/prompt-discovery", "/app/measurement", "/app/citation-discovery", "/app/report"],
      },
    ],
  },
  {
    label: "Anla",
    items: [
      { to: "/app/graph", label: "Bilgi Grafiği", icon: Waypoints, exact: false },
      { to: "/app/knowledge-base", label: "Bilgi Bankası", icon: BookOpen, exact: false, match: ["/app/knowledge-base", "/app/claims"] },
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
      {
        to: "/app/settings",
        label: "Ayarlar",
        icon: Settings,
        exact: false,
        match: ["/app/settings", "/app/integrations", "/app/account", "/app/pricing"],
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

function BrandWorkspaceCard() {
  const { brands, brand, selectBrand } = useActiveBrand();

  return (
    <section className="px-3" aria-label="Marka çalışma alanı">
      <div className="rounded-xl border border-border bg-muted/40 p-3 shadow-sm">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> Marka çalışma alanı
        </p>
        {brands.length > 0 ? (
          <Select value={brand?.id ?? ""} onValueChange={selectBrand}>
            <SelectTrigger className="h-9 text-sm font-semibold" aria-label="Marka seç">
              <SelectValue placeholder="Marka seç" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-xs text-muted-foreground">Henüz marka eklenmedi.</p>
        )}
        <div className="mt-3 border-t border-border pt-2.5">
          {brand ? (
            <p className="truncate text-xs text-muted-foreground">{brand.domain}</p>
          ) : null}
          <Button asChild variant="ghost" size="sm" className="mt-1 h-7 w-full justify-start px-1 text-xs">
            <Link to="/app/onboarding">
              <Plus className="mr-1 h-3.5 w-3.5" /> Marka ekle
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const location = useLocation();
  const { brand, isAdmin } = useActiveBrand();
  const setupDone = Boolean(brand?.onboarding_completed);

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-2" aria-label="Ana menü">
      {NAV_GROUPS.filter((group) => !group.adminOnly || isAdmin).map((group) => (
        <section key={group.label} aria-label={group.label}>
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map(({ to, label, icon: Icon, exact, match }) => {
              const locked = !setupDone && !ALWAYS_OPEN.has(to);
              const active = exact
                ? location.pathname === to
                : (match ?? [to]).some((path) => location.pathname.startsWith(path));
              if (locked) {
                return (
                  <div
                    key={to}
                    title="Kurulumu tamamlayınca açılır"
                    className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground/50"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    <Lock className="h-3 w-3" aria-hidden="true" />
                  </div>
                );
              }
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
    <div className="flex h-full flex-col gap-4 py-4">
      <Link to="/app" onClick={onNavigate} className="flex items-center gap-2 px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Quote className="size-4" />
        </span>
        <span className="font-display text-base font-semibold">OneCite</span>
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
