import { Reveal } from "@/components/site/marketing-motion";

type HeroVisualProps = {
  image: string;
  imageAlt: string;
  /** Sol üstteki etiket, ör. "EVIDENCE LAYER" */
  label?: string;
  /** Alt satırdaki kısa açıklama */
  caption?: string;
  /** Sağ alt köşedeki teknik not */
  meta?: string;
  priority?: boolean;
  className?: string;
};

/**
 * Tüm sayfalarda aynı oran, aynı çerçeve, aynı hareket:
 * hero görselleri için tek standart.
 */
export function HeroVisual({
  image,
  imageAlt,
  label = "EVIDENCE LAYER",
  caption,
  meta = "AI CITATION INTELLIGENCE",
  priority = false,
  className,
}: HeroVisualProps) {
  return (
    <Reveal className={`relative ${className ?? ""}`.trim()} delay={0.06}>
      <div className="visual-panel-shadow relative aspect-[16/11] w-full overflow-hidden rounded-[28px] border border-white/15 bg-ink">
        <img
          src={image}
          alt={imageAlt}
          className="hero-visual-media absolute inset-0 h-full w-full object-cover"
          width="2560"
          height="1440"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
        />
        <div className="hero-visual-scan z-10" aria-hidden="true" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-ink/70 via-ink/10 to-ink/25" aria-hidden="true" />
        <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-ink/70 px-3 py-1.5 backdrop-blur">
          <span className="hero-visual-dot h-1.5 w-1.5 rounded-full bg-cyan" />
          <span className="visual-source-label text-slate-300">{label}</span>
        </div>
        <div className="absolute inset-x-5 bottom-5 z-20 flex items-end justify-between gap-4">
          <p className="max-w-[22rem] text-sm font-semibold leading-5 text-white">{caption}</p>
          <span className="font-mono text-[10px] uppercase text-slate-400">{meta}</span>
        </div>
      </div>
    </Reveal>
  );
}
