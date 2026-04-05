import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    timezone: { type: String, required: true },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    settings: {
      taxMode: { type: String, enum: ["inclusive", "exclusive"], default: "exclusive" },
      gstEnabled: { type: Boolean, default: true },
      gstRatePercent: { type: Number, min: 0, max: 28, default: 5 },
      gstin: { type: String, trim: true },
      serviceChargeEnabled: { type: Boolean, default: false },
      orderPrefix: { type: String, default: "POS" },
      defaultPaymentMethods: [{ type: String, enum: ["cash", "card", "upi", "wallet"] }]
    },
    contact: {
      phone: String,
      email: String,
      address: String
    },
    onboarding: {
      menuImported: { type: Boolean, default: false },
      receiptTemplateSaved: { type: Boolean, default: false },
      completedAt: Date
    }
  },
  { timestamps: true }
);
restaurantSchema.index({ status: 1 });

export type RestaurantDocument = InferSchemaType<typeof restaurantSchema>;
export const Restaurant: Model<RestaurantDocument> =
  models.Restaurant || model("Restaurant", restaurantSchema);
