import { createFileRoute } from "@tanstack/react-router";

// Musterinin Google izin ekranindan donusu: refresh token markaya kaydedilir.
export const Route = createFileRoute("/api/public/oauth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = url.origin;
        const back = (message: string, ok = false) =>
          Response.redirect(
            `${origin}/app/integrations?google=${ok ? "connected" : "error"}&message=${encodeURIComponent(message)}`,
            302,
          );

        const error = url.searchParams.get("error");
        if (error) return back(`Google izni verilmedi: ${error}`);

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state) return back("Eksik yetkilendirme yaniti");

        const { decodeState, exchangeCode, emailFromIdToken } = await import("@/lib/google-oauth.server");
        const parsed = decodeState(state);
        if (!parsed) return back("Yetkilendirme baglantisi gecersiz ya da suresi dolmus");

        try {
          const tokens = await exchangeCode(code, origin);
          if (!tokens.refresh_token) {
            return back("Google yenileme anahtari donmedi. Baglantiyi kaldirip tekrar deneyin.");
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: membership } = await supabaseAdmin
            .from("brand_members")
            .select("id")
            .eq("brand_id", parsed.brandId)
            .eq("user_id", parsed.userId)
            .maybeSingle();
          if (!membership) return back("Bu markaya erisiminiz yok");

          await supabaseAdmin.from("google_oauth_accounts").upsert(
            {
              brand_id: parsed.brandId,
              google_email: emailFromIdToken(tokens.id_token),
              refresh_token: tokens.refresh_token,
              access_token: tokens.access_token,
              access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
              scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
              created_by: parsed.userId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "brand_id" },
          );

          return back("Google hesabiniz baglandi", true);
        } catch (caught) {
          return back(caught instanceof Error ? caught.message : String(caught));
        }
      },
    },
  },
});
