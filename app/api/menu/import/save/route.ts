import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/get-session";
import { MenuCategory, MenuItem, Restaurant } from "@/models";

type SavePayload = {
  categories: Array<{
    name: string;
    subcategory?: string; // optional; if not provided, defaults to name
    items: Array<{ name: string; price: number }>;
  }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    await connectToDatabase();

    const body = (await request.json()) as SavePayload;
    const { categories } = body || {};
    if (!Array.isArray(categories) || !categories.length) {
      return ok({ error: "No categories to save" }, { status: 400 });
    }

    const created: Array<{ categoryId: string; subcategoryId: string; items: number }> = [];

    for (const cat of categories) {
      const categoryName = String(cat.name || "").trim();
      if (!categoryName) continue;
      const subName = String(cat.subcategory || categoryName).trim();

      const category = await MenuCategory.findOneAndUpdate(
        {
          restaurantId: session.restaurantId,
          parentId: null,
          name: categoryName
        },
        {
          $setOnInsert: {
            restaurantId: session.restaurantId,
            parentId: null,
            name: categoryName,
            slug: slugify(categoryName),
            nodeType: "category",
            level: 0
          }
        },
        { new: true, upsert: true }
      ).lean();

      const subcategory = await MenuCategory.findOneAndUpdate(
        {
          restaurantId: session.restaurantId,
          parentId: category._id,
          name: subName
        },
        {
          $setOnInsert: {
            restaurantId: session.restaurantId,
            parentId: category._id,
            name: subName,
            slug: slugify(subName),
            nodeType: "subcategory",
            level: 1
          }
        },
        { new: true, upsert: true }
      ).lean();

      let savedItems = 0;
      for (const item of cat.items || []) {
        const name = String(item.name || "").trim();
        const price = Number(item.price);
        if (!name || !(price >= 1)) continue;
        await MenuItem.findOneAndUpdate(
          {
            restaurantId: session.restaurantId,
            categoryId: category._id,
            subcategoryId: subcategory._id,
            name
          },
          {
            $setOnInsert: {
              restaurantId: session.restaurantId,
              categoryId: category._id,
              subcategoryId: subcategory._id,
              name,
              slug: slugify(name),
              price,
              pricingMode: "base",
              itemType: "standard",
              isAvailable: true
            },
            $set: { price }
          },
          { new: true, upsert: true }
        );
        savedItems += 1;
      }

      created.push({
        categoryId: String(category._id),
        subcategoryId: String(subcategory._id),
        items: savedItems
      });
    }

    // Mark onboarding progress
    await Restaurant.findByIdAndUpdate(session.restaurantId, {
      $set: { "onboarding.menuImported": true },
      $currentDate: {
        "onboarding.completedAt": {
          $type: "date"
        } as any
      }
    }).catch(() => {});

    return ok({ created });
  } catch (error) {
    return handleRouteError(error);
  }
}

