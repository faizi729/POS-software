import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { menuDefinitionSchema } from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import {
  createMenuDefinition,
  getMenuBuilderWorkspace
} from "@/server/repositories/menu-builder-repository";

export async function GET(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (_req, _ctx, session) => {
    const workspace = await getMenuBuilderWorkspace(session.restaurantId);
    return ok({ menus: workspace.menus, summary: workspace.summary });
  })(request, {} as any);
}

export async function POST(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (request, _ctx, session) => {
    const body = await request.json();
    const payload = menuDefinitionSchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    const menu = await createMenuDefinition(payload);
    return ok(menu, { status: 201 });
  })(request, {} as any);
}
