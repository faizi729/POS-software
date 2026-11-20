import { NextRequest, NextResponse } from "next/server";
import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant, type RestaurantDocument } from "@/models/Restaurant";
import { User, type UserDocument } from "@/models/User";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signAuthJwt, signPendingTwoFactorJwt } from "@/lib/auth/jwt";
import { generateSixDigitOtp } from "@/lib/auth/otp";
import { isMailConfigured, sendMail } from "@/lib/email/send-mail";
import { buildLoginOtpEmail } from "@/lib/email/auth-emails";
import { z } from "zod";
import { getTenantSlugFromHost } from "@/lib/auth/tenant";
import { getRequestHost, getSubdomainFromHost } from "@/lib/tenant/host";
import { resolveRestaurantIdByHost, resolveRestaurantIdBySlug } from "@/lib/auth/tenant-resolver";
import { fail } from "@/lib/api/response";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  /** Used when the request host does not map to a tenant (localhost, apex domain, shared app URL). */
  restaurantSlug: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit({
      request: req,
      keyParts: ["login", getClientIp(req)],
      limit: 20,
      windowMs: 60_000,
      onHit: () => console.warn("[rate-limit] /api/auth/login")
    });
    if (!rl.ok) {
      return fail("Too many requests. Try again in a minute.", 429);
    }

    await connectToDatabase();
    const json = await req.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email, password } = parsed.data;
    const { host } = await getRequestHost();
    const subdomain = getSubdomainFromHost(host);

    const rid =
      (host ? await resolveRestaurantIdByHost(host) : null) ||
      (subdomain ? await resolveRestaurantIdBySlug(subdomain) : null) ||
      // fallback to legacy helper (subdomain only)
      (await (async () => {
        const slugFromHost = await getTenantSlugFromHost();
        return slugFromHost ? await resolveRestaurantIdBySlug(slugFromHost) : null;
      })());

    // Resolve the workspace automatically:
    //  1. host/subdomain/custom domain wins (per-domain isolation),
    //  2. else a legacy API caller may still send a slug,
    //  3. else normal login: email + password only (email is unique per workspace,
    //     so the password decides which workspace you belong to).
    const slugFromBody = parsed.data.restaurantSlug?.trim().toLowerCase() || null;

    let restaurant: HydratedDocument<RestaurantDocument> | null = null;
    let user: HydratedDocument<UserDocument> | null = null;

    if (rid) {
      restaurant = await Restaurant.findOne({ _id: rid, status: "active" });
      if (restaurant) user = await User.findOne({ restaurantId: restaurant._id, email });
    } else if (slugFromBody) {
      restaurant = await Restaurant.findOne({ slug: slugFromBody, status: "active" });
      if (restaurant) user = await User.findOne({ restaurantId: restaurant._id, email });
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

        const matches: Array<HydratedDocument<UserDocument>> = [];
        for (const candidate of candidates) {
          if (!activeSet.has(String(candidate.restaurantId))) continue;
          if (await verifyPassword(password, candidate.passwordHash)) matches.push(candidate);
        }

        if (matches.length > 1) {
          return NextResponse.json(
            { error: "This email belongs to more than one workspace. Sign in from your workspace URL." },
            { status: 409 }
          );
        }

        if (matches.length === 1) {
          user = matches[0];
          restaurant = await Restaurant.findById(user.restaurantId);
        }
      }
    }

    if (!restaurant || !user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const payload = {
      userId: user._id.toString(),
      restaurantId: restaurant._id.toString(),
      role: user.role,
      name: user.name
    };

    const need2fa = user.twoFactorEnabled === true && isMailConfigured();
    if (need2fa) {
      const otp = generateSixDigitOtp();
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            twoFactorOtpHash: await hashPassword(otp),
            twoFactorOtpExpires: new Date(Date.now() + 10 * 60 * 1000)
          }
        }
      );
      const { subject, text, html } = buildLoginOtpEmail(otp);
      const mailed = await sendMail({ to: user.email, subject, text, html });
      if (mailed.skipped) {
        console.error("[auth][login] 2FA enabled but email skipped");
        return NextResponse.json(
          { error: "Email could not be sent. Check SMTP settings or ask an admin to disable two-factor for your account." },
          { status: 503 }
        );
      }
      const pendingToken = await signPendingTwoFactorJwt(payload);
      return NextResponse.json({ ok: true, needsTwoFactor: true, pendingToken });
    }

    if (user.twoFactorEnabled === true && !isMailConfigured()) {
      console.warn(
        "[auth][login] twoFactorEnabled=true but SMTP not configured; signing in without OTP (configure SMTP_HOST / SMTP_FROM)"
      );
    }

    const token = await signAuthJwt(payload);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
    return res;
  } catch (err) {
    console.error("[auth][login] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

