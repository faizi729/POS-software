import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { assertCanMutate } from "@/lib/auth/super-admin-permissions";
import { signAuthJwt } from "@/lib/auth/jwt";
import { Restaurant, User, AuditLog } from "@/models";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const schema = z.object({ tenantId: z.string().min(1) });

function isFormRequest(contentType: string) {
  return (
    contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")
  );
}

export async function POST(req: NextRequest) {
  const contentTypeEarly = req.headers.get("content-type") || "";
  const formEarly = isFormRequest(contentTypeEarly);

  const sa = await getSuperAdminSession();
  try {
    assertCanMutate(sa, "impersonate");
  } catch (e: any) {
    if (e?.statusCode === 403) {
      return formEarly
        ? NextResponse.redirect(new URL("/super-admin/security?forbidden=impersonate", req.url))
        : NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw e;
  }
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-impersonate", getClientIp(req)],
    limit: 30,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();

  const contentType = contentTypeEarly;
  const form = formEarly;
  const body = form ? Object.fromEntries((await req.formData()).entries()) : await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return form
      ? NextResponse.redirect(new URL("/super-admin/tenants?impersonate=invalid", req.url))
      : NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const tenantId = parsed.data.tenantId;
  if (!Types.ObjectId.isValid(tenantId)) {
    return form
      ? NextResponse.redirect(new URL("/super-admin/tenants?impersonate=invalid", req.url))
      : NextResponse.json({ error: "Invalid tenantId" }, { status: 400 });
  }

  const restaurant = await Restaurant.findById(tenantId).lean();
  if (!restaurant) {
    return form
      ? NextResponse.redirect(new URL(`/super-admin/tenants/${tenantId}?impersonate=notfound`, req.url))
      : NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const user = await User.findOne({ restaurantId: restaurant._id, role: "owner", status: "active" }).lean();
  if (!user) {
    return form
      ? NextResponse.redirect(new URL(`/super-admin/tenants/${tenantId}?impersonate=no_owner`, req.url))
      : NextResponse.json({ error: "No active owner user found for tenant" }, { status: 404 });
  }

  const token = await signAuthJwt({
    userId: (user as any)._id.toString(),
    restaurantId: (restaurant as any)._id.toString(),
    role: (user as any).role,
    name: (user as any).name
  });

  await AuditLog.create({
    actorType: "platform",
    actorId: sa.platformUserId,
    actorEmail: sa.email,
    action: "tenant.impersonate",
    targetType: "tenant",
    targetId: (restaurant as any)._id.toString(),
    tenantId: (restaurant as any)._id,
    meta: { tenantSlug: (restaurant as any).slug, impersonatedUserId: (user as any)._id.toString() }
  }).catch(() => {});

  if (form) {
    const res = NextResponse.redirect(new URL("/dashboard", req.url));
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
    return res;
  }

  const res = NextResponse.json({ ok: true, redirectTo: "/dashboard" });
  res.cookies.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return res;
}

