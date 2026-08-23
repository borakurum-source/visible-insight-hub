# İçerik Üretimi (content_draft) AEO Yükseltmesi

## Amaç

`/app/content` sayfasındaki taslak üretimi üç eksenle güçlendiriliyor: daha güçlü model, manuel
konu girişi, ve markanın E-E-A-T verisini gerçekten kullanan / AI görünürlüğüne katkı sağlayacak
şekilde tasarlanmış bir sistem promptu.

## 1. Model

`ai-gateway.server.ts`'e yeni `AiRole`: `editorial_content`.

```ts
case "editorial_content":
  return {
    surface: "agent",
    models: ["openai/gpt-5.6-terra", "openai/gpt-5.6-luna"],
    tools: [],
  };
```

`generateDraft` artık `aiJson(..., { role: "editorial_content" })` çağırıyor (önceden rol
belirtilmediği için `bulk_fast`'a düşüyordu).

`system-prompts.ts`'teki `SystemPromptModel` union'ına `"editorial_content"` eklenir,
`MODEL_LABELS`'a karşılığı yazılır (admin sayfasındaki rozet için). `content_draft` girdisinin
`model` alanı `"editorial_content"` olarak güncellenir.

## 2. Manuel konu girişi

`/app/content` sayfasına, "Kanıt Boşlukları" kartının üstüne yeni bir kart: bir textarea ("Hedef
soru veya konu") + mevcut format/uzunluk seçicileri + "Taslak üret" butonu. Tek seferlik —
sistemdeki prompt takibine hiç dokunmuyor.

`generateDraft` input sözleşmesi:

```ts
{ brandId: string; promptId?: string; topic?: string; format?: string; length?: string; tone?: string }
```

Handler: `promptId` ve `topic`'ten tam olarak biri dolu olmalı (ikisi de yoksa veya ikisi de
varsa hata). `promptId` verilmişse davranış aynen korunur. `topic` verilmişse: `prompts`
tablosuna hiç gidilmez, soru metni doğrudan `topic`, `target_prompt: topic`, insert'te
`prompt_id: null`. `content_drafts.prompt_id` zaten nullable — şema değişikliği gerekmiyor.
UI tarafında "yeniden üret" butonu zaten `draft.prompt_id` varlığına bağlı, manuel taslaklarda
otomatik olarak görünmeyecek.

## 3. Zengin marka verisi + AEO odaklı sistem promptu

`generateDraft`'taki `brand_intelligence` select'i şu anki `summary, positioning, tone, products`
yerine tam E-E-A-T alan setini çekecek: `scope, naming_aliases, voice_notes, author_profiles,
experience_role_type, experience_methodologies, leadership, partnerships, external_recognition,
content_owner_type, review_cadence, data_sourcing_notes, disclosure_policy, testimonials,
third_party_reviews, external_citations, ai_disclosure_note, default_schema_types`.

Yeni saf fonksiyon `buildBrandSignalsBlock(intel)` (kb.functions.ts içinde veya ayrı bir dosyada):
sadece dolu olan alanları okunur bir Türkçe blok haline getirir, boş alanlar için hiçbir satır
üretmez (modelin boş alanı "bilgi" sanıp uydurmasını önlemek için).

`content_draft` sistem promptu (`system-prompts.ts`) yeniden yazılır, mevcut kanıt kullanımı ve
yasak listesi korunarak şunlar eklenir:

- **AI-alıntılanabilirlik yapısı**: ilk cümle doğrudan tanım/cevap; her H2 soru veya net iddia;
  mümkünse liste/karşılaştırma formatı.
- **Varlık netliği**: marka adı ve (varsa) `naming_aliases`'tan en az biri metinde birebir geçmeli.
- **E-E-A-T dokuma**: yazar/deneyim/liderlik/ortaklık/disclosure verisi varsa güven sinyali olarak
  kullanılmalı — yalnızca verilen veriden, asla uydurma değil.
- **Ayrışma kuralı**: markanın konumlandırma/ürün/iddialarından en az bir somut, kanıta dayalı
  ayrışma cümlesi içermeli (kullanıcının "OneCite'ın farkı belli olsun" isteğinin açık kuralı).

## Test kapsamı

- `buildBrandSignalsBlock`: dolu/boş alan kombinasyonları için pure-function testleri (site-health
  oturumundaki `site-health.server.test.ts` deseniyle aynı stil).
- `generateDraft`'ın `promptId`/`topic` doğrulama dalı: ikisi de yok / ikisi de var / sadece biri
  var senaryoları.

## Kapsam dışı

- Prompt takip sistemine entegrasyon (kullanıcı açıkça istemedi).
- Üretim sonrası otomatik "kanıta sadık mı" doğrulama katmanı (bu oturumun kapsamı değil).
