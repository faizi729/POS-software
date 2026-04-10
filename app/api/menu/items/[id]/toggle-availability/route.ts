import { ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { updateMenuItemAvailability } from "@/server/repositories/mongo-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  // Staff/KDS can toggle availability? In your RBAC matrix, menu changes are owner/manager only.
  return withAuth<RouteContext>(["owner", "manager"], async (_req, context, session) => {
    const { id } = await context.params;
    const item = await updateMenuItemAvailability(id, session.restaurantId);

    return ok({
      id: item.id,
      isAvailable: item.isAvailable
    });
  })(request, context);
}
