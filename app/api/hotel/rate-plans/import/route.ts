import { NextRequest } from "next/server";
import { z } from "zod";

import { chatJson } from "@/lib/ai/chat-json";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { toPaise } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { validateUploads } from "@/lib/middleware/upload-validate";
import { isOcrConfigured, ocrDocumentFile } from "@/lib/ocr/document-ocr";
import { RatePlan } from "@/models";

export const maxDuration = 120;

const planSchema = z.object({
  name: z.string().min(1).max(60),
  baseRate: z.coerce.number().min(0),
  dateFrom: z.string().max(10).optional(),
  dateTo: z.string().max(10).optional(),
  weekdays: z.array(z.coerce.number().int().min(0).max(6)).optional(),
  mealPlan: z.enum(["EP", "CP", "MAP", "AP"]).optional(),
  discountCode: z.string().max(24).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional()
});

const payloadSchema = z.object({ plans: z.array(planSchema).min(1).max(40) });

/**
 * Rate-card / package import from a photo or PDF. Returns proposals only;
 * `?apply=true` writes them. Failure returns `{ plans: null }` so the manual
 * form keeps working.
 */
export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager"], async (req, _ctx, session) => {
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
      if (!text) return ok({ plans: null });

      const extracted = await chatJson<Record<string, unknown>>({
        task: "general",
        maxTokens: 1200,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Extract hotel rate plans from this rate card / package text. Reply with JSON only: " +
              '{"plans":[{"name","baseRate","dateFrom","dateTo","weekdays","mealPlan","discountCode","discountPercent"}]}. ' +
              "baseRate is the nightly room rate in rupees as a number (digits only). " +
              "weekdays are 0=Sunday..6=Saturday, omit when the rate applies to all days. " +
              "mealPlan is one of EP, CP, MAP, AP. Omit unknown fields, never invent values."
          },
          { role: "user", content: text.slice(0, 6000) }
        ]
      }).catch(() => null);

      const parsed = payloadSchema.safeParse(extracted ?? {});
      if (!parsed.success) return ok({ plans: null });

      const plans = parsed.data.plans.map((plan) => ({
        name: plan.name,
        baseRate: plan.baseRate,
        dateFrom: plan.dateFrom ?? "",
        dateTo: plan.dateTo ?? "",
        weekdays: plan.weekdays ?? [],
        mealPlan: plan.mealPlan ?? "EP",
        discountCode: plan.discountCode ?? "",
        discountPercent: plan.discountPercent ?? 0
      }));

      const apply = new URL(request.url).searchParams.get("apply") === "true";
      if (!apply) return ok({ plans, applied: 0 });

      const created = [];
      for (const plan of plans) {
        const doc = await RatePlan.create({
          restaurantId: session.restaurantId,
          name: plan.name,
          baseRatePaise: toPaise(plan.baseRate),
          dateFrom: plan.dateFrom ? new Date(`${plan.dateFrom}T00:00:00.000Z`) : undefined,
          dateTo: plan.dateTo ? new Date(`${plan.dateTo}T00:00:00.000Z`) : undefined,
          weekdays: plan.weekdays,
          mealPlan: plan.mealPlan,
          discountCode: plan.discountCode ? plan.discountCode.toUpperCase() : undefined,
          discountPercent: plan.discountPercent,
          active: true
        }).catch(() => null);
        if (doc) created.push(String(doc._id));
      }

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: "rate_plan.import",
        targetType: "rate_plan",
        targetId: created.join(","),
        meta: { proposed: plans.length, created: created.length }
      });

      return ok({ plans, applied: created.length });
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}
