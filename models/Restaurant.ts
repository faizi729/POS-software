import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // slug is the legacy tenant key used across the app; keep it as unique tenant identifier.
    // In multi-tenant mode, this maps 1:1 with `subdomain` (unless you decide otherwise).
    slug: { type: String, required: true, trim: true },
    // Multi-tenant domain routing
    subdomain: { type: String, trim: true, lowercase: true }, // indexed below (sparse unique)
    customDomain: { type: String, trim: true, lowercase: true }, // indexed below (sparse unique)
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
    /** SaaS tier for limits + billing; `none` until you assign a tier or create a Razorpay subscription. */
    plan: { type: String, enum: ["none", "starter", "growth", "scale"], default: "none", index: true },
    /** Billing lifecycle (independent of operational suspend). */
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "past_due", "suspended", "churned"],
      default: "active",
      index: true
    },
    trialEndsAt: { type: Date },
    billingEmail: { type: String, trim: true, lowercase: true },
    /** Razorpay Subscriptions (platform SaaS billing) — set via Super Admin or webhooks. */
    razorpayCustomerId: { type: String, trim: true, sparse: true, index: true },
    razorpaySubscriptionId: { type: String, trim: true, sparse: true, index: true },
    /** Matches Razorpay plan period (monthly vs yearly SaaS plan). */
    saasBillingInterval: { type: String, enum: ["monthly", "yearly"], sparse: true },
    notesInternal: { type: String, trim: true, default: "" },
    features: {
      websiteSync: { type: Boolean, default: true },
      aiFeatures: { type: Boolean, default: false },
      whatsappOrdering: { type: Boolean, default: true },
      qrOrdering: { type: Boolean, default: true }
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
restaurantSchema.index({ subscriptionStatus: 1, status: 1 });
restaurantSchema.index({ createdAt: -1, status: 1, plan: 1 });
restaurantSchema.index({ slug: 1 }, { unique: true });
restaurantSchema.index({ subdomain: 1 }, { unique: true, sparse: true });
restaurantSchema.index({ customDomain: 1 }, { unique: true, sparse: true });
restaurantSchema.index({ name: 1 });

export type RestaurantDocument = InferSchemaType<typeof restaurantSchema>;
export const Restaurant: Model<RestaurantDocument> =
  models.Restaurant || model("Restaurant", restaurantSchema);
