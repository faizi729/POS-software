import { InferSchemaType, Model, Schema, model, models } from "mongoose";
import crypto from "node:crypto";

const menuItemSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    menuId: { type: Schema.Types.ObjectId, ref: "Menu", index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "MenuCategory", required: true, index: true },
    subcategoryId: { type: Schema.Types.ObjectId, ref: "MenuCategory", index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, lowercase: true, default: undefined },
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
// Ensure uniqueness only when a non-empty SKU string is present
menuItemSchema.index(
  { restaurantId: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sku: { $exists: true, $type: "string", $ne: "" }
    }
  }
);
menuItemSchema.index({ restaurantId: 1, menuId: 1, categoryId: 1, subcategoryId: 1 });

function generateSku(): string {
  const rand = crypto.randomBytes(6).toString("base64url").slice(0, 8);
  return `item-${rand}`;
}

menuItemSchema.pre("save", async function (next) {
  // @ts-ignore
  if (this.sku == null || this.sku === "") {
    // @ts-ignore
    this.sku = undefined;
  }
  // @ts-ignore
  if (!this.sku) {
    for (let i = 0; i < 3; i++) {
      const candidate = generateSku();
      // @ts-ignore
      const exists = await (this.constructor as Model<any>).exists({
        restaurantId: this.restaurantId,
        sku: candidate
      });
      if (!exists) {
        // @ts-ignore
        this.sku = candidate;
        break;
      }
    }
  }
  next();
});

menuItemSchema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function (next) {
  const update: any = this.getUpdate() || {};

  if (update.$set && Object.prototype.hasOwnProperty.call(update.$set, "sku")) {
    const val = update.$set.sku;
    if (val == null || val === "") {
      delete update.$set.sku;
      update.$unset = { ...(update.$unset || {}), sku: "" };
    } else {
      update.$set.sku = String(val).trim().toLowerCase();
    }
  }

  if (Object.prototype.hasOwnProperty.call(update, "sku")) {
    const val = update.sku;
    delete update.sku;
    if (val == null || val === "") {
      update.$unset = { ...(update.$unset || {}), sku: "" };
    } else {
      update.$set = { ...(update.$set || {}), sku: String(val).trim().toLowerCase() };
    }
  }

  const opts: any = (this as any).getOptions?.() || {};
  if (opts.upsert) {
    const willUnsetSku = Boolean(update.$unset && Object.prototype.hasOwnProperty.call(update.$unset, "sku"));
    const willSetSku =
      Boolean(update.$set && Object.prototype.hasOwnProperty.call(update.$set, "sku")) ||
      Boolean(update.$setOnInsert && Object.prototype.hasOwnProperty.call(update.$setOnInsert, "sku"));
    if (!willUnsetSku && !willSetSku) {
      update.$setOnInsert = { ...(update.$setOnInsert || {}), sku: generateSku() };
    }
  }

  this.setUpdate(update);
  next();
});

export type MenuItemDocument = InferSchemaType<typeof menuItemSchema>;
export const MenuItem: Model<MenuItemDocument> =
  models.MenuItem || model("MenuItem", menuItemSchema);