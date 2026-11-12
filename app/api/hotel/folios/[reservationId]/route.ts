import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import {
  balancePaise,
  ensureFolio,
  folioTotals,
  paidPaiseFor,
  postFolioCharge
} from "@/lib/hotel/folio";
import { toPaise, toRupees } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { folioChargeSchema } from "@/lib/validators/hotel";
import { FolioCharge, HotelPayment, Reservation, Room } from "@/models";

type Ctx = { params: Promise<{ reservationId: string }> };

const iso = (date?: Date | null) => (date ? new Date(date).toISOString().slice(0, 10) : "");

async function loadFolio(restaurantId: string, reservationId: string) {
  const reservation = await Reservation.findOne({ _id: reservationId, restaurantId })
    .populate({ path: "guestId", select: "name" })
    .lean();
  if (!reservation) return null;

  const folio = await ensureFolio(restaurantId, reservationId);
  const [charges, payments, room] = await Promise.all([
    FolioCharge.find({ restaurantId, folioId: folio._id }).sort({ postedAt: 1 }).lean(),
    HotelPayment.find({ restaurantId, reservationId }).sort({ paidAt: 1 }).lean(),
    Room.findById(reservation.roomId).select("number").lean()
  ]);

  const totals = folioTotals(charges);
  const paid = await paidPaiseFor(restaurantId, reservationId);

  return {
    reservation,
    folio,
    charges,
    payments,
    totals,
    paid,
    balance: balancePaise(totals.totalPaise, paid),
    roomNumber: room?.number ?? "",
    guestName: (reservation.guestId as unknown as { name?: string } | null)?.name ?? ""
  };
}

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk", "cashier"], async (_req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const { reservationId } = await context.params;

      const loaded = await loadFolio(session.restaurantId, reservationId);
      if (!loaded) return fail("Reservation not found", 404);

      return ok({
        id: String(loaded.folio._id),
        status: loaded.folio.status,
        invoiceNumber: loaded.folio.invoiceNumber ?? null,
        guestName: loaded.guestName,
        roomNumber: loaded.roomNumber,
        checkIn: iso(loaded.reservation.checkIn),
        checkOut: iso(loaded.reservation.checkOut),
        totals: {
          room: toRupees(loaded.totals.roomPaise),
          fnb: toRupees(loaded.totals.fnbPaise),
          extra: toRupees(loaded.totals.extraPaise),
          charges: toRupees(loaded.totals.chargesPaise),
          tax: toRupees(loaded.totals.taxPaise),
          total: toRupees(loaded.totals.totalPaise)
        },
        paid: toRupees(loaded.paid),
        balance: toRupees(loaded.balance),
        charges: loaded.charges.map((charge) => ({
          id: String(charge._id),
          type: charge.type,
          amount: toRupees(charge.amountPaise),
          tax: toRupees(charge.taxPaise ?? 0),
          taxPercent: charge.taxPercent ?? 0,
          description: charge.description ?? "",
          postedAt: charge.postedAt ? new Date(charge.postedAt).toISOString() : ""
        })),
        payments: loaded.payments.map((payment) => ({
          id: String(payment._id),
          type: payment.type,
          method: payment.method,
          amount: toRupees(payment.amountPaise),
          reference: payment.reference ?? "",
          paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : ""
        }))
      });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk", "cashier"], async (req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const { reservationId } = await context.params;

      const reservation = await Reservation.findOne({ _id: reservationId, restaurantId: session.restaurantId }).lean();
      if (!reservation) return fail("Reservation not found", 404);
      if (reservation.status !== "checked_in") return fail("Reservation is not in-house", 409);

      const parsed = folioChargeSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const taxPercent = parsed.data.taxPercent ?? 0;
      const amountPaise = toPaise(parsed.data.amount);
      const charge = await postFolioCharge({
        restaurantId: session.restaurantId,
        reservationId,
        type: parsed.data.type,
        amountPaise,
        taxPercent,
        taxPaise: Math.round((amountPaise * taxPercent) / 100),
        description: parsed.data.description,
        orderId: parsed.data.orderId,
        postedBy: session.userId
      });

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: "folio.charge",
        targetType: "reservation",
        targetId: reservationId,
        meta: { type: parsed.data.type, amountPaise, taxPercent }
      });

      return ok({ id: String(charge._id) }, { status: 201 });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}
