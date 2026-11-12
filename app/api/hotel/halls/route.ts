import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { requireModuleForTenant } from "@/lib/modules";
import { hallSchema } from "@/lib/validators/hotel";
import { BanquetBooking, Hall } from "@/models";

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier", "staff"], async (_req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "banquet");
      await connectToDatabase();
      const halls = await Hall.find({ restaurantId: session.restaurantId }).sort({ name: 1 }).lean();
      return ok(
        halls.map((hall) => ({
          id: String(hall._id),
          name: hall.name,
          capacity: hall.capacity,
          baseRate: hall.baseRate ?? 0,
          setupTypes: hall.setupTypes ?? []
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
      await requireModuleForTenant(session.restaurantId, "banquet");
      await connectToDatabase();
      const parsed = hallSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const exists = await Hall.findOne({ restaurantId: session.restaurantId, name: parsed.data.name }).lean();
      if (exists) return fail("Hall already exists", 409);

      const hall = await Hall.create({ restaurantId: session.restaurantId, ...parsed.data });
      return ok({ id: String(hall._id) }, { status: 201 });
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "banquet");
      await connectToDatabase();
      const id = new URL(req.url).searchParams.get("id") || "";
      if (!id) return fail("id required", 422);

      const booked = await BanquetBooking.countDocuments({
        restaurantId: session.restaurantId,
        hallId: id,
        status: { $in: ["tentative", "confirmed"] }
      });
      if (booked > 0) return fail("Hall has active bookings", 409);

      const deleted = await Hall.findOneAndDelete({ _id: id, restaurantId: session.restaurantId }).lean();
      if (!deleted) return fail("Hall not found", 404);
      return ok({ id });
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
