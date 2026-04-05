import { Order } from "@/models";

export async function getRecentOrders(restaurantId: string) {
  return Order.find({ restaurantId }).sort({ createdAt: -1 }).limit(20).lean();
}
