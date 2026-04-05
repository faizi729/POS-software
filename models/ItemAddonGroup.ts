import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const itemAddonGroupSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true, index: true },
    name: { type: String, required: true, trim: true },
    selectionType: {
      type: String,
      enum: ["single", "multi"],
      default: "multi"
    },
    minSelect: { type: Number, default: 0, min: 0 },
    maxSelect: { type: Number, default: 1, min: 1 },
    required: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

itemAddonGroupSchema.index({ restaurantId: 1, itemId: 1, sortOrder: 1 });

export type ItemAddonGroupDocument = InferSchemaType<typeof itemAddonGroupSchema>;
export const ItemAddonGroup: Model<ItemAddonGroupDocument> =
  models.ItemAddonGroup || model("ItemAddonGroup", itemAddonGroupSchema);
