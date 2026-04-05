import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { paymentSchema } from "@/lib/validators/order";
import { createPayment, getRestaurantBundle } from "@/server/repositories/mongo-repository";

export async function GET() {
  const session = await getSession();
  const { payments } = await getRestaurantBundle(session.restaurantId);

  return ok({
    restaurantId: session.restaurantId,
    payments
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const payload = paymentSchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      receivedBy: session.userId
    });

    const payment = await createPayment({
      ...payload,
      paidAt: new Date().toISOString()
    });

    return ok(payment, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
