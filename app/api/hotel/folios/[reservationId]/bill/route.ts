import { NextRequest, NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { renderFolioBillHtml } from "@/lib/hotel/bill-html";
import { ensureFolio, folioTotals, paidPaiseFor } from "@/lib/hotel/folio";
import { toRupees } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { FolioCharge, Reservation, Restaurant, Room } from "@/models";

type Ctx = { params: Promise<{ reservationId: string }> };

const iso = (date?: Date | null) => (date ? new Date(date).toISOString().slice(0, 10) : "");

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk", "cashier"], async (_req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const { reservationId } = await context.params;

      const reservation = await Reservation.findOne({ _id: reservationId, restaurantId: session.restaurantId })
        .populate({ path: "guestId", select: "name" })
        .lean();
      if (!reservation) return new NextResponse("Not found", { status: 404 });

      const [folio, room, restaurant] = await Promise.all([
        ensureFolio(session.restaurantId, reservationId),
        Room.findById(reservation.roomId).select("number").lean(),
        Restaurant.findById(session.restaurantId).select("name").lean()
      ]);

      const charges = await FolioCharge.find({ restaurantId: session.restaurantId, folioId: folio._id })
        .sort({ postedAt: 1 })
        .lean();
      const totals = folioTotals(charges);
      const paid = await paidPaiseFor(session.restaurantId, reservationId);

      const html = renderFolioBillHtml({
        restaurantName: restaurant?.name ?? "Hotel",
        guestName: (reservation.guestId as unknown as { name?: string } | null)?.name ?? "",
        roomNumber: room?.number ?? "",
        checkIn: iso(reservation.checkIn),
        checkOut: iso(reservation.checkOut),
        invoiceNumber: folio.invoiceNumber ?? undefined,
        charges: charges.map((charge) => ({
          type: charge.type,
          description: charge.description ?? undefined,
          amount: toRupees(charge.amountPaise),
          postedAt: iso(charge.postedAt)
        })),
        summary: {
          room: toRupees(totals.roomPaise),
          fnb: toRupees(totals.fnbPaise),
          extra: toRupees(totals.extraPaise),
          tax: toRupees(totals.taxPaise),
          total: toRupees(totals.totalPaise)
        },
        advancePaid: toRupees(paid)
      });

      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
      });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}
