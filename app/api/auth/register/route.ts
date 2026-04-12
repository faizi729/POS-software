import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { z } from "zod";
import { signAuthJwt } from "@/lib/auth/jwt";
import { isMailConfigured, sendMail } from "@/lib/email/send-mail";
import { buildWelcomeEmail } from "@/lib/email/auth-emails";

const registerSchema = z.object({
  restaurantName: z.string().min(2),
  restaurantSlug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  email: z.string().email(),
  password: z.string().min(8),
  /** When false, disables email OTP for this account (only if SMTP is configured). */
  enableEmailTwoFactor: z.boolean().optional()
});

function isDuplicateKeyError(err: unknown): err is { code: number; keyPattern?: Record<string, unknown> } {
  const e = err as { code?: number };
  return e?.code === 11000;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MONGODB_URI?.trim()) {
      console.error("[auth][register] MONGODB_URI is missing");
      return NextResponse.json(
        {
          error:
            "Database is not configured. Set MONGODB_URI in your server environment (e.g. hosting dashboard → Environment Variables)."
        },
        { status: 500 }
      );
    }
    if (!process.env.JWT_SECRET?.trim()) {
      console.error("[auth][register] JWT_SECRET is missing");
      return NextResponse.json(
        {
          error:
            "Authentication is not configured. Set JWT_SECRET to a long random string in your server environment variables."
        },
        { status: 500 }
      );
    }

    await connectToDatabase();

    const json = await req.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { restaurantName, restaurantSlug, email, password, enableEmailTwoFactor } = parsed.data;
    const mailOk = isMailConfigured();
    const twoFactorEnabled = mailOk && enableEmailTwoFactor !== false;

    const existingRestaurant = await Restaurant.findOne({ slug: restaurantSlug });
    if (existingRestaurant) {
      return NextResponse.json(
        { error: "Restaurant slug already in use" },
        { status: 409 }
      );
    }

    const sessionTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const restaurant = await Restaurant.create({
      name: restaurantName,
      slug: restaurantSlug,
      timezone: sessionTz,
      currency: "INR"
    });

    const passwordHash = await hashPassword(password);
    const owner = await User.create({
      restaurantId: restaurant._id,
      name: "Owner",
      email,
      passwordHash,
      role: "owner",
      status: "active",
      twoFactorEnabled
    });

    let welcomeEmail: { sent: boolean; reason?: "smtp_not_configured" | "send_failed" } = {
      sent: false,
      reason: "smtp_not_configured"
    };
    if (mailOk) {
      const { subject, text, html } = buildWelcomeEmail({
        restaurantName,
        slug: restaurantSlug,
        twoFactorEnabled
      });
      try {
        const mailed = await sendMail({ to: email, subject, text, html });
        welcomeEmail =
          mailed.skipped === true
            ? { sent: false, reason: "smtp_not_configured" }
            : { sent: true };
      } catch {
        welcomeEmail = { sent: false, reason: "send_failed" };
      }
    } else if (process.env.NODE_ENV === "production") {
      console.warn(
        "[auth][register] welcome email skipped: SMTP_HOST and SMTP_FROM are not both set in this environment. " +
          "Add them in your host’s env settings (e.g. Vercel → Settings → Environment Variables)."
      );
    }

    // Auto sign-in after registration for onboarding
    const token = await signAuthJwt({
      userId: owner._id.toString(),
      restaurantId: restaurant._id.toString(),
      role: owner.role,
      name: owner.name
    });

    const res = NextResponse.json(
      {
        ok: true,
        restaurant: { id: restaurant._id.toString(), slug: restaurant.slug },
        user: { id: owner._id.toString(), email: owner.email },
        welcomeEmail
      },
      { status: 201 }
    );
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
      // session cookie (no maxAge/expires): cleared when browser closes
    });
    return res;
  } catch (err) {
    console.error("[auth][register] error", err);
    if (isDuplicateKeyError(err)) {
      const kp = err.keyPattern;
      if (kp && "slug" in kp) {
        return NextResponse.json({ error: "Restaurant slug already in use" }, { status: 409 });
      }
      if (kp && "restaurantId" in kp && "email" in kp) {
        return NextResponse.json(
          { error: "An account with this email already exists for this workspace" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "That workspace slug or email is already registered. Try a different slug." },
        { status: 409 }
      );
    }
    const msg = err instanceof Error ? err.message : "";
    if (/MONGODB_URI|JWT_SECRET|ECONNREFUSED|ENOTFOUND|authentication failed/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Could not complete registration (database or auth configuration). Check MONGODB_URI, IP allowlists, and server logs."
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

