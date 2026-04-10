import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { getHeatmapData } from "@/server/queries/reports";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const days = sp.get("days") ? Number(sp.get("days")) : 7;

    return withAuth<any>(["owner", "manager"], async (_req, _ctx, session) => {
      const data = await getHeatmapData({
        restaurantId: session.restaurantId,
        days: Math.min(Math.max(days, 1), 30) // clamp 1-30
      });
      return ok(data);
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
