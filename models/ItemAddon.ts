import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const itemAddonSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true, index: true },
    addonGroupId: {
      type: Schema.Types.ObjectId,
      ref: "ItemAddonGroup",
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

itemAddonSchema.index({ restaurantId: 1, itemId: 1, addonGroupId: 1, sortOrder: 1 });

export type ItemAddonDocument = InferSchemaType<typeof itemAddonSchema>;
export const ItemAddon: Model<ItemAddonDocument> =
  models.ItemAddon || model("ItemAddon", itemAddonSchema);
