import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { getInventoryLogs } from "@/server/services/inventory-service";

/**
 * GET /api/inventory/logs
 * Returns recent inventory change logs
 */
export async function GET() {
  try {
    const session = await getSession();
    const logs = await getInventoryLogs(session.restaurantId, 100);

    return ok(logs);
  } catch (error) {
    return handleRouteError(error);
  }
}
