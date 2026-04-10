import { ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { updateOrderStatus } from "@/server/repositories/mongo-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager", "cashier"], async (_req, context, session) => {
    const { id } = await context.params;
    const order = await updateOrderStatus(id, session.restaurantId, "cancelled");

    return ok({
      id: order.id,
      status: order.status
    });
  })(request, context);
}
