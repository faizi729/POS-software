import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { requireModuleForTenant } from "@/lib/modules";
import { roomSchema } from "@/lib/validators/hotel";
import { Reservation, Room, RoomType } from "@/models";

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier", "staff", "housekeeping"], async (_req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const rooms = await Room.find({ restaurantId: session.restaurantId })
        .populate({ path: "roomTypeId", select: "name baseRate gstPercent maxOccupancy" })
        .sort({ floor: 1, number: 1 })
        .lean();

      const active = await Reservation.find({
        restaurantId: session.restaurantId,
        status: "checked_in"
      })
        .select("roomId")
        .lean();
      const occupied = new Set(active.map((row) => String(row.roomId)));

      return ok(
        rooms.map((room) => {
          const type = room.roomTypeId as unknown as
            | { _id?: unknown; name?: string; baseRate?: number; gstPercent?: number }
            | null;
          return {
            id: String(room._id),
            number: room.number,
            floor: room.floor ?? 1,
            status: room.status,
            roomTypeId: type?._id ? String(type._id) : "",
            roomTypeName: type?.name ?? "",
            baseRate: type?.baseRate ?? 0,
            gstPercent: type?.gstPercent ?? 12,
            stayActive: occupied.has(String(room._id))
          };
        })
      );
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const parsed = roomSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const type = await RoomType.findOne({
        _id: parsed.data.roomTypeId,
        restaurantId: session.restaurantId
      }).lean();
      if (!type) return fail("Room type not found", 404);

      const exists = await Room.findOne({ restaurantId: session.restaurantId, number: parsed.data.number }).lean();
      if (exists) return fail("Room number already exists", 409);

      const created = await Room.create({ restaurantId: session.restaurantId, ...parsed.data });
      return ok({ id: String(created._id) }, { status: 201 });
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
