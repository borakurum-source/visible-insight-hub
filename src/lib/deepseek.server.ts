type ChatMessage = { role: "system" | "user"; content: string };

export async function deepseekJson<T>(messages: ChatMessage[], fallback: T): Promise<T> {
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
      console.error("DeepSeek error", res.status, await res.text());
      return fallback;
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return fallback;
    return JSON.parse(content) as T;
  } catch (error) {
    console.error("DeepSeek failure", error);
    return fallback;
  }
}
