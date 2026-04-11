import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { assertCanMutate } from "@/lib/auth/super-admin-permissions";
import { Restaurant } from "@/models/Restaurant";
import { AuditLog } from "@/models/AuditLog";
import { razorpayKeysPresent } from "@/lib/billing/razorpay-saas-config";
import { createRazorpayCustomer, createRazorpaySubscription, cancelRazorpaySubscription } from "@/lib/billing/razorpay-subscriptions";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const postSchema = z.object({
  planCode: z.enum(["starter", "growth", "scale"]),
  billingInterval: z.enum(["monthly", "yearly"]).default("monthly"),
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  contact: z.string().optional()
});

function oid(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return new Types.ObjectId(id);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sa = await getSuperAdminSession();
  try {
    assertCanMutate(sa, "tenant_write");
  } catch (e: any) {
    if (e?.statusCode === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-rz-sub", getClientIp(req)],
    limit: 40,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  if (!razorpayKeysPresent()) {
    return NextResponse.json(
      { error: "Razorpay keys not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)" },
      { status: 503 }
    );
  }

  await connectToDatabase();
  const { id } = await ctx.params;
  const restaurantId = oid(id);
  if (!restaurantId) return NextResponse.json({ error: "Invalid tenant id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const tenant = await Restaurant.findById(restaurantId).lean();
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const tx = tenant as any;
  if (tx.razorpaySubscriptionId) {
    return NextResponse.json(
      { error: "Tenant already has a Razorpay subscription. Cancel it first or use Razorpay dashboard." },
      { status: 409 }
    );
  }

  const email =
    parsed.data.customerEmail?.trim() ||
    tx.billingEmail?.trim() ||
    tx.contact?.email?.trim();
  if (!email) {
    return NextResponse.json(
      { error: "Missing billing email — set tenant billing email or pass customerEmail" },
      { status: 400 }
    );
  }

  const name = parsed.data.customerName?.trim() || tx.name || "Customer";
  const contact = parsed.data.contact?.trim() || tx.contact?.phone?.trim() || undefined;

  let customerId = tx.razorpayCustomerId?.trim();
  if (!customerId) {
    const customer = await createRazorpayCustomer({ name, email, contact });
    customerId = customer.id;
    await Restaurant.findByIdAndUpdate(restaurantId, { $set: { razorpayCustomerId: customerId } });
  }

  const sub = await createRazorpaySubscription({
    customerId,
    saasPlanCode: parsed.data.planCode,
    billingInterval: parsed.data.billingInterval,
    tenantId: restaurantId.toString(),
    tenantSlug: tx.slug
  });

  await Restaurant.findByIdAndUpdate(restaurantId, {
    $set: {
      razorpaySubscriptionId: sub.id,
      plan: parsed.data.planCode,
      saasBillingInterval: parsed.data.billingInterval,
      subscriptionStatus: "trial"
    }
  });

  await AuditLog.create({
    actorType: "platform",
    actorId: sa.platformUserId,
    actorEmail: sa.email,
    action: "billing.razorpay.subscription.create",
    targetType: "tenant",
    targetId: id,
    tenantId: restaurantId,
    meta: {
      razorpaySubscriptionId: sub.id,
      planCode: parsed.data.planCode,
      billingInterval: parsed.data.billingInterval,
      razorpayStatus: sub.status
    }
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    subscriptionId: sub.id,
    status: sub.status,
    shortUrl: sub.short_url ?? null,
    message: sub.short_url
      ? "Share short_url with customer to complete first payment if required."
      : "Subscription created."
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sa = await getSuperAdminSession();
  try {
    assertCanMutate(sa, "tenant_write");
  } catch (e: any) {
    if (e?.statusCode === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-rz-sub-del", getClientIp(req)],
    limit: 40,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  if (!razorpayKeysPresent()) {
    return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 503 });
  }

  await connectToDatabase();
  const { id } = await ctx.params;
  const restaurantId = oid(id);
  if (!restaurantId) return NextResponse.json({ error: "Invalid tenant id" }, { status: 400 });

  const tenant = await Restaurant.findById(restaurantId).lean();
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const subId = (tenant as any).razorpaySubscriptionId?.trim();
  if (!subId) {
    return NextResponse.json({ error: "No Razorpay subscription on this tenant" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const immediate = searchParams.get("immediate") === "1";

  await cancelRazorpaySubscription(subId, { cancelAtCycleEnd: !immediate });

  await AuditLog.create({
    actorType: "platform",
    actorId: sa.platformUserId,
    actorEmail: sa.email,
    action: "billing.razorpay.subscription.cancel",
    targetType: "tenant",
    targetId: id,
    tenantId: restaurantId,
    meta: { razorpaySubscriptionId: subId, immediate }
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    message: immediate
      ? "Cancellation requested at Razorpay (immediate)."
      : "Subscription will cancel at end of current billing cycle."
  });
}
