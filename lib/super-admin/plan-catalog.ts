/**
 * In-app tier metadata (sync with Restaurant.plan enum).
 * `monthlyInr` is only for reference MRR / offline quotes when Razorpay is not used;
 * with Razorpay keys set, real charges come from Dashboard Plans linked via env plan IDs.
 */
export const PLAN_CATALOG = {
  starter: {
    code: "starter" as const,
    name: "Starter",
    monthlyInr: 4_999,
    limits: { outlets: 1, registers: 2, staffSeats: 8, includedWhatsappMo: 500 }
  },
  growth: {
    code: "growth" as const,
    name: "Growth",
    monthlyInr: 9_999,
    limits: { outlets: 3, registers: 6, staffSeats: 25, includedWhatsappMo: 2_000 }
  },
  scale: {
    code: "scale" as const,
    name: "Scale",
    monthlyInr: 0,
    limits: { outlets: 999, registers: 999, staffSeats: 999, includedWhatsappMo: 10_000 },
    note: "Custom pricing — set per contract."
  }
} as const;

export type PlanCode = keyof typeof PLAN_CATALOG;

export function estimatedMrrInr(planCounts: Record<string, number>): number {
  let sum = 0;
  for (const [plan, n] of Object.entries(planCounts)) {
    if (plan === "none") continue;
    const p = PLAN_CATALOG[plan as PlanCode];
    if (p && p.monthlyInr > 0) sum += p.monthlyInr * n;
  }
  return sum;
}
