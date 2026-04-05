import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { connectToDatabase } from "@/lib/db/connect";
import { Recipe, MenuItem, Ingredient } from "@/models";
import { Types } from "mongoose";
import { z } from "zod";

const recipeCreateSchema = z.object({
  menuItemId: z.string().min(1),
  ingredients: z.array(
    z.object({
      ingredientId: z.string().min(1),
      quantityRequired: z.number().positive(),
      unit: z.string().min(1)
    })
  )
});

/**
 * GET /api/inventory/recipes
 * List all recipe mappings for the restaurant
 */
export async function GET() {
  try {
    const session = await getSession();
    await connectToDatabase();

    const rid = new Types.ObjectId(session.restaurantId);

    const recipes = await Recipe.find({
      restaurantId: rid,
      isActive: true
    })
      .populate("menuItemId", "name price")
      .lean();

    // Get all ingredient IDs referenced in recipes
    const ingredientIds = new Set<string>();
    for (const recipe of recipes) {
      for (const ing of recipe.ingredients) {
        ingredientIds.add(ing.ingredientId.toString());
      }
    }

    const ingredients = await Ingredient.find({
      _id: { $in: [...ingredientIds].map((id) => new Types.ObjectId(id)) },
      restaurantId: rid
    }).lean();

    const ingredientMap = new Map(
      ingredients.map((i) => [i._id.toString(), { name: i.name, unit: i.unit }])
    );

    const data = recipes.map((recipe) => ({
      id: recipe._id.toString(),
      menuItemId: recipe.menuItemId?.toString() ?? (recipe.menuItemId as any)?._id?.toString(),
      menuItemName: (recipe.menuItemId as any)?.name ?? "Unknown",
      menuItemPrice: (recipe.menuItemId as any)?.price ?? 0,
      ingredients: recipe.ingredients.map((ing) => {
        const info = ingredientMap.get(ing.ingredientId.toString());
        return {
          ingredientId: ing.ingredientId.toString(),
          ingredientName: info?.name ?? "Unknown",
          ingredientUnit: info?.unit ?? ing.unit,
          quantityRequired: ing.quantityRequired,
          unit: ing.unit
        };
      })
    }));

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/inventory/recipes
 * Create or update a recipe mapping
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const payload = recipeCreateSchema.parse(body);

    await connectToDatabase();

    const rid = new Types.ObjectId(session.restaurantId);
    const menuItemOid = new Types.ObjectId(payload.menuItemId);

    // Verify menu item exists
    const menuItem = await MenuItem.findOne({
      _id: menuItemOid,
      restaurantId: rid
    });
    if (!menuItem) throw new Error("Menu item not found.");

    // Upsert recipe
    const recipe = await Recipe.findOneAndUpdate(
      { restaurantId: rid, menuItemId: menuItemOid },
      {
        restaurantId: rid,
        menuItemId: menuItemOid,
        ingredients: payload.ingredients.map((ing) => ({
          ingredientId: new Types.ObjectId(ing.ingredientId),
          quantityRequired: ing.quantityRequired,
          unit: ing.unit
        })),
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return ok(
      {
        id: recipe._id.toString(),
        menuItemId: payload.menuItemId,
        ingredientCount: payload.ingredients.length
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
