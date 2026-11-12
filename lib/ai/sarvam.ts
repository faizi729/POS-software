/**
 * Sarvam AI client — Chat Completions + Document AI (Sarvam Vision).
 *
 * Docs: https://docs.sarvam.ai
 * - Auth header: `api-subscription-key` (Bearer also accepted).
 * - Invalid/missing key returns **403** with `error.code = invalid_api_key_error` (not 401).
 * - Chat:      POST {base}/v1/chat/completions          (models: sarvam-105b, sarvam-105b-conversations)
 * - Parse OCR: POST {base}/doc-ai/v1/job/parse          -> { job_id }  (async)
 * - Status:    GET  {base}/doc-ai/v1/job/{id}/status    -> completed | partially_completed | failed | rejected
 * - Results:   GET  {base}/doc-ai/v1/job/{id}/results?format=md|html|json
 * - Extract:   POST {base}/doc-ai/v1/job/extract        (schema-based field extraction)
 */

const DEFAULT_BASE_URL = "https://api.sarvam.ai";
const DEFAULT_JOB_TIMEOUT_MS = 180_000;
const JOB_POLL_INTERVAL_MS = 2_500;

/**
 * Model choice (verified live on 2026-11-12 against our own menu + bill prompts):
 *
 * | model                     | endpoint | bill accuracy | menu items | latency |
 * |---------------------------|----------|---------------|-----------|---------|
 * | glm5.3-flash              | /v2      | perfect       | 6/6       | ~1.1s   |  ← default
 * | gemma4                    | /v2      | perfect       | 6/6       | ~1.4s   |
 * | sarvam-105b               | /v1 only | perfect       | 6/6       | ~2.3-3.2s
 * | deepseekv4.1-flash-1017   | /v2      | unparseable   | 6/6       | ~5.5s   |
 *
 * Notes:
 * - `sarvam-105b` MUST use /v1: on /v2 it ignores `reasoning_effort: null` and burns
 *   the whole max_tokens budget on thinking (finish_reason=length, content=null).
 * - Every /v2 model accepts `reasoning_effort: null` (thinking off) + temperature.
 * - glm5.3-flash: ₹13.5/45 per 1M in/out, 1M context (big multi-page menus), text+image.
 */
export const SARVAM_DEFAULT_CHAT_MODEL = "glm5.3-flash";
/** Safe, always-available model used if the configured model is rejected. */
export const SARVAM_FALLBACK_CHAT_MODEL = "sarvam-105b";

export type SarvamChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type SarvamUsage = {
  pages_total?: number;
  pages_processed?: number;
  pages_succeeded?: number;
  pages_failed?: number;
};

export type SarvamParseResult = {
  jobId: string;
  status: string;
  /** Markdown from Sarvam Vision (headings/tables preserved). */
  markdown: string;
  /** Plain text assembled for downstream parsers. */
  text: string;
  usage?: SarvamUsage;
};

export function sarvamBaseUrl() {
  return (process.env.SARVAM_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
}

export function isSarvamConfigured() {
  return Boolean((process.env.SARVAM_API_KEY || "").trim());
}

export function sarvamChatModel() {
  return (process.env.SARVAM_CHAT_MODEL || "").trim() || SARVAM_DEFAULT_CHAT_MODEL;
}

/** sarvam-105b only behaves correctly on /v1; every other model lives on /v2. */
export function sarvamEndpointForModel(model: string) {
  return model.trim().toLowerCase().startsWith("sarvam-105b") ? "/v1" : "/v2";
}

/**
 * sarvam-105b is a reasoning model with thinking ON by default ("low").
 * Reasoning tokens are billed as completion tokens and can consume the whole
 * max_tokens budget, returning content: null. We disable it by default for
 * deterministic JSON extraction; override with SARVAM_REASONING_EFFORT=low|medium|high.
 */
export type SarvamReasoningEffort = "low" | "medium" | "high" | null;

export function sarvamReasoningEffort(): SarvamReasoningEffort {
  const raw = (process.env.SARVAM_REASONING_EFFORT || "").trim().toLowerCase();
  if (!raw || raw === "none" || raw === "null" || raw === "off" || raw === "false") return null;
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return null;
}

export function sarvamDefaultMaxTokens() {
  const parsed = Number((process.env.SARVAM_MAX_TOKENS || "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 2048;
}

function requireSarvamKey() {
  const key = (process.env.SARVAM_API_KEY || "").trim();
  if (!key) {
    throw new Error(
      "SARVAM_API_KEY is missing. Add it to your .env file (and to your hosting env vars), restart the server, then try again."
    );
  }
  return key;
}

function sarvamHeaders(extra?: Record<string, string>) {
  return { "api-subscription-key": requireSarvamKey(), ...(extra || {}) };
}

async function toSarvamError(response: Response, label: string) {
  const raw = await response.text().catch(() => "");
  let code = "";
  let detail = "";
  try {
    const parsed = JSON.parse(raw) as any;
    code = String(parsed?.error?.code ?? parsed?.code ?? "");
    detail = String(parsed?.error?.message ?? parsed?.detail ?? parsed?.title ?? "");
  } catch {
    // non-JSON error body
  }

  if (response.status === 403 && (code === "invalid_api_key_error" || !code)) {
    return new Error(
      `${label}: Sarvam rejected the API key (403). Check SARVAM_API_KEY in your environment.`
    );
  }
  if (response.status === 402) {
    return new Error(`${label}: Sarvam account has no credits / entitlement (402). Top up your Sarvam plan.`);
  }
  if (response.status === 429) {
    return new Error(`${label}: Sarvam rate limit hit (429). Retry shortly.`);
  }

  const text = (detail || raw).replace(/\s+/g, " ").slice(0, 400);
  return new Error(`${label} failed (${response.status}${code ? ` ${code}` : ""})${text ? `: ${text}` : ""}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractFirstJsonObject(text: string) {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1).trim();
    }
  }
  return null;
}

/** Strip markdown syntax so the rule-based menu parser sees clean lines. */
function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Markdown tables: drop the pipe grid entirely so `Item | Price` becomes `Item Price`.
    .replace(/^\s*\|/gm, "")
    .replace(/\|\s*$/gm, "")
    .replace(/\s*\|\s*/g, " ")
    .replace(/\|/g, " ")
    // Table separator rows and horizontal rules carry no data.
    .replace(/^[ \t]*[:\-–—=~_ ]{3,}[ \t]*$/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Collect content text from Document AI JSON (blocks carry `text`; containers carry markdown/html). */
function collectText(node: unknown, out: string[], depth = 0) {
  if (depth > 12 || node == null) return;

  if (Array.isArray(node)) {
    for (const item of node) collectText(item, out, depth + 1);
    return;
  }
  if (typeof node !== "object") return;

  const record = node as Record<string, unknown>;

  // A block's real content lives in `text`; ignore metadata strings like job_id/status/tag.
  const text = record.text;
  if (typeof text === "string" && text.trim()) {
    out.push(text.trim());
  } else {
    for (const key of ["markdown", "html"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        out.push(value.trim());
        break;
      }
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (key === "text" || key === "markdown" || key === "html" || key === "content") continue;
    if (value && typeof value === "object") collectText(value, out, depth + 1);
  }
}

/** Chat Completions returning parsed JSON. Retries on transient failures. */
export async function sarvamChatJson<T>(params: {
  messages: SarvamChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  reasoningEffort?: SarvamReasoningEffort;
  timeoutMs?: number;
  retries?: number;
}): Promise<T> {
  const timeoutMs = params.timeoutMs ?? 60_000;
  const retries = Math.max(0, params.retries ?? 1);
  const reasoningEffort =
    params.reasoningEffort === undefined ? sarvamReasoningEffort() : params.reasoningEffort;
  const model = (params.model || sarvamChatModel()).trim();
  const url = `${sarvamBaseUrl()}${sarvamEndpointForModel(model)}/chat/completions`;

  let includeOptionalParams = true;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const body: Record<string, unknown> = {
        model,
        messages: params.messages,
        max_tokens: params.maxTokens ?? sarvamDefaultMaxTokens()
      };
      if (includeOptionalParams) {
        // Explicit null disables thinking; omitting it falls back to "low".
        body.reasoning_effort = reasoningEffort;
        if (reasoningEffort === null) body.temperature = params.temperature ?? 0.2;
        else if (params.temperature !== undefined) body.temperature = params.temperature;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: sarvamHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const error = await toSarvamError(response, "Sarvam chat completion");
        // Some models reject optional params — drop them and retry immediately.
        if (includeOptionalParams && response.status === 400 && /reasoning_effort|temperature/i.test(error.message)) {
          includeOptionalParams = false;
          lastError = error;
          continue;
        }
        throw error;
      }

      const payload = (await response.json()) as any;
      const choice = payload?.choices?.[0];
      const content = String(choice?.message?.content ?? "");

      if (!content.trim()) {
        const finish = String(choice?.finish_reason ?? "unknown");
        const reasoningTokens = Number(payload?.usage?.completion_tokens_details?.reasoning_tokens ?? 0);
        throw new Error(
          `Sarvam returned no content (finish_reason=${finish}${
            reasoningTokens ? `, reasoning_tokens=${reasoningTokens}` : ""
          }). ` +
            (finish === "length"
              ? "The token budget was exhausted — raise SARVAM_MAX_TOKENS/maxTokens or set SARVAM_REASONING_EFFORT=none."
              : "Try again or switch SARVAM_CHAT_MODEL.")
        );
      }

      const jsonText = extractFirstJsonObject(content);
      if (!jsonText) throw new Error("Sarvam returned no JSON object in the chat response.");
      return JSON.parse(jsonText) as T;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < retries) await sleep(600 * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Sarvam chat request failed.");
}

const TERMINAL_STATUSES = new Set(["completed", "partially_completed", "failed", "rejected"]);

async function pollJob(jobId: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await fetch(
      `${sarvamBaseUrl()}/doc-ai/v1/job/${encodeURIComponent(jobId)}/status`,
      { headers: sarvamHeaders(), cache: "no-store" }
    );
    if (!response.ok) throw await toSarvamError(response, "Sarvam job status");

    const payload = (await response.json()) as any;
    const status = String(payload?.status ?? "");
    if (TERMINAL_STATUSES.has(status)) {
      return payload as { status: string; usage?: SarvamUsage };
    }
    await sleep(JOB_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Sarvam document job ${jobId} did not finish in ${Math.round(timeoutMs / 1000)}s. Try a smaller file or retry.`
  );
}

async function fetchResults(jobId: string, format: "md" | "json") {
  const response = await fetch(
    `${sarvamBaseUrl()}/doc-ai/v1/job/${encodeURIComponent(jobId)}/results?format=${format}`,
    { headers: sarvamHeaders(), cache: "no-store" }
  );
  if (!response.ok) throw await toSarvamError(response, `Sarvam job results (${format})`);

  const raw = await response.text();
  if (format === "json") {
    try {
      return { json: JSON.parse(raw) as any, text: raw };
    } catch {
      return { json: null, text: raw };
    }
  }
  return { json: null, text: raw };
}

/** Run Sarvam Vision parse (OCR / digitise) on one document and return text. */
export async function sarvamParseDocument(params: {
  file: File;
  language?: string;
  model?: string;
  timeoutMs?: number;
}): Promise<SarvamParseResult> {
  const form = new FormData();
  form.append("file", params.file, params.file.name || "document");
  // Sarvam defaults to Indic when `language` is omitted, so force English by default.
  form.append("language", params.language || (process.env.SARVAM_OCR_LANGUAGE || "").trim() || "en-IN");
  const docModel = params.model || (process.env.SARVAM_DOC_MODEL || "").trim();
  if (docModel) form.append("model", docModel);

  const created = await fetch(`${sarvamBaseUrl()}/doc-ai/v1/job/parse`, {
    method: "POST",
    headers: sarvamHeaders(),
    body: form
  });
  if (!created.ok) throw await toSarvamError(created, "Sarvam parse request");

  const createdJson = (await created.json()) as any;
  const jobId = String(createdJson?.job_id ?? "");
  if (!jobId) throw new Error("Sarvam parse did not return a job_id.");

  const job = await pollJob(jobId, params.timeoutMs ?? DEFAULT_JOB_TIMEOUT_MS);
  if (job.status === "failed" || job.status === "rejected") {
    throw new Error(
      `Sarvam could not read this document (job status: ${job.status}). Try a sharper photo or a PDF.`
    );
  }

  const md = await fetchResults(jobId, "md").catch(() => ({ json: null, text: "" }));
  const markdown = md.text.trim();

  let structuredText = "";
  if (!markdown) {
    const json = await fetchResults(jobId, "json").catch(() => ({ json: null, text: "" }));
    const collected: string[] = [];
    collectText(json.json, collected);
    structuredText = collected.join("\n");
  }

  return {
    jobId,
    status: job.status,
    markdown,
    text: markdown ? markdownToPlainText(markdown) : structuredText,
    usage: job.usage
  };
}

/** Schema-based extraction (Sarvam Vision Extract) — returns the structured result object. */
export async function sarvamExtractFields<T = Record<string, unknown>>(params: {
  file: File;
  schema: Record<string, unknown> | string;
  outputFormat?: "json";
  timeoutMs?: number;
}): Promise<{ jobId: string; status: string; result: T }> {
  const form = new FormData();
  form.append("file", params.file, params.file.name || "document");
  form.append("schema", typeof params.schema === "string" ? params.schema : JSON.stringify(params.schema));
  form.append("output_format", params.outputFormat || "json");

  const created = await fetch(`${sarvamBaseUrl()}/doc-ai/v1/job/extract`, {
    method: "POST",
    headers: sarvamHeaders(),
    body: form
  });
  if (!created.ok) throw await toSarvamError(created, "Sarvam extract request");

  const createdJson = (await created.json()) as any;
  const jobId = String(createdJson?.job_id ?? "");
  if (!jobId) throw new Error("Sarvam extract did not return a job_id.");

  const job = await pollJob(jobId, params.timeoutMs ?? DEFAULT_JOB_TIMEOUT_MS);
  if (job.status === "failed" || job.status === "rejected") {
    throw new Error(`Sarvam extraction failed (job status: ${job.status}).`);
  }

  const results = await fetchResults(jobId, "json");
  return { jobId, status: job.status, result: (results.json?.result ?? {}) as T };
}
