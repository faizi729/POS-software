import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { signAuthJwt, verifyPendingTwoFactorJwt } from "@/lib/auth/jwt";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const bodySchema = z.object({
  pendingToken: z.string().min(20),
  code: z.string().regex(/^\d{6}$/)
});

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit({
      request: req,
      keyParts: ["login-2fa", getClientIp(req)],
      limit: 30,
      windowMs: 60_000
    });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
    }

    await connectToDatabase();
    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    let pending;
    try {
      pending = await verifyPendingTwoFactorJwt(parsed.data.pendingToken);
    } catch {
      return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
    }

    const user = await User.findOne({
      _id: new Types.ObjectId(pending.userId),
      restaurantId: new Types.ObjectId(pending.restaurantId)
    });

    if (
      !user ||
      !user.twoFactorOtpHash ||
      !user.twoFactorOtpExpires ||
      user.twoFactorOtpExpires.getTime() < Date.now()
    ) {
      return NextResponse.json({ error: "Invalid or expired code. Sign in again." }, { status: 401 });
    }

    const okCode = await verifyPassword(parsed.data.code, user.twoFactorOtpHash);
    if (!okCode) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    }

    await User.updateOne(
      { _id: user._id },
      { $unset: { twoFactorOtpHash: 1, twoFactorOtpExpires: 1 } }
    );

    const token = await signAuthJwt({
      userId: user._id.toString(),
      restaurantId: pending.restaurantId,
      role: user.role,
      name: user.name
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
    return res;
  } catch (err) {
    console.error("[auth][verify-2fa] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
