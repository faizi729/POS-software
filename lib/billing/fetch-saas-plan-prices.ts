import {
  getRazorpayPlanIdForSaasPlan,
  razorpayKeysPresent,
  type SaasBillingInterval,
  type SaasPlanCode
} from "@/lib/billing/razorpay-saas-config";
import { fetchRazorpayPlan, type RazorpayPlanEntity } from "@/lib/billing/razorpay-subscriptions";

export type SaasPlanPriceSlot = {
  planId: string | null;
  /** e.g. ₹4,999 / month */
  display: string | null;
  itemName: string | null;
  error: string | null;
};

export type SaasTierPricing = Record<SaasPlanCode, Record<SaasBillingInterval, SaasPlanPriceSlot>>;

function emptySlot(planId: string | null, error: string | null): SaasPlanPriceSlot {
  return { planId, display: null, itemName: null, error };
}

function formatPlanLine(plan: RazorpayPlanEntity): { display: string; itemName: string | null } {
  const item = plan.item;
  const amount = item?.amount;
  const currency = (item?.currency || "INR").toUpperCase();
  const major = typeof amount === "number" ? amount / 100 : null;
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  const formatted =
    major == null
      ? "—"
      : Number.isInteger(major)
        ? major.toLocaleString("en-IN")
        : major.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const interval = Number(plan.interval) > 0 ? Number(plan.interval) : 1;
  const period = String(plan.period || "").toLowerCase();
  let suffix: string;
  if (period === "monthly") suffix = interval === 1 ? "month" : `${interval} months`;
  else if (period === "yearly") suffix = interval === 1 ? "year" : `${interval} years`;
  else if (period === "weekly") suffix = interval === 1 ? "week" : `${interval} weeks`;
  else if (period === "daily") suffix = interval === 1 ? "day" : `${interval} days`;
  else suffix = period || "cycle";

  const display = major == null ? "—" : `${symbol}${formatted} / ${suffix}`;
  return { display, itemName: item?.name?.trim() || null };
}

/**
 * Loads plan item amount + period from Razorpay for each configured env plan_id.
 */
export async function loadSaasTierPricingFromRazorpay(): Promise<SaasTierPricing> {
  const codes: SaasPlanCode[] = ["starter", "growth", "scale"];
  const intervals: SaasBillingInterval[] = ["monthly", "yearly"];

  const out = {} as SaasTierPricing;
  for (const code of codes) {
    out[code] = {
      monthly: emptySlot(getRazorpayPlanIdForSaasPlan(code, "monthly"), null),
      yearly: emptySlot(getRazorpayPlanIdForSaasPlan(code, "yearly"), null)
    };
  }

  if (!razorpayKeysPresent()) {
    for (const code of codes) {
      for (const iv of intervals) {
        if (!out[code][iv].planId) out[code][iv].error = "Not configured";
        else out[code][iv].error = "Razorpay keys missing";
      }
    }
    return out;
  }

  await Promise.all(
    codes.flatMap((code) =>
      intervals.map(async (iv) => {
        const planId = out[code][iv].planId;
        if (!planId) {
          out[code][iv].error = "Not configured";
          return;
        }
        try {
          const plan = await fetchRazorpayPlan(planId);
          const { display, itemName } = formatPlanLine(plan);
          out[code][iv] = { planId, display, itemName, error: null };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Failed to load plan";
          out[code][iv] = { planId, display: null, itemName: null, error: msg };
        }
      })
    )
  );

  return out;
}
