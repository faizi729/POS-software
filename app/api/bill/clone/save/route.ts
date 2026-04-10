import { NextRequest } from "next/server";
import { z } from "zod";

import { ok, handleRouteError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";
import { ReceiptTemplate, Restaurant } from "@/models";
import { requireSession } from "@/lib/auth/guards";

const saveSchema = z.object({
  restaurantId: z.string().min(1).optional(),
  name: z.string().min(1).default("Default Receipt"),
  structured: z.any(),
  layout: z.any()
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireSession();
    const body = await request.json();
    const payload = saveSchema.parse(body);
    const restaurantId = session.restaurantId;

    const doc = await ReceiptTemplate.create({
      restaurantId,
      name: payload.name,
      structured: payload.structured,
      layout: payload.layout
    });

    // Mark onboarding progress
    await Restaurant.findByIdAndUpdate(restaurantId, {
      $set: { "onboarding.receiptTemplateSaved": true },
      $currentDate: {
        "onboarding.completedAt": {
          $type: "date"
        } as any
      }
    }).catch(() => {});

    return ok({ id: String(doc._id) });
  } catch (error) {
    return handleRouteError(error);
  }
}

