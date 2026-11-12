import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import { ROOM_STATUSES } from "@/lib/constants/roles";

const roomTypeSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    baseRate: { type: Number, required: true, min: 0 },
    maxOccupancy: { type: Number, default: 2, min: 1 },
    amenities: [{ type: String, trim: true }],
    gstPercent: { type: Number, default: 12, min: 0, max: 28 }
  },
  { timestamps: true }
);

roomTypeSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export type RoomTypeDocument = InferSchemaType<typeof roomTypeSchema>;
export const RoomType: Model<RoomTypeDocument> = models.RoomType || model("RoomType", roomTypeSchema);

const roomSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    number: { type: String, required: true, trim: true },
    floor: { type: Number, default: 1, min: 0 },
    roomTypeId: { type: Schema.Types.ObjectId, ref: "RoomType", required: true, index: true },
    status: { type: String, enum: ROOM_STATUSES, default: "available", index: true }
  },
  { timestamps: true }
);

roomSchema.index({ restaurantId: 1, number: 1 }, { unique: true });
roomSchema.index({ restaurantId: 1, status: 1 });

export type RoomDocument = InferSchemaType<typeof roomSchema>;
export const Room: Model<RoomDocument> = models.Room || model("Room", roomSchema);
