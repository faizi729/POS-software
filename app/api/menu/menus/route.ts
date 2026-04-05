import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { menuDefinitionSchema } from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import {
  createMenuDefinition,
  getMenuBuilderWorkspace
} from "@/server/repositories/menu-builder-repository";

export async function GET() {
  try {
    const session = await getSession();
    const workspace = await getMenuBuilderWorkspace(session.restaurantId);

    return ok({ menus: workspace.menus, summary: workspace.summary });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    console.log("[menu/menus][POST] incoming body", body);
    const payload = menuDefinitionSchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    const menu = await createMenuDefinition(payload);
    console.log("[menu/menus][POST] created menu", menu);
    return ok(menu, { status: 201 });
  } catch (error) {
    console.error("[menu/menus][POST] failed", error);
    return handleRouteError(error);
  }
}
