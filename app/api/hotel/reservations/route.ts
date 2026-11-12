import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { addDays, expireStaleHolds, toUtcDate } from "@/lib/hotel/availability";
import { createReservation, loadHotelSettings } from "@/lib/hotel/booking";
import { InventoryConflictError } from "@/lib/hotel/inventory";
import { canSeePii, maskPhone } from "@/lib/hotel/mask";
import { toPaise, toRupees } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { reservationSchema } from "@/lib/validators/hotel";
import { Reservation, Restaurant } from "@/models";

const dateOnlyString = (value?: Date | null) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier", "staff", "housekeeping"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      await expireStaleHolds(session.restaurantId);

      const url = new URL(req.url);
      const from = toUtcDate(url.searchParams.get("from") || new Date());
      const to = addDays(toUtcDate(url.searchParams.get("to") || addDays(from, 14)), 1);
      const pii = canSeePii(session.role);

      const reservations = await Reservation.find({
        restaurantId: session.restaurantId,
        checkIn: { $lt: to },
        checkOut: { $gt: from },
        status: { $ne: "cancelled" }
      })
        .populate({ path: "roomId", select: "number floor" })
        .populate({ path: "guestId", select: "name phone" })
        .sort({ checkIn: 1 })
        .lean();

      return ok(
        reservations.map((reservation) => {
          const room = reservation.roomId as unknown as { _id?: unknown; number?: string; floor?: number } | null;
          const guest = reservation.guestId as unknown as { _id?: unknown; name?: string; phone?: string } | null;
          const phone = guest?.phone ?? "";
          return {
            id: String(reservation._id),
            roomId: room?._id ? String(room._id) : "",
            roomNumber: room?.number ?? "",
            guestId: guest?._id ? String(guest._id) : "",
            guestName: guest?.name ?? "",
            guestPhone: pii ? phone : maskPhone(phone),
            checkIn: dateOnlyString(reservation.checkIn),
            checkOut: dateOnlyString(reservation.checkOut),
            status: reservation.status,
            source: reservation.source,
            adults: reservation.adults ?? 2,
            children: reservation.children ?? 0,
            groupId: reservation.groupId ?? null,
            advancePaid: toRupees(reservation.advancePaid ?? 0),
            rate: toRupees(reservation.rateSnapshot ?? 0),
            holdExpiresAt: reservation.holdExpiresAt ? new Date(reservation.holdExpiresAt).toISOString() : null
          };
        })
      );
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const parsed = reservationSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
      const data = parsed.data;

      try {
        const settings = await loadHotelSettings(session.restaurantId);
        const { reservationId, quote } = await createReservation({
          restaurantId: session.restaurantId,
          userId: session.userId,
          roomId: data.roomId,
          checkIn: toUtcDate(data.checkIn),
          checkOut: toUtcDate(data.checkOut),
          guest: data.guest,
          adults: data.adults,
          children: data.children,
          discountCode: data.discountCode,
          status: data.status,
          source: data.source,
          advancePaidPaise: toPaise(data.advancePaid),
          holdExpiresAt: data.holdExpiresAt ? new Date(data.holdExpiresAt) : null,
          notes: data.notes,
          settings
        });

        await auditHotel({
          restaurantId: session.restaurantId,
          actorId: session.userId,
          action: "reservation.create",
          targetType: "reservation",
          targetId: reservationId,
          meta: { roomId: data.roomId, checkIn: data.checkIn, checkOut: data.checkOut, status: data.status }
        });

        if (data.status === "confirmed") {
          const { notifyGuest } = await import("@/lib/messaging");
          const hotel = await Restaurant.findById(session.restaurantId).select("name").lean();
          void notifyGuest({
            kind: "booking_confirmed",
            to: data.guest.phone,
            vars: {
              hotel: hotel?.name ?? "Hotel",
              reference: reservationId.slice(-6).toUpperCase(),
              dates: `${data.checkIn} to ${data.checkOut}`
            }
          });
        }

        return ok(
          {
            id: reservationId,
            total: toRupees(quote.totalPaise),
            tax: toRupees(quote.taxPaise),
            discount: toRupees(quote.discountPaise),
            ratePlan: quote.planName ?? null
          },
          { status: 201 }
        );
      } catch (error) {
        if (error instanceof InventoryConflictError) return fail(error.message, 409);
        throw error;
      }
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
