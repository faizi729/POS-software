import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { recordPayment } from "@/lib/hotel/folio";
import { toPaise, toRupees } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { hotelPaymentSchema } from "@/lib/validators/hotel";
import { HotelPayment } from "@/models";

/** Ledger: advances, settlement payments and refunds. Amounts in/out are rupees. */
export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const parsed = hotelPaymentSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
      const data = parsed.data;
      if (!data.reservationId && !data.bookingId) return fail("reservationId or bookingId required", 422);
      if (data.type === "refund" && session.role !== "owner" && session.role !== "manager") {
        return fail("Only a manager can record refunds", 403);
      }

      const payment = await recordPayment({
        restaurantId: session.restaurantId,
        reservationId: data.reservationId,
        bookingId: data.bookingId,
        amountPaise: toPaise(data.amount),
        method: data.method,
        type: data.type,
        reference: data.reference,
        notes: data.notes,
        idempotencyKey: data.idempotencyKey,
        createdBy: session.userId
      });

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: `payment.${data.type}`,
        targetType: data.reservationId ? "reservation" : "booking",
        targetId: String(data.reservationId ?? data.bookingId),
        meta: { amountPaise: toPaise(data.amount), method: data.method, reference: data.reference ?? null }
      });

      if (data.type !== "refund" && data.reservationId) {
        const { notifyGuest } = await import("@/lib/messaging");
        const { Reservation, Customer, Restaurant } = await import("@/models");
        const [reservation, hotel] = await Promise.all([
          Reservation.findById(data.reservationId).select("guestId").lean(),
          Restaurant.findById(session.restaurantId).select("name").lean()
        ]);
        const guest = reservation
          ? await Customer.findById(reservation.guestId).select("phone").lean()
          : null;
        void notifyGuest({
          kind: "payment_received",
          to: guest?.phone ?? "",
          vars: {
            hotel: hotel?.name ?? "Hotel",
            amount: `₹${data.amount.toFixed(2)}`
          }
        });
      }

      return ok({ id: String((payment as { _id?: unknown })._id ?? "") }, { status: 201 });
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const reservationId = new URL(req.url).searchParams.get("reservationId");
      const payments = await HotelPayment.find({
        restaurantId: session.restaurantId,
        ...(reservationId ? { reservationId } : {})
      })
        .sort({ paidAt: -1 })
        .limit(200)
        .lean();

      return ok(
        payments.map((payment) => ({
          id: String(payment._id),
          reservationId: payment.reservationId ? String(payment.reservationId) : null,
          bookingId: payment.bookingId ? String(payment.bookingId) : null,
          type: payment.type,
          method: payment.method,
          amount: toRupees(payment.amountPaise),
          reference: payment.reference ?? "",
          paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : ""
        }))
      );
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}
