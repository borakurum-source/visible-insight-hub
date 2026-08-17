import { CLIENT_LOGOS } from "@/lib/clientLogos";
import { cn } from "@/lib/utils";

type Tone = "dark" | "light";

function LogoImg({ name, src, tone, className }: { name: string; src: string; tone: Tone; className?: string }) {
  return (
    <img
      src={src}
      alt={`${name} logosu`}
      loading="lazy"
      decoding="async"
      className={cn(
        "h-full w-auto max-w-full object-contain",
        tone === "dark" ? "opacity-60 invert" : "opacity-70",
        className,
      )}
    />
  );
}

/** Hero altinda yavasca kayan kompakt logo seridi. */
export function ClientLogoStrip({ title = "Bizi tercih eden markalar" }: { title?: string }) {
  return (
    <section className="border-b border-white/10 bg-ink py-8" data-testid="client-logo-strip">
      <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <div className="logo-marquee group relative overflow-hidden">
        <div className="logo-marquee-track flex w-max items-center gap-12 px-6 group-hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-12" aria-hidden={copy === 1 ? true : undefined}>
              {CLIENT_LOGOS.map((logo) => (
                <span key={`${copy}-${logo.name}`} className="flex h-8 shrink-0 items-center md:h-9">
                  <LogoImg name={logo.name} src={logo.src} tone="dark" />
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ink to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink to-transparent" aria-hidden="true" />
      </div>
    </section>
  );
}

/** Referans bolumunde tam logo duvari. */
export function ClientLogoWall() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-5" data-testid="client-logo-wall">
      {CLIENT_LOGOS.map((logo) => (
        <div key={logo.name} className="flex h-24 items-center justify-center bg-background p-5 transition-opacity hover:opacity-100">
          <LogoImg name={logo.name} src={logo.src} tone="light" className="max-h-12" />
        </div>
      ))}
    </div>
  );
}
