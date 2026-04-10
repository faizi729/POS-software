import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { menuCategorySchema } from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import { deleteCategory, updateCategory } from "@/server/repositories/mongo-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager"], async (request, context, session) => {
    const { id } = await context.params;
    const body = await request.json();
    const payload = menuCategorySchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    const category = await updateCategory(id, payload);

    return ok(category);
  })(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager"], async (_req, context, session) => {
    const { id } = await context.params;
    const result = await deleteCategory(id, session.restaurantId);
    return ok(result);
  })(request, context);
}
