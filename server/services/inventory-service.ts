import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Ingredient, InventoryLog, Recipe, Order } from "@/models";
import { eventBus } from "@/lib/events/event-bus";

function oid(id: string) {
  return new Types.ObjectId(id);
}

/**
 * Deduct ingredients from inventory when an order is submitted.
 * Looks up recipes for each ordered menu item and deducts accordingly.
 * Creates inventory log entries for auditing.
 * Fires "inventory:low" events when stock drops below reorder level.
 */
export async function deductInventoryForOrder(orderId: string, restaurantId: string) {
  await connectToDatabase();

  const order = await Order.findOne({
    _id: oid(orderId),
    restaurantId: oid(restaurantId)
  }).lean();

  if (!order) return;

  // Gather all menu item IDs from order
  const itemQuantities = new Map<string, number>();
  for (const item of order.items) {
    const key = item.menuItemId.toString();
    itemQuantities.set(key, (itemQuantities.get(key) ?? 0) + item.quantity);
  }

  // Find recipes for these items
  const menuItemIds = [...itemQuantities.keys()].map(oid);
  const recipes = await Recipe.find({
    restaurantId: oid(restaurantId),
    menuItemId: { $in: menuItemIds },
    isActive: true
  }).lean();

  if (recipes.length === 0) return; // No recipes mapped → skip

  // Build deduction map: ingredientId → total quantity to deduct
  const deductions = new Map<string, number>();
  for (const recipe of recipes) {
    const orderQty = itemQuantities.get(recipe.menuItemId.toString()) ?? 0;
    if (orderQty <= 0) continue;

    for (const ing of recipe.ingredients) {
      const key = ing.ingredientId.toString();
      deductions.set(key, (deductions.get(key) ?? 0) + ing.quantityRequired * orderQty);
    }
  }

  if (deductions.size === 0) return;

  // Fetch and update ingredients
  const ingredientIds = [...deductions.keys()].map(oid);
  const ingredients = await Ingredient.find({
    _id: { $in: ingredientIds },
    restaurantId: oid(restaurantId),
    isActive: true
  });

  const logEntries: Array<{
    restaurantId: Types.ObjectId;
    ingredientId: Types.ObjectId;
    type: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    orderId: Types.ObjectId;
    reason: string;
  }> = [];

  for (const ingredient of ingredients) {
    const deductQty = deductions.get(ingredient._id.toString()) ?? 0;
    if (deductQty <= 0) continue;

    const previousStock = ingredient.currentStock;
    const newStock = Math.max(0, previousStock - deductQty);

    ingredient.currentStock = newStock;
    await ingredient.save();

    logEntries.push({
      restaurantId: oid(restaurantId),
      ingredientId: ingredient._id as Types.ObjectId,
      type: "deduction",
      quantity: -deductQty,
      previousStock,
      newStock,
      orderId: oid(orderId),
      reason: `Auto-deducted for order`
    });

    // Check low stock
    if (newStock <= ingredient.reorderLevel) {
      eventBus.emit("inventory:low", {
        restaurantId,
        ingredientId: ingredient._id.toString(),
        ingredientName: ingredient.name,
        currentStock: newStock,
        reorderLevel: ingredient.reorderLevel
      }).catch(() => {});
    }
  }

  // Bulk insert log entries
  if (logEntries.length > 0) {
    await InventoryLog.insertMany(logEntries);
  }
}

/**
 * Get all low-stock ingredients for a restaurant
 */
export async function getLowStockAlerts(restaurantId: string) {
  await connectToDatabase();

  const ingredients = await Ingredient.find({
    restaurantId: oid(restaurantId),
    isActive: true,
    $expr: { $lte: ["$currentStock", "$reorderLevel"] }
  })
    .select({ name: 1, unit: 1, currentStock: 1, reorderLevel: 1 })
    .sort({ currentStock: 1 })
    .limit(300)
    .lean();

  return ingredients.map((ing) => ({
    id: ing._id.toString(),
    name: ing.name,
    unit: ing.unit,
    currentStock: ing.currentStock,
    reorderLevel: ing.reorderLevel,
    deficit: ing.reorderLevel - ing.currentStock
  }));
}

/**
 * Restock an ingredient
 */
export async function restockIngredient(params: {
  ingredientId: string;
  restaurantId: string;
  quantity: number;
  reason?: string;
  performedBy?: string;
}) {
  await connectToDatabase();

  const ingredient = await Ingredient.findOne({
    _id: oid(params.ingredientId),
    restaurantId: oid(params.restaurantId)
  });

  if (!ingredient) throw new Error("Ingredient not found.");

  const previousStock = ingredient.currentStock;
  const newStock = previousStock + params.quantity;
  ingredient.currentStock = newStock;
  await ingredient.save();

  await InventoryLog.create({
    restaurantId: oid(params.restaurantId),
    ingredientId: oid(params.ingredientId),
    type: "restock",
    quantity: params.quantity,
    previousStock,
    newStock,
    reason: params.reason ?? "Manual restock",
    performedBy: params.performedBy ? oid(params.performedBy) : undefined
  });

  return { previousStock, newStock, ingredientName: ingredient.name };
}

/**
 * Get inventory logs for a restaurant
 */
export async function getInventoryLogs(restaurantId: string, limit = 50) {
  await connectToDatabase();

  const logs = await InventoryLog.find({ restaurantId: oid(restaurantId) })
    .select({
      ingredientId: 1,
      type: 1,
      quantity: 1,
      previousStock: 1,
      newStock: 1,
      orderId: 1,
      reason: 1,
      createdAt: 1
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const ingredientIds = Array.from(new Set(logs.map((l) => l.ingredientId?.toString()).filter(Boolean))).map(oid);
  const ingredients = ingredientIds.length
    ? await Ingredient.find({ _id: { $in: ingredientIds }, restaurantId: oid(restaurantId) })
        .select({ name: 1, unit: 1 })
        .lean()
    : [];
  const ingredientMap = new Map(ingredients.map((i) => [i._id.toString(), i]));

  return logs.map((log) => {
    const ing = ingredientMap.get(log.ingredientId?.toString());
    return {
    id: log._id.toString(),
    ingredientId: log.ingredientId?.toString(),
    ingredientName: (ing as any)?.name ?? "Unknown",
    ingredientUnit: (ing as any)?.unit ?? "",
    type: log.type,
    quantity: log.quantity,
    previousStock: log.previousStock,
    newStock: log.newStock,
    orderId: log.orderId?.toString(),
    reason: log.reason,
    createdAt: (log as any).createdAt?.toISOString()
    };
  });
}
