import { useEffect, useMemo, useState } from "react";

type EngineRotatorProps = { engines?: string[]; className?: string };

export function EngineRotator({
  engines = ["ChatGPT", "Perplexity", "Gemini", "Google AI Özetleri"],
  className,
}: EngineRotatorProps) {
  const [index, setIndex] = useState(0);
  const engine = engines[index] ?? engines[0];

  useEffect(() => {
    if (engines.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % engines.length), 2800);
    return () => window.clearInterval(timer);
  }, [engines.length]);

  return (
    <span className={className} aria-label={`Desteklenen yapay zeka yüzeyleri: ${engines.join(", ")}`}>
      <span className="inline-block transition-opacity duration-200">{engine}</span>
    </span>
  );
}

export function CitationPathTrace({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 440 92" fill="none" className="h-auto w-full">
        <path d="M52 46H174C204 46 205 17 234 17H388" stroke="rgba(53,225,255,0.24)" strokeWidth="1.5" strokeDasharray="4 5" />
        <path d="M52 46H174C204 46 205 17 234 17H388" stroke="#3FBFB2" strokeWidth="2" strokeLinecap="round" />
        {[
          { cx: 52, cy: 46, fill: "#3FBFB2" },
          { cx: 220, cy: 20, fill: "#1B7F86" },
          { cx: 388, cy: 17, fill: "#FFFFFF" },
        ].map((node) => (
          <circle key={node.cx} cx={node.cx} cy={node.cy} r="5" fill={node.fill} />
        ))}
      </svg>
    </div>
  );
}

type MetricRiseProps = { value: number; prefix?: string; suffix?: string; className?: string };

export function MetricRise({ value, prefix = "", suffix = "", className }: MetricRiseProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const target = useMemo(() => Math.max(0, value), [value]);

  useEffect(() => {
    let frame = 0;
    let start = 0;
    const duration = 680;
    const tick = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  return (
    <span className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
