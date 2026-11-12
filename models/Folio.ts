import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import { FOLIO_CHARGE_TYPES, FOLIO_STATUSES } from "@/lib/constants/roles";

const folioSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation", required: true, index: true },
    status: { type: String, enum: FOLIO_STATUSES, default: "open", index: true },
    /** Sequential invoice, assigned once at checkout. */
    invoiceNumber: { type: String, trim: true },
    invoiceIssuedAt: Date,
    settledAt: Date
  },
  { timestamps: true }
);

folioSchema.index({ restaurantId: 1, reservationId: 1 }, { unique: true });
folioSchema.index(
  { restaurantId: 1, invoiceNumber: 1 },
  { unique: true, partialFilterExpression: { invoiceNumber: { $type: "string" } } }
);

export type FolioDocument = InferSchemaType<typeof folioSchema>;
export const Folio: Model<FolioDocument> = models.Folio || model("Folio", folioSchema);

const folioChargeSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    folioId: { type: Schema.Types.ObjectId, ref: "Folio", required: true, index: true },
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation", required: true, index: true },
    type: { type: String, enum: FOLIO_CHARGE_TYPES, required: true, index: true },
    /** Charge amount in paise (integer). */
    amountPaise: { type: Number, required: true, min: 0 },
    /** GST actually applied to this charge, in paise. */
    taxPaise: { type: Number, default: 0, min: 0 },
    /** GST percent used (per-night slab for room charges). */
    taxPercent: { type: Number, default: 0, min: 0, max: 28 },
    description: { type: String, trim: true },
    /** Night this room charge covers (room charges only). */
    stayDate: Date,
    /** `${reservationId}:${yyyy-mm-dd}` — idempotency key inside a folio. */
    nightKey: { type: String, trim: true },
    /** Set when the charge came from a POS order. */
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    postedAt: { type: Date, default: Date.now, index: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

folioChargeSchema.index({ restaurantId: 1, folioId: 1, postedAt: 1 });
folioChargeSchema.index({ restaurantId: 1, reservationId: 1 });
folioChargeSchema.index(
  { restaurantId: 1, folioId: 1, nightKey: 1 },
  { unique: true, partialFilterExpression: { nightKey: { $type: "string" } } }
);

export type FolioChargeDocument = InferSchemaType<typeof folioChargeSchema>;
export const FolioCharge: Model<FolioChargeDocument> =
  models.FolioCharge || model("FolioCharge", folioChargeSchema);
