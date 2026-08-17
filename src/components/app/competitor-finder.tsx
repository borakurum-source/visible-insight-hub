import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Lock, Plus, Search, Sparkles, Swords, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Hint } from "@/components/app/hint";
import { cleanDomain, type CompetitorEntry } from "@/lib/competitors";
import { getCompetitors, saveCompetitors, searchCompetitors } from "@/lib/panel.functions";

// Rakibini bilmeyen kullanıcı için: sektörden gerçek rakip adayları bulan arama kartı.
export function CompetitorFinder({ brandId }: { brandId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fetchSaved = useServerFn(getCompetitors);
  const runSearch = useServerFn(searchCompetitors);
  const persist = useServerFn(saveCompetitors);
  const [query, setQuery] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualDomain, setManualDomain] = useState("");
  const [results, setResults] = useState<Array<{ name: string; domain: string; reason: string }>>([]);

  const saved = useQuery({
    queryKey: ["competitors", brandId],
    queryFn: () => fetchSaved({ data: { brandId } }),
    // Plan yükseltmesi baska bir sekmede/checkout'ta olabilir: odaga donunce kotayi tazele.
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const list = saved.data?.competitors ?? [];
  const maxCompetitors = saved.data?.maxCompetitors ?? 0;
  const unlimited = saved.data?.unlimited ?? false;
  const planLabel = saved.data?.planLabel ?? "";
  const quotaFull = !unlimited && !!saved.data && list.length >= maxCompetitors;

  // Limit dolduğunda: neyin neden engellendiğini ve nasıl çözüleceğini adım adım anlatır.
  function explainQuota(message?: string) {
    toast.error(message ?? `${planLabel} planınızın rakip takip limiti doldu (${list.length}/${maxCompetitors}).`, {
      duration: 12000,
      description:
        `Engellenen işlem: yeni rakip ekleme. Nedeni: ${planLabel} planı marka başına ${maxCompetitors} rakip takibine izin veriyor.\n` +
        "Çözüm: 1) Takip etmediğiniz bir rakibi listeden kaldırın, ya da 2) “Planı yükselt” ile Başlangıç (2 rakip), Büyüme (5 rakip) veya Ajans (sınırsız) planına geçin. " +
        "Yükseltme tamamlandığında yeni hakkınız birkaç saniye içinde otomatik tanımlanır.",
      action: { label: "Planı yükselt", onClick: () => navigate({ to: "/app/pricing" }) },
    });
  }

  const search = useMutation({
    mutationFn: () => runSearch({ data: { brandId, query } }),
    onSuccess: (rows) => {
      setResults(rows);
      if (!rows.length) toast.info("Yeni rakip adayı bulunamadı. Aramayı biraz daraltın.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const save = useMutation({
    mutationFn: (list: CompetitorEntry[]) => persist({ data: { brandId, competitors: list } }),
    onSuccess: async (result) => {
      if (!result.ok) {
        await queryClient.invalidateQueries({ queryKey: ["competitors", brandId] });
        explainQuota(result.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["competitors", brandId] });
      await queryClient.invalidateQueries({ queryKey: ["plan-usage"] });
      toast.success("Rakip listesi güncellendi.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Sunucuya gitmeden once yerel validasyon: bos ad, tekrar ve kota kontrolu.
  function addCompetitor(name: string, domain = "") {
    const clean = name.trim();
    const cleanedDomain = cleanDomain(domain);
    if (!clean && !cleanedDomain) {
      toast.info("Rakip adı veya alan adı girin.");
      return;
    }
    if (list.some((item) => item.name.toLowerCase() === clean.toLowerCase() || (cleanedDomain && item.domain === cleanedDomain))) {
      toast.info(`${clean} zaten takip listenizde.`);
      return;
    }
    if (quotaFull) {
      explainQuota();
      return;
    }
    save.mutate([...list, { name: clean || cleanedDomain, domain: cleanedDomain, type: "direct" as const }]);
    setManualName("");
    setManualDomain("");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Swords className="h-4 w-4 text-primary" aria-hidden="true" />
          Rakip keşfi
          <Hint title="Rakip keşfi">
            <p>Rakiplerinizi bilmiyorsanız buradan arayın: sektörünüzü yazın, gerçek firmaları listeleyelim.</p>
            <p>Eklediğiniz rakipler, yapay zeka yanıtlarında <strong>sizin yerinize kimin çıktığını</strong> ölçmek için kullanılır.</p>
          </Hint>
          {saved.data ? (
            <Badge variant={quotaFull ? "destructive" : "secondary"} className="ml-auto text-[10px]">
              {unlimited ? `${list.length} / sınırsız` : `${list.length} / ${maxCompetitors}`}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quotaFull ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-medium">Rakip ekleme kapalı — {planLabel} planı limiti dolu ({list.length}/{maxCompetitors})</p>
              <p className="text-[11px] text-muted-foreground">
                Yeni rakip eklemek için ya listeden bir rakibi kaldırın ya da planınızı yükseltin: Başlangıç 2, Büyüme 5, Ajans sınırsız rakip.
              </p>
              <Button size="sm" className="mt-1 h-7 text-xs" onClick={() => navigate({ to: "/app/pricing" })}>
                <Sparkles className="mr-1 h-3 w-3" /> Planı yükselt
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && query.trim()) search.mutate(); }}
            placeholder="Örn. Türkiye'de abs kör kalıp üreticileri"
            aria-label="Rakip ara"
          />
          <Button onClick={() => search.mutate()} disabled={search.isPending || !query.trim()}>
            {search.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-1.5 hidden sm:inline">Ara</span>
          </Button>
        </div>

        {results.length ? (
          <ul className="space-y-1.5">
            {results.map((row) => (
              <li key={row.domain + row.name} className="flex items-start gap-2 rounded-md border border-border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{row.name} <span className="font-mono text-[10px] text-muted-foreground">{row.domain}</span></p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{row.reason}</p>
                </div>
                {quotaFull ? (
                  <Button size="sm" variant="outline" onClick={() => explainQuota()} title="Plan limiti dolu — planı yükseltin">
                    <Lock className="mr-1 h-3.5 w-3.5" /> Limit dolu
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      save.isPending ||
                      saved.isLoading ||
                      list.some((item) => item.name.toLowerCase() === row.name.toLowerCase() || (!!row.domain && item.domain === cleanDomain(row.domain)))
                    }
                    onClick={() => addCompetitor(row.name, row.domain)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Ekle
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            value={manualName}
            onChange={(event) => setManualName(event.target.value)}
            placeholder="Rakip adı (ör. Hipaş Plastik)"
            aria-label="Rakip adı"
          />
          <Input
            value={manualDomain}
            onChange={(event) => setManualDomain(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") addCompetitor(manualName, manualDomain); }}
            placeholder="Alan adı (ör. rakip.com)"
            aria-label="Rakip alan adı"
          />
          <Button
            variant="outline"
            disabled={save.isPending || (!manualName.trim() && !manualDomain.trim())}
            onClick={() => (quotaFull ? explainQuota() : addCompetitor(manualName, manualDomain))}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Elle ekle
          </Button>
        </div>
        <p className="-mt-1 text-[11px] text-muted-foreground">
          Alan adı girmek eşleşmeyi güçlendirir: yapay zeka yanıtlarındaki atıf kaynakları alan adına göre de sayılır.
        </p>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Takip edilen rakipler</p>
          {list.length ? (
            <div className="flex flex-wrap gap-1.5">
              {list.map((item) => (
                <Badge key={`${item.name}-${item.domain}`} variant="secondary" className="gap-1 pr-1">
                  {item.name}
                  {item.domain ? <span className="font-mono text-[10px] opacity-70">{item.domain}</span> : null}
                  <button
                    type="button"
                    aria-label={`${item.name} rakibini kaldır`}
                    className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                    onClick={() => save.mutate(list.filter((row) => row !== item))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Henüz rakip eklenmedi. Yukarıdan arayıp ekleyebilirsiniz.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
