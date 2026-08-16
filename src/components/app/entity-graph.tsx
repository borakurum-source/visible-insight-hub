// Marka varlıklarının radyal düğüm-bağlantı haritası (SVG).
export type GraphEntity = { key: string; label: string; entity_type: string; weight: number };
export type GraphEdge = { source_key: string; target_key: string; relation: string };

const TYPE_TOKEN: Record<string, string> = {
  marka: "var(--primary)",
  hizmet: "var(--chart-1)",
  kitle: "var(--chart-2)",
  rakip: "var(--destructive)",
  konu: "var(--chart-4)",
};

export function EntityGraph({ entities, edges }: { entities: GraphEntity[]; edges: GraphEdge[] }) {
  const center = entities.find((e) => e.entity_type === "marka") ?? entities[0];
  if (!center) return null;
  const others = entities.filter((e) => e.key !== center.key);
  const w = 720;
  const h = 460;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) / 2 - 70;

  const positions = new Map<string, { x: number; y: number }>();
  positions.set(center.key, { x: cx, y: cy });
  others.forEach((entity, index) => {
    const angle = (index / Math.max(others.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const ring = entity.entity_type === "rakip" ? radius : radius * 0.78;
    positions.set(entity.key, { x: cx + Math.cos(angle) * ring, y: cy + Math.sin(angle) * ring * 0.86 });
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[460px] w-full rounded-lg border border-border bg-muted/30" role="img" aria-label="Marka varlık ilişki haritası">
      {edges.map((edge, index) => {
        const a = positions.get(edge.source_key);
        const b = positions.get(edge.target_key);
        if (!a || !b) return null;
        return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border)" strokeWidth={1.2} />;
      })}
      {entities.map((entity) => {
        const pos = positions.get(entity.key);
        if (!pos) return null;
        const color = TYPE_TOKEN[entity.entity_type] ?? "var(--muted-foreground)";
        const r = entity.entity_type === "marka" ? 34 : 8 + entity.weight * 3;
        return (
          <g key={entity.key}>
            <circle cx={pos.x} cy={pos.y} r={r} fill={color} fillOpacity={entity.entity_type === "marka" ? 0.18 : 0.14} stroke={color} strokeWidth={1.5} />
            <text
              x={pos.x}
              y={pos.y + r + 14}
              textAnchor="middle"
              className="fill-foreground text-[11px]"
              style={{ fontWeight: entity.entity_type === "marka" ? 700 : 500 }}
            >
              {entity.label.length > 22 ? `${entity.label.slice(0, 21)}…` : entity.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
