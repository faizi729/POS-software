import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { getTaxReport } from "@/server/queries/reports";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;

    const year = sp.get("year") ? Number(sp.get("year")) : undefined;

    return withAuth<any>(["owner", "manager", "cashier", "staff"], async (_req, _ctx, session) => {
      const report = await getTaxReport({
        restaurantId: session.restaurantId,
        year
      });
      return ok(report);
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
