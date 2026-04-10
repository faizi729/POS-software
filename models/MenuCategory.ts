import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const menuCategorySchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    menuId: { type: Schema.Types.ObjectId, ref: "Menu", index: true },
    parentId: { type: Schema.Types.ObjectId, ref: "MenuCategory", index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    nodeType: {
      type: String,
      enum: ["category", "subcategory"],
      default: "category"
    },
    level: { type: Number, default: 0 },
    path: [{ type: String }],
    channels: [{ type: String }],
    dayParts: [{ type: String }],
    outletIds: [{ type: String }],
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

menuCategorySchema.index({ restaurantId: 1, sortOrder: 1 });
// Slug uniqueness rules:
// - Builder categories (scoped to a menu tree): unique within (restaurantId, menuId, parentId, slug)
// - POS root/subcategories (no menuId): unique within (restaurantId, parentId, slug)
//
// IMPORTANT: do NOT use a sparse index for the builder uniqueness, otherwise documents where menuId is missing
// can bypass uniqueness and create duplicates.
menuCategorySchema.index({ restaurantId: 1, menuId: 1, parentId: 1, slug: 1 }, { unique: true });
menuCategorySchema.index(
  { restaurantId: 1, parentId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { menuId: { $exists: false } } }
);
menuCategorySchema.index({ restaurantId: 1, menuId: 1, parentId: 1, sortOrder: 1 });

export type MenuCategoryDocument = InferSchemaType<typeof menuCategorySchema>;
export const MenuCategory: Model<MenuCategoryDocument> =
  models.MenuCategory || model("MenuCategory", menuCategorySchema);
