import { useState } from "react";
import { FeatureShot } from "@/components/site/feature-shot";
import { cn } from "@/lib/utils";

export type ProductTab = {
  id: string;
  label: string;
  headline: string;
  body: string;
  highlight: string;
  shot: string;
  alt: string;
};

/**
 * Ana sayfada urunu tek cerceve icinde gosteren sekmeli panel.
 * Her sekmede tek bir vurgu rozeti bulunur; kullaniciya nereye bakacagi soylenir.
 */
export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];
  if (!current) return null;

  return (
    <div>
      <div role="tablist" aria-label="Urun ekranlari" className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === current.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-7 grid items-center gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-12">
        <div>
          <h3 className="text-2xl font-extrabold tracking-[-0.03em] text-foreground md:text-3xl">{current.headline}</h3>
          <p className="mt-4 max-w-prose text-base leading-7 text-muted-foreground">{current.body}</p>
        </div>
        <div className="relative">
          <FeatureShot src={current.shot} alt={current.alt} />
          <span className="pointer-events-none absolute right-6 top-10 rounded-full border border-primary/40 bg-background/95 px-3 py-1.5 text-[11px] font-bold text-primary shadow-lg backdrop-blur md:right-10 md:top-14">
            {current.highlight}
          </span>
        </div>
      </div>
    </div>
  );
}
