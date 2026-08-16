import { createFileRoute } from "@tanstack/react-router";

// Zamanlanmis yenileme: tum bagli markalarin Search Console (ve varsa GA4)
// anlik goruntulerini gunceller. Harici zamanlayici (pg_cron / cron-job.org)
// bu adresi CRON_SECRET basligiyla cagirir.
export const Route = createFileRoute("/api/public/cron/sync-analytics")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        if (!secret) return new Response("Cron secret configured degil", { status: 503 });
        if (request.headers.get("x-cron-key") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { buildGscSnapshot } = await import("@/lib/gsc.server");
        const { buildGa4Snapshot } = await import("@/lib/ga4.server");

        const { data: connections } = await supabaseAdmin
          .from("integration_connections")
          .select("brand_id, provider, property_id")
          .in("provider", ["gsc", "ga4"])
          .eq("status", "bagli");

        const today = new Date().toISOString().slice(0, 10);
        const results: Array<{ brandId: string; provider: string; ok: boolean; error?: string }> = [];

        for (const connection of connections ?? []) {
          const siteUrl = connection.property_id;
          if (!siteUrl) continue;
          try {
            const payload =
              connection.provider === "gsc" ? await buildGscSnapshot(siteUrl) : await buildGa4Snapshot(siteUrl);
            await supabaseAdmin.from("analytics_snapshots").upsert(
              { brand_id: connection.brand_id, provider: connection.provider, snapshot_date: today, payload },
              { onConflict: "brand_id,provider,snapshot_date" },
            );
            await supabaseAdmin
              .from("integration_connections")
              .update({ last_sync_at: new Date().toISOString(), last_error: null })
              .eq("brand_id", connection.brand_id)
              .eq("provider", connection.provider);
            results.push({ brandId: connection.brand_id, provider: connection.provider, ok: true });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await supabaseAdmin
              .from("integration_connections")
              .update({ last_error: message })
              .eq("brand_id", connection.brand_id)
              .eq("provider", connection.provider);
            results.push({ brandId: connection.brand_id, provider: connection.provider, ok: false, error: message });
          }
        }

        return Response.json({ synced: results.length, results });
      },
    },
  },
});
