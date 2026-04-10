import type { AppSession } from "@/lib/auth/get-session";
import { getSession } from "@/lib/auth/get-session";
import { USER_ROLES } from "@/lib/constants/roles";

export class UnauthorizedError extends Error {
  status = 401 as const;
  constructor(message = "Unauthorized") {
    super(message);
  }
}

export class ForbiddenError extends Error {
  status = 403 as const;
  constructor(message = "Forbidden") {
    super(message);
  }
}

export async function requireSession(): Promise<AppSession> {
  const session = await getSession().catch(() => null);
  if (!session?.restaurantId || !session?.userId) {
    throw new UnauthorizedError("Unauthorized");
  }
  return session;
}

export function withTenantScope<T extends Record<string, any>>(filter: T, session: AppSession) {
  return { ...filter, restaurantId: session.restaurantId };
}

export function assertRole(session: AppSession, allowedRoles: (typeof USER_ROLES)[number][]) {
  if (!allowedRoles.includes(session.role)) {
    throw new ForbiddenError("You do not have permission to perform this action.");
  }
}

