import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { withTransaction } from "@/lib/db/transaction";
import { auditHotel } from "@/lib/hotel/audit";
import { banquetCancellation, priceBanquet } from "@/lib/hotel/banquet";
import { loadHotelSettings } from "@/lib/hotel/booking";
import { hoursUntil } from "@/lib/hotel/cancellation";
import { paidPaiseForBooking, recordPayment } from "@/lib/hotel/folio";
import { nextInvoiceNumber } from "@/lib/hotel/invoice";
import { releaseHallSlots } from "@/lib/hotel/inventory";
import { toPaise, toRupees } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { banquetUpdateSchema } from "@/lib/validators/hotel";
import { BanquetBooking, HotelPayment } from "@/models";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk", "cashier", "staff"], async (_req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "banquet");
      await connectToDatabase();
      const { id } = await context.params;

      const booking = await BanquetBooking.findOne({ _id: id, restaurantId: session.restaurantId }).lean();
      if (!booking) return fail("Booking not found", 404);

      const [paid, payments] = await Promise.all([
        paidPaiseForBooking(session.restaurantId, id),
        HotelPayment.find({ restaurantId: session.restaurantId, bookingId: id }).sort({ paidAt: 1 }).lean()
      ]);

      return ok({
        id: String(booking._id),
        hallId: String(booking.hallId),
        date: new Date(booking.date).toISOString().slice(0, 10),
        slot: booking.slot,
        status: booking.status,
        eventType: booking.eventType ?? "",
        guestName: booking.guestName ?? "",
        guestPhone: booking.guestPhone ?? "",
        guestCount: booking.guestCount,
        perPlate: toRupees(booking.menuPackage?.perPlatePaise ?? 0),
        items: (booking.menuPackage?.items ?? []).map((item) => ({
          name: item.nameSnapshot,
          pricePerPlate: toRupees(item.pricePerPlatePaise ?? 0)
        })),
        addOns: (booking.addOns ?? []).map((row) => ({ name: row.name, amount: toRupees(row.amountPaise) })),
        hallRate: toRupees(booking.hallRatePaise ?? 0),
        gstPercent: booking.gstPercent ?? 0,
        gst: toRupees(booking.gstPaise ?? 0),
        total: toRupees(booking.totalAmountPaise ?? 0),
        paid: toRupees(paid),
        balance: toRupees(Math.max(0, (booking.totalAmountPaise ?? 0) - paid)),
        invoiceNumber: booking.invoiceNumber ?? null,
        setupType: booking.setupType ?? "",
        startTime: booking.startTime ?? "",
        endTime: booking.endTime ?? "",
        staffNotes: booking.staffNotes ?? "",
        notes: booking.notes ?? "",
        holdExpiresAt: booking.holdExpiresAt ? new Date(booking.holdExpiresAt).toISOString() : null,
        payments: payments.map((payment) => ({
          id: String(payment._id),
          type: payment.type,
          method: payment.method,
          amount: toRupees(payment.amountPaise),
          paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : ""
        }))
      });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk"], async (req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "banquet");
      await connectToDatabase();
      const { id } = await context.params;

      const parsed = banquetUpdateSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
      const data = parsed.data;

      const booking = await BanquetBooking.findOne({ _id: id, restaurantId: session.restaurantId }).lean();
      if (!booking) return fail("Booking not found", 404);
      if (booking.status === "cancelled" && data.status !== undefined) {
        return fail("Booking is already cancelled", 409);
      }

      const settings = await loadHotelSettings(session.restaurantId);
      const set: Record<string, unknown> = {};

      const repricing =
        data.perPlate !== undefined ||
        data.addOns !== undefined ||
        data.guestCount !== undefined ||
        data.gstPercent !== undefined;

      if (repricing) {
        const perPlatePaise =
          data.perPlate !== undefined ? toPaise(data.perPlate) : booking.menuPackage?.perPlatePaise ?? 0;
        const addOnsSource =
          data.addOns ??
          (booking.addOns ?? []).map((row) => ({ name: row.name, amount: toRupees(row.amountPaise) }));
        const addOns = addOnsSource.map((row) => ({ name: row.name, amountPaise: toPaise(row.amount) }));
        const guestCount = data.guestCount ?? booking.guestCount;
        const gstPercent = data.gstPercent ?? booking.gstPercent ?? 18;

        const priced = priceBanquet({
          hallRatePaise: booking.hallRatePaise ?? 0,
          perPlatePaise,
          guestCount,
          addOns,
          gstPercent
        });

        set.guestCount = guestCount;
        set["menuPackage.perPlatePaise"] = perPlatePaise;
        set.addOns = addOns;
        set.gstPercent = gstPercent;
        set.subtotalPaise = priced.subtotalPaise;
        set.gstPaise = priced.gstPaise;
        set.totalAmountPaise = priced.totalPaise;
      }

      for (const key of [
        "eventType",
        "guestName",
        "guestPhone",
        "setupType",
        "startTime",
        "endTime",
        "staffNotes",
        "notes"
      ] as const) {
        if (data[key] !== undefined) set[key] = data[key];
      }
      if (data.packageItems !== undefined) {
        set["menuPackage.items"] = data.packageItems.map((item) => ({
          menuItemId: item.menuItemId,
          nameSnapshot: item.nameSnapshot,
          pricePerPlatePaise: toPaise(item.pricePerPlate)
        }));
      }
      if (data.holdExpiresAt !== undefined) {
        set.holdExpiresAt = data.holdExpiresAt ? new Date(data.holdExpiresAt) : null;
      }

      let refundPaise = 0;

      if (data.status) {
        set.status = data.status;
        if (data.status === "confirmed") set.holdExpiresAt = null;

        if (data.status === "cancelled" || data.status === "completed") {
          await withTransaction(async (tx) => {
            await releaseHallSlots(session.restaurantId, id, tx);
          });
        }

        if (data.status === "cancelled") {
          const paid = await paidPaiseForBooking(session.restaurantId, id);
          const outcome = banquetCancellation({
            policy: {
              freeUntilHours: settings.cancellation.freeUntilHours,
              chargePercent: settings.cancellation.chargePercent
            },
            totalPaise: (set.totalAmountPaise as number) ?? booking.totalAmountPaise ?? 0,
            paidPaise: paid,
            hoursToEvent: hoursUntil(new Date(booking.date), 10)
          });
          refundPaise = outcome.refundablePaise;
          if (refundPaise > 0) {
            await recordPayment({
              restaurantId: session.restaurantId,
              bookingId: id,
              amountPaise: refundPaise,
              method: "cash",
              type: "refund",
              notes: "Event cancellation refund",
              createdBy: session.userId
            });
          }
          set.cancellationFeePaise = outcome.penaltyPaise;
          set.refundedPaise = refundPaise;
        }

        if (data.status === "completed" && !booking.invoiceNumber) {
          const { invoiceNumber } = await nextInvoiceNumber({
            restaurantId: session.restaurantId,
            scope: "banquet",
            prefix: settings.invoicePrefix
          });
          set.invoiceNumber = invoiceNumber;
          set.invoiceIssuedAt = new Date();
        }
      }

      const updated = await BanquetBooking.findOneAndUpdate(
        { _id: id, restaurantId: session.restaurantId },
        { $set: set },
        { new: true }
      ).lean();
      if (!updated) return fail("Booking not found", 404);

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: `booking.${data.status ?? "update"}`,
        targetType: "booking",
        targetId: id,
        meta: { status: data.status ?? null, refundPaise, repriced: repricing }
      });

      return ok({
        id,
        status: updated.status,
        total: toRupees(updated.totalAmountPaise ?? 0),
        invoiceNumber: updated.invoiceNumber ?? null,
        refund: toRupees(refundPaise)
      });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}
