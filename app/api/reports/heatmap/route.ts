import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { getHeatmapData } from "@/server/queries/reports";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const sp = request.nextUrl.searchParams;
    const days = sp.get("days") ? Number(sp.get("days")) : 7;

    const data = await getHeatmapData({
      restaurantId: session.restaurantId,
      days: Math.min(Math.max(days, 1), 30) // clamp 1-30
    });

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
