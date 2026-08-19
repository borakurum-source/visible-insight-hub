import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Activity, ArrowUpRight, Gauge, Info, Loader2, Radar, Search, Target } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, VISIBILITY_SUBNAV } from "@/components/app/panel-subnav";
import { DemandCitationMatrix, PlatformBars } from "@/components/app/prompt-demand/demand-visuals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { addDiscoveredPrompts } from "@/lib/panel.functions";
import { analyzePromptDemand } from "@/lib/prompt-demand.functions";
import { DEMAND_TOOLTIP, INTENT_LABELS, LEVEL_LABELS, SOURCE_LABELS } from "@/lib/prompt-demand/config";
import type { Level, PromptDemandRow } from "@/lib/prompt-demand/types";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/prompt-demand")({
  head: () => ({
    meta: [
      { title: "AI Talep Keşfi — OneCite Paneli" },
      { name: "description", content: "Bir konu etrafındaki AI prompt talebini ölçün, kaynak gösterim payınızı görün ve kanıt boşluklarını aksiyona çevirin." },
      { property: "og:title", content: "AI Talep Keşfi — OneCite Paneli" },
      { property: "og:description", content: "AI Talebi, kaynak gösterim payı ve kanıt boşluğu analizi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PromptDemandPage,
});

const number = new Intl.NumberFormat("tr-TR");

const LEVEL_TONE: Record<Level, string> = {
  high: "border-success/40 text-success",
  medium: "border-warning/40 text-warning",
  low: "border-border text-muted-foreground",
};

const CITATION_LABEL: Record<PromptDemandRow["citationStatus"], string> = {
  cited: "Kaynak gösteriliyor",
  not_cited: "Kaynak gösterilmiyor",
  competitor_cited: "Rakip kaynak gösteriliyor",
};

const EXAMPLE_TOPICS = ["yapay zeka görünürlük aracı", "e-ticaret kargo entegrasyonu", "kurumsal SEO ajansı"];

function PromptDemandPage() {
  const { brand } = useActiveBrand();
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzePromptDemand);
  const addPrompts = useServerFn(addDiscoveredPrompts);

  const [topic, setTopic] = useState("");
  const [country, setCountry] = useState("TR");
  const [language, setLanguage] = useState("tr");
  const [intentFilter, setIntentFilter] = useState("all");
  const [citationFilter, setCitationFilter] = useState("all");
  const [selected, setSelected] = useState<PromptDemandRow | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const run = useMutation({
    mutationFn: (value: string) => analyze({ data: { brandId: brand!.id, topic: value, country, language } }),
    onError: (error: Error) => toast.error(error.message),
  });
  const result = run.data ?? null;

  const track = useMutation({
    mutationFn: (rows: PromptDemandRow[]) =>
      addPrompts({
        data: {
          brandId: brand!.id,
          items: rows.map((row) => ({ text: row.text, cluster: result?.canonicalCluster ?? "talep", intent: row.intent })),
        },
      }),
    onSuccess: (_data, rows) => {
      toast.success(`${rows.length} prompt izlemeye alındı`);
      void queryClient.invalidateQueries({ queryKey: ["prompts", brand?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const prompts = useMemo(() => {
    if (!result) return [];
    return result.prompts.filter(
      (row) =>
        (intentFilter === "all" || row.intent === intentFilter) &&
        (citationFilter === "all" || row.citationStatus === citationFilter),
    );
  }, [result, intentFilter, citationFilter]);

  if (!brand) {
    return (
      <>
        <PanelSubnav items={VISIBILITY_SUBNAV} />
        <PanelPageHeading meta={{ title: "AI Talep Keşfi", description: "Önce bir marka ekleyin.", icon: Radar }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <PanelSubnav items={VISIBILITY_SUBNAV} />
      <PanelPageHeading
        meta={{
          title: "AI Talep Keşfi",
          description:
            "Bir konu girin: o konu etrafındaki AI prompt talebini, kaynak gösterim payınızı ve kapanması gereken kanıt boşluklarını görün.",
          icon: Radar,
        }}
      />

      <Card>
        <CardContent className="space-y-3 p-4">
          <form
            className="flex flex-col gap-2 md:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (topic.trim().length < 3) { toast.error("En az 3 karakterlik bir konu girin"); return; }
              run.mutate(topic.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Konu, kategori veya ürün girin (ör. yapay zeka görünürlük aracı)"
                className="pl-9"
              />
            </div>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="md:w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TR">Türkiye</SelectItem>
                <SelectItem value="US">ABD</SelectItem>
                <SelectItem value="DE">Almanya</SelectItem>
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="md:w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tr">Türkçe</SelectItem>
                <SelectItem value="en">İngilizce</SelectItem>
                <SelectItem value="de">Almanca</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={run.isPending}>
              {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radar className="mr-2 h-4 w-4" />}
              Talebi analiz et
            </Button>
          </form>
          {!result && !run.isPending ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Örnek:</span>
              {EXAMPLE_TOPICS.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="rounded-full border border-border px-2.5 py-1 transition-colors hover:border-primary/50 hover:text-foreground"
                  onClick={() => { setTopic(example); run.mutate(example); }}
                >
                  {example}
                </button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {run.isPending ? (
        <Card><CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Prompt talebi modelleniyor…</CardContent></Card>
      ) : null}

      {result ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Activity}
              label="AI Talebi (aylık)"
              value={number.format(result.demand)}
              hint={DEMAND_TOOLTIP}
              foot={`${result.trend >= 0 ? "+" : ""}${result.trend}% yıllık eğilim · ${result.promptCount} prompt`}
              badge={`Güven: ${LEVEL_LABELS[result.confidence]}`}
            />
            <MetricCard
              icon={Target}
              label="AI Kaynak Payınız"
              value={`%${Math.round(result.citationShare * 100)}`}
              hint="Bu kümedeki sorularda markanızın kaynak gösterilme oranı."
              foot={`${number.format(result.demandCovered)} talep karşılanıyor`}
              badge={SOURCE_LABELS[result.citationShareSource]}
            />
            <MetricCard
              icon={Gauge}
              label="Kaynak gösterim fırsatı"
              value={String(result.opportunityScore)}
              hint="Talep, niyet değeri, kaynak boşluğu, kanıt boşluğu ve rakip baskısının ağırlıklı skoru."
              foot={`Ticari niyet: ${LEVEL_LABELS[result.commercialIntent]}`}
              badge={LEVEL_LABELS[result.opportunity]}
            />
            <MetricCard
              icon={ArrowUpRight}
              label="Öne çıkan rakip"
              value={result.leadingCompetitor ? result.leadingCompetitor.name : "Veri yok"}
              hint="Ölçümlerinizde en sık kaynak gösterilen rakip alan adı."
              foot={result.leadingCompetitor ? `%${Math.round(result.leadingCompetitor.share * 100)} kaynak payı` : "Ölçüm yaptıkça dolar"}
              badge={result.canonicalCluster}
            />
          </div>

          <Card>
            <CardContent className="flex flex-col gap-2 p-4 text-sm md:flex-row md:items-center md:justify-between">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Zincir:</span> Talep {number.format(result.demand)} → Kaynak payı %
                {Math.round(result.citationShare * 100)} → {result.evidenceGaps.length} kanıt boşluğu → {result.actions.length} önerilen aksiyon
              </p>
              <span className="text-xs text-muted-foreground">{result.confidenceReason}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Veriyi besleyen kaynaklar</CardTitle></CardHeader>
            <CardContent className="space-y-2 p-4 pt-0 text-xs">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={result.signalSources.gscConnected ? LEVEL_TONE.high : LEVEL_TONE.low}>
                  Search Console: {result.signalSources.gscConnected ? "bağlı" : "bağlı değil"}
                </Badge>
                <Badge variant="outline" className={result.signalSources.ga4Connected ? LEVEL_TONE.high : LEVEL_TONE.low}>
                  GA4: {result.signalSources.ga4Connected ? "bağlı" : "bağlı değil"}
                </Badge>
                <Badge variant="outline" className={result.signalSources.gscMatchedPrompts > 0 ? LEVEL_TONE.high : LEVEL_TONE.medium}>
                  {result.signalSources.gscMatchedPrompts} prompt gerçek arama verisiyle eşleşti
                </Badge>
                <Badge variant="outline" className={LEVEL_TONE.medium}>
                  {result.signalSources.measuredPrompts} prompt OneCite ölçümünden
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {result.signalSources.gscConnected
                  ? `Search Console'dan ${number.format(result.signalSources.gscQueryCount)} sorgu ve ${number.format(result.signalSources.gscImpressions)} gösterim okundu${result.signalSources.snapshotDate ? ` (${result.signalSources.snapshotDate})` : ""}. Eşleşen promptlarda hacim tahmin değil ölçülen veridir.`
                  : "Search Console bağlı değil; hacimler şu an dil modeli tahminidir. Bağladığınızda eşleşen promptlar gerçek gösterim verisine geçer."}
                {result.signalSources.ga4Connected
                  ? ` GA4'te son 28 günde ${number.format(result.signalSources.ga4AiSessions)} yapay zeka kaynaklı oturum görüldü.`
                  : ""}
              </p>
              {!result.signalSources.gscConnected || !result.signalSources.ga4Connected ? (
                <Button asChild size="sm" variant="outline">
                  <Link to="/app/integrations">Entegrasyonları bağla</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Platform dağılımı</CardTitle></CardHeader>
              <CardContent><PlatformBars items={result.platformDemand} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Talep — Kaynak gösterimi matrisi</CardTitle></CardHeader>
              <CardContent><DemandCitationMatrix prompts={result.prompts} onSelect={setSelected} /></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-2">
              <CardTitle className="text-sm">Prompt kümeleri</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select value={intentFilter} onValueChange={setIntentFilter}>
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Niyet" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm niyetler</SelectItem>
                    {Object.entries(INTENT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={citationFilter} onValueChange={setCitationFilter}>
                  <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Kaynak durumu" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm kaynak durumları</SelectItem>
                    <SelectItem value="not_cited">Kaynak gösterilmiyor</SelectItem>
                    <SelectItem value="competitor_cited">Rakip kaynak gösteriliyor</SelectItem>
                    <SelectItem value="cited">Kaynak gösteriliyor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={track.isPending || prompts.length === 0}
                  onClick={() => track.mutate(prompts.slice(0, 10))}
                >
                  İlk 10 promptu izlemeye al
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Prompt</th>
                      <th className="px-4 py-2 font-medium">Niyet</th>
                      <th className="px-4 py-2 text-right font-medium">AI Talebi</th>
                      <th className="px-4 py-2 font-medium">Kaynak durumu</th>
                      <th className="px-4 py-2 font-medium">Kanıt boşluğu</th>
                      <th className="px-4 py-2 text-right font-medium">Fırsat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prompts.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                        onClick={() => setSelected(row)}
                      >
                        <td className="max-w-sm px-4 py-2.5">{row.text}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{INTENT_LABELS[row.intent]}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{number.format(row.uniqueDemand)}</td>
                        <td className="px-4 py-2.5 text-xs">{CITATION_LABEL[row.citationStatus]}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.evidenceGapType}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Badge variant="outline" className={`text-[10px] ${LEVEL_TONE[row.opportunity]}`}>{row.opportunityScore}</Badge>
                        </td>
                      </tr>
                    ))}
                    {prompts.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">Bu filtreyle eşleşen prompt yok.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Kanıt boşlukları</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {result.evidenceGaps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Bu kümede belirgin bir kanıt boşluğu bulunmadı.</p>
                ) : null}
                {result.evidenceGaps.map((gap) => (
                  <div key={gap.type} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{gap.type}</p>
                      <Badge variant="outline" className={`text-[10px] ${LEVEL_TONE[gap.impact]}`}>{LEVEL_LABELS[gap.impact]} etki</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{gap.why}</p>
                    <p className="mt-2 text-xs">
                      Etkilenen talep: <span className="font-medium">{number.format(gap.affectedDemand)}</span> · {gap.affectedPrompts} prompt
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Önerilen aksiyonlar</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {result.actions.map((action) => (
                  <div key={action.title} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{action.verb}: {action.title}</p>
                      <Badge variant="outline" className={`text-[10px] ${LEVEL_TONE[action.opportunity]}`}>{LEVEL_LABELS[action.opportunity]} fırsat</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{action.reason}</p>
                    <p className="mt-2 text-xs">
                      Kazanılabilir talep: <span className="font-medium">{number.format(action.potentialDemand)}</span> · {action.affectedPrompts} prompt
                    </p>
                  </div>
                ))}
                {result.actions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aksiyon önerisi için önce kanıt boşluğu tespit edilmeli.</p>
                ) : null}
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to="/app/geo-tasks">Görevler sayfasına git</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-2 p-4 text-xs text-muted-foreground">
              <button type="button" className="text-foreground underline-offset-2 hover:underline" onClick={() => setShowDebug((v) => !v)}>
                {showDebug ? "Metodoloji detayını gizle" : "Bu sayı nasıl hesaplandı?"}
              </button>
              {showDebug ? (
                <div className="space-y-1">
                  <p>Küme güven skoru: {result.confidenceScore} ({LEVEL_LABELS[result.confidence]})</p>
                  <p>Prompt talebi = Ham arama talebi × AI kullanım katsayısı × Prompt uygunluğu × Semantik güven.</p>
                  <p>Küme talebi, semantik örtüşme indirimi sonrası benzersiz katkıların toplamıdır; hacimler asla doğrudan toplanmaz.</p>
                  <p>{DEMAND_TOOLTIP}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader><SheetTitle className="text-base leading-snug">{selected.text}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="AI Talebi" value={number.format(selected.uniqueDemand)} />
                  <Stat label="Fırsat skoru" value={String(selected.opportunityScore)} />
                  <Stat label="Niyet" value={INTENT_LABELS[selected.intent]} />
                  <Stat label="Güven" value={LEVEL_LABELS[selected.confidence]} />
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium">Kaynak durumu</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {CITATION_LABEL[selected.citationStatus]} · Kaynak sınıfı: {SOURCE_LABELS[selected.source]}
                  </p>
                </div>
                {selected.gsc ? (
                  <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Search Console eşleşmesi</p>
                    <p className="mt-1">Sorgu: “{selected.gsc.query}”</p>
                    <p>
                      {number.format(selected.gsc.impressions)} gösterim · {number.format(selected.gsc.clicks)} tıklama · ortalama
                      sıra {selected.gsc.position}
                    </p>
                  </div>
                ) : null}
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium">Kanıt boşluğu</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selected.evidenceGapType}</p>
                  <p className="mt-2 text-xs">{selected.recommendedAction}</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Hesaplama kırılımı</p>
                  <p className="mt-1">Ham talep: {number.format(selected.breakdown.baseDemand)}</p>
                  <p>AI kullanım katsayısı: {selected.breakdown.aiUsageFactor}</p>
                  <p>Prompt uygunluğu: {selected.breakdown.promptSuitability}</p>
                  <p>Semantik güven: {selected.breakdown.semanticConfidence}</p>
                  <p>Örtüşme indirimi: {selected.breakdown.overlapAdjustment}</p>
                  <p className="text-foreground">Sonuç: {number.format(selected.breakdown.finalDemand)}</p>
                </div>
                <Button size="sm" className="w-full" disabled={track.isPending} onClick={() => track.mutate([selected])}>
                  Bu promptu izlemeye al
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  foot,
  badge,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint: string;
  foot: string;
  badge: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5" /> {label}
            <Tooltip>
              <TooltipTrigger asChild><span className="cursor-help"><Info className="h-3 w-3" /></span></TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{hint}</TooltipContent>
            </Tooltip>
          </span>
          <Badge variant="outline" className="text-[10px]">{badge}</Badge>
        </div>
        <p className="truncate text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{foot}</p>
      </CardContent>
    </Card>
  );
}