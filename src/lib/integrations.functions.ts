import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type IntegrationRow = {
  provider: string;
  status: string;
  property_id: string | null;
  last_sync_at: string | null;
  last_error: string | null;
};

// Markanın entegrasyon durumları + en güncel GSC anlık görüntüsü.
export const getIntegrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const [{ data: connections }, { data: snapshot }, { data: ga4Snap }] = await Promise.all([
      context.supabase
        .from("integration_connections")
        .select("provider, status, property_id, last_sync_at, last_error")
        .eq("brand_id", data.brandId),
      context.supabase
        .from("analytics_snapshots")
        .select("provider, snapshot_date, payload")
        .eq("brand_id", data.brandId)
        .eq("provider", "gsc")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from("analytics_snapshots")
        .select("provider, snapshot_date, payload")
        .eq("brand_id", data.brandId)
        .eq("provider", "ga4")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    return {
      connections: (connections ?? []) as IntegrationRow[],
      ga4Snapshot: (ga4Snap?.payload ?? null) as null | {
        propertyId: string;
        startDate: string;
        endDate: string;
        totals: { sessions: number; users: number };
        daily: Array<{ date: string; sessions: number; users: number }>;
        channels: Array<{ channel: string; sessions: number; users: number }>;
      },
      gscSnapshot: (snapshot?.payload ?? null) as null | {
        siteUrl: string;
        startDate: string;
        endDate: string;
        totals: { clicks: number; impressions: number };
        queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
        daily: Array<{ date: string; clicks: number; impressions: number }>;
      },
      gscSnapshotDate: snapshot?.snapshot_date ?? null,
    };
  });

// Markanın alan adını kapsayan doğrulanmış GSC mülklerini listeler (varsayılan seçim yok).
export const listGscProperties = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { listVerifiedSites, coversTarget } = await import("./gsc.server");
    const { data: brand } = await context.supabase
      .from("brands").select("domain").eq("id", data.brandId).single();
    if (!brand) throw new Error("Marka bulunamadı");
    const sites = await listVerifiedSites(data.brandId);
    const matching = sites.filter((s) => coversTarget(s.siteUrl, brand.domain)).map((s) => s.siteUrl);
    return { domain: brand.domain, matching, all: sites.map((s) => s.siteUrl) };
  });

// Seçilen mülkü kaydeder ve ilk anlık görüntüyü hemen çeker.
export const connectGscProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; siteUrl: string }) => input)
  .handler(async ({ data, context }) => {
    const { listVerifiedSites } = await import("./gsc.server");
    const sites = await listVerifiedSites(data.brandId);
    if (!sites.some((s) => s.siteUrl === data.siteUrl)) {
      throw new Error("Seçilen mülk doğrulanmış listede yok");
    }
    const { error } = await context.supabase
      .from("integration_connections")
      .upsert(
        {
          brand_id: data.brandId,
          provider: "gsc",
          status: "bağlı",
          property_id: data.siteUrl,
          last_error: null,
        },
        { onConflict: "brand_id,provider" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Search Console verisini tazeler ve günlük anlık görüntü olarak saklar.
export const syncGsc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { buildGscSnapshot, listVerifiedSites } = await import("./gsc.server");
    const { data: connection } = await context.supabase
      .from("integration_connections")
      .select("property_id")
      .eq("brand_id", data.brandId)
      .eq("provider", "gsc")
      .maybeSingle();
    const siteUrl = connection?.property_id;
    if (!siteUrl) throw new Error("Önce bir Search Console mülkü seçin");

    try {
      const sites = await listVerifiedSites(data.brandId);
      if (!sites.some((s) => s.siteUrl === siteUrl)) throw new Error("Mülk artık doğrulanmış değil");
      const payload = await buildGscSnapshot(data.brandId, siteUrl);
      await context.supabase.from("analytics_snapshots").upsert(
        {
          brand_id: data.brandId,
          provider: "gsc",
          snapshot_date: new Date().toISOString().slice(0, 10),
          payload,
        },
        { onConflict: "brand_id,provider,snapshot_date" },
      );
      await context.supabase
        .from("integration_connections")
        .update({ status: "bağlı", last_sync_at: new Date().toISOString(), last_error: null })
        .eq("brand_id", data.brandId)
        .eq("provider", "gsc");
      return { ok: true, queries: payload.queries.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await context.supabase
        .from("integration_connections")
        .update({ status: "hata", last_error: message })
        .eq("brand_id", data.brandId)
        .eq("provider", "gsc");
      throw new Error(message);
    }
  });

export const disconnectIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; provider: string }) => input)
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("integration_connections")
      .delete()
      .eq("brand_id", data.brandId)
      .eq("provider", data.provider);
    return { ok: true };
  });

// Bağlı Google hesabındaki GA4 mülklerini listeler.
export const listGa4PropertyOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data }) => {
    const { listGa4Properties } = await import("./ga4.server");
    return await listGa4Properties(data.brandId);
  });

// Seçilen GA4 mülkünü kaydeder.
export const connectGa4Property = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; propertyId: string }) => input)
  .handler(async ({ data, context }) => {
    const { listGa4Properties } = await import("./ga4.server");
    const properties = await listGa4Properties(data.brandId);
    if (!properties.some((p) => p.propertyId === data.propertyId)) {
      throw new Error("Seçilen GA4 mülkü hesabınızda bulunamadı");
    }
    const { error } = await context.supabase.from("integration_connections").upsert(
      {
        brand_id: data.brandId,
        provider: "ga4",
        status: "bağlı",
        property_id: data.propertyId,
        last_error: null,
      },
      { onConflict: "brand_id,provider" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// GA4 trafik verisini tazeler ve günlük anlık görüntü olarak saklar.
export const syncGa4 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { buildGa4Snapshot } = await import("./ga4.server");
    const { data: connection } = await context.supabase
      .from("integration_connections")
      .select("property_id")
      .eq("brand_id", data.brandId)
      .eq("provider", "ga4")
      .maybeSingle();
    const propertyId = connection?.property_id;
    if (!propertyId) throw new Error("Önce bir GA4 mülkü seçin");

    try {
      const payload = await buildGa4Snapshot(data.brandId, propertyId);
      await context.supabase.from("analytics_snapshots").upsert(
        {
          brand_id: data.brandId,
          provider: "ga4",
          snapshot_date: new Date().toISOString().slice(0, 10),
          payload,
        },
        { onConflict: "brand_id,provider,snapshot_date" },
      );
      await context.supabase
        .from("integration_connections")
        .update({ status: "bağlı", last_sync_at: new Date().toISOString(), last_error: null })
        .eq("brand_id", data.brandId)
        .eq("provider", "ga4");
      return { ok: true, sessions: payload.totals.sessions };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await context.supabase
        .from("integration_connections")
        .update({ status: "hata", last_error: message })
        .eq("brand_id", data.brandId)
        .eq("provider", "ga4");
      throw new Error(message);
    }
  });

export type TrafficOverview = {
  rangeDays: number;
  gsc: {
    connected: boolean;
    status: string | null;
    property: string | null;
    lastSyncAt: string | null;
    startDate: string | null;
    endDate: string | null;
    totals: { clicks: number; impressions: number };
    daily: Array<{ date: string; clicks: number; impressions: number }>;
    queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
    pages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  };
  ga4: {
    connected: boolean;
    property: string | null;
    lastSyncAt: string | null;
    totals: { sessions: number; users: number };
    daily: Array<{ date: string; sessions: number; users: number }>;
    channels: Array<{ channel: string; sessions: number; users: number }>;
    ai: {
      sessions: number;
      users: number;
      share: number;
      platforms: Array<{ platform: string; sessions: number; users: number; sources: string[] }>;
      pages: Array<{ label: string; sessions: number; platforms: string[] }>;
      campaigns: Array<{ label: string; sessions: number; platforms: string[] }>;
    };
  };
  aiReferral: {
    total: number;
    ownDomain: number;
    daily: Array<{ date: string; citations: number }>;
  };
  aiOverview: {
    total: number;
    mentioned: number;
    rate: number;
    daily: Array<{ date: string; mentioned: number; total: number }>;
  };
  bing: BingOverview;
};

export type BingOverview = {
  connected: boolean;
  site: string | null;
  lastSyncAt: string | null;
  startDate: string | null;
  endDate: string | null;
  totals: { clicks: number; impressions: number };
  daily: Array<{ date: string; clicks: number; impressions: number }>;
  queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  ai: {
    available: boolean;
    reason: string | null;
    totals: { clicks: number; impressions: number };
    daily: Array<{ date: string; clicks: number; impressions: number }>;
  };
};

// Komuta merkezi için GSC anlık görüntüsü + yapay zeka atıf/görünürlük trafiği.
export const getTrafficOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; days?: number }) => input)
  .handler(async ({ data, context }): Promise<TrafficOverview> => {
    // Tarih aralığı filtresi: 7 / 30 / 90 gün.
    const rangeDays = [7, 30, 90].includes(data.days ?? 30) ? (data.days ?? 30) : 30;
    const since = new Date(Date.now() - rangeDays * 86400000).toISOString();
    const [{ data: connections }, { data: snapshot }, { data: ga4Snapshot }, { data: bingSnapshot }, { data: citations }, { data: runs }] = await Promise.all([
      context.supabase
        .from("integration_connections")
        .select("provider, status, property_id, last_sync_at")
        .eq("brand_id", data.brandId),
      context.supabase
        .from("analytics_snapshots")
        .select("payload")
        .eq("brand_id", data.brandId)
        .eq("provider", "gsc")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from("analytics_snapshots")
        .select("payload")
        .eq("brand_id", data.brandId)
        .eq("provider", "ga4")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from("analytics_snapshots")
        .select("payload")
        .eq("brand_id", data.brandId)
        .eq("provider", "bing")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from("citations")
        .select("created_at, is_own_domain")
        .eq("brand_id", data.brandId)
        .gte("created_at", since)
        .limit(2000),
      context.supabase
        .from("prompt_runs")
        .select("created_at, brand_mentioned")
        .eq("brand_id", data.brandId)
        .gte("created_at", since)
        .limit(2000),
    ]);

    const gscConnection = (connections ?? []).find((c) => c.provider === "gsc") ?? null;
    const ga4Connection = (connections ?? []).find((c) => c.provider === "ga4") ?? null;
    const bingConnection = (connections ?? []).find((c) => c.provider === "bing") ?? null;
    const bingPayload = (bingSnapshot?.payload ?? null) as null | {
      siteUrl: string;
      totals: { clicks: number; impressions: number };
      daily: Array<{ date: string; clicks: number; impressions: number }>;
      queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
    };
    const ga4Payload = (ga4Snapshot?.payload ?? null) as null | {
      totals: { sessions: number; users: number };
      daily: Array<{ date: string; sessions: number; users: number }>;
      channels: Array<{ channel: string; sessions: number; users: number }>;
      ai?: {
        sessions: number;
        users: number;
        platforms: Array<{ platform: string; sessions: number; users: number; sources?: string[] }>;
      };
    };
    const payload = (snapshot?.payload ?? null) as null | {
      startDate: string;
      endDate: string;
      totals: { clicks: number; impressions: number };
      daily: Array<{ date: string; clicks: number; impressions: number }>;
      queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
    };

    const days = Array.from({ length: rangeDays }, (_, index) =>
      new Date(Date.now() - (rangeDays - 1 - index) * 86400000).toISOString().slice(0, 10),
    );
    const citationRows = citations ?? [];
    const runRows = runs ?? [];

    const aiReferralDaily = days.map((date) => ({
      date,
      citations: citationRows.filter((c) => (c.created_at ?? "").slice(0, 10) === date).length,
    }));
    const aiOverviewDaily = days.map((date) => {
      const dayRuns = runRows.filter((r) => (r.created_at ?? "").slice(0, 10) === date);
      return { date, total: dayRuns.length, mentioned: dayRuns.filter((r) => r.brand_mentioned).length };
    });
    const mentioned = runRows.filter((r) => r.brand_mentioned).length;

    // Anlık görüntüler 28-30 günlük seri tutar; seçilen aralığa göre kırpıyoruz.
    const rangeStart = days[0] ?? "";
    const gscDaily = (payload?.daily ?? []).filter((row) => row.date >= rangeStart);
    const gscTotals = gscDaily.reduce(
      (acc, row) => ({ clicks: acc.clicks + row.clicks, impressions: acc.impressions + row.impressions }),
      { clicks: 0, impressions: 0 },
    );
    const ga4Daily = (ga4Payload?.daily ?? []).filter((row) => row.date >= rangeStart);
    const ga4Totals = ga4Daily.reduce(
      (acc, row) => ({ sessions: acc.sessions + row.sessions, users: Math.max(acc.users, row.users) }),
      { sessions: 0, users: 0 },
    );

    // GA4 anlik goruntusu 28 gunluk toplamdir; AI kirilimi de ayni pencereyi kullanir.
    const ga4AiSessions = ga4Payload?.ai?.sessions ?? 0;
    const ga4SnapshotSessions = ga4Payload?.totals?.sessions ?? 0;

    return {
      rangeDays,
      gsc: {
        connected: gscConnection?.status === "bağlı",
        status: gscConnection?.status ?? null,
        property: gscConnection?.property_id ?? null,
        lastSyncAt: gscConnection?.last_sync_at ?? null,
        startDate: gscDaily[0]?.date ?? payload?.startDate ?? null,
        endDate: gscDaily[gscDaily.length - 1]?.date ?? payload?.endDate ?? null,
        totals: gscTotals,
        daily: gscDaily,
        queries: (payload?.queries ?? []).slice(0, 10),
      },
      ga4: {
        connected: ga4Connection?.status === "bağlı",
        property: ga4Connection?.property_id ?? null,
        lastSyncAt: ga4Connection?.last_sync_at ?? null,
        totals: ga4Totals,
        daily: ga4Daily,
        channels: (ga4Payload?.channels ?? []).slice(0, 6),
        ai: {
          sessions: ga4AiSessions,
          users: ga4Payload?.ai?.users ?? 0,
          share: ga4SnapshotSessions ? Math.round((ga4AiSessions / ga4SnapshotSessions) * 1000) / 10 : 0,
          platforms: (ga4Payload?.ai?.platforms ?? []).slice(0, 8).map((row) => ({
            platform: row.platform,
            sessions: row.sessions,
            users: row.users,
            sources: row.sources ?? [],
          })),
        },
      },
      aiReferral: {
        total: citationRows.length,
        ownDomain: citationRows.filter((c) => c.is_own_domain).length,
        daily: aiReferralDaily,
      },
      aiOverview: {
        total: runRows.length,
        mentioned,
        rate: runRows.length ? Math.round((mentioned / runRows.length) * 100) : 0,
        daily: aiOverviewDaily,
      },
      bing: (() => {
        const bingDaily = (bingPayload?.daily ?? []).filter((row) => row.date >= rangeStart);
        return {
          connected: bingConnection?.status === "bağlı",
          site: bingConnection?.property_id ?? null,
          lastSyncAt: bingConnection?.last_sync_at ?? null,
          totals: bingDaily.reduce(
            (acc, row) => ({ clicks: acc.clicks + row.clicks, impressions: acc.impressions + row.impressions }),
            { clicks: 0, impressions: 0 },
          ),
          daily: bingDaily,
          queries: (bingPayload?.queries ?? []).slice(0, 10),
        };
      })(),
    };
  });

// --- Musteri bazli Google hesabı bağlantısı ---

export const getGoogleAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: member } = await context.supabase
      .from("brands").select("id").eq("id", data.brandId).maybeSingle();
    if (!member) throw new Error("Marka bulunamadı");
    const { hasGoogleAccount, isGoogleOAuthConfigured, redirectUri } = await import("./google-oauth.server");
    const account = await hasGoogleAccount(data.brandId);
    return { ...account, configured: isGoogleOAuthConfigured(), redirectUri: redirectUri("") };
  });

// Kullanicinin kendi Google hesabini baglamasi için izin adresini uretir.
export const startGoogleConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; origin: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: brand } = await context.supabase
      .from("brands").select("id").eq("id", data.brandId).maybeSingle();
    if (!brand) throw new Error("Marka bulunamadı");
    const { buildAuthorizeUrl, encodeState } = await import("./google-oauth.server");
    const state = encodeState({ brandId: data.brandId, userId: context.userId });
    return { url: buildAuthorizeUrl(state, data.origin) };
  });

export const disconnectGoogleAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: brand } = await context.supabase
      .from("brands").select("id").eq("id", data.brandId).maybeSingle();
    if (!brand) throw new Error("Marka bulunamadı");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("google_oauth_accounts").delete().eq("brand_id", data.brandId);
    await context.supabase
      .from("integration_connections")
      .delete()
      .eq("brand_id", data.brandId)
      .in("provider", ["gsc", "ga4"]);
    return { ok: true };
  });

// --- Bing Webmaster Tools (marka bazli API anahtari) ---

export const getBingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: brand } = await context.supabase
      .from("brands").select("id").eq("id", data.brandId).maybeSingle();
    if (!brand) throw new Error("Marka bulunamadı");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: account } = await supabaseAdmin
      .from("bing_webmaster_accounts").select("brand_id").eq("brand_id", data.brandId).maybeSingle();
    const { data: snapshot } = await context.supabase
      .from("analytics_snapshots")
      .select("payload, snapshot_date")
      .eq("brand_id", data.brandId)
      .eq("provider", "bing")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    return {
      hasKey: !!account,
      snapshot: (snapshot?.payload ?? null) as null | {
        siteUrl: string;
        startDate: string;
        endDate: string;
        totals: { clicks: number; impressions: number };
        daily: Array<{ date: string; clicks: number; impressions: number }>;
        queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
      },
    };
  });

// API anahtarini dogrular ve marka icin saklar; dogrulanmis site listesini doner.
export const saveBingApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; apiKey: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: brand } = await context.supabase
      .from("brands").select("id").eq("id", data.brandId).maybeSingle();
    if (!brand) throw new Error("Marka bulunamadı");
    const apiKey = data.apiKey.trim();
    if (apiKey.length < 8) throw new Error("Geçerli bir Bing Webmaster API anahtarı girin");
    const { listBingSites } = await import("./bing.server");
    const sites = await listBingSites(apiKey);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("bing_webmaster_accounts")
      .upsert({ brand_id: data.brandId, api_key: apiKey, updated_at: new Date().toISOString() }, { onConflict: "brand_id" });
    if (error) throw new Error(error.message);
    return { sites };
  });

export const listBingSiteOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: brand } = await context.supabase
      .from("brands").select("id").eq("id", data.brandId).maybeSingle();
    if (!brand) throw new Error("Marka bulunamadı");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getBrandBingKey, listBingSites } = await import("./bing.server");
    const apiKey = await getBrandBingKey(supabaseAdmin, data.brandId);
    return { sites: await listBingSites(apiKey) };
  });

export const connectBingSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; siteUrl: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getBrandBingKey, listBingSites } = await import("./bing.server");
    const apiKey = await getBrandBingKey(supabaseAdmin, data.brandId);
    const sites = await listBingSites(apiKey);
    if (!sites.includes(data.siteUrl)) throw new Error("Seçilen site Bing hesabınızda doğrulanmış değil");
    const { error } = await context.supabase.from("integration_connections").upsert(
      { brand_id: data.brandId, provider: "bing", status: "bağlı", property_id: data.siteUrl, last_error: null },
      { onConflict: "brand_id,provider" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const syncBing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: connection } = await context.supabase
      .from("integration_connections")
      .select("property_id")
      .eq("brand_id", data.brandId)
      .eq("provider", "bing")
      .maybeSingle();
    const siteUrl = connection?.property_id;
    if (!siteUrl) throw new Error("Önce bir Bing sitesi seçin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getBrandBingKey, buildBingSnapshot } = await import("./bing.server");
    try {
      const apiKey = await getBrandBingKey(supabaseAdmin, data.brandId);
      const payload = await buildBingSnapshot(apiKey, siteUrl);
      await context.supabase.from("analytics_snapshots").upsert(
        { brand_id: data.brandId, provider: "bing", snapshot_date: new Date().toISOString().slice(0, 10), payload },
        { onConflict: "brand_id,provider,snapshot_date" },
      );
      await context.supabase
        .from("integration_connections")
        .update({ status: "bağlı", last_sync_at: new Date().toISOString(), last_error: null })
        .eq("brand_id", data.brandId)
        .eq("provider", "bing");
      return { ok: true, clicks: payload.totals.clicks, queries: payload.queries.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await context.supabase
        .from("integration_connections")
        .update({ status: "hata", last_error: message })
        .eq("brand_id", data.brandId)
        .eq("provider", "bing");
      throw new Error(message);
    }
  });

export const disconnectBing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: brand } = await context.supabase
      .from("brands").select("id").eq("id", data.brandId).maybeSingle();
    if (!brand) throw new Error("Marka bulunamadı");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("bing_webmaster_accounts").delete().eq("brand_id", data.brandId);
    await context.supabase
      .from("integration_connections")
      .delete()
      .eq("brand_id", data.brandId)
      .eq("provider", "bing");
    return { ok: true };
  });
