import { ok, handleRouteError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getLowStockAlerts } from "@/server/services/inventory-service";

/**
 * GET /api/inventory/alerts
 * Returns low-stock and out-of-stock ingredient alerts
 */
export async function GET(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (_req, _ctx, session) => {
    const alerts = await getLowStockAlerts(session.restaurantId);

    return ok({
      alerts,
      total: alerts.length,
      outOfStock: alerts.filter((a) => a.currentStock <= 0).length
    });
  })(request, {} as any);
}
