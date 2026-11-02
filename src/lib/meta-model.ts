const META_API_BASE = "https://api.meta.ai/v1";
const DEFAULT_TEXT_MODEL = "muse-spark-1.3";
const DEFAULT_SETUP_MODEL = "muse-spark-1.3";
const SETUP_MODELS = new Set(["muse-spark-1.3", "muse-wonder-1.0"]);
const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._/-]{0,63}$/i;
const CHAT_TIMEOUT_MS = 30_000;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ChatOptions = {
  messages: ChatMessage[];
  /** Server-selected model override. Never pass through a client-supplied model id. */
  model?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: Record<string, unknown>;
};

export type MetaModelErrorKind =
  | "missing-key"
  | "invalid-model"
  | "timeout"
  | "rate-limited"
  | "bad-request"
  | "provider-error"
  | "bad-response"
  | "network-error";

export class MetaModelError extends Error {
  constructor(
    readonly status: number,
    readonly kind: MetaModelErrorKind = "provider-error",
  ) {
    super("Meta Model API request failed");
  }
}

export type MetaUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type MetaResult = {
  text: string;
  usage: MetaUsage;
  latencyMs: number;
  model: string;
};

export function configuredTextModel() {
  return process.env.META_TEXT_MODEL?.trim() || DEFAULT_TEXT_MODEL;
}

/**
 * Setup copilot model switch for controlled synthetic evaluation only.
 * The client cannot select this value, and failures do not fall back to another model.
 */
export function configuredSetupModel() {
  const model = process.env.META_SETUP_MODEL?.trim() || DEFAULT_SETUP_MODEL;
  if (!SETUP_MODELS.has(model) || (model === "muse-wonder-1.0" && process.env.NODE_ENV === "production")) {
    throw new MetaModelError(503, "invalid-model");
  }
  return model;
}

function validModelId(value: string) {
  return MODEL_ID_PATTERN.test(value);
}

function readTokenCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined;
}

function parseUsage(data: Record<string, unknown>): MetaUsage {
  const usage = data.usage;
  if (typeof usage !== "object" || usage === null) return {};
  const record = usage as Record<string, unknown>;
  const inputTokens = readTokenCount(record.prompt_tokens ?? record.input_tokens);
  const outputTokens = readTokenCount(record.completion_tokens ?? record.output_tokens);
  const totalTokens = readTokenCount(record.total_tokens);
  const result: MetaUsage = {};
  if (inputTokens !== undefined) result.inputTokens = inputTokens;
  if (outputTokens !== undefined) result.outputTokens = outputTokens;
  if (totalTokens !== undefined) result.totalTokens = totalTokens;
  return result;
}

export async function requestMetaChatDetailed(options: ChatOptions): Promise<MetaResult> {
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey) throw new MetaModelError(503, "missing-key");
  const model = options.model ?? configuredTextModel();
  if (!validModelId(model)) throw new MetaModelError(503, "invalid-model");

  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(`${META_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        max_completion_tokens: options.maxTokens ?? 600,
        temperature: options.temperature ?? 0.6,
        reasoning_effort: "minimal",
        ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
      }),
      signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") throw new MetaModelError(503, "timeout");
    throw new MetaModelError(503, "network-error");
  }
  const latencyMs = Date.now() - started;

  if (!response.ok) {
    if (response.status === 429) throw new MetaModelError(429, "rate-limited");
    if (response.status === 408) throw new MetaModelError(503, "timeout");
    if (response.status >= 400 && response.status < 500) throw new MetaModelError(response.status, "bad-request");
    throw new MetaModelError(response.status, "provider-error");
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new MetaModelError(502, "bad-response");
  }

  if (typeof data !== "object" || data === null) throw new MetaModelError(502, "bad-response");
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) throw new MetaModelError(502, "bad-response");
  const first = choices[0] as { message?: { content?: unknown } } | null;
  const content = first?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) throw new MetaModelError(502, "bad-response");
  return { text: content, usage: parseUsage(data as Record<string, unknown>), latencyMs, model };
}

export async function requestMetaChat(options: ChatOptions): Promise<string> {
  return (await requestMetaChatDetailed(options)).text;
}

export type RateLimitStore = {
  /** Returns true when the caller is over budget and the request must be rejected. */
  checkAndRecord(key: string, maxRequests: number, windowMs: number): boolean | Promise<boolean>;
};

const MAX_MEMORY_BUCKETS = 5000;

function createMemoryRateLimitStore(): RateLimitStore {
  const requestLog = new Map<string, number[]>();
  return {
    checkAndRecord(key, maxRequests, windowMs) {
      const cutoff = Date.now() - windowMs;
      const recent = (requestLog.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
      if (recent.length >= maxRequests) {
        requestLog.set(key, recent);
        return true;
      }
      recent.push(Date.now());
      requestLog.set(key, recent);
      if (requestLog.size > MAX_MEMORY_BUCKETS) requestLog.clear();
      return false;
    },
  };
}

let activeRateLimitStore: RateLimitStore = createMemoryRateLimitStore();
let sharedStoreConfigured = false;

export function createMemoryRateLimitStoreForTests() {
  return createMemoryRateLimitStore();
}

/** Swap the process-memory limiter for a shared backend (required before a public pilot). */
export function configureRateLimitStore(store: RateLimitStore) {
  activeRateLimitStore = store;
  sharedStoreConfigured = true;
}

export function isSharedRateLimitStoreConfigured() {
  return sharedStoreConfigured;
}

export function clientKey(request: Request, scope: string) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${client}`;
}

export async function checkRateLimit(request: Request, scope: string, maxRequests: number, windowMs = 60_000) {
  return activeRateLimitStore.checkAndRecord(clientKey(request, scope), maxRequests, windowMs);
}

/** Per-account limiting for authenticated routes (no NAT collateral, no cross-user interference). */
export async function checkUserRateLimit(userId: string, scope: string, maxRequests: number, windowMs = 60_000) {
  return activeRateLimitStore.checkAndRecord(`user:${scope}:${userId}`, maxRequests, windowMs);
}

const legacyMemoryStore = createMemoryRateLimitStore();

/** Synchronous single-instance limiter. Prefer {@link checkRateLimit} in routes. */
export function isRateLimited(request: Request, scope: string, maxRequests: number, windowMs = 60_000) {
  const result = legacyMemoryStore.checkAndRecord(clientKey(request, scope), maxRequests, windowMs);
  return result === true;
}

export function modelFailureStatus(error: unknown) {
  if (!(error instanceof MetaModelError)) return 503;
  if (error.status === 429) return 503;
  if (error.status >= 400 && error.status < 500 && error.status !== 408) return 502;
  return error.status;
}

export function modelErrorKind(error: unknown): MetaModelErrorKind {
  return error instanceof MetaModelError ? error.kind : "network-error";
}
