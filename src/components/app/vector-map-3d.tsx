import { useEffect, useRef, useState } from "react";

export type VectorPoint = {
  id: string;
  x: number;
  y: number;
  z: number;
  type: string;
  weight: number;
  freshness: number;
  excerpt: string;
  sourceTitle: string;
  sourceUrl: string | null;
};

export const TYPE_COLORS: Record<string, [number, number, number]> = {
  url: [56, 189, 248],
  manual: [168, 85, 247],
  sss: [34, 197, 94],
  pdf: [249, 115, 22],
  sitemap: [96, 165, 250],
};

function colorFor(type: string): [number, number, number] {
  return TYPE_COLORS[type] ?? [148, 163, 184];
}

export default function VectorMap3D({
  points,
  selectedId,
  onSelect,
}: {
  points: VectorPoint[];
  selectedId: string | null;
  onSelect: (point: VectorPoint | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ yaw: 0.6, pitch: 0.25, autoRotate: true, dragging: false, lastX: 0, lastY: 0, zoom: 1 });
  const projectedRef = useRef<Array<{ point: VectorPoint; sx: number; sy: number; r: number }>>([]);
  const [hovered, setHovered] = useState<VectorPoint | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(selectedId);
  selectedRef.current = selectedId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const render = () => {
      const state = stateRef.current;
      if (state.autoRotate && !state.dragging) state.yaw += 0.0022;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const scale = (Math.min(w, h) / 260) * state.zoom;
      const cosY = Math.cos(state.yaw);
      const sinY = Math.sin(state.yaw);
      const cosP = Math.cos(state.pitch);
      const sinP = Math.sin(state.pitch);

      const projected = points.map((point) => {
        const x1 = point.x * cosY - point.z * sinY;
        const z1 = point.x * sinY + point.z * cosY;
        const y1 = point.y * cosP - z1 * sinP;
        const z2 = point.y * sinP + z1 * cosP;
        const depth = 420 / (420 + z2 * scale * 0.9);
        return {
          point,
          sx: cx + x1 * scale * depth,
          sy: cy + y1 * scale * depth,
          r: Math.max(1.6, (1.8 + point.weight * 1.6) * depth),
          depth,
          z: z2,
        };
      });
      projected.sort((a, b) => b.z - a.z);
      projectedRef.current = projected.map(({ point, sx, sy, r }) => ({ point, sx, sy, r }));

      // yakın komşu bağlantıları — nöral ağ hissi
      ctx.lineWidth = 0.6;
      for (let i = 0; i < projected.length; i += 1) {
        const a = projected[i]!;
        for (let j = i + 1; j < Math.min(projected.length, i + 7); j += 1) {
          const b = projected[j]!;
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const dist = Math.hypot(dx, dy);
          if (dist > 62) continue;
          const [r, g, bl] = colorFor(a.point.type);
          ctx.strokeStyle = `rgba(${r},${g},${bl},${(1 - dist / 62) * 0.16})`;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }

      for (const item of projected) {
        const [r, g, b] = colorFor(item.point.type);
        const alpha = Math.max(0.18, Math.min(1, item.depth * (0.35 + item.point.freshness * 0.65)));
        const active = item.point.id === selectedRef.current || item.point.id === hoveredRef.current;
        const glow = ctx.createRadialGradient(item.sx, item.sy, 0, item.sx, item.sy, item.r * (active ? 6 : 4));
        glow.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.55})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(item.sx, item.sy, item.r * (active ? 6 : 4), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = active ? "rgba(255,255,255,0.95)" : `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath();
        ctx.arc(item.sx, item.sy, active ? item.r * 1.6 : item.r, 0, Math.PI * 2);
        ctx.fill();
      }

      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [points]);

  const pick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    let best: { point: VectorPoint; dist: number } | null = null;
    for (const item of projectedRef.current) {
      const dist = Math.hypot(item.sx - mx, item.sy - my);
      if (dist < Math.max(9, item.r * 2.4) && (!best || dist < best.dist)) best = { point: item.point, dist };
    }
    return best?.point ?? null;
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="h-[440px] w-full cursor-grab touch-none rounded-lg border border-border bg-muted/30 active:cursor-grabbing"
        onMouseDown={(event) => {
          const state = stateRef.current;
          state.dragging = true;
          state.lastX = event.clientX;
          state.lastY = event.clientY;
        }}
        onMouseUp={() => { stateRef.current.dragging = false; }}
        onMouseLeave={() => { stateRef.current.dragging = false; hoveredRef.current = null; setHovered(null); }}
        onMouseMove={(event) => {
          const state = stateRef.current;
          if (state.dragging) {
            state.yaw += (event.clientX - state.lastX) * 0.006;
            state.pitch = Math.max(-1.3, Math.min(1.3, state.pitch + (event.clientY - state.lastY) * 0.006));
            state.lastX = event.clientX;
            state.lastY = event.clientY;
            return;
          }
          const next = pick(event);
          hoveredRef.current = next?.id ?? null;
          setHovered(next);
        }}
        onClick={(event) => onSelect(pick(event))}
        onWheel={(event) => {
          const state = stateRef.current;
          state.zoom = Math.max(0.5, Math.min(3, state.zoom - event.deltaY * 0.0012));
        }}
      />
      {hovered ? (
        <div className="pointer-events-none absolute left-3 top-3 max-w-xs rounded-md border border-border bg-background/95 p-2 text-xs shadow-lg">
          <p className="font-medium">{hovered.sourceTitle}</p>
          <p className="line-clamp-3 text-muted-foreground">{hovered.excerpt}</p>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => { stateRef.current.autoRotate = !stateRef.current.autoRotate; }}
        className="absolute bottom-3 right-3 rounded-full border border-border bg-background/90 px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground"
      >
        Döndürmeyi aç/kapat
      </button>
    </div>
  );
}
