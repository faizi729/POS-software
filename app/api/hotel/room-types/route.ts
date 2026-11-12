import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { requireModuleForTenant } from "@/lib/modules";
import { roomTypeSchema } from "@/lib/validators/hotel";
import { RoomType } from "@/models";

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier", "staff"], async (_req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const roomTypes = await RoomType.find({ restaurantId: session.restaurantId })
        .sort({ baseRate: 1 })
        .lean();
      return ok(
        roomTypes.map((type) => ({
          id: String(type._id),
          name: type.name,
          baseRate: type.baseRate,
          maxOccupancy: type.maxOccupancy ?? 2,
          amenities: type.amenities ?? [],
          gstPercent: type.gstPercent ?? 12
        }))
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
      const parsed = roomTypeSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const exists = await RoomType.findOne({
        restaurantId: session.restaurantId,
        name: parsed.data.name
      }).lean();
      if (exists) return fail("Room type already exists", 409);

      const created = await RoomType.create({ restaurantId: session.restaurantId, ...parsed.data });
      return ok({ id: String(created._id) }, { status: 201 });
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
