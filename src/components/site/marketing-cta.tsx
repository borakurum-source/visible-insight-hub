import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type MarketingCtaProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function MarketingCta({
  eyebrow = "SIGNAL → EVIDENCE → ACTION",
  title,
  description,
  primaryHref = "/ucretsiz-yapay-zeka-gorunurluk-raporu",
  primaryLabel = "Ücretsiz ölçümünü başlat",
  secondaryHref = "/fiyatlandirma",
  secondaryLabel = "Planları karşılaştır",
}: MarketingCtaProps) {
  return (
    <section className="border-t border-border bg-ink px-4 py-16 text-white md:px-6 md:py-24">
      <div className="marketing-container">
        <div className="grid items-end gap-8 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="editorial-eyebrow text-cyan">{eyebrow}</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-[-0.04em] md:text-5xl">{title}</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">{description}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button asChild size="lg" className="bg-cyan text-foreground hover:bg-cyan/85">
              <Link to={primaryHref}>
                {primaryLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white">
              <Link to={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
