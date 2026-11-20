import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { availableRoomIds, toUtcDate } from "@/lib/hotel/availability";
import { requireModuleForTenant } from "@/lib/modules";
import { Room, RoomType } from "@/models";

/**
 * Rooms that are free for a stay — used by "assign room" on the front desk and
 * by the move picker. Maintenance rooms are never returned.
 */
export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const url = new URL(req.url);
      const checkIn = toUtcDate(url.searchParams.get("checkIn") || new Date());
      const checkOut = toUtcDate(url.searchParams.get("checkOut") || new Date(checkIn.getTime() + 86_400_000));
      if (!(checkIn < checkOut)) return fail("Check-out must be after check-in", 422);

      const roomTypeId = url.searchParams.get("roomTypeId") || "";
      const ignoreReservationId = url.searchParams.get("ignoreReservationId") || undefined;

      const busy = await availableRoomIds({
        restaurantId: session.restaurantId,
        checkIn,
        checkOut,
        ignoreReservationId
      });

      const rooms = await Room.find({
        restaurantId: session.restaurantId,
        status: { $ne: "maintenance" },
        ...(roomTypeId ? { roomTypeId } : {})
      })
        .populate({ path: "roomTypeId", select: "name baseRate" })
        .sort({ floor: 1, number: 1 })
        .lean();

      const free = rooms.filter((room) => !busy.has(String(room._id)));

      return ok(
        free.map((room) => {
          const type = room.roomTypeId as unknown as { _id?: unknown; name?: string; baseRate?: number } | null;
          return {
            id: String(room._id),
            number: room.number,
            floor: room.floor ?? 1,
            status: room.status,
            roomTypeId: type?._id ? String(type._id) : "",
            roomTypeName: type?.name ?? "",
            baseRate: type?.baseRate ?? 0
          };
        })
      );
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}
