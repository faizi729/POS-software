export type OpenRouterModel =
  | "mistralai/mistral-small-3.1-24b-instruct"
  | "deepseek/deepseek-chat"
  | string;

export type OpenRouterChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function openRouterChatJson<T>(params: {
  apiKey: string;
  model: OpenRouterModel;
  messages: OpenRouterChatMessage[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  retries?: number;
}) {
  const timeoutMs = params.timeoutMs ?? 45_000;
  const retries = params.retries ?? 1;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: params.model,
          temperature: params.temperature ?? 0.2,
          max_tokens: params.maxTokens ?? 900,
          messages: params.messages
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenRouter error ${response.status}: ${text.slice(0, 500)}`);
      }

      const payload = (await response.json()) as any;
      const content = String(payload?.choices?.[0]?.message?.content ?? "");
      const jsonText = extractFirstJsonObject(content);
      if (!jsonText) {
        throw new Error("OpenRouter returned no JSON object.");
      }
      return JSON.parse(jsonText) as T;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenRouter request failed.");
}

function extractFirstJsonObject(text: string) {
  // Strict JSON only is requested, but we still guard for leading/trailing chatter.
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) {
      return text.slice(start, i + 1).trim();
    }
  }
  return null;
}

