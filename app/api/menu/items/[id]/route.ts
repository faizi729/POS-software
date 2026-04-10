import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { menuItemSchema } from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import { deleteMenuItem, updateMenuItem } from "@/server/repositories/mongo-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager"], async (request, context, session) => {
    const { id } = await context.params;
    const body = await request.json();

    const payload = menuItemSchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    if (payload.sku == null || payload.sku === "") {
      // @ts-ignore
      delete (payload as any).sku;
    }

    const item = await updateMenuItem(id, payload);
    return ok(item);
  })(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager"], async (_req, context, session) => {
    const { id } = await context.params;
    const result = await deleteMenuItem(id, session.restaurantId);
    return ok(result);
  })(request, context);
}
