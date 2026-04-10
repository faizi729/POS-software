import { NextRequest, NextResponse } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";
import { MenuItem } from "@/models";
import { resolvePublicTenantRestaurantId } from "@/app/api/public/menu/_tenant";

/**
 * Cursor pagination:
 * - Sorted by (sortOrder asc, _id asc)
 * - cursor is `${sortOrder}:${_id}`
 */
function parseCursor(cursor: string | null) {
  if (!cursor) return null;
  const [sortOrderStr, id] = String(cursor).split(":");
  const sortOrder = Number(sortOrderStr);
  if (!Number.isFinite(sortOrder) || !id) return null;
  return { sortOrder, id };
}

export async function GET(request: NextRequest) {
  try {
    const restaurantId = await resolvePublicTenantRestaurantId();
    if (!restaurantId) {
      return ok({ error: "Restaurant not found for host" }, { status: 404 });
    }

    await connectToDatabase();
    const url = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
    const categoryId = (url.searchParams.get("categoryId") ?? "").trim();
    const cursor = parseCursor(url.searchParams.get("cursor"));

    const query: any = {
      restaurantId,
      isActive: true,
      isAvailable: true
    };
    if (categoryId) query.categoryId = categoryId;

    if (cursor) {
      query.$or = [
        { sortOrder: { $gt: cursor.sortOrder } },
        { sortOrder: cursor.sortOrder, _id: { $gt: cursor.id } }
      ];
    }

    const items = await MenuItem.find(query)
      .select({
        categoryId: 1,
        name: 1,
        description: 1,
        imageUrl: 1,
        price: 1,
        sortOrder: 1
      })
      .sort({ sortOrder: 1, _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasMore = items.length > limit;
    const slice = hasMore ? items.slice(0, limit) : items;
    const last = slice[slice.length - 1];
    const nextCursor = hasMore && last ? `${Number(last.sortOrder ?? 0)}:${String(last._id)}` : null;

    const res = ok({
      items: slice.map((it: any) => ({
        id: String(it._id),
        categoryId: String(it.categoryId),
        name: it.name,
        description: it.description ?? "",
        imageUrl: it.imageUrl ?? "",
        price: Number(it.price ?? 0),
        sortOrder: Number(it.sortOrder ?? 0)
      })),
      page: { limit, hasMore, nextCursor }
    });
    (res as NextResponse).headers.set("Cache-Control", "public, max-age=30, s-maxage=120");
    return res;
  } catch (error) {
    return handleRouteError(error);
  }
}

