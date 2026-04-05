import { headers } from "next/headers";

export async function getTenantSlugFromHost(): Promise<string | null> {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
  // Expect pattern <slug>.<domain> or localhost:<port>
  const parts = host.split(":")[0].split(".");
  if (parts.length >= 3) {
    // e.g. tenant.example.com
    return parts[0];
  }
  // No subdomain tenant
  return null;
}

