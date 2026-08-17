import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  CONSENT_EVENT,
  CONSENT_OPEN_EVENT,
  readConsent,
  writeConsent,
} from "@/lib/consent";

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const current = readConsent();
    if (current) {
      setAnalytics(current.analytics);
      setProcessing(current.processing);
    } else {
      setOpen(true);
    }
    const onOpen = () => {
      const state = readConsent();
      setAnalytics(Boolean(state?.analytics));
      setProcessing(Boolean(state?.processing));
      setDetails(true);
      setOpen(true);
    };
    const onChange = () => setOpen(false);
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => {
      window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
      window.removeEventListener(CONSENT_EVENT, onChange);
    };
  }, []);

  if (!mounted || !open) return null;

  const save = (value: { analytics: boolean; processing: boolean }) => {
    writeConsent(value);
    setOpen(false);
    setDetails(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Çerez tercihleri"
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:p-5">
        <p className="text-sm font-semibold text-foreground">Çerez ve veri işleme tercihleri</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Zorunlu çerezler sitenin çalışması için gereklidir. Analitik ölçüm ile site tarama/embedding
          işlemleri yalnızca siz onay verirseniz başlatılır. Ayrıntılar için{" "}
          <Link to="/data-processing" className="underline hover:text-foreground">
            veri işleme metnimize
          </Link>{" "}
          ve{" "}
          <Link to="/privacy" className="underline hover:text-foreground">
            gizlilik politikamıza
          </Link>{" "}
          bakabilirsiniz.
        </p>

        {details ? (
          <div className="mt-4 space-y-3 rounded-lg border border-border/60 p-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Zorunlu</p>
                <p className="text-xs text-muted-foreground">Oturum, güvenlik ve tercih saklama. Kapatılamaz.</p>
              </div>
              <Switch checked disabled aria-label="Zorunlu çerezler" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Analitik / izleme</p>
                <p className="text-xs text-muted-foreground">
                  Sayfa ve ürün kullanım ölçümü. Kapalıyken hiçbir izleme çağrısı tetiklenmez.
                </p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Analitik çerezler" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Site tarama ve embedding</p>
                <p className="text-xs text-muted-foreground">
                  Girdiğiniz alan adının taranması ve içeriğin Perplexity/DeepSeek/Firecrawl ile
                  işlenip vektör (embedding) olarak saklanması.
                </p>
              </div>
              <Switch checked={processing} onCheckedChange={setProcessing} aria-label="Tarama ve embedding" />
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => save({ analytics: true, processing: true })}>
            Tümünü kabul et
          </Button>
          <Button size="sm" variant="outline" onClick={() => save({ analytics: false, processing: false })}>
            Yalnızca zorunlu
          </Button>
          {details ? (
            <Button size="sm" variant="secondary" onClick={() => save({ analytics, processing })}>
              Seçimimi kaydet
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setDetails(true)}>
              Tercihleri yönet
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
