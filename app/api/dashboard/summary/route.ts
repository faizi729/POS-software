import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { getDashboardData } from "@/server/queries/dashboard";

export async function GET(request: NextRequest) {
  return withAuth<any>(["owner", "manager", "cashier"], async (_req, _ctx, session) => {
    const summary = await getDashboardData(session.restaurantId);
    return ok(summary);
  })(request, {} as any);
}
