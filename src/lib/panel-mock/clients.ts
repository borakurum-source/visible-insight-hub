// Mock brand/domain data for the panel. In a later phase this will be
// replaced by Supabase queries (clients + brand_domains tables).
export interface MockBrand {
  id: number;
  name: string;
  domain: string;
}

export interface MockDomain {
  id: number;
  clientId: number;
  domain: string;
  isPrimary: boolean;
  status: "active" | "archived";
  targetMarkets: string[];
  primaryLanguage: string;
}

export const mockBrands: MockBrand[] = [
  { id: 1, name: "OneCite", domain: "onecite.com" },
  { id: 2, name: "Nova Yazılım", domain: "novayazilim.com" },
];

export const mockDomains: MockDomain[] = [
  { id: 1, clientId: 1, domain: "onecite.com", isPrimary: true, status: "active", targetMarkets: ["TR"], primaryLanguage: "tr" },
  { id: 2, clientId: 1, domain: "onecite.com/en", isPrimary: false, status: "active", targetMarkets: ["US", "GB"], primaryLanguage: "en" },
  { id: 3, clientId: 2, domain: "novayazilim.com", isPrimary: true, status: "active", targetMarkets: ["TR"], primaryLanguage: "tr" },
];

export const activeBrand = mockBrands[0]!;
export const activeDomains = mockDomains.filter((d) => d.clientId === activeBrand.id);

export const demoUser = {
  name: "Elif Aydın",
  email: "elif@onecite.com",
  initials: "EA",
  role: "Workspace sahibi",
};
