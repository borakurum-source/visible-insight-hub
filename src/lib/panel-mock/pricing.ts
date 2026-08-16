export const mockPlans = [
  { id: "free", name: "Ücretsiz", price: "$0", clients: 1, prompts: 5, competitors: 1, content: 0, highlight: false, contactOnly: false },
  { id: "starter", name: "Başlangıç", price: "$49/ay", clients: 1, prompts: 15, competitors: 2, content: 3, highlight: false, contactOnly: false },
  { id: "growth", name: "Büyüme", price: "$149/ay", clients: 3, prompts: 45, competitors: 5, content: 10, highlight: true, contactOnly: false },
  { id: "agency", name: "Ajans", price: "Teklife göre", clients: 0, prompts: 0, competitors: 0, content: 0, highlight: false, contactOnly: true },
];

export const mockUsage = {
  plan: "Büyüme",
  planLabel: "Büyüme Planı",
  limits: { maxClients: 3, maxPromptsPerClient: 45, maxCompetitorsPerClient: 5 },
  usage: { clients: 2, prompts: 38, competitors: 4 },
};
