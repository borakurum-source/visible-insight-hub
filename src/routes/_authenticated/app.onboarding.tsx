import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Info, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WizardFrame } from "@/components/app/onboarding/wizard-frame";
import { FUNNEL_LABEL, FUNNEL_STAGES, normalizeFunnel, type FunnelStage } from "@/lib/funnel";
import { COMPETITOR_TYPE_LABEL, cleanDomain, type CompetitorEntry, type CompetitorType } from "@/lib/competitors";
import {
  addKnowledgeSources,
  completeOnboarding,
  createBrand,
  createPrompt,
  deletePrompt,
  generateBrandIntelligence,
  generatePromptCandidates,
  getBrandEngines,
  getBrandIntelligence,
  getCompetitors,
  getPlanUsage,
  listPrompts,
  saveBrandIntelligence,
  saveCompetitors,
  setBrandEngines,
  setPromptStatus,
  suggestKnowledgeSources,
  updatePrompts,
} from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/onboarding")({
  head: () => ({
    meta: [
      { title: "Kurulum — OneCite Paneli" },
      { name: "description", content: "Alan adınızı girin, marka kitabınızı onaylayın, promptları ve rakipleri seçin; ilk ölçümünüz otomatik başlasın." },
      { property: "og:title", content: "Kurulum — OneCite Paneli" },
      { property: "og:description", content: "Altı adımda yapay zeka görünürlük kurulumu." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

const TOTAL_STEPS = 6;

const LANGUAGES = ["Türkçe", "English", "Deutsch", "Français", "Español"];

const ENGINES = [
  { key: "perplexity", name: "Perplexity", description: "Canlı web araması ve atıf kaynaklarıyla ölçüm." },
  { key: "deepseek", name: "DeepSeek", description: "Üretken yanıt simülasyonu ve içerik analizi." },
] as const;

type BrandBook = {
  brandName: string;
  industry: string;
  language: string;
  location: string;
  summary: string;
  keyFeatures: string;
  detailedDescription: string;
  positioning: string;
  tone: string;
  products: string[];
  audiences: string[];
  keywords: string[];
};

const EMPTY_BOOK: BrandBook = {
  brandName: "", industry: "", language: "Türkçe", location: "", summary: "",
  keyFeatures: "", detailedDescription: "", positioning: "", tone: "",
  products: [], audiences: [], keywords: [],
};

type PromptRow = { id: string; text: string; funnelStage: FunnelStage; status: string };

function toList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { brand, isLoading, selectBrand } = useActiveBrand();

  const create = useServerFn(createBrand);
  const generateIntel = useServerFn(generateBrandIntelligence);
  const loadIntel = useServerFn(getBrandIntelligence);
  const saveIntel = useServerFn(saveBrandIntelligence);
  const suggestSources = useServerFn(suggestKnowledgeSources);
  const addSources = useServerFn(addKnowledgeSources);
  const genPrompts = useServerFn(generatePromptCandidates);
  const listAllPrompts = useServerFn(listPrompts);
  const savePromptEdits = useServerFn(updatePrompts);
  const addPrompt = useServerFn(createPrompt);
  const removePrompt = useServerFn(deletePrompt);
  const setStatus = useServerFn(setPromptStatus);
  const loadCompetitors = useServerFn(getCompetitors);
  const storeCompetitors = useServerFn(saveCompetitors);
  const loadEngines = useServerFn(getBrandEngines);
  const storeEngines = useServerFn(setBrandEngines);
  const complete = useServerFn(completeOnboarding);
  const planUsage = useServerFn(getPlanUsage);

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  // 1. adım
  const [domain, setDomain] = useState("");
  const [language, setLanguage] = useState("Türkçe");

  // 3. adım
  const [book, setBook] = useState<BrandBook>(EMPTY_BOOK);

  // 4. adım
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [newPromptStage, setNewPromptStage] = useState<FunnelStage>("middle");
  const [maxPrompts, setMaxPrompts] = useState<number>(0);

  // 5. adım
  const [competitors, setCompetitors] = useState<CompetitorEntry[]>([]);
  const [maxCompetitors, setMaxCompetitors] = useState<number>(0);
  const [newCompetitor, setNewCompetitor] = useState<CompetitorEntry>({ name: "", domain: "", type: "direct" });

  // 6. adım
  const [engines, setEngines] = useState<string[]>(["perplexity", "deepseek"]);

  const brandId = brand?.id;

  useEffect(() => {
    if (isLoading) return;
    if (!brandId) setStep(1);
  }, [isLoading, brandId]);

  const refreshSession = () => queryClient.invalidateQueries({ queryKey: ["panel-session"] });

  const applyIntel = (row: Record<string, unknown> | null | undefined, fallbackName: string) => {
    if (!row) return;
    setBook({
      brandName: fallbackName,
      industry: String(row["industry"] ?? ""),
      language: String(row["language"] ?? language) || language,
      location: String(row["location"] ?? ""),
      summary: String(row["summary"] ?? ""),
      keyFeatures: toList(row["key_features"]).join(", "),
      detailedDescription: String(row["detailed_description"] ?? ""),
      positioning: String(row["positioning"] ?? ""),
      tone: String(row["tone"] ?? ""),
      products: toList(row["products"]),
      audiences: toList(row["audiences"]),
      keywords: toList(row["keywords"]),
    });
  };

  // 1 + 2: marka oluştur ve siteyi tara
  async function startScan() {
    const clean = cleanDomain(domain);
    if (!clean) { toast.error("Geçerli bir alan adı girin, örn. markaniz.com"); return; }
    setBusy(true);
    setStep(2);
    try {
      const created = await create({ data: { name: clean, domain: clean } });
      selectBrand(created.id);
      await refreshSession();
      const intel = await generateIntel({ data: { brandId: created.id } });
      applyIntel(intel as never, created.name);
      // Kanıt sayfalarını sessizce bilgi bankasına ekle.
      const suggested = await suggestSources({ data: { brandId: created.id } }).catch(() => []);
      if (suggested.length) {
        await addSources({ data: { brandId: created.id, items: suggested.slice(0, 8) } }).catch(() => undefined);
      }
      setStep(3);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Site analizi başarısız oldu.");
      setStep(1);
    } finally {
      setBusy(false);
    }
  }

  // 3 → 4
  async function saveBookAndGeneratePrompts() {
    if (!brandId) return;
    setBusy(true);
    try {
      await saveIntel({
        data: {
          brandId,
          brandName: book.brandName,
          summary: book.summary,
          positioning: book.positioning,
          tone: book.tone,
          products: book.products,
          audiences: book.audiences,
          competitors: [],
          keywords: book.keywords,
          industry: book.industry,
          language: book.language,
          location: book.location,
          detailedDescription: book.detailedDescription,
          keyFeatures: book.keyFeatures.split(",").map((v) => v.trim()).filter(Boolean),
        } as never,
      });
      await refreshSession();
      const existing = await listAllPrompts({ data: { brandId } });
      const rows = existing.length ? existing : await genPrompts({ data: { brandId } });
      setPrompts(rows.map((r: Record<string, unknown>) => ({
        id: String(r["id"]),
        text: String(r["text"]),
        funnelStage: normalizeFunnel(r["funnel_stage"]),
        status: String(r["status"] ?? "candidate"),
      })));
      const usage = await planUsage({ data: { brandId } }).catch(() => null);
      if (usage) setMaxPrompts(usage.maxPrompts);
      setStep(4);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Marka kitabı kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  // 4 → 5
  async function savePromptsAndLoadCompetitors() {
    if (!brandId) return;
    setBusy(true);
    try {
      await savePromptEdits({ data: { items: prompts.map((p) => ({ id: p.id, text: p.text, funnelStage: p.funnelStage })) } });
      await setStatus({ data: { ids: prompts.map((p) => p.id), status: "approved" } });
      const result = await loadCompetitors({ data: { brandId } });
      setCompetitors(result.competitors);
      setMaxCompetitors(result.unlimited ? 0 : result.maxCompetitors);
      setStep(5);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Promptlar kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  // 5 → 6
  async function saveCompetitorsAndLoadEngines() {
    if (!brandId) return;
    setBusy(true);
    try {
      const result = await storeCompetitors({ data: { brandId, competitors } });
      if (!result.ok) { toast.error(result.message); return; }
      const current = await loadEngines({ data: { brandId } }).catch(() => ({ engines: ["perplexity", "deepseek"] }));
      setEngines(current.engines);
      setStep(6);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rakipler kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  // 6 → bitir
  async function finish() {
    if (!brandId) return;
    setBusy(true);
    try {
      await storeEngines({ data: { brandId, engines } });
      await complete({ data: { brandId } });
      await refreshSession();
      toast.success("Kurulum tamamlandı — ilk ölçümünüz başlıyor.");
      navigate({ to: "/app/measurement", search: { autostart: true } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kurulum tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  }

  const promptQuotaExceeded = maxPrompts > 0 && prompts.length > maxPrompts;
  const competitorQuotaFull = maxCompetitors > 0 && competitors.length >= maxCompetitors;

  const funnelCounts = useMemo(() => {
    const counts: Record<FunnelStage, number> = { top: 0, middle: 0, bottom: 0 };
    for (const p of prompts) counts[p.funnelStage] += 1;
    return counts;
  }, [prompts]);

  if (step === 1) {
    return (
      <WizardFrame
        step={1}
        total={TOTAL_STEPS}
        title="Hoş geldiniz 🎉"
        subtitle="Başlamak için alan adınızı girin. Gerisini biz hazırlayıp onayınıza sunacağız."
        footer={
          <Button size="lg" className="w-full max-w-md" onClick={startScan} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Devam et
          </Button>
        }
      >
        <div className="mx-auto w-full max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="domain">Alan adınız</Label>
            <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="markaniz.com" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="language">Birincil dil</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </WizardFrame>
    );
  }

  if (step === 2) {
    return (
      <WizardFrame step={2} total={TOTAL_STEPS} title="Siteniz taranıyor" subtitle="Sayfalarınızı okuyup marka kitabınızı çıkarıyoruz. Bu işlem yaklaşık bir dakika sürer.">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Site içeriği okunuyor, marka profili ve kanıt sayfaları çıkarılıyor…</span>
          </CardContent>
        </Card>
      </WizardFrame>
    );
  }

  if (step === 3) {
    return (
      <WizardFrame
        step={3}
        total={TOTAL_STEPS}
        title="Marka kitabınızı gözden geçirin ✨"
        subtitle="Sitenize göre bir marka kitabı hazırladık. Aşağıdaki bilgileri kontrol edip düzenleyebilirsiniz."
        footer={
          <>
            <Button variant="outline" onClick={() => setStep(1)} disabled={busy}><ArrowLeft className="mr-1.5 h-4 w-4" /> Geri</Button>
            <Button onClick={saveBookAndGeneratePrompts} disabled={busy || !book.summary.trim()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Devam et <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </>
        }
      >
        <div className="flex gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Aşağıdaki bilgiler markanızı doğru yansıtmıyorsa düzeltin. Sitenizde bot korumasi (örn. Cloudflare) varsa içeriğe tam erişemeyip eksik çıkarım yapmış olabiliriz.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Marka adı" value={book.brandName} onChange={(v) => setBook({ ...book, brandName: v })} />
          <Field label="Sektör" value={book.industry} onChange={(v) => setBook({ ...book, industry: v })} />
          <div className="space-y-1.5">
            <Label>Birincil dil</Label>
            <Select value={book.language || "Türkçe"} onValueChange={(v) => setBook({ ...book, language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Field label="Ana lokasyon" value={book.location} onChange={(v) => setBook({ ...book, location: v })} placeholder="Örn. İstanbul, Türkiye" />
        </div>
        <div className="space-y-1.5">
          <Label>Kısa açıklama</Label>
          <Textarea rows={2} value={book.summary} onChange={(e) => setBook({ ...book, summary: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Öne çıkan özellikler</Label>
          <Textarea rows={2} value={book.keyFeatures} onChange={(e) => setBook({ ...book, keyFeatures: e.target.value })} placeholder="Virgülle ayırın" />
        </div>
        <div className="space-y-1.5">
          <Label>Detaylı açıklama</Label>
          <Textarea rows={5} value={book.detailedDescription} onChange={(e) => setBook({ ...book, detailedDescription: e.target.value })} />
        </div>
      </WizardFrame>
    );
  }

  if (step === 4) {
    return (
      <WizardFrame
        step={4}
        total={TOTAL_STEPS}
        title="Önerilen promptları gözden geçirin ✨"
        subtitle="Bu sorular yapay zeka platformlarındaki görünürlük skorunuzu hesaplamak için kullanılır. Metni ve huni aşamasını düzenleyebilirsiniz."
        footer={
          <>
            <Button variant="outline" onClick={() => setStep(3)} disabled={busy}><ArrowLeft className="mr-1.5 h-4 w-4" /> Geri</Button>
            <Button onClick={savePromptsAndLoadCompetitors} disabled={busy || prompts.length === 0 || promptQuotaExceeded}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Devam et <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {prompts.length} prompt · Üst {funnelCounts.top} · Orta {funnelCounts.middle} · Alt {funnelCounts.bottom}
          </span>
          {maxPrompts > 0 ? (
            <span className={promptQuotaExceeded ? "text-destructive" : ""}>
              Plan hakkınız: {maxPrompts} prompt
            </span>
          ) : null}
        </div>
        {promptQuotaExceeded ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            Planınızın prompt hakkını aştınız. Devam etmek için fazla promptları silin veya planınızı yükseltin.
          </p>
        ) : null}

        <div className="space-y-2">
          {prompts.map((prompt, index) => (
            <div key={prompt.id} className="flex flex-col gap-2 rounded-lg border border-border p-2 sm:flex-row sm:items-center">
              <Input
                value={prompt.text}
                onChange={(e) => {
                  const next = [...prompts];
                  next[index] = { ...prompt, text: e.target.value };
                  setPrompts(next);
                }}
              />
              <Select
                value={prompt.funnelStage}
                onValueChange={(value) => {
                  const next = [...prompts];
                  next[index] = { ...prompt, funnelStage: normalizeFunnel(value) };
                  setPrompts(next);
                }}
              >
                <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUNNEL_STAGES.map((stage) => <SelectItem key={stage} value={stage}>{FUNNEL_LABEL[stage]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Promptu sil"
                onClick={async () => {
                  setPrompts(prompts.filter((p) => p.id !== prompt.id));
                  await removePrompt({ data: { id: prompt.id } }).catch(() => undefined);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {prompts.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Henüz prompt yok, aşağıdan ekleyebilirsiniz.</p> : null}
        </div>

        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <p className="text-sm font-medium">Yeni prompt ekle</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} placeholder="Sorunuzu yazın" />
            <Select value={newPromptStage} onValueChange={(v) => setNewPromptStage(normalizeFunnel(v))}>
              <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FUNNEL_STAGES.map((stage) => <SelectItem key={stage} value={stage}>{FUNNEL_LABEL[stage]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!newPrompt.trim() || busy}
              onClick={async () => {
                if (!brandId) return;
                if (maxPrompts > 0 && prompts.length >= maxPrompts) {
                  toast.error("Plan limitiniz doldu. Daha fazla prompt için planınızı yükseltin.");
                  return;
                }
                try {
                  await addPrompt({ data: { brandId, text: newPrompt.trim() } });
                  const rows = await listAllPrompts({ data: { brandId } });
                  setPrompts(rows.map((r: Record<string, unknown>) => ({
                    id: String(r["id"]),
                    text: String(r["text"]),
                    funnelStage: normalizeFunnel(r["funnel_stage"]),
                    status: String(r["status"] ?? "candidate"),
                  })));
                  setNewPrompt("");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Prompt eklenemedi.");
                }
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Ekle
            </Button>
          </div>
        </div>
      </WizardFrame>
    );
  }

  if (step === 5) {
    return (
      <WizardFrame
        step={5}
        total={TOTAL_STEPS}
        title="Rakiplerinizi gözden geçirin ✨"
        subtitle="Bu rakipler pazar konumunuzu karşılaştırmak için kullanılır. Alan adı girmeniz atıf eşleşmesini güçlendirir."
        footer={
          <>
            <Button variant="outline" onClick={() => setStep(4)} disabled={busy}><ArrowLeft className="mr-1.5 h-4 w-4" /> Geri</Button>
            <Button onClick={saveCompetitorsAndLoadEngines} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Devam et <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </>
        }
      >
        {maxCompetitors > 0 ? (
          <p className="text-xs text-muted-foreground">Planınızda {maxCompetitors} rakip takip edebilirsiniz · {competitors.length} seçili</p>
        ) : null}
        <div className="space-y-2">
          {competitors.map((entry, index) => (
            <div key={`${entry.name}-${index}`} className="flex flex-col gap-2 rounded-lg border border-border p-2 sm:flex-row sm:items-center">
              <Input
                value={entry.name}
                placeholder="Rakip adı"
                onChange={(e) => {
                  const next = [...competitors];
                  next[index] = { ...entry, name: e.target.value };
                  setCompetitors(next);
                }}
              />
              <Input
                value={entry.domain}
                placeholder="rakip.com"
                onChange={(e) => {
                  const next = [...competitors];
                  next[index] = { ...entry, domain: e.target.value };
                  setCompetitors(next);
                }}
              />
              <Select
                value={entry.type}
                onValueChange={(value) => {
                  const next = [...competitors];
                  next[index] = { ...entry, type: value as CompetitorType };
                  setCompetitors(next);
                }}
              >
                <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">{COMPETITOR_TYPE_LABEL.direct}</SelectItem>
                  <SelectItem value="indirect">{COMPETITOR_TYPE_LABEL.indirect}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" aria-label="Rakibi kaldır" onClick={() => setCompetitors(competitors.filter((_, i) => i !== index))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {competitors.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Henüz rakip yok, aşağıdan ekleyin.</p> : null}
        </div>

        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <p className="text-sm font-medium">Yeni rakip ekle</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={newCompetitor.name} onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })} placeholder="Rakip adı" />
            <Input value={newCompetitor.domain} onChange={(e) => setNewCompetitor({ ...newCompetitor, domain: e.target.value })} placeholder="rakip.com" />
            <Select value={newCompetitor.type} onValueChange={(v) => setNewCompetitor({ ...newCompetitor, type: v as CompetitorType })}>
              <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">{COMPETITOR_TYPE_LABEL.direct}</SelectItem>
                <SelectItem value="indirect">{COMPETITOR_TYPE_LABEL.indirect}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={competitorQuotaFull}
              onClick={() => {
                const name = newCompetitor.name.trim();
                const dom = cleanDomain(newCompetitor.domain);
                if (!name && !dom) { toast.info("Rakip adı veya alan adı girin."); return; }
                if (competitorQuotaFull) {
                  toast.error("Plan limitiniz doldu. Daha fazla rakip için planınızı yükseltin.");
                  return;
                }
                setCompetitors([...competitors, { name: name || dom, domain: dom, type: newCompetitor.type }]);
                setNewCompetitor({ name: "", domain: "", type: "direct" });
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Ekle
            </Button>
          </div>
          {competitorQuotaFull ? (
            <p className="text-xs text-destructive">Plan limitiniz dolu. Yeni rakip eklemek için bir rakibi kaldırın veya planınızı yükseltin.</p>
          ) : null}
        </div>
      </WizardFrame>
    );
  }

  return (
    <WizardFrame
      step={6}
      total={TOTAL_STEPS}
      title="Yapay zeka motorlarını seçin ✨"
      subtitle="Markanızın görünürlüğünü hangi motorlarda takip edeceğimizi seçin. Birden fazla motor seçebilirsiniz."
      footer={
        <>
          <Button variant="outline" onClick={() => setStep(5)} disabled={busy}><ArrowLeft className="mr-1.5 h-4 w-4" /> Geri</Button>
          <Button onClick={finish} disabled={busy || engines.length === 0}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
            Kurulumu tamamla
          </Button>
        </>
      }
    >
      <p className="text-center text-sm text-muted-foreground">{engines.length} / {ENGINES.length} motor izleniyor</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ENGINES.map((engine) => {
          const active = engines.includes(engine.key);
          return (
            <button
              key={engine.key}
              type="button"
              onClick={() => setEngines(active ? engines.filter((e) => e !== engine.key) : [...engines, engine.key])}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
            >
              <Sparkles className={`mt-0.5 h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{engine.name}</span>
                <span className="block text-xs text-muted-foreground">{engine.description}</span>
              </span>
              {active ? <Badge variant="secondary" className="ml-auto shrink-0">Seçili</Badge> : null}
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Kurulumu tamamladığınızda ilk ölçümünüz otomatik başlar ve skorunuz, atıf kaynaklarınız ve ilk görevleriniz oluşur.
      </p>
    </WizardFrame>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
