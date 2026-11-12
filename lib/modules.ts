import { ForbiddenError } from "@/lib/auth/guards";
import type { AppModule } from "@/lib/constants/roles";
import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";

/** A tenant with no explicit modules is a POS tenant (legacy documents). */
export const DEFAULT_MODULES: AppModule[] = ["pos"];

export function enabledModulesOf(
  restaurant: { enabledModules?: string[] | null } | null | undefined
): AppModule[] {
  const list = (restaurant?.enabledModules ?? []).filter(Boolean) as AppModule[];
  return list.length ? list : DEFAULT_MODULES;
}

export function hasModule(
  restaurant: { enabledModules?: string[] | null } | null | undefined,
  module: AppModule
): boolean {
  return enabledModulesOf(restaurant).includes(module);
}

/** Throw unless the tenant has the module enabled. Use in pages and routes. */
export function requireModule(
  restaurant: { enabledModules?: string[] | null } | null | undefined,
  module: AppModule
): void {
  if (!hasModule(restaurant, module)) {
    throw new ForbiddenError(`${module} module is not enabled for this workspace.`);
  }
}

export async function loadEnabledModules(restaurantId: string): Promise<AppModule[]> {
  await connectToDatabase();
  const restaurant = await Restaurant.findById(restaurantId).select("enabledModules").lean();
  return enabledModulesOf(restaurant);
}

/** Route helper: resolves the tenant's modules and enforces access. */
export async function requireModuleForTenant(restaurantId: string, module: AppModule): Promise<void> {
  requireModule({ enabledModules: await loadEnabledModules(restaurantId) }, module);
}
