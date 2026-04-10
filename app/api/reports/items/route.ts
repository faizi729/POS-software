import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { getItemPerformance } from "@/server/queries/reports";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

    const startDate = sp.get("start") ? new Date(sp.get("start")!) : defaultStart;
    const endDate = sp.get("end") ? new Date(sp.get("end")!) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const sort = (sp.get("sort") as "qty" | "revenue") ?? "qty";

    return withAuth<any>(["owner", "manager"], async (_req, _ctx, session) => {
      const report = await getItemPerformance({
        restaurantId: session.restaurantId,
        startDate,
        endDate,
        sort
      });
      return ok(report);
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
