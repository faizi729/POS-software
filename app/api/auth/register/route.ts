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

export async function POST(req: NextRequest) {
  try {
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

    if (mailOk) {
      const { subject, text, html } = buildWelcomeEmail({
        restaurantName,
        slug: restaurantSlug,
        twoFactorEnabled
      });
      await sendMail({ to: email, subject, text, html }).catch((err) =>
        console.error("[auth][register] welcome email failed", err)
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
        user: { id: owner._id.toString(), email: owner.email }
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

