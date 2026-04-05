import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { z } from "zod";
import { signAuthJwt } from "@/lib/auth/jwt";

const registerSchema = z.object({
  restaurantName: z.string().min(2),
  restaurantSlug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  email: z.string().email(),
  password: z.string().min(8)
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

    const { restaurantName, restaurantSlug, email, password } = parsed.data;

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
      status: "active"
    });

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
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    return res;
  } catch (err) {
    console.error("[auth][register] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

