import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, BookOpen, Gauge, KanbanSquare, LifeBuoy, Mail, PenSquare, Plug, Sparkles, Waypoints,
} from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/app/help")({
  head: () => ({
    meta: [
      { title: "Yardım & Rehber — OneCite Paneli" },
      { name: "description", content: "OneCite panelini adım adım kullanma rehberi, sık sorulan sorular ve destek." },
      { property: "og:title", content: "Yardım & Rehber — OneCite Paneli" },
      { property: "og:description", content: "Panel kullanım rehberi ve destek." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HelpPage,
});

const steps = [
  {
    icon: Sparkles,
    title: "1. Markanı kur",
    body: "Kurulum sihirbazında marka adını, alan adını ve kısa tanımını gir. OneCite site içeriğini analiz edip marka profilini çıkarır.",
    to: "/app/onboarding",
    cta: "Kuruluma git",
  },
  {
    icon: Gauge,
    title: "2. Promptları seç",
    body: "Müşterilerinin yapay zekaya sorduğu soruları üretiriz. Planına uyan sayıda soruyu takibe al; istediğin zaman değiştirebilirsin.",
    to: "/app/prompt-discovery",
    cta: "Prompt keşfi",
  },
  {
    icon: Plug,
    title: "3. Hesaplarını bağla",
    body: "Google Search Console, GA4 ve Bing Webmaster Tools'u bağla. Yapay zekadan gelen gerçek trafiği böyle görürsün.",
    to: "/app/integrations",
    cta: "Entegrasyonlar",
  },
  {
    icon: BookOpen,
    title: "4. Kanıt yükle",
    body: "Bilgi bankasına dokümanlarını, SSS'lerini ve marka iddialarını ekle. Kanıtsız iddia yapay zeka cevaplarında kaynak gösterilmez.",
    to: "/app/knowledge-base",
    cta: "Bilgi bankası",
  },
  {
    icon: Waypoints,
    title: "5. Ölçümü çalıştır",
    body: "Ölçüm & Skor ekranından çalıştır. OneCite Score, AI kaynak payını beş bileşene bölerek nerede kaybettiğini söyler.",
    to: "/app/measurement",
    cta: "Ölçüm & Skor",
  },
  {
    icon: KanbanSquare,
    title: "6. Görevleri tamamla",
    body: "Ölçümden çıkan öncelikli aksiyonları görevlere dönüştür, tamamla ve bir sonraki ölçümde etkisini gör.",
    to: "/app/geo-tasks",
    cta: "Görevler",
  },
];

const glossary = [
  { term: "OneCite Score", desc: "Bahsedilme, AI kaynak payı, sıralama kalitesi, kanıt kapsamı ve iddia kanıtından oluşan 0–100 arası görünürlük skoru." },
  { term: "Kaynak gösterimi (citation)", desc: "Yapay zeka cevabında kaynak olarak gösterilen bağlantı. Kendi alan adın geçiyorsa AI kaynak payın artar." },
  { term: "Prompt", desc: "Takip ettiğin soru. Her ölçümde bu soru gerçek yapay zeka motorlarına sorulur ve yanıt kaydedilir." },
  { term: "GEO", desc: "Generative Engine Optimization — üreten motor optimizasyonu. Klasik SEO'nun yapay zeka cevapları için karşılığı." },
  { term: "Kanıt boşluğu", desc: "Yapay zekanın seni önermesi için ihtiyaç duyduğu ama sitende bulamadığı bilgi." },
  { term: "Marka Zekası", desc: "Bilgi bankan ve entegrasyonlarındaki verinin vektörlenmiş hali. Tüm ölçüm ve içerik üretimi buradan beslenir." },
];

const faq = [
  { q: "Ölçüm ne sıklıkla çalışıyor?", a: "Planına göre haftalık veya günlük olarak otomatik çalışır. Dilediğin zaman Ölçüm & Skor ekranından manuel de başlatabilirsin." },
  { q: "Skorum neden düşük çıktı?", a: "En sık neden kanıt eksikliğidir: yapay zeka seni önerecek somut bilgiyi sitende bulamıyor. OneCite Score kartındaki en düşük bileşene tıklayıp ilgili ekrandan aksiyona geç." },
  { q: "Rakiplerimi nasıl ekliyorum?", a: "Rakip Takibi ekranından alan adıyla ekleyebilir ya da sorgu sonuçlarında çıkan aday rakipleri tek tıkla takibe alabilirsin. Takip edilebilecek rakip sayısı planına bağlıdır." },
  { q: "Google hesabımı bağlamak zorunda mıyım?", a: "Hayır, ama bağlamadan yapay zekadan gelen gerçek trafiği ve dönüşümü göremezsin. Her marka kendi hesabını bağlar, veriler markalar arasında karışmaz." },
  { q: "Prompt limitimi aştım, ne olur?", a: "Yeni prompt ekleyemezsin; mevcut promptların ölçülmeye devam eder. Plan yükselttiğinde limit anında güncellenir." },
  { q: "Üretilen içeriği doğrudan yayınlayabilir miyim?", a: "Taslak kendi bilgi bankan ve marka iddialarınla üretilir, ancak yayından önce insan kontrolünden geçirmeni öneririz." },
];

function HelpPage() {
  return (
    <div className="space-y-6">
      <PanelPageHeading
        meta={{
          title: "Yardım & Rehber",
          description: "OneCite'ı ilk kez kullanıyorsan bu sıra ile ilerle. Her adım bir sonrakini besler.",
          icon: LifeBuoy,
        }}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[15px]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="text-[13px] leading-6 text-muted-foreground">{step.body}</p>
                <Button asChild variant="outline" size="sm" className="self-start">
                  <Link to={step.to}>
                    {step.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-[15px]">Sık sorulan sorular</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faq.map((item, index) => (
                <AccordionItem key={item.q} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-[13px]">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-[13px] leading-6 text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Terimler sözlüğü</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {glossary.map((item) => (
                <div key={item.term}>
                  <p className="text-[13px] font-bold text-foreground">{item.term}</p>
                  <p className="text-[12px] leading-5 text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <LifeBuoy className="h-4 w-4 text-primary" /> Destek
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[13px] leading-6 text-muted-foreground">
                Takıldığın bir yer mi var? Ekranın adını ve ne yapmaya çalıştığını yaz, aynı iş günü içinde dönüyoruz.
              </p>
              <Button asChild size="sm">
                <a href="mailto:destek@1cite.com">
                  <Mail className="mr-1.5 h-3.5 w-3.5" /> destek@1cite.com
                </a>
              </Button>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/app/content"><PenSquare className="mr-1.5 h-3.5 w-3.5" /> İçerik üretimi</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/app/pricing">Planı yükselt</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
