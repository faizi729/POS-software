import { getSession } from "@/lib/auth/get-session";
import { getRequestHost, getSubdomainFromHost } from "@/lib/tenant/host";
import { resolveRestaurantIdByHost, resolveRestaurantIdBySlug } from "@/lib/auth/tenant-resolver";

/**
 * Resolves tenant restaurantId for PUBLIC website routes.
 * - Production: resolves from host/subdomain/customDomain only
 * - Dev fallback: if host doesn't resolve, use authenticated session restaurantId (so localhost previews work)
 */
export async function resolvePublicTenantRestaurantId(): Promise<string | null> {
  const { host } = await getRequestHost();
  const sub = getSubdomainFromHost(host);
  const rid =
    (host ? await resolveRestaurantIdByHost(host) : null) ||
    (sub ? await resolveRestaurantIdBySlug(sub) : null);

  if (rid) return rid;

  if (process.env.NODE_ENV !== "production") {
    const session = await getSession().catch(() => null);
    if (session?.restaurantId) return session.restaurantId;
  }

  return null;
}

