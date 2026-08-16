export interface MockGraphNode {
  id: string;
  label: string;
  type: "marka" | "hizmet" | "rakip" | "konu" | "lokasyon";
}
export interface MockGraphEdge {
  source: string;
  target: string;
  relation: string;
}

export const mockGraphNodes: MockGraphNode[] = [
  { id: "brand", label: "OneCite", type: "marka" },
  { id: "svc1", label: "AI Görünürlük Ölçümü", type: "hizmet" },
  { id: "svc2", label: "Bilgi Bankası Yönetimi", type: "hizmet" },
  { id: "comp1", label: "RivalAI", type: "rakip" },
  { id: "comp2", label: "Insightly", type: "rakip" },
  { id: "topic1", label: "GEO", type: "konu" },
  { id: "loc1", label: "İstanbul", type: "lokasyon" },
];

export const mockGraphEdges: MockGraphEdge[] = [
  { source: "brand", target: "svc1", relation: "sunar" },
  { source: "brand", target: "svc2", relation: "sunar" },
  { source: "brand", target: "topic1", relation: "ilişkili" },
  { source: "brand", target: "loc1", relation: "merkezli" },
  { source: "comp1", target: "svc1", relation: "rakip sunuyor" },
  { source: "comp2", target: "svc1", relation: "rakip sunuyor" },
];
