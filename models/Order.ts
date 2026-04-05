import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const orderItemSchema = new Schema(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    nameSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String, trim: true },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: true }
);

const orderSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    orderNumber: { type: String, required: true },
    channel: { type: String, enum: ["pos", "web", "whatsapp"], default: "pos" },
    type: { type: String, enum: ["dine_in", "takeaway"], default: "dine_in" },
    status: {
      type: String,
      enum: ["draft", "placed", "preparing", "ready", "completed", "cancelled"],
      default: "draft"
    },
    tableNo: { type: String, trim: true },
    customer: {
      name: String,
      phone: String
    },
    items: [orderItemSchema],
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      tax: { type: Number, required: true, min: 0 },
      serviceCharge: { type: Number, required: true, min: 0 },
      discount: { type: Number, required: true, min: 0 },
      grandTotal: { type: Number, required: true, min: 0 }
    },
    tokenNumber: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid"
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paidAt: Date,
    completedAt: Date
  },
  { timestamps: true }
);

orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ restaurantId: 1, paymentStatus: 1, createdAt: -1 });

export type OrderDocument = InferSchemaType<typeof orderSchema>;
export const Order: Model<OrderDocument> = models.Order || model("Order", orderSchema);
