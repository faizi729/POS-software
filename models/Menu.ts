import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const menuSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    channels: [{ type: String }],
    outletIds: [{ type: String }],
    dayParts: [{ type: String }],
    serviceModes: [{ type: String }],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

menuSchema.index({ restaurantId: 1, slug: 1 }, { unique: true });
menuSchema.index({ restaurantId: 1, isActive: 1, sortOrder: 1 });

export type MenuDocument = InferSchemaType<typeof menuSchema>;
export const Menu: Model<MenuDocument> = models.Menu || model("Menu", menuSchema);
