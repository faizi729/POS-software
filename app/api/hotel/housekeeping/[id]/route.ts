import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { requireModuleForTenant } from "@/lib/modules";
import { housekeepingPatchSchema } from "@/lib/validators/hotel";
import { HousekeepingTask, Room } from "@/models";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk", "housekeeping"], async (req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const { id } = await context.params;

      const parsed = housekeepingPatchSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const task = await HousekeepingTask.findOneAndUpdate(
        { _id: id, restaurantId: session.restaurantId },
        {
          $set: {
            status: parsed.data.status,
            assignee: parsed.data.assignee,
            completedAt: parsed.data.status === "done" ? new Date() : undefined
          }
        },
        { new: true }
      ).lean();
      if (!task) return fail("Task not found", 404);

      // Cleaning done → room is sellable again.
      if (parsed.data.status === "done") {
        await Room.updateOne(
          { _id: task.roomId, restaurantId: session.restaurantId, status: "dirty" },
          { $set: { status: "available" } }
        );
      }

      return ok({ id, status: task.status });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}
