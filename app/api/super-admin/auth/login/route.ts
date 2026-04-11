import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db/connect";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import { signSuperAdminJwt } from "@/lib/auth/super-admin-jwt";
import { PlatformUser } from "@/models/PlatformUser";
import { isPlatformRole } from "@/lib/auth/platform-role";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(req: NextRequest) {
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-login", getClientIp(req)],
    limit: 10,
    windowMs: 60_000
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  await connectToDatabase();
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const user = await PlatformUser.findOne({
    email,
    status: "active",
    role: { $in: ["super_admin", "support", "finance", "read_only"] }
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const role = isPlatformRole(String(user.role)) ? user.role : "read_only";

  user.lastLoginAt = new Date();
  await user.save().catch(() => {});

  const token = await signSuperAdminJwt({
    platformUserId: user._id.toString(),
    role,
    email: user.email,
    name: user.name
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("sa_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return res;
}

