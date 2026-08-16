export const mockPlans = [
  { id: "starter", name: "Başlangıç", price: "₺1.490/ay", clients: 1, prompts: 40, highlight: false },
  { id: "pro", name: "Pro", price: "₺3.990/ay", clients: 3, prompts: 150, highlight: true },
  { id: "enterprise", name: "Kurumsal", price: "Özel fiyat", clients: 10, prompts: 500, highlight: false },
];

export const mockUsage = {
  plan: "Pro",
  planLabel: "Pro Plan",
  limits: { maxClients: 3, maxPromptsPerClient: 150, maxCompetitorsPerClient: 10 },
  usage: { clients: 2, prompts: 128, competitors: 6 },
};
