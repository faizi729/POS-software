import { ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { updateOrderStatus } from "@/server/repositories/mongo-repository";
import { deductInventoryForOrder } from "@/server/services/inventory-service";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager", "cashier"], async (_req, context, session) => {
    const { id } = await context.params;
    const order = await updateOrderStatus(id, session.restaurantId, "placed");

    deductInventoryForOrder(order.id, session.restaurantId).catch((err) =>
      console.error("[inventory] deduction failed:", err)
    );

    return ok({
      id: order.id,
      status: order.status
    });
  })(request, context);
}
