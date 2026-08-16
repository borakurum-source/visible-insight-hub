import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = { children: ReactNode; className?: string; delay?: number };

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.42s cubic-bezier(0.23,1,0.32,1) ${delay}s, transform 0.42s cubic-bezier(0.23,1,0.32,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export function MotionPress({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block transition-transform duration-150 ease-out active:scale-[0.975] hover:-translate-y-px ${className ?? ""}`.trim()}
    >
      {children}
    </span>
  );
}

export function MotionValue({ value, className, ariaLabel }: { value: string | number; className?: string; ariaLabel?: string }) {
  return (
    <span key={String(value)} className={className} aria-label={ariaLabel}>
      {value}
    </span>
  );
}

export function AnimatedBar({ value, className, label }: { value: number; className?: string; label?: string }) {
  const [width, setWidth] = useState(0);
  const safeValue = Math.max(0, Math.min(100, value));
  useEffect(() => {
    const timer = window.setTimeout(() => setWidth(safeValue), 60);
    return () => window.clearTimeout(timer);
  }, [safeValue]);
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-[#EAF0FF]"
      role={label ? "progressbar" : undefined}
      aria-label={label}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-valuenow={label ? safeValue : undefined}
    >
      <div
        className={className}
        style={{ width: `${width}%`, height: "100%", transition: "width 0.56s cubic-bezier(0.23,1,0.32,1)" }}
      />
    </div>
  );
}
