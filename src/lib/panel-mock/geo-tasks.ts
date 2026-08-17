export interface MockGeoTask {
  id: number;
  title: string;
  column: "backlog" | "devam" | "inceleme" | "tamamlandı";
  priority: "yüksek" | "orta" | "düşük";
  assignee: string;
  dueDate: string;
}

export const mockGeoTasks: MockGeoTask[] = [
  { id: 1, title: "Fiyatlandırma sayfasına SSS ekle", column: "backlog", priority: "orta", assignee: "Elif A.", dueDate: "18 Tem" },
  { id: 2, title: "Ürün karşılaştırma içeriğini yayınla", column: "devam", priority: "yüksek", assignee: "Mert K.", dueDate: "15 Tem" },
  { id: 3, title: "Bilgi bankasında eski PDF'i güncelle", column: "inceleme", priority: "düşük", assignee: "Elif A.", dueDate: "20 Tem" },
  { id: 4, title: "GEO nedir makalesini yayınla", column: "tamamlandı", priority: "yüksek", assignee: "Mert K.", dueDate: "10 Tem" },
];

export const GEO_TASK_COLUMNS: { id: MockGeoTask["column"]; label: string }[] = [
  { id: "backlog", label: "Bekleyen" },
  { id: "devam", label: "Devam Ediyor" },
  { id: "inceleme", label: "İncelemede" },
  { id: "tamamlandı", label: "Tamamlandı" },
];
