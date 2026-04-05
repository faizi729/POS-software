import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { deleteMenuNodeCascade } from "@/server/repositories/menu-builder-repository";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await context.params;
    const result = await deleteMenuNodeCascade({ restaurantId: session.restaurantId, categoryId: id });
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

