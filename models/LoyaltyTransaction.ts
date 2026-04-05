import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const loyaltyTransactionSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    type: {
      type: String,
      enum: ["earn", "redeem", "adjust", "expire"],
      required: true
    },
    points: { type: Number, required: true }, // positive for earn, negative for redeem
    balance: { type: Number, required: true, min: 0 }, // balance after this transaction
    description: { type: String, trim: true }
  },
  { timestamps: true }
);

loyaltyTransactionSchema.index({ restaurantId: 1, customerId: 1, createdAt: -1 });
loyaltyTransactionSchema.index({ restaurantId: 1, type: 1, createdAt: -1 });

export type LoyaltyTransactionDocument = InferSchemaType<typeof loyaltyTransactionSchema>;
export const LoyaltyTransaction: Model<LoyaltyTransactionDocument> =
  models.LoyaltyTransaction || model("LoyaltyTransaction", loyaltyTransactionSchema);
