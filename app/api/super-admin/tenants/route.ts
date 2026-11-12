import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { assertCanMutate } from "@/lib/auth/super-admin-permissions";
import { hashPassword } from "@/lib/auth/password";
import { Restaurant } from "@/models/Restaurant";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const createSchema = z
  .object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    timezone: z.string().min(2).default("Asia/Kolkata"),
    currency: z.string().length(3).default("INR"),
    plan: z.enum(["none", "starter", "growth", "scale"]).default("none"),
    enabledModules: z.array(z.enum(["pos", "rooms", "banquet"])).min(1).default(["pos"]),
    // Optional owner account, created together with the tenant.
    ownerName: z.string().min(2).max(80).optional(),
    ownerEmail: z.string().email().optional(),
    ownerPassword: z.string().min(8).max(200).optional(),
    twoFactorEnabled: z.boolean().optional()
  })
  .superRefine((val, ctx) => {
    const hasEmail = Boolean(val.ownerEmail);
    const hasPassword = Boolean(val.ownerPassword);
    if (hasEmail !== hasPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasEmail ? "ownerPassword" : "ownerEmail"],
        message: "ownerEmail and ownerPassword must be provided together"
      });
    }
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
  if (plan && ["none", "starter", "growth", "scale"].includes(plan)) filter.plan = plan;
  if (cursor) {
    const d = new Date(cursor);
    if (!Number.isNaN(d.getTime())) {
      filter.createdAt = direction === "desc" ? { $lt: d } : { $gt: d };
    }
  }

  const tenants = await Restaurant.find(filter)
    .select({ name: 1, slug: 1, status: 1, plan: 1, subscriptionStatus: 1, features: 1, createdAt: 1 })
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
      plan: t.plan ?? "none",
      subscriptionStatus: (t as any).subscriptionStatus ?? "active",
      features: t.features ?? { websiteSync: true, aiFeatures: false },
      createdAt: t.createdAt?.toISOString?.()
    }))
  });
}

export async function POST(req: NextRequest) {
  const sa = await getSuperAdminSession();
  try {
    assertCanMutate(sa, "tenant_write");
  } catch (e: any) {
    if (e?.statusCode === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
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
    plan: parsed.data.plan,
    enabledModules: parsed.data.enabledModules
  });

  let ownerId: string | null = null;
  if (parsed.data.ownerEmail && parsed.data.ownerPassword) {
    try {
      const passwordHash = await hashPassword(parsed.data.ownerPassword);
      const owner = await User.create({
        restaurantId: tenant._id,
        name: (parsed.data.ownerName || "Owner").trim(),
        email: parsed.data.ownerEmail.trim().toLowerCase(),
        passwordHash,
        role: "owner",
        status: "active",
        twoFactorEnabled: Boolean(parsed.data.twoFactorEnabled)
      });

      await Restaurant.updateOne({ _id: tenant._id }, { $set: { ownerId: owner._id } }).catch(() => {});
      ownerId = owner._id.toString();

      await AuditLog.create({
        actorType: "platform",
        actorId: sa.platformUserId,
        actorEmail: sa.email,
        action: "tenant.owner.create",
        targetType: "user",
        targetId: ownerId,
        tenantId: tenant._id,
        meta: {
          email: owner.email,
          tenantSlug: tenant.slug,
          twoFactorEnabled: Boolean(parsed.data.twoFactorEnabled)
        }
      }).catch(() => {});
    } catch (err: any) {
      return NextResponse.json(
        {
          error: `Tenant created (slug "${tenant.slug}") but the owner account failed: ${
            err?.message || "unknown error"
          }. Add the owner from the tenant page.`,
          tenantId: tenant._id.toString()
        },
        { status: 500 }
      );
    }
  }

  await AuditLog.create({
    actorType: "platform",
    actorId: sa.platformUserId,
    actorEmail: sa.email,
    action: "tenant.create",
    targetType: "tenant",
    targetId: tenant._id.toString(),
    tenantId: tenant._id,
    meta: { slug: tenant.slug, plan: tenant.plan, modules: tenant.enabledModules }
  }).catch(() => {});

  return NextResponse.json({ ok: true, tenantId: tenant._id.toString(), ownerId }, { status: 201 });
}

