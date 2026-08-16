export const mockAdminOrgs = [
  { id: 1, name: "OneCite Demo Workspace", plan: "Pro", clients: 2, members: 4, status: "aktif" as const },
  { id: 2, name: "Nova Yazılım Ajansı", plan: "Kurumsal", clients: 8, members: 12, status: "aktif" as const },
  { id: 3, name: "Deneme Hesabı", plan: "Ücretsiz", clients: 1, members: 1, status: "askida" as const },
];

export const mockAdminUsage = { totalOrgs: 3, totalClients: 11, totalRunsToday: 214 };
