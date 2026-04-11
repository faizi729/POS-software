import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import {
  getConfiguredSaasPlans,
  getRazorpayPlanIdForSaasPlan,
  razorpayKeysPresent,
  saasSubscriptionTotalCount
} from "@/lib/billing/razorpay-saas-config";
import { WA_CONFIG } from "@/lib/whatsapp/config";
import { Restaurant } from "@/models/Restaurant";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

function maskPlanId(id: string): string {
  if (id.length <= 8) return "••••";
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  await getSuperAdminSession();
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-rz-status", getClientIp(req)],
    limit: 120,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();

  const plansConfigured = getConfiguredSaasPlans();

  const planIdsPreview: Record<string, { monthly: string | null; yearly: string | null }> = {};
  for (const code of ["starter", "growth", "scale"] as const) {
    const m = getRazorpayPlanIdForSaasPlan(code, "monthly");
    const y = getRazorpayPlanIdForSaasPlan(code, "yearly");
    planIdsPreview[code] = {
      monthly: m ? maskPlanId(m) : null,
      yearly: y ? maskPlanId(y) : null
    };
  }

  const [withCustomer, withSub] = await Promise.all([
    Restaurant.countDocuments({ razorpayCustomerId: { $exists: true, $nin: [null, ""] } }),
    Restaurant.countDocuments({ razorpaySubscriptionId: { $exists: true, $nin: [null, ""] } })
  ]);

  const base = WA_CONFIG.appBaseUrl.replace(/\/$/, "");

  return NextResponse.json({
    keysConfigured: razorpayKeysPresent(),
    webhookSecretConfigured: Boolean(WA_CONFIG.razorpayWebhookSecret?.trim()),
    plansConfigured,
    planIdsPreview,
    subscriptionTotalCountMonthly: saasSubscriptionTotalCount("monthly"),
    subscriptionTotalCountYearly: saasSubscriptionTotalCount("yearly"),
    webhookUrls: [
      `${base}/api/whatsapp/razorpay-webhook`,
      `${base}/api/billing/razorpay/webhook`
    ],
    tenantsWithRazorpayCustomer: withCustomer,
    tenantsWithRazorpaySubscription: withSub
  });
}
