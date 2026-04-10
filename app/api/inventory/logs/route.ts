import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { getInventoryLogs } from "@/server/services/inventory-service";
import { NextRequest } from "next/server";

/**
 * GET /api/inventory/logs
 * Returns recent inventory change logs
 */
export async function GET(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (_req, _ctx, session) => {
    const logs = await getInventoryLogs(session.restaurantId, 100);
    return ok(logs);
  })(request, {} as any);
}
