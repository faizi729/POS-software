import { openRouterChatJson, type OpenRouterModel } from "@/lib/ai/openrouter";
import type { ChatJsonRunner } from "@/lib/ai/chat-json";
import { cleanOcrTextForAi } from "@/lib/ocr/ocr-text-clean";
import { splitOcrTextIntoSections } from "@/lib/ocr/section-splitter";
import { parseMenuFromOcrText, type ImportedMenu } from "@/lib/ocr/menu-import-parser";

export type MenuLayoutType = "numbered" | "column" | "card";

export type ExtractionLog = {
  layoutType: MenuLayoutType;
  lines: number;
  numberedLines: number;
  priceOnlyLines: number;
  itemsRuleBased: number;
  ai: {
    enabled: boolean;
    provider: string | null;
    sections: number;
    failedSections: number;
    items: number;
    model?: string | null;
  };
  final: {
    categories: number;
    items: number;
  };
};

export type ExtractMenuParams = {
  rawOcrText: string;
  menuName: string;
  /** Structured-output runner (Sarvam AI first, via lib/ai/chat-json). */
  ai?: {
    chatJson: ChatJsonRunner;
    provider?: string | null;
    model?: string | null;
  };
  /** @deprecated pass `ai` instead — kept so older callers keep working. */
  openRouter?: {
    apiKey: string;
    model: OpenRouterModel;
  };
};

function detectLayoutType(lines: string[]) {
  const numbered = lines.filter((l) => /^\d+\.\s/.test(l)).length;
  const priceOnly = lines.filter((l) => !/[A-Za-z]/.test(l) && /\d/.test(l)).length;
  const ratioNumbered = numbered / Math.max(lines.length, 1);
  const ratioPriceOnly = priceOnly / Math.max(lines.length, 1);

  if (ratioNumbered >= 0.25) return { type: "numbered" as const, numbered, priceOnly };
  if (ratioPriceOnly >= 0.22) return { type: "column" as const, numbered, priceOnly };
  return { type: "card" as const, numbered, priceOnly };
}

function countItems(menu: ImportedMenu) {
  return menu.categories.reduce((sum, cat) => sum + cat.items.length, 0);
}

function normalizeImportedMenu(menu: ImportedMenu) {
  // Deduplicate items by (category + name), keep first.
  const seen = new Set<string>();
  const categories = menu.categories
    .map((category) => {
      const items = category.items.filter((item) => {
        const key = `${category.name.toLowerCase()}::${item.name.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return { ...category, items };
    })
    .filter((category) => category.items.length > 0);

  return { ...menu, categories };
}

async function aiExtractSections(params: {
  sections: Array<{ category: string; text: string }>;
  runner: ChatJsonRunner;
  model?: string | null;
}) {
  type AiSectionResult = {
    category: string;
    items: Array<{ name: string; price: number; variants?: any[] }>;
  };

  const systemPrompt = "You are a restaurant menu extraction system. Return STRICT JSON only.";

  const failed: string[] = [];

  const results = await Promise.all(
    params.sections.map(async (section) => {
      const prompt = `You are a restaurant menu extraction system.

Convert the following OCR text into structured JSON.

Rules:
- Extract category name
- Extract all menu items under it
- Each item must have:
  - name (clean, readable)
  - price (number only)
  - variants (array, empty if none)
- Ignore descriptions, nutrition, marketing text
- If item and price are on different lines: link them logically
- Fix obvious OCR mistakes if safe

Return STRICT JSON only:
{
  "category": "",
  "items": [
    { "name": "", "price": 0, "variants": [] }
  ]
}

TEXT:
"""
${section.category}
${section.text}
"""`;

      try {
        return await params.runner<AiSectionResult>({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          maxTokens: 1200,
          temperature: 0.2,
          model: params.model ?? undefined,
          retries: 1
        });
      } catch {
        failed.push(section.category);
        return null;
      }
    })
  );

  const categories: ImportedMenu["categories"] = [];
  for (const result of results.filter(Boolean) as AiSectionResult[]) {
    const name = String(result.category || "").trim() || "Imported";
    const items = (result.items ?? [])
      .map((item) => ({ name: String(item.name ?? "").trim(), price: Number(item.price) }))
      .filter((item) => item.name.length >= 2 && Number.isFinite(item.price) && item.price > 0);
    if (items.length) categories.push({ name, items });
  }

  return { menu: { categories } as Pick<ImportedMenu, "categories">, failedSections: failed };
}

export async function extractMenuHybrid(params: ExtractMenuParams) {
  const cleaned = cleanOcrTextForAi(params.rawOcrText);
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
  const detected = detectLayoutType(lines);

  // Rule-based baseline (primary engine)
  let ruleBased = parseMenuFromOcrText(cleaned, { defaultMenuName: params.menuName });
  ruleBased = normalizeImportedMenu(ruleBased);

  // Resolve an AI runner: explicit `ai` (Sarvam via chatJson) wins, legacy `openRouter` next.
  const runner: ChatJsonRunner | undefined =
    params.ai?.chatJson ??
    (params.openRouter
      ? ((async <T,>(args: Parameters<ChatJsonRunner>[0]) =>
          openRouterChatJson<T>({
            apiKey: params.openRouter!.apiKey,
            model: params.openRouter!.model,
            messages: args.messages,
            maxTokens: args.maxTokens,
            temperature: args.temperature,
            retries: args.retries
          })) as ChatJsonRunner)
      : undefined);

  const aiProvider = params.ai?.provider ?? (runner ? "openrouter" : null);
  const aiModel = params.ai?.model ?? params.openRouter?.model ?? null;

  const log: ExtractionLog = {
    layoutType: detected.type,
    lines: lines.length,
    numberedLines: detected.numbered,
    priceOnlyLines: detected.priceOnly,
    itemsRuleBased: countItems(ruleBased),
    ai: {
      enabled: Boolean(runner),
      provider: aiProvider,
      sections: 0,
      failedSections: 0,
      items: 0,
      model: aiModel
    },
    final: { categories: ruleBased.categories.length, items: countItems(ruleBased) }
  };

  // AI refinement: only if enabled and rule-based seems weak.
  const shouldUseAi = Boolean(runner) && countItems(ruleBased) < 10;

  if (!shouldUseAi || !runner) {
    return { menu: ruleBased, log };
  }

  const sections = splitOcrTextIntoSections(cleaned);
  log.ai.sections = sections.length;

  const ai = await aiExtractSections({ sections, runner, model: aiModel });
  const aiMenu: ImportedMenu = {
    menuName: params.menuName,
    categories: ai.menu.categories as any
  };
  const normalizedAi = normalizeImportedMenu(aiMenu);
  log.ai.failedSections = ai.failedSections.length;
  log.ai.items = countItems(normalizedAi);

  // Choose best result by item count, otherwise fall back.
  const finalMenu = countItems(normalizedAi) >= countItems(ruleBased) ? normalizedAi : ruleBased;
  log.final = { categories: finalMenu.categories.length, items: countItems(finalMenu) };

  return { menu: finalMenu, log };
}

