import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileSearch, ListChecks, Network, Search, ShieldCheck, Timer } from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";
import { VisualHero } from "@/components/site/visual-hero";
import { PublicReportAnalyzer } from "@/components/site/public-report-analyzer";
import { MarketingCta } from "@/components/site/marketing-cta";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import heroSignalAction from "@/assets/landing/hero-signal-action.webp";

const PAGE_URL = "https://1cite.com/ucretsiz-yapay-zeka-gorunurluk-raporu";
const PAGE_TITLE = "Ücretsiz Yapay Zeka Görünürlük Testi | AI Hazırlık Raporu";
const PAGE_DESCRIPTION =
  "Markanız ChatGPT, Gemini ve Perplexity cevaplarında kaynak olarak çıkıyor mu? Web sitenizi girin, ücretsiz yapay zeka görünürlük (GEO) hazırlık raporunuzu dakikalar içinde alın.";

const faqs = [
  {
    q: "Yapay zeka görünürlüğü nedir?",
    a: "Yapay zeka görünürlüğü, ChatGPT, Gemini, Perplexity ve Copilot gibi asistanların bir soruya verdiği cevapta markanızın anılması ve kaynak olarak gösterilmesidir. Klasik SEO sıralamadan farklı olarak burada ölçülen şey, cevabın içinde seçilip seçilmediğinizdir.",
  },
  {
    q: "Ücretsiz rapor tam olarak neyi ölçüyor?",
    a: "Rapor, herkese açık web sinyallerinizi tarar: sitenizin yapısal netliği, hizmet ve konu kapsamı, kanıtlanabilir iddialar, kaynak gösterilebilirlik ve yapay zekanın alıntılayabileceği içerik biçimleri. Sonuçta bir hazırlık çerçevesi ve öncelikli eksik kanıt listesi çıkar.",
  },
  {
    q: "Rapor ne kadar sürede hazır oluyor?",
    a: "Alan adınızı girdikten sonra analiz genellikle birkaç dakika içinde tamamlanır. Kredi kartı veya kurulum gerekmez.",
  },
  {
    q: "GEO ile SEO arasındaki fark ne?",
    a: "SEO, arama sonuç sayfasındaki sıranızı hedefler. GEO (üreten motor optimizasyonu) ise yapay zekanın ürettiği cevabın içinde kaynak olarak seçilmeyi hedefler. GEO'da belirleyici olan bağlantı sayısı değil; net, doğrulanabilir ve alıntılanabilir kanıttır.",
  },
  {
    q: "Ücretsiz rapordan sonra ne oluyor?",
    a: "Raporun işaret ettiği eksikleri düzenli takibe almak isterseniz OneCite panelinde soru setinizi, bilgi bankanızı ve rakip karşılaştırmanızı kurup periyodik ölçüme geçebilirsiniz. Ücretsiz plan 1 marka, 10 soru ve 2 rakip içerir.",
  },
  {
    q: "Verilerim nasıl kullanılıyor?",
    a: "Ücretsiz ölçüm yalnızca herkese açık web verilerini kullanır; sitenize erişim veya kod yerleştirme istemez. Detaylar gizlilik ve KVKK sayfalarımızda açıklanır.",
  },
];

const reportContents = [
  { icon: FileSearch, title: "Yapay zeka hazırlık özeti", body: "Sitenizin yapay zeka asistanları tarafından okunabilirlik, konu kapsamı ve kanıt netliği açısından ilk değerlendirmesi." },
  { icon: Network, title: "Atıf bağlamı", body: "Marka adınızın hangi konu ve hizmet bağlamlarıyla ilişkilendiğini, hangi kaynakların sizi temsil ettiğini görün." },
  { icon: ListChecks, title: "Eksik kanıt listesi", body: "Yapay zekanın sizi alıntılaması için gereken ama sitenizde bulunmayan kanıt başlıkları önceliklendirilir." },
  { icon: ShieldCheck, title: "Öncelikli sonraki adımlar", body: "Her düzeltmeyi değil, görünürlüğe en çok etki edecek üç uygulamayı önce görün." },
];

const steps = [
  { step: "01", title: "Alan adınızı girin", body: "Kurulum, kod veya kredi kartı yok. Yalnızca herkese açık web verileri kullanılır." },
  { step: "02", title: "Sinyaller taranır", body: "Sayfa yapısı, hizmet ve konu kapsamı, iddia-kanıt eşleşmesi ve kaynak gösterilebilirlik değerlendirilir." },
  { step: "03", title: "Raporunuzu okuyun", body: "Hazırlık özeti, eksik kanıt başlıkları ve öncelikli uygulama listesi karşınıza gelir." },
];

const questionsAnswered = [
  "ChatGPT bir kullanıcıya sektörümde öneri verirken markamı anıyor mu?",
  "Perplexity cevaplarında hangi kaynak alan adları benim yerime seçiliyor?",
  "Hangi hizmet veya konu başlığında yapay zekanın alıntılayacağı kanıtım yok?",
  "Rakiplerim hangi kanıt türleriyle (vaka, karşılaştırma, veri) öne çıkıyor?",
  "Görünürlüğü artırmak için önce hangi içeriği üretmeliyim?",
];

export const Route = createFileRoute("/ucretsiz-yapay-zeka-gorunurluk-raporu")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { name: "keywords", content: "yapay zeka görünürlüğü, yapay zeka görünürlük testi, GEO analizi, ChatGPT marka görünürlüğü, AI arama optimizasyonu" },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          url: PAGE_URL,
          inLanguage: "tr-TR",
          isPartOf: { "@type": "WebSite", name: "OneCite", url: "https://1cite.com" },
          mainEntity: {
            "@type": "Service",
            name: "Ücretsiz yapay zeka görünürlük (GEO) hazırlık raporu",
            provider: { "@type": "Organization", name: "OneCite", url: "https://1cite.com" },
            areaServed: "TR",
            offers: { "@type": "Offer", price: 0, priceCurrency: "USD", availability: "https://schema.org/InStock" },
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "Ücretsiz yapay zeka görünürlük raporu nasıl alınır?",
          step: steps.map((item, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: item.title,
            text: item.body,
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Ana sayfa", item: "https://1cite.com" },
            { "@type": "ListItem", position: 2, name: "Ücretsiz yapay zeka görünürlük testi", item: PAGE_URL },
          ],
        }),
      },
    ],
  }),
  component: FreeReportPage,
});

function FreeReportPage() {
  return (
    <MarketingShell>
      <VisualHero
        eyebrow="ÜCRETSİZ YAPAY ZEKA GÖRÜNÜRLÜK TESTİ"
        title={<>Markanız yapay zeka cevaplarında <span className="text-cyan">kaynak olarak çıkıyor mu?</span></>}
        description="Web sitenizi girin; OneCite herkese açık sinyalleri tarayıp ChatGPT, Gemini ve Perplexity gibi asistanlarda alıntılanmaya ne kadar hazır olduğunuzu gösteren ücretsiz hazırlık raporunu çıkarsın."
        image={heroSignalAction}
        imageAlt="Üç ışıklı yolun şeffaf bir prizma içinde tek kaynak noktasında birleşmesi"
        visualLabel="AI GÖRÜNÜRLÜK RAPORU"
        visualCaption="Alan adınızı girin; yapay zeka görünürlüğünüz ölçülsün."
        primaryLabel="Ücretsiz raporu başlat"
      >
        <div className="max-w-xl rounded-2xl border border-white/15 bg-background/[0.08] p-4 backdrop-blur-md md:p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><CheckCircle2 className="h-4 w-4 text-cyan" /> Ücretsiz ölçümünüzü başlatın</div>
          <div className="[&_button]:border-white [&_button]:bg-background [&_button]:text-foreground [&_button]:hover:bg-[#E9F9FD] [&_input]:border-white/20 [&_input]:bg-background [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground">
            <PublicReportAnalyzer />
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-5 text-slate-400">
            <span className="inline-flex items-center gap-1.5"><Timer className="h-3.5 w-3.5 text-cyan" /> Birkaç dakika</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-cyan" /> Kredi kartı yok</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-cyan" /> Yalnızca açık web verisi</span>
          </p>
        </div>
      </VisualHero>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-copy">
          <p className="editorial-eyebrow text-primary">Neden önemli?</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">Arama artık bir liste değil, bir cevap.</h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Kullanıcılar giderek daha sık on mavi link yerine tek bir yapay zeka cevabı okuyor. Bu cevapta anılmıyor ve kaynak
            olarak gösterilmiyorsanız, sıralamanız iyi olsa bile karar anında yoksunuz. Yapay zeka görünürlüğü — ya da üreten
            motor optimizasyonu (GEO) — tam olarak bu yeni yüzeyde seçilme meselesidir.
          </p>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Ücretsiz hazırlık raporu, bu yüzeyde nerede durduğunuzu görmenin en hızlı yoludur: hangi kanıtınız yeterli, hangi
            konu başlığında yapay zekanın alıntılayacağı bir şey bırakmamışsınız, önce neyi düzeltmelisiniz.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reportContents.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-border bg-background p-6">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-6 text-base font-extrabold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-container">
          <p className="editorial-eyebrow text-primary">Nasıl çalışır?</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">Üç adımda ücretsiz rapor.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((item) => (
              <article key={item.step} className="rounded-2xl border border-border bg-background p-6">
                <p className="editorial-eyebrow text-primary">{item.step}</p>
                <h3 className="mt-4 text-lg font-extrabold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="editorial-eyebrow text-primary">Cevaplanan sorular</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">Rapor sonrası şunları yanıtlayabilirsiniz.</h2>
            <ul className="mt-8 space-y-3">
              {questionsAnswered.map((question) => (
                <li key={question} className="flex items-start gap-3 border-b border-border pb-3 text-sm leading-6 text-foreground">
                  <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {question}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-secondary p-6">
            <h3 className="text-lg font-extrabold text-foreground">Ücretsiz rapor mu, sürekli ölçüm mü?</h3>
            <dl className="mt-6 space-y-5 text-sm">
              <div>
                <dt className="font-bold text-foreground">Ücretsiz hazırlık raporu</dt>
                <dd className="mt-1 leading-6 text-muted-foreground">Tek seferlik anlık görüntü. Açık web sinyalleri, eksik kanıt başlıkları ve ilk öncelikler.</dd>
              </div>
              <div>
                <dt className="font-bold text-foreground">OneCite paneli</dt>
                <dd className="mt-1 leading-6 text-muted-foreground">Soru bazlı periyodik ölçüm, atıf payı trendi, rakip karşılaştırması, bilgi bankası ve içerik görevleri.</dd>
              </div>
            </dl>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button asChild><Link to="/fiyatlandirma">Planları gör <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
              <Button variant="outline" asChild><Link to="/ozellikler">Ürünü incele</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-ink px-4 py-16 text-white md:px-6 md:py-20" data-testid="section-report-bridge">
        <div className="marketing-container grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="editorial-eyebrow text-cyan">Rapordan sonra</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] md:text-4xl">
              Raporda gördüğünüz eksikleri panelde takibe alın.
            </h2>
            <p className="mt-4 max-w-prose text-base leading-7 text-slate-300">
              Rapor tek seferlik bir fotoğraf. Hesap açtığınızda aynı sorular haftalık ölçülür, rakiplerinizle karşılaştırılır ve her
              eksik kanıt bir göreve dönüşür.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button asChild className="bg-cyan text-foreground hover:bg-[#B8F4FF]">
                <Link to="/auth">Hesap açın ve takibe başlayın <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10">
                <Link to="/fiyatlandirma">Planları görün</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-400">7 gün ücretsiz · kredi kartı gerekmez</p>
          </div>
          <ol className="space-y-3">
            {[
              { step: "01", title: "Raporunuzu alın", body: "Alan adınızla ilk ölçüm birkaç dakikada hazır olur." },
              { step: "02", title: "Soruları sabitleyin", body: "Rapordaki sorular panelde izlenen prompt setinize dönüşür." },
              { step: "03", title: "Görevleri kapatın", body: "Eksik kanıtı üretin, skorun haftalık nasıl değiştiğini izleyin." },
            ].map((item) => (
              <li key={item.step} className="flex gap-4 rounded-xl border border-white/15 bg-white/[0.04] p-4 md:p-5">
                <span className="font-mono text-xs text-cyan">{item.step}</span>
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-300">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-border bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="editorial-eyebrow text-primary">Sık sorulan sorular</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">Yapay zeka görünürlük testi hakkında.</h2>
          <Accordion type="single" collapsible className="mt-9 w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`readiness-faq-${index}`}>
                <AccordionTrigger className="text-left text-sm font-bold text-foreground md:text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="pr-8 leading-7 text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-8 text-sm leading-7 text-muted-foreground">
            Daha derine inmek isterseniz{" "}
            <Link to="/makaleler/$slug" params={{ slug: "yapay-zeka-gorunurlugu-nedir" }} className="font-semibold text-primary underline-offset-4 hover:underline">yapay zeka görünürlüğü nedir</Link>,{" "}
            <Link to="/platform/evidence-gaps" className="font-semibold text-primary underline-offset-4 hover:underline">eksik kanıt analizi</Link> ve{" "}
            <Link to="/platform/citation-share" className="font-semibold text-primary underline-offset-4 hover:underline">atıf payı ölçümü</Link> sayfalarına göz atın.
          </p>
        </div>
      </section>

      <section className="marketing-container px-4 py-14 md:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-secondary p-6 text-center md:p-8">
          <p className="editorial-eyebrow text-primary">Doğru beklenti</p>
          <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.035em] text-foreground md:text-3xl">Bu bir görünürlük garantisi değildir.</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Yapay zeka yanıtları model, zaman, soru bağlamı ve web kaynaklarıyla değişebilir. OneCite’ın rolü belirsizliği gizlemek
            değil; ölçülebilir kanıt ve uygulama alanını görünür kılmaktır.
          </p>
        </div>
      </section>

      <MarketingCta
        title="Ücretsiz raporunuzla başlayın."
        description="Alan adınızı girin, yapay zeka cevaplarında nerede durduğunuzu ve önce hangi kanıtı üretmeniz gerektiğini görün."
        secondaryHref="/fiyatlandirma"
        secondaryLabel="Planları karşılaştır"
      />
    </MarketingShell>
  );
}
