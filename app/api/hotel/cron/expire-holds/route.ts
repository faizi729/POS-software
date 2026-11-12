import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db/connect";
import { BanquetBooking, HallSlot, Reservation, RoomNight } from "@/models";

/**
 * Cron-only: cancels expired tentative holds and releases their inventory.
 * Protect with `HOTEL_CRON_SECRET` (header `x-cron-secret` or `?secret=`).
 */
export async function GET(request: NextRequest) {
  const secret = (process.env.HOTEL_CRON_SECRET || "").trim();
  if (!secret) return NextResponse.json({ error: "Cron secret not configured" }, { status: 503 });

  const provided =
    request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret") || "";
  if (provided !== secret) return NextResponse.json({ error: "Forbidden" }, { status: 401 });

  await connectToDatabase();
  const now = new Date();

  const staleReservations = await Reservation.find({
    status: "tentative",
    holdExpiresAt: { $lt: now }
  })
    .select("_id")
    .lean();
  const reservationIds = staleReservations.map((row) => row._id);

  const staleBookings = await BanquetBooking.find({
    status: "tentative",
    holdExpiresAt: { $lt: now }
  })
    .select("_id")
    .lean();
  const bookingIds = staleBookings.map((row) => row._id);

  const [roomsReleased, slotsReleased] = await Promise.all([
    reservationIds.length ? RoomNight.deleteMany({ reservationId: { $in: reservationIds } }) : null,
    bookingIds.length ? HallSlot.deleteMany({ bookingId: { $in: bookingIds } }) : null
  ]);

  const [reservations, bookings] = await Promise.all([
    reservationIds.length
      ? Reservation.updateMany({ _id: { $in: reservationIds } }, { $set: { status: "cancelled" } })
      : null,
    bookingIds.length
      ? BanquetBooking.updateMany({ _id: { $in: bookingIds } }, { $set: { status: "cancelled" } })
      : null
  ]);

  return NextResponse.json({
    ok: true,
    reservationsCancelled: reservations?.modifiedCount ?? 0,
    bookingsCancelled: bookings?.modifiedCount ?? 0,
    roomNightsReleased: roomsReleased?.deletedCount ?? 0,
    hallSlotsReleased: slotsReleased?.deletedCount ?? 0
  });
}
