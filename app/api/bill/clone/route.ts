import { NextRequest } from "next/server";
import { z } from "zod";

import { handleRouteError, ok } from "@/lib/api/response";
import { cloneReceiptFromOcr } from "@/lib/ocr/receipt-clone-engine";

const cloneSchema = z.object({
  rawText: z.string().min(1),
  words: z
    .array(
      z.object({
        text: z.string(),
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
        confidence: z.number().optional()
      })
    )
    .optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = cloneSchema.parse(body);
    const result = cloneReceiptFromOcr({ rawText: payload.rawText, words: payload.words, currency: "INR" });
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

