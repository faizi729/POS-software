import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { requireModuleForTenant } from "@/lib/modules";
import { housekeepingSchema } from "@/lib/validators/hotel";
import { HousekeepingTask, Room } from "@/models";

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "housekeeping", "staff"], async (_req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const [tasks, rooms] = await Promise.all([
        HousekeepingTask.find({ restaurantId: session.restaurantId }).sort({ createdAt: -1 }).limit(100).lean(),
        Room.find({ restaurantId: session.restaurantId }).select("number status floor").lean()
      ]);
      const roomById = new Map(rooms.map((room) => [String(room._id), room]));

      return ok(
        tasks.map((task) => ({
          id: String(task._id),
          roomId: String(task.roomId),
          roomNumber: roomById.get(String(task.roomId))?.number ?? "",
          roomStatus: roomById.get(String(task.roomId))?.status ?? "",
          status: task.status,
          assignee: task.assignee ?? "",
          note: task.note ?? "",
          createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : ""
        }))
      );
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "housekeeping"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const parsed = housekeepingSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const room = await Room.findOne({ _id: parsed.data.roomId, restaurantId: session.restaurantId }).lean();
      if (!room) return fail("Room not found", 404);

      const task = await HousekeepingTask.create({
        restaurantId: session.restaurantId,
        roomId: parsed.data.roomId,
        assignee: parsed.data.assignee,
        note: parsed.data.note
      });

      return ok({ id: String(task._id) }, { status: 201 });
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
