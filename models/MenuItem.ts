import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const menuItemSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    menuId: { type: Schema.Types.ObjectId, ref: "Menu", index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "MenuCategory", required: true, index: true },
    subcategoryId: { type: Schema.Types.ObjectId, ref: "MenuCategory", index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, sparse: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    itemType: {
      type: String,
      enum: ["standard", "combo"],
      default: "standard"
    },
    dietary: {
      type: String,
      enum: ["veg", "non_veg", "vegan", "egg", "none"],
      default: "none"
    },
    pricingMode: {
      type: String,
      enum: ["base", "variant"],
      default: "base"
    },
    price: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    prepTimeMinutes: { type: Number, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    autoDisableOnOutOfStock: { type: Boolean, default: false },
    dayParts: [{ type: String }],
    channels: [{ type: String }],
    outletIds: [{ type: String }],
    tags: [{ type: String }],
    prepStation: { type: String, trim: true },
    metadata: {
      bestSellerScore: { type: Number, default: 0 },
      lowPerformerScore: { type: Number, default: 0 },
      suggestedComboScore: { type: Number, default: 0 }
    },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurantId: 1, categoryId: 1, isActive: 1 });
menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
menuItemSchema.index({ restaurantId: 1, name: 1 });
menuItemSchema.index({ restaurantId: 1, sku: 1 }, { unique: true, sparse: true });
menuItemSchema.index({ restaurantId: 1, menuId: 1, categoryId: 1, subcategoryId: 1 });

export type MenuItemDocument = InferSchemaType<typeof menuItemSchema>;
export const MenuItem: Model<MenuItemDocument> =
  models.MenuItem || model("MenuItem", menuItemSchema);
