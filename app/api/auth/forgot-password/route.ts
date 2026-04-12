import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { User } from "@/models/User";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { randomResetToken, sha256Hex } from "@/lib/auth/reset-token";
import { buildPasswordResetEmail } from "@/lib/email/auth-emails";
import { isMailConfigured, sendMail } from "@/lib/email/send-mail";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  restaurantSlug: z.string().min(2).max(80)
});

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit({
      request: req,
      keyParts: ["forgot-pw", getClientIp(req)],
      limit: 10,
      windowMs: 60_000
    });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    await connectToDatabase();
    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const slug = parsed.data.restaurantSlug.trim().toLowerCase();
    const restaurant = await Restaurant.findOne({ slug, status: "active" }).lean();
    const generic = {
      ok: true,
      message: "If an account exists for that workspace and email, we sent reset instructions."
    };

    if (!restaurant) {
      return NextResponse.json(generic);
    }

    const user = await User.findOne({
      restaurantId: restaurant._id,
      email: parsed.data.email.trim().toLowerCase(),
      status: "active"
    });

    if (!user) {
      return NextResponse.json(generic);
    }

    if (!isMailConfigured()) {
      console.warn("[auth][forgot-password] SMTP not configured; cannot send reset email");
      return NextResponse.json({
        ok: false,
        error: "Password reset by email is not configured (missing SMTP). Contact your administrator."
      });
    }

    const raw = randomResetToken();
    const passwordResetTokenHash = sha256Hex(raw);
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      { $set: { passwordResetTokenHash, passwordResetExpires } }
    );

    const base = getAppBaseUrl();
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(raw)}&slug=${encodeURIComponent(slug)}`;
    const { subject, text, html } = buildPasswordResetEmail(resetUrl);
    await sendMail({ to: user.email, subject, text, html }).catch((err) =>
      console.error("[auth][forgot-password] send failed", err)
    );

    return NextResponse.json(generic);
  } catch (err) {
    console.error("[auth][forgot-password] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
