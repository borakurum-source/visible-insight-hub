# Ölçüm Model Seçici Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tekil ve toplu ölçüm akışlarında, Perplexity gateway'in agent yüzeyinde (`web_search` tool'lu, yani grounded) çalışan iki modelden (`perplexity/sonar`, `openai/gpt-5.6-luna`) birini veya Otomatik'i seçebilme özelliği eklemek.

**Architecture:** `ai-gateway.server.ts`'e opsiyonel bir `model` override eklenir (yalnızca agent yüzeyinde, preset'i geçersiz kılarak). Bu, `perplexity.server.ts` → `measurement.server.ts` → `panel.functions.ts` (server fn'lar) → `app.prompts.tsx` (UI) zincirinden aşağı doğru taşınır. Seçilen model `measurement_batches.model_id` (yeni sütun) ve gerçekte cevap veren model `prompt_runs.model_id` (zaten var olan, bugüne kadar hep sabit `"perplexity/preset-fast"` yazılan sütun) olarak kaydedilir.

**Tech Stack:** TypeScript, TanStack Start server functions, Supabase (self-hosted Postgres, şema `onecite`), Vitest, React + shadcn/ui.

## Global Constraints

- Seçilebilir modeller sadece `perplexity/sonar` ve `openai/gpt-5.6-luna` — whitelist dışı değer sessizce `undefined`'a (Otomatik) düşer, hata fırlatılmaz.
- Router yüzeyi (`bulk_fast` gibi tool'suz roller) `model` override'ından hiç etkilenmez.
- Otomatik/kuyruk tabanlı ölçüm (`research-stage-executor.server.ts`) bu işin kapsamı dışında, dokunulmuyor.
- Cache key'e `model` eklenmezse farklı modellerin cevapları birbirini ezer — her `perplexityJson` çağrısında zorunlu.
- `measurement_batches` prod'da canlı bir tablo (`1cite.com` üretim veritabanı) — migration'ı uygulamadan önce kullanıcıya haber ver, `ADD COLUMN IF NOT EXISTS` ile additive/geri dönüşü kolay tutulmalı.
- Repo'da `npm run build` = `vite build`, tip kontrolü build'i bloklamıyor (proje zaten `types.ts`'te tanımlı olmayan sütunları `as never` cast'iyle kullanıyor, örn. `batch_id`, `prompt_set_hash`) — bu desene uy, `types.ts`'i güncellemek bu planın kapsamında değil.

---

### Task 1: `ai-gateway.server.ts` — açık model override

**Files:**
- Modify: `src/lib/ai-gateway.server.ts:59-125` (helper + type), `:339-343` (execute), `:452-454` (executeText)
- Test: `src/lib/ai-gateway.server.test.ts`

**Interfaces:**
- Consumes: mevcut `AiRoute`, `resolveAiRoute`, `resolveAgentFallback` — değişmiyor.
- Produces: `AiRequestBase.model?: string` — Task 2 (`perplexity.server.ts`) bunu `aiGateway.json`/`.text` çağrılarına geçirecek.

- [ ] **Step 1: Yeni testleri yaz (henüz implementasyon yok, başarısız olmalı)**

`src/lib/ai-gateway.server.test.ts` dosyasında, 214. satırdaki son `it(...)` bloğunun kapanışından (`});`) hemen sonra, `describe("Perplexity AI gateway", ...)` bloğunun kapanışından (215. satır, `});`) önce ekle:

```typescript
  it("honors an explicit model override on the agent surface and drops the preset", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        model: "openai/gpt-5.6-luna",
        output: [{ type: "message", content: [{ type: "output_text", text: "Luna yanit" }] }],
      }),
    );
    const gateway = createAiGateway({
      apiKey: "test-key",
      fetch: fetchMock,
      routerAvailable: false,
      recordUsage: vi.fn(),
    });

    const response = await gateway.text({
      role: "search_fast",
      messages,
      model: "openai/gpt-5.6-luna",
    });

    expect(response.data).toBe("Luna yanit");
    expect(response.model).toBe("openai/gpt-5.6-luna");
    const sentBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(sentBody.models).toEqual(["openai/gpt-5.6-luna"]);
    expect(sentBody.preset).toBeUndefined();
  });

  it("ignores a model override on the router surface", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        model: "perplexity/deepseek-v4-flash-0731",
        choices: [{ message: { content: '{"label":"ok"}' } }],
      }),
    );
    const gateway = createAiGateway({
      apiKey: "test-key",
      fetch: fetchMock,
      routerAvailable: true,
      recordUsage: vi.fn(),
    });

    const response = await gateway.json({
      role: "bulk_fast",
      messages,
      model: "openai/gpt-5.6-luna",
      schema: z.object({ label: z.string() }),
      jsonSchema: {
        name: "label",
        schema: { type: "object", properties: { label: { type: "string" } } },
      },
    });

    expect(response.surface).toBe("router");
    const sentBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(sentBody.model).toBe("perplexity/deepseek-v4-flash-0731");
  });
```

- [ ] **Step 2: Testleri çalıştır, başarısız olduklarını doğrula**

Run: `npx vitest run src/lib/ai-gateway.server.test.ts`
Expected: FAIL — `model` `AiRequestBase`'de yok (TS) veya `sentBody.models` beklenenden farklı (override henüz uygulanmıyor).

- [ ] **Step 3: `AiRequestBase`'e `model` alanı ekle**

`src/lib/ai-gateway.server.ts:118-125` mevcut hali:

```typescript
export type AiRequestBase = {
  role: AiRole;
  messages: AiMessage[];
  tools?: AiTool[];
  maxOutputTokens?: number;
  brandId?: string;
  userId?: string;
};
```

Yeni hali:

```typescript
export type AiRequestBase = {
  role: AiRole;
  messages: AiMessage[];
  tools?: AiTool[];
  maxOutputTokens?: number;
  brandId?: string;
  userId?: string;
  model?: string;
};
```

- [ ] **Step 4: Override helper'ını ekle**

`src/lib/ai-gateway.server.ts:81` (`resolveAgentFallback` fonksiyonunun kapanışından hemen sonra, `export type AiSource` tanımından önce) ekle:

```typescript
function applyModelOverride(route: AiRoute, model?: string): AiRoute {
  if (!model || route.surface !== "agent") return route;
  return { surface: route.surface, models: [model], tools: route.tools };
}
```

- [ ] **Step 5: `execute()` içinde override'ı uygula**

`src/lib/ai-gateway.server.ts:339-343` mevcut hali:

```typescript
  async function execute<T>(request: AiJsonRequest<T>): Promise<AiGatewayResponse<T>> {
    const routerAvailable = await hasRouterModel();
    const primary = resolveAiRoute(request.role, routerAvailable);
    const startedAt = now();
    let route = primary;
```

Yeni hali:

```typescript
  async function execute<T>(request: AiJsonRequest<T>): Promise<AiGatewayResponse<T>> {
    const routerAvailable = await hasRouterModel();
    const primary = applyModelOverride(
      resolveAiRoute(request.role, routerAvailable),
      request.model,
    );
    const startedAt = now();
    let route = primary;
```

- [ ] **Step 6: `executeText()` içinde override'ı uygula**

`src/lib/ai-gateway.server.ts:452-454` mevcut hali:

```typescript
  async function executeText(request: AiRequestBase): Promise<AiGatewayResponse<string>> {
    const routerAvailable = await hasRouterModel();
    let route = resolveAiRoute(request.role, routerAvailable);
```

Yeni hali:

```typescript
  async function executeText(request: AiRequestBase): Promise<AiGatewayResponse<string>> {
    const routerAvailable = await hasRouterModel();
    let route = applyModelOverride(resolveAiRoute(request.role, routerAvailable), request.model);
```

- [ ] **Step 7: Testleri çalıştır, geçtiklerini doğrula**

Run: `npx vitest run src/lib/ai-gateway.server.test.ts`
Expected: PASS — tüm testler (eskiler + 2 yenisi) yeşil.

- [ ] **Step 8: Commit**

```bash
git add src/lib/ai-gateway.server.ts src/lib/ai-gateway.server.test.ts
git commit -m "feat(onecite): support explicit model override on AI gateway agent surface"
```

---

### Task 2: `perplexity.server.ts` — model parametresi + cache key düzeltmesi

**Files:**
- Modify: `src/lib/perplexity.server.ts:82-111`

**Interfaces:**
- Consumes: Task 1'den `AiRequestBase.model?: string` (dolaylı, `aiGateway.json`'a geçirilecek).
- Produces: `perplexityJson<T>(messages, schema, legacyFallback, model?)` yeni 4. parametre; `PerplexityResult<T>` artık `model: string | null` alanı içeriyor. Task 3 (`measurement.server.ts`) bunları kullanacak.

- [ ] **Step 1: `PerplexityResult` tipine `model` ekle**

`src/lib/perplexity.server.ts:8` mevcut hali:

```typescript
export type PerplexityResult<T> = { result: T; citations: string[]; sources: CitationSource[] };
```

Yeni hali:

```typescript
export type PerplexityResult<T> = {
  result: T;
  citations: string[];
  sources: CitationSource[];
  model: string | null;
};
```

- [ ] **Step 2: `perplexityJson`'a `model` parametresi ekle, cache key'e dahil et, sonuçta döndür**

`src/lib/perplexity.server.ts:82-111` mevcut hali:

```typescript
export async function perplexityJson<T>(
  messages: ChatMessage[],
  schema: { name: string; schema: object },
  _legacyFallbackShape: T,
): Promise<PerplexityResult<T>> {
  const { withCache, CACHE_TTL } = await import("./cache.server");
  return withCache<PerplexityResult<T>>(
    "perplexity",
    { messages, schema, surface: "agent_web_grounded" },
    CACHE_TTL.perplexity,
    async () => {
      const response = await aiGateway.json({
        role: "search_fast",
        messages: messages as AiMessage[],
        tools: [{ type: "web_search" }],
        schema: z.custom<T>((value) => matchesJsonSchema(value, schema.schema as JsonSchema), {
          message: "Output does not match the requested JSON schema",
        }),
        jsonSchema: schema,
        maxOutputTokens: 2048,
      });
      return {
        result: response.data,
        citations: response.citations,
        sources: response.sources.map(({ url, domain, title }) => ({ url, domain, title })),
      };
    },
    (value) => Boolean(value.result),
  );
}
```

Yeni hali:

```typescript
export async function perplexityJson<T>(
  messages: ChatMessage[],
  schema: { name: string; schema: object },
  _legacyFallbackShape: T,
  model?: string,
): Promise<PerplexityResult<T>> {
  const { withCache, CACHE_TTL } = await import("./cache.server");
  return withCache<PerplexityResult<T>>(
    "perplexity",
    { messages, schema, surface: "agent_web_grounded", model: model ?? "auto" },
    CACHE_TTL.perplexity,
    async () => {
      const response = await aiGateway.json({
        role: "search_fast",
        messages: messages as AiMessage[],
        tools: [{ type: "web_search" }],
        schema: z.custom<T>((value) => matchesJsonSchema(value, schema.schema as JsonSchema), {
          message: "Output does not match the requested JSON schema",
        }),
        jsonSchema: schema,
        maxOutputTokens: 2048,
        ...(model ? { model } : {}),
      });
      return {
        result: response.data,
        citations: response.citations,
        sources: response.sources.map(({ url, domain, title }) => ({ url, domain, title })),
        model: response.model,
      };
    },
    (value) => Boolean(value.result),
  );
}
```

- [ ] **Step 3: Derleme hatası olmadığını doğrula**

Bu dosyada test dosyası yok (proje genelinde `perplexity.server.ts` test edilmiyor — mevcut kapsamla tutarlı kalınıyor). Bunun yerine hızlı bir tip kontrolü:

Run: `npx tsc --noEmit -p . 2>&1 | grep perplexity.server.ts || echo "no errors in this file"`
Expected: `no errors in this file` (proje genelinde başka dosyalarda önceden var olan tip hataları olabilir, onlar bu görevin kapsamı dışında — sadece bu dosyada yeni hata olmadığını doğrula).

- [ ] **Step 4: Commit**

```bash
git add src/lib/perplexity.server.ts
git commit -m "feat(onecite): thread explicit model choice through perplexityJson"
```

---

### Task 3: `measurement.server.ts` — model parametresini ölçüm motoruna taşı

**Files:**
- Modify: `src/lib/measurement.server.ts`

**Interfaces:**
- Consumes: Task 2'den `perplexityJson<T>(messages, schema, fallback, model?)` ve `PerplexityResult<T>.model`.
- Produces: `measurePrompt(input: {..., model?: string})` ve `MeasuredAnswer.model: string | null` — Task 5/6 (`panel.functions.ts`) bunları kullanacak.

- [ ] **Step 1: `MeasuredAnswer` tipine `model` ekle**

`src/lib/measurement.server.ts:7-13` mevcut hali:

```typescript
export type MeasuredAnswer = {
  answer: string;
  brandMentioned: boolean;
  position: number | null;
  sources: MeasuredSource[];
  mentionedBrands: BrandMention[];
};
```

Yeni hali:

```typescript
export type MeasuredAnswer = {
  answer: string;
  brandMentioned: boolean;
  position: number | null;
  sources: MeasuredSource[];
  mentionedBrands: BrandMention[];
  model: string | null;
};
```

- [ ] **Step 2: `measurePrompt`'a `model` girişi ekle, `perplexityJson`'a geçir, sonuçta döndür**

`src/lib/measurement.server.ts:15-21` mevcut hali:

```typescript
export async function measurePrompt(input: {
  brandName: string;
  brandDomain: string;
  competitors: string[];
  promptText: string;
  systemPrompt?: string;
}): Promise<MeasuredAnswer> {
  const { perplexityJson } = await import("./perplexity.server");

  const { result, sources } = await perplexityJson<{
```

Yeni hali:

```typescript
export async function measurePrompt(input: {
  brandName: string;
  brandDomain: string;
  competitors: string[];
  promptText: string;
  systemPrompt?: string;
  model?: string;
}): Promise<MeasuredAnswer> {
  const { perplexityJson } = await import("./perplexity.server");

  const { result, sources, model } = await perplexityJson<{
```

`src/lib/measurement.server.ts:57-59` mevcut hali (perplexityJson çağrısının son argümanı):

```typescript
    { answer: "", mentionedBrands: [] },
  );
```

Yeni hali:

```typescript
    { answer: "", mentionedBrands: [] },
    input.model,
  );
```

`src/lib/measurement.server.ts:74-80` mevcut hali (return bloğu):

```typescript
  return {
    answer: String(result.answer ?? ""),
    brandMentioned: idx >= 0 || inText,
    position: idx >= 0 ? idx + 1 : null,
    sources: sources.slice(0, 10),
    mentionedBrands: cleanBrands,
  };
```

Yeni hali:

```typescript
  return {
    answer: String(result.answer ?? ""),
    brandMentioned: idx >= 0 || inText,
    position: idx >= 0 ? idx + 1 : null,
    sources: sources.slice(0, 10),
    mentionedBrands: cleanBrands,
    model,
  };
```

- [ ] **Step 3: Derleme kontrolü**

Run: `npx tsc --noEmit -p . 2>&1 | grep measurement.server.ts || echo "no errors in this file"`
Expected: `no errors in this file`

- [ ] **Step 4: Commit**

```bash
git add src/lib/measurement.server.ts
git commit -m "feat(onecite): carry the answering model through measurePrompt"
```

---

### Task 4: DB migration — `measurement_batches.model_id`

**Files:**
- Create: `supabase/migrations/20260822130000_measurement_batches_model_id.sql`

**Interfaces:**
- Produces: `onecite.measurement_batches.model_id text` (nullable) — Task 5 (`startMeasurement`/`runMeasurementChunk`) bunu okuyup yazacak. `onecite.prompt_runs.model_id` zaten var (bkz. `supabase/migrations/20260821120930_outcome_os_foundation.sql:225`), bu görevde değişmiyor.

- [ ] **Step 1: Migration dosyasını oluştur**

```sql
-- Toplu ölçüm turunda seçilen model (NULL = otomatik, Perplexity'nin kendi seçimi).
ALTER TABLE onecite.measurement_batches
  ADD COLUMN IF NOT EXISTS model_id text;
```

- [ ] **Step 2: Migration'ı uygula (üretim veritabanı — kullanıcıya haber ver, sonra çalıştır)**

Bu adım `1cite.com`'un canlı veritabanını değiştirir. Kullanıcıya "measurement_batches tablosuna nullable model_id sütunu ekleniyor (additive, veri kaybı yok)" diye bildirip onay aldıktan sonra:

Run: `docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/20260822130000_measurement_batches_model_id.sql`
Expected: `ALTER TABLE` çıktısı, hata yok.

- [ ] **Step 3: Sütunun gerçekten eklendiğini doğrula**

Run: `docker exec -i supabase-db psql -U postgres -d postgres -c "\d onecite.measurement_batches" | grep model_id`
Expected: `model_id | text |` satırı görünür.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260822130000_measurement_batches_model_id.sql
git commit -m "feat(onecite): add measurement_batches.model_id column"
```

---

### Task 5: `panel.functions.ts` — `startMeasurement` + `runMeasurementChunk`

**Files:**
- Modify: `src/lib/panel.functions.ts:1483-1552` (startMeasurement), `:1554-1731` (runMeasurementChunk)

**Interfaces:**
- Consumes: Task 3'ten `measurePrompt(input: {..., model?: string})` ve `MeasuredAnswer.model`. Task 4'ten `measurement_batches.model_id` sütunu.
- Produces: `startMeasurement(input: {brandId, model?})`, whitelist sabiti `GROUNDED_MODEL_WHITELIST` ve `sanitizeModel(model?: string): string | undefined` — Task 6 (`measureSinglePrompt`) da bu sabiti/fonksiyonu kullanacak.

- [ ] **Step 1: Whitelist sabiti ve sanitize fonksiyonunu ekle**

`src/lib/panel.functions.ts:1483` (yani `export const startMeasurement = ...` satırının hemen üstüne) ekle:

```typescript
const GROUNDED_MODEL_WHITELIST = ["perplexity/sonar", "openai/gpt-5.6-luna"] as const;

function sanitizeModel(model: string | undefined): string | undefined {
  return model && (GROUNDED_MODEL_WHITELIST as readonly string[]).includes(model)
    ? model
    : undefined;
}

```

- [ ] **Step 2: `startMeasurement` girişine `model` ekle, batch insert'e yaz**

`src/lib/panel.functions.ts:1483-1486` mevcut hali:

```typescript
export const startMeasurement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
```

Yeni hali:

```typescript
export const startMeasurement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; model?: string }) => input)
  .handler(async ({ data, context }) => {
    const model = sanitizeModel(data.model);
```

`src/lib/panel.functions.ts:1533-1548` mevcut hali (batch insert):

```typescript
    const { data: batch, error } = await context.supabase
      .from("measurement_batches")
      .insert({
        brand_id: data.brandId,
        status: "running",
        engine: "agent_web_grounded",
        total_prompts: ids.length,
        completed_prompts: 0,
        measurement_mode: "full",
        prompt_set_hash: promptSetHash,
        prompt_ids: ids,
      } as never)
      .select("*")
      .single();
```

Yeni hali:

```typescript
    const { data: batch, error } = await context.supabase
      .from("measurement_batches")
      .insert({
        brand_id: data.brandId,
        status: "running",
        engine: "agent_web_grounded",
        total_prompts: ids.length,
        completed_prompts: 0,
        measurement_mode: "full",
        prompt_set_hash: promptSetHash,
        prompt_ids: ids,
        model_id: model ?? null,
      } as never)
      .select("*")
      .single();
```

(Yarım kalmış batch'i sürdürme dalı — `if (openBatch) {...}` — bilerek değiştirilmiyor: sürdürülen batch kendi kayıtlı `model_id`'siyle devam eder, yeni seçim yok sayılır.)

- [ ] **Step 3: `runMeasurementChunk` — batch'in model'ini oku, ölçüme geçir, gerçek modeli kaydet**

`src/lib/panel.functions.ts:1559-1563` mevcut hali:

```typescript
    const { data: batchRow } = await context.supabase
      .from("measurement_batches")
      .select("brand_id,status,measurement_mode,prompt_ids")
      .eq("id", data.batchId)
      .maybeSingle();
```

Yeni hali:

```typescript
    const { data: batchRow } = await context.supabase
      .from("measurement_batches")
      .select("brand_id,status,measurement_mode,prompt_ids,model_id")
      .eq("id", data.batchId)
      .maybeSingle();
```

`src/lib/panel.functions.ts:1599` civarı (`const competitors = normalizeCompetitors(intel?.competitors);` satırından hemen sonra) ekle:

```typescript
    const model = (batchRow as unknown as { model_id?: string | null }).model_id ?? undefined;
```

`src/lib/panel.functions.ts:1613-1619` mevcut hali (`measurePrompt` çağrısı):

```typescript
        measured = await measurePrompt({
          brandName: brand.name,
          brandDomain: brand.domain,
          competitors: competitorNames(competitors),
          promptText: prompt.text,
          systemPrompt,
        });
```

Yeni hali:

```typescript
        measured = await measurePrompt({
          brandName: brand.name,
          brandDomain: brand.domain,
          competitors: competitorNames(competitors),
          promptText: prompt.text,
          systemPrompt,
          model,
        });
```

`src/lib/panel.functions.ts:1644` mevcut hali (prompt_runs insert içindeki sabit satır):

```typescript
          model_id: "perplexity/preset-fast",
```

Yeni hali:

```typescript
          model_id: measured.model ?? "perplexity/preset-fast",
```

- [ ] **Step 4: Derleme kontrolü**

Run: `npx tsc --noEmit -p . 2>&1 | grep panel.functions.ts || echo "no errors in this file"`
Expected: `no errors in this file`

- [ ] **Step 5: Commit**

```bash
git add src/lib/panel.functions.ts
git commit -m "feat(onecite): let bulk measurement runs pin an explicit grounded model"
```

---

### Task 6: `panel.functions.ts` — `measureSinglePrompt` + `listPrompts`

**Files:**
- Modify: `src/lib/panel.functions.ts:1734-1868` (measureSinglePrompt), `:335-386` (listPrompts)

**Interfaces:**
- Consumes: Task 5'ten `GROUNDED_MODEL_WHITELIST`, `sanitizeModel`.
- Produces: `measureSinglePrompt(input: {brandId, promptId, model?})`; `listPrompts` sonucundaki her `lastRun`'a `modelId: string | null` eklenir — Task 7 (`app.prompts.tsx`) CSV export'ta bunu kullanacak.

- [ ] **Step 1: `measureSinglePrompt` girişine `model` ekle**

`src/lib/panel.functions.ts:1734-1737` mevcut hali:

```typescript
export const measureSinglePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; promptId: string }) => input)
  .handler(async ({ data, context }) => {
```

Yeni hali:

```typescript
export const measureSinglePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; promptId: string; model?: string }) => input)
  .handler(async ({ data, context }) => {
    const model = sanitizeModel(data.model);
```

- [ ] **Step 2: Batch insert'e `model_id` yaz**

`src/lib/panel.functions.ts:1758-1768` mevcut hali:

```typescript
    const { data: batch, error: batchError } = await context.supabase
      .from("measurement_batches")
      .insert({
        brand_id: data.brandId,
        status: "running",
        engine: "agent_web_grounded",
        total_prompts: 1,
        completed_prompts: 0,
        measurement_mode: "single",
        prompt_ids: [data.promptId],
      } as never)
      .select("id")
      .single();
```

Yeni hali:

```typescript
    const { data: batch, error: batchError } = await context.supabase
      .from("measurement_batches")
      .insert({
        brand_id: data.brandId,
        status: "running",
        engine: "agent_web_grounded",
        total_prompts: 1,
        completed_prompts: 0,
        measurement_mode: "single",
        prompt_ids: [data.promptId],
        model_id: model ?? null,
      } as never)
      .select("id")
      .single();
```

- [ ] **Step 3: `measurePrompt` çağrısına `model` geçir, gerçek modeli `prompt_runs`'a yaz**

`src/lib/panel.functions.ts:1780-1786` mevcut hali:

```typescript
      const measured = await measurePrompt({
        brandName: brand.name,
        brandDomain: brand.domain,
        competitors: competitorNames(competitors),
        promptText: prompt.text,
        systemPrompt: await resolveSystemPrompt(context.supabase, "measurement_answer"),
      });
```

Yeni hali:

```typescript
      const measured = await measurePrompt({
        brandName: brand.name,
        brandDomain: brand.domain,
        competitors: competitorNames(competitors),
        promptText: prompt.text,
        systemPrompt: await resolveSystemPrompt(context.supabase, "measurement_answer"),
        model,
      });
```

`src/lib/panel.functions.ts:1805` mevcut hali (prompt_runs insert içindeki sabit satır):

```typescript
          model_id: "perplexity/preset-fast",
```

Yeni hali:

```typescript
          model_id: measured.model ?? "perplexity/preset-fast",
```

- [ ] **Step 4: `listPrompts` — son ölçümün modelini de döndür**

`src/lib/panel.functions.ts:347-352` mevcut hali:

```typescript
    const { data: runs } = await context.supabase
      .from("prompt_runs")
      .select("prompt_id, engine, created_at, brand_mentioned, position, visibility, run_index")
      .eq("brand_id", data.brandId)
      .order("created_at", { ascending: false })
      .limit(2000);
```

Yeni hali:

```typescript
    const { data: runs } = await context.supabase
      .from("prompt_runs")
      .select(
        "prompt_id, engine, created_at, brand_mentioned, position, visibility, run_index, model_id",
      )
      .eq("brand_id", data.brandId)
      .order("created_at", { ascending: false })
      .limit(2000);
```

`src/lib/panel.functions.ts:354-364` mevcut hali:

```typescript
    const latest = new Map<
      string,
      {
        engine: string;
        createdAt: string;
        brandMentioned: boolean;
        position: number | null;
        visibility: number;
        runIndex: number | null;
      }
    >();
```

Yeni hali:

```typescript
    const latest = new Map<
      string,
      {
        engine: string;
        createdAt: string;
        brandMentioned: boolean;
        position: number | null;
        visibility: number;
        runIndex: number | null;
        modelId: string | null;
      }
    >();
```

`src/lib/panel.functions.ts:375-382` mevcut hali:

```typescript
      latest.set(run.prompt_id, {
        engine: run.engine,
        createdAt: run.created_at,
        brandMentioned: Boolean(run.brand_mentioned),
        position: run.position,
        visibility,
        runIndex: run.run_index ?? null,
      });
```

Yeni hali:

```typescript
      latest.set(run.prompt_id, {
        engine: run.engine,
        createdAt: run.created_at,
        brandMentioned: Boolean(run.brand_mentioned),
        position: run.position,
        visibility,
        runIndex: run.run_index ?? null,
        modelId: (run as unknown as { model_id?: string | null }).model_id ?? null,
      });
```

- [ ] **Step 5: Derleme kontrolü**

Run: `npx tsc --noEmit -p . 2>&1 | grep panel.functions.ts || echo "no errors in this file"`
Expected: `no errors in this file`

- [ ] **Step 6: Commit**

```bash
git add src/lib/panel.functions.ts
git commit -m "feat(onecite): let single-prompt remeasure pin a model and surface it in listPrompts"
```

---

### Task 7: Frontend — model seçici UI

**Files:**
- Modify: `src/lib/use-measurement-run.ts`, `src/routes/_authenticated/app.prompts.tsx`

**Interfaces:**
- Consumes: Task 5/6'dan `startMeasurement(input: {brandId, model?})`, `measureSinglePrompt(input: {brandId, promptId, model?})`, `listPrompts` sonucundaki `lastRun.modelId`.
- Produces: `useMeasurementRun(brandId).run(model?: string)` — bu dosyanın dışında başka tüketicisi yok.

- [ ] **Step 1: `use-measurement-run.ts` — `run`'a model parametresi ekle**

`src/lib/use-measurement-run.ts:18-22` mevcut hali:

```typescript
  const run = useCallback(async () => {
    if (!brandId || progress !== null) return;
    setProgress({ done: 0, total: 0 });
    try {
      const { batch, promptIds } = await start({ data: { brandId } });
```

Yeni hali:

```typescript
  const run = useCallback(
    async (model?: string) => {
      if (!brandId || progress !== null) return;
      setProgress({ done: 0, total: 0 });
      try {
        const { batch, promptIds } = await start({ data: { brandId, model } });
```

Bu değişiklik, fonksiyon gövdesinin geri kalanının bir seviye daha içeri girintilenmesini gerektirir (`async () => {...}` → `async (model?: string) => {...}`). Dosyanın tamamını, yalnızca girinti ve imza değişmiş olarak yeniden yaz:

```typescript
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { startMeasurement, runMeasurementChunk, finishMeasurement } from "@/lib/panel.functions";

const CHUNK = 3;

export type MeasurementProgress = { done: number; total: number };

export function useMeasurementRun(brandId: string | undefined) {
  const queryClient = useQueryClient();
  const start = useServerFn(startMeasurement);
  const runChunk = useServerFn(runMeasurementChunk);
  const finish = useServerFn(finishMeasurement);
  const [progress, setProgress] = useState<MeasurementProgress | null>(null);

  const run = useCallback(
    async (model?: string) => {
      if (!brandId || progress !== null) return;
      setProgress({ done: 0, total: 0 });
      try {
        const { batch, promptIds } = await start({ data: { brandId, model } });
        if (promptIds.length === 0) {
          await finish({ data: { batchId: batch.id, brandId } });
          toast.success("Ölçüm tamamlandı, skorunuz güncellendi.");
          await queryClient.invalidateQueries({ queryKey: ["measurement-state", brandId] });
          await queryClient.invalidateQueries({ queryKey: ["brand-overview", brandId] });
          return;
        }
        setProgress({ done: 0, total: promptIds.length });
        let totalFailed = 0;
        for (let i = 0; i < promptIds.length; i += CHUNK) {
          const slice = promptIds.slice(i, i + CHUNK);
          const result = await runChunk({ data: { batchId: batch.id, brandId, promptIds: slice } });
          totalFailed += result.failedPromptIds?.length ?? 0;
          setProgress({ done: Math.min(i + CHUNK, promptIds.length), total: promptIds.length });
        }
        await finish({
          data: {
            batchId: batch.id,
            brandId,
            ...(totalFailed > 0 ? { failedCount: totalFailed } : {}),
          },
        });
        if (totalFailed > 0) {
          const measured = promptIds.length - totalFailed;
          toast.warning(`${totalFailed} soru ölçülemedi, ${measured} soru başarıyla ölçüldü.`);
        } else {
          toast.success("Ölçüm tamamlandı, skorunuz güncellendi.");
        }
        await queryClient.invalidateQueries({ queryKey: ["measurement-state", brandId] });
        await queryClient.invalidateQueries({ queryKey: ["brand-overview", brandId] });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ölçüm başarısız oldu.");
      } finally {
        setProgress(null);
      }
    },
    [brandId, progress, start, runChunk, finish, queryClient],
  );

  return { run, progress, running: progress !== null };
}
```

- [ ] **Step 2: `app.prompts.tsx` — Select importu ve model state'i ekle**

`src/routes/_authenticated/app.prompts.tsx:29` mevcut hali:

```typescript
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

Yeni hali (hemen altına ekle):

```typescript
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

`src/routes/_authenticated/app.prompts.tsx:80-83` mevcut hali:

```typescript
  const [filter, setFilter] = useState<string>("approved");
  const [draft, setDraft] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [openPrompt, setOpenPrompt] = useState<string | null>(promptFromSearch ?? null);
```

Yeni hali:

```typescript
  const [filter, setFilter] = useState<string>("approved");
  const [draft, setDraft] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [openPrompt, setOpenPrompt] = useState<string | null>(promptFromSearch ?? null);
  const [selectedModel, setSelectedModel] = useState<string>("auto");
```

`src/routes/_authenticated/app.prompts.tsx:61-65` mevcut hali (dosyanın üstündeki `FILTERS` sabitinin yanına, component dışına):

```typescript
const FILTERS = [
  { value: "approved", label: "Onaylı" },
  { value: "candidate", label: "Aday" },
  { value: "inactive", label: "Pasif" },
] as const;
```

Hemen altına ekle:

```typescript
const MEASUREMENT_MODELS = [
  { value: "auto", label: "Otomatik" },
  { value: "perplexity/sonar", label: "Sonar (hızlı)" },
  { value: "openai/gpt-5.6-luna", label: "GPT-5.6 Luna (orta)" },
] as const;
```

- [ ] **Step 3: "Tümünü ölç" ve "Yeniden ölç" çağrılarını seçili modelle geçir**

`src/routes/_authenticated/app.prompts.tsx:137-138` mevcut hali:

```typescript
  const singleMeasurement = useMutation({
    mutationFn: (promptId: string) => remeasurePrompt({ data: { brandId: brand!.id, promptId } }),
```

Yeni hali:

```typescript
  const singleMeasurement = useMutation({
    mutationFn: (promptId: string) =>
      remeasurePrompt({
        data: {
          brandId: brand!.id,
          promptId,
          ...(selectedModel !== "auto" ? { model: selectedModel } : {}),
        },
      }),
```

`src/routes/_authenticated/app.prompts.tsx:220` mevcut hali:

```typescript
            onClick={() => void runAll()}
```

Yeni hali:

```typescript
            onClick={() => void runAll(selectedModel !== "auto" ? selectedModel : undefined)}
```

- [ ] **Step 4: Model seçici `<Select>`'i header'a ekle**

`src/routes/_authenticated/app.prompts.tsx:217-230` mevcut hali:

```typescript
        action={
          <Button
            size="sm"
            onClick={() => void runAll()}
            disabled={measuringAll || !data.some((item) => item.status === "approved")}
          >
            {measuringAll ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="mr-2 h-3.5 w-3.5" />
            )}
            {measuringAll ? "Ölçülüyor…" : "Tümünü ölç"}
          </Button>
        }
```

Yeni hali:

```typescript
        action={
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-8 w-[190px] text-xs" aria-label="Ölçüm modeli">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEASUREMENT_MODELS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => void runAll(selectedModel !== "auto" ? selectedModel : undefined)}
              disabled={measuringAll || !data.some((item) => item.status === "approved")}
            >
              {measuringAll ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="mr-2 h-3.5 w-3.5" />
              )}
              {measuringAll ? "Ölçülüyor…" : "Tümünü ölç"}
            </Button>
          </div>
        }
```

(Step 3'teki `onClick` değişikliği bu blokla çakışıyor — Step 4'ü uygularken Step 3'ün `onClick` satırını ayrıca eklemene gerek yok, yukarıdaki tam blok zaten güncel `onClick`'i içeriyor.)

- [ ] **Step 5: CSV export'a model sütunu ekle**

`src/routes/_authenticated/app.prompts.tsx:154-186` mevcut hali:

```typescript
  const downloadCsv = () => {
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = visible.map((prompt) => [
      prompt.text,
      prompt.status,
      prompt.category,
      prompt.intent ?? "",
      prompt.lastRun?.visibility ?? "",
      prompt.lastRun?.brandMentioned ?? "",
      prompt.lastRun?.position ?? "",
      prompt.lastRun?.createdAt ?? "",
      prompt.lastRun?.engine ?? "agent_web_grounded",
    ]);
    const csv = [
      [
        "prompt",
        "status",
        "category",
        "intent",
        "visibility",
        "brand_mentioned",
        "position",
        "measured_at",
        "measurement_surface",
      ],
      ...rows,
    ]
      .map((row) => row.map(escape).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${brand?.domain ?? "onecite"}-visibility.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
```

Yeni hali:

```typescript
  const downloadCsv = () => {
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = visible.map((prompt) => [
      prompt.text,
      prompt.status,
      prompt.category,
      prompt.intent ?? "",
      prompt.lastRun?.visibility ?? "",
      prompt.lastRun?.brandMentioned ?? "",
      prompt.lastRun?.position ?? "",
      prompt.lastRun?.createdAt ?? "",
      prompt.lastRun?.engine ?? "agent_web_grounded",
      prompt.lastRun?.modelId ?? "auto",
    ]);
    const csv = [
      [
        "prompt",
        "status",
        "category",
        "intent",
        "visibility",
        "brand_mentioned",
        "position",
        "measured_at",
        "measurement_surface",
        "model",
      ],
      ...rows,
    ]
      .map((row) => row.map(escape).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${brand?.domain ?? "onecite"}-visibility.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
```

- [ ] **Step 6: Derleme kontrolü**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "app\.prompts\.tsx|use-measurement-run\.ts" || echo "no errors in these files"`
Expected: `no errors in these files`

- [ ] **Step 7: Dev sunucusunda manuel doğrulama**

Run: `npm run dev` (arka planda başlat), tarayıcıda `/app/prompts`'a git.

- Model seçiciyi "GPT-5.6 Luna (orta)"ya çevirip bir promptu "Yeniden ölç" ile ölç; ölçüm bitince prompt satırındaki görünürlük yüzdesinin güncellendiğini gözle.
- Aynı promptu bu kez "Sonar (hızlı)" ile tekrar ölç; iki ölçümün farklı cevap/model üretebildiğini (cache'in karışmadığını) CSV export'unu indirip `model` sütunundan doğrula (`openai/gpt-5.6-luna` vs `perplexity/sonar` görünmeli).
- "Otomatik" ile "Tümünü ölç"ü çalıştır, turun sorunsuz bittiğini doğrula.

Expected: Üç senaryo da hatasız tamamlanır, CSV'deki `model` sütunu seçime göre değişir.

- [ ] **Step 8: Commit**

```bash
git add src/lib/use-measurement-run.ts src/routes/_authenticated/app.prompts.tsx
git commit -m "feat(onecite): add a grounded-model picker to the measurement workspace"
```
