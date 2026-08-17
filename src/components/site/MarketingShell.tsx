import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/site/BrandLogo";

const primaryLinks = [
  { href: "/ozellikler", label: "Ürün" },
  { href: "/solutions/agencies", label: "Çözümler" },
  { href: "/fiyatlandirma", label: "Fiyatlandırma" },
  { href: "/makaleler", label: "Kaynaklar" },
];

const solutionsMenu = [
  { href: "/solutions/agencies", label: "Ajanslar için", desc: "Birden fazla markayı tek panelden yönetin." },
  { href: "/proof/filmfolk", label: "FilmFolk vakası", desc: "Atıf payı %30,7 → %58,9." },
];

const footerGroups = [
  {
    title: "Ürün",
    links: [
      { href: "/ozellikler", label: "Özellikler ve çalışma modeli" },
      { href: "/platform/citation-share", label: "Atıf Payı" },
      { href: "/platform/evidence-gaps", label: "Eksik Kanıtlar" },
      { href: "/ucretsiz-yapay-zeka-gorunurluk-raporu", label: "Ücretsiz rapor" },
    ],
  },
  {
    title: "Çözümler",
    links: [
      { href: "/solutions/agencies", label: "Ajanslar" },
      { href: "/proof/filmfolk", label: "FilmFolk vakası" },
      { href: "/fiyatlandirma", label: "Planlar" },
      { href: "/sunum", label: "Sunum" },
    ],
  },
  {
    title: "Şirket",
    links: [
      { href: "/hakkimizda", label: "Hakkımızda" },
      { href: "/makaleler", label: "Makaleler" },
      { href: "/auth", label: "Giriş yap" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { href: "/privacy", label: "Gizlilik" },
      { href: "/kvkk", label: "KVKK" },
      { href: "/terms", label: "Kullanım Koşulları" },
      { href: "/refund-policy", label: "İade Politikası" },
    ],
  },
];

export function MarketingShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-cyan/30">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="marketing-container flex h-16 items-center justify-between">
          <BrandLogo variant="horizontal" size="sm" linkTo="/" />
          <nav className="hidden items-center gap-7 text-[13px] font-medium tracking-[-0.01em] text-muted-foreground lg:flex" aria-label="Pazarlama navigasyonu">
            {primaryLinks.map((link) =>
              link.label === "Çözümler" ? (
                <div key={link.href} className="group relative">
                  <Link
                    to={link.href}
                    className="inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {link.label}
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <div className="invisible absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="rounded-xl border border-border bg-background p-2 shadow-lg">
                      {solutionsMenu.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="block rounded-lg px-3 py-2.5 hover:bg-secondary"
                        >
                          <span className="block text-[13px] font-semibold text-foreground">{item.label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{item.desc}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                key={link.href}
                to={link.href}
                className="whitespace-nowrap transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {link.label}
                </Link>
              ),
            )}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild>
              <Link to="/auth">Giriş yap</Link>
            </Button>
            <Button asChild>
              <Link to="/ucretsiz-yapay-zeka-gorunurluk-raporu">
                Ücretsiz ölçüm <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <Button size="sm" asChild>
              <Link to="/ucretsiz-yapay-zeka-gorunurluk-raporu">Ölç</Link>
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
              {primaryLinks.map((link) => (
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
        <div className="marketing-container py-14">
          <div className="grid gap-10 md:grid-cols-[1.2fr_repeat(4,minmax(0,.7fr))]">
            <div>
              <BrandLogo variant="horizontal" size="sm" linkTo="/" />
              <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
                Yapay zeka cevaplarında atıf payınızı ölçün, eksik kanıtı görün ve doğru içeriği önce üretin.
              </p>
            </div>
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="editorial-eyebrow text-muted-foreground">{group.title}</p>
                <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link to={link.href} className="transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>© 2026 OneCite. Tüm hakları saklıdır.</p>
            <p className="font-mono">AI CITATION INTELLIGENCE</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
