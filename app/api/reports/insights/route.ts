import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { getSmartInsights } from "@/server/queries/reports";

export async function GET() {
  try {
    const session = await getSession();
    const data = await getSmartInsights({ restaurantId: session.restaurantId });
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
