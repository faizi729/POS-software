import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Customer, LoyaltyTransaction, Order, Payment } from "@/models";

function oid(id: string) {
  return new Types.ObjectId(id);
}

/**
 * Track a customer visit when a payment is completed.
 * Creates customer if they don't exist, updates visit count and spend.
 * Awards loyalty points (1 point per ₹100 spent).
 */
export async function trackOrderPayment(orderId: string, restaurantId: string) {
  await connectToDatabase();

  const order = await Order.findOne({
    _id: oid(orderId),
    restaurantId: oid(restaurantId)
  }).lean();

  if (!order) return;

  // Only track if customer has a phone number
  const phone = order.customer?.phone?.trim();
  if (!phone) return;

  const name = order.customer?.name?.trim() || "Guest";
  const amount = order.pricing?.grandTotal ?? 0;
  const now = new Date();

  // Upsert customer
  let customer = await Customer.findOne({
    restaurantId: oid(restaurantId),
    phone
  });

  if (!customer) {
    customer = await Customer.create({
      restaurantId: oid(restaurantId),
      name,
      phone,
      totalVisits: 1,
      totalSpent: amount,
      firstVisitAt: now,
      lastVisitAt: now,
      loyaltyPoints: 0
    });
  } else {
    // Update name if provided and customer name was "Guest"
    if (name !== "Guest" && customer.name === "Guest") {
      customer.name = name;
    }
    customer.totalVisits += 1;
    customer.totalSpent += amount;
    customer.lastVisitAt = now;
    await customer.save();
  }

  // Award loyalty points: 1 point per ₹100 spent
  const pointsEarned = Math.floor(amount / 100);
  if (pointsEarned > 0) {
    const newBalance = customer.loyaltyPoints + pointsEarned;
    customer.loyaltyPoints = newBalance;
    await customer.save();

    await LoyaltyTransaction.create({
      restaurantId: oid(restaurantId),
      customerId: customer._id,
      orderId: oid(orderId),
      type: "earn",
      points: pointsEarned,
      balance: newBalance,
      description: `Earned ${pointsEarned} pts for ₹${amount.toFixed(0)} order`
    });
  }

  return {
    customerId: customer._id.toString(),
    name: customer.name,
    totalVisits: customer.totalVisits,
    loyaltyPoints: customer.loyaltyPoints
  };
}

/**
 * Get all customers for a restaurant
 */
export async function getCustomers(
  restaurantId: string,
  options: { search?: string; sort?: string; limit?: number } = {}
) {
  await connectToDatabase();

  const filter: any = { restaurantId: oid(restaurantId), isActive: true };

  if (options.search) {
    const regex = new RegExp(options.search, "i");
    filter.$or = [{ name: regex }, { phone: regex }];
  }

  const sortField =
    options.sort === "spent" ? { totalSpent: -1 as const } :
    options.sort === "points" ? { loyaltyPoints: -1 as const } :
    options.sort === "recent" ? { lastVisitAt: -1 as const } :
    { lastVisitAt: -1 as const };

  const customers = await Customer.find(filter)
    .sort(sortField)
    .limit(options.limit ?? 100)
    .lean();

  return customers.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    phone: c.phone,
    email: c.email,
    totalVisits: c.totalVisits,
    totalSpent: c.totalSpent,
    lastVisitAt: c.lastVisitAt?.toISOString(),
    firstVisitAt: c.firstVisitAt?.toISOString(),
    loyaltyPoints: c.loyaltyPoints,
    tags: c.tags,
    notes: c.notes
  }));
}

/**
 * Get customer detail with loyalty history
 */
export async function getCustomerDetail(customerId: string, restaurantId: string) {
  await connectToDatabase();

  const customer = await Customer.findOne({
    _id: oid(customerId),
    restaurantId: oid(restaurantId)
  }).lean();

  if (!customer) throw new Error("Customer not found.");

  const loyaltyHistory = await LoyaltyTransaction.find({
    restaurantId: oid(restaurantId),
    customerId: oid(customerId)
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Get recent orders by this customer's phone
  const recentOrders = await Order.find({
    restaurantId: oid(restaurantId),
    "customer.phone": customer.phone,
    status: { $ne: "cancelled" }
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    id: customer._id.toString(),
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    totalVisits: customer.totalVisits,
    totalSpent: customer.totalSpent,
    lastVisitAt: customer.lastVisitAt?.toISOString(),
    firstVisitAt: customer.firstVisitAt?.toISOString(),
    loyaltyPoints: customer.loyaltyPoints,
    tags: customer.tags,
    notes: customer.notes,
    loyaltyHistory: loyaltyHistory.map((lt) => ({
      id: lt._id.toString(),
      type: lt.type,
      points: lt.points,
      balance: lt.balance,
      description: lt.description,
      createdAt: (lt as any).createdAt?.toISOString()
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      grandTotal: o.pricing?.grandTotal ?? 0,
      status: o.status,
      type: o.type,
      itemCount: o.items.length,
      createdAt: (o as any).createdAt?.toISOString()
    }))
  };
}

/**
 * Redeem loyalty points for a customer
 */
export async function redeemLoyaltyPoints(params: {
  customerId: string;
  restaurantId: string;
  points: number;
  description?: string;
}) {
  await connectToDatabase();

  const customer = await Customer.findOne({
    _id: oid(params.customerId),
    restaurantId: oid(params.restaurantId)
  });

  if (!customer) throw new Error("Customer not found.");
  if (customer.loyaltyPoints < params.points) {
    throw new Error(`Insufficient points. Available: ${customer.loyaltyPoints}`);
  }

  const newBalance = customer.loyaltyPoints - params.points;
  customer.loyaltyPoints = newBalance;
  await customer.save();

  await LoyaltyTransaction.create({
    restaurantId: oid(params.restaurantId),
    customerId: oid(params.customerId),
    type: "redeem",
    points: -params.points,
    balance: newBalance,
    description: params.description ?? `Redeemed ${params.points} pts`
  });

  return { newBalance };
}

/**
 * Generate WhatsApp notification link (hook structure)
 */
export function generateWhatsAppLink(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * WhatsApp notification templates
 */
export const WHATSAPP_TEMPLATES = {
  welcome: (name: string, restaurantName: string) =>
    `Hi ${name}! 👋 Welcome to ${restaurantName}. Thank you for your first visit! We hope to see you again soon.`,
  loyaltyEarned: (name: string, points: number, total: number) =>
    `Hi ${name}! 🎉 You earned ${points} loyalty points! Your total: ${total} pts.`,
  loyaltyReward: (name: string, restaurantName: string) =>
    `Hi ${name}! 🎁 You have enough points for a reward at ${restaurantName}! Visit us to redeem.`,
  missYou: (name: string, restaurantName: string) =>
    `Hi ${name}! We miss you at ${restaurantName}! 🍽️ Come back soon for a special treat.`
};
