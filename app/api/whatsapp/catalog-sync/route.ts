/**
 * Catalog sync helper.
 *
 * GET  → Returns POS menu items formatted for WhatsApp catalog comparison
 * POST → Triggers a push to Meta's Catalog API (if configured)
 *
 * WhatsApp catalogs use product_retailer_id as the key. We use the
 * POS MenuItem _id as the retailer ID so that catalog selections
 * map directly to POS items without any lookup table.
 */

import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { MenuItem, MenuCategory } from "@/models";
import { WA_CONFIG } from "@/lib/whatsapp/config";
import { getRestaurantWaConfig } from "@/lib/whatsapp/restaurant-config";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Owner/manager only: integration push/read
    return withAuth<any>(["owner", "manager"], async (_req, _ctx, session) => {
      await connectToDatabase();
      const wa = await getRestaurantWaConfig(session.restaurantId);

      const [items, categories] = await Promise.all([
        MenuItem.find({
          restaurantId: session.restaurantId,
          isActive: true,
          isAvailable: true,
        })
          .select({ name: 1, description: 1, price: 1, imageUrl: 1, categoryId: 1, isAvailable: 1, sku: 1, dietary: 1, taxRate: 1, sortOrder: 1 })
          .sort({ sortOrder: 1 })
          .lean(),
        MenuCategory.find({
          restaurantId: session.restaurantId,
          isActive: true,
        })
          .select({ name: 1 })
          .sort({ sortOrder: 1 })
          .lean(),
      ]);

    const categoryMap = new Map(
      categories.map((c) => [c._id.toString(), c.name])
    );

    // Format for WhatsApp catalog
    const catalogItems = items.map((item) => ({
      /** Use POS _id as product_retailer_id */
      product_retailer_id: item._id.toString(),
      name: item.name,
      description: item.description || "",
      price: item.price * 100, // Meta expects paise (smallest unit)
      currency: "INR",
      image_url: item.imageUrl || "",
      category: categoryMap.get(item.categoryId?.toString()) || "Uncategorized",
      availability: item.isAvailable ? "in stock" : "out of stock",
      // POS metadata
      _pos: {
        categoryId: item.categoryId?.toString(),
        sku: item.sku,
        dietary: item.dietary,
        taxRate: item.taxRate,
      },
    }));

      const res = ok({
        catalogId: wa.catalogId || WA_CONFIG.catalogId,
        totalItems: catalogItems.length,
        items: catalogItems,
      });
      (res as NextResponse).headers.set("Cache-Control", "private, no-store, max-age=0");
      return res;
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST: Push items to Meta's Commerce API.
 *
 * Uses the Catalog Batch API to create/update products.
 * https://developers.facebook.com/docs/commerce-platform/catalog/batch-api
 */
export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager"], async (request, _ctx, session) => {
      await connectToDatabase();

      const wa = await getRestaurantWaConfig(session.restaurantId);
      const catalogId = wa.catalogId || WA_CONFIG.catalogId;
      if (!catalogId) {
        return handleRouteError(new Error("WHATSAPP_CATALOG_ID not configured"));
      }

      const items = await MenuItem.find({
        restaurantId: session.restaurantId,
        isActive: true,
      })
        .select({ name: 1, description: 1, price: 1, imageUrl: 1, categoryId: 1, isAvailable: 1, sortOrder: 1 })
        .sort({ sortOrder: 1 })
        .lean();

      const categories = await MenuCategory.find({
        restaurantId: session.restaurantId,
        isActive: true,
      })
        .select({ name: 1 })
        .lean();

    const categoryMap = new Map(
      categories.map((c) => [c._id.toString(), c.name])
    );

    // Build batch request items
    const requests = items.map((item) => ({
      method: "UPDATE",
      retailer_id: item._id.toString(),
      data: {
        name: item.name,
        description: item.description || item.name,
        availability: item.isAvailable ? "in stock" : "out of stock",
        price: Math.round(item.price * 100), // paise
        currency: "INR",
        image_url: item.imageUrl || undefined,
        category: categoryMap.get(item.categoryId?.toString()) || "Menu",
      },
    }));

    // Send to Meta Commerce Batch API
      const batchUrl = `${WA_CONFIG.apiBase}/${catalogId}/batch`;
      const res = await fetch(batchUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${wa.token || WA_CONFIG.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allow_upsert: true,
          requests,
        }),
      });

      const result = await res.json();

      return ok({
        synced: requests.length,
        catalogId,
        apiResponse: result,
      });
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
