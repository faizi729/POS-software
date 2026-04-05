import { NextRequest } from "next/server";
import { z } from "zod";

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import {
  comboSchema,
  inventoryMappingSchema,
  itemAddonGroupSchema,
  itemVariantSchema,
  menuItemSchema
} from "@/lib/validators/menu";
import { slugify } from "@/lib/utils/slugify";
import { createAdvancedMenuItem } from "@/server/repositories/menu-builder-repository";

const advancedMenuItemSchema = menuItemSchema.extend({
  variants: z
    .array(
      itemVariantSchema.omit({
        restaurantId: true,
        itemId: true
      })
    )
    .default([]),
  addonGroups: z
    .array(
      itemAddonGroupSchema
        .omit({
          restaurantId: true,
          itemId: true
        })
        .extend({
          addons: z.array(
            z.object({
              name: z.string().min(2).max(80),
              price: z.number().min(0).default(0),
              sku: z.string().max(40).optional(),
              sortOrder: z.number().int().min(0).default(0),
              isActive: z.boolean().default(true)
            })
          )
        })
    )
    .default([]),
  combo: comboSchema
    .omit({
      restaurantId: true,
      itemId: true
    })
    .optional(),
  inventoryMappings: z
    .array(
      inventoryMappingSchema.omit({
        restaurantId: true,
        itemId: true
      })
    )
    .default([])
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const payload = advancedMenuItemSchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      slug: body.slug || slugify(body.name)
    });

    const item = await createAdvancedMenuItem(payload);
    return ok(item, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
