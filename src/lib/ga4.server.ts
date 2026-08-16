// Google Analytics 4 konnektör gateway istemcisi (yalnız sunucu tarafı).
const GATEWAY = "https://connector-gateway.lovable.dev/google_analytics";

export type Ga4Property = { propertyId: string; displayName: string; account: string };

function headers() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_ANALYTICS_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error("Google Analytics bağlantısı henüz yapılandırılmamış. Ayarlar → Entegrasyonlar üzerinden Google hesabınızı bağlayın.");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
  } as Record<string, string>;
}

export function isGa4Configured() {
  return Boolean(process.env["LOVABLE_API_KEY"] && process.env["GOOGLE_ANALYTICS_API_KEY"]);
}

// Bağlı Google hesabındaki tüm GA4 mülklerini listeler.
export async function listGa4Properties(): Promise<Ga4Property[]> {
  // Konnektör henüz projeye bağlı değilse hata fırlatmak yerine boş liste döndür;
  // arayüz kullanıcıyı bağlantı akışına yönlendirir.
  if (!isGa4Configured()) return [];
  const response = await fetch(`${GATEWAY}/v1beta/accountSummaries?pageSize=200`, { headers: headers() });
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

async function runReport(propertyId: string, body: Record<string, unknown>) {
  const response = await fetch(`${GATEWAY}/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
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

// Son 28 günün oturum / kullanıcı kırılımını ve kanal dağılımını tek anlık görüntüde toplar.
export async function buildGa4Snapshot(propertyId: string) {
  const dateRanges = [{ startDate: "28daysAgo", endDate: "yesterday" }];
  const [byDate, byChannel] = await Promise.all([
    runReport(propertyId, {
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      limit: 60,
    }),
    runReport(propertyId, {
      dateRanges,
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      limit: 20,
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
  };
}
