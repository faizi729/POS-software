import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const customerSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    totalVisits: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    lastVisitAt: { type: Date },
    firstVisitAt: { type: Date },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    /** Hotel guest ID document (optional; same record doubles as CRM customer). */
    idType: { type: String, trim: true },
    idNumber: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

/** Phone is optional (hotel walk-ins may not share one); unique only when present. */
customerSchema.index(
  { restaurantId: 1, phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: "string" } } }
);
customerSchema.index({ restaurantId: 1, name: 1 });
customerSchema.index({ restaurantId: 1, loyaltyPoints: -1 });
customerSchema.index({ restaurantId: 1, totalSpent: -1 });
customerSchema.index({ restaurantId: 1, lastVisitAt: -1 });

export type CustomerDocument = InferSchemaType<typeof customerSchema>;
export const Customer: Model<CustomerDocument> =
  models.Customer || model("Customer", customerSchema);
