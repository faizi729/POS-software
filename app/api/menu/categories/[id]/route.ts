import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { menuCategorySchema } from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import { deleteCategory, updateCategory } from "@/server/repositories/mongo-repository";

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
    const payload = menuCategorySchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    const category = await updateCategory(id, payload);

    return ok(category);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    const { id } = await context.params;
    const result = await deleteCategory(id, session.restaurantId);

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
