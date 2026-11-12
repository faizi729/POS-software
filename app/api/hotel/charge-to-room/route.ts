import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { activeReservationForRoom, postFolioCharge } from "@/lib/hotel/folio";
import { toPaise } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { Order, Room } from "@/models";

const schema = z.object({
  roomId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  roomNumber: z.string().min(1).max(12).optional(),
  amount: z.coerce.number().positive(),
  taxPercent: z.coerce.number().min(0).max(28).optional(),
  description: z.string().max(120).optional(),
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});

/** POS "Charge to room": posts an F&B folio charge to the in-house reservation. */
export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const parsed = schema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail("Invalid input", 422);
      if (!parsed.data.roomId && !parsed.data.roomNumber) return fail("Room required", 422);

      const room = parsed.data.roomId
        ? await Room.findOne({ _id: parsed.data.roomId, restaurantId: session.restaurantId }).lean()
        : await Room.findOne({ number: parsed.data.roomNumber, restaurantId: session.restaurantId }).lean();
      if (!room) return fail("Room not found", 404);

      // Never accept an order reference from another tenant.
      if (parsed.data.orderId) {
        const order = await Order.findOne({
          _id: parsed.data.orderId,
          restaurantId: session.restaurantId
        })
          .select("_id")
          .lean();
        if (!order) return fail("Order not found", 404);
      }

      const reservation = await activeReservationForRoom(session.restaurantId, String(room._id));
      if (!reservation) return fail("No in-house guest in that room", 409);

      const taxPercent = parsed.data.taxPercent ?? 0;
      const amountPaise = toPaise(parsed.data.amount);
      const charge = await postFolioCharge({
        restaurantId: session.restaurantId,
        reservationId: String(reservation._id),
        type: "fnb",
        amountPaise,
        taxPercent,
        taxPaise: Math.round((amountPaise * taxPercent) / 100),
        description: parsed.data.description || `Charge to room ${room.number}`,
        orderId: parsed.data.orderId,
        postedBy: session.userId
      });

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: "folio.charge_to_room",
        targetType: "reservation",
        targetId: String(reservation._id),
        meta: { room: room.number, amountPaise, orderId: parsed.data.orderId ?? null }
      });

      return ok({ folioChargeId: String(charge._id), reservationId: String(reservation._id) }, { status: 201 });
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}
