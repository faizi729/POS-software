import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { Restaurant } from "@/models/Restaurant";
import { AuditLog } from "@/models/AuditLog";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  timezone: z.string().min(2).default("Asia/Kolkata"),
  currency: z.string().length(3).default("INR"),
  plan: z.enum(["starter", "growth", "scale"]).default("growth")
});

export async function GET(req: NextRequest) {
  await getSuperAdminSession(); // RBAC gate
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-tenants-get", getClientIp(req)],
    limit: 120,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const limitRaw = Number(searchParams.get("limit") || 50);
  const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 50));
  const cursor = (searchParams.get("cursor") || "").trim(); // createdAt cursor
  const direction = (searchParams.get("dir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const filter: any = {};
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { slug: new RegExp(q, "i") }];
  if (status && ["active", "suspended"].includes(status)) filter.status = status;
  if (plan && ["starter", "growth", "scale"].includes(plan)) filter.plan = plan;
  if (cursor) {
    const d = new Date(cursor);
    if (!Number.isNaN(d.getTime())) {
      filter.createdAt = direction === "desc" ? { $lt: d } : { $gt: d };
    }
  }

  const tenants = await Restaurant.find(filter)
    .select({ name: 1, slug: 1, status: 1, plan: 1, features: 1, createdAt: 1 })
    .sort({ createdAt: direction === "desc" ? -1 : 1 })
    .limit(limit)
    .lean();

  const nextCursor = tenants.length ? (tenants[tenants.length - 1] as any).createdAt?.toISOString?.() : null;
  return NextResponse.json({
    nextCursor,
    tenants: tenants.map((t: any) => ({
      id: t._id.toString(),
      name: t.name,
      slug: t.slug,
      status: t.status,
      plan: t.plan ?? "growth",
      features: t.features ?? { websiteSync: true, aiFeatures: false },
      createdAt: t.createdAt?.toISOString?.()
    }))
  });
}

export async function POST(req: NextRequest) {
  const sa = await getSuperAdminSession();
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-tenants-post", getClientIp(req)],
    limit: 30,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const exists = await Restaurant.findOne({ slug: parsed.data.slug });
  if (exists) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

  const tenant = await Restaurant.create({
    name: parsed.data.name,
    slug: parsed.data.slug,
    timezone: parsed.data.timezone,
    currency: parsed.data.currency,
    status: "active",
    plan: parsed.data.plan
  });

  await AuditLog.create({
    actorType: "platform",
    actorId: sa.platformUserId,
    actorEmail: sa.email,
    action: "tenant.create",
    targetType: "tenant",
    targetId: tenant._id.toString(),
    tenantId: tenant._id,
    meta: { slug: tenant.slug, plan: tenant.plan }
  }).catch(() => {});

  return NextResponse.json({ ok: true, tenantId: tenant._id.toString() }, { status: 201 });
}

