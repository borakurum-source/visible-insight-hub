// İlk hero'daki inline domain analizörü: girilen alan adını sunucuda gerçek zamanlı
// tarar ve sonucu /r/[token] adresindeki canlı rapora yönlendirir.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { startPublicReport } from "@/lib/public-report.functions";
import { ArrowRight, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReportTeaser } from "@/components/site/report-teaser";
import { hasConsent, openConsentPreferences } from "@/lib/consent";
import { toast } from "sonner";

const STAGES = [
  { key: "validating", label: "Alan adınız doğrulanıyor" },
  { key: "technical", label: "Teknik erişilebilirlik kontrol ediliyor" },
  { key: "structured_data", label: "Yapılandırılmış veri (JSON-LD) taranıyor" },
  { key: "ai_bot_compatibility", label: "AI bot ve arama motoru kuralları inceleniyor" },
  { key: "content_readability", label: "İçerik okunabilirliği değerlendiriliyor" },
  { key: "scoring", label: "Bulgular puanlanıyor" },
] as const;

const STAGE_INTERVAL_MS = 650;

type Phase = "idle" | "analyzing" | "locked";

export function PublicReportAnalyzer() {
  const navigate = useNavigate();
  const runReport = useServerFn(startPublicReport);
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const stageIndexRef = useRef(0);

  useEffect(() => {
    if (phase !== "analyzing") return;
    stageIndexRef.current = 0;
    setStageIndex(0);
    const timer = window.setInterval(() => {
      if (stageIndexRef.current < STAGES.length - 2) {
        stageIndexRef.current += 1;
        setStageIndex(stageIndexRef.current);
      }
    }, STAGE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [phase]);

  async function handleStart(event: React.FormEvent) {
    event.preventDefault();
    if (!hasConsent("processing")) {
      toast.info("Onayınız gerekiyor", {
        description:
          "Site tarama ve embedding işlemini başlatabilmemiz için çerez tercihlerinden bu izni açmalısınız.",
        action: { label: "Tercihleri aç", onClick: () => openConsentPreferences() },
      });
      openConsentPreferences();
      return;
    }
    setToken(null);
    setPhase("analyzing");
    try {
      const result = await runReport({ data: { domain: url } });
      setToken(result.token);
      setStageIndex(STAGES.length - 1);
      setPhase("locked");
    } catch (error) {
      setPhase("idle");
      toast.error("Analiz tamamlanamadı", {
        description: error instanceof Error ? error.message : "Alan adını kontrol edip tekrar deneyin.",
      });
    }
  }

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !consent) return;
    setUnlocking(true);
    try {
      await runReport({ data: { domain: url, email } });
    } catch {
      /* e-posta kaydedilemese de rapor gösterilir */
    }
    navigate({ to: "/r/$token", params: { token } });
  }

  function reset() {
    setPhase("idle");
    setToken(null);
    setStageIndex(0);
    setEmail("");
    setConsent(false);
    setUnlocking(false);
  }

  return (
    <>
      <form onSubmit={handleStart} className="space-y-1.5" data-testid="form-public-report-start">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Input
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="ornek.com"
            className="h-11 min-w-0 flex-1 border-white/20 bg-white/10 text-white placeholder:text-slate-400"
            data-testid="input-hero-domain"
          />
          <Button
            type="submit"
            className="h-11 w-full shrink-0 whitespace-nowrap bg-cyan px-5 text-foreground hover:bg-cyan/85 sm:w-auto"
            data-testid="button-public-report-cta"
          >
            Ücretsiz raporu al <ArrowRight className="ml-1.5 h-4 w-4 shrink-0" />
          </Button>
        </div>
      </form>

      <Dialog open={phase !== "idle"} onOpenChange={(open) => !open && phase !== "analyzing" && reset()}>
        <DialogContent data-testid="dialog-public-report">
          {phase === "analyzing" && (
            <div className="space-y-5 py-2" data-testid="public-report-progress">
              <DialogHeader>
                <DialogTitle>Siteniz analiz ediliyor</DialogTitle>
                <DialogDescription>Bu işlem sırasında sitenizi birden çok açıdan denetliyoruz.</DialogDescription>
              </DialogHeader>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500 ease-linear"
                  style={{ width: `${((stageIndex + 1) / STAGES.length) * 100}%` }}
                />
              </div>
              <ul className="space-y-2.5">
                {STAGES.map((stage, index) => {
                  const done = index < stageIndex;
                  const active = index === stageIndex;
                  return (
                    <li key={stage.key} className="flex items-center gap-2.5 text-sm">
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      ) : active ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={done || active ? "text-foreground" : "text-muted-foreground"}>{stage.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {phase === "locked" && (
            <form onSubmit={handleUnlock} className="space-y-4" data-testid="public-report-unlock">
              <DialogHeader>
                <DialogTitle data-testid="text-public-report-ready">Raporunuz hazır</DialogTitle>
                <DialogDescription>Görüntülemek için e-posta adresinizi girin.</DialogDescription>
              </DialogHeader>

              <ReportTeaser testId="public-report-teaser" />

              <Input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ad@firma.com"
                data-testid="input-public-report-email"
              />
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <Checkbox required checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} data-testid="checkbox-public-report-consent" />
                <span>Sonuçlarımı ve raporumla ilgili tarafıma ulaşılmasını kabul ediyorum.</span>
              </label>
              <Button type="submit" className="w-full" disabled={unlocking || !consent} data-testid="button-public-report-unlock">
                Raporu Görüntüle
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
