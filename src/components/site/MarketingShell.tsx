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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1020]">
      <header className="sticky top-0 z-50 border-b border-[#E6EAF2] bg-white/95 backdrop-blur">
        <div className="marketing-container flex h-16 items-center justify-between">
          <BrandLogo variant="horizontal" size="sm" linkTo="/" />
          <nav className="hidden items-center gap-4 text-[13px] font-semibold text-[#667085] xl:flex" aria-label="Pazarlama navigasyonu">
            {marketingLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="whitespace-nowrap transition-colors hover:text-[#0B1020] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#356AFF] focus-visible:ring-offset-2"
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
              className="rounded-md p-2 text-[#0B1020] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#356AFF]"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Menüyü aç"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="border-t border-[#E6EAF2] bg-white px-4 py-4 md:hidden" aria-label="Mobil pazarlama navigasyonu">
            <div className="space-y-1">
              {marketingLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#0B1020] hover:bg-[#F7F9FC]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/app"
                onClick={() => setMobileOpen(false)}
                className="mt-2 block w-full rounded-lg border border-[#E6EAF2] px-3 py-2.5 text-left text-sm font-semibold text-[#0B1020]"
              >
                Giriş yap
              </Link>
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t border-[#E6EAF2] bg-white">
        <div className="marketing-container flex flex-col items-center justify-between gap-5 py-9 text-sm text-[#667085] md:flex-row">
          <BrandLogo variant="horizontal" size="sm" linkTo="/" />
          <p>© 2026 OneCite. Tüm hakları saklıdır.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/makaleler" className="hover:text-[#0B1020]">Makaleler</Link>
            <Link to="/hakkimizda" className="hover:text-[#0B1020]">Hakkımızda</Link>
            <Link to="/sunum" className="hover:text-[#0B1020]">Sunum</Link>
            <Link to="/fiyatlandirma" className="hover:text-[#0B1020]">Fiyatlandırma</Link>
            <Link to="/privacy" className="hover:text-[#0B1020]">Gizlilik</Link>
            <Link to="/kvkk" className="hover:text-[#0B1020]">KVKK</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
