import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { getHeatmapData } from "@/server/queries/reports";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const parsedDays = sp.get("days") ? Number(sp.get("days")) : 7;
    const safeDays = Number.isFinite(parsedDays) ? Math.min(Math.max(parsedDays, 1), 30) : 7;

    return withAuth<any>(["owner", "manager", "cashier", "staff"], async (_req, _ctx, session) => {
      const data = await getHeatmapData({
        restaurantId: session.restaurantId,
        days: safeDays
      });
      return ok(data);
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
