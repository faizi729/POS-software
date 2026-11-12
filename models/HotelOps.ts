import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import { MAINTENANCE_STATUSES, MEAL_PLANS } from "@/lib/constants/roles";

export { MEAL_PLANS, MAINTENANCE_STATUSES };

/**
 * Date-ranged, weekday-aware tariff. The most specific matching plan wins
 * (room type match > priority > later dateFrom). Amounts are integer paise.
 */
const ratePlanSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    /** null → applies to every room type. */
    roomTypeId: { type: Schema.Types.ObjectId, ref: "RoomType", index: true },
    dateFrom: Date,
    dateTo: Date,
    /** 0 = Sunday … 6 = Saturday. Empty → all days. */
    weekdays: [{ type: Number, min: 0, max: 6 }],
    baseRatePaise: { type: Number, required: true, min: 0 },
    extraAdultPaise: { type: Number, default: 0, min: 0 },
    childPaise: { type: Number, default: 0, min: 0 },
    includedAdults: { type: Number, default: 2, min: 1 },
    includedChildren: { type: Number, default: 0, min: 0 },
    mealPlan: { type: String, enum: MEAL_PLANS, default: "EP" },
    mealPlanPaise: { type: Number, default: 0, min: 0 },
    discountCode: { type: String, trim: true, uppercase: true },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    minNights: { type: Number, default: 1, min: 1 },
    /** Higher wins when several plans match. */
    priority: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

ratePlanSchema.index({ restaurantId: 1, roomTypeId: 1, dateFrom: 1 });
ratePlanSchema.index(
  { restaurantId: 1, discountCode: 1 },
  { unique: true, partialFilterExpression: { discountCode: { $type: "string" } } }
);

export type RatePlanDocument = InferSchemaType<typeof ratePlanSchema>;
export const RatePlan: Model<RatePlanDocument> = models.RatePlan || model("RatePlan", ratePlanSchema);

const maintenanceTicketSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: MAINTENANCE_STATUSES, default: "open", index: true },
    assignee: { type: String, trim: true },
    resolution: { type: String, trim: true },
    openedBy: { type: Schema.Types.ObjectId, ref: "User" },
    closedAt: Date
  },
  { timestamps: true }
);

maintenanceTicketSchema.index({ restaurantId: 1, roomId: 1, status: 1 });

export type MaintenanceTicketDocument = InferSchemaType<typeof maintenanceTicketSchema>;
export const MaintenanceTicket: Model<MaintenanceTicketDocument> =
  models.MaintenanceTicket || model("MaintenanceTicket", maintenanceTicketSchema);

/** Closed business date with locked totals (night audit). */
const businessDateSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["open", "closed"], default: "closed" },
    closedAt: Date,
    closedBy: { type: Schema.Types.ObjectId, ref: "User" },
    totals: {
      roomPaise: { type: Number, default: 0 },
      fnbPaise: { type: Number, default: 0 },
      extraPaise: { type: Number, default: 0 },
      taxPaise: { type: Number, default: 0 },
      collectedPaise: { type: Number, default: 0 },
      refundedPaise: { type: Number, default: 0 },
      banquetPaise: { type: Number, default: 0 }
    },
    /** Cash per user for the shift handover. */
    cashByUser: [
      {
        _id: false,
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        name: String,
        cashPaise: { type: Number, default: 0 }
      }
    ],
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

businessDateSchema.index({ restaurantId: 1, date: 1 }, { unique: true });

export type BusinessDateDocument = InferSchemaType<typeof businessDateSchema>;
export const BusinessDate: Model<BusinessDateDocument> =
  models.BusinessDate || model("BusinessDate", businessDateSchema);
