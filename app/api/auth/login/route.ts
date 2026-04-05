import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { signAuthJwt } from "@/lib/auth/jwt";
import { z } from "zod";
import { getTenantSlugFromHost } from "@/lib/auth/tenant";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  restaurantSlug: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const json = await req.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email, password } = parsed.data;
    const slugFromBody = parsed.data.restaurantSlug?.trim() || null;
    const slugFromHost = await getTenantSlugFromHost();
    const tenantSlug = slugFromHost || slugFromBody;

    if (!tenantSlug) {
      return NextResponse.json(
        { error: "Missing restaurant/workspace identifier" },
        { status: 400 }
      );
    }

    const restaurant = await Restaurant.findOne({ slug: tenantSlug, status: "active" });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const user = await User.findOne({ restaurantId: restaurant._id, email });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signAuthJwt({
      userId: user._id.toString(),
      restaurantId: restaurant._id.toString(),
      role: user.role,
      name: user.name
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    return res;
  } catch (err) {
    console.error("[auth][login] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

