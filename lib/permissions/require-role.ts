import { USER_ROLES } from "@/lib/constants/roles";

import type { AppSession } from "@/lib/auth/get-session";

export function requireRole(session: AppSession, allowedRoles: (typeof USER_ROLES)[number][]) {
  if (!allowedRoles.includes(session.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
}
