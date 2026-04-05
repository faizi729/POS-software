import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const paymentSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["cash", "card", "upi", "wallet"], required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed"
    },
    reference: { type: String, trim: true },
    receivedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paidAt: Date
  },
  { timestamps: true }
);

paymentSchema.index({ restaurantId: 1, orderId: 1 });
paymentSchema.index({ restaurantId: 1, paidAt: -1 });
paymentSchema.index({ restaurantId: 1, method: 1, paidAt: -1 });

export type PaymentDocument = InferSchemaType<typeof paymentSchema>;
export const Payment: Model<PaymentDocument> =
  models.Payment || model("Payment", paymentSchema);
