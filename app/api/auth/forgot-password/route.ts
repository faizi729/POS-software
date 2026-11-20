import { NextRequest, NextResponse } from "next/server";
import type { HydratedDocument } from "mongoose";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { User, type UserDocument } from "@/models/User";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { randomResetToken, sha256Hex } from "@/lib/auth/reset-token";
import { buildPasswordResetEmail } from "@/lib/email/auth-emails";
import { isMailConfigured, sendMail } from "@/lib/email/send-mail";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  /** Legacy: scope the reset to one workspace. Not needed for normal email login. */
  restaurantSlug: z.string().min(2).max(80).optional()
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
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const slug = parsed.data.restaurantSlug?.trim().toLowerCase() || null;
    const generic = {
      ok: true,
      message: "If an account exists for that email, we sent reset instructions."
    };

    let users: Array<HydratedDocument<UserDocument>> = [];

    if (slug) {
      const restaurant = await Restaurant.findOne({ slug, status: "active" }).select("_id").lean();
      if (restaurant) {
        const user = await User.findOne({ restaurantId: restaurant._id, email, status: "active" });
        if (user) users = [user] as Array<HydratedDocument<UserDocument>>;
      }
    } else {
      const candidates = await User.find({ email, status: "active" }).limit(5);
      if (candidates.length) {
        const active = await Restaurant.find({
          _id: { $in: candidates.map((candidate) => candidate.restaurantId) },
          status: "active"
        })
          .select("_id")
          .lean();
        const activeSet = new Set(active.map((row) => String(row._id)));
        users = candidates.filter((candidate) =>
          activeSet.has(String(candidate.restaurantId))
        ) as Array<HydratedDocument<UserDocument>>;
      }
    }

    if (!users.length) return NextResponse.json(generic);

    if (!isMailConfigured()) {
      console.warn("[auth][forgot-password] SMTP not configured; cannot send reset email");
      return NextResponse.json({
        ok: false,
        error: "Password reset by email is not configured (missing SMTP). Contact your administrator."
      });
    }

    const base = getAppBaseUrl();

    // A shared email across workspaces gets one link per account — all to the same inbox.
    for (const user of users) {
      const raw = randomResetToken();
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetTokenHash: sha256Hex(raw),
            passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000)
          }
        }
      );

      const resetUrl = `${base}/reset-password?token=${encodeURIComponent(raw)}`;
      const { subject, text, html } = buildPasswordResetEmail(resetUrl);
      await sendMail({ to: user.email, subject, text, html }).catch((err) =>
        console.error("[auth][forgot-password] send failed", err)
      );
    }

    return NextResponse.json(generic);
  } catch (err) {
    console.error("[auth][forgot-password] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
