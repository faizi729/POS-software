import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models";

const taxSettingsSchema = z.object({
  taxMode: z.enum(["inclusive", "exclusive"]),
  gstEnabled: z.boolean(),
  gstRatePercent: z.number().min(0).max(28),
  gstin: z.string().trim().max(30).optional()
});

export async function GET(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (_req, _ctx, session) => {
    await connectToDatabase();
    const restaurant = await Restaurant.findOne({ _id: session.restaurantId })
      .select({ "settings.taxMode": 1, "settings.gstEnabled": 1, "settings.gstRatePercent": 1, "settings.gstin": 1 })
      .lean();
    if (!restaurant) return fail("Restaurant not found", 404);
    return ok({
      taxMode: restaurant.settings?.taxMode ?? "exclusive",
      gstEnabled: (restaurant.settings?.gstEnabled ?? true) === true,
      gstRatePercent: Number(restaurant.settings?.gstRatePercent ?? 5),
      gstin: restaurant.settings?.gstin ?? ""
    });
  })(request, {} as any);
}

export async function PATCH(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (request, _ctx, session) => {
    const body = await request.json();
    const payload = taxSettingsSchema.parse(body);
    await connectToDatabase();
    const updated = await Restaurant.findOneAndUpdate(
      { _id: session.restaurantId },
      {
        $set: {
          "settings.taxMode": payload.taxMode,
          "settings.gstEnabled": payload.gstEnabled,
          "settings.gstRatePercent": payload.gstRatePercent,
          "settings.gstin": payload.gstin?.trim() || ""
        }
      },
      { new: true }
    )
      .select({ "settings.taxMode": 1, "settings.gstEnabled": 1, "settings.gstRatePercent": 1, "settings.gstin": 1 })
      .lean();
    if (!updated) return fail("Restaurant not found", 404);
    return ok({
      taxMode: updated.settings?.taxMode ?? "exclusive",
      gstEnabled: (updated.settings?.gstEnabled ?? true) === true,
      gstRatePercent: Number(updated.settings?.gstRatePercent ?? 5),
      gstin: updated.settings?.gstin ?? ""
    });
  })(request, {} as any);
}

