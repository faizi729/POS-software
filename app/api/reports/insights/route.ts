import { ok, handleRouteError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getSmartInsights } from "@/server/queries/reports";

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "cashier", "staff"], async (_req, _ctx, session) => {
      const data = await getSmartInsights({ restaurantId: session.restaurantId });
      return ok(data);
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
