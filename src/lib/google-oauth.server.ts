// Musteri bazli Google OAuth (yalniz sunucu tarafi).
// Her marka kendi Google hesabini baglar; refresh token marka kaydinda saklanir.
import { createHmac, timingSafeEqual } from "crypto";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
  "openid",
  "email",
];

function clientCredentials() {
  const clientId = process.env["GOOGLE_OAUTH_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_OAUTH_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth istemcisi yapilandirilmamis");
  }
  return { clientId, clientSecret };
}

export function isGoogleOAuthConfigured() {
  return Boolean(process.env["GOOGLE_OAUTH_CLIENT_ID"] && process.env["GOOGLE_OAUTH_CLIENT_SECRET"]);
}

export function redirectUri(origin: string) {
  return process.env["GOOGLE_OAUTH_REDIRECT_URI"] ?? `${origin}/api/public/oauth/google/callback`;
}

function sign(payload: string) {
  const { clientSecret } = clientCredentials();
  return createHmac("sha256", clientSecret).update(payload).digest("base64url");
}

export function encodeState(input: { brandId: string; userId: string }) {
  const payload = Buffer.from(
    JSON.stringify({ ...input, exp: Date.now() + 10 * 60_000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeState(state: string): { brandId: string; userId: string } | null {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      brandId: string;
      userId: string;
      exp: number;
    };
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return { brandId: parsed.brandId, userId: parsed.userId };
  } catch {
    return null;
  }
}

export function buildAuthorizeUrl(state: string, origin: string) {
  const { clientId } = clientCredentials();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  id_token?: string;
};

async function tokenRequest(body: Record<string, string>) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!response.ok) {
    throw new Error(`Google token istegi basarisiz [${response.status}]: ${await response.text()}`);
  }
  return (await response.json()) as TokenResponse;
}

export async function exchangeCode(code: string, origin: string) {
  const { clientId, clientSecret } = clientCredentials();
  return tokenRequest({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri(origin),
    grant_type: "authorization_code",
  });
}

export async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = clientCredentials();
  return tokenRequest({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });
}

export function emailFromIdToken(idToken?: string) {
  if (!idToken) return null;
  const part = idToken.split(".")[1];
  if (!part) return null;
  try {
    return (JSON.parse(Buffer.from(part, "base64url").toString()) as { email?: string }).email ?? null;
  } catch {
    return null;
  }
}

// Marka icin gecerli bir access token dondurur; gerekiyorsa yeniler.
export async function getBrandAccessToken(brandId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: account } = await supabaseAdmin
    .from("google_oauth_accounts")
    .select("refresh_token, access_token, access_token_expires_at")
    .eq("brand_id", brandId)
    .maybeSingle();

  if (!account?.refresh_token) {
    throw new Error("Bu marka icin Google hesabi bagli degil. Ayarlar → Entegrasyonlar'dan Google hesabinizi baglayin.");
  }

  const expiresAt = account.access_token_expires_at ? Date.parse(account.access_token_expires_at) : 0;
  if (account.access_token && expiresAt - 60_000 > Date.now()) {
    return account.access_token;
  }

  const refreshed = await refreshAccessToken(account.refresh_token);
  await supabaseAdmin
    .from("google_oauth_accounts")
    .update({
      access_token: refreshed.access_token,
      access_token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("brand_id", brandId);
  return refreshed.access_token;
}

export async function hasGoogleAccount(brandId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("google_oauth_accounts")
    .select("google_email")
    .eq("brand_id", brandId)
    .maybeSingle();
  return data ? { connected: true, email: data.google_email } : { connected: false, email: null };
}
