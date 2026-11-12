import {
  SARVAM_DEFAULT_CHAT_MODEL,
  SARVAM_FALLBACK_CHAT_MODEL,
  isSarvamConfigured,
  sarvamChatJson,
  sarvamChatModel,
  type SarvamChatMessage
} from "@/lib/ai/sarvam";
import { openRouterChatJson } from "@/lib/ai/openrouter";

export type ChatProvider = "sarvam" | "openrouter" | "none";

/** Which pipeline is asking — lets each use a purpose-picked model. */
export type ChatTask = "menu" | "bill" | "general";

export type ChatMessage = SarvamChatMessage;

export type ChatJsonRunner = <T>(params: {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
  timeoutMs?: number;
  retries?: number;
}) => Promise<T>;

export function openRouterModelName() {
  return (process.env.OPENROUTER_MODEL || "").trim() || "mistralai/mistral-small-3.1-24b-instruct";
}

/**
 * Per-task Sarvam model (all verified against our real prompts):
 * - menu: glm5.3-flash — 1M context (multi-page menus), ~1s, ₹13.5/45 per 1M tokens
 * - bill: glm5.3-flash — exact qty/price/tax/total on our test bill, ~1.1s
 * - general: SARVAM_CHAT_MODEL or glm5.3-flash
 * Env overrides: SARVAM_MENU_MODEL, SARVAM_BILL_MODEL, SARVAM_CHAT_MODEL.
 */
export function sarvamModelForTask(task: ChatTask) {
  const explicit =
    task === "menu"
      ? (process.env.SARVAM_MENU_MODEL || "").trim()
      : task === "bill"
        ? (process.env.SARVAM_BILL_MODEL || "").trim()
        : "";
  return explicit || sarvamChatModel() || SARVAM_DEFAULT_CHAT_MODEL;
}

/** Which structured-output provider will be used (Sarvam first, OpenRouter fallback). */
export function activeChatProvider(): ChatProvider {
  if (isSarvamConfigured()) return "sarvam";
  if ((process.env.OPENROUTER_API_KEY || "").trim()) return "openrouter";
  return "none";
}

export function activeChatModel(task: ChatTask = "general"): string | null {
  const provider = activeChatProvider();
  if (provider === "sarvam") return sarvamModelForTask(task);
  if (provider === "openrouter") return openRouterModelName();
  return null;
}

/**
 * Runs a chat completion that must return JSON.
 * Sarvam is preferred; if the configured model is rejected (no access / retired /
 * invalid for that endpoint) it retries once with the safe fallback model.
 */
export async function chatJson<T>(params: {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  task?: ChatTask;
  model?: string;
  timeoutMs?: number;
  retries?: number;
}): Promise<T> {
  const provider = activeChatProvider();
  const task = params.task ?? "general";

  if (provider === "sarvam") {
    const model = (params.model || sarvamModelForTask(task)).trim() || SARVAM_DEFAULT_CHAT_MODEL;

    try {
      return await sarvamChatJson<T>({
        messages: params.messages,
        model,
        maxTokens: params.maxTokens,
        temperature: params.temperature,
        timeoutMs: params.timeoutMs,
        retries: params.retries
      });
    } catch (error) {
      const fallback = SARVAM_FALLBACK_CHAT_MODEL;
      if (model === fallback) throw error;
      console.warn(
        `[sarvam] model "${model}" failed (${error instanceof Error ? error.message : error}); retrying with "${fallback}".`
      );
      return sarvamChatJson<T>({
        messages: params.messages,
        model: fallback,
        maxTokens: params.maxTokens,
        temperature: params.temperature,
        timeoutMs: params.timeoutMs,
        retries: 0
      });
    }
  }

  if (provider === "openrouter") {
    return openRouterChatJson<T>({
      apiKey: (process.env.OPENROUTER_API_KEY || "").trim(),
      model: openRouterModelName(),
      messages: params.messages,
      maxTokens: params.maxTokens,
      temperature: params.temperature,
      timeoutMs: params.timeoutMs,
      retries: params.retries
    });
  }

  throw new Error(
    "No AI provider configured. Set SARVAM_API_KEY (preferred) or OPENROUTER_API_KEY in your .env, then restart."
  );
}
