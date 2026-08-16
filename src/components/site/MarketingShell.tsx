import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/site/BrandLogo";

const marketingLinks = [
  { href: "/platform", label: "Platform" },
  { href: "/platform/evidence-gaps", label: "Eksik Kanıtlar" },
  { href: "/solutions/agencies", label: "Ajanslar" },
  { href: "/proof/filmfolk", label: "Örnek Çalışma" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/fiyatlandirma", label: "Fiyatlandırma" },
  { href: "/sunum", label: "Sunum" },
  { href: "/makaleler", label: "Kaynaklar" },
];

export function MarketingShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-cyan/30">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="marketing-container flex h-16 items-center justify-between">
          <BrandLogo variant="horizontal" size="sm" linkTo="/" />
          <nav className="hidden items-center gap-6 text-[13px] font-medium tracking-[-0.01em] text-muted-foreground xl:flex" aria-label="Pazarlama navigasyonu">
            {marketingLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="whitespace-nowrap transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild>
              <Link to="/auth">Giriş yap</Link>
            </Button>
            <Button asChild>
              <Link to="/free-ai-readiness-report">
                Ölçümünü başlat <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <Button size="sm" asChild>
              <Link to="/free-ai-readiness-report">Ölç</Link>
            </Button>
            <button
              type="button"
              className="rounded-md p-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Menüyü aç"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="border-t border-border bg-background px-4 py-4 md:hidden" aria-label="Mobil pazarlama navigasyonu">
            <div className="space-y-1">
              {marketingLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="mt-2 block w-full rounded-lg border border-border px-3 py-2.5 text-left text-sm font-semibold text-foreground"
              >
                Giriş yap
              </Link>
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t border-border bg-background">
        <div className="marketing-container flex flex-col items-center justify-between gap-5 py-9 text-sm text-muted-foreground md:flex-row">
          <BrandLogo variant="horizontal" size="sm" linkTo="/" />
          <p>© 2026 OneCite. Tüm hakları saklıdır.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/makaleler" className="hover:text-foreground">Makaleler</Link>
            <Link to="/hakkimizda" className="hover:text-foreground">Hakkımızda</Link>
            <Link to="/sunum" className="hover:text-foreground">Sunum</Link>
            <Link to="/fiyatlandirma" className="hover:text-foreground">Fiyatlandırma</Link>
            <Link to="/privacy" className="hover:text-foreground">Gizlilik</Link>
            <Link to="/kvkk" className="hover:text-foreground">KVKK</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
