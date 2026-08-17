// Google Analytics 4 istemcisi: her marka kendi Google hesabini baglar (yalniz sunucu tarafi).
import { getBrandAccessToken } from "./google-oauth.server";

const ADMIN_API = "https://analyticsadmin.googleapis.com";
const DATA_API = "https://analyticsdata.googleapis.com";

export type Ga4Property = { propertyId: string; displayName: string; account: string };

async function headers(brandId: string) {
  const token = await getBrandAccessToken(brandId);
  return { Authorization: `Bearer ${token}` } as Record<string, string>;
}

// Bağlı Google hesabındaki tüm GA4 mülklerini listeler.
export async function listGa4Properties(brandId: string): Promise<Ga4Property[]> {
  const response = await fetch(`${ADMIN_API}/v1beta/accountSummaries?pageSize=200`, {
    headers: await headers(brandId),
  });
  if (!response.ok) {
    throw new Error(`GA4 mülkleri okunamadı [${response.status}]: ${await response.text()}`);
  }
  const json = (await response.json()) as {
    accountSummaries?: Array<{
      displayName?: string;
      propertySummaries?: Array<{ property?: string; displayName?: string }>;
    }>;
  };
  const out: Ga4Property[] = [];
  for (const account of json.accountSummaries ?? []) {
    for (const property of account.propertySummaries ?? []) {
      const raw = property.property ?? "";
      const propertyId = raw.replace(/^properties\//, "");
      if (!propertyId) continue;
      out.push({
        propertyId,
        displayName: property.displayName ?? propertyId,
        account: account.displayName ?? "",
      });
    }
  }
  return out;
}

async function runReport(brandId: string, propertyId: string, body: Record<string, unknown>) {
  const response = await fetch(`${DATA_API}/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`, {
    method: "POST",
    headers: { ...(await headers(brandId)), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status === 403) throw new Error("Bağlı Google hesabı bu GA4 mülküne erişemiyor");
  if (!response.ok) throw new Error(`GA4 raporu başarısız [${response.status}]: ${await response.text()}`);
  return (await response.json()) as {
    rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }>;
  };
}

function num(value?: string) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(raw: string) {
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
}

// Yapay zeka asistanlarindan gelen referans trafigini tanimlayan kaynak eslesmeleri.
const AI_PLATFORMS: Array<{ label: string; match: RegExp }> = [
  { label: "ChatGPT", match: /chatgpt|openai|oai\.|chat\.com/i },
  { label: "Perplexity", match: /perplexity/i },
  { label: "Gemini / Google AI", match: /gemini|bard|aistudio|google_ai|googleai/i },
  { label: "Claude", match: /claude|anthropic/i },
  { label: "Microsoft Copilot", match: /copilot|bing\.com\/chat|edgeservices/i },
  { label: "Grok", match: /grok|x\.ai/i },
  { label: "DeepSeek", match: /deepseek/i },
  { label: "Meta AI", match: /meta\.ai/i },
  { label: "You.com", match: /you\.com/i },
  { label: "Diğer AI", match: /mistral|poe\.com|phind|kagi|arc\.net|brave.*(ai|leo)/i },
];

function aiPlatformFor(source: string) {
  return AI_PLATFORMS.find((platform) => platform.match.test(source))?.label ?? null;
}

// Son 28 günün oturum / kullanıcı kırılımını ve kanal dağılımını tek anlık görüntüde toplar.
export async function buildGa4Snapshot(brandId: string, propertyId: string) {
  const dateRanges = [{ startDate: "28daysAgo", endDate: "yesterday" }];
  const [byDate, byChannel, bySource] = await Promise.all([
    runReport(brandId, propertyId, {
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      limit: 60,
    }),
    runReport(brandId, propertyId, {
      dateRanges,
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      limit: 20,
    }),
    // Kaynak/araci kirilimi: yapay zeka asistanlarindan gelen trafigi ayirmak icin.
    runReport(brandId, propertyId, {
      dateRanges,
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      limit: 300,
    }),
  ]);

  const daily = (byDate.rows ?? [])
    .map((row) => ({
      date: formatDate(row.dimensionValues?.[0]?.value ?? ""),
      sessions: num(row.metricValues?.[0]?.value),
      users: num(row.metricValues?.[1]?.value),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const channels = (byChannel.rows ?? [])
    .map((row) => ({
      channel: row.dimensionValues?.[0]?.value ?? "Diğer",
      sessions: num(row.metricValues?.[0]?.value),
      users: num(row.metricValues?.[1]?.value),
    }))
    .sort((a, b) => b.sessions - a.sessions);

  // Ham kaynaklari yapay zeka platformlarina eslestirip topluyoruz.
  const aiBuckets = new Map<string, { platform: string; sessions: number; users: number; sources: Set<string> }>();
  let aiSessions = 0;
  let aiUsers = 0;
  for (const row of bySource.rows ?? []) {
    const source = row.dimensionValues?.[0]?.value ?? "";
    const medium = row.dimensionValues?.[1]?.value ?? "";
    const platform = aiPlatformFor(`${source} ${medium}`);
    if (!platform) continue;
    const sessions = num(row.metricValues?.[0]?.value);
    const users = num(row.metricValues?.[1]?.value);
    aiSessions += sessions;
    aiUsers += users;
    const bucket = aiBuckets.get(platform) ?? { platform, sessions: 0, users: 0, sources: new Set<string>() };
    bucket.sessions += sessions;
    bucket.users += users;
    if (source) bucket.sources.add(source);
    aiBuckets.set(platform, bucket);
  }
  const aiPlatforms = [...aiBuckets.values()]
    .map((bucket) => ({
      platform: bucket.platform,
      sessions: bucket.sessions,
      users: bucket.users,
      sources: [...bucket.sources].slice(0, 5),
    }))
    .sort((a, b) => b.sessions - a.sessions);

  return {
    propertyId,
    startDate: daily[0]?.date ?? "",
    endDate: daily[daily.length - 1]?.date ?? "",
    totals: {
      sessions: daily.reduce((sum, row) => sum + row.sessions, 0),
      users: daily.reduce((sum, row) => sum + row.users, 0),
    },
    daily,
    channels,
    ai: {
      sessions: aiSessions,
      users: aiUsers,
      platforms: aiPlatforms,
    },
  };
}
