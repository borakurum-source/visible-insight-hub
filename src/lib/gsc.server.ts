// Google Search Console istemcisi: her marka kendi Google hesabini baglar (yalniz sunucu tarafi).
import { getBrandAccessToken } from "./google-oauth.server";

const API = "https://searchconsole.googleapis.com";

export type SiteEntry = { siteUrl: string; permissionLevel?: string };

async function headers(brandId: string) {
  const token = await getBrandAccessToken(brandId);
  return { Authorization: `Bearer ${token}` } as Record<string, string>;
}

export function coversTarget(siteUrl: string, host: string) {
  const target = host.toLowerCase().replace(/^www\./, "");
  if (siteUrl.startsWith("sc-domain:")) {
    const domain = siteUrl.slice("sc-domain:".length).toLowerCase();
    return target === domain || target.endsWith(`.${domain}`);
  }
  try {
    const prefixHost = new URL(siteUrl).hostname.toLowerCase().replace(/^www\./, "");
    return prefixHost === target;
  } catch {
    return false;
  }
}

export async function listVerifiedSites(brandId: string): Promise<SiteEntry[]> {
  const response = await fetch(`${API}/webmasters/v3/sites`, { headers: await headers(brandId) });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Search Console mülkleri okunamadı [${response.status}]: ${body}`);
  }
  const json = (await response.json()) as { siteEntry?: SiteEntry[] };
  return (json.siteEntry ?? []).filter((entry) => entry.permissionLevel !== "siteUnverifiedUser");
}

export async function searchAnalyticsQuery(brandId: string, siteUrl: string, query: Record<string, unknown>) {
  const response = await fetch(
    `${API}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { ...(await headers(brandId)), "Content-Type": "application/json" },
      body: JSON.stringify(query),
    },
  );
  if (response.status === 403) throw new Error("Bağlı Google hesabı bu mülke erişemiyor");
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Search Console sorgusu başarısız [${response.status}]: ${body}`);
  }
  return (await response.json()) as { rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }> };
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

// Son 28 tam günün sorgu ve günlük kırılımını tek anlık görüntüde toplar.
export async function buildGscSnapshot(brandId: string, siteUrl: string) {
  const startDate = isoDaysAgo(30);
  const endDate = isoDaysAgo(2);
  const [byQuery, byDate, byPage] = await Promise.all([
    searchAnalyticsQuery(brandId, siteUrl, { startDate, endDate, dimensions: ["query"], rowLimit: 50 }),
    searchAnalyticsQuery(brandId, siteUrl, { startDate, endDate, dimensions: ["date"], rowLimit: 60 }),
    searchAnalyticsQuery(brandId, siteUrl, { startDate, endDate, dimensions: ["page"], rowLimit: 50 }),
  ]);

  const queries = (byQuery.rows ?? []).map((row) => ({
    query: row.keys?.[0] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: Number((row.position ?? 0).toFixed(1)),
  }));
  const daily = (byDate.rows ?? []).map((row) => ({
    date: row.keys?.[0] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
  }));
  const pages = (byPage.rows ?? []).map((row) => ({
    page: row.keys?.[0] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: Number((row.position ?? 0).toFixed(1)),
  }));

  return {
    siteUrl,
    startDate,
    endDate,
    totals: {
      clicks: queries.reduce((sum, q) => sum + q.clicks, 0),
      impressions: queries.reduce((sum, q) => sum + q.impressions, 0),
    },
    queries,
    daily,
    pages,
  };
}