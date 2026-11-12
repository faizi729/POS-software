import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { requireModuleForTenant } from "@/lib/modules";
import { maintenancePatchSchema } from "@/lib/validators/hotel";
import { MaintenanceTicket, Room } from "@/models";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk", "housekeeping"], async (req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const { id } = await context.params;

      const parsed = maintenancePatchSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const set: Record<string, unknown> = { ...parsed.data };
      if (parsed.data.status === "done") set.closedAt = new Date();

      const ticket = await MaintenanceTicket.findOneAndUpdate(
        { _id: id, restaurantId: session.restaurantId },
        { $set: set },
        { new: true }
      ).lean();
      if (!ticket) return fail("Ticket not found", 404);

      // Closing the last ticket brings the room back into service.
      if (parsed.data.status === "done") {
        const stillOpen = await MaintenanceTicket.countDocuments({
          restaurantId: session.restaurantId,
          roomId: ticket.roomId,
          status: { $ne: "done" }
        });
        if (stillOpen === 0) {
          await Room.updateOne(
            { _id: ticket.roomId, restaurantId: session.restaurantId, status: "maintenance" },
            { $set: { status: "available" } }
          );
        }
      }

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: `maintenance.${parsed.data.status ?? "update"}`,
        targetType: "maintenance",
        targetId: id,
        meta: { status: parsed.data.status ?? null }
      });

      return ok({ id, status: ticket.status });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}
