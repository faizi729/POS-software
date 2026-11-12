import { isSarvamConfigured, sarvamParseDocument } from "@/lib/ai/sarvam";

export type OcrProvider = "sarvam" | "ocr-space";

export type DocumentOcrResult = {
  text: string;
  provider: OcrProvider;
  /** Sarvam Vision markdown (layout/table preserving). Empty for OCR.Space. */
  markdown?: string;
  /** Sarvam Document AI job id (useful for support/debugging). */
  jobId?: string;
  warnings: string[];
};

/** Sarvam Vision accepts PDF, JPEG and PNG (max 50MB / 10 pages). */
const SARVAM_MIME = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png"]);

export function isOcrConfigured() {
  return isSarvamConfigured() || Boolean((process.env.OCR_SPACE_API_KEY || "").trim());
}

export function ocrProviderHints() {
  return {
    sarvam: isSarvamConfigured(),
    ocrSpace: Boolean((process.env.OCR_SPACE_API_KEY || "").trim())
  };
}

export function ocrMissingKeyMessage() {
  return "OCR is not configured. Add SARVAM_API_KEY (recommended — Sarvam Vision) or OCR_SPACE_API_KEY to your environment, restart the server, then try again.";
}

async function callOcrSpace(params: { apiKey: string; file: File }) {
  const form = new FormData();
  form.append("apikey", params.apiKey);
  form.append("language", "eng");
  form.append("isOverlayRequired", "false");
  form.append("scale", "true");
  form.append("OCREngine", "2");
  form.append("file", params.file, params.file.name);

  const response = await fetch("https://api.ocr.space/parse/image", { method: "POST", body: form });
  if (!response.ok) throw new Error(`OCR.Space request failed with ${response.status}`);

  const payload = (await response.json()) as any;
  const parsedText =
    payload?.ParsedResults?.[0]?.ParsedText ??
    payload?.ParsedResults?.map((r: any) => r?.ParsedText).join("\n") ??
    "";

  return { raw: payload, text: String(parsedText || "") };
}

/**
 * Single entry point for menu/bill OCR.
 * Prefers Sarvam Vision (Sarvam Document AI parse); falls back to OCR.Space.
 */
export async function ocrDocumentFile(params: {
  file: File;
  language?: string;
  timeoutMs?: number;
}): Promise<DocumentOcrResult> {
  const warnings: string[] = [];
  const mime = String(params.file.type || "").toLowerCase();
  const sarvamAvailable = isSarvamConfigured() && SARVAM_MIME.has(mime);
  const ocrSpaceKey = (process.env.OCR_SPACE_API_KEY || "").trim();

  if (sarvamAvailable) {
    try {
      const parsed = await sarvamParseDocument({
        file: params.file,
        language: params.language,
        timeoutMs: params.timeoutMs
      });
      if (parsed.text.trim()) {
        return {
          text: parsed.text,
          provider: "sarvam",
          markdown: parsed.markdown,
          jobId: parsed.jobId,
          warnings
        };
      }
      warnings.push("Sarvam Vision returned no text; falling back to OCR.Space.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sarvam Vision failed.";
      if (!ocrSpaceKey) throw error;
      warnings.push(`${message} Falling back to OCR.Space.`);
    }
  } else if (isSarvamConfigured() && !SARVAM_MIME.has(mime)) {
    warnings.push(`Sarvam Vision does not accept ${mime || "this file type"}; using OCR.Space.`);
  }

  if (!ocrSpaceKey) {
    throw new Error(ocrMissingKeyMessage());
  }

  const ocr = await callOcrSpace({ apiKey: ocrSpaceKey, file: params.file });
  return { text: ocr.text, provider: "ocr-space", warnings };
}
