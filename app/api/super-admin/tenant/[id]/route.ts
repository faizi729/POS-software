import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { Restaurant } from "@/models/Restaurant";
import { AuditLog } from "@/models/AuditLog";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  plan: z.enum(["starter", "growth", "scale"]).optional(),
  features: z
    .object({
      websiteSync: z.boolean().optional(),
      aiFeatures: z.boolean().optional()
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
    .select({ name: 1, slug: 1, status: 1, plan: 1, features: 1, createdAt: 1, settings: 1, currency: 1, timezone: 1 })
    .lean();
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    tenant: {
      id: t._id.toString(),
      name: t.name,
      slug: t.slug,
      status: t.status,
      plan: (t as any).plan ?? "growth",
      features: (t as any).features ?? { websiteSync: true, aiFeatures: false },
      createdAt: (t as any).createdAt?.toISOString?.()
    }
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sa = await getSuperAdminSession();
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
  if (parsed.data.plan) set.plan = parsed.data.plan;
  if (parsed.data.features) {
    if (typeof parsed.data.features.websiteSync === "boolean") set["features.websiteSync"] = parsed.data.features.websiteSync;
    if (typeof parsed.data.features.aiFeatures === "boolean") set["features.aiFeatures"] = parsed.data.features.aiFeatures;
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

