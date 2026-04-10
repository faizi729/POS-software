import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { getRequestHost, getSubdomainFromHost } from "@/lib/tenant/host";
import { getSession } from "@/lib/auth/get-session";
import {
  resolveRestaurantIdByHost,
  resolveRestaurantIdBySlug,
  resolveRestaurantPublicConfigById
} from "@/lib/auth/tenant-resolver";

/**
 * Public tenant bootstrap endpoint.
 * - Resolves tenant from host/subdomain/custom-domain
 * - Returns safe branding/config payload (no secrets)
 */
export async function GET(_request: NextRequest) {
  try {
    const { host } = await getRequestHost();
    const sub = getSubdomainFromHost(host);

    let rid =
      (host ? await resolveRestaurantIdByHost(host) : null) ||
      (sub ? await resolveRestaurantIdBySlug(sub) : null);

    // Local dev fallback: if host doesn't resolve a tenant, use authenticated session when present.
    if (!rid) {
      const session = await getSession().catch(() => null);
      if (session?.restaurantId) {
        rid = session.restaurantId;
      } else {
        return ok({ error: "Restaurant not found for host" }, { status: 404 });
      }
    }

    const config = await resolveRestaurantPublicConfigById(rid);
    if (!config) {
      return ok({ error: "Restaurant not found" }, { status: 404 });
    }

    return ok({ restaurant: config });
  } catch (error) {
    return handleRouteError(error);
  }
}

