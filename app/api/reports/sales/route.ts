import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { getSalesReport } from "@/server/queries/reports";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const sp = request.nextUrl.searchParams;

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

    const startDate = sp.get("start") ? new Date(sp.get("start")!) : defaultStart;
    const endDate = sp.get("end") ? new Date(sp.get("end")!) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const paymentMethod = sp.get("method") ?? undefined;

    const report = await getSalesReport({
      restaurantId: session.restaurantId,
      startDate,
      endDate,
      paymentMethod
    });

    return ok(report);
  } catch (error) {
    return handleRouteError(error);
  }
}
