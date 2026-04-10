import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const tableSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    number: { type: String, required: true, trim: true },
    label: { type: String, trim: true },
    capacity: { type: Number, default: 4, min: 1 },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning"],
      default: "available"
    },
    section: { type: String, trim: true },
    currentOrderId: { type: Schema.Types.ObjectId, ref: "Order" },
    position: {
      x: { type: Number },
      y: { type: Number }
    }
  },
  { timestamps: true }
);

tableSchema.index({ restaurantId: 1, number: 1 }, { unique: true });
tableSchema.index({ restaurantId: 1, status: 1, updatedAt: -1 });

export type TableDocument = InferSchemaType<typeof tableSchema>;
export const Table: Model<TableDocument> = models.Table || model("Table", tableSchema);
