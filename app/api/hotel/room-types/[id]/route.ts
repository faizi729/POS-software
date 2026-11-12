import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { requireModuleForTenant } from "@/lib/modules";
import { roomTypeSchema } from "@/lib/validators/hotel";
import { Room, RoomType } from "@/models";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager"], async (req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const { id } = await context.params;
      const parsed = roomTypeSchema.partial().safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const updated = await RoomType.findOneAndUpdate(
        { _id: id, restaurantId: session.restaurantId },
        { $set: parsed.data },
        { new: true }
      ).lean();
      if (!updated) return fail("Room type not found", 404);
      return ok({ id: String(updated._id) });
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

      const rooms = await Room.countDocuments({ restaurantId: session.restaurantId, roomTypeId: id });
      if (rooms > 0) return fail("Room type is in use", 409);

      const deleted = await RoomType.findOneAndDelete({
        _id: id,
        restaurantId: session.restaurantId
      }).lean();
      if (!deleted) return fail("Room type not found", 404);
      return ok({ id });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}
