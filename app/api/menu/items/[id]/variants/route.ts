import { NextRequest } from "next/server";
import { z } from "zod";

import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { ItemVariant, MenuItem } from "@/models";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const variantPayloadSchema = z.object({
  variants: z.array(
    z.object({
      groupName: z.string().min(1),
      optionName: z.string().min(1),
      variantType: z.enum(["size", "quantity", "custom"]),
      absolutePrice: z.number().min(0).optional(),
      priceDelta: z.number().min(0).optional(),
      sortOrder: z.number().int().min(0)
    })
  )
});

export async function GET(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager", "cashier", "staff"], async (_req, ctx, session) => {
    await connectToDatabase();
    const { id } = await ctx.params;
    const variants = await ItemVariant.find({
      restaurantId: session.restaurantId,
      itemId: id,
      isActive: true
    })
      .sort({ sortOrder: 1, optionName: 1 })
      .lean();

    return ok(
      variants.map((variant) => ({
        id: String(variant._id),
        groupName: variant.groupName,
        optionName: variant.optionName,
        variantType: variant.variantType,
        absolutePrice: variant.absolutePrice,
        priceDelta: variant.priceDelta ?? 0,
        sortOrder: variant.sortOrder ?? 0
      }))
    );
  })(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager"], async (req, ctx, session) => {
    await connectToDatabase();
    const { id } = await ctx.params;
    const body = await req.json();
    const payload = variantPayloadSchema.parse(body);

    const item = await MenuItem.findOne({
      _id: id,
      restaurantId: session.restaurantId
    }).select({ _id: 1 });
    if (!item) {
      throw new Error("Item not found.");
    }

    await ItemVariant.deleteMany({
      restaurantId: session.restaurantId,
      itemId: id
    });

    if (payload.variants.length > 0) {
      await ItemVariant.insertMany(
        payload.variants.map((variant, index) => ({
          restaurantId: session.restaurantId,
          itemId: id,
          groupName: variant.groupName,
          optionName: variant.optionName,
          variantType: variant.variantType,
          absolutePrice: variant.absolutePrice,
          priceDelta: variant.priceDelta ?? 0,
          sortOrder: variant.sortOrder ?? index + 1,
          isDefault: index === 0,
          isActive: true
        }))
      );
    }

    return ok({ itemId: id, count: payload.variants.length });
  })(request, context);
}
