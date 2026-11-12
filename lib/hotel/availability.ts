import type { ClientSession, Types } from "mongoose";

import { BanquetBooking, Reservation } from "@/models";
import { addDays, eachNight, nightsBetween, overlaps, toUtcDate } from "@/lib/hotel/dates";

export { addDays, eachNight, nightsBetween, overlaps, toUtcDate };

/** Statuses that occupy a room/hall. */
export const ACTIVE_HOLD_STATUSES = ["tentative", "confirmed", "checked_in"] as const;

/** A tentative hold stops blocking once its holdExpiresAt has passed. */
function activeFilter() {
  return {
    $or: [
      { status: { $in: ["confirmed", "checked_in"] } },
      { status: "tentative", $or: [{ holdExpiresAt: null }, { holdExpiresAt: { $gt: new Date() } }] }
    ]
  };
}

export type RoomAvailabilityInput = {
  restaurantId: string | Types.ObjectId;
  roomId: string | Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  ignoreReservationId?: string | Types.ObjectId;
  session?: ClientSession | null;
};

export async function isRoomAvailable(input: RoomAvailabilityInput): Promise<boolean> {
  if (!(input.checkIn < input.checkOut)) return false;

  const conflict = await Reservation.findOne({
    restaurantId: input.restaurantId,
    roomId: input.roomId,
    ...(input.ignoreReservationId ? { _id: { $ne: input.ignoreReservationId } } : {}),
    checkIn: { $lt: input.checkOut },
    checkOut: { $gt: input.checkIn },
    ...activeFilter()
  })
    .select("_id")
    .session(input.session ?? null)
    .lean();

  return !conflict;
}

/** Rooms free for the whole stay (used by the reservation form). */
export async function availableRoomIds(input: {
  restaurantId: string | Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  ignoreReservationId?: string | Types.ObjectId;
  session?: ClientSession | null;
}): Promise<Set<string>> {
  const busy = await Reservation.find({
    restaurantId: input.restaurantId,
    ...(input.ignoreReservationId ? { _id: { $ne: input.ignoreReservationId } } : {}),
    checkIn: { $lt: input.checkOut },
    checkOut: { $gt: input.checkIn },
    ...activeFilter()
  })
    .select("roomId")
    .session(input.session ?? null)
    .lean();

  return new Set(busy.map((row) => String(row.roomId)));
}

export type BookingSlot = "morning" | "evening" | "full_day";

export async function isHallAvailable(input: {
  restaurantId: string | Types.ObjectId;
  hallId: string | Types.ObjectId;
  date: Date;
  slot: BookingSlot;
  ignoreBookingId?: string | Types.ObjectId;
  session?: ClientSession | null;
}): Promise<boolean> {
  const slotClash = input.slot === "full_day" ? {} : { slot: { $in: [input.slot, "full_day"] } };

  const conflict = await BanquetBooking.findOne({
    restaurantId: input.restaurantId,
    hallId: input.hallId,
    date: input.date,
    ...(input.ignoreBookingId ? { _id: { $ne: input.ignoreBookingId } } : {}),
    ...slotClash,
    $or: [
      { status: "confirmed" },
      { status: "tentative", $or: [{ holdExpiresAt: null }, { holdExpiresAt: { $gt: new Date() } }] }
    ]
  })
    .select("_id")
    .session(input.session ?? null)
    .lean();

  return !conflict;
}

/** "full_day" blocks both slots; morning/evening block themselves. */
export function slotBlocks(slot: BookingSlot): BookingSlot[] {
  return slot === "full_day" ? ["morning", "evening", "full_day"] : [slot, "full_day"];
}

/** Cancel expired tentative holds so they stop showing as active. */
export async function expireStaleHolds(restaurantId: string | Types.ObjectId): Promise<void> {
  const now = new Date();
  await Promise.all([
    Reservation.updateMany(
      { restaurantId, status: "tentative", holdExpiresAt: { $lt: now } },
      { $set: { status: "cancelled" } }
    ),
    BanquetBooking.updateMany(
      { restaurantId, status: "tentative", holdExpiresAt: { $lt: now } },
      { $set: { status: "cancelled" } }
    )
  ]);
}
