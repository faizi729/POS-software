import type { ClientSession } from "mongoose";

import { eachNight } from "@/lib/hotel/availability";
import type { Paise } from "@/lib/hotel/money";
import { HallSlot, RoomNight } from "@/models";

/** Inventory clash (room night or hall slot already taken). */
export class InventoryConflictError extends Error {
  statusCode = 409 as const;
  constructor(message: string) {
    super(message);
  }
}

function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

function sessionOptions(session?: ClientSession | null) {
  return session ? { session } : {};
}

export type AcquireRoomNightsInput = {
  restaurantId: string;
  roomId: string;
  reservationId: string;
  checkIn: Date;
  checkOut: Date;
  nightlyPaise: Paise;
  /** Per-night tariffs from the rate engine; falls back to `nightlyPaise`. */
  rates?: Array<{ date: string; ratePaise: number }>;
  session?: ClientSession | null;
};

/**
 * Claims every night of the stay. The unique index on
 * `(restaurantId, roomId, date)` is what actually prevents double-booking;
 * call inside the reservation transaction.
 */
export async function acquireRoomNights(input: AcquireRoomNightsInput): Promise<number> {
  const nights = eachNight(input.checkIn, input.checkOut);
  if (!nights.length) throw new InventoryConflictError("Stay must include at least one night");

  const byDay = new Map((input.rates ?? []).map((row) => [row.date, row.ratePaise]));
  const docs = nights.map((date) => ({
    restaurantId: input.restaurantId,
    roomId: input.roomId,
    reservationId: input.reservationId,
    date,
    ratePaise: Math.max(0, Math.round(byDay.get(date.toISOString().slice(0, 10)) ?? input.nightlyPaise) || 0)
  }));

  try {
    await RoomNight.insertMany(docs, { ordered: true, ...sessionOptions(input.session) });
  } catch (error) {
    if (isDuplicateKey(error)) {
      // No transaction (dev fallback) → clean up the rows this attempt inserted.
      if (!input.session) await releaseRoomNights(input.restaurantId, input.reservationId);
      throw new InventoryConflictError("Room is not available for those dates");
    }
    throw error;
  }

  return docs.length;
}

/** Releases all nights for a reservation (cancel / no-show / checkout). */
export async function releaseRoomNights(
  restaurantId: string,
  reservationId: string,
  session?: ClientSession | null
): Promise<number> {
  const result = await RoomNight.deleteMany({ restaurantId, reservationId }, sessionOptions(session));
  return result.deletedCount ?? 0;
}

/** Moves an existing stay to a different room, keeping the same nights. */
export async function moveRoomNights(params: {
  restaurantId: string;
  reservationId: string;
  toRoomId: string;
  session?: ClientSession | null;
}): Promise<void> {
  try {
    await RoomNight.updateMany(
      { restaurantId: params.restaurantId, reservationId: params.reservationId },
      { $set: { roomId: params.toRoomId } },
      sessionOptions(params.session)
    );
  } catch (error) {
    if (isDuplicateKey(error)) throw new InventoryConflictError("Target room is not available for those dates");
    throw error;
  }
}

export type BookingSlot = "morning" | "evening" | "full_day";

/** `full_day` occupies both service slots. */
export function slotInventory(slot: BookingSlot): Array<"morning" | "evening"> {
  return slot === "full_day" ? ["morning", "evening"] : [slot];
}

export async function acquireHallSlots(params: {
  restaurantId: string;
  hallId: string;
  bookingId: string;
  date: Date;
  slot: BookingSlot;
  session?: ClientSession | null;
}): Promise<number> {
  const docs = slotInventory(params.slot).map((slot) => ({
    restaurantId: params.restaurantId,
    hallId: params.hallId,
    bookingId: params.bookingId,
    date: params.date,
    slot
  }));

  try {
    await HallSlot.insertMany(docs, { ordered: true, ...sessionOptions(params.session) });
  } catch (error) {
    if (isDuplicateKey(error)) {
      if (!params.session) await releaseHallSlots(params.restaurantId, params.bookingId);
      throw new InventoryConflictError("Hall is not available for that date and slot");
    }
    throw error;
  }

  return docs.length;
}

export async function releaseHallSlots(
  restaurantId: string,
  bookingId: string,
  session?: ClientSession | null
): Promise<number> {
  const result = await HallSlot.deleteMany({ restaurantId, bookingId }, sessionOptions(session));
  return result.deletedCount ?? 0;
}
