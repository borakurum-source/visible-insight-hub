import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/site/hero-visual";
import BrandLogo from "@/components/site/BrandLogo";

type VisualHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  image: string;
  imageAlt: string;
  visualLabel?: string;
  visualCaption?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  proof?: { value: string; label: string }[];
  note?: string;
  children?: ReactNode;
};

export function VisualHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  visualLabel = "EVIDENCE LAYER",
  visualCaption = "Görünmek ile kaynak olarak seçilmek aynı şey değil.",
  primaryHref = "/ucretsiz-yapay-zeka-gorunurluk-raporu",
  primaryLabel = "Ücretsiz ölçüm başlat",
  secondaryHref,
  secondaryLabel,
  proof,
  note,
  children,
}: VisualHeroProps) {
  return (
    <section className="visual-hero-surface relative isolate overflow-hidden border-b border-white/10 text-white">
      <div className="visual-hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 top-24 -z-10 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" aria-hidden="true" />
      <div className="marketing-container grid min-w-0 items-center gap-12 py-16 md:py-20 lg:grid-cols-[minmax(0,1.04fr)_minmax(400px,.96fr)] lg:gap-14 lg:py-24">
        <div>
          <BrandLogo variant="horizontal" tone="dark" size="sm" linkTo="/" className="mb-8 opacity-95" />
          <div className="flex items-center gap-3">
            <span className="visual-source-label text-cyan">{eyebrow}</span>
            <span className="h-px w-10 bg-cyan/70" />
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.03] tracking-[-0.05em] md:text-5xl lg:text-[60px]">{title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-cyan text-foreground hover:bg-[#B8F4FF]">
              <Link to={primaryHref}>
                {primaryLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            {secondaryHref && secondaryLabel ? (
              <Button asChild variant="outline" className="border-white/20 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white">
                {secondaryHref.startsWith("#") ? <a href={secondaryHref}>{secondaryLabel}</a> : <Link to={secondaryHref}>{secondaryLabel}</Link>}
              </Button>
            ) : null}
          </div>
          {proof?.length ? (
            <dl className="mt-8 grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/15 bg-white/10">
              {proof.map((item) => (
                <div key={item.label} className="bg-ink/70 px-4 py-4">
                  <dt className="font-mono text-xl font-medium text-white md:text-2xl">{item.value}</dt>
                  <dd className="mt-1 text-[11px] leading-4 text-slate-400">{item.label}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {note ? <p className="mt-4 text-[11px] text-slate-500">{note}</p> : null}
          {children ? <div className="mt-7">{children}</div> : null}
        </div>
        <div className="flex items-center">
          <HeroVisual
            image={image}
            imageAlt={imageAlt}
            label={visualLabel}
            caption={visualCaption}
            priority
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
