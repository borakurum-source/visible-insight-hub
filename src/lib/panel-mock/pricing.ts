export const mockPlans = [
  { id: "starter", name: "Başlangıç", price: "$29/ay", clients: 1, prompts: 30, highlight: false },
  { id: "growth", name: "Büyüme", price: "$79/ay", clients: 5, prompts: 100, highlight: true },
  { id: "agency", name: "Ajans", price: "$199/ay", clients: 999, prompts: 999, highlight: false },
];

export const mockUsage = {
  plan: "Büyüme",
  planLabel: "Büyüme Planı",
  limits: { maxClients: 5, maxPromptsPerClient: 100, maxCompetitorsPerClient: 15 },
  usage: { clients: 2, prompts: 128, competitors: 6 },
};
