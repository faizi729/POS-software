import { NextRequest } from "next/server";

import { handleRouteError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";
import { toUtcDate } from "@/lib/hotel/availability";
import { publicAvailability, publicDateWindow, resolvePublicTenant } from "@/lib/hotel/public";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

type Ctx = { params: Promise<{ slug: string }> };

/** Public: what's free and at what price. No tenant data beyond the property itself. */
export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const limited = await rateLimit({
      request,
      keyParts: ["public-availability", getClientIp(request)],
      limit: 60,
      windowMs: 60_000
    });
    if (!limited.ok) return Response.json({ success: false, error: "Too many requests" }, { status: 429 });

    await connectToDatabase();
    const { slug } = await ctx.params;
    const tenant = await resolvePublicTenant(slug);
    if (!tenant) return Response.json({ success: false, error: "Not found" }, { status: 404 });

    const url = new URL(request.url);
    const window = publicDateWindow();
    const checkIn = toUtcDate(url.searchParams.get("checkIn") || window.from);
    const checkOut = toUtcDate(url.searchParams.get("checkOut") || new Date(window.from.getTime() + 86_400_000));
    const adults = Number(url.searchParams.get("adults") || 2);
    if (!(checkIn < checkOut)) {
      return Response.json({ success: false, error: "Check-out must be after check-in" }, { status: 422 });
    }

    const roomTypes = await publicAvailability({
      tenant,
      checkIn,
      checkOut,
      adults: Number.isFinite(adults) ? Math.min(12, Math.max(1, adults)) : 2,
      children: Number(url.searchParams.get("children") || 0)
    });

    return Response.json({
      success: true,
      data: {
        hotel: { name: tenant.name, slug: tenant.slug, timezone: tenant.timezone },
        checkIn: checkIn.toISOString().slice(0, 10),
        checkOut: checkOut.toISOString().slice(0, 10),
        roomTypes
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
