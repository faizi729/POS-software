import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const itemVariantSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true, index: true },
    groupName: { type: String, required: true, trim: true },
    optionName: { type: String, required: true, trim: true },
    variantType: {
      type: String,
      enum: ["size", "quantity", "custom"],
      default: "custom"
    },
    priceDelta: { type: Number, default: 0 },
    absolutePrice: { type: Number, min: 0 },
    sku: { type: String, trim: true },
    prepTimeOverride: { type: Number, min: 0 },
    sortOrder: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

itemVariantSchema.index({ restaurantId: 1, itemId: 1, groupName: 1, sortOrder: 1 });

export type ItemVariantDocument = InferSchemaType<typeof itemVariantSchema>;
export const ItemVariant: Model<ItemVariantDocument> =
  models.ItemVariant || model("ItemVariant", itemVariantSchema);
