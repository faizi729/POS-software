import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { extractMenuHybrid } from "@/lib/ocr/menu-extraction-engine";
import { activeChatModel, activeChatProvider, chatJson } from "@/lib/ai/chat-json";
import { isOcrConfigured, ocrDocumentFile, ocrMissingKeyMessage } from "@/lib/ocr/document-ocr";
import { validateUploads } from "@/lib/middleware/upload-validate";
import { fail } from "@/lib/api/response";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";
import { assertRole, requireSession } from "@/lib/auth/guards";

/** Sarvam Vision jobs are async (create -> poll -> results); allow a long run. */
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const session = await requireSession();
  assertRole(session, ["owner", "manager"]);

  const rl = await rateLimit({
    request,
    keyParts: ["ocr-menu-import", session.restaurantId, getClientIp(request)],
    limit: 30,
    windowMs: 60_000,
    onHit: () => console.warn("[rate-limit] /api/menu/import/upload")
  });
  if (!rl.ok) return fail("Too many requests. Try again soon.", 429);

  if (!isOcrConfigured()) {
    return ok({ error: ocrMissingKeyMessage() }, { status: 400 });
  }

  const form = await request.formData();
  const files = Array.from(form.getAll("files") || []).filter((f): f is File => f instanceof File);
  if (!files.length) return ok({ error: "No files uploaded (field: files[])" }, { status: 400 });

  const valid = validateUploads({ files, maxFiles: 10, maxBytesPerFile: 5 * 1024 * 1024 });
  if (!valid.ok) return fail(valid.error, 400);

  // OCR every file (Sarvam Vision -> OCR.Space fallback) and merge the text.
  const ocrResults = await Promise.all(
    files.map((file) => ocrDocumentFile({ file }).catch((error: unknown) => ({ error })))
  );

  const texts: string[] = [];
  const warnings: string[] = [];
  const providers = new Set<string>();
  let firstError: string | null = null;

  for (const result of ocrResults) {
    if ("error" in result) {
      const message = result.error instanceof Error ? result.error.message : "OCR failed for one file.";
      if (!firstError) firstError = message;
      warnings.push(message);
      continue;
    }
    providers.add(result.provider);
    warnings.push(...result.warnings);
    if (result.text.trim()) texts.push(result.text);
  }

  const combinedText = texts.filter(Boolean).join("\n\n");
  if (!combinedText.trim()) {
    return ok({ error: firstError || "No text could be read from the uploaded files." }, { status: 400 });
  }

  const provider = activeChatProvider();
  const model = activeChatModel("menu");

  const result = await extractMenuHybrid({
    rawOcrText: combinedText,
    menuName: "Imported Menu",
    ai: provider === "none" ? undefined : { chatJson, provider, model }
  });

  return ok({
    text: combinedText.slice(0, 20000),
    extracted: result.menu,
    log: result.log,
    ocr: { providers: Array.from(providers), warnings },
    ai: { provider, model }
  });
}

