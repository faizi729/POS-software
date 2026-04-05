import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const inventoryMappingSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true, index: true },
    variantId: { type: Schema.Types.ObjectId, ref: "ItemVariant", index: true },
    ingredientName: { type: String, required: true, trim: true },
    stockUnit: { type: String, required: true, trim: true },
    quantityRequired: { type: Number, required: true, min: 0 },
    wasteFactor: { type: Number, default: 0, min: 0 },
    reorderThreshold: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

inventoryMappingSchema.index({ restaurantId: 1, itemId: 1, ingredientName: 1 });

export type InventoryMappingDocument = InferSchemaType<typeof inventoryMappingSchema>;
export const InventoryMapping: Model<InventoryMappingDocument> =
  models.InventoryMapping || model("InventoryMapping", inventoryMappingSchema);
