// Bu proje artık genel pazarlama düzenini MarketingShell üzerinden sağlıyor.
// Geriye dönük uyumluluk için bırakıldı; yeni sayfalar MarketingShell kullanmalı.
import { Link } from "@tanstack/react-router";
import BrandLogo from "@/components/site/BrandLogo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <BrandLogo variant="horizontal" size="sm" linkTo="/" />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Giriş</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/app">Panele git</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
