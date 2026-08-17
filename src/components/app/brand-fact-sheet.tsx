import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Save, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getBrandIntelligence, generateBrandIntelligence, saveBrandIntelligence } from "@/lib/panel.functions";

const toList = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
const fromList = (value: unknown) => (Array.isArray(value) ? value.map((v) => (typeof v === "string" ? v : (v as any)?.name ?? "")).filter(Boolean).join("\n") : "");

/** Marka zekasinda kullanilan bilgi seti: musteri gorur ve duzenleyebilir. */
export function BrandFactSheet({ brandId }: { brandId: string }) {
  const queryClient = useQueryClient();
  const load = useServerFn(getBrandIntelligence);
  const save = useServerFn(saveBrandIntelligence);
  const regenerate = useServerFn(generateBrandIntelligence);
  const key = ["brand-intelligence", brandId];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => load({ data: { brandId } }) });

  const [form, setForm] = useState({
    summary: "", detailedDescription: "", positioning: "", tone: "",
    industry: "", language: "", location: "",
    products: "", audiences: "", keyFeatures: "", keywords: "",
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      summary: data.summary ?? "",
      detailedDescription: (data as any).detailed_description ?? "",
      positioning: data.positioning ?? "",
      tone: data.tone ?? "",
      industry: (data as any).industry ?? "",
      language: (data as any).language ?? "",
      location: (data as any).location ?? "",
      products: fromList(data.products),
      audiences: fromList(data.audiences),
      keyFeatures: fromList((data as any).key_features),
      keywords: fromList(data.keywords),
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => save({
      data: {
        brandId,
        summary: form.summary,
        positioning: form.positioning,
        tone: form.tone,
        products: toList(form.products),
        audiences: toList(form.audiences),
        keywords: toList(form.keywords),
        industry: form.industry,
        language: form.language,
        location: form.location,
        detailedDescription: form.detailedDescription,
        keyFeatures: toList(form.keyFeatures),
      },
    }),
    onSuccess: () => {
      toast.success("Bilgi seti güncellendi. Sonraki ölçüm ve içerik üretimi bunu kullanır.");
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const regenMutation = useMutation({
    mutationFn: () => regenerate({ data: { brandId } }),
    onSuccess: () => { toast.success("Bilgi seti sitenizden yeniden çıkarıldı"); void queryClient.invalidateQueries({ queryKey: key }); },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…</p>;
  }

  const field = (label: string, name: keyof typeof form, hint?: string, rows = 0) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {rows ? (
        <Textarea rows={rows} value={form[name]} onChange={(event) => setForm((prev) => ({ ...prev, [name]: event.target.value }))} />
      ) : (
        <Input value={form[name]} onChange={(event) => setForm((prev) => ({ ...prev, [name]: event.target.value }))} />
      )}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 space-y-0 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Marka zekası bilgi seti</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Ölçüm, prompt keşfi ve içerik üretimi bu bilgileri kullanır. Yanlış bir şey varsa düzeltin.
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={regenMutation.isPending} onClick={() => regenMutation.mutate()}>
          {regenMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          Siteden yeniden çıkar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {field("Sektör", "industry")}
          {field("Dil", "language")}
          {field("Konum", "location")}
        </div>
        {field("Kısa özet", "summary", "Yapay zekaya markanızı bir paragrafta anlatan metin.", 3)}
        {field("Detaylı açıklama", "detailedDescription", undefined, 4)}
        <div className="grid gap-4 md:grid-cols-2">
          {field("Konumlandırma", "positioning", undefined, 3)}
          {field("Ton", "tone", undefined, 3)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {field("Ürün / hizmetler", "products", "Her satıra bir madde.", 4)}
          {field("Hedef kitleler", "audiences", "Her satıra bir madde.", 4)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {field("Öne çıkan özellikler", "keyFeatures", "Her satıra bir madde.", 4)}
          {field("Anahtar kelimeler", "keywords", "Her satıra bir madde.", 4)}
        </div>
        <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Bilgi setini kaydet
        </Button>
      </CardContent>
    </Card>
  );
}
