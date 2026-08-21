import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createAiGateway, resolveAiRoute } from "./ai-gateway.server";

const messages = [{ role: "user" as const, content: "OneCite nedir?" }];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("resolveAiRoute", () => {
  it("keeps strong model names in the central role table", () => {
    expect(resolveAiRoute("structured_strong", false)).toEqual({
      surface: "agent",
      models: ["openai/gpt-5.6-sol", "openai/gpt-5.6-terra"],
      tools: [],
    });
  });

  it("falls bulk work back to Luna when Router is unavailable", () => {
    expect(resolveAiRoute("bulk_fast", false)).toEqual({
      surface: "agent",
      models: ["openai/gpt-5.6-luna"],
      tools: [],
    });
  });

  it("uses the Perplexity-hosted flash model only through Router", () => {
    expect(resolveAiRoute("bulk_fast", true)).toEqual({
      surface: "router",
      models: ["perplexity/deepseek-v4-flash-0731"],
      tools: [],
    });
  });
});

describe("Perplexity AI gateway", () => {
  it("returns grounded text and citations without pretending to be a consumer surface", async () => {
    const gateway = createAiGateway({
      apiKey: "test-key",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse({
          model: "perplexity/sonar",
          output: [
            { type: "search_results", results: [{ url: "https://example.com/a", title: "A" }] },
            { type: "message", content: [{ type: "output_text", text: "Kaynaklı yanıt" }] },
          ],
        }),
      ),
      routerAvailable: false,
      recordUsage: vi.fn(),
    });

    const response = await gateway.text({
      role: "search_fast",
      messages,
      tools: [{ type: "web_search" }],
    });

    expect(response.data).toBe("Kaynaklı yanıt");
    expect(response.citations).toEqual(["https://example.com/a"]);
    expect(response.surface).toBe("agent");
  });

  it("falls from the dynamic fast preset to explicit Sonar search", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: "preset unavailable" }, 400))
      .mockResolvedValueOnce(
        jsonResponse({
          model: "perplexity/sonar",
          output: [
            { type: "search_results", results: [{ url: "https://example.com", title: "E" }] },
            { type: "message", content: [{ type: "output_text", text: "Sonar kanıtı" }] },
          ],
        }),
      );
    const gateway = createAiGateway({
      apiKey: "test-key",
      fetch: fetchMock,
      routerAvailable: false,
      recordUsage: vi.fn(),
    });

    const response = await gateway.text({ role: "search_fast", messages });

    expect(response.data).toBe("Sonar kanıtı");
    expect(response.model).toBe("perplexity/sonar");
    expect(response.fallbackFrom).toBe("preset:fast");
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual(
      expect.objectContaining({ models: ["perplexity/sonar"] }),
    );
  });

  it("retries bounded 429 responses and preserves search evidence", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: "rate limited" }, 429))
      .mockResolvedValueOnce(jsonResponse({ error: "rate limited" }, 429))
      .mockResolvedValueOnce(
        jsonResponse({
          model: "perplexity/sonar",
          output: [
            {
              type: "search_results",
              results: [{ url: "https://example.com/report", title: "Kaynak", snippet: "Kanıt" }],
            },
            { type: "message", content: [{ type: "output_text", text: '{"score":81}' }] },
          ],
          usage: { input_tokens: 10, output_tokens: 4, cost: { total_cost: 0.001 } },
        }),
      );
    const sleep = vi.fn(async () => undefined);
    const gateway = createAiGateway({
      apiKey: "test-key",
      fetch: fetchMock,
      sleep,
      routerAvailable: false,
      recordUsage: vi.fn(),
    });

    const response = await gateway.json({
      role: "search_fast",
      messages,
      schema: z.object({ score: z.number() }),
      jsonSchema: {
        name: "score",
        schema: { type: "object", properties: { score: { type: "number" } }, required: ["score"] },
      },
      tools: [{ type: "web_search" }],
    });

    expect(response.data).toEqual({ score: 81 });
    expect(response.sources).toEqual([
      {
        url: "https://example.com/report",
        domain: "example.com",
        title: "Kaynak",
        snippet: "Kanıt",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid structured output instead of manufacturing fallback data", async () => {
    const gateway = createAiGateway({
      apiKey: "test-key",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse({
          model: "openai/gpt-5.6-sol",
          output: [
            { type: "message", content: [{ type: "output_text", text: '{"score":"unknown"}' }] },
          ],
        }),
      ),
      routerAvailable: false,
      recordUsage: vi.fn(),
    });

    await expect(
      gateway.json({
        role: "structured_strong",
        messages,
        schema: z.object({ score: z.number() }),
        jsonSchema: {
          name: "score",
          schema: { type: "object", properties: { score: { type: "number" } } },
        },
      }),
    ).rejects.toThrow("AI structured output validation failed");
  });

  it("falls from an unavailable Router request to Agent Luna and records the fallback", async () => {
    const usage = vi.fn();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: "private preview unavailable" }, 403))
      .mockResolvedValueOnce(
        jsonResponse({
          model: "openai/gpt-5.6-luna",
          output: [{ type: "message", content: [{ type: "output_text", text: '{"label":"ok"}' }] }],
          usage: { input_tokens: 7, output_tokens: 2 },
        }),
      );
    const gateway = createAiGateway({
      apiKey: "test-key",
      fetch: fetchMock,
      routerAvailable: true,
      recordUsage: usage,
    });

    const response = await gateway.json({
      role: "bulk_fast",
      messages,
      schema: z.object({ label: z.string() }),
      jsonSchema: {
        name: "label",
        schema: { type: "object", properties: { label: { type: "string" } } },
      },
    });

    expect(response.data).toEqual({ label: "ok" });
    expect(response.surface).toBe("agent");
    expect(response.fallbackFrom).toBe("perplexity/deepseek-v4-flash-0731");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(usage).toHaveBeenCalledWith(
      expect.objectContaining({ fallback: true, model: "openai/gpt-5.6-luna" }),
    );
  });
});
