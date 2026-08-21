import type { ZodType } from "zod";

export type AiRole =
  | "bulk_fast"
  | "search_fast"
  | "research_standard"
  | "structured_strong"
  | "editorial_premium"
  | "audit_critical";

export type AiSurface = "agent" | "router";
export type AiMessage = { role: "system" | "user" | "assistant"; content: string };
export type AiTool =
  | { type: "web_search"; filters?: Record<string, unknown> }
  | { type: "fetch_url"; urls?: string[] };

export type AiRoute = {
  surface: AiSurface;
  models: string[];
  preset?: "fast" | "medium";
  tools: AiTool[];
};

const ROUTER_FLASH_MODEL = "perplexity/deepseek-v4-flash-0731";
const AGENT_LUNA_MODEL = "openai/gpt-5.6-luna";

/** Model kimliklerinin is koduna dagilmasini engelleyen tek rol tablosu. */
export function resolveAiRoute(role: AiRole, routerAvailable: boolean): AiRoute {
  switch (role) {
    case "bulk_fast":
      return routerAvailable
        ? { surface: "router", models: [ROUTER_FLASH_MODEL], tools: [] }
        : { surface: "agent", models: [AGENT_LUNA_MODEL], tools: [] };
    case "search_fast":
      return { surface: "agent", models: [], preset: "fast", tools: [{ type: "web_search" }] };
    case "research_standard":
      return { surface: "agent", models: [], preset: "medium", tools: [{ type: "web_search" }] };
    case "structured_strong":
      return {
        surface: "agent",
        models: ["openai/gpt-5.6-sol", "openai/gpt-5.6-terra"],
        tools: [],
      };
    case "editorial_premium":
      return {
        surface: "agent",
        models: ["anthropic/claude-sonnet-5", "openai/gpt-5.6-sol"],
        tools: [],
      };
    case "audit_critical":
      return {
        surface: "agent",
        models: ["anthropic/claude-opus-5", "anthropic/claude-sonnet-5"],
        tools: [],
      };
  }
}

function resolveAgentFallback(role: AiRole): { route: AiRoute; label: string } | null {
  if (role === "search_fast") {
    return {
      route: {
        surface: "agent",
        models: ["perplexity/sonar"],
        tools: [{ type: "web_search" }],
      },
      label: "preset:fast",
    };
  }
  if (role === "research_standard") {
    return {
      route: {
        surface: "agent",
        models: [AGENT_LUNA_MODEL],
        tools: [{ type: "web_search" }],
      },
      label: "preset:medium",
    };
  }
  return null;
}

export type AiSource = {
  url: string;
  domain: string;
  title: string;
  snippet?: string;
};

type UsageEvent = {
  provider: "perplexity-agent" | "perplexity-router";
  operation: string;
  model: string | null;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd?: number;
  status: "ok" | "error" | "rate_limited";
  error?: string;
  fallback: boolean;
  tools: string[];
  preset?: string;
  surface: AiSurface;
  schemaValid?: boolean;
  brandId?: string;
  userId?: string;
};

export type AiGatewayDependencies = {
  apiKey?: string;
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  routerAvailable?: boolean;
  recordUsage?: (entry: UsageEvent) => void;
  now?: () => number;
};

export type AiRequestBase = {
  role: AiRole;
  messages: AiMessage[];
  tools?: AiTool[];
  maxOutputTokens?: number;
  brandId?: string;
  userId?: string;
};

export type AiJsonRequest<T> = AiRequestBase & {
  schema: ZodType<T>;
  jsonSchema: { name: string; schema: object };
};

export type AiGatewayResponse<T> = {
  data: T;
  sources: AiSource[];
  citations: string[];
  model: string | null;
  surface: AiSurface;
  preset?: string;
  fallbackFrom?: string;
  usage: { inputTokens: number; outputTokens: number; costUsd?: number };
};

class ProviderHttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`Perplexity request failed [${status}]: ${body.slice(0, 500)}`);
  }
}

type RawResponse = {
  text: string;
  model: string | null;
  citations: string[];
  sources: AiSource[];
  usage: { inputTokens: number; outputTokens: number; costUsd?: number };
};

function domainFromUrl(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function collectAgentOutput(body: Record<string, unknown>): RawResponse {
  const sources = new Map<string, AiSource>();
  const output = Array.isArray(body.output) ? body.output : [];
  let text = "";

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (record.type === "search_results" && Array.isArray(record.results)) {
      for (const raw of record.results) {
        if (!raw || typeof raw !== "object") continue;
        const result = raw as Record<string, unknown>;
        const url = String(result.url ?? "").trim();
        const domain = domainFromUrl(url);
        if (!url || !domain) continue;
        sources.set(url, {
          url,
          domain,
          title: String(result.title ?? domain),
          ...(result.snippet ? { snippet: String(result.snippet) } : {}),
        });
      }
    }
    if (Array.isArray(record.content)) {
      for (const part of record.content) {
        if (!part || typeof part !== "object") continue;
        const content = part as Record<string, unknown>;
        if (content.type === "output_text" && typeof content.text === "string")
          text += content.text;
      }
    }
  }

  const topCitations = Array.isArray(body.citations) ? body.citations.map(String) : [];
  for (const url of topCitations) {
    const domain = domainFromUrl(url);
    if (domain && !sources.has(url)) sources.set(url, { url, domain, title: domain });
  }

  const usage = (body.usage && typeof body.usage === "object" ? body.usage : {}) as Record<
    string,
    unknown
  >;
  const cost = (usage.cost && typeof usage.cost === "object" ? usage.cost : {}) as Record<
    string,
    unknown
  >;
  return {
    text,
    model: typeof body.model === "string" ? body.model : null,
    citations: topCitations.length ? topCitations : [...sources.keys()],
    sources: [...sources.values()],
    usage: {
      inputTokens: Number(usage.input_tokens ?? usage.prompt_tokens ?? 0),
      outputTokens: Number(usage.output_tokens ?? usage.completion_tokens ?? 0),
      ...(Number.isFinite(Number(cost.total_cost)) ? { costUsd: Number(cost.total_cost) } : {}),
    },
  };
}

function collectRouterOutput(body: Record<string, unknown>): RawResponse {
  const choices = Array.isArray(body.choices) ? body.choices : [];
  const first =
    choices[0] && typeof choices[0] === "object" ? (choices[0] as Record<string, unknown>) : {};
  const message =
    first.message && typeof first.message === "object"
      ? (first.message as Record<string, unknown>)
      : {};
  const usage =
    body.usage && typeof body.usage === "object" ? (body.usage as Record<string, unknown>) : {};
  return {
    text: typeof message.content === "string" ? message.content : "",
    model: typeof body.model === "string" ? body.model : null,
    citations: [],
    sources: [],
    usage: {
      inputTokens: Number(usage.prompt_tokens ?? usage.input_tokens ?? 0),
      outputTokens: Number(usage.completion_tokens ?? usage.output_tokens ?? 0),
    },
  };
}

async function defaultRecordUsage(entry: UsageEvent) {
  const { recordApiUsage } = await import("./observability.server");
  recordApiUsage({
    ...entry,
    operation: `${entry.operation}${entry.fallback ? ".fallback" : ""}`,
  });
}

export function createAiGateway(dependencies: AiGatewayDependencies = {}) {
  const fetchImpl = dependencies.fetch ?? fetch;
  const sleep =
    dependencies.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const now = dependencies.now ?? Date.now;
  const recordUsage =
    dependencies.recordUsage ?? ((entry: UsageEvent) => void defaultRecordUsage(entry));
  const apiKey = dependencies.apiKey ?? process.env["PERPLEXITY_API_KEY"];
  let catalogPromise: Promise<boolean> | undefined;

  async function hasRouterModel(): Promise<boolean> {
    if (dependencies.routerAvailable !== undefined) return dependencies.routerAvailable;
    if (process.env["PERPLEXITY_ROUTER_ENABLED"] !== "true" || !apiKey) return false;
    catalogPromise ??= (async () => {
      try {
        const response = await fetchImpl("https://api.perplexity.ai/router/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) return false;
        const body = (await response.json()) as {
          data?: Array<{ id?: string }>;
          models?: Array<{ id?: string }>;
        };
        return [...(body.data ?? []), ...(body.models ?? [])].some(
          (model) => model.id === ROUTER_FLASH_MODEL,
        );
      } catch {
        return false;
      }
    })();
    return catalogPromise;
  }

  async function postWithRetry(
    url: string,
    body: object,
    attempts = 3,
  ): Promise<Record<string, unknown>> {
    if (!apiKey) throw new Error("PERPLEXITY_API_KEY missing");
    let lastError: ProviderHttpError | undefined;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });
      const raw = await response.text();
      if (response.ok) return JSON.parse(raw) as Record<string, unknown>;
      lastError = new ProviderHttpError(response.status, raw);
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts - 1)
        throw lastError;
      await sleep(250 * 2 ** attempt);
    }
    throw lastError ?? new Error("Perplexity request failed");
  }

  function agentPayload<T>(request: AiJsonRequest<T> | AiRequestBase, route: AiRoute) {
    const instructions = request.messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");
    const input = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content }));
    const tools = request.tools ?? route.tools;
    const structured =
      "jsonSchema" in request
        ? { response_format: { type: "json_schema", json_schema: request.jsonSchema } }
        : {};
    return {
      ...(instructions ? { instructions } : {}),
      input,
      ...(route.preset ? { preset: route.preset } : { models: route.models }),
      ...(tools.length ? { tools } : {}),
      max_output_tokens: request.maxOutputTokens ?? 2048,
      ...structured,
    };
  }

  async function execute<T>(request: AiJsonRequest<T>): Promise<AiGatewayResponse<T>> {
    const routerAvailable = await hasRouterModel();
    const primary = resolveAiRoute(request.role, routerAvailable);
    const startedAt = now();
    let route = primary;
    let fallbackFrom: string | undefined;
    let raw: RawResponse;

    try {
      if (route.surface === "router") {
        const body = await postWithRetry("https://api.perplexity.ai/router/v1/chat/completions", {
          model: route.models[0],
          messages: request.messages,
          max_tokens: request.maxOutputTokens ?? 2048,
          response_format: { type: "json_object" },
        });
        raw = collectRouterOutput(body);
      } else {
        raw = collectAgentOutput(
          await postWithRetry("https://api.perplexity.ai/v1/agent", agentPayload(request, route)),
        );
      }
    } catch (error) {
      if (primary.surface !== "router") {
        const agentFallback = resolveAgentFallback(request.role);
        if (agentFallback) {
          fallbackFrom = agentFallback.label;
          route = agentFallback.route;
          raw = collectAgentOutput(
            await postWithRetry("https://api.perplexity.ai/v1/agent", agentPayload(request, route)),
          );
        } else {
          const http = error instanceof ProviderHttpError ? error : undefined;
          recordUsage({
            provider: "perplexity-agent",
            operation: request.role,
            model: primary.models[0] ?? null,
            durationMs: now() - startedAt,
            inputTokens: 0,
            outputTokens: 0,
            status: http?.status === 429 ? "rate_limited" : "error",
            error: error instanceof Error ? error.message : String(error),
            fallback: false,
            tools: (request.tools ?? primary.tools).map((tool) => tool.type),
            preset: primary.preset,
            surface: primary.surface,
            schemaValid: false,
            brandId: request.brandId,
            userId: request.userId,
          });
          throw error;
        }
      } else {
        fallbackFrom = primary.models[0];
        route = resolveAiRoute("bulk_fast", false);
        raw = collectAgentOutput(
          await postWithRetry("https://api.perplexity.ai/v1/agent", agentPayload(request, route)),
        );
      }
    }

    const recordStructuredUsage = (
      status: UsageEvent["status"],
      schemaValid: boolean,
      error?: string,
    ) =>
      recordUsage({
        provider: route.surface === "router" ? "perplexity-router" : "perplexity-agent",
        operation: request.role,
        model: raw.model ?? route.models[0] ?? null,
        durationMs: now() - startedAt,
        inputTokens: raw.usage.inputTokens,
        outputTokens: raw.usage.outputTokens,
        costUsd: raw.usage.costUsd,
        status,
        error,
        fallback: Boolean(fallbackFrom),
        tools: (request.tools ?? route.tools).map((tool) => tool.type),
        preset: route.preset,
        surface: route.surface,
        schemaValid,
        brandId: request.brandId,
        userId: request.userId,
      });

    let decoded: unknown;
    try {
      decoded = JSON.parse(raw.text);
    } catch {
      const error = "AI structured output was not valid JSON";
      recordStructuredUsage("error", false, error);
      throw new Error(error);
    }
    const validated = request.schema.safeParse(decoded);
    if (!validated.success) {
      const error = `AI structured output validation failed: ${validated.error.issues.map((issue) => issue.message).join("; ")}`;
      recordStructuredUsage("error", false, error);
      throw new Error(error);
    }
    recordStructuredUsage("ok", true);

    return {
      data: validated.data,
      sources: raw.sources,
      citations: raw.citations,
      model: raw.model ?? route.models[0] ?? null,
      surface: route.surface,
      ...(route.preset ? { preset: route.preset } : {}),
      ...(fallbackFrom ? { fallbackFrom } : {}),
      usage: raw.usage,
    };
  }

  async function executeText(request: AiRequestBase): Promise<AiGatewayResponse<string>> {
    const routerAvailable = await hasRouterModel();
    let route = resolveAiRoute(request.role, routerAvailable);
    const startedAt = now();
    let fallbackFrom: string | undefined;
    let raw: RawResponse;
    try {
      if (route.surface === "router") {
        raw = collectRouterOutput(
          await postWithRetry("https://api.perplexity.ai/router/v1/chat/completions", {
            model: route.models[0],
            messages: request.messages,
            max_tokens: request.maxOutputTokens ?? 2048,
          }),
        );
      } else {
        raw = collectAgentOutput(
          await postWithRetry("https://api.perplexity.ai/v1/agent", agentPayload(request, route)),
        );
      }
    } catch (error) {
      const agentFallback = resolveAgentFallback(request.role);
      if (route.surface !== "router" && !agentFallback) throw error;
      fallbackFrom = route.surface === "router" ? route.models[0] : agentFallback!.label;
      route =
        route.surface === "router" ? resolveAiRoute("bulk_fast", false) : agentFallback!.route;
      raw = collectAgentOutput(
        await postWithRetry("https://api.perplexity.ai/v1/agent", agentPayload(request, route)),
      );
    }
    if (!raw.text.trim()) throw new Error("Perplexity response missing output text");
    recordUsage({
      provider: route.surface === "router" ? "perplexity-router" : "perplexity-agent",
      operation: request.role,
      model: raw.model ?? route.models[0] ?? null,
      durationMs: now() - startedAt,
      inputTokens: raw.usage.inputTokens,
      outputTokens: raw.usage.outputTokens,
      costUsd: raw.usage.costUsd,
      status: "ok",
      fallback: Boolean(fallbackFrom),
      tools: (request.tools ?? route.tools).map((tool) => tool.type),
      preset: route.preset,
      surface: route.surface,
      brandId: request.brandId,
      userId: request.userId,
    });
    return {
      data: raw.text,
      sources: raw.sources,
      citations: raw.citations,
      model: raw.model ?? route.models[0] ?? null,
      surface: route.surface,
      ...(route.preset ? { preset: route.preset } : {}),
      ...(fallbackFrom ? { fallbackFrom } : {}),
      usage: raw.usage,
    };
  }

  return { json: execute, text: executeText, hasRouterModel };
}

export const aiGateway = createAiGateway();
