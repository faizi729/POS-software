import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { recordPayment } from "@/lib/hotel/folio";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { Reservation } from "@/models";

/**
 * Razorpay webhook. Signature is verified on the raw body and every credit is
 * idempotent per payment id, so a replayed event can never double-credit.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  if (event?.event !== "payment.captured" && event?.event !== "order.paid") {
    return NextResponse.json({ ok: true, ignored: event?.event ?? "unknown" });
  }

  const payment = event?.payload?.payment?.entity ?? event?.payload?.order?.entity ?? {};
  const paymentId: string = payment?.id ?? "";
  const orderId: string = payment?.order_id ?? payment?.id ?? "";
  const amountPaise: number = Math.round(Number(payment?.amount ?? 0));
  if (!paymentId || !(amountPaise > 0)) {
    return NextResponse.json({ ok: true, ignored: "no payment entity" });
  }

  await connectToDatabase();

  const notesReservationId = payment?.notes?.reservationId as string | undefined;
  let reservation = notesReservationId
    ? await Reservation.findById(notesReservationId).select("_id restaurantId status").lean()
    : null;
  if (!reservation && orderId) {
    reservation = await Reservation.findOne({ onlineOrderId: orderId })
      .select("_id restaurantId status")
      .lean();
  }
  if (!reservation) return NextResponse.json({ ok: true, unmatched: true });

  const restaurantId = String(reservation.restaurantId);
  await recordPayment({
    restaurantId,
    reservationId: String(reservation._id),
    amountPaise,
    method: "razorpay",
    type: "advance",
    reference: paymentId,
    notes: "Razorpay webhook",
    idempotencyKey: `rzp:${paymentId}`
  });

  if (reservation.status === "tentative") {
    await Reservation.updateOne(
      { _id: reservation._id, restaurantId },
      { $set: { status: "confirmed", holdExpiresAt: null, onlinePaymentId: paymentId } }
    );
  }

  await auditHotel({
    restaurantId,
    action: "payment.webhook",
    targetType: "reservation",
    targetId: String(reservation._id),
    meta: { paymentId, amountPaise, event: event.event }
  });

  return NextResponse.json({ ok: true });
}
