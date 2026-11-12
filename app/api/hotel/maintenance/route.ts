import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { requireModuleForTenant } from "@/lib/modules";
import { maintenanceSchema } from "@/lib/validators/hotel";
import { MaintenanceTicket, Room } from "@/models";

/** Maintenance tickets: an open ticket takes the room out of service. */
export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "housekeeping", "staff"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const url = new URL(req.url);
      const status = url.searchParams.get("status");
      const tickets = await MaintenanceTicket.find({
        restaurantId: session.restaurantId,
        ...(status ? { status } : {})
      })
        .populate({ path: "roomId", select: "number" })
        .sort({ status: 1, createdAt: -1 })
        .limit(100)
        .lean();

      return ok(
        tickets.map((ticket) => ({
          id: String(ticket._id),
          roomId: String(ticket.roomId?._id ?? ticket.roomId),
          roomNumber: (ticket.roomId as unknown as { number?: string } | null)?.number ?? "",
          title: ticket.title,
          description: ticket.description ?? "",
          priority: ticket.priority ?? "medium",
          status: ticket.status,
          assignee: ticket.assignee ?? "",
          resolution: ticket.resolution ?? "",
          openedAt: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : "",
          closedAt: ticket.closedAt ? new Date(ticket.closedAt).toISOString() : null
        }))
      );
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "housekeeping"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const parsed = maintenanceSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const room = await Room.findOne({
        _id: parsed.data.roomId,
        restaurantId: session.restaurantId
      }).lean();
      if (!room) return fail("Room not found", 404);

      const ticket = await MaintenanceTicket.create({
        restaurantId: session.restaurantId,
        roomId: room._id,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        openedBy: session.userId
      });

      // An open ticket blocks assignment.
      await Room.updateOne(
        { _id: room._id, restaurantId: session.restaurantId, status: { $ne: "occupied" } },
        { $set: { status: "maintenance" } }
      );

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: "maintenance.open",
        targetType: "room",
        targetId: String(room._id),
        meta: { title: parsed.data.title, priority: parsed.data.priority }
      });

      return ok({ id: String(ticket._id) }, { status: 201 });
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}
