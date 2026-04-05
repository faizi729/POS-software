import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const comboSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true, index: true },
    name: { type: String, required: true, trim: true },
    comboType: {
      type: String,
      enum: ["fixed", "customizable"],
      default: "fixed"
    },
    discountedPrice: { type: Number, min: 0 },
    upsellTargetItemIds: [{ type: Schema.Types.ObjectId, ref: "MenuItem" }],
    components: [
      {
        slotName: { type: String, required: true, trim: true },
        itemIds: [{ type: Schema.Types.ObjectId, ref: "MenuItem" }],
        minSelect: { type: Number, default: 1, min: 0 },
        maxSelect: { type: Number, default: 1, min: 1 }
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

comboSchema.index({ restaurantId: 1, itemId: 1 });

export type ComboDocument = InferSchemaType<typeof comboSchema>;
export const Combo: Model<ComboDocument> = models.Combo || model("Combo", comboSchema);
