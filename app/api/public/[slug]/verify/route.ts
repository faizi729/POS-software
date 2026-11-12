import { NextRequest } from "next/server";
import { z } from "zod";

import { handleRouteError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { recordPayment } from "@/lib/hotel/folio";
import { resolvePublicTenant } from "@/lib/hotel/public";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import { Reservation } from "@/models";

type Ctx = { params: Promise<{ slug: string }> };

const schema = z.object({
  reservationId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  razorpay_order_id: z.string().min(4),
  razorpay_payment_id: z.string().min(4),
  razorpay_signature: z.string().min(8)
});

/** Confirms the booking only after the signature checks out. Idempotent per payment id. */
export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const limited = await rateLimit({
      request,
      keyParts: ["public-verify", getClientIp(request)],
      limit: 20,
      windowMs: 60_000
    });
    if (!limited.ok) return Response.json({ success: false, error: "Too many requests" }, { status: 429 });

    await connectToDatabase();
    const { slug } = await ctx.params;
    const tenant = await resolvePublicTenant(slug);
    if (!tenant) return Response.json({ success: false, error: "Not found" }, { status: 404 });

    const parsed = schema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return Response.json({ success: false, error: "Invalid payment" }, { status: 422 });
    const data = parsed.data;

    const reservation = await Reservation.findOne({
      _id: data.reservationId,
      restaurantId: tenant.restaurantId
    }).lean();
    if (!reservation) return Response.json({ success: false, error: "Booking not found" }, { status: 404 });
    if (reservation.onlineOrderId && reservation.onlineOrderId !== data.razorpay_order_id) {
      return Response.json({ success: false, error: "Payment does not match this booking" }, { status: 409 });
    }

    if (
      !verifyPaymentSignature({
        orderId: data.razorpay_order_id,
        paymentId: data.razorpay_payment_id,
        signature: data.razorpay_signature
      })
    ) {
      return Response.json({ success: false, error: "Signature verification failed" }, { status: 400 });
    }

    const amountPaise = reservation.onlineAmountPaise || 0;
    if (amountPaise > 0) {
      await recordPayment({
        restaurantId: tenant.restaurantId,
        reservationId: String(reservation._id),
        amountPaise,
        method: "razorpay",
        type: "advance",
        reference: data.razorpay_payment_id,
        notes: "Online booking advance",
        idempotencyKey: `rzp:${data.razorpay_payment_id}`
      });
    }

    await Reservation.updateOne(
      { _id: reservation._id, restaurantId: tenant.restaurantId, status: { $in: ["tentative", "confirmed"] } },
      {
        $set: {
          status: "confirmed",
          holdExpiresAt: null,
          onlinePaymentId: data.razorpay_payment_id,
          advancePaid: amountPaise
        }
      }
    );

    await auditHotel({
      restaurantId: tenant.restaurantId,
      action: "reservation.payment_verified",
      targetType: "reservation",
      targetId: String(reservation._id),
      meta: { paymentId: data.razorpay_payment_id, amountPaise }
    });

    return Response.json({ success: true, data: { reservationId: String(reservation._id), status: "confirmed" } });
  } catch (error) {
    return handleRouteError(error);
  }
}
