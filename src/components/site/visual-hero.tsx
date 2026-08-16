import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/marketing-motion";
import BrandLogo from "@/components/site/BrandLogo";

type VisualHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  image: string;
  imageAlt: string;
  visualLabel?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  children?: ReactNode;
};

export function VisualHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  visualLabel = "EVIDENCE LAYER",
  primaryHref = "/free-ai-readiness-report",
  primaryLabel = "Ücretsiz ölçüm başlat",
  secondaryHref,
  secondaryLabel,
  children,
}: VisualHeroProps) {
  return (
    <section className="visual-hero-surface relative isolate overflow-hidden border-b border-[#26302E] text-white">
      <div className="visual-hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
      <div className="marketing-container grid items-center gap-10 py-16 md:py-24 lg:grid-cols-[minmax(0,.95fr)_minmax(420px,1.05fr)] lg:gap-16 lg:py-24">
        <div>
          <BrandLogo variant="horizontal" tone="dark" size="sm" linkTo="/" className="mb-8 opacity-95" />
          <p className="visual-source-label text-[#3FBFB2]">{eyebrow}</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.04] tracking-[-0.05em] md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-[#3FBFB2] text-[#101211] hover:bg-[#B8F4FF]">
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
          {children ? <div className="mt-7">{children}</div> : null}
        </div>
        <Reveal className="relative" delay={0.06}>
          <div className="visual-panel-shadow relative overflow-hidden rounded-[28px] border border-white/15 bg-[#101211]">
            <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-[#101211]/70 px-3 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3FBFB2] shadow-[0_0_12px_#3FBFB2]" />
              <span className="visual-source-label text-slate-300">{visualLabel}</span>
            </div>
            <img src={image} alt={imageAlt} className="block h-auto w-full" width="2560" height="1440" loading="eager" />
            <div className="absolute inset-x-5 bottom-5 z-20 flex items-end justify-between gap-4">
              <span className="visual-source-label text-[#3FBFB2]">ONECITE / VISUAL PROOF</span>
              <span className="font-mono text-[10px] text-slate-400">AI CITATION INTELLIGENCE</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
