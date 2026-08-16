import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BarChart3, FileSearch, LayoutDashboard, Quote, Settings, Users } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const navItems = [
  { to: "/app", label: "Genel Bakış", icon: LayoutDashboard, exact: true },
  { to: "/app/sorgular", label: "Sorgular", icon: FileSearch, exact: false },
  { to: "/app/rakipler", label: "Rakipler", icon: Users, exact: false },
  { to: "/app/raporlar", label: "Raporlar", icon: BarChart3, exact: false },
  { to: "/app/ayarlar", label: "Ayarlar", icon: Settings, exact: false },
] as const;

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <Link to="/" className="flex h-16 items-center gap-2 px-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Quote className="size-4" />
          </span>
          <span className="font-display text-base font-semibold">1cite</span>
          <span className="ml-auto font-mono text-[10px] uppercase text-muted-foreground">app</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground",
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs text-muted-foreground">
          Çalışma alanı: <span className="text-foreground">Demo Marka</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}