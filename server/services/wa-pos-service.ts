/**
 * POS integration service for WhatsApp orders.
 * Creates real POS orders from WhatsApp cart data.
 * Re-uses existing createOrder, pricing, and token generation.
 */

import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { MenuItem, Restaurant, User } from "@/models";
import { createOrder } from "@/server/repositories/mongo-repository";
import { calculateOrderPricing } from "@/server/services/order-pricing";
import { generateOrderNumber } from "@/server/services/order-number";
import { generateDailyToken } from "@/server/services/daily-token";
import { deductInventoryForOrder } from "@/server/services/inventory-service";
import { trackOrderPayment } from "@/server/services/crm-service";
import type { CartItem } from "./wa-session-service";

function oid(id: string) {
  return new Types.ObjectId(id);
}

type CreateWhatsAppOrderParams = {
  restaurantId: string;
  phone: string;
  customerName: string;
  customerAddress?: string;
  cart: { items: CartItem[]; total: number };
  orderType: "dine_in" | "takeaway";
  paymentReference?: string;
};

/**
 * Creates a fully-formed POS order from WhatsApp cart data.
 * - Snapshots current menu-item prices (source of truth)
 * - Calculates tax using restaurant settings
 * - Generates order number + daily token
 * - Sets status to "placed" and channel to "whatsapp"
 * - Fires inventory deduction + CRM tracking in background
 */
export async function createWhatsAppOrder(params: CreateWhatsAppOrderParams) {
  await connectToDatabase();

  const {
    restaurantId,
    phone,
    customerName,
    customerAddress,
    cart,
    orderType,
    paymentReference,
  } = params;

  // 1. Fetch restaurant settings for prefix + tax
  const restaurant = await Restaurant.findById(oid(restaurantId))
    .select("settings.orderPrefix settings.gstRatePercent settings.gstEnabled")
    .lean();

  if (!restaurant) throw new Error("Restaurant not found");

  const prefix = restaurant.settings?.orderPrefix || "WA";
  const gstEnabled = restaurant.settings?.gstEnabled ?? true;
  const gstRate = gstEnabled ? (restaurant.settings?.gstRatePercent ?? 5) / 100 : 0;

  // 2. Fetch current menu item data (price snapshot = source of truth)
  const menuItemIds = cart.items.map((i) => oid(i.menuItemId));
  const menuItems = await MenuItem.find({
    _id: { $in: menuItemIds },
    restaurantId: oid(restaurantId),
  }).lean();

  const menuItemMap = new Map(menuItems.map((m) => [m._id.toString(), m]));

  // 3. Build order items with live price snapshots
  const orderItems = cart.items.map((ci) => {
    const mi = menuItemMap.get(ci.menuItemId);
    const price = mi?.price ?? ci.price; // fallback to cart price if item deleted
    const name = mi?.name ?? ci.name;
    return {
      menuItemId: ci.menuItemId,
      nameSnapshot: name,
      priceSnapshot: price,
      quantity: ci.qty,
      notes: "",
      lineTotal: price * ci.qty,
    };
  });

  // 4. Calculate pricing
  const pricing = calculateOrderPricing(
    orderItems.map((i) => ({ price: i.priceSnapshot, quantity: i.quantity })),
    gstRate
  );

  // 5. Generate order number + token
  const orderNumber = generateOrderNumber(prefix);
  const tokenNumber = await generateDailyToken(restaurantId);

  // 6. Find a system user to attribute the order to (first owner/manager)
  const systemUser = await User.findOne({
    restaurantId: oid(restaurantId),
    role: { $in: ["owner", "manager"] },
    status: "active",
  })
    .select("_id")
    .lean();

  if (!systemUser) throw new Error("No active admin user found for restaurant");

  // 7. Create the order via existing repository
  const order = await createOrder({
    restaurantId,
    orderNumber,
    channel: "whatsapp",
    type: orderType,
    status: "placed", // WhatsApp orders go straight to placed
    customer: {
      name: customerName,
      phone,
    },
    items: orderItems,
    pricing,
    paymentStatus: paymentReference ? "paid" : "unpaid",
    createdBy: systemUser._id.toString(),
    tokenNumber,
  });

  // 8. Background: deduct inventory + CRM tracking
  deductInventoryForOrder(order.id, restaurantId).catch((err) =>
    console.error("[wa-pos] inventory deduction failed:", err)
  );

  if (paymentReference) {
    trackOrderPayment(order.id, restaurantId).catch((err) =>
      console.error("[wa-pos] CRM tracking failed:", err)
    );
  }

  return order;
}
