import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { getLowStockAlerts } from "@/server/services/inventory-service";

/**
 * GET /api/inventory/alerts
 * Returns low-stock and out-of-stock ingredient alerts
 */
export async function GET() {
  try {
    const session = await getSession();
    const alerts = await getLowStockAlerts(session.restaurantId);

    return ok({
      alerts,
      total: alerts.length,
      outOfStock: alerts.filter((a) => a.currentStock <= 0).length
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
