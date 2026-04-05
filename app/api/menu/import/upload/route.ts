import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { extractMenuHybrid } from "@/lib/ocr/menu-extraction-engine";

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
  return String(parsedText || "");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    return ok({ error: "OCR_SPACE_API_KEY missing" }, { status: 400 });
  }
  const form = await request.formData();
  const files = Array.from(form.getAll("files") || []).filter((f): f is File => f instanceof File);
  if (!files.length) return ok({ error: "No files uploaded (field: files[])" }, { status: 400 });

  // OCR all files and merge text
  const texts = await Promise.all(files.map((file) => callOcrSpace({ apiKey, file }).catch(() => "")));
  const combinedText = texts.filter(Boolean).join("\n\n");

  const result = await extractMenuHybrid({
    rawOcrText: combinedText,
    menuName: "Imported Menu",
    openRouter: process.env.OPENROUTER_API_KEY
      ? {
          apiKey: process.env.OPENROUTER_API_KEY as string,
          model: (process.env.OPENROUTER_MODEL as any) || "openai/gpt-4o-mini"
        }
      : undefined
  });

  return ok({ text: combinedText.slice(0, 20000), extracted: result.menu, log: result.log });
}

