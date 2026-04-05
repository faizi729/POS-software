import { ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { getDashboardData } from "@/server/queries/dashboard";

export async function GET() {
  const session = await getSession();
  const summary = await getDashboardData(session.restaurantId);

  return ok(summary);
}
