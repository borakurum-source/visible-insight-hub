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
    const [{ data: connections }, { data: snapshot }] = await Promise.all([
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
    ]);
    return {
      connections: (connections ?? []) as IntegrationRow[],
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
    const sites = await listVerifiedSites();
    const matching = sites.filter((s) => coversTarget(s.siteUrl, brand.domain)).map((s) => s.siteUrl);
    return { domain: brand.domain, matching, all: sites.map((s) => s.siteUrl) };
  });

// Seçilen mülkü kaydeder ve ilk anlık görüntüyü hemen çeker.
export const connectGscProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; siteUrl: string }) => input)
  .handler(async ({ data, context }) => {
    const { listVerifiedSites } = await import("./gsc.server");
    const sites = await listVerifiedSites();
    if (!sites.some((s) => s.siteUrl === data.siteUrl)) {
      throw new Error("Seçilen mülk doğrulanmış listede yok");
    }
    const { error } = await context.supabase
      .from("integration_connections")
      .upsert(
        {
          brand_id: data.brandId,
          provider: "gsc",
          status: "bagli",
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
      const sites = await listVerifiedSites();
      if (!sites.some((s) => s.siteUrl === siteUrl)) throw new Error("Mülk artık doğrulanmış değil");
      const payload = await buildGscSnapshot(siteUrl);
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
        .update({ status: "bagli", last_sync_at: new Date().toISOString(), last_error: null })
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

export type TrafficOverview = {
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
  };
  ga4: { connected: boolean };
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
};

// Komuta merkezi için GSC anlık görüntüsü + yapay zekâ atıf/görünürlük trafiği.
export const getTrafficOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }): Promise<TrafficOverview> => {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const [{ data: connections }, { data: snapshot }, { data: citations }, { data: runs }] = await Promise.all([
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
    const payload = (snapshot?.payload ?? null) as null | {
      startDate: string;
      endDate: string;
      totals: { clicks: number; impressions: number };
      daily: Array<{ date: string; clicks: number; impressions: number }>;
      queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
    };

    const days = Array.from({ length: 30 }, (_, index) =>
      new Date(Date.now() - (29 - index) * 86400000).toISOString().slice(0, 10),
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

    return {
      gsc: {
        connected: gscConnection?.status === "bagli",
        status: gscConnection?.status ?? null,
        property: gscConnection?.property_id ?? null,
        lastSyncAt: gscConnection?.last_sync_at ?? null,
        startDate: payload?.startDate ?? null,
        endDate: payload?.endDate ?? null,
        totals: payload?.totals ?? { clicks: 0, impressions: 0 },
        daily: payload?.daily ?? [],
        queries: (payload?.queries ?? []).slice(0, 10),
      },
      ga4: { connected: (connections ?? []).some((c) => c.provider === "ga4" && c.status === "bagli") },
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
    };
  });