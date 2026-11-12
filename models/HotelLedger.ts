import { InferSchemaType, Model, Schema, model, models } from "mongoose";

/**
 * Inventory: one row per room per night. The unique index is the authoritative
 * double-booking guard — availability reads (`isRoomAvailable`) are advisory.
 */
const roomNightSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    /** UTC midnight of the night. */
    date: { type: Date, required: true },
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation", required: true, index: true },
    /** Tariff for this specific night, in paise (rate-plan snapshot). */
    ratePaise: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

roomNightSchema.index({ restaurantId: 1, roomId: 1, date: 1 }, { unique: true });
roomNightSchema.index({ restaurantId: 1, date: 1 });

export type RoomNightDocument = InferSchemaType<typeof roomNightSchema>;
export const RoomNight: Model<RoomNightDocument> =
  models.RoomNight || model("RoomNight", roomNightSchema);

/** Hall inventory: one row per occupied slot (full_day occupies morning + evening). */
const hallSlotSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    hallId: { type: Schema.Types.ObjectId, ref: "Hall", required: true, index: true },
    date: { type: Date, required: true },
    slot: { type: String, enum: ["morning", "evening"], required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "BanquetBooking", required: true, index: true }
  },
  { timestamps: true }
);

hallSlotSchema.index({ restaurantId: 1, hallId: 1, date: 1, slot: 1 }, { unique: true });

export type HallSlotDocument = InferSchemaType<typeof hallSlotSchema>;
export const HallSlot: Model<HallSlotDocument> = models.HallSlot || model("HallSlot", hallSlotSchema);

/** Money ledger for hotel + banquet. Amounts are integer paise. */
const hotelPaymentSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation", index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "BanquetBooking", index: true },
    amountPaise: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["cash", "card", "upi", "wallet", "bank", "razorpay"],
      required: true
    },
    type: { type: String, enum: ["advance", "payment", "refund"], required: true, index: true },
    reference: { type: String, trim: true },
    notes: { type: String, trim: true },
    /** Idempotency key for provider callbacks (Razorpay event id, etc.). */
    idempotencyKey: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    paidAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

hotelPaymentSchema.index({ restaurantId: 1, reservationId: 1, paidAt: 1 });
hotelPaymentSchema.index({ restaurantId: 1, bookingId: 1, paidAt: 1 });
hotelPaymentSchema.index(
  { restaurantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

export type HotelPaymentDocument = InferSchemaType<typeof hotelPaymentSchema>;
export const HotelPayment: Model<HotelPaymentDocument> =
  models.HotelPayment || model("HotelPayment", hotelPaymentSchema);

/** Atomic per-tenant, per-financial-year invoice sequence. */
const invoiceCounterSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    scope: { type: String, enum: ["hotel", "banquet"], required: true },
    fy: { type: String, required: true },
    seq: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

invoiceCounterSchema.index({ restaurantId: 1, scope: 1, fy: 1 }, { unique: true });

export type InvoiceCounterDocument = InferSchemaType<typeof invoiceCounterSchema>;
export const InvoiceCounter: Model<InvoiceCounterDocument> =
  models.InvoiceCounter || model("InvoiceCounter", invoiceCounterSchema);
