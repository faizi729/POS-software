import { AuditLog } from "@/models";

/**
 * Hotel/banquet audit trail. Never blocks the caller — a logging failure must
 * not roll back a booking or payment.
 */
export async function auditHotel(params: {
  restaurantId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await AuditLog.create({
    actorType: "tenant",
    actorId: params.actorId || "system",
    actorEmail: params.actorEmail || undefined,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    tenantId: params.restaurantId,
    meta: params.meta ?? {}
  }).catch(() => {});
}

/** Snapshot of the fields that changed, for before/after audit entries. */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  for (const key of Object.keys(after)) {
    const a = before[key];
    const b = after[key];
    const norm = (value: unknown) => (value instanceof Date ? value.toISOString() : value);
    if (JSON.stringify(norm(a)) !== JSON.stringify(norm(b))) {
      changedBefore[key] = norm(a);
      changedAfter[key] = norm(b);
    }
  }
  return { before: changedBefore, after: changedAfter };
}
