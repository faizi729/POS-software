/**
 * SaaS (platform) subscription billing via Razorpay Plans.
 *
 * Uses the same API keys as WhatsApp payment links (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).
 * Create Plans in Razorpay Dashboard → Subscriptions → Plans (one plan per tier × interval).
 *
 * Env (6 plan IDs — monthly + yearly for starter / growth / scale):
 *   RAZORPAY_PLAN_ID_STARTER_MONTHLY, RAZORPAY_PLAN_ID_STARTER_YEARLY
 *   RAZORPAY_PLAN_ID_GROWTH_MONTHLY, RAZORPAY_PLAN_ID_GROWTH_YEARLY
 *   RAZORPAY_PLAN_ID_SCALE_MONTHLY,   RAZORPAY_PLAN_ID_SCALE_YEARLY
 *
 * Legacy (optional): RAZORPAY_PLAN_ID_STARTER / _GROWTH / _SCALE are treated as **monthly**
 * if the corresponding _MONTHLY key is not set.
 *
 *   RAZORPAY_SUBSCRIPTION_TOTAL_COUNT — billing cycles for **monthly** plans (default 120)
 *   RAZORPAY_SUBSCRIPTION_TOTAL_COUNT_YEARLY — cycles for **yearly** plans (default 10)
 */

import { WA_CONFIG } from "@/lib/whatsapp/config";

export type SaasPlanCode = "starter" | "growth" | "scale";
export type SaasBillingInterval = "monthly" | "yearly";

const PLAN_ENV: Record<SaasPlanCode, Record<SaasBillingInterval, string>> = {
  starter: {
    monthly: "RAZORPAY_PLAN_ID_STARTER_MONTHLY",
    yearly: "RAZORPAY_PLAN_ID_STARTER_YEARLY"
  },
  growth: {
    monthly: "RAZORPAY_PLAN_ID_GROWTH_MONTHLY",
    yearly: "RAZORPAY_PLAN_ID_GROWTH_YEARLY"
  },
  scale: {
    monthly: "RAZORPAY_PLAN_ID_SCALE_MONTHLY",
    yearly: "RAZORPAY_PLAN_ID_SCALE_YEARLY"
  }
};

/** Pre-_MONTHLY/_YEARLY names — only used when _MONTHLY is unset. */
const LEGACY_MONTHLY_ONLY_ENV: Record<SaasPlanCode, string> = {
  starter: "RAZORPAY_PLAN_ID_STARTER",
  growth: "RAZORPAY_PLAN_ID_GROWTH",
  scale: "RAZORPAY_PLAN_ID_SCALE"
};

function readEnvKey(key: string): string | null {
  const id = process.env[key]?.trim().replace(/^["']|["']$/g, "");
  return id || null;
}

export function razorpayKeysPresent(): boolean {
  return Boolean(WA_CONFIG.razorpayKeyId?.trim() && WA_CONFIG.razorpayKeySecret?.trim());
}

export function getRazorpayPlanIdForSaasPlan(
  code: SaasPlanCode,
  interval: SaasBillingInterval
): string | null {
  const primary = readEnvKey(PLAN_ENV[code][interval]);
  if (primary) return primary;
  if (interval === "monthly") {
    const legacy = readEnvKey(LEGACY_MONTHLY_ONLY_ENV[code]);
    if (legacy) return legacy;
  }
  return null;
}

export type ConfiguredSaasPlans = Record<SaasPlanCode, Record<SaasBillingInterval, boolean>>;

/** Which tier × interval combinations have a Razorpay plan_id configured. */
export function getConfiguredSaasPlans(): ConfiguredSaasPlans {
  const codes: SaasPlanCode[] = ["starter", "growth", "scale"];
  const out = {} as ConfiguredSaasPlans;
  for (const code of codes) {
    out[code] = {
      monthly: !!getRazorpayPlanIdForSaasPlan(code, "monthly"),
      yearly: !!getRazorpayPlanIdForSaasPlan(code, "yearly")
    };
  }
  return out;
}

export function saasSubscriptionTotalCount(interval: SaasBillingInterval = "monthly"): number {
  if (interval === "yearly") {
    const raw = process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT_YEARLY?.trim();
    const n = raw ? parseInt(raw, 10) : 10;
    if (!Number.isFinite(n) || n < 1) return 10;
    return Math.min(n, 50);
  }
  const raw = process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT?.trim();
  const n = raw ? parseInt(raw, 10) : 120;
  if (!Number.isFinite(n) || n < 1) return 120;
  return Math.min(n, 999);
}

export function saasPlanCodeFromRazorpayPlanId(razorpayPlanId: string): SaasPlanCode | null {
  if (!razorpayPlanId) return null;
  for (const code of ["starter", "growth", "scale"] as SaasPlanCode[]) {
    if (getRazorpayPlanIdForSaasPlan(code, "monthly") === razorpayPlanId) return code;
    if (getRazorpayPlanIdForSaasPlan(code, "yearly") === razorpayPlanId) return code;
  }
  return null;
}

export function saasBillingIntervalFromRazorpayPlanId(razorpayPlanId: string): SaasBillingInterval | null {
  if (!razorpayPlanId) return null;
  for (const code of ["starter", "growth", "scale"] as SaasPlanCode[]) {
    if (getRazorpayPlanIdForSaasPlan(code, "yearly") === razorpayPlanId) return "yearly";
  }
  for (const code of ["starter", "growth", "scale"] as SaasPlanCode[]) {
    if (getRazorpayPlanIdForSaasPlan(code, "monthly") === razorpayPlanId) return "monthly";
  }
  return null;
}
