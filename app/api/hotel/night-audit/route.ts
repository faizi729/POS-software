import { NextRequest } from "next/server";
import { z } from "zod";
import { isValidObjectId } from "mongoose";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { withTransaction } from "@/lib/db/transaction";
import { auditHotel } from "@/lib/hotel/audit";
import { addDays, toUtcDate } from "@/lib/hotel/availability";
import { loadHotelSettings } from "@/lib/hotel/booking";
import { postRoomNights } from "@/lib/hotel/folio";
import { toRupees } from "@/lib/hotel/money";
import { businessDateTotals, closedBusinessDates } from "@/lib/hotel/reports";
import { requireModuleForTenant } from "@/lib/modules";
import { BusinessDate, Reservation, User } from "@/models";

const closeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(300).optional()
});

/** Preview: what the night audit would close for a business date. */
export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const url = new URL(req.url);
      const date = toUtcDate(url.searchParams.get("date") || addDays(toUtcDate(new Date()), -1));
      const [{ totals, cashByUser }, closed, history, inHouse] = await Promise.all([
        businessDateTotals(session.restaurantId, date),
        BusinessDate.findOne({ restaurantId: session.restaurantId, date }).lean(),
        closedBusinessDates(session.restaurantId),
        Reservation.countDocuments({ restaurantId: session.restaurantId, status: "checked_in" })
      ]);

      return ok({
        date: date.toISOString().slice(0, 10),
        closed: Boolean(closed),
        closedAt: closed?.closedAt ? new Date(closed.closedAt).toISOString() : null,
        inHouse,
        totals: {
          room: toRupees(totals.roomPaise),
          fnb: toRupees(totals.fnbPaise),
          extra: toRupees(totals.extraPaise),
          tax: toRupees(totals.taxPaise),
          collected: toRupees(totals.collectedPaise),
          refunded: toRupees(totals.refundedPaise)
        },
        cashByUser: Array.from(cashByUser.entries()).map(([userId, cashPaise]) => ({
          userId,
          cash: toRupees(cashPaise)
        })),
        history: history.map((row) => ({
          date: new Date(row.date).toISOString().slice(0, 10),
          closedAt: row.closedAt ? new Date(row.closedAt).toISOString() : null,
          collected: toRupees(row.totals?.collectedPaise ?? 0)
        }))
      });
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * Night audit: post any missing room-night charges, lock the day's totals.
 * Closing the same date twice is refused (the numbers are already locked).
 */
export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const parsed = closeSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const date = toUtcDate(parsed.data.date || addDays(toUtcDate(new Date()), -1));
      const existing = await BusinessDate.findOne({
        restaurantId: session.restaurantId,
        date,
        status: "closed"
      })
        .select("_id")
        .lean();
      if (existing) return fail("Business date already closed", 409);

      const settings = await loadHotelSettings(session.restaurantId);
      const inHouse = await Reservation.find({
        restaurantId: session.restaurantId,
        status: "checked_in"
      })
        .select("_id")
        .lean();

      await withTransaction(async (tx) => {
        for (const reservation of inHouse) {
          await postRoomNights({
            restaurantId: session.restaurantId,
            reservationId: String(reservation._id),
            slabs: settings.slabs,
            session: tx
          });
        }
      });

      const { totals, cashByUser } = await businessDateTotals(session.restaurantId, date);
      const cashRows = await Promise.all(
        Array.from(cashByUser.entries()).map(async ([userId, cashPaise]) => {
          // Seeded/legacy payments may not carry a user id.
          if (!isValidObjectId(userId)) {
            return { userId: undefined, name: "System", cashPaise };
          }
          const user = await User.findById(userId).select("name").lean();
          return { userId: user?._id, name: user?.name ?? "Unknown", cashPaise };
        })
      );

      const closed = await BusinessDate.create({
        restaurantId: session.restaurantId,
        date,
        status: "closed",
        closedAt: new Date(),
        closedBy: session.userId,
        totals,
        cashByUser: cashRows,
        notes: parsed.data.notes
      });

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: "night_audit.close",
        targetType: "business_date",
        targetId: String(closed._id),
        meta: { date: date.toISOString().slice(0, 10), collectedPaise: totals.collectedPaise }
      });

      return ok(
        {
          id: String(closed._id),
          date: date.toISOString().slice(0, 10),
          totals: {
            room: toRupees(totals.roomPaise),
            fnb: toRupees(totals.fnbPaise),
            extra: toRupees(totals.extraPaise),
            tax: toRupees(totals.taxPaise),
            collected: toRupees(totals.collectedPaise),
            refunded: toRupees(totals.refundedPaise)
          },
          cashByUser: cashRows.map((row) => ({ name: row.name, cash: toRupees(row.cashPaise) }))
        },
        { status: 201 }
      );
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}
