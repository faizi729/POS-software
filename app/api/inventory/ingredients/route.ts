import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { connectToDatabase } from "@/lib/db/connect";
import { Ingredient } from "@/models";
import { Types } from "mongoose";
import { z } from "zod";
import { INGREDIENT_UNITS } from "@/lib/constants/roles";

const ingredientCreateSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  unit: z.enum(INGREDIENT_UNITS),
  currentStock: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0),
  costPerUnit: z.number().min(0).default(0),
  supplier: z.string().max(200).optional()
});

/**
 * GET /api/inventory/ingredients
 * List all ingredients for the restaurant
 */
export async function GET() {
  try {
    const session = await getSession();
    await connectToDatabase();

    const ingredients = await Ingredient.find({
      restaurantId: new Types.ObjectId(session.restaurantId),
      isActive: true
    })
      .sort({ name: 1 })
      .lean();

    const data = ingredients.map((ing) => ({
      id: ing._id.toString(),
      name: ing.name,
      unit: ing.unit,
      currentStock: ing.currentStock,
      reorderLevel: ing.reorderLevel,
      costPerUnit: ing.costPerUnit,
      supplier: ing.supplier ?? "",
      isLow: ing.currentStock <= ing.reorderLevel,
      isOut: ing.currentStock <= 0
    }));

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/inventory/ingredients
 * Create a new ingredient
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const payload = ingredientCreateSchema.parse(body);

    await connectToDatabase();

    const ingredient = await Ingredient.create({
      restaurantId: new Types.ObjectId(session.restaurantId),
      ...payload
    });

    return ok(
      {
        id: ingredient._id.toString(),
        name: ingredient.name,
        unit: ingredient.unit,
        currentStock: ingredient.currentStock,
        reorderLevel: ingredient.reorderLevel,
        costPerUnit: ingredient.costPerUnit,
        supplier: ingredient.supplier ?? ""
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
