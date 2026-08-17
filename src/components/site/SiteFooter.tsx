import { Link } from "@tanstack/react-router";
import { openConsentPreferences } from "@/lib/consent";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold">OneCite</p>
          <p className="mt-1 text-sm text-muted-foreground">AI yanıtlarında alıntılanma ölçümü ve optimizasyonu.</p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link to="/platform" className="hover:text-foreground">Platform</Link>
          <Link to="/fiyatlandirma" className="hover:text-foreground">Fiyatlandırma</Link>
          <Link to="/app" className="hover:text-foreground">Panel</Link>
          <Link to="/data-processing" className="hover:text-foreground">Veri İşleme</Link>
          <Link to="/privacy" className="hover:text-foreground">Gizlilik</Link>
          <button type="button" onClick={() => openConsentPreferences()} className="hover:text-foreground">
            Çerez tercihleri
          </button>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-6 font-mono text-xs text-muted-foreground">© 2026 OneCite</p>
    </footer>
  );
}
