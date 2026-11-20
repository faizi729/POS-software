import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { requireModuleForTenant } from "@/lib/modules";
import { Room, RoomType } from "@/models";

const bulkSchema = z
  .object({
    from: z.coerce.number().int().min(1).max(9999),
    to: z.coerce.number().int().min(1).max(9999),
    floor: z.coerce.number().int().min(0).max(99).default(1),
    roomTypeId: z.string().regex(/^[0-9a-fA-F]{24}$/)
  })
  .refine((value) => value.to >= value.from, { message: "Last room must be >= first", path: ["to"] })
  .refine((value) => value.to - value.from < 100, { message: "Add at most 100 rooms at once", path: ["to"] });

/** "Rooms 101 → 110, floor 1, Deluxe" in one request. Existing numbers are skipped. */
export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const parsed = bulkSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const type = await RoomType.findOne({
        _id: parsed.data.roomTypeId,
        restaurantId: session.restaurantId
      })
        .select("name")
        .lean();
      if (!type) return fail("Room type not found", 404);

      const numbers: string[] = [];
      for (let value = parsed.data.from; value <= parsed.data.to; value += 1) numbers.push(String(value));

      const existing = await Room.find({
        restaurantId: session.restaurantId,
        number: { $in: numbers }
      })
        .select("number")
        .lean();
      const taken = new Set(existing.map((room) => room.number));
      const fresh = numbers.filter((number) => !taken.has(number));

      if (!fresh.length) return fail("Those room numbers already exist", 409);

      await Room.insertMany(
        fresh.map((number) => ({
          restaurantId: session.restaurantId,
          number,
          floor: parsed.data.floor,
          roomTypeId: type._id,
          status: "available"
        }))
      );

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: "room.bulk_create",
        targetType: "room",
        targetId: `${parsed.data.from}-${parsed.data.to}`,
        meta: { created: fresh.length, skipped: taken.size, roomType: type.name }
      });

      return ok({ created: fresh.length, skipped: taken.size, numbers: fresh }, { status: 201 });
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}
