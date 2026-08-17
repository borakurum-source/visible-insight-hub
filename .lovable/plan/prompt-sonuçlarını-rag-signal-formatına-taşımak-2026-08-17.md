# Prompt sonuçlarını RAG Signal formatına taşımak

Evet, o yapı bizim mevcut prompt detayımızdan belirgin şekilde daha iyi: tek bir kartta görünürlük yüzdesi, motor, çalıştırma sayısı, geçen markalar, yeni tespit edilen rakipler, tam yanıt ve kaynak listesi bir arada duruyor. Bugün panelde bunların bir kısmı ya hiç yok ya da yalnızca son ölçüm için gösteriliyor.

## Bugün ne var, ne yok

Mevcut prompt detayı (Promptlar sayfasında satırı açınca):
- Sadece **en son** ölçüm gösteriliyor; geçmiş çalıştırmalar yok.
- "Yanıtta geçiyor / geçmiyor" + sıra rozeti var, prompt bazlı **görünürlük yüzdesi yok**.
- Yanıt metni ve kaynak listesi var.
- Ölçüm sırasında modelin döndürdüğü **"yanıtta geçen markalar" listesi hesaplanıyor ama veritabanına kaydedilmiyor** — bu yüzden ekranda gösterilemiyor ve rakip adayı çıkarımı yapılamıyor.
- Motor tek: her çalıştırma `perplexity` olarak kaydediliyor; ekrandaki "#7 mistral-websearch" gibi çoklu motor/çalıştırma numarası karşılığı yok.
- Yeni rakip adayları prompt sonucundan otomatik türetilmiyor.

## Yapılacaklar

### 1. Ölçüm çıktısını zenginleştir (veri katmanı)
- `prompt_runs` tablosuna: `mentioned_brands` (jsonb), `run_index` (kaçıncı çalıştırma), `visibility` (0-100, bu çalıştırmanın prompt görünürlük puanı) alanları eklenir.
- Ölçüm sırasında modelin verdiği marka listesi normalize edilip kaydedilir; markanın kendisi, bilinen rakipler ve **daha önce görülmemiş markalar** ayrıştırılır.
- Görülmemiş markalar `competitor_candidates` olarak saklanır (prompt, ilk görüldüğü çalıştırma ve kaç promptta çıktığı ile birlikte).

### 2. Prompt sonuç kartı (RAG Signal düzeni)
Promptlar sayfasında satır açıldığında:
- Üst şerit: **Görünürlük %**, "Geçiyor / Geçmiyor", sıra, motor rozeti, çalıştırma numarası (#7) ve tarih.
- **Yanıtta geçen markalar**: kendi markamız vurgulu, bilinen rakipler nötr, yeni markalar "yeni" rozetiyle.
- **Yeni rakipler**: tek tıkla "Rakip olarak ekle" veya "Yoksay".
- **AI yanıtı**: tam metin, kısaltılmadan; uzun yanıtlarda "tamamını göster".
- **Kaynaklar**: kendi alan adımız / rakip / nötr renk kodlu, başlık + URL.
- **Bu soruda görünmek için** aksiyon listesi mevcut haliyle korunur.

### 3. Çalıştırma geçmişi
- Kartın üstünde çalıştırma seçici: son N ölçüm listelenir (#1…#7), tıklayınca o çalıştırmanın yanıtı ve kaynakları yüklenir.
- Prompt bazlı görünürlük trendi için küçük bir sparkline (zaman içinde geçti/geçmedi ve sıra).

### 4. Çoklu motor altyapısı
- Motor alanı gerçek değerle yazılır ve kart motor bazında rozet gösterir.
- Şimdilik Perplexity Sonar ana motor; DeepSeek ikinci motor olarak aynı prompt için çalıştırılabilir hale getirilir, kart iki motoru yan yana gösterir. (İstemezseniz bu adımı çıkarırız.)

### 5. Liste görünümü
- Prompt satırında görünürlük yüzdesi, son ölçüm tarihi ve motor rozeti özet olarak görünür; böylece listeyi açmadan durum anlaşılır.

## Teknik notlar

- Migration: `prompt_runs` için `mentioned_brands jsonb default '[]'`, `run_index int`, `visibility numeric`; yeni `competitor_candidates` tablosu (brand_id, name, domain, first_seen_run_id, prompt_count, status) + GRANT + RLS (marka sahibine göre).
- `src/lib/measurement.server.ts`: `mentionedBrands` zaten üretiliyor, dönüş tipine eklenir.
- `src/lib/panel.functions.ts`: `runMeasurementChunk` kayıtları zenginleştirir; `getPromptInsight` çalıştırma listesi + seçili çalıştırma + markalar + adaylar döndürür; `promoteCompetitorCandidate` / `dismissCompetitorCandidate` eklenir.
- UI: prompt detayı `app.prompts.tsx` içinden `src/components/app/prompt-result-card.tsx` bileşenine taşınır; rakip adayları mevcut Rakip Takibi sayfasıyla aynı veri kaynağını kullanır.
- Geçmiş çalıştırmalar için ek ölçüm maliyeti yok; sadece hâlihazırda kaydedilen satırlar listelenir.
