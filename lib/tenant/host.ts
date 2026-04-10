import { headers } from "next/headers";

export type TenantHostInfo = {
  host: string; // host without port
  rawHost: string; // may include port
};

function stripPort(h: string) {
  return (h || "").split(":")[0].trim().toLowerCase();
}

/**
 * Reads host in a proxy-safe way.
 * - Prefer `x-forwarded-host` (Vercel/NGINX)
 * - Fallback to `host`
 */
export async function getRequestHost(): Promise<TenantHostInfo> {
  const hdrs = await headers();
  const rawHost = (hdrs.get("x-forwarded-host") || hdrs.get("host") || "").trim();
  return { rawHost, host: stripPort(rawHost) };
}

export function getSubdomainFromHost(host: string): string | null {
  const h = (host || "").toLowerCase();
  if (!h) return null;

  // Ignore bare localhost + IPs (no meaningful subdomain routing)
  if (h === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return null;

  const parts = h.split(".").filter(Boolean);

  // Dev-friendly: <slug>.localhost should be treated as a tenant subdomain.
  // Modern browsers resolve *.localhost to 127.0.0.1.
  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0] || null;
  }

  // Prod: expect at least <sub>.<root>.<tld>
  if (parts.length < 3) return null;
  return parts[0] || null;
}

