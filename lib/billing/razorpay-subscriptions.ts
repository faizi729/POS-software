/**
 * Razorpay Subscriptions API (REST) for platform SaaS billing.
 * No extra npm package — same Basic auth as payment links.
 */

import { WA_CONFIG } from "@/lib/whatsapp/config";
import {
  getRazorpayPlanIdForSaasPlan,
  saasSubscriptionTotalCount,
  type SaasBillingInterval,
  type SaasPlanCode
} from "@/lib/billing/razorpay-saas-config";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function authHeader(): string {
  const creds = Buffer.from(`${WA_CONFIG.razorpayKeyId}:${WA_CONFIG.razorpayKeySecret}`).toString("base64");
  return `Basic ${creds}`;
}

async function rz<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${RAZORPAY_API}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.error?.description || data?.message || text || res.statusText;
    throw new Error(`Razorpay ${res.status}: ${msg}`);
  }
  return data as T;
}

export type RazorpayCustomer = { id: string };

export async function createRazorpayCustomer(params: {
  name: string;
  email: string;
  contact?: string;
}): Promise<RazorpayCustomer> {
  const body: Record<string, unknown> = {
    name: params.name,
    email: params.email,
    fail_existing: 0
  };
  if (params.contact?.trim()) {
    body.contact = params.contact.replace(/\D/g, "").slice(-15) || "9999999999";
  }
  return rz<RazorpayCustomer>("/customers", { method: "POST", body: JSON.stringify(body) });
}

export type RazorpaySubscription = {
  id: string;
  status: string;
  short_url?: string;
  plan_id?: string;
  customer_id?: string;
};

/**
 * Create a subscription (first charge may require customer action — check short_url).
 */
export async function createRazorpaySubscription(params: {
  customerId: string;
  saasPlanCode: SaasPlanCode;
  billingInterval: SaasBillingInterval;
  tenantId: string;
  tenantSlug: string;
  totalCount?: number;
}): Promise<RazorpaySubscription> {
  const plan_id = getRazorpayPlanIdForSaasPlan(params.saasPlanCode, params.billingInterval);
  if (!plan_id) {
    throw new Error(
      `No Razorpay plan_id for ${params.saasPlanCode} (${params.billingInterval}). Set RAZORPAY_PLAN_ID_${params.saasPlanCode.toUpperCase()}_${params.billingInterval.toUpperCase()} in .env`
    );
  }

  const body = {
    plan_id,
    customer_id: params.customerId,
    customer_notify: 1,
    total_count: params.totalCount ?? saasSubscriptionTotalCount(params.billingInterval),
    quantity: 1,
    notes: {
      tenantId: params.tenantId,
      tenantSlug: params.tenantSlug,
      saasPlanCode: params.saasPlanCode,
      billingInterval: params.billingInterval,
      source: "platform_saas"
    }
  };

  return rz<RazorpaySubscription>("/subscriptions", { method: "POST", body: JSON.stringify(body) });
}

/** Razorpay GET /v1/plans/{id} (amount is in smallest currency unit, e.g. paise for INR). */
export type RazorpayPlanEntity = {
  id: string;
  period: string;
  interval: number;
  item?: {
    name?: string;
    description?: string;
    amount?: number;
    currency?: string;
  };
};

export async function fetchRazorpayPlan(planId: string): Promise<RazorpayPlanEntity> {
  return rz<RazorpayPlanEntity>(`/plans/${encodeURIComponent(planId)}`, {
    method: "GET",
    next: { revalidate: 300 }
  } as RequestInit & { next?: { revalidate: number } });
}

export async function fetchRazorpaySubscription(subscriptionId: string): Promise<RazorpaySubscription & Record<string, unknown>> {
  return rz(`/subscriptions/${subscriptionId}`, { method: "GET" });
}

export async function cancelRazorpaySubscription(
  subscriptionId: string,
  options: { cancelAtCycleEnd: boolean } = { cancelAtCycleEnd: true }
): Promise<unknown> {
  return rz(`/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancel_at_cycle_end: options.cancelAtCycleEnd })
  });
}
