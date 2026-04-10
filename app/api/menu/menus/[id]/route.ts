import { ok, handleRouteError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { deleteMenuDefinitionCascade } from "@/server/repositories/menu-builder-repository";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuth<any>(["owner", "manager"], async (_req, context, session) => {
    const { id } = await context.params;
    const result = await deleteMenuDefinitionCascade({ restaurantId: session.restaurantId, menuId: id });
    return ok(result);
  })(request, context as any);
}

