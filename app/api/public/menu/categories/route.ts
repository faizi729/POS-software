import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { ok, handleRouteError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";
import { MenuCategory, MenuItem } from "@/models";
import { resolvePublicTenantRestaurantId } from "@/app/api/public/menu/_tenant";

export async function GET(request: NextRequest) {
  try {
    const restaurantId = await resolvePublicTenantRestaurantId();
    if (!restaurantId) {
      return ok({ error: "Restaurant not found for host" }, { status: 404 });
    }

    await connectToDatabase();
    const url = new URL(request.url);
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 100)));

    // Public website: categories that actually have items (prevents empty tabs / mismatched category schemas).
    // This is resilient whether categories are "POS" categories (no menuId) or builder categories (menuId present).
    const rows = await MenuItem.aggregate([
      { $match: { restaurantId: new Types.ObjectId(restaurantId), isActive: true, isAvailable: true } },
      { $group: { _id: "$categoryId" } },
      {
        $lookup: {
          from: "menucategories",
          localField: "_id",
          foreignField: "_id",
          as: "cat"
        }
      },
      { $unwind: "$cat" },
      { $match: { "cat.isActive": true } },
      { $project: { _id: "$cat._id", name: "$cat.name", slug: "$cat.slug", sortOrder: { $ifNull: ["$cat.sortOrder", 0] } } },
      { $sort: { sortOrder: 1, name: 1 } },
      { $limit: limit }
    ]);

    const res = ok({
      categories: rows.map((c: any) => ({
        id: String(c._id),
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder ?? 0
      }))
    });
    (res as NextResponse).headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return res;
  } catch (error) {
    return handleRouteError(error);
  }
}

