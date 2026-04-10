import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { menuCategorySchema } from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import { createMenuNode } from "@/server/repositories/menu-builder-repository";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const payload = menuCategorySchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    const node = await createMenuNode(payload);
    return ok(node, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
