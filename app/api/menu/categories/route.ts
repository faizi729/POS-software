import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { menuCategorySchema } from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import { MenuCategory } from "@/models";
import { createCategory } from "@/server/repositories/mongo-repository";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return withAuth<any>(["owner", "manager", "cashier", "staff"], async (req, _ctx, session) => {
    await connectToDatabase();
    const url = new URL(req.url);
    const limit = Math.min(2000, Math.max(1, Number(url.searchParams.get("limit") ?? 2000)));

    const categories = await MenuCategory.find({
      restaurantId: session.restaurantId,
      isActive: true,
      menuId: { $exists: false }
    })
      .select({ name: 1, slug: 1, sortOrder: 1, isActive: 1 })
      .sort({ sortOrder: 1, name: 1 })
      .limit(limit)
      .lean();

    const serialized = categories.map((c: any) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder ?? 0,
      isActive: Boolean(c.isActive)
    }));

    const res = ok({ restaurantId: session.restaurantId, categories: serialized });
    (res as NextResponse).headers.set("Cache-Control", "private, no-store, max-age=0");
    return res;
  })(request, {} as any);
}

export async function POST(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (request, _ctx, session) => {
    const body = await request.json();
    const payload = menuCategorySchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    const category = await createCategory(payload);

    return ok(category, { status: 201 });
  })(request, {} as any);
}
