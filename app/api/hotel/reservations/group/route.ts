import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { toUtcDate } from "@/lib/hotel/availability";
import { createGroupReservation, loadHotelSettings } from "@/lib/hotel/booking";
import { InventoryConflictError } from "@/lib/hotel/inventory";
import { toPaise, toRupees } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { groupReservationSchema } from "@/lib/validators/hotel";

/** Multi-room / group booking. `folioMode: "single"` bills the whole group once. */
export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const parsed = groupReservationSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
      const data = parsed.data;

      try {
        const settings = await loadHotelSettings(session.restaurantId);
        const result = await createGroupReservation({
          restaurantId: session.restaurantId,
          userId: session.userId,
          rooms: data.rooms,
          guest: data.guest,
          checkIn: toUtcDate(data.checkIn),
          checkOut: toUtcDate(data.checkOut),
          status: data.status,
          source: data.source,
          folioMode: data.folioMode,
          advancePaidPaise: toPaise(data.advancePaid),
          discountCode: data.discountCode,
          holdExpiresAt: data.holdExpiresAt ? new Date(data.holdExpiresAt) : null,
          notes: data.notes,
          settings
        });

        await auditHotel({
          restaurantId: session.restaurantId,
          actorId: session.userId,
          action: "reservation.group_create",
          targetType: "group",
          targetId: result.groupId,
          meta: { rooms: data.rooms.length, folioMode: data.folioMode }
        });

        return ok(
          {
            groupId: result.groupId,
            reservationIds: result.reservationIds,
            folioReservationId: result.folioOwnerId,
            total: toRupees(result.quotes.reduce((sum, quote) => sum + quote.totalPaise, 0))
          },
          { status: 201 }
        );
      } catch (error) {
        if (error instanceof InventoryConflictError) return fail(error.message, 409);
        throw error;
      }
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
