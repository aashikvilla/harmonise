const META_API_BASE = "https://api.meta.ai/v1";
const DEFAULT_TEXT_MODEL = "muse-spark-1.3";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ChatOptions = {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  responseFormat?: Record<string, unknown>;
};

export class MetaModelError extends Error {
  constructor(readonly status: number) {
    super("Meta Model API request failed");
  }
}

export function configuredTextModel() {
  return process.env.META_TEXT_MODEL?.trim() || DEFAULT_TEXT_MODEL;
}

export async function requestMetaChat(options: ChatOptions): Promise<string> {
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey) throw new MetaModelError(503);

  let response: Response;
  try {
    response = await fetch(`${META_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: configuredTextModel(),
        messages: options.messages,
        max_tokens: options.maxTokens ?? 600,
        temperature: options.temperature ?? 0.6,
        ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new MetaModelError(503);
  }

  if (!response.ok) throw new MetaModelError(response.status);

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new MetaModelError(502);
  }

  if (typeof data !== "object" || data === null) throw new MetaModelError(502);
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) throw new MetaModelError(502);
  const first = choices[0] as { message?: { content?: unknown } } | null;
  const content = first?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) throw new MetaModelError(502);
  return content;
}

const requestLog = new Map<string, number[]>();

export function isRateLimited(request: Request, scope: string, maxRequests: number, windowMs = 60_000) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${scope}:${client}`;
  const cutoff = Date.now() - windowMs;
  const recent = (requestLog.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
  if (recent.length >= maxRequests) {
    requestLog.set(key, recent);
    return true;
  }
  recent.push(Date.now());
  requestLog.set(key, recent);
  if (requestLog.size > 5000) requestLog.clear();
  return false;
}

export function modelFailureStatus(error: unknown) {
  if (!(error instanceof MetaModelError)) return 503;
  if (error.status === 429) return 503;
  if (error.status >= 400 && error.status < 500 && error.status !== 408) return 502;
  return error.status;
}
