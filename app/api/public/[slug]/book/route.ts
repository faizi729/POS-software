import { NextRequest } from "next/server";

import { handleRouteError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";
import { toUtcDate } from "@/lib/hotel/availability";
import { auditHotel } from "@/lib/hotel/audit";
import { createReservation, loadHotelSettings } from "@/lib/hotel/booking";
import { InventoryConflictError } from "@/lib/hotel/inventory";
import { pickRoom, resolvePublicTenant } from "@/lib/hotel/public";
import { quoteStay } from "@/lib/hotel/rates";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "@/lib/payments/razorpay";
import { publicBookingSchema } from "@/lib/validators/hotel";
import { Reservation } from "@/models";

type Ctx = { params: Promise<{ slug: string }> };

const HOLD_MINUTES = 20;

/**
 * Public booking: holds a room tentatively, then returns a Razorpay order.
 * The reservation only becomes `confirmed` after a verified payment.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const limited = await rateLimit({
      request,
      keyParts: ["public-book", getClientIp(request)],
      limit: 8,
      windowMs: 60_000
    });
    if (!limited.ok) return Response.json({ success: false, error: "Too many requests" }, { status: 429 });

    await connectToDatabase();
    const { slug } = await ctx.params;
    const tenant = await resolvePublicTenant(slug);
    if (!tenant) return Response.json({ success: false, error: "Not found" }, { status: 404 });

    const parsed = publicBookingSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }
    const data = parsed.data;
    const checkIn = toUtcDate(data.checkIn);
    const checkOut = toUtcDate(data.checkOut);

    const room = await pickRoom(tenant.restaurantId, data.roomTypeId, checkIn, checkOut);
    if (!room) return Response.json({ success: false, error: "No rooms left for those dates" }, { status: 409 });

    const settings = await loadHotelSettings(tenant.restaurantId);
    const quote = await quoteStay({
      restaurantId: tenant.restaurantId,
      roomTypeId: data.roomTypeId,
      checkIn,
      checkOut,
      adults: data.adults,
      children: data.children,
      discountCode: data.discountCode,
      slabs: settings.slabs
    });
    const payable = quote.totalPaise + quote.taxPaise;

    const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    try {
      const created = await createReservation({
        restaurantId: tenant.restaurantId,
        roomId: String(room._id),
        checkIn,
        checkOut,
        guest: { name: data.guest.name, phone: data.guest.phone, email: data.guest.email || undefined },
        adults: data.adults,
        children: data.children,
        discountCode: data.discountCode,
        status: "tentative",
        source: "website",
        holdExpiresAt,
        settings
      });

      let orderId: string | null = null;
      let amountPaise = 0;

      if (razorpayConfigured()) {
        const advancePercent = Math.min(100, Math.max(1, Number((tenant.settings as any).publicAdvancePercent ?? 25)));
        amountPaise = Math.max(100, Math.round((payable * advancePercent) / 100));
        const order = await createRazorpayOrder({
          amountPaise,
          receipt: created.reservationId,
          notes: { reservationId: created.reservationId, slug: tenant.slug }
        });
        orderId = order.id;
        await Reservation.updateOne(
          { _id: created.reservationId, restaurantId: tenant.restaurantId },
          { $set: { onlineOrderId: order.id, onlineAmountPaise: amountPaise } }
        );
      }

      await auditHotel({
        restaurantId: tenant.restaurantId,
        action: "reservation.public_hold",
        targetType: "reservation",
        targetId: created.reservationId,
        meta: { orderId, payable, source: "website" }
      });

      return Response.json(
        {
          success: true,
          data: {
            reservationId: created.reservationId,
            holdExpiresAt: holdExpiresAt.toISOString(),
            total: payable / 100,
            orderId,
            amount: amountPaise / 100,
            keyId: orderId ? razorpayKeyId() : null,
            payAtHotel: !orderId
          }
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof InventoryConflictError) {
        return Response.json({ success: false, error: error.message }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
