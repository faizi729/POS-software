import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { menuItemSchema } from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import { createMenuItem, getRestaurantBundle } from "@/server/repositories/mongo-repository";

export async function GET() {
  const session = await getSession();
  const { menuItems } = await getRestaurantBundle(session.restaurantId);

  return ok({
    restaurantId: session.restaurantId,
    items: menuItems
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const payload = menuItemSchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    const item = await createMenuItem(payload);

    return ok(item, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
