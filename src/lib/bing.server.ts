// Bing Webmaster Tools istemcisi: her marka kendi API anahtarini baglar (yalniz sunucu tarafi).
// Anahtar Bing Webmaster Tools > Settings > API Access > API Key ekranindan alinir.
const API = "https://ssl.bing.com/webmaster/api.svc/json";

type Sb = { from: (table: string) => any };

// Bing tarih formati: "/Date(1614556800000)/"
function bingDate(raw: unknown): string {
  const match = typeof raw === "string" ? raw.match(/\/Date\((-?\d+)/) : null;
  if (match) return new Date(Number(match[1])).toISOString().slice(0, 10);
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return "";
}

function num(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function call<T>(apiKey: string, method: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams({ ...params, apikey: apiKey });
  const response = await fetch(`${API}/${method}?${query.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  const body = await response.text();
  if (response.status === 401 || response.status === 403) {
    throw new Error("Bing API anahtari gecersiz veya bu siteye erisim yetkisi yok");
  }
  if (!response.ok) throw new Error(`Bing Webmaster istegi basarisiz [${response.status}]: ${body.slice(0, 300)}`);
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error("Bing Webmaster yaniti okunamadi");
  }
}

// Marka bazli API anahtarini okur (servis rolu ile; anahtar istemciye asla donmez).
export async function getBrandBingKey(admin: Sb, brandId: string): Promise<string> {
  const { data } = await admin.from("bing_webmaster_accounts").select("api_key").eq("brand_id", brandId).maybeSingle();
  const key = data?.api_key as string | undefined;
  if (!key) throw new Error("Once Bing Webmaster API anahtarinizi kaydedin");
  return key;
}

export async function listBingSites(apiKey: string): Promise<string[]> {
  const json = await call<{ d?: Array<{ Url?: string }> }>(apiKey, "GetUserSites");
  return (json.d ?? []).map((row) => row.Url ?? "").filter(Boolean);
}

// Son ~30 gunun gunluk trafigi + en iyi sorgular tek anlik goruntude toplanir.
export async function buildBingSnapshot(apiKey: string, siteUrl: string) {
  const [traffic, queries, ai] = await Promise.all([
    call<{ d?: Array<Record<string, unknown>> }>(apiKey, "GetRankAndTrafficStats", { siteUrl }),
    call<{ d?: Array<Record<string, unknown>> }>(apiKey, "GetQueryStats", { siteUrl }),
    fetchBingAiPerformance(apiKey, siteUrl),
  ]);

  const daily = (traffic.d ?? [])
    .map((row) => ({
      date: bingDate(row["Date"]),
      clicks: num(row["Clicks"]),
      impressions: num(row["Impressions"]),
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  const topQueries = (queries.d ?? [])
    .map((row) => {
      const clicks = num(row["Clicks"]);
      const impressions = num(row["Impressions"]);
      return {
        query: String(row["Query"] ?? ""),
        clicks,
        impressions,
        ctr: impressions ? clicks / impressions : 0,
        position: Number(num(row["AvgImpressionPosition"] ?? row["AvgClickPosition"]).toFixed(1)),
      };
    })
    .filter((row) => row.query)
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, 50);

  return {
    siteUrl,
    startDate: daily[0]?.date ?? "",
    endDate: daily[daily.length - 1]?.date ?? "",
    totals: {
      clicks: daily.reduce((sum, row) => sum + row.clicks, 0),
      impressions: daily.reduce((sum, row) => sum + row.impressions, 0),
    },
    daily,
    queries: topQueries,
    ai,
  };
}

// Bing Webmaster Tools "AI Performance" (Copilot ve is ortaklarindan gelen atif/tiklama)
// verisi tum hesaplarda ve tum API surumlerinde acik degil. Bilinen uc nokta adaylarini
// sirayla deniyoruz; hicbiri yoksa nedenini kullaniciya gostermek uzere geri donuyoruz.
const AI_METHODS = ["GetAIPerformanceStats", "GetCopilotStats", "GetAITrafficStats"] as const;

export async function fetchBingAiPerformance(apiKey: string, siteUrl: string): Promise<{
  available: boolean;
  reason: string | null;
  totals: { clicks: number; impressions: number };
  daily: Array<{ date: string; clicks: number; impressions: number }>;
}> {
  const empty = { totals: { clicks: 0, impressions: 0 }, daily: [] as Array<{ date: string; clicks: number; impressions: number }> };
  let lastReason = "Bing hesabinizda AI Performance API verisi bulunamadi";
  for (const method of AI_METHODS) {
    try {
      const json = await call<{ d?: Array<Record<string, unknown>> }>(apiKey, method, { siteUrl });
      const daily = (json.d ?? [])
        .map((row) => ({
          date: bingDate(row["Date"]),
          clicks: num(row["Clicks"] ?? row["AIClicks"]),
          impressions: num(row["Impressions"] ?? row["AIImpressions"] ?? row["Citations"]),
        }))
        .filter((row) => row.date)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);
      if (!daily.length) {
        lastReason = "Bing AI Performance verisi bu site icin henuz uretilmedi";
        continue;
      }
      return {
        available: true,
        reason: null,
        totals: {
          clicks: daily.reduce((sum, row) => sum + row.clicks, 0),
          impressions: daily.reduce((sum, row) => sum + row.impressions, 0),
        },
        daily,
      };
    } catch (error) {
      lastReason = error instanceof Error ? error.message : "Bing AI Performance verisi alinamadi";
    }
  }
  return { available: false, reason: lastReason, ...empty };
}
