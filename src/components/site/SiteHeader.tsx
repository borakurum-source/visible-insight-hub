import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Quote } from "lucide-react";

const nav = [
  { to: "/", label: "Ana Sayfa" },
  { to: "/urun", label: "Ürün" },
  { to: "/fiyatlandirma", label: "Fiyatlandırma" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Quote className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">1cite</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-foreground" }}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/app">Giriş</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/app">Panele git</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}