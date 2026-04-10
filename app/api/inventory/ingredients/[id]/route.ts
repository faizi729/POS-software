import { NextRequest } from "next/server";
import { ok, fail, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Ingredient, InventoryLog } from "@/models";
import { Types } from "mongoose";
import { z } from "zod";

const ingredientUpdateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  reorderLevel: z.number().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
  supplier: z.string().max(200).optional()
});

const stockAdjustSchema = z.object({
  action: z.enum(["restock", "adjustment", "wastage"]),
  quantity: z.number().positive(),
  reason: z.string().max(200).optional()
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/inventory/ingredients/[id]
 * Update ingredient details OR adjust stock
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager"], async (request, context, session) => {
    const { id } = await context.params;
    const body = await request.json();

    await connectToDatabase();

    const ingredient = await Ingredient.findOne({
      _id: new Types.ObjectId(id),
      restaurantId: new Types.ObjectId(session.restaurantId)
    });

    if (!ingredient) return fail("Ingredient not found.", 404);

    if (body.action) {
      const { action, quantity, reason } = stockAdjustSchema.parse(body);

      const previousStock = ingredient.currentStock;
      let newStock: number;

      if (action === "restock") {
        newStock = previousStock + quantity;
      } else if (action === "wastage") {
        newStock = Math.max(0, previousStock - quantity);
      } else {
        newStock = quantity;
      }

      ingredient.currentStock = newStock;
      await ingredient.save();

      await InventoryLog.create({
        restaurantId: new Types.ObjectId(session.restaurantId),
        ingredientId: new Types.ObjectId(id),
        type: action,
        quantity: action === "wastage" ? -quantity : action === "restock" ? quantity : newStock - previousStock,
        previousStock,
        newStock,
        reason: reason ?? `Manual ${action}`,
        performedBy: new Types.ObjectId(session.userId)
      });

      return ok({
        id: ingredient._id.toString(),
        name: ingredient.name,
        previousStock,
        newStock,
        action
      });
    }

    const payload = ingredientUpdateSchema.parse(body);
    if (payload.name) ingredient.name = payload.name;
    if (typeof payload.reorderLevel === "number") ingredient.reorderLevel = payload.reorderLevel;
    if (typeof payload.costPerUnit === "number") ingredient.costPerUnit = payload.costPerUnit;
    if (payload.supplier !== undefined) ingredient.supplier = payload.supplier;

    await ingredient.save();

    return ok({
      id: ingredient._id.toString(),
      name: ingredient.name,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock,
      reorderLevel: ingredient.reorderLevel,
      costPerUnit: ingredient.costPerUnit,
      supplier: ingredient.supplier ?? ""
    });
  })(request, context);
}

/**
 * DELETE /api/inventory/ingredients/[id]
 * Soft-delete an ingredient
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager"], async (_req, context, session) => {
    const { id } = await context.params;

    await connectToDatabase();

    const ingredient = await Ingredient.findOne({
      _id: new Types.ObjectId(id),
      restaurantId: new Types.ObjectId(session.restaurantId)
    });

    if (!ingredient) return fail("Ingredient not found.", 404);

    ingredient.isActive = false;
    await ingredient.save();

    return ok({ id });
  })(request, context);
}
