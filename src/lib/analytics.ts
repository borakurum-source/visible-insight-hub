// Google Analytics 4 (gtag.js) — çerez onayına bağlı yükleme.
import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import { CONSENT_EVENT, hasConsent } from "./consent";

export const GA_MEASUREMENT_ID =
  (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as string | undefined) ||
  "G-10XBL984LZ";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  }
}

// Etiket HTML head icinde her zaman yuklu; burada yalnizca Consent Mode durumu guncellenir.
function syncConsent() {
  if (typeof window === "undefined") return;
  ensureGtag();
  const granted = hasConsent("analytics");
  window.gtag!("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

/** Onay verildiyse GA'yı yükler, sayfa değişimlerinde page_view gönderir. */
export function useGoogleAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });

  useEffect(() => {
    const sync = () => syncConsent();
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: `${pathname}${search || ""}`,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, search]);
}

/** Özel olay gönderimi (onay yoksa sessizce yok sayılır). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

/** GA4 dönüşüm olayı: oturum açma. */
export function trackLogin(method: "google" | "email") {
  trackEvent("login", { method });
}

/** GA4 dönüşüm olayı: kayıt. */
export function trackSignUp(method: "google" | "email", status: "completed" | "pending_verification" = "completed") {
  trackEvent("sign_up", { method, status });
}

const PENDING_AUTH_KEY = "onecite.ga.pending_auth";

/** OAuth yönlendirmesi öncesi olayı işaretle; dönüşte gönderilir. */
export function markPendingOAuth(method: "google") {
  try {
    window.sessionStorage.setItem(PENDING_AUTH_KEY, method);
  } catch {
    /* sessionStorage kapalı olabilir */
  }
}

/**
 * OAuth dönüşünde bekleyen olayı gönderir.
 * isNewUser true ise sign_up, değilse login olarak raporlanır.
 */
export function flushPendingOAuth(isNewUser: boolean) {
  let method: string | null = null;
  try {
    method = window.sessionStorage.getItem(PENDING_AUTH_KEY);
    if (method) window.sessionStorage.removeItem(PENDING_AUTH_KEY);
  } catch {
    return;
  }
  if (method !== "google") return;
  if (isNewUser) trackSignUp("google");
  else trackLogin("google");
}
