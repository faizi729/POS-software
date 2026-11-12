import type { ClientSession } from "mongoose";
import mongoose from "mongoose";

import { isRoomAvailable } from "@/lib/hotel/availability";
import { toPaise } from "@/lib/hotel/money";
import { recordPayment } from "@/lib/hotel/folio";
import { quoteStay, type StayQuote } from "@/lib/hotel/rates";
import { normalizeSlabs, type GstSlab } from "@/lib/hotel/tax";
import { acquireRoomNights, InventoryConflictError } from "@/lib/hotel/inventory";
import { Customer, Reservation, Restaurant, Room, RoomType } from "@/models";

export type HotelSettings = {
  slabs: GstSlab[];
  invoicePrefix: string;
  checkInTime: string;
  checkOutTime: string;
  earlyCheckInFeePaise: number;
  lateCheckOutFeePaise: number;
  cancellation: { freeUntilHours: number; chargeNights: number; chargePercent: number };
};

export async function loadHotelSettings(
  restaurantId: string,
  session?: ClientSession | null
): Promise<HotelSettings> {
  const restaurant = await Restaurant.findById(restaurantId)
    .select("settings")
    .session(session ?? null)
    .lean();
  const settings = (restaurant?.settings ?? {}) as any;
  return {
    slabs: normalizeSlabs(settings.gstSlabs),
    invoicePrefix: settings.invoicePrefix || "INV",
    checkInTime: settings.checkInTime || "14:00",
    checkOutTime: settings.checkOutTime || "11:00",
    earlyCheckInFeePaise: settings.earlyCheckInFeePaise ?? 0,
    lateCheckOutFeePaise: settings.lateCheckOutFeePaise ?? 0,
    cancellation: {
      freeUntilHours: settings.cancellation?.freeUntilHours ?? 24,
      chargeNights: settings.cancellation?.chargeNights ?? 1,
      chargePercent: settings.cancellation?.chargePercent ?? 0
    }
  };
}

export type CreateReservationInput = {
  restaurantId: string;
  userId?: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guest: { name: string; phone?: string; email?: string; idType?: string; idNumber?: string };
  adults?: number;
  children?: number;
  discountCode?: string;
  status?: "tentative" | "confirmed" | "checked_in";
  source?: "walk_in" | "phone" | "ota" | "website";
  advancePaidPaise?: number;
  holdExpiresAt?: Date | null;
  notes?: string;
  groupId?: string;
  folioReservationId?: string;
  onlineOrderId?: string;
  settings: HotelSettings;
};

/** Creates one reservation: prices it, claims inventory and ledgers any advance. */
export async function createReservation(input: CreateReservationInput): Promise<{
  reservationId: string;
  quote: StayQuote;
  conflict?: never;
}> {
  const room = await Room.findOne({ _id: input.roomId, restaurantId: input.restaurantId }).lean();
  if (!room) throw new InventoryConflictError("Room not found");
  if (room.status === "maintenance") throw new InventoryConflictError(`Room ${room.number} is out of service`);

  if (
    !(await isRoomAvailable({
      restaurantId: input.restaurantId,
      roomId: input.roomId,
      checkIn: input.checkIn,
      checkOut: input.checkOut
    }))
  ) {
    throw new InventoryConflictError("Room is not available for those dates");
  }

  const quote = await quoteStay({
    restaurantId: input.restaurantId,
    roomTypeId: String(room.roomTypeId),
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adults ?? 2,
    children: input.children ?? 0,
    discountCode: input.discountCode,
    slabs: input.settings.slabs
  });

  const roomType = await RoomType.findById(room.roomTypeId).select("gstPercent").lean();
  const phone = (input.guest.phone || "").trim();
  const guestFields = {
    name: input.guest.name,
    email: input.guest.email || undefined,
    idType: input.guest.idType || undefined,
    idNumber: input.guest.idNumber || undefined
  };

  const guest = phone
    ? await Customer.findOneAndUpdate(
        { restaurantId: input.restaurantId, phone },
        { $set: guestFields, $setOnInsert: { restaurantId: input.restaurantId, phone } },
        { upsert: true, new: true }
      ).lean()
    : (
        await Customer.create([
          { restaurantId: input.restaurantId, ...guestFields }
        ])
      )[0].toObject();

  if (!guest) throw new Error("Could not save guest");

  const [created] = await Reservation.create([
    {
      restaurantId: input.restaurantId,
      guestId: guest._id,
      roomId: room._id,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      status: input.status ?? "confirmed",
      source: input.source ?? "walk_in",
      adults: input.adults ?? 2,
      children: input.children ?? 0,
      advancePaid: input.advancePaidPaise ?? 0,
      holdExpiresAt: input.holdExpiresAt ?? undefined,
      rateSnapshot: quote.nightlyFromPaise,
      gstPercentSnapshot: quote.taxPercent || roomType?.gstPercent || 12,
      ratePlanId: quote.planId,
      discountCode: quote.discountCode,
      groupId: input.groupId,
      folioReservationId: input.folioReservationId,
      onlineOrderId: input.onlineOrderId,
      notes: input.notes,
      createdBy: input.userId
    }
  ]);

  await acquireRoomNights({
    restaurantId: input.restaurantId,
    roomId: String(room._id),
    reservationId: String(created._id),
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nightlyPaise: quote.nightlyFromPaise,
    rates: quote.nights
  }).catch(async (error) => {
    // Compensate: a reservation without its inventory rows must never survive.
    await Reservation.deleteOne({ _id: created._id }).catch(() => {});
    throw error;
  });

  if ((input.advancePaidPaise ?? 0) > 0) {
    await recordPayment({
      restaurantId: input.restaurantId,
      reservationId: String(created._id),
      amountPaise: input.advancePaidPaise ?? 0,
      method: "cash",
      type: "advance",
      notes: "Advance at booking",
      createdBy: input.userId
    });
  }

  return { reservationId: String(created._id), quote };
}

export function advanceFromRupees(value: number | undefined): number {
  return toPaise(value ?? 0);
}

export type GroupReservationInput = {
  restaurantId: string;
  userId?: string;
  rooms: Array<{ roomId: string; adults?: number; children?: number }>;
  guest: { name: string; phone?: string; email?: string; idType?: string; idNumber?: string };
  checkIn: Date;
  checkOut: Date;
  status?: "tentative" | "confirmed";
  source?: "walk_in" | "phone" | "ota" | "website";
  folioMode: "single" | "separate";
  advancePaidPaise?: number;
  discountCode?: string;
  holdExpiresAt?: Date | null;
  notes?: string;
  settings: HotelSettings;
};

/**
 * Multi-room booking. `single` folio mode points every room at the first
 * reservation's folio, so the group checks out on one bill.
 */
export async function createGroupReservation(input: GroupReservationInput) {
  const groupId = new mongoose.Types.ObjectId().toString();
  const created: string[] = [];
  const quotes: StayQuote[] = [];
  let folioOwnerId: string | undefined;

  try {
    for (const [index, room] of input.rooms.entries()) {
      const result = await createReservation({
        restaurantId: input.restaurantId,
        userId: input.userId,
        roomId: room.roomId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guest: input.guest,
        adults: room.adults ?? 2,
        children: room.children ?? 0,
        discountCode: input.discountCode,
        status: input.status ?? "confirmed",
        source: input.source ?? "walk_in",
        advancePaidPaise: index === 0 ? input.advancePaidPaise ?? 0 : 0,
        holdExpiresAt: input.holdExpiresAt ?? null,
        notes: input.notes,
        groupId,
        settings: input.settings
      });

      if (index === 0) folioOwnerId = result.reservationId;
      created.push(result.reservationId);
      quotes.push(result.quote);
    }

    if (input.folioMode === "single" && folioOwnerId) {
      await Reservation.updateMany(
        { _id: { $in: created }, restaurantId: input.restaurantId },
        { $set: { folioReservationId: folioOwnerId } }
      );
    }

    return { groupId, reservationIds: created, quotes, folioOwnerId: folioOwnerId ?? created[0] };
  } catch (error) {
    // All-or-nothing: release whatever made it in.
    if (created.length) {
      const { releaseRoomNights } = await import("@/lib/hotel/inventory");
      await Promise.all(created.map((id) => releaseRoomNights(input.restaurantId, id))).catch(() => {});
      await Reservation.deleteMany({ _id: { $in: created } }).catch(() => {});
    }
    throw error;
  }
}
