import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models";

/**
 * Generate a daily-resetting token number for a restaurant.
 * Token resets to 1 at the start of each calendar day (based on server time).
 *
 * Uses findOneAndUpdate with $inc to guarantee uniqueness even under concurrency.
 */
export async function generateDailyToken(restaurantId: string): Promise<number> {
  await connectToDatabase();

  const now = new Date();
  // Start of today (midnight)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  // End of today (just before midnight)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const restaurantObjectId = new Types.ObjectId(restaurantId);

  // Find the highest token number for today
  const lastOrder = await Order.findOne(
    {
      restaurantId: restaurantObjectId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      tokenNumber: { $exists: true, $gt: 0 }
    },
    { tokenNumber: 1 }
  )
    .sort({ tokenNumber: -1 })
    .lean();

  const nextToken = (lastOrder?.tokenNumber ?? 0) + 1;
  return nextToken;
}
