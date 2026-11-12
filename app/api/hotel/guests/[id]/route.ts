import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { folioTotals, paidPaiseFor } from "@/lib/hotel/folio";
import { canSeePii, maskIdNumber, maskPhone } from "@/lib/hotel/mask";
import { toRupees } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { Customer, Folio, FolioCharge, Reservation } from "@/models";

type Ctx = { params: Promise<{ id: string }> };

/** Guest profile + stay history + lifetime value. */
export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk", "cashier"], async (_req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const { id } = await context.params;

      const guest = await Customer.findOne({ _id: id, restaurantId: session.restaurantId }).lean();
      if (!guest) return fail("Guest not found", 404);

      const reservations = await Reservation.find({ restaurantId: session.restaurantId, guestId: guest._id })
        .populate({ path: "roomId", select: "number" })
        .sort({ checkIn: -1 })
        .limit(50)
        .lean();

      const stays = [];
      let lifetimePaise = 0;

      for (const reservation of reservations) {
        const folio = await Folio.findOne({
          restaurantId: session.restaurantId,
          reservationId: reservation._id
        })
          .select("_id status invoiceNumber")
          .lean();
        const charges = folio
          ? await FolioCharge.find({ restaurantId: session.restaurantId, folioId: folio._id })
              .select("type amountPaise taxPaise")
              .lean()
          : [];
        const totals = folioTotals(charges);
        const paid = await paidPaiseFor(session.restaurantId, String(reservation._id));
        lifetimePaise += paid;

        stays.push({
          id: String(reservation._id),
          roomNumber: (reservation.roomId as unknown as { number?: string } | null)?.number ?? "",
          checkIn: new Date(reservation.checkIn).toISOString().slice(0, 10),
          checkOut: new Date(reservation.checkOut).toISOString().slice(0, 10),
          status: reservation.status,
          source: reservation.source,
          total: toRupees(totals.totalPaise),
          paid: toRupees(paid),
          balance: toRupees(totals.totalPaise - paid),
          invoiceNumber: folio?.invoiceNumber ?? null
        });
      }

      const pii = canSeePii(session.role);

      return ok({
        id: String(guest._id),
        name: guest.name,
        phone: pii ? guest.phone ?? "" : maskPhone(guest.phone),
        email: pii ? guest.email ?? "" : "",
        idType: guest.idType ?? "",
        idNumber: pii ? guest.idNumber ?? "" : maskIdNumber(guest.idNumber),
        notes: guest.notes ?? "",
        stays,
        lifetimeValue: toRupees(lifetimePaise)
      });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}
