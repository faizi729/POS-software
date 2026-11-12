import { NextRequest } from "next/server";
import { z } from "zod";

import { chatJson } from "@/lib/ai/chat-json";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { requireModuleForTenant } from "@/lib/modules";
import { validateUploads } from "@/lib/middleware/upload-validate";
import { isOcrConfigured, ocrDocumentFile } from "@/lib/ocr/document-ocr";

export const maxDuration = 120;

/** AI-extracted guest identity. Every field is optional — manual entry always works. */
const extractedSchema = z.object({
  name: z.string().max(80).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().max(80).optional(),
  idType: z.string().max(30).optional(),
  idNumber: z.string().max(40).optional(),
  address: z.string().max(200).optional(),
  dateOfBirth: z.string().max(20).optional()
});

/**
 * Scan a guest ID (image/PDF) and return a prefill. Never writes anything:
 * the front desk reviews the fields before saving.
 */
export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const form = await req.formData().catch(() => null);
      const files = Array.from(form?.getAll("files") || []).filter((entry): entry is File => entry instanceof File);
      if (!files.length) return fail("No file uploaded (field: files)", 422);

      const invalid = validateUploads({ files, maxFiles: 1, maxBytesPerFile: 5 * 1024 * 1024 });
      if (!invalid.ok) return fail(invalid.error, 422);
      if (!isOcrConfigured()) return fail("OCR is not configured", 503);

      const ocr = await ocrDocumentFile({ file: files[0] }).catch(() => null);
      const text = ((ocr as { text?: string } | null)?.text ?? "").trim();
      if (!text) return ok({ extracted: null });

      const extracted = await chatJson<Record<string, unknown>>({
        task: "general",
        maxTokens: 400,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Extract guest identity fields from the OCR text of an ID document. Reply with JSON only: " +
              '{"name","phone","email","idType","idNumber","address","dateOfBirth"}. ' +
              "Omit unknown fields. Never invent values."
          },
          { role: "user", content: text.slice(0, 4000) }
        ]
      }).catch(() => null);

      const parsed = extractedSchema.safeParse(extracted ?? {});
      if (!parsed.success) return ok({ extracted: null });

      const cleaned = Object.fromEntries(
        Object.entries(parsed.data).filter(([, value]) => typeof value === "string" && value.trim().length > 0)
      );

      return ok({ extracted: Object.keys(cleaned).length ? cleaned : null });
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}
