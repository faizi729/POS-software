import { getRequestHost, getSubdomainFromHost } from "@/lib/tenant/host";

/**
 * Legacy helper used by `withAuth`.
 * Returns the tenant slug when request host uses subdomain routing.
 */
export async function getTenantSlugFromHost(): Promise<string | null> {
  const { host } = await getRequestHost();
  return getSubdomainFromHost(host);
}

