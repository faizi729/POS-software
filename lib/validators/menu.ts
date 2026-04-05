import { z } from "zod";

const channelSchema = z.enum(["pos", "website", "qr", "marketplace"]);
const serviceModeSchema = z.enum(["dine_in", "takeaway", "delivery"]);
const dayPartSchema = z.enum(["breakfast", "lunch", "dinner", "late_night", "all_day"]);

export const menuDefinitionSchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(300).optional(),
  channels: z.array(channelSchema).min(1).default(["pos"]),
  outletIds: z.array(z.string().min(1)).default([]),
  dayParts: z.array(dayPartSchema).default(["all_day"]),
  serviceModes: z.array(serviceModeSchema).default(["dine_in", "takeaway"]),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
});

export const menuCategorySchema = z.object({
  restaurantId: z.string().min(1),
  menuId: z.string().min(1).optional(),
  parentId: z.string().min(1).optional(),
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  nodeType: z.enum(["category", "subcategory"]).default("category"),
  level: z.number().int().min(0).default(0),
  path: z.array(z.string().min(1)).default([]),
  channels: z.array(channelSchema).default(["pos"]),
  dayParts: z.array(dayPartSchema).default(["all_day"]),
  outletIds: z.array(z.string().min(1)).default([]),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

export const menuItemSchema = z.object({
  restaurantId: z.string().min(1),
  menuId: z.string().min(1).optional(),
  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1).optional(),
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  sku: z.string().max(40).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  itemType: z.enum(["standard", "combo"]).default("standard"),
  dietary: z.enum(["veg", "non_veg", "vegan", "egg", "none"]).default("none"),
  pricingMode: z.enum(["base", "variant"]).default("base"),
  price: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
  prepTimeMinutes: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  autoDisableOnOutOfStock: z.boolean().default(false),
  dayParts: z.array(dayPartSchema).default(["all_day"]),
  channels: z.array(channelSchema).default(["pos"]),
  outletIds: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().max(30)).default([]),
  prepStation: z.string().max(40).optional(),
  metadata: z
    .object({
      bestSellerScore: z.number().min(0).default(0),
      lowPerformerScore: z.number().min(0).default(0),
      suggestedComboScore: z.number().min(0).default(0)
    })
    .default({
      bestSellerScore: 0,
      lowPerformerScore: 0,
      suggestedComboScore: 0
    }),
  sortOrder: z.number().int().min(0).default(0)
});

export const itemVariantSchema = z.object({
  restaurantId: z.string().min(1),
  itemId: z.string().min(1),
  groupName: z.string().min(2).max(80),
  optionName: z.string().min(1).max(80),
  variantType: z.enum(["size", "quantity", "custom"]).default("custom"),
  priceDelta: z.number().min(0).default(0),
  absolutePrice: z.number().min(0).optional(),
  sku: z.string().max(40).optional(),
  prepTimeOverride: z.number().int().min(0).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

export const itemAddonGroupSchema = z.object({
  restaurantId: z.string().min(1),
  itemId: z.string().min(1),
  name: z.string().min(2).max(80),
  selectionType: z.enum(["single", "multi"]).default("multi"),
  minSelect: z.number().int().min(0).default(0),
  maxSelect: z.number().int().min(1).default(1),
  required: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

export const itemAddonSchema = z.object({
  restaurantId: z.string().min(1),
  itemId: z.string().min(1),
  addonGroupId: z.string().min(1),
  name: z.string().min(2).max(80),
  price: z.number().min(0).default(0),
  sku: z.string().max(40).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

export const comboSchema = z.object({
  restaurantId: z.string().min(1),
  itemId: z.string().min(1),
  name: z.string().min(2).max(100),
  comboType: z.enum(["fixed", "customizable"]).default("fixed"),
  discountedPrice: z.number().min(0).optional(),
  upsellTargetItemIds: z.array(z.string().min(1)).default([]),
  components: z
    .array(
      z.object({
        slotName: z.string().min(2).max(80),
        itemIds: z.array(z.string().min(1)).default([]),
        minSelect: z.number().int().min(0).default(1),
        maxSelect: z.number().int().min(1).default(1)
      })
    )
    .default([]),
  isActive: z.boolean().default(true)
});

export const inventoryMappingSchema = z.object({
  restaurantId: z.string().min(1),
  itemId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  ingredientName: z.string().min(2).max(100),
  stockUnit: z.string().min(1).max(20),
  quantityRequired: z.number().min(0),
  wasteFactor: z.number().min(0).default(0),
  reorderThreshold: z.number().min(0).default(0),
  isActive: z.boolean().default(true)
});
