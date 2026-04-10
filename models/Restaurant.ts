import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // slug is the legacy tenant key used across the app; keep it as unique tenant identifier.
    // In multi-tenant mode, this maps 1:1 with `subdomain` (unless you decide otherwise).
    slug: { type: String, required: true, trim: true },
    // Multi-tenant domain routing
    subdomain: { type: String, trim: true, lowercase: true, index: true }, // e.g. "restaurant1"
    customDomain: { type: String, trim: true, lowercase: true, index: true }, // e.g. "www.restaurant.com"
    // Branding
    logoUrl: { type: String, trim: true, default: "" },
    theme: {
      primary: { type: String, trim: true, default: "" },
      accent: { type: String, trim: true, default: "" },
      background: { type: String, trim: true, default: "" },
      text: { type: String, trim: true, default: "" },
      font: { type: String, trim: true, default: "" }
    },
    // Owner (tenant admin) - optional for now to avoid circular creation flows during onboarding/seed
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    timezone: { type: String, required: true },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    plan: { type: String, enum: ["starter", "growth", "scale"], default: "growth", index: true },
    features: {
      websiteSync: { type: Boolean, default: true },
      aiFeatures: { type: Boolean, default: false }
    },
    settings: {
      taxMode: { type: String, enum: ["inclusive", "exclusive"], default: "exclusive" },
      gstEnabled: { type: Boolean, default: true },
      gstRatePercent: { type: Number, min: 0, max: 28, default: 5 },
      gstin: { type: String, trim: true },
      serviceChargeEnabled: { type: Boolean, default: false },
      orderPrefix: { type: String, default: "POS" },
      defaultPaymentMethods: [{ type: String, enum: ["cash", "card", "upi", "wallet"] }],
      openingTime: { type: String, trim: true, default: "09:00" }, // HH:mm
      closingTime: { type: String, trim: true, default: "23:00" }, // HH:mm
      whatsapp: {
        token: { type: String, trim: true, default: "" },
        phoneNumberId: { type: String, trim: true, default: "" },
        verifyToken: { type: String, trim: true, default: "" },
        catalogId: { type: String, trim: true, default: "" }
      }
    },
    integrations: {
      whatsapp: {
        token: { type: String, trim: true, default: "" },
        phoneNumberId: { type: String, trim: true, default: "" },
        verifyToken: { type: String, trim: true, default: "" },
        catalogId: { type: String, trim: true, default: "" }
      }
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
restaurantSchema.index({ plan: 1, status: 1 });
restaurantSchema.index({ createdAt: -1, status: 1, plan: 1 });
restaurantSchema.index({ slug: 1 }, { unique: true });
restaurantSchema.index({ subdomain: 1 }, { unique: true, sparse: true });
restaurantSchema.index({ customDomain: 1 }, { unique: true, sparse: true });
restaurantSchema.index({ name: 1 });

export type RestaurantDocument = InferSchemaType<typeof restaurantSchema>;
export const Restaurant: Model<RestaurantDocument> =
  models.Restaurant || model("Restaurant", restaurantSchema);
