import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models";

const taxSettingsSchema = z.object({
  taxMode: z.enum(["inclusive", "exclusive"]),
  gstEnabled: z.boolean(),
  gstRatePercent: z.number().min(0).max(28),
  gstin: z.string().trim().max(30).optional()
});

export async function GET() {
  try {
    const session = await getSession();
    await connectToDatabase();

    const restaurant = await Restaurant.findById(session.restaurantId).lean();
    if (!restaurant) {
      return fail("Restaurant not found", 404);
    }

    return ok({
      taxMode: restaurant.settings?.taxMode ?? "exclusive",
      gstEnabled: (restaurant.settings?.gstEnabled ?? true) === true,
      gstRatePercent: Number(restaurant.settings?.gstRatePercent ?? 5),
      gstin: restaurant.settings?.gstin ?? ""
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const payload = taxSettingsSchema.parse(body);

    await connectToDatabase();

    const updated = await Restaurant.findByIdAndUpdate(
      session.restaurantId,
      {
        $set: {
          "settings.taxMode": payload.taxMode,
          "settings.gstEnabled": payload.gstEnabled,
          "settings.gstRatePercent": payload.gstRatePercent,
          "settings.gstin": payload.gstin?.trim() || ""
        }
      },
      { new: true }
    ).lean();

    if (!updated) {
      return fail("Restaurant not found", 404);
    }

    return ok({
      taxMode: updated.settings?.taxMode ?? "exclusive",
      gstEnabled: (updated.settings?.gstEnabled ?? true) === true,
      gstRatePercent: Number(updated.settings?.gstRatePercent ?? 5),
      gstin: updated.settings?.gstin ?? ""
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

