import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TrafficOverview } from "@/lib/integrations.functions";

// Veri gelmediginde nedenini ve adim adim cozumu gosteren durum paneli.
export function GscStatusPanel({ data }: { data: TrafficOverview }) {
  const gsc = data.gsc;
  const hasData = gsc.connected && gsc.daily.length > 0;
  if (hasData) return null;

  const reason = !gsc.connected
    ? "Google Search Console hesabiniz bu markaya bagli degil."
    : gsc.lastSyncAt
      ? "Baglanti var ancak secilen aralikta Search Console verisi bulunamadi."
      : "Baglanti kuruldu fakat henuz ilk veri cekimi yapilmadi.";

  const steps = !gsc.connected
    ? [
        "Entegrasyonlar sayfasini acin.",
        "Google hesabinizi baglayin ve dogrulanmis mulkunuzu secin.",
        "\"Veriyi yenile\" butonuna basin; ilk cekim birkac saniye surer.",
      ]
    : gsc.lastSyncAt
      ? [
          "Tarih araligini 90 gune genisletin.",
          "Search Console verisi 2-3 gun gecikmeli gelir; daha eski bir aralik deneyin.",
          "Sorun surerse Entegrasyonlar sayfasindan mulk secimini kontrol edin.",
        ]
      : [
          "Entegrasyonlar sayfasina gidin.",
          "Search Console kartinda \"Veriyi yenile\" butonuna basin.",
          "Yenileme bittikten sonra bu sayfayi tazeleyin.",
        ];

  return (
    <Card className="border-amber-500/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
          Search Console verisi gorunmuyor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{reason}</p>
        <ol className="space-y-1.5">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-2 text-xs">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                {index + 1}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/app/integrations">
              {gsc.connected ? <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
              Entegrasyonlar
            </Link>
          </Button>
        </div>
        {gsc.lastSyncAt ? (
          <p className="text-[11px] text-muted-foreground">
            Son yenileme: {new Date(gsc.lastSyncAt).toLocaleString("tr-TR")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
