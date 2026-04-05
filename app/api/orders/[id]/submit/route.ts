import { ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { updateOrderStatus } from "@/server/repositories/mongo-repository";
import { deductInventoryForOrder } from "@/server/services/inventory-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getSession();
  const order = await updateOrderStatus(id, session.restaurantId, "placed");

  // ── Extension hook: auto-deduct inventory on order submission ──
  // This runs in the background — if no recipes are mapped, it's a no-op.
  deductInventoryForOrder(order.id, session.restaurantId).catch((err) =>
    console.error("[inventory] deduction failed:", err)
  );

  return ok({
    id: order.id,
    status: order.status
  });
}
