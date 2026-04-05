import { ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { updateOrderStatus } from "@/server/repositories/mongo-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getSession();
  const order = await updateOrderStatus(id, session.restaurantId, "cancelled");

  return ok({
    id: order.id,
    status: order.status
  });
}
