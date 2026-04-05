import { InferSchemaType, Model, Schema, model, models } from "mongoose";

/**
 * WhatsApp session state machine.
 * One document per phone number per restaurant — tracks the entire
 * conversation state, cart, and checkout progress.
 */

const cartItemSchema = new Schema(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const waSessionSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    phone: { type: String, required: true, trim: true },

    /* ── State machine ── */
    state: {
      type: String,
      enum: [
        "START",
        "BROWSING",
        "ITEM_SELECTED",
        "ADDING_QUANTITY",
        "CART_VIEW",
        "CHECKOUT_NAME",
        "CHECKOUT_ADDRESS",
        "PAYMENT_PENDING",
        "ORDER_CONFIRMED"
      ],
      default: "START"
    },

    /* ── Cart ── */
    cart: {
      items: { type: [cartItemSchema], default: [] },
      total: { type: Number, default: 0, min: 0 }
    },

    /* ── Context fields for multi-step flows ── */
    selectedItemId: { type: String },
    selectedCategoryId: { type: String },

    /* ── Checkout info ── */
    customerName: { type: String, trim: true },
    customerAddress: { type: String, trim: true },
    orderType: { type: String, enum: ["dine_in", "takeaway"], default: "takeaway" },

    /* ── Payment ── */
    paymentStatus: {
      type: String,
      enum: ["none", "pending", "success", "failed"],
      default: "none"
    },
    paymentLinkId: { type: String }, // Razorpay payment link id
    paymentLinkUrl: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" }, // POS order created after payment

    /* ── Expiry ── */
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

waSessionSchema.index({ restaurantId: 1, phone: 1 }, { unique: true });
waSessionSchema.index({ paymentLinkId: 1 }, { sparse: true });
waSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL — auto-delete stale sessions

export type WaSessionDocument = InferSchemaType<typeof waSessionSchema>;
export const WaSession: Model<WaSessionDocument> =
  models.WaSession || model("WaSession", waSessionSchema);
