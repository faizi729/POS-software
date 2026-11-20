import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { requireModuleForTenant } from "@/lib/modules";
import { roomSchema } from "@/lib/validators/hotel";
import { MaintenanceTicket, Reservation, Room } from "@/models";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk"], async (req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const { id } = await context.params;

      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const parsed = roomSchema.partial().safeParse(body);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      // Build the update from keys the caller actually sent (never coerce defaults).
      const set: Record<string, unknown> = {};
      if (body.number !== undefined) set.number = parsed.data.number;
      if (body.floor !== undefined) set.floor = parsed.data.floor;
      if (body.roomTypeId !== undefined) set.roomTypeId = parsed.data.roomTypeId;

      if (body.status !== undefined) {
        if (parsed.data.status === "available") {
          const open = await MaintenanceTicket.countDocuments({
            restaurantId: session.restaurantId,
            roomId: id,
            status: { $ne: "done" }
          });
          if (open > 0) return fail("Room has an open maintenance ticket", 409);
        }
        if (parsed.data.status === "occupied") {
          const inHouse = await Reservation.countDocuments({
            restaurantId: session.restaurantId,
            roomId: id,
            status: "checked_in"
          });
          if (!inHouse) return fail("No in-house guest in that room", 409);
        }
        set.status = parsed.data.status;
      }

      if (!Object.keys(set).length) return fail("Nothing to update", 422);

      const updated = await Room.findOneAndUpdate(
        { _id: id, restaurantId: session.restaurantId },
        { $set: set },
        { new: true }
      ).catch((error) => {
        if (typeof error === "object" && error !== null && (error as { code?: number }).code === 11000) {
          throw new Error("Another room already uses that number");
        }
        throw error;
      });

      if (!updated) return fail("Room not found", 404);

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: "room.update",
        targetType: "room",
        targetId: id,
        meta: set
      });

      return ok({ id: String(updated._id), status: updated.status, number: updated.number });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager"], async (_req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const { id } = await context.params;

      const activeStay = await Reservation.countDocuments({
        restaurantId: session.restaurantId,
        roomId: id,
        status: { $in: ["tentative", "confirmed", "checked_in"] }
      });
      if (activeStay > 0) return fail("Room has active reservations", 409);

      const deleted = await Room.findOneAndDelete({ _id: id, restaurantId: session.restaurantId }).lean();
      if (!deleted) return fail("Room not found", 404);
      return ok({ id });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}
