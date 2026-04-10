import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { paymentSchema } from "@/lib/validators/order";
import { createPayment } from "@/server/repositories/mongo-repository";
import { trackOrderPayment } from "@/server/services/crm-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager", "cashier"], async (request, context, session) => {
    const { id } = await context.params;
    const body = await request.json();
    const payload = paymentSchema.parse({
      ...body,
      orderId: id,
      restaurantId: session.restaurantId,
      receivedBy: session.userId
    });

    const payment = await createPayment({
      ...payload,
      paidAt: new Date().toISOString()
    });

    trackOrderPayment(id, session.restaurantId).catch((err) =>
      console.error("[crm] tracking failed:", err)
    );

    return ok(payment, { status: 201 });
  })(request, context);
}
