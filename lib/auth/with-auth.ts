import type { NextRequest } from "next/server";

import { handleRouteError } from "@/lib/api/response";
import { requireSession, assertRole } from "@/lib/auth/guards";
import { getTenantSlugFromHost } from "@/lib/auth/tenant";
import { resolveRestaurantIdByHost, resolveRestaurantIdBySlug } from "@/lib/auth/tenant-resolver";
import { getRequestHost } from "@/lib/tenant/host";

type Role = "owner" | "manager" | "cashier" | "staff" | "front_desk" | "housekeeping";

type Handler<Ctx> = (req: NextRequest, ctx: Ctx, session: Awaited<ReturnType<typeof requireSession>>) => Promise<any>;

export function withAuth<Ctx>(roles: Role[], handler: Handler<Ctx>) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      const session = await requireSession();
      assertRole(session, roles);

      // Enforce tenant identity derived from host (custom domain OR subdomain)
      const { host } = await getRequestHost();
      const ridByHost = host ? await resolveRestaurantIdByHost(host) : null;
      const slug = await getTenantSlugFromHost();
      const ridBySlug = slug ? await resolveRestaurantIdBySlug(slug) : null;
      const derivedRid = ridByHost || ridBySlug;

      // If request host indicates a specific tenant, session must match it.
      if (derivedRid && derivedRid !== session.restaurantId) {
        throw new Error("Tenant mismatch");
      }

      return await handler(req, ctx, session);
    } catch (error) {
      return handleRouteError(error);
    }
  };
}

