import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import { RESERVATION_SOURCES, RESERVATION_STATUSES } from "@/lib/constants/roles";

const reservationSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    guestId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    /** UTC midnight of the property-local date. Stay is [checkIn, checkOut). */
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true },
    status: { type: String, enum: RESERVATION_STATUSES, default: "tentative", index: true },
    source: { type: String, enum: RESERVATION_SOURCES, default: "walk_in" },
    advancePaid: { type: Number, default: 0, min: 0 },
    /** Tentative holds expire automatically once passed. */
    holdExpiresAt: Date,
    rateSnapshot: { type: Number, default: 0, min: 0 },
    gstPercentSnapshot: { type: Number, default: 12, min: 0, max: 28 },
    /** Guests on the booking (drives extra-person pricing). */
    adults: { type: Number, default: 2, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    ratePlanId: { type: Schema.Types.ObjectId, ref: "RatePlan" },
    discountCode: { type: String, trim: true, uppercase: true },
    /** Multi-room / group booking: all rooms share this id. */
    groupId: { type: String, trim: true, index: true },
    /** Group bookings with one bill: every room's charges post to this reservation's folio. */
    folioReservationId: { type: Schema.Types.ObjectId, ref: "Reservation", index: true },
    /** Public/online booking payment trail (Razorpay). */
    onlineOrderId: { type: String, trim: true },
    onlinePaymentId: { type: String, trim: true },
    onlineAmountPaise: { type: Number, default: 0, min: 0 },
    cancelledAt: Date,
    cancellationFeePaise: { type: Number, default: 0, min: 0 },
    refundedPaise: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    checkedInAt: Date,
    checkedOutAt: Date
  },
  { timestamps: true }
);

reservationSchema.index({ restaurantId: 1, roomId: 1, checkIn: 1, checkOut: 1 });
reservationSchema.index({ restaurantId: 1, status: 1, checkIn: 1 });

export type ReservationDocument = InferSchemaType<typeof reservationSchema>;
export const Reservation: Model<ReservationDocument> =
  models.Reservation || model("Reservation", reservationSchema);
