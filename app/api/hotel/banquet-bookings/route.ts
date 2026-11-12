import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { withTransaction } from "@/lib/db/transaction";
import { auditHotel } from "@/lib/hotel/audit";
import { addDays, expireStaleHolds, isHallAvailable, toUtcDate } from "@/lib/hotel/availability";
import { priceBanquet } from "@/lib/hotel/banquet";
import { paidPaiseForBooking, recordPayment } from "@/lib/hotel/folio";
import { acquireHallSlots, InventoryConflictError } from "@/lib/hotel/inventory";
import { toPaise, toRupees } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { banquetBookingSchema } from "@/lib/validators/hotel";
import { BanquetBooking, Hall } from "@/models";

const iso = (date: Date) => new Date(date).toISOString().slice(0, 10);

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier", "staff"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "banquet");
      await connectToDatabase();
      await expireStaleHolds(session.restaurantId);

      const url = new URL(req.url);
      const from = toUtcDate(url.searchParams.get("from") || new Date());
      const to = addDays(toUtcDate(url.searchParams.get("to") || addDays(from, 14)), 1);

      const bookings = await BanquetBooking.find({
        restaurantId: session.restaurantId,
        date: { $gte: from, $lt: to },
        status: { $ne: "cancelled" }
      })
        .sort({ date: 1 })
        .lean();

      const rows = await Promise.all(
        bookings.map(async (booking) => {
          const paid = await paidPaiseForBooking(session.restaurantId, String(booking._id));
          return {
            id: String(booking._id),
            hallId: String(booking.hallId),
            date: iso(booking.date),
            slot: booking.slot,
            eventType: booking.eventType ?? "",
            guestName: booking.guestName ?? "",
            guestCount: booking.guestCount,
            status: booking.status,
            total: toRupees(booking.totalAmountPaise ?? 0),
            gst: toRupees(booking.gstPaise ?? 0),
            paid: toRupees(paid),
            balance: toRupees(Math.max(0, (booking.totalAmountPaise ?? 0) - paid)),
            perPlate: toRupees(booking.menuPackage?.perPlatePaise ?? 0),
            addOns: (booking.addOns ?? []).map((row) => ({ name: row.name, amount: toRupees(row.amountPaise) })),
            invoiceNumber: booking.invoiceNumber ?? null
          };
        })
      );

      return ok(rows);
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "banquet");
      await connectToDatabase();

      const parsed = banquetBookingSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
      const data = parsed.data;
      const date = toUtcDate(data.date);

      const free = await isHallAvailable({
        restaurantId: session.restaurantId,
        hallId: data.hallId,
        date,
        slot: data.slot
      });
      if (!free) return fail("Hall is not available for that date and slot", 409);

      try {
        const booking = await withTransaction(async (txSession) => {
          const hall = await Hall.findOne({ _id: data.hallId, restaurantId: session.restaurantId })
            .session(txSession)
            .lean();
          if (!hall) throw new Error("Hall not found");

          const addOns = data.addOns.map((row) => ({ name: row.name, amountPaise: toPaise(row.amount) }));
          const priced = priceBanquet({
            hallRatePaise: toPaise(hall.baseRate ?? 0),
            perPlatePaise: toPaise(data.perPlate),
            guestCount: data.guestCount,
            addOns,
            gstPercent: data.gstPercent
          });

          const [created] = await BanquetBooking.create(
            [
              {
                restaurantId: session.restaurantId,
                hallId: hall._id,
                date,
                slot: data.slot,
                eventType: data.eventType,
                guestName: data.guestName,
                guestPhone: data.guestPhone,
                guestCount: data.guestCount,
                menuPackage: {
                  items: data.packageItems.map((item) => ({
                    menuItemId: item.menuItemId,
                    nameSnapshot: item.nameSnapshot,
                    pricePerPlatePaise: toPaise(item.pricePerPlate)
                  })),
                  perPlatePaise: toPaise(data.perPlate)
                },
                addOns,
                status: data.status,
                hallRatePaise: toPaise(hall.baseRate ?? 0),
                subtotalPaise: priced.subtotalPaise,
                gstPercent: data.gstPercent,
                gstPaise: priced.gstPaise,
                totalAmountPaise: priced.totalPaise,
                advancePaidPaise: toPaise(data.advancePaid),
                holdExpiresAt: data.holdExpiresAt ? new Date(data.holdExpiresAt) : undefined,
                setupType: data.setupType,
                startTime: data.startTime,
                endTime: data.endTime,
                staffNotes: data.staffNotes,
                notes: data.notes,
                createdBy: session.userId
              }
            ],
            { session: txSession }
          );

          await acquireHallSlots({
            restaurantId: session.restaurantId,
            hallId: String(hall._id),
            bookingId: String(created._id),
            date,
            slot: data.slot,
            session: txSession
          });

          if (data.advancePaid > 0) {
            await recordPayment({
              restaurantId: session.restaurantId,
              bookingId: String(created._id),
              amountPaise: toPaise(data.advancePaid),
              method: "cash",
              type: "advance",
              notes: "Advance at booking",
              createdBy: session.userId,
              session: txSession
            });
          }

          return created.toObject();
        });

        await auditHotel({
          restaurantId: session.restaurantId,
          actorId: session.userId,
          action: "booking.create",
          targetType: "booking",
          targetId: String(booking._id),
          meta: { hallId: data.hallId, date: data.date, slot: data.slot, guestCount: data.guestCount }
        });

        return ok({ id: String(booking._id), total: toRupees(booking.totalAmountPaise ?? 0) }, { status: 201 });
      } catch (error) {
        if (error instanceof InventoryConflictError) return fail(error.message, 409);
        throw error;
      }
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
