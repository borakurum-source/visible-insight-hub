# Visby analizi, Özellikler sayfası ve plan yapısı güncellemesi

## 1. Visby karşılaştırması — bizde ne var, ne yok

**Bizde zaten var (ve çoğunda daha iyiyiz)**
- Prompt görünürlük takibi, atıf kaynakları, rakip karşılaştırmalı trend grafiği
- OneCite Score kırılımı, GEO görevleri, aksiyon checklist'i
- Bilgi Bankası + Marka Zekası (RAG / 3D vektör haritası) — Visby'de yok
- Marka İddiaları ve kanıt gücü — Visby'de yok
- GSC + GA4 + Bing Webmaster entegrasyonu, AI platform trafik kırılımı (ChatGPT, Perplexity, Copilot, Gemini, Claude)
- Paylaşılabilir müşteri raporu, Sistem Talimatları yönetimi

**Alınacaklar (onaylandı)**
- Funnel bazlı prompt takibi: her prompta TOF / MOF / BOF etiketi, huni bazlı görünürlük kırılımı
- AI trafiğinden gelir/dönüşüm analizi: GA4 conversion + revenue metriklerini AI kaynaklarına bağlama
- İçerik brief akışı: sitemap'ten önerilen brief → seçim → taslak, otomatik iç linkleme ve FAQ bloğu

**Almıyoruz (gereksiz veya bize uymuyor)**
- Yorum/itibar takibi (G2, Trustpilot) — ayrı ürün, ek veri maliyeti
- SEO Score / Page Speed / SERP Score halkaları — GEO odağımızı dağıtır, mevcut SEO araçlarıyla çakışır
- Shopping modülü, Report Builder (beta), Changelog — şimdilik kapsam dışı
- Ayrı ayrı "ChatGPT tracking / Claude tracking / Gemini tracking" sayfaları — bizde tek ölçüm motoru ve tek görünürlük ekranı daha sade

## 2. Yeni "Özellikler" sayfası — /ozellikler

Visby'nin features sayfasıyla aynı işi yapan, satış odaklı tek sayfa:
- Hero: "Yapay zeka cevaplarında görünmek için gereken her şey"
- 6 ana özellik bloğu (metin + 3 madde + görsel): AI Görünürlük Takibi, Rakip Analizi, Marka Zekası & Bilgi Bankası, GEO Görevleri, İçerik Üretimi, Raporlama & Entegrasyonlar
- "Daha derine" bölümü: 8 küçük kart (funnel takibi, AI trafik sayfa analizi, AI gelir analizi, atıf kaynakları, marka iddiaları, prompt niyet analizi, trend analizi, paylaşılabilir rapor)
- Kapanış CTA: "Ücretsiz raporunu al" + "Denemeyi başlat"
- Görseller karma: 5 ana blok gerçek panel ekran görüntüsü (macOS çerçeve + marka gradientli arkaplan), alt kartlar kod ile çizilmiş hafif mockup'lar
- Header ve footer'a "Özellikler" bağlantısı, sitemap ve JSON-LD güncellemesi, kendi head() meta'sı

## 3. Panel yan menüsü — Visby'den alınacak düzen

Mevcut "İzle / Anla / Harekete geç / Çalışma Alanı" yapısı korunur, iki ekleme yapılır:
- **Yardım** grubu (en altta): Dokümantasyon, Neler yeni, Destek
- Görünürlük altına **Huni Görünümü**, Harekete geç altına **İçerik Brief'leri**
- Grup başlıklarına açılır/kapanır ok (Visby'deki gibi), durum hatırlanır

## 4. Fiyatlandırma — ücretsiz plan kalkıyor

- Ücretsiz plan kaldırılır; yerine **7 günlük ücretsiz deneme** (kart istenmez, Başlangıç özellikleri) + **ücretsiz görünürlük raporu** lead magnet olarak kalır
- Yeni tablo: Deneme (7 gün) · Başlangıç $69 · Büyüme $189 · Ajans (teklif)
- Deneme bitince panel salt okunur olur, üst bantta geri sayım ve "Planı seç" butonu görünür
- `plan-limits.ts` içine `trial` planı (Başlangıç limitleri, 7 gün) eklenir; `free` plan geriye dönük uyum için salt okunur duruma eşlenir
- Fiyatlandırma sayfası, panel plan ekranı ve mock veriler yeni yapıya çekilir

## Teknik notlar

- Yeni rota: `src/routes/ozellikler.tsx`, mevcut `VisualHero` + `MarketingCta` bileşenleriyle
- Ekran görüntüleri Lovable Assets üzerinden bağlanır (repoya binary kopyalanmaz)
- Funnel etiketi: `prompts` tablosuna `funnel_stage` kolonu (`tof|mof|bof`) migration ile; prompt keşfi üretiminde AI etiketler, kullanıcı değiştirebilir
- AI gelir analizi: `ga4.server.ts` içinde `conversions` ve `totalRevenue` metrikleri AI referer kırılımına eklenir; Komuta Merkezi'nde yeni kart
- İçerik brief'leri: sitemap taraması + DeepSeek ile brief üretimi, `content_drafts` tablosuna `brief` alanı
- Deneme takibi: `profiles` tablosuna `trial_ends_at`; plan kontrolü `plan-limits.ts` üzerinden tek noktadan
