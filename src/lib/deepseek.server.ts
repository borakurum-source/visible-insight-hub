type ChatMessage = { role: "system" | "user"; content: string };

export async function deepseekJson<T>(messages: ChatMessage[], fallback: T): Promise<T> {
  const { withCache, CACHE_TTL } = await import("./cache.server");
  return withCache<T>(
    "deepseek",
    { messages },
    CACHE_TTL.deepseek,
    () => deepseekJsonUncached(messages, fallback),
    (value) => value !== fallback,
  );
}

async function deepseekJsonUncached<T>(messages: ChatMessage[], fallback: T): Promise<T> {
  const { recordApiUsage } = await import("./observability.server");
  const startedAt = Date.now();
  const key = process.env["DEEPSEEK_API_KEY"];
  if (!key) {
    console.warn("DEEPSEEK_API_KEY missing");
    return fallback;
  }
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          ...messages,
          { role: "system" as const, content: "Yanıtı yalnızca geçerli JSON olarak döndür. Açıklama, markdown kod bloğu veya ek metin ekleme." },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("DeepSeek error", res.status, body);
      recordApiUsage({
        provider: "deepseek", operation: "chat.json", model: "deepseek-chat",
        durationMs: Date.now() - startedAt,
        status: res.status === 429 ? "rate_limited" : "error",
        error: `${res.status} ${body.slice(0, 400)}`,
      });
      return fallback;
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    recordApiUsage({
      provider: "deepseek", operation: "chat.json", model: "deepseek-chat",
      durationMs: Date.now() - startedAt,
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
    });
    const content = json.choices?.[0]?.message?.content;
    if (!content) return fallback;
    return JSON.parse(content) as T;
  } catch (error) {
    console.error("DeepSeek failure", error);
    recordApiUsage({
      provider: "deepseek", operation: "chat.json", model: "deepseek-chat",
      durationMs: Date.now() - startedAt, status: "error", error: String(error),
    });
    return fallback;
  }
}
