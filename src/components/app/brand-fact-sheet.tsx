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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getBrandIntelligence,
  generateBrandIntelligence,
  saveBrandIntelligence,
} from "@/lib/panel.functions";

const toList = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
const fromList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((v) => (typeof v === "string" ? v : ((v as any)?.name ?? "")))
        .filter(Boolean)
        .join("\n")
    : "";
const fromObjectField = (value: unknown, key: string) =>
  value && typeof value === "object"
    ? (((value as Record<string, unknown>)[key] as string | undefined) ?? "")
    : "";

const SCOPE_OPTIONS = [
  "Global",
  "Birincil pazar (uluslararası erişimle)",
  "Ülke geneli",
  "Bölgesel",
  "Yerel",
];
const CONTENT_OWNER_OPTIONS = ["İnsan incelemesi", "Otomatik + insan", "Otomatik"];
const REVIEW_CADENCE_OPTIONS = ["Sürekli", "Aylık", "Üç aylık"];
const EXPERIENCE_ROLE_OPTIONS = [
  "Ürün geliştirici",
  "Operatör",
  "Araştırmacı",
  "Uygulayıcı",
  "Danışman",
];
const SCHEMA_TYPES = ["Organization", "Person", "Article", "FAQ", "HowTo", "Product", "Dataset"];

const EMPTY_FORM = {
  summary: "",
  detailedDescription: "",
  positioning: "",
  tone: "",
  industry: "",
  language: "",
  location: "",
  products: "",
  audiences: "",
  keyFeatures: "",
  keywords: "",
  scope: "",
  voiceNotes: "",
  socialTwitter: "",
  socialLinkedin: "",
  socialFacebook: "",
  socialInstagram: "",
  socialYoutube: "",
  socialTiktok: "",
  socialGithub: "",
  socialOther: "",
  namingAliases: "",
  namingExcludeTerms: "",
  contentOwnerType: "",
  reviewCadence: "",
  authorProfiles: "",
  experienceRoleType: "",
  experienceMethodologies: "",
  leadership: "",
  partnerships: "",
  externalRecognition: "",
  dataSourcingNotes: "",
  factCheckingNotes: "",
  disclosurePolicy: "",
  contentTypeFocus: "",
  updateTriggers: "",
  contactEditorial: "",
  contactAccessibility: "",
  contactPrivacy: "",
  testimonials: "",
  thirdPartyReviews: "",
  externalCitations: "",
  aiDisclosureNote: "",
};

/** Marka zekasinda kullanilan bilgi seti: musteri gorur ve duzenleyebilir. */
export function BrandFactSheet({ brandId }: { brandId: string }) {
  const queryClient = useQueryClient();
  const load = useServerFn(getBrandIntelligence);
  const save = useServerFn(saveBrandIntelligence);
  const regenerate = useServerFn(generateBrandIntelligence);
  const key = ["brand-intelligence", brandId];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => load({ data: { brandId } }),
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [aliasCaseSensitive, setAliasCaseSensitive] = useState(false);
  const [defaultSchemaTypes, setDefaultSchemaTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    const d = data as any;
    setForm({
      summary: data.summary ?? "",
      detailedDescription: d.detailed_description ?? "",
      positioning: data.positioning ?? "",
      tone: data.tone ?? "",
      industry: d.industry ?? "",
      language: d.language ?? "",
      location: d.location ?? "",
      products: fromList(data.products),
      audiences: fromList(data.audiences),
      keyFeatures: fromList(d.key_features),
      keywords: fromList(data.keywords),
      scope: d.scope ?? "",
      voiceNotes: d.voice_notes ?? "",
      socialTwitter: fromObjectField(d.social_links, "twitter"),
      socialLinkedin: fromObjectField(d.social_links, "linkedin"),
      socialFacebook: fromObjectField(d.social_links, "facebook"),
      socialInstagram: fromObjectField(d.social_links, "instagram"),
      socialYoutube: fromObjectField(d.social_links, "youtube"),
      socialTiktok: fromObjectField(d.social_links, "tiktok"),
      socialGithub: fromObjectField(d.social_links, "github"),
      socialOther: fromObjectField(d.social_links, "other"),
      namingAliases: fromList(d.naming_aliases),
      namingExcludeTerms: fromList(d.naming_exclude_terms),
      contentOwnerType: d.content_owner_type ?? "",
      reviewCadence: d.review_cadence ?? "",
      authorProfiles: fromList(d.author_profiles),
      experienceRoleType: d.experience_role_type ?? "",
      experienceMethodologies: fromList(d.experience_methodologies),
      leadership: fromList(d.leadership),
      partnerships: fromList(d.partnerships),
      externalRecognition: fromList(d.external_recognition),
      dataSourcingNotes: d.data_sourcing_notes ?? "",
      factCheckingNotes: d.fact_checking_notes ?? "",
      disclosurePolicy: d.disclosure_policy ?? "",
      contentTypeFocus: fromList(d.content_type_focus),
      updateTriggers: fromList(d.update_triggers),
      contactEditorial: fromObjectField(d.contact_points, "editorial"),
      contactAccessibility: fromObjectField(d.contact_points, "accessibility"),
      contactPrivacy: fromObjectField(d.contact_points, "privacy"),
      testimonials: fromList(d.testimonials),
      thirdPartyReviews: fromList(d.third_party_reviews),
      externalCitations: fromList(d.external_citations),
      aiDisclosureNote: d.ai_disclosure_note ?? "",
    });
    setAliasCaseSensitive(Boolean(d.alias_case_sensitive));
    setDefaultSchemaTypes(Array.isArray(d.default_schema_types) ? d.default_schema_types : []);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
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
          scope: form.scope,
          voiceNotes: form.voiceNotes,
          socialLinks: {
            twitter: form.socialTwitter,
            linkedin: form.socialLinkedin,
            facebook: form.socialFacebook,
            instagram: form.socialInstagram,
            youtube: form.socialYoutube,
            tiktok: form.socialTiktok,
            github: form.socialGithub,
            other: form.socialOther,
          },
          namingAliases: toList(form.namingAliases),
          namingExcludeTerms: toList(form.namingExcludeTerms),
          aliasCaseSensitive,
          contentOwnerType: form.contentOwnerType,
          reviewCadence: form.reviewCadence,
          authorProfiles: toList(form.authorProfiles),
          experienceRoleType: form.experienceRoleType,
          experienceMethodologies: toList(form.experienceMethodologies),
          leadership: toList(form.leadership),
          partnerships: toList(form.partnerships),
          externalRecognition: toList(form.externalRecognition),
          dataSourcingNotes: form.dataSourcingNotes,
          factCheckingNotes: form.factCheckingNotes,
          disclosurePolicy: form.disclosurePolicy,
          contentTypeFocus: toList(form.contentTypeFocus),
          updateTriggers: toList(form.updateTriggers),
          contactPoints: {
            editorial: form.contactEditorial,
            accessibility: form.contactAccessibility,
            privacy: form.contactPrivacy,
          },
          defaultSchemaTypes,
          testimonials: toList(form.testimonials),
          thirdPartyReviews: toList(form.thirdPartyReviews),
          externalCitations: toList(form.externalCitations),
          aiDisclosureNote: form.aiDisclosureNote,
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
    onSuccess: () => {
      toast.success("Bilgi seti sitenizden yeniden çıkarıldı");
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
      </p>
    );
  }

  const field = (label: string, name: keyof typeof form, hint?: string, rows = 0) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {rows ? (
        <Textarea
          rows={rows}
          value={form[name]}
          onChange={(event) => setForm((prev) => ({ ...prev, [name]: event.target.value }))}
        />
      ) : (
        <Input
          value={form[name]}
          onChange={(event) => setForm((prev) => ({ ...prev, [name]: event.target.value }))}
        />
      )}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );

  const selectField = (label: string, name: keyof typeof form, options: string[]) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        value={form[name]}
        onValueChange={(value) => setForm((prev) => ({ ...prev, [name]: value }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Seçin" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 space-y-0 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Marka zekası bilgi seti</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Ölçüm, prompt keşfi ve içerik üretimi bu bilgileri kullanır. Yanlış bir şey varsa
            düzeltin.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={regenMutation.isPending}
          onClick={() => regenMutation.mutate()}
        >
          {regenMutation.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-4 w-4" />
          )}
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

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-medium">Kimlik & marka sesi</p>
          <div className="grid gap-4 md:grid-cols-2">
            {selectField("Etki alanı", "scope", SCOPE_OPTIONS)}
            {field(
              "Marka sesi notları",
              "voiceNotes",
              "Ton, kelime seçimi, kaçınılması gerekenler.",
            )}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            {field("Twitter / X", "socialTwitter")}
            {field("LinkedIn", "socialLinkedin")}
            {field("Facebook", "socialFacebook")}
            {field("Instagram", "socialInstagram")}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            {field("YouTube", "socialYoutube")}
            {field("TikTok", "socialTiktok")}
            {field("GitHub", "socialGithub")}
            {field("Diğer", "socialOther")}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {field(
              "Marka takma adları / kısaltmaları",
              "namingAliases",
              "Görünürlük raporlarında markanız sayılacak isimler. Her satıra bir madde.",
              3,
            )}
            {field(
              "Hariç tutulacak isimler",
              "namingExcludeTerms",
              "Benzer ama markanız olmayan isimler. Her satıra bir madde.",
              3,
            )}
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={aliasCaseSensitive}
              onCheckedChange={(checked) => setAliasCaseSensitive(checked === true)}
            />
            Sadece markanızla aynı yazım/büyük-küçük harfe sahip bahisleri say
          </label>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-medium">Deneyim & uzmanlık (E-E-A-T)</p>
          <div className="grid gap-4 md:grid-cols-2">
            {selectField(
              "İçerik sahipliği / incelemesi",
              "contentOwnerType",
              CONTENT_OWNER_OPTIONS,
            )}
            {selectField("İnceleme sıklığı", "reviewCadence", REVIEW_CADENCE_OPTIONS)}
          </div>
          {field(
            "Yazar profilleri",
            "authorProfiles",
            "Her satıra bir yazar: isim, rol, kimlik bilgisi, URL.",
            3,
          )}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {selectField("Deneyim rolü", "experienceRoleType", EXPERIENCE_ROLE_OPTIONS)}
            {field(
              "Metodolojiler",
              "experienceMethodologies",
              "Analiz, deneysel test, kıyaslama vb. Her satıra bir madde.",
              3,
            )}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {field("Liderlik", "leadership", "Her satıra bir madde.", 3)}
            {field("Ortaklıklar", "partnerships", "Her satıra bir madde.", 3)}
          </div>
          {field("Dış tanınırlık / ödüller", "externalRecognition", "Her satıra bir madde.", 3)}
          <div className="mt-4 grid gap-4 md:grid-cols-1">
            {field("Veri kaynağı notları", "dataSourcingNotes")}
            {field("Doğrulama / fact-checking notları", "factCheckingNotes")}
            {field("Açıklama (disclosure) politikası", "disclosurePolicy")}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-medium">İçerik & şema</p>
          <div className="grid gap-4 md:grid-cols-2">
            {field(
              "İçerik türü odağı",
              "contentTypeFocus",
              "Ürün, sektör, araştırma vb. Her satıra bir madde.",
              3,
            )}
            {field(
              "Güncelleme tetikleyicileri",
              "updateTriggers",
              "Ürün değişikliği, yeni veri, mevzuat vb. Her satıra bir madde.",
              3,
            )}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {field("Editöryal iletişim", "contactEditorial")}
            {field("Erişilebilirlik iletişimi", "contactAccessibility")}
            {field("Gizlilik iletişimi", "contactPrivacy")}
          </div>
          <div className="mt-4 space-y-1.5">
            <Label className="text-xs">Varsayılan şema (schema.org) türleri</Label>
            <div className="flex flex-wrap gap-3">
              {SCHEMA_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={defaultSchemaTypes.includes(type)}
                    onCheckedChange={(checked) =>
                      setDefaultSchemaTypes((prev) =>
                        checked === true ? [...prev, type] : prev.filter((t) => t !== type),
                      )
                    }
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {field("Referanslar / müşteri yorumları", "testimonials", "Her satıra bir madde.", 3)}
            {field("Üçüncü taraf incelemeler", "thirdPartyReviews", "Her satıra bir madde.", 3)}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {field("Dış atıflar", "externalCitations", "Her satıra bir madde.", 3)}
            {field("AI açıklama (disclosure) notu", "aiDisclosureNote")}
          </div>
        </div>

        <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Bilgi setini kaydet
        </Button>
      </CardContent>
    </Card>
  );
}
