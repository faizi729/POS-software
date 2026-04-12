import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { sha256Hex } from "@/lib/auth/reset-token";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const bodySchema = z.object({
  token: z.string().min(32),
  restaurantSlug: z.string().min(2).max(80),
  password: z.string().min(8)
});

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit({
      request: req,
      keyParts: ["reset-pw", getClientIp(req)],
      limit: 15,
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
    const tokenHash = sha256Hex(parsed.data.token.trim());

    const restaurant = await Restaurant.findOne({ slug, status: "active" }).select("_id").lean();
    if (!restaurant) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    const user = await User.findOne({
      restaurantId: restaurant._id,
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await User.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash },
        $unset: { passwordResetTokenHash: 1, passwordResetExpires: 1 }
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth][reset-password] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
