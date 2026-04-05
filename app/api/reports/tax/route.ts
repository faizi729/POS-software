import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { getTaxReport } from "@/server/queries/reports";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const sp = request.nextUrl.searchParams;

    const year = sp.get("year") ? Number(sp.get("year")) : undefined;

    const report = await getTaxReport({
      restaurantId: session.restaurantId,
      year
    });

    return ok(report);
  } catch (error) {
    return handleRouteError(error);
  }
}
