import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  addKnowledgeSources,
  completeOnboarding,
  createBrand,
  generateBrandIntelligence,
  generatePromptCandidates,
  listPrompts,
  getBrandIntelligence,
  saveBrandIntelligence,
  setPromptStatus,
  getPlanUsage,
  suggestKnowledgeSources,
} from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/onboarding")({
  head: () => ({
    meta: [
      { title: "Kurulum — OneCite Paneli" },
      { name: "description", content: "Markanızı ekleyin, marka zekâsını onaylayın, bilgi bankasını doldurun ve promptları seçin." },
      { property: "og:title", content: "Kurulum — OneCite Paneli" },
      { property: "og:description", content: "Dört adımda AI görünürlük kurulumu." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = [
  { n: 1, title: "Marka", hint: "Hangi markayı takip edeceğiz? Tek alan yeterli." },
  { n: 2, title: "Marka profili", hint: "Sitenizi okuduk: özeti ve kanıt sayfalarını onaylayın." },
  { n: 3, title: "Promptlar", hint: "AI cevaplarında görünmeniz gereken sorular." },
] as const;

type Intel = {
  summary: string; positioning: string; tone: string;
  products: string[]; audiences: string[]; competitors: string[]; keywords: string[];
};

const EMPTY_INTEL: Intel = { summary: "", positioning: "", tone: "", products: [], audiences: [], competitors: [], keywords: [] };

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [];
}

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { brand, brands, isLoading, selectBrand } = useActiveBrand();
  const [step, setStep] = useState(1);
  const [forceNew, setForceNew] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!brand || forceNew) { setStep(1); return; }
    if (brand.onboarding_completed) { setStep(3); return; }
    const dbStep = Math.min(Math.max(brand.onboarding_step, 1), 4);
    setStep(dbStep <= 1 ? 1 : dbStep === 4 ? 3 : 2);
  }, [brand?.id, brand?.onboarding_step, brand?.onboarding_completed, isLoading, forceNew]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["panel-session"] });

  return (
    <>
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="font-display text-2xl font-semibold">Kurulum</h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Üç kısa adım. Her adımda biz hazırlıyoruz, siz onaylıyorsunuz — boş bir sayfaya hiçbir şey yazmanız gerekmiyor.
        </p>
        <Progress value={(step / 3) * 100} className="h-1.5" />
        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          {STEPS.map((s) => (
            <li key={s.n} className={`flex items-center gap-1.5 ${s.n === step ? "font-semibold text-foreground" : s.n < step ? "text-primary" : "text-muted-foreground"}`}>
              {s.n < step ? <Check className="h-3.5 w-3.5" /> : <span>{s.n}.</span>}
              {s.title}
            </li>
          ))}
        </ol>
      </header>

      {brands.length > 1 && step === 1 ? (
        <p className="text-xs text-muted-foreground">
          Kurulumdaki markayı değiştirmek için soldaki marka seçicisini kullanın.
        </p>
      ) : null}

      {step === 1 ? (
        <StepBrand
          onCreated={async (id) => { selectBrand(id); setForceNew(false); await refresh(); setStep(2); }}
        />
      ) : null}

      {step === 2 && brand ? (
        <StepProfile brandId={brand.id} onDone={async () => { await refresh(); setStep(3); }} onBack={() => setStep(1)} />
      ) : null}

      {step === 3 && brand ? (
        <StepPrompts
          brandId={brand.id}
          onBack={() => setStep(2)}
          onDone={async () => {
            await refresh();
            toast.success("Kurulum tamamlandı — ilk ölçüm başlatılıyor");
            navigate({ to: "/app/measurement", search: { autostart: true } });
          }}
        />
      ) : null}

      {step > 1 && brand?.onboarding_completed ? (
        <Button variant="ghost" size="sm" onClick={() => { setForceNew(true); setStep(1); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Başka bir marka ekle
        </Button>
      ) : null}
    </>
  );
}

function StepFrame({ step, children, footer }: { step: (typeof STEPS)[number]; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{step.n}. {step.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{step.hint}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {children}
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">{footer}</div>
      </CardContent>
    </Card>
  );
}

function StepBrand({ onCreated }: { onCreated: (id: string) => void | Promise<void> }) {
  const create = useServerFn(createBrand);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  const mutation = useMutation({
    mutationFn: (input: { name: string; domain: string }) => create({ data: input }),
    onSuccess: (brand) => { void onCreated(brand.id); },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <StepFrame
      step={STEPS[0]}
      footer={
        <Button onClick={() => mutation.mutate({ name, domain })} disabled={!domain.trim() || mutation.isPending}>
          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Devam et <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="brand-name">Marka adı</Label>
          <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. OneCite" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand-domain">Web siteniz</Label>
          <Input id="brand-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="1cite.com" />
          <p className="text-xs text-muted-foreground">Neden soruyoruz? Siteyi okuyup markanızı sizin yerinize tanımlıyoruz.</p>
        </div>
      </div>
    </StepFrame>
  );
}

function ListEditor({ label, items, onChange }: { label: string; items: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, index) => (
          <Badge key={`${item}-${index}`} variant="secondary" className="gap-1">
            {item}
            <button type="button" aria-label={`${item} kaldır`} onClick={() => onChange(items.filter((_, i) => i !== index))}>
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {items.length === 0 ? <span className="text-xs text-muted-foreground">Henüz yok</span> : null}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ekle ve Enter'a bas"
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) { e.preventDefault(); onChange([...items, draft.trim()]); setDraft(""); }
          }}
        />
      </div>
    </div>
  );
}

function StepProfile({ brandId, onDone, onBack }: { brandId: string; onDone: () => void | Promise<void>; onBack: () => void }) {
  const load = useServerFn(getBrandIntelligence);
  const generate = useServerFn(generateBrandIntelligence);
  const save = useServerFn(saveBrandIntelligence);
  const suggest = useServerFn(suggestKnowledgeSources);
  const addSources = useServerFn(addKnowledgeSources);
  const [intel, setIntel] = useState<Intel>(EMPTY_INTEL);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<Array<{ title: string; url: string }>>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [manualUrl, setManualUrl] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const applyRow = (row: Awaited<ReturnType<typeof load>>) => {
    if (!row) return;
    setIntel({
      summary: row.summary ?? "", positioning: row.positioning ?? "", tone: row.tone ?? "",
      products: toList(row.products), audiences: toList(row.audiences),
      competitors: toList(row.competitors), keywords: toList(row.keywords),
    });
  };

  // Sadece kayıtlı veriyi okur. Yapay zekâ çağrıları butonla tetiklenir.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load({ data: { brandId } })
      .then((row) => {
        if (cancelled) return;
        applyRow(row);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [brandId]);

  const analyze = useMutation({
    mutationFn: async () => {
      const row = await generate({ data: { brandId } });
      const suggested = await suggest({ data: { brandId } }).catch(() => []);
      return { row, suggested };
    },
    onSuccess: ({ row, suggested }) => {
      applyRow(row);
      setSources(suggested);
      setPicked(Object.fromEntries(suggested.map((s) => [s.url, true])));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const approve = useMutation({
    mutationFn: async () => {
      await save({ data: { brandId, ...intel } });
      const items = sources.filter((s) => picked[s.url]).map((s) => ({ title: s.title, url: s.url }));
      if (items.length) await addSources({ data: { brandId, items } });
    },
    onSuccess: () => { void onDone(); },
    onError: (error: Error) => toast.error(error.message),
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Kayıtlı marka bilgileri yükleniyor…
        </CardContent>
      </Card>
    );
  }

  if (!intel.summary && !analyze.isPending) {
    return (
      <StepFrame
        step={STEPS[1]}
        footer={
          <>
            <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" /> Geri</Button>
            <Button onClick={() => analyze.mutate()}>Siteyi analiz et <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Hazır olduğunuzda sitenizi okuyup marka özeti, ürünler, hedef kitle ve rakip listesini çıkaralım.
          Bu adım yapay zekâ kullanır ve yalnızca siz başlattığınızda çalışır.
        </p>
      </StepFrame>
    );
  }

  if (analyze.isPending && !intel.summary) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Siteniz okunuyor ve marka özeti çıkarılıyor…
        </CardContent>
      </Card>
    );
  }

  const pickedCount = sources.filter((s) => picked[s.url]).length;

  return (
    <StepFrame
      step={STEPS[1]}
      footer={
        <>
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" /> Geri</Button>
          <Button variant="outline" onClick={() => analyze.mutate()} disabled={analyze.isPending}>
            {analyze.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {intel.summary ? "Yeniden çıkar" : "Siteyi analiz et"}
          </Button>
          <Button onClick={() => approve.mutate()} disabled={approve.isPending}>
            {approve.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Onayla ve devam et <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="intel-summary">Marka özeti</Label>
        <Textarea id="intel-summary" rows={3} value={intel.summary} onChange={(e) => setIntel({ ...intel, summary: e.target.value })} />
        <p className="text-xs text-muted-foreground">Yanlış bir şey varsa doğrudan düzeltebilirsiniz — ölçüm bu özete göre kurgulanır.</p>
      </div>

      <div className="space-y-4 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Kanıt sayfaları</p>
            <p className="text-xs text-muted-foreground">{pickedCount} sayfa seçili — AI cevaplarında kaynak gösterilmesini istediğiniz sayfalar.</p>
          </div>
        </div>
        <div className="max-h-64 divide-y divide-border overflow-auto rounded-md border border-border">
          {sources.map((item) => (
            <label key={item.url} className="flex cursor-pointer items-start gap-3 p-2.5 text-sm">
              <Checkbox checked={Boolean(picked[item.url])} onCheckedChange={(value) => setPicked({ ...picked, [item.url]: value === true })} />
              <span className="min-w-0">
                <span className="block font-medium">{item.title}</span>
                <span className="block truncate font-mono text-xs text-muted-foreground">{item.url}</span>
              </span>
            </label>
          ))}
          {sources.length === 0 ? <p className="p-2.5 text-sm text-muted-foreground">Öneri bulunamadı, aşağıdan elle ekleyin.</p> : null}
        </div>
        <div className="flex gap-2">
          <Input value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="https://…" aria-label="Kendi sayfanızı ekleyin" />
          <Button
            variant="outline"
            onClick={() => {
              const url = manualUrl.trim();
              if (!url) return;
              setSources([{ title: url.replace(/^https?:\/\//, ""), url }, ...sources]);
              setPicked({ ...picked, [url]: true });
              setManualUrl("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={() => setShowDetails((v) => !v)}>
        {showDetails ? "Ayrıntıları gizle" : "Ayrıntıları düzenle (konumlandırma, kitle, rakipler)"}
      </Button>

      {showDetails ? (
      <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="intel-positioning">Konumlandırma</Label>
          <Textarea id="intel-positioning" rows={2} value={intel.positioning} onChange={(e) => setIntel({ ...intel, positioning: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="intel-tone">Ses tonu</Label>
          <Textarea id="intel-tone" rows={2} value={intel.tone} onChange={(e) => setIntel({ ...intel, tone: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListEditor label="Ürün / hizmetler" items={intel.products} onChange={(products) => setIntel({ ...intel, products })} />
        <ListEditor label="Hedef kitle" items={intel.audiences} onChange={(audiences) => setIntel({ ...intel, audiences })} />
        <ListEditor label="Rakipler" items={intel.competitors} onChange={(competitors) => setIntel({ ...intel, competitors })} />
        <ListEditor label="Anahtar konular" items={intel.keywords} onChange={(keywords) => setIntel({ ...intel, keywords })} />
      </div>
      </>
      ) : null}
    </StepFrame>
  );
}

function StepPrompts({ brandId, onDone, onBack }: { brandId: string; onDone: () => void | Promise<void>; onBack: () => void }) {
  const generate = useServerFn(generatePromptCandidates);
  const setStatus = useServerFn(setPromptStatus);
  const complete = useServerFn(completeOnboarding);
  const [prompts, setPrompts] = useState<Array<{ id: string; text: string; category: string }>>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const listAll = useServerFn(listPrompts);
  const [loading, setLoading] = useState(true);
  const planUsage = useServerFn(getPlanUsage);
  const [plan, setPlan] = useState<{ planLabel: string; maxPrompts: number; approvedPrompts: number } | null>(null);

  useEffect(() => {
    planUsage({ data: { brandId } })
      .then((usage) => setPlan(usage))
      .catch(() => undefined);
  }, [brandId]);

  const quota = plan && plan.maxPrompts > 0 ? Math.max(0, plan.maxPrompts - plan.approvedPrompts) : Infinity;

  const applyRows = (rows: Array<{ id: string; text: string; category: string }>) => {
    const list = rows.map((r) => ({ id: r.id, text: r.text, category: r.category }));
    setPrompts(list);
    setSelected(Object.fromEntries(list.map((r, index) => [r.id, index < quota])));
  };

  // Kayıtlı adayları okur; yeni üretim yalnızca butonla tetiklenir.
  useEffect(() => {
    let cancelled = false;
    listAll({ data: { brandId } })
      .then((rows) => { if (!cancelled) { applyRows(rows); setLoading(false); } })
      .catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [brandId]);

  const produce = useMutation({
    mutationFn: () => generate({ data: { brandId } }),
    onSuccess: (rows) => applyRows(rows),
    onError: (error: Error) => toast.error(error.message),
  });

  const finish = useMutation({
    mutationFn: async () => {
      const approved = prompts.filter((p) => selected[p.id]).map((p) => p.id);
      const rejected = prompts.filter((p) => !selected[p.id]).map((p) => p.id);
      if (approved.length) await setStatus({ data: { ids: approved, status: "approved" } });
      if (rejected.length) await setStatus({ data: { ids: rejected, status: "inactive" } });
      await complete({ data: { brandId } });
    },
    onSuccess: () => { void onDone(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const count = prompts.filter((p) => selected[p.id]).length;
  const overQuota = count > quota;

  const toggle = (id: string, value: boolean) => {
    if (value && count >= quota) {
      toast.error(
        `${plan?.planLabel ?? "Mevcut"} planınızda en fazla ${plan?.maxPrompts} prompt izlenebilir. Planınızı yükselterek daha fazla soru ekleyebilirsiniz.`,
      );
      return;
    }
    setSelected({ ...selected, [id]: value });
  };

  return (
    <StepFrame
      step={STEPS[2]}
      footer={
        <>
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" /> Geri</Button>
          <Button variant="outline" onClick={() => produce.mutate()} disabled={produce.isPending}>
            {produce.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {prompts.length ? "Yeniden üret" : "Soruları üret"}
          </Button>
          <Button onClick={() => finish.mutate()} disabled={count === 0 || overQuota || finish.isPending}>
            {finish.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {count} promptu onayla ve kurulumu bitir <Check className="ml-1.5 h-4 w-4" />
          </Button>
        </>
      }
    >
      {loading || produce.isPending ? (
        <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Sorular hazırlanıyor…
        </p>
      ) : (
        <>
          {plan ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                <strong className="text-foreground">{plan.planLabel}</strong> planı ·{" "}
                {plan.maxPrompts > 0 ? `${plan.maxPrompts} prompt hakkı` : "sınırsız prompt"}
                {plan.approvedPrompts > 0 ? ` · ${plan.approvedPrompts} onaylı` : ""}
              </span>
              <span className={overQuota ? "text-destructive" : "text-muted-foreground"}>
                Seçili: {count}
                {plan.maxPrompts > 0 ? ` / ${quota}` : ""}
              </span>
            </div>
          ) : null}
          <div className="flex gap-2 text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(Object.fromEntries(prompts.map((p, index) => [p.id, index < quota])))}
            >
              {quota === Infinity ? "Tümünü seç" : `İlk ${Math.min(quota, prompts.length)} tanesini seç`}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected({})}>Seçimi temizle</Button>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border">
            {prompts.map((prompt) => (
              <label key={prompt.id} className="flex cursor-pointer items-start gap-3 p-3 text-sm">
                <Checkbox
                  checked={Boolean(selected[prompt.id])}
                  onCheckedChange={(value) => toggle(prompt.id, value === true)}
                />
                <span className="min-w-0 flex-1">{prompt.text}</span>
                <Badge variant="outline" className="shrink-0 text-[10px]">{prompt.category}</Badge>
              </label>
            ))}
            {prompts.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Henüz soru yok — “Soruları üret” ile markanıza özel soruları oluşturun.</p> : null}
          </div>
        </>
      )}
    </StepFrame>
  );
}
