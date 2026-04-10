import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { menuItemSchema } from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import { MenuItem } from "@/models";
import { createMenuItem } from "@/server/repositories/mongo-repository";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return withAuth<any>(["owner", "manager", "cashier", "staff"], async (req, _ctx, session) => {
    await connectToDatabase();
    const url = new URL(req.url);
    const limit = Math.min(2000, Math.max(1, Number(url.searchParams.get("limit") ?? 2000)));
    const categoryId = (url.searchParams.get("categoryId") ?? "").trim();

    const query: any = { restaurantId: session.restaurantId, isActive: true };
    if (categoryId) query.categoryId = categoryId;

    const items = await MenuItem.find(query)
      .select({
        restaurantId: 1,
        categoryId: 1,
        subcategoryId: 1,
        name: 1,
        slug: 1,
        sku: 1,
        description: 1,
        imageUrl: 1,
        price: 1,
        taxRate: 1,
        isAvailable: 1,
        isActive: 1,
        tags: 1,
        prepStation: 1,
        sortOrder: 1
      })
      .sort({ sortOrder: 1, name: 1 })
      .limit(limit)
      .lean();

    const serialized = items.map((item: any) => ({
      id: item._id.toString(),
      restaurantId: item.restaurantId?.toString?.() ?? String(item.restaurantId),
      categoryId: item.categoryId?.toString?.() ?? String(item.categoryId),
      subcategoryId: item.subcategoryId?.toString?.() ?? (item.subcategoryId ? String(item.subcategoryId) : ""),
      name: item.name,
      slug: item.slug,
      sku: item.sku ?? "",
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      price: item.price ?? 0,
      taxRate: item.taxRate ?? 0,
      isAvailable: Boolean(item.isAvailable),
      isActive: Boolean(item.isActive),
      tags: item.tags ?? [],
      prepStation: item.prepStation ?? "",
      sortOrder: item.sortOrder ?? 0
    }));

    const res = ok({ restaurantId: session.restaurantId, items: serialized });
    (res as NextResponse).headers.set("Cache-Control", "private, no-store, max-age=0");
    return res;
  })(request, {} as any);
}

export async function POST(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (request, _ctx, session) => {
    const body = await request.json();
    const payload = menuItemSchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    if (payload.sku == null || payload.sku === "") {
      // @ts-ignore
      delete (payload as any).sku;
    }

    const item = await createMenuItem(payload);
    return ok(item, { status: 201 });
  })(request, {} as any);
}
