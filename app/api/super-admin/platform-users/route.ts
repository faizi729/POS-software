import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { hashPassword } from "@/lib/auth/password";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { assertCanMutate } from "@/lib/auth/super-admin-permissions";
import { PlatformUser } from "@/models/PlatformUser";
import { AuditLog } from "@/models/AuditLog";
import { PLATFORM_ROLES } from "@/lib/auth/platform-role";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(12),
  role: z.enum(["super_admin", "support", "finance", "read_only"])
});

export async function GET(req: NextRequest) {
  await getSuperAdminSession();
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-pusers-get", getClientIp(req)],
    limit: 120,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();

  const users = await PlatformUser.find({})
    .select({ email: 1, name: 1, role: 1, status: 1, lastLoginAt: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    roles: [...PLATFORM_ROLES],
    users: users.map((u: any) => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      lastLoginAt: u.lastLoginAt?.toISOString?.() ?? null,
      createdAt: u.createdAt?.toISOString?.()
    }))
  });
}

export async function POST(req: NextRequest) {
  const sa = await getSuperAdminSession();
  try {
    assertCanMutate(sa, "platform_user_admin");
  } catch (e: any) {
    if (e?.statusCode === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-pusers-post", getClientIp(req)],
    limit: 20,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await PlatformUser.findOne({ email });
  if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await PlatformUser.create({
    email,
    name: parsed.data.name,
    passwordHash,
    role: parsed.data.role,
    status: "active"
  });

  await AuditLog.create({
    actorType: "platform",
    actorId: sa.platformUserId,
    actorEmail: sa.email,
    action: "platform_user.create",
    targetType: "platform_user",
    targetId: user._id.toString(),
    meta: { email, role: parsed.data.role }
  }).catch(() => {});

  return NextResponse.json({ ok: true, id: user._id.toString() }, { status: 201 });
}
