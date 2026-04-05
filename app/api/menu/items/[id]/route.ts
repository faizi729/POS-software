import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { menuItemSchema } from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import { deleteMenuItem, updateMenuItem } from "@/server/repositories/mongo-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    const { id } = await context.params;
    const body = await request.json();
    const payload = menuItemSchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    const item = await updateMenuItem(id, payload);

    return ok(item);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    const { id } = await context.params;
    const result = await deleteMenuItem(id, session.restaurantId);

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
