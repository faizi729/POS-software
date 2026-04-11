import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { assertCanMutate } from "@/lib/auth/super-admin-permissions";
import { Restaurant } from "@/models/Restaurant";
import { AuditLog } from "@/models/AuditLog";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  plan: z.enum(["none", "starter", "growth", "scale"]).optional(),
  subscriptionStatus: z.enum(["trial", "active", "past_due", "suspended", "churned"]).optional(),
  trialEndsAt: z.string().nullable().optional(),
  billingEmail: z.union([z.string().email(), z.literal("")]).optional(),
  notesInternal: z.string().max(8000).optional(),
  features: z
    .object({
      websiteSync: z.boolean().optional(),
      aiFeatures: z.boolean().optional(),
      whatsappOrdering: z.boolean().optional(),
      qrOrdering: z.boolean().optional()
    })
    .optional()
});

function toObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return new Types.ObjectId(id);
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await getSuperAdminSession();
  const rl = await rateLimit({
    request: _,
    keyParts: ["sa-tenant-get", getClientIp(_)],
    limit: 180,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();
  const { id } = await ctx.params;
  const oid = toObjectId(id);
  if (!oid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const t = await Restaurant.findById(oid)
    .select({
      name: 1,
      slug: 1,
      status: 1,
      plan: 1,
      subscriptionStatus: 1,
      trialEndsAt: 1,
      billingEmail: 1,
      notesInternal: 1,
      features: 1,
      createdAt: 1,
      settings: 1,
      currency: 1,
      timezone: 1,
      subdomain: 1,
      customDomain: 1,
      contact: 1,
      razorpayCustomerId: 1,
      razorpaySubscriptionId: 1
    })
    .lean();
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tx = t as any;
  return NextResponse.json({
    tenant: {
      id: t._id.toString(),
      name: t.name,
      slug: t.slug,
      status: t.status,
      plan: tx.plan ?? "none",
      subscriptionStatus: tx.subscriptionStatus ?? "active",
      trialEndsAt: tx.trialEndsAt?.toISOString?.() ?? null,
      billingEmail: tx.billingEmail ?? "",
      notesInternal: tx.notesInternal ?? "",
      features: tx.features ?? {
        websiteSync: true,
        aiFeatures: false,
        whatsappOrdering: true,
        qrOrdering: true
      },
      createdAt: tx.createdAt?.toISOString?.(),
      timezone: tx.timezone,
      currency: tx.currency,
      subdomain: tx.subdomain ?? "",
      customDomain: tx.customDomain ?? "",
      contact: tx.contact ?? {},
      razorpayCustomerId: tx.razorpayCustomerId ?? "",
      razorpaySubscriptionId: tx.razorpaySubscriptionId ?? ""
    }
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sa = await getSuperAdminSession();
  try {
    assertCanMutate(sa, "tenant_write");
  } catch (e: any) {
    if (e?.statusCode === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-tenant-patch", getClientIp(req)],
    limit: 120,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();
  const { id } = await ctx.params;
  const oid = toObjectId(id);
  if (!oid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const before = await Restaurant.findById(oid).lean();
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const set: any = {};
  if (parsed.data.name) set.name = parsed.data.name;
  if (parsed.data.status) set.status = parsed.data.status;
  if (parsed.data.plan !== undefined) set.plan = parsed.data.plan;
  if (parsed.data.subscriptionStatus) set.subscriptionStatus = parsed.data.subscriptionStatus;
  if (parsed.data.trialEndsAt !== undefined) {
    const raw = parsed.data.trialEndsAt;
    if (!raw || String(raw).trim() === "") set.trialEndsAt = null;
    else {
      const d = new Date(raw);
      set.trialEndsAt = Number.isNaN(d.getTime()) ? null : d;
    }
  }
  if (parsed.data.billingEmail !== undefined) set.billingEmail = parsed.data.billingEmail || "";
  if (parsed.data.notesInternal !== undefined) set.notesInternal = parsed.data.notesInternal;
  if (parsed.data.features) {
    if (typeof parsed.data.features.websiteSync === "boolean") set["features.websiteSync"] = parsed.data.features.websiteSync;
    if (typeof parsed.data.features.aiFeatures === "boolean") set["features.aiFeatures"] = parsed.data.features.aiFeatures;
    if (typeof parsed.data.features.whatsappOrdering === "boolean")
      set["features.whatsappOrdering"] = parsed.data.features.whatsappOrdering;
    if (typeof parsed.data.features.qrOrdering === "boolean") set["features.qrOrdering"] = parsed.data.features.qrOrdering;
  }

  const updated = await Restaurant.findByIdAndUpdate(oid, { $set: set }, { new: true }).lean();

  await AuditLog.create({
    actorType: "platform",
    actorId: sa.platformUserId,
    actorEmail: sa.email,
    action: "tenant.update",
    targetType: "tenant",
    targetId: id,
    tenantId: oid,
    meta: { before: { name: (before as any).name, status: (before as any).status, plan: (before as any).plan, features: (before as any).features }, set }
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    tenant: updated
      ? {
          id: (updated as any)._id.toString(),
          name: (updated as any).name,
          slug: (updated as any).slug,
          status: (updated as any).status,
          plan: (updated as any).plan,
          features: (updated as any).features
        }
      : null
  });
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sa = await getSuperAdminSession();
  try {
    assertCanMutate(sa, "tenant_write");
  } catch (e: any) {
    if (e?.statusCode === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
  const rl = await rateLimit({
    request: _,
    keyParts: ["sa-tenant-delete", getClientIp(_)],
    limit: 60,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();
  const { id } = await ctx.params;
  const oid = toObjectId(id);
  if (!oid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const tenant = await Restaurant.findById(oid).lean();
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Production-safe default: soft-suspend instead of deleting tenant data.
  await Restaurant.findByIdAndUpdate(oid, { $set: { status: "suspended" } });

  await AuditLog.create({
    actorType: "platform",
    actorId: sa.platformUserId,
    actorEmail: sa.email,
    action: "tenant.suspend",
    targetType: "tenant",
    targetId: id,
    tenantId: oid,
    meta: { slug: (tenant as any).slug }
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}

