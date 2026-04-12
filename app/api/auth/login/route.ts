import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { User } from "@/models/User";
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
  // Dev-only escape hatch for localhost where host-based tenant resolution isn't available.
  // In production, tenant must be derived from host/custom domain.
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

    // In production, never trust body for tenant identity.
    let restaurantQuery: any = { status: "active" };
    if (rid) {
      restaurantQuery._id = rid;
    } else {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Missing tenant host (use subdomain/custom domain)" },
          { status: 400 }
        );
      }
      const slugFromBody = parsed.data.restaurantSlug?.trim().toLowerCase() || null;
      if (!slugFromBody) {
        return NextResponse.json(
          { error: "Missing restaurant/workspace identifier" },
          { status: 400 }
        );
      }
      restaurantQuery.slug = slugFromBody;
    }

    const restaurant = await Restaurant.findOne(restaurantQuery);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const user = await User.findOne({ restaurantId: restaurant._id, email });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
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

