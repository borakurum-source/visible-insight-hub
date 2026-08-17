import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/site/BrandLogo";

type VisualHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  /** Geriye donuk uyumluluk icin korunuyor; merkezi hero duzeninde gorsel render edilmez. */
  image?: string;
  imageAlt?: string;
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
      <div className="hero-ambient-glow" aria-hidden="true" />
      <div className="marketing-container relative flex min-w-0 flex-col items-center py-16 text-center md:py-20 lg:py-24">
        <div className="flex w-full max-w-4xl flex-col items-center">
          <BrandLogo variant="horizontal" tone="dark" size="sm" linkTo="/" className="mb-8 opacity-95" />
          <div className="flex items-center gap-3">
            <span className="visual-source-label text-cyan">{eyebrow}</span>
            <span className="h-px w-10 bg-cyan/70" />
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] md:text-5xl lg:text-[58px]">{title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">{description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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
            <dl className="mt-12 grid w-full grid-cols-3 gap-4 border-t border-white/10 pt-8 text-center sm:gap-8">
              {proof.map((item) => (
                <div key={item.label} className="min-w-0">
                  <dt className="font-mono text-lg font-bold text-white sm:text-2xl md:text-3xl">{item.value}</dt>
                  <dd className="mx-auto mt-1.5 max-w-[16ch] text-[10px] uppercase tracking-wider leading-4 text-slate-400 sm:text-[11px]">
                    {item.label}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {note ? <p className="mt-6 text-center text-[11px] text-slate-500">{note}</p> : null}
          {children ? <div className="mt-8 w-full">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
