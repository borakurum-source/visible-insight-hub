import { createFileRoute } from "@tanstack/react-router";
import { Waypoints } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockGraphEdges, mockGraphNodes, type MockGraphNode } from "@/lib/panel-mock/graph";

export const Route = createFileRoute("/app/graph")({
  head: () => ({
    meta: [
      { title: "Bilgi Grafiği — OneCite Paneli" },
      { name: "description", content: "Markanız, hizmetleriniz, rakipleriniz ve konular arasındaki ilişki haritasını görüntüleyin." },
      { property: "og:title", content: "Bilgi Grafiği — OneCite Paneli" },
      { property: "og:description", content: "Marka varlıkları arasındaki ilişki haritası." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GraphPage,
});

const NODE_COLORS: Record<MockGraphNode["type"], string> = {
  marka: "#f59e0b",
  hizmet: "#3b82f6",
  lokasyon: "#22c55e",
  rakip: "#ef4444",
  konu: "#a855f7",
};

const NODE_TYPE_LABEL: Record<MockGraphNode["type"], string> = {
  marka: "Marka",
  hizmet: "Hizmet",
  lokasyon: "Lokasyon",
  rakip: "Rakip",
  konu: "Konu",
};

function GraphPage() {
  const nodeById = new Map(mockGraphNodes.map((n) => [n.id, n]));

  return (
    <>
      <PanelPageHeading
        meta={{ title: "Bilgi Grafiği", description: "Markanız, hizmetleriniz, rakipleriniz ve konular arasındaki ilişki haritası.", icon: Waypoints }}
      />

      <Card>
        <CardHeader className="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">İlişki Haritası</CardTitle>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {(Object.keys(NODE_TYPE_LABEL) as MockGraphNode["type"][]).map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[t] }} />
                {NODE_TYPE_LABEL[t]}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {mockGraphNodes.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: NODE_COLORS[n.type], color: NODE_COLORS[n.type] }}
              >
                {n.label}
              </span>
            ))}
          </div>
          <div className="space-y-1.5 border-t border-border pt-4">
            {mockGraphEdges.map((e, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{nodeById.get(e.source)?.label}</span>
                {" "}— {e.relation} →{" "}
                <span className="font-medium text-foreground">{nodeById.get(e.target)?.label}</span>
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
