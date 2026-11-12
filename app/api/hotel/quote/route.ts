import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { toUtcDate } from "@/lib/hotel/availability";
import { quoteStay } from "@/lib/hotel/rates";
import { canSeePii } from "@/lib/hotel/mask";
import { toRupees } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { quoteSchema } from "@/lib/validators/hotel";
import { Room } from "@/models";

/** Staff price quote — same engine the public page and reservations use. */
export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const parsed = quoteSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
      const data = parsed.data;

      let roomTypeId = data.roomTypeId;
      if (!roomTypeId && data.roomId) {
        const room = await Room.findOne({ _id: data.roomId, restaurantId: session.restaurantId })
          .select("roomTypeId")
          .lean();
        if (!room) return fail("Room not found", 404);
        roomTypeId = String(room.roomTypeId);
      }
      if (!roomTypeId) return fail("roomId or roomTypeId required", 422);

      const settings = await import("@/lib/hotel/booking").then((mod) =>
        mod.loadHotelSettings(session.restaurantId)
      );
      const quote = await quoteStay({
        restaurantId: session.restaurantId,
        roomTypeId,
        checkIn: toUtcDate(data.checkIn),
        checkOut: toUtcDate(data.checkOut),
        adults: data.adults,
        children: data.children,
        discountCode: data.discountCode,
        slabs: settings.slabs
      });

      return ok({
        nights: quote.nights.map((night) => ({ date: night.date, rate: toRupees(night.ratePaise), plan: night.planName ?? null })),
        roomTotal: toRupees(quote.roomTotalPaise),
        extraAdult: toRupees(quote.extraAdultPaise),
        child: toRupees(quote.childPaise),
        mealPlan: toRupees(quote.mealPlanPaise),
        discount: toRupees(quote.discountPaise),
        total: toRupees(quote.totalPaise),
        tax: toRupees(quote.taxPaise),
        taxPercent: quote.taxPercent,
        plan: quote.planName ?? null,
        mealPlanCode: quote.mealPlan ?? null,
        discountCode: quote.discountCode ?? null,
        pii: canSeePii(session.role)
      });
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}
