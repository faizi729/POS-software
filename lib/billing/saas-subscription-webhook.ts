/**
 * Maps Razorpay subscription webhook payloads → Restaurant billing fields.
 */

import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { AuditLog } from "@/models/AuditLog";
import {
  saasBillingIntervalFromRazorpayPlanId,
  saasPlanCodeFromRazorpayPlanId
} from "@/lib/billing/razorpay-saas-config";

function mapRzStatusToSubscriptionStatus(
  rz: string
): "trial" | "active" | "past_due" | "suspended" | "churned" | null {
  const s = (rz || "").toLowerCase();
  if (s === "created") return "trial";
  if (s === "authenticated" || s === "active") return "active";
  if (s === "pending") return "past_due";
  if (s === "halted") return "suspended";
  if (s === "cancelled" || s === "completed" || s === "expired") return "churned";
  return null;
}

export async function handleSaaSSubscriptionWebhookEvent(event: {
  event?: string;
  payload?: { subscription?: { entity?: Record<string, unknown> } };
}): Promise<void> {
  const eventType = event?.event || "";
  if (!eventType.startsWith("subscription.")) return;

  const entity = event?.payload?.subscription?.entity as
    | {
        id?: string;
        status?: string;
        plan_id?: string;
        notes?: { tenantId?: string; source?: string };
      }
    | undefined;

  if (!entity?.id) return;

  await connectToDatabase();

  let tenantId = entity.notes?.tenantId?.trim();
  if (!tenantId) {
    const r = await Restaurant.findOne({ razorpaySubscriptionId: entity.id }).select("_id").lean();
    tenantId = r?._id?.toString();
  }
  if (!tenantId || !Types.ObjectId.isValid(tenantId)) return;

  const mapped = mapRzStatusToSubscriptionStatus(String(entity.status || ""));
  const planId = entity.plan_id ? String(entity.plan_id) : "";
  const planCode = planId ? saasPlanCodeFromRazorpayPlanId(planId) : null;
  const billingInterval = planId ? saasBillingIntervalFromRazorpayPlanId(planId) : null;

  const set: Record<string, unknown> = {
    razorpaySubscriptionId: entity.id
  };
  if (mapped) set.subscriptionStatus = mapped;
  if (planCode) set.plan = planCode;
  if (billingInterval) set.saasBillingInterval = billingInterval;

  await Restaurant.findByIdAndUpdate(tenantId, { $set: set }).catch(() => null);

  await AuditLog.create({
    actorType: "platform",
    actorId: "system",
    actorEmail: undefined,
    action: `billing.razorpay.${eventType}`,
    targetType: "tenant",
    targetId: tenantId,
    tenantId: new Types.ObjectId(tenantId),
    meta: {
      razorpaySubscriptionId: entity.id,
      razorpayStatus: entity.status,
      mappedSubscriptionStatus: mapped
    }
  }).catch(() => {});
}
