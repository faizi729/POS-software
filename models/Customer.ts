import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const customerSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    totalVisits: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    lastVisitAt: { type: Date },
    firstVisitAt: { type: Date },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

customerSchema.index({ restaurantId: 1, phone: 1 }, { unique: true });
customerSchema.index({ restaurantId: 1, name: 1 });
customerSchema.index({ restaurantId: 1, loyaltyPoints: -1 });
customerSchema.index({ restaurantId: 1, totalSpent: -1 });
customerSchema.index({ restaurantId: 1, lastVisitAt: -1 });

export type CustomerDocument = InferSchemaType<typeof customerSchema>;
export const Customer: Model<CustomerDocument> =
  models.Customer || model("Customer", customerSchema);
