import type { SuperAdminSession } from "./get-super-admin-session";

export type PlatformMutation =
  | "tenant_write"
  | "impersonate"
  | "global_settings"
  | "platform_user_admin";

export function canMutate(session: SuperAdminSession, mutation: PlatformMutation): boolean {
  const { role } = session;
  switch (mutation) {
    case "tenant_write":
      return role !== "read_only";
    case "impersonate":
      return role === "super_admin" || role === "support";
    case "global_settings":
      return role === "super_admin";
    case "platform_user_admin":
      return role === "super_admin";
    default:
      return false;
  }
}

export function assertCanMutate(session: SuperAdminSession, mutation: PlatformMutation): void {
  if (!canMutate(session, mutation)) {
    const err = new Error("Forbidden");
    (err as any).statusCode = 403;
    throw err;
  }
}
