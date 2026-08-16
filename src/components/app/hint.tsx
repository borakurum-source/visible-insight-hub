import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Panel genelinde kullanılan "?" bilgi balonu. Kısa, günlük dille açıklama verir.
export function Hint({
  title,
  children,
  side = "top",
}: {
  title?: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title ? `${title} hakkında bilgi` : "Bilgi"}
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} align="start" className="w-72 text-xs leading-relaxed">
        {title ? <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p> : null}
        <div className="space-y-1.5 text-muted-foreground [&_strong]:text-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
