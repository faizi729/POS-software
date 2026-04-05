import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const inventoryLogSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    ingredientId: { type: Schema.Types.ObjectId, ref: "Ingredient", required: true, index: true },
    type: {
      type: String,
      enum: ["deduction", "restock", "adjustment", "wastage"],
      required: true
    },
    quantity: { type: Number, required: true }, // negative for deductions
    previousStock: { type: Number, required: true, min: 0 },
    newStock: { type: Number, required: true, min: 0 },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    reason: { type: String, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

inventoryLogSchema.index({ restaurantId: 1, createdAt: -1 });
inventoryLogSchema.index({ restaurantId: 1, ingredientId: 1, createdAt: -1 });
inventoryLogSchema.index({ restaurantId: 1, type: 1, createdAt: -1 });

export type InventoryLogDocument = InferSchemaType<typeof inventoryLogSchema>;
export const InventoryLog: Model<InventoryLogDocument> =
  models.InventoryLog || model("InventoryLog", inventoryLogSchema);
