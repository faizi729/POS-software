import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { getItemPerformance } from "@/server/queries/reports";

function parseDateStart(value: string) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateEnd(value: string) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    defaultStart.setHours(0, 0, 0, 0);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startDate = sp.get("start") ? parseDateStart(sp.get("start")!) ?? defaultStart : defaultStart;
    const endDate = sp.get("end") ? parseDateEnd(sp.get("end")!) ?? defaultEnd : defaultEnd;
    const sort = (sp.get("sort") as "qty" | "revenue") ?? "qty";

    return withAuth<any>(["owner", "manager", "cashier", "staff"], async (_req, _ctx, session) => {
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
