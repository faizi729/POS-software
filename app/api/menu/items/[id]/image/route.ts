import { NextRequest } from "next/server";

import { ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { setMenuItemImageUrl } from "@/server/repositories/mongo-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager"], async (req, ctx, session) => {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const imageUrl = String(body?.imageUrl || "").trim();
    if (!imageUrl) throw new Error("Missing imageUrl");
    const item = await setMenuItemImageUrl(id, session.restaurantId, imageUrl);
    return ok(item);
  })(request, context);
}

