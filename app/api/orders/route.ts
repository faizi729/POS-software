import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { connectToDatabase } from "@/lib/db/connect";
import { orderSchema } from "@/lib/validators/order";
import { Restaurant } from "@/models";
import { createOrder, getRestaurantBundle } from "@/server/repositories/mongo-repository";
import { generateOrderNumber } from "@/server/services/order-number";
import { generateDailyToken } from "@/server/services/daily-token";

export async function GET() {
  const session = await getSession();
  const { orders } = await getRestaurantBundle(session.restaurantId);

  return ok({
    restaurantId: session.restaurantId,
    orders
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    // Get restaurant's order prefix
    await connectToDatabase();
    const restaurant = await Restaurant.findById(session.restaurantId).select("settings.orderPrefix").lean();
    const prefix = restaurant?.settings?.orderPrefix || "POS";

    // Generate a daily-resetting token number
    const tokenNumber = await generateDailyToken(session.restaurantId);

    const payload = orderSchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      orderNumber: generateOrderNumber(prefix),
      createdBy: session.userId
    });

    const order = await createOrder({ ...payload, tokenNumber });

    return ok(order, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
