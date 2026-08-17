// Çerez / veri işleme onayı yönetimi (localStorage tabanlı).
import { useEffect, useState } from "react";

export const CONSENT_STORAGE_KEY = "onecite.consent.v1";
export const CONSENT_EVENT = "onecite:consent-change";
export const CONSENT_OPEN_EVENT = "onecite:consent-open";

export type ConsentCategory = "necessary" | "analytics" | "processing";

export type ConsentState = {
  necessary: true;
  /** Ürün kullanım ölçümü, oturum analitiği */
  analytics: boolean;
  /** Site tarama (scraping), embedding ve AI sağlayıcılarına gönderim */
  processing: boolean;
  updatedAt: string;
};

export const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  processing: false,
  updatedAt: "",
};

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      processing: Boolean(parsed.processing),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function writeConsent(next: Omit<ConsentState, "necessary" | "updatedAt">) {
  if (typeof window === "undefined") return;
  const value: ConsentState = {
    necessary: true,
    analytics: next.analytics,
    processing: next.processing,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

export function openConsentPreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/** Onay alınmadan izleme/embedding tetiklenmemeli. */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  const state = readConsent();
  return Boolean(state?.[category]);
}

export function useConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setLoaded(true);
    const onChange = () => setConsent(readConsent());
    window.addEventListener(CONSENT_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return {
    consent,
    loaded,
    decided: loaded && consent !== null,
    analytics: Boolean(consent?.analytics),
    processing: Boolean(consent?.processing),
    save: writeConsent,
    openPreferences: openConsentPreferences,
  };
}
