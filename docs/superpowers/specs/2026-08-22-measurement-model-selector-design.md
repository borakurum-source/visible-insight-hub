# Ölçüm Model Seçici — Tasarım

## Amaç

Şu an ölçüm motoru (`measurement.server.ts` → `perplexity.server.ts` → `ai-gateway.server.ts`)
her zaman `role: "search_fast"` ile Perplexity'nin agent yüzeyini (`surface: "agent"`,
`tools: [{web_search}]`, `preset: "fast"`) çağırıyor ve hangi modelin cevap vereceğini
Perplexity'nin kendi otomatik seçimine bırakıyor (`models: []`). Kullanıcı, ölçüm yaparken
(tekil veya toplu) hangi modelin cevap vereceğini seçebilmek istiyor — ama yalnızca Perplexity
gateway üzerinden gerçekten "grounded" (web_search tool'lu agent yüzeyi) olan modeller arasından.

Google/Gemini gibi Perplexity gateway'in proxy'lemediği modeller bu işin kapsamı dışında; ürünün
mevcut konumlandırması (`faqData.ts`) zaten "ChatGPT'de veya Gemini'de doğrudan ölçmüyoruz, Sonar
sinyali korelasyon proxy'si olarak kullanıyoruz" diyor. Bu iş o konumlandırmayı değiştirmiyor.

## Kapsam

**Dahil:**
- Tekil yeniden ölçüm (`measureSinglePrompt`)
- Toplu ölçüm (`startMeasurement` → `runMeasurementChunk` → `finishMeasurement`)
- Seçilebilir modeller: **Otomatik** (varsayılan, mevcut davranış), **Sonar** (`perplexity/sonar`),
  **GPT-5.6 Luna** (`openai/gpt-5.6-luna`) — ikisi de bugün `resolveAgentFallback` içinde zaten
  tanımlı, agent yüzeyinde `web_search` tool'uyla çalışan modeller.

**Dışında:**
- Otomatik/kuyruk tabanlı ölçüm (`research-stage-executor.server.ts`, orchestrator job'ları) —
  her zaman Otomatik modda kalır.
- Google/Gemini veya başka bir sağlayıcı entegrasyonu (ayrı bir iş).
- Satır başına farklı model seçimi (tek, sayfa-seviyesi seçim; toplu ölçümde tüm tur aynı modeli
  kullanır).

## Backend Değişiklikleri

### `ai-gateway.server.ts`
- `AiRequestBase`'e opsiyonel `model?: string` eklenir.
- `execute()` ve `executeText()`: `resolveAiRoute(request.role, routerAvailable)` sonrası, eğer
  `request.model` verilmişse ve seçilen route `surface === "agent"` ise,
  `route = { ...route, models: [request.model], preset: undefined }` ile override edilir.
  Router yüzeyine (örn. `bulk_fast`) hiç etki etmez. Hata durumunda mevcut
  `resolveAgentFallback(request.role)` fallback zinciri değişmeden çalışır.

### `perplexity.server.ts`
- `perplexityJson` ve `perplexitySearch` opsiyonel `model?: string` parametresi alır,
  `aiGateway.json`/`.text`'e geçirir.
- **Cache key düzeltmesi:** `withCache` payload'ına (`{messages, schema, surface, model}`)
  `model: model ?? "auto"` eklenir — aksi halde farklı modellerin cevapları aynı cache key'i
  paylaşıp birbirini ezer.
- Dönüş tipine `model: string | null` eklenir (gateway'in gerçekte döndürdüğü model — fallback
  tetiklenirse istenenden farklı olabilir).

### `measurement.server.ts`
- `measurePrompt` opsiyonel `model?: string` alır, `perplexityJson`'a geçirir.
- `MeasuredAnswer`'a `model: string | null` eklenir.

### DB migration (yeni)
- `measurement_batches.model TEXT NULL` — toplu ölçümde seçilen model (`NULL` = otomatik).
- `prompt_runs.model TEXT NULL` — o run'da gerçekte cevap veren model. Geriye dönük satırlar
  `NULL` kalır.

### `panel.functions.ts`
- `startMeasurement`: input'a opsiyonel `model?: string`. Whitelist:
  `["perplexity/sonar", "openai/gpt-5.6-luna"]` — whitelist dışı değer sessizce `undefined`'a
  düşer (400 fırlatmıyoruz, `setBrandEngines`'teki whitelist deseniyle tutarlı). Batch insert'e
  `model` eklenir. Yarım kalmış batch'i sürdürme mantığı **değişmiyor** — sürdürülen batch kendi
  kayıtlı modeliyle devam eder (bir turda model karışımı olmasın diye doğru davranış).
- `runMeasurementChunk`: `batchRow.model`'i okuyup her `measurePrompt` çağrısına geçirir; dönen
  `measured.model`'i `prompt_runs` insert'ine ekler.
- `measureSinglePrompt`: aynı whitelist + opsiyonel `model` input, `measurePrompt`'a geçirir,
  `prompt_runs` insert'ine `measured.model` eklenir.

## Frontend Değişiklikleri

### `app.prompts.tsx`
- Sayfa seviyesinde tek bir `selectedModel` state'i (`useState<string | undefined>(undefined)`,
  `undefined` = Otomatik). Hem "Tümünü ölç" hem her satırdaki "Yeniden ölç" bu tek seçimi
  kullanır — satır başına ayrı seçici yok.
- `PanelPageHeading`'in `action` alanına, "Tümünü ölç" butonunun yanına küçük bir `<Select>`
  (shadcn) eklenir: **Otomatik / Sonar (hızlı) / GPT-5.6 Luna (orta)**.
- CSV export'a mevcut `measurement_surface` sütununun yanına `model` sütunu eklenir
  (`prompt.lastRun.model ?? "auto"`). Satır içi tabloya yeni bir badge eklenmiyor.

### `use-measurement-run.ts`
- `run` fonksiyonu `run(model?: string)` olur, `start({ data: { brandId, model } })`'a geçirir.
  `runChunk` çağrısına model geçmez — server tarafında `batchRow.model`'den okunur, tur boyunca
  tutarlılık garanti edilir.

### `singleMeasurement` mutation
- `mutationFn: (promptId) => remeasurePrompt({ data: { brandId, promptId, model: selectedModel } })`

## Hata Yönetimi

- Whitelist dışı `model` → sessizce otomatik'e düşer, hata fırlatılmaz.
- Seçili model gateway'de hata verirse mevcut `resolveAgentFallback("search_fast")`
  (→ `perplexity/sonar`) devreye girer; kullanıcıya ayrı bir hata gösterilmez (mevcut sessiz
  fallback felsefesiyle aynı).

## Test Planı

- `ai-gateway.server.test.ts`'e 2 yeni case: (1) agent yüzeyinde `model` override'ının
  `route.models`'i değiştirdiğini ve `preset` göndermediğini doğrulama, (2) router yüzeyinde
  (`bulk_fast`) `model` override'ının yok sayıldığını doğrulama.
- Yeni test dosyası açılmıyor (`perplexity.server.ts`, `measurement.server.ts` bugün de test
  edilmiyor, kapsam tutarlı tutuluyor).
- Manuel doğrulama (dev): "Yeniden ölç"i üç modelle de deneyip `prompt_runs.model` sütununun
  doğru dolduğunu ve aynı prompt'un Sonar/Luna ile art arda ölçülmesinde cache'in karışmadığını
  (farklı cevap/model dönmesini) kontrol etmek.

## Kapsam Dışı / Sonraya Bırakılanlar

- Google/Gemini grounded ölçüm entegrasyonu (ayrı iş, `faqData.ts` metninin güncellenmesini de
  gerektirir).
- Model seçiminin marka seviyesinde kalıcı varsayılan olarak saklanması (şimdilik sayfa
  state'inde ephemeral; ihtiyaç doğarsa `brands` tablosuna eklenebilir).
- Satır başına farklı model seçimi.
