import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { menuCategorySchema } from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import { createCategory, getRestaurantBundle } from "@/server/repositories/mongo-repository";

export async function GET() {
  const session = await getSession();
  const { categories } = await getRestaurantBundle(session.restaurantId);

  return ok({
    restaurantId: session.restaurantId,
    categories
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const payload = menuCategorySchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    const category = await createCategory(payload);

    return ok(category, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
