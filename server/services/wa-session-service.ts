/**
 * WhatsApp session management.
 * One session per phone per restaurant. Auto-expires after configurable TTL.
 */

import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { WaSession } from "@/models";
import { WA_CONFIG, WA_STATES, WaState } from "@/lib/whatsapp/config";

function oid(id: string) {
  return new Types.ObjectId(id);
}

function sessionExpiry() {
  const d = new Date();
  d.setHours(d.getHours() + WA_CONFIG.sessionTtlHours);
  return d;
}

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  lineTotal: number;
};

export type SessionData = {
  id: string;
  phone: string;
  state: WaState;
  cart: { items: CartItem[]; total: number };
  selectedItemId?: string;
  selectedCategoryId?: string;
  customerName?: string;
  customerAddress?: string;
  orderType: string;
  paymentStatus: string;
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  orderId?: string;
};

function serialize(doc: any): SessionData {
  return {
    id: doc._id.toString(),
    phone: doc.phone,
    state: doc.state,
    cart: {
      items: (doc.cart?.items ?? []).map((i: any) => ({
        menuItemId: i.menuItemId.toString(),
        name: i.name,
        price: i.price,
        qty: i.qty,
        lineTotal: i.lineTotal,
      })),
      total: doc.cart?.total ?? 0,
    },
    selectedItemId: doc.selectedItemId,
    selectedCategoryId: doc.selectedCategoryId,
    customerName: doc.customerName,
    customerAddress: doc.customerAddress,
    orderType: doc.orderType ?? "takeaway",
    paymentStatus: doc.paymentStatus ?? "none",
    paymentLinkId: doc.paymentLinkId,
    paymentLinkUrl: doc.paymentLinkUrl,
    orderId: doc.orderId?.toString(),
  };
}

/**
 * Get or create a session for a phone number.
 */
export async function getOrCreateSession(phone: string): Promise<SessionData> {
  await connectToDatabase();

  const restaurantId = WA_CONFIG.restaurantId;

  let session = await WaSession.findOne({
    restaurantId: oid(restaurantId),
    phone,
  });

  if (!session) {
    session = await WaSession.create({
      restaurantId: oid(restaurantId),
      phone,
      state: WA_STATES.START,
      cart: { items: [], total: 0 },
      expiresAt: sessionExpiry(),
    });
  }

  return serialize(session.toObject());
}

/**
 * Update session fields. Automatically extends expiry.
 */
export async function updateSession(
  phone: string,
  updates: Partial<{
    state: WaState;
    cart: { items: CartItem[]; total: number };
    selectedItemId: string | null;
    selectedCategoryId: string | null;
    customerName: string;
    customerAddress: string;
    orderType: string;
    paymentStatus: string;
    paymentLinkId: string;
    paymentLinkUrl: string;
    orderId: string;
  }>
): Promise<SessionData> {
  await connectToDatabase();

  const restaurantId = WA_CONFIG.restaurantId;

  // Convert cart items' menuItemId to ObjectId if present
  const setFields: any = { ...updates, expiresAt: sessionExpiry() };

  if (updates.cart) {
    setFields.cart = {
      items: updates.cart.items.map((i) => ({
        menuItemId: oid(i.menuItemId),
        name: i.name,
        price: i.price,
        qty: i.qty,
        lineTotal: i.lineTotal,
      })),
      total: updates.cart.total,
    };
  }

  // null → unset
  if (updates.selectedItemId === null) {
    setFields.selectedItemId = undefined;
  }
  if (updates.selectedCategoryId === null) {
    setFields.selectedCategoryId = undefined;
  }

  const session = await WaSession.findOneAndUpdate(
    { restaurantId: oid(restaurantId), phone },
    { $set: setFields },
    { new: true }
  );

  if (!session) throw new Error("Session not found");
  return serialize(session.toObject());
}

/**
 * Reset a session back to START with empty cart.
 */
export async function resetSession(phone: string): Promise<SessionData> {
  return updateSession(phone, {
    state: WA_STATES.START,
    cart: { items: [], total: 0 },
    selectedItemId: null,
    selectedCategoryId: null,
    customerName: undefined,
    customerAddress: undefined,
    paymentStatus: "none",
    paymentLinkId: undefined,
    paymentLinkUrl: undefined,
    orderId: undefined,
  });
}

/**
 * Find session by Razorpay payment link id (for webhook).
 */
export async function getSessionByPaymentLinkId(
  linkId: string
): Promise<SessionData | null> {
  await connectToDatabase();

  const session = await WaSession.findOne({ paymentLinkId: linkId });
  if (!session) return null;
  return serialize(session.toObject());
}
