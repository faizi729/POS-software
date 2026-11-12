import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import { HOUSEKEEPING_STATUSES } from "@/lib/constants/roles";

const housekeepingTaskSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    status: { type: String, enum: HOUSEKEEPING_STATUSES, default: "pending", index: true },
    assignee: { type: String, trim: true },
    note: { type: String, trim: true },
    completedAt: Date
  },
  { timestamps: true }
);

housekeepingTaskSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
housekeepingTaskSchema.index({ restaurantId: 1, roomId: 1, createdAt: -1 });

export type HousekeepingTaskDocument = InferSchemaType<typeof housekeepingTaskSchema>;
export const HousekeepingTask: Model<HousekeepingTaskDocument> =
  models.HousekeepingTask || model("HousekeepingTask", housekeepingTaskSchema);
