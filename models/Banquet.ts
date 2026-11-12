import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import { BANQUET_STATUSES, BOOKING_SLOTS } from "@/lib/constants/roles";

const hallSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    baseRate: { type: Number, default: 0, min: 0 },
    setupTypes: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

hallSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export type HallDocument = InferSchemaType<typeof hallSchema>;
export const Hall: Model<HallDocument> = models.Hall || model("Hall", hallSchema);

const packageItemSchema = new Schema(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    nameSnapshot: { type: String, required: true, trim: true },
    pricePerPlatePaise: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const addOnSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    amountPaise: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const banquetBookingSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    hallId: { type: Schema.Types.ObjectId, ref: "Hall", required: true, index: true },
    /** UTC midnight of the property-local event date. */
    date: { type: Date, required: true, index: true },
    slot: { type: String, enum: BOOKING_SLOTS, required: true },
    eventType: { type: String, trim: true },
    guestName: { type: String, trim: true },
    guestPhone: { type: String, trim: true },
    guestCount: { type: Number, required: true, min: 1 },
    menuPackage: {
      items: [packageItemSchema],
      perPlatePaise: { type: Number, default: 0, min: 0 }
    },
    /** Decor, DJ, extra rooms… */
    addOns: [addOnSchema],
    status: { type: String, enum: BANQUET_STATUSES, default: "tentative", index: true },
    hallRatePaise: { type: Number, default: 0, min: 0 },
    subtotalPaise: { type: Number, default: 0, min: 0 },
    gstPercent: { type: Number, default: 18, min: 0, max: 28 },
    gstPaise: { type: Number, default: 0, min: 0 },
    totalAmountPaise: { type: Number, default: 0, min: 0 },
    /** Cached from HotelPayment for list views; the ledger is the source of truth. */
    advancePaidPaise: { type: Number, default: 0, min: 0 },
    invoiceNumber: { type: String, trim: true },
    invoiceIssuedAt: Date,
    cancellationFeePaise: { type: Number, default: 0, min: 0 },
    refundedPaise: { type: Number, default: 0, min: 0 },
    holdExpiresAt: Date,
    /** Run sheet */
    setupType: { type: String, trim: true },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    staffNotes: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

banquetBookingSchema.index({ restaurantId: 1, hallId: 1, date: 1 });
banquetBookingSchema.index({ restaurantId: 1, status: 1, date: 1 });
banquetBookingSchema.index(
  { restaurantId: 1, invoiceNumber: 1 },
  { unique: true, partialFilterExpression: { invoiceNumber: { $type: "string" } } }
);

export type BanquetBookingDocument = InferSchemaType<typeof banquetBookingSchema>;
export const BanquetBooking: Model<BanquetBookingDocument> =
  models.BanquetBooking || model("BanquetBooking", banquetBookingSchema);
