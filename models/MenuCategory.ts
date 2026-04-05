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
// Ensure slugs are unique within a menu/branch, not globally across the restaurant
// Using a composite unique index scoped to menuId and parentId allows the same slug
// to exist in different menus or different branches under the same menu.
menuCategorySchema.index(
	{ restaurantId: 1, menuId: 1, parentId: 1, slug: 1 },
	{ unique: true, sparse: true }
);
menuCategorySchema.index({ restaurantId: 1, menuId: 1, parentId: 1, sortOrder: 1 });

export type MenuCategoryDocument = InferSchemaType<typeof menuCategorySchema>;
export const MenuCategory: Model<MenuCategoryDocument> =
  models.MenuCategory || model("MenuCategory", menuCategorySchema);
