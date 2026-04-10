import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import {
  Combo,
  InventoryMapping,
  ItemAddon,
  ItemAddonGroup,
  ItemVariant,
  Menu,
  MenuCategory,
  MenuItem
} from "@/models";

function toId(value: string) {
  return new Types.ObjectId(value);
}

async function normalizeLegacyMenuHierarchy(restaurantId: string) {
  const restaurantObjectId = toId(restaurantId);
  const menus = await Menu.find({ restaurantId: restaurantObjectId, isActive: true })
    .sort({ isDefault: -1, sortOrder: 1, createdAt: 1 })
    .lean();

  let defaultMenu = menus[0] as any;

  // Ensure a default menu exists so legacy categories/items can be normalized and show in the tree
  if (!defaultMenu) {
    const created = await Menu.create({
      restaurantId: restaurantObjectId,
      name: "Main Menu",
      slug: `main-menu-${restaurantId.slice(-6)}`,
      description: "Default menu",
      channels: ["pos"],
      outletIds: ["main-outlet"],
      dayParts: ["all_day"],
      serviceModes: ["dine_in", "takeaway"],
      isDefault: true,
      isActive: true,
      sortOrder: 1
    });
    defaultMenu = created.toObject();
  }

  const [legacyCategoryCount, legacyItemCount] = await Promise.all([
    MenuCategory.countDocuments({
      restaurantId: restaurantObjectId,
      $or: [{ menuId: { $exists: false } }, { menuId: null }]
    }),
    MenuItem.countDocuments({
      restaurantId: restaurantObjectId,
      $or: [{ menuId: { $exists: false } }, { menuId: null }]
    })
  ]);

  if (legacyCategoryCount > 0) {
    const legacyCategories = await MenuCategory.find({
      restaurantId: restaurantObjectId,
      $or: [{ menuId: { $exists: false } }, { menuId: null }]
    });

    for (const category of legacyCategories) {
      category.menuId = defaultMenu._id;
      // Preserve parentId when present (subcategories). Only default missing hierarchy fields.
      category.nodeType =
        category.nodeType ??
        (category.parentId ? ("subcategory" as const) : ("category" as const));
      category.level =
        category.level ?? (category.nodeType === "subcategory" ? 1 : 0);
      category.path =
        category.path?.length
          ? category.path
          : category.parentId
            ? [category.name]
            : [category.name];
      category.channels = category.channels?.length ? category.channels : defaultMenu.channels ?? ["pos"];
      category.dayParts = category.dayParts?.length ? category.dayParts : defaultMenu.dayParts ?? ["all_day"];
      category.outletIds = category.outletIds?.length ? category.outletIds : defaultMenu.outletIds ?? ["main-outlet"];
      await category.save();
    }

    console.log("[menu-builder] normalized legacy categories", {
      restaurantId,
      count: legacyCategoryCount,
      defaultMenuId: defaultMenu._id.toString()
    });
  }

  if (legacyItemCount > 0) {
    const legacyItems = await MenuItem.find({
      restaurantId: restaurantObjectId,
      $or: [{ menuId: { $exists: false } }, { menuId: null }]
    });

    for (const item of legacyItems) {
      item.menuId = defaultMenu._id;
      item.channels = item.channels?.length ? item.channels : defaultMenu.channels ?? ["pos"];
      item.dayParts = item.dayParts?.length ? item.dayParts : defaultMenu.dayParts ?? ["all_day"];
      item.outletIds = item.outletIds?.length ? item.outletIds : defaultMenu.outletIds ?? ["main-outlet"];
      item.pricingMode = item.pricingMode ?? "base";
      item.dietary = item.dietary ?? "none";
      item.prepTimeMinutes = item.prepTimeMinutes ?? 0;
      await item.save();
    }

    console.log("[menu-builder] normalized legacy items", {
      restaurantId,
      count: legacyItemCount,
      defaultMenuId: defaultMenu._id.toString()
    });
  }
}

function serializeMenu(menu: any) {
  return {
    id: menu._id.toString(),
    restaurantId: menu.restaurantId.toString(),
    name: menu.name,
    slug: menu.slug,
    description: menu.description ?? "",
    channels: menu.channels ?? [],
    outletIds: menu.outletIds ?? [],
    dayParts: menu.dayParts ?? [],
    serviceModes: menu.serviceModes ?? [],
    isDefault: Boolean(menu.isDefault),
    isActive: Boolean(menu.isActive),
    sortOrder: menu.sortOrder ?? 0
  };
}

function serializeCategory(category: any) {
  return {
    id: category._id.toString(),
    restaurantId: category.restaurantId.toString(),
    menuId: category.menuId?.toString() ?? "",
    parentId: category.parentId?.toString() ?? "",
    name: category.name,
    slug: category.slug,
    nodeType: category.nodeType ?? "category",
    level: category.level ?? 0,
    path: category.path ?? [],
    channels: category.channels ?? [],
    dayParts: category.dayParts ?? [],
    outletIds: category.outletIds ?? [],
    sortOrder: category.sortOrder ?? 0,
    isActive: Boolean(category.isActive)
  };
}

function serializeItem(item: any) {
  return {
    id: item._id.toString(),
    restaurantId: item.restaurantId.toString(),
    menuId: item.menuId?.toString() ?? "",
    categoryId: item.categoryId.toString(),
    subcategoryId: item.subcategoryId?.toString() ?? "",
    name: item.name,
    slug: item.slug,
    sku: item.sku ?? "",
    description: item.description ?? "",
    imageUrl: item.imageUrl ?? "",
    itemType: item.itemType ?? "standard",
    dietary: item.dietary ?? "none",
    pricingMode: item.pricingMode ?? "base",
    price: item.price,
    taxRate: item.taxRate ?? 0,
    prepTimeMinutes: item.prepTimeMinutes ?? 0,
    isAvailable: Boolean(item.isAvailable),
    isActive: Boolean(item.isActive),
    autoDisableOnOutOfStock: Boolean(item.autoDisableOnOutOfStock),
    dayParts: item.dayParts ?? [],
    channels: item.channels ?? [],
    outletIds: item.outletIds ?? [],
    tags: item.tags ?? [],
    prepStation: item.prepStation ?? "",
    metadata: {
      bestSellerScore: item.metadata?.bestSellerScore ?? 0,
      lowPerformerScore: item.metadata?.lowPerformerScore ?? 0,
      suggestedComboScore: item.metadata?.suggestedComboScore ?? 0
    },
    sortOrder: item.sortOrder ?? 0
  };
}

function serializeVariant(variant: any) {
  return {
    id: variant._id.toString(),
    itemId: variant.itemId.toString(),
    groupName: variant.groupName,
    optionName: variant.optionName,
    variantType: variant.variantType,
    priceDelta: variant.priceDelta ?? 0,
    absolutePrice: variant.absolutePrice,
    sku: variant.sku ?? "",
    prepTimeOverride: variant.prepTimeOverride,
    sortOrder: variant.sortOrder ?? 0,
    isDefault: Boolean(variant.isDefault),
    isActive: Boolean(variant.isActive)
  };
}

function serializeAddonGroup(group: any) {
  return {
    id: group._id.toString(),
    itemId: group.itemId.toString(),
    name: group.name,
    selectionType: group.selectionType,
    minSelect: group.minSelect ?? 0,
    maxSelect: group.maxSelect ?? 1,
    required: Boolean(group.required),
    sortOrder: group.sortOrder ?? 0,
    isActive: Boolean(group.isActive)
  };
}

function serializeAddon(addon: any) {
  return {
    id: addon._id.toString(),
    itemId: addon.itemId.toString(),
    addonGroupId: addon.addonGroupId.toString(),
    name: addon.name,
    price: addon.price ?? 0,
    sku: addon.sku ?? "",
    sortOrder: addon.sortOrder ?? 0,
    isActive: Boolean(addon.isActive)
  };
}

function serializeCombo(combo: any) {
  return {
    id: combo._id.toString(),
    itemId: combo.itemId.toString(),
    name: combo.name,
    comboType: combo.comboType,
    discountedPrice: combo.discountedPrice,
    upsellTargetItemIds: (combo.upsellTargetItemIds ?? []).map((value: any) => value.toString()),
    components: (combo.components ?? []).map((component: any) => ({
      slotName: component.slotName,
      itemIds: (component.itemIds ?? []).map((value: any) => value.toString()),
      minSelect: component.minSelect ?? 1,
      maxSelect: component.maxSelect ?? 1
    })),
    isActive: Boolean(combo.isActive)
  };
}

function serializeInventoryMapping(mapping: any) {
  return {
    id: mapping._id.toString(),
    itemId: mapping.itemId.toString(),
    variantId: mapping.variantId?.toString() ?? "",
    ingredientName: mapping.ingredientName,
    stockUnit: mapping.stockUnit,
    quantityRequired: mapping.quantityRequired,
    wasteFactor: mapping.wasteFactor ?? 0,
    reorderThreshold: mapping.reorderThreshold ?? 0,
    isActive: Boolean(mapping.isActive)
  };
}

type AdvancedMenuItemInput = {
  restaurantId: string;
  menuId?: string;
  categoryId: string;
  subcategoryId?: string;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  imageUrl?: string;
  itemType: "standard" | "combo";
  dietary: "veg" | "non_veg" | "vegan" | "egg" | "none";
  pricingMode: "base" | "variant";
  price: number;
  taxRate: number;
  prepTimeMinutes: number;
  isAvailable: boolean;
  isActive: boolean;
  autoDisableOnOutOfStock: boolean;
  dayParts: string[];
  channels: string[];
  outletIds: string[];
  tags: string[];
  prepStation?: string;
  metadata: {
    bestSellerScore: number;
    lowPerformerScore: number;
    suggestedComboScore: number;
  };
  sortOrder: number;
  variants?: Array<{
    groupName: string;
    optionName: string;
    variantType: "size" | "quantity" | "custom";
    priceDelta: number;
    absolutePrice?: number;
    sku?: string;
    prepTimeOverride?: number;
    sortOrder: number;
    isDefault: boolean;
    isActive: boolean;
  }>;
  addonGroups?: Array<{
    name: string;
    selectionType: "single" | "multi";
    minSelect: number;
    maxSelect: number;
    required: boolean;
    sortOrder: number;
    isActive: boolean;
    addons: Array<{
      name: string;
      price: number;
      sku?: string;
      sortOrder: number;
      isActive: boolean;
    }>;
  }>;
  combo?: {
    name: string;
    comboType: "fixed" | "customizable";
    discountedPrice?: number;
    upsellTargetItemIds: string[];
    components: Array<{
      slotName: string;
      itemIds: string[];
      minSelect: number;
      maxSelect: number;
    }>;
    isActive: boolean;
  };
  inventoryMappings?: Array<{
    variantId?: string;
    ingredientName: string;
    stockUnit: string;
    quantityRequired: number;
    wasteFactor: number;
    reorderThreshold: number;
    isActive: boolean;
  }>;
};

export async function getMenuBuilderWorkspace(restaurantId: string) {
  await connectToDatabase();
  await normalizeLegacyMenuHierarchy(restaurantId);

  const restaurantObjectId = toId(restaurantId);
  const [menus, categories, items, variants, addonGroups, addons, combos, inventoryMappings] =
    await Promise.all([
      Menu.find({ restaurantId: restaurantObjectId, isActive: true }).sort({ sortOrder: 1 }).lean(),
      MenuCategory.find({ restaurantId: restaurantObjectId, menuId: { $exists: true } })
        .sort({ level: 1, sortOrder: 1, name: 1 })
        .lean(),
      MenuItem.find({
        restaurantId: restaurantObjectId,
        menuId: { $exists: true },
        isActive: true
      })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      ItemVariant.find({ restaurantId: restaurantObjectId, isActive: true })
        .sort({ sortOrder: 1, optionName: 1 })
        .lean(),
      ItemAddonGroup.find({ restaurantId: restaurantObjectId, isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      ItemAddon.find({ restaurantId: restaurantObjectId, isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      Combo.find({ restaurantId: restaurantObjectId, isActive: true }).lean(),
      InventoryMapping.find({ restaurantId: restaurantObjectId, isActive: true }).lean()
    ]);

  console.log("[menu-builder] raw query counts", {
    restaurantId,
    menus: menus.length,
    categories: categories.length,
    items: items.length,
    variants: variants.length,
    addonGroups: addonGroups.length,
    addons: addons.length,
    combos: combos.length,
    inventoryMappings: inventoryMappings.length
  });

  const serializedMenus = menus.map(serializeMenu);
  const serializedCategories = categories.map(serializeCategory);
  const serializedItems = items.map(serializeItem);
  const serializedVariants = variants.map(serializeVariant);
  const serializedAddonGroups = addonGroups.map(serializeAddonGroup);
  const serializedAddons = addons.map(serializeAddon);
  const serializedCombos = combos.map(serializeCombo);
  const serializedInventoryMappings = inventoryMappings.map(serializeInventoryMapping);

  const variantsByItem = new Map<string, ReturnType<typeof serializeVariant>[]>();
  for (const variant of serializedVariants) {
    variantsByItem.set(variant.itemId, [...(variantsByItem.get(variant.itemId) ?? []), variant]);
  }

  const addonsByGroup = new Map<string, ReturnType<typeof serializeAddon>[]>();
  for (const addon of serializedAddons) {
    addonsByGroup.set(addon.addonGroupId, [...(addonsByGroup.get(addon.addonGroupId) ?? []), addon]);
  }

  const addonGroupsByItem = new Map<
    string,
    Array<ReturnType<typeof serializeAddonGroup> & { addons: ReturnType<typeof serializeAddon>[] }>
  >();
  for (const group of serializedAddonGroups) {
    addonGroupsByItem.set(group.itemId, [
      ...(addonGroupsByItem.get(group.itemId) ?? []),
      {
        ...group,
        addons: addonsByGroup.get(group.id) ?? []
      }
    ]);
  }

  const combosByItem = new Map<string, ReturnType<typeof serializeCombo>[]>();
  for (const combo of serializedCombos) {
    combosByItem.set(combo.itemId, [...(combosByItem.get(combo.itemId) ?? []), combo]);
  }

  const inventoryByItem = new Map<string, ReturnType<typeof serializeInventoryMapping>[]>();
  for (const mapping of serializedInventoryMappings) {
    inventoryByItem.set(mapping.itemId, [
      ...(inventoryByItem.get(mapping.itemId) ?? []),
      mapping
    ]);
  }

  const itemsByCategory = new Map<string, any[]>();
  for (const item of serializedItems) {
    const bucketKey = item.subcategoryId || item.categoryId;
    itemsByCategory.set(bucketKey, [
      ...(itemsByCategory.get(bucketKey) ?? []),
      {
        ...item,
        variants: variantsByItem.get(item.id) ?? [],
        addonGroups: addonGroupsByItem.get(item.id) ?? [],
        combos: combosByItem.get(item.id) ?? [],
        inventoryMappings: inventoryByItem.get(item.id) ?? []
      }
    ]);
  }

  const categoriesByMenu = new Map<string, any[]>();
  const subcategoriesByParent = new Map<string, any[]>();

  for (const category of serializedCategories) {
    if (category.parentId) {
      subcategoriesByParent.set(category.parentId, [
        ...(subcategoriesByParent.get(category.parentId) ?? []),
        category
      ]);
    } else {
      categoriesByMenu.set(category.menuId, [...(categoriesByMenu.get(category.menuId) ?? []), category]);
    }
  }

  const tree = serializedMenus.map((menu) => ({
    ...menu,
    categories: (categoriesByMenu.get(menu.id) ?? []).map((category) => ({
      ...category,
      items: itemsByCategory.get(category.id) ?? [],
      subcategories: (subcategoriesByParent.get(category.id) ?? []).map((subcategory) => ({
        ...subcategory,
        items: itemsByCategory.get(subcategory.id) ?? []
      }))
    }))
  }));

  return {
    menus: serializedMenus,
    categories: serializedCategories,
    items: serializedItems,
    variants: serializedVariants,
    addonGroups: serializedAddonGroups,
    addons: serializedAddons,
    combos: serializedCombos,
    inventoryMappings: serializedInventoryMappings,
    tree,
    summary: {
      menuCount: serializedMenus.length,
      categoryCount: serializedCategories.filter((item) => item.nodeType === "category").length,
      subcategoryCount: serializedCategories.filter((item) => item.nodeType === "subcategory")
        .length,
      itemCount: serializedItems.length,
      variantCount: serializedVariants.length,
      addonGroupCount: serializedAddonGroups.length,
      comboCount: serializedCombos.length,
      inventoryLinkedCount: new Set(serializedInventoryMappings.map((item) => item.itemId)).size
    }
  };
}

export async function createMenuDefinition(input: {
  restaurantId: string;
  name: string;
  slug: string;
  description?: string;
  channels: string[];
  outletIds: string[];
  dayParts: string[];
  serviceModes: string[];
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}) {
  await connectToDatabase();
  console.log("[menu-builder] createMenuDefinition input", input);

  const menu = await Menu.create({
    restaurantId: toId(input.restaurantId),
    name: input.name,
    slug: input.slug,
    description: input.description,
    channels: input.channels,
    outletIds: input.outletIds,
    dayParts: input.dayParts,
    serviceModes: input.serviceModes,
    isDefault: input.isDefault,
    isActive: input.isActive,
    sortOrder: input.sortOrder
  });

  console.log("[menu-builder] createMenuDefinition saved", {
    id: menu._id.toString(),
    name: menu.name,
    slug: menu.slug
  });

  return serializeMenu(menu.toObject());
}

export async function createMenuNode(input: {
  restaurantId: string;
  menuId?: string;
  parentId?: string;
  name: string;
  slug: string;
  nodeType: "category" | "subcategory";
  level: number;
  path: string[];
  channels: string[];
  dayParts: string[];
  outletIds: string[];
  sortOrder: number;
  isActive: boolean;
}) {
  await connectToDatabase();
  console.log("[menu-builder] createMenuNode input", input);

  const restaurantId = toId(input.restaurantId);
  const menuId = input.menuId ? toId(input.menuId) : undefined;
  const parentId = input.parentId ? toId(input.parentId) : undefined;
  const slug = String(input.slug || "").trim();
  const name = String(input.name || "").trim();
  if (!name || !slug) {
    throw new Error("Menu node name/slug is required.");
  }

  // Idempotent create: protects against double-submit / retries and cooperates with unique indexes.
  const node = await MenuCategory.findOneAndUpdate(
    {
      restaurantId,
      ...(menuId ? { menuId } : { menuId: { $exists: false } }),
      ...(parentId ? { parentId } : { parentId: { $in: [null, undefined] } }),
      slug
    },
    {
      $setOnInsert: {
        restaurantId,
        ...(menuId ? { menuId } : {}),
        ...(parentId ? { parentId } : { parentId: null }),
        name,
        slug,
        nodeType: input.nodeType,
        level: input.level,
        path: input.path,
        channels: input.channels,
        dayParts: input.dayParts,
        outletIds: input.outletIds,
        sortOrder: input.sortOrder,
        isActive: input.isActive
      }
    },
    { new: true, upsert: true }
  ).lean();

  console.log("[menu-builder] createMenuNode saved", {
    id: node._id.toString(),
    name: node.name,
    menuId: (node as any).menuId?.toString?.(),
    parentId: (node as any).parentId?.toString?.(),
    nodeType: (node as any).nodeType
  });

  return serializeCategory(node);
}

export async function createAdvancedMenuItem(input: AdvancedMenuItemInput) {
  await connectToDatabase();
  console.log("[menu-builder] createAdvancedMenuItem input", {
    name: input.name,
    menuId: input.menuId,
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId,
    variants: input.variants?.length ?? 0,
    addonGroups: input.addonGroups?.length ?? 0
  });

  const item = await MenuItem.create({
    restaurantId: toId(input.restaurantId),
    menuId: input.menuId ? toId(input.menuId) : undefined,
    categoryId: toId(input.categoryId),
    subcategoryId: input.subcategoryId ? toId(input.subcategoryId) : undefined,
    name: input.name,
    slug: input.slug,
    sku: input.sku?.trim() || undefined,
    description: input.description,
    imageUrl: input.imageUrl,
    itemType: input.itemType,
    dietary: input.dietary,
    pricingMode: input.pricingMode,
    price: input.price,
    taxRate: input.taxRate,
    prepTimeMinutes: input.prepTimeMinutes,
    isAvailable: input.isAvailable,
    isActive: input.isActive,
    autoDisableOnOutOfStock: input.autoDisableOnOutOfStock,
    dayParts: input.dayParts,
    channels: input.channels,
    outletIds: input.outletIds,
    tags: input.tags,
    prepStation: input.prepStation,
    metadata: input.metadata,
    sortOrder: input.sortOrder
  });

  const itemId = item._id.toString();
  console.log("[menu-builder] createAdvancedMenuItem saved", {
    id: itemId,
    name: item.name
  });

  if (input.variants?.length) {
    await ItemVariant.insertMany(
      input.variants.map((variant) => ({
        restaurantId: toId(input.restaurantId),
        itemId: item._id,
        ...variant
      }))
    );
  }

  if (input.addonGroups?.length) {
    for (const group of input.addonGroups) {
      const createdGroup = await ItemAddonGroup.create({
        restaurantId: toId(input.restaurantId),
        itemId: item._id,
        name: group.name,
        selectionType: group.selectionType,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        required: group.required,
        sortOrder: group.sortOrder,
        isActive: group.isActive
      });

      if (group.addons.length) {
        await ItemAddon.insertMany(
          group.addons.map((addon) => ({
            restaurantId: toId(input.restaurantId),
            itemId: item._id,
            addonGroupId: createdGroup._id,
            ...addon
          }))
        );
      }
    }
  }

  if (input.combo) {
    await Combo.create({
      restaurantId: toId(input.restaurantId),
      itemId: item._id,
      name: input.combo.name,
      comboType: input.combo.comboType,
      discountedPrice: input.combo.discountedPrice,
      upsellTargetItemIds: input.combo.upsellTargetItemIds.map((value) => toId(value)),
      components: input.combo.components.map((component) => ({
        slotName: component.slotName,
        itemIds: component.itemIds.map((value) => toId(value)),
        minSelect: component.minSelect,
        maxSelect: component.maxSelect
      })),
      isActive: input.combo.isActive
    });
  }

  if (input.inventoryMappings?.length) {
    await InventoryMapping.insertMany(
      input.inventoryMappings.map((mapping) => ({
        restaurantId: toId(input.restaurantId),
        itemId: item._id,
        variantId: mapping.variantId ? toId(mapping.variantId) : undefined,
        ingredientName: mapping.ingredientName,
        stockUnit: mapping.stockUnit,
        quantityRequired: mapping.quantityRequired,
        wasteFactor: mapping.wasteFactor,
        reorderThreshold: mapping.reorderThreshold,
        isActive: mapping.isActive
      }))
    );
  }

  return { id: itemId };
}

async function deleteItemsCascade(params: { restaurantId: string; itemIds: string[] }) {
  if (params.itemIds.length === 0) {
    return;
  }

  const restaurantObjectId = toId(params.restaurantId);
  const itemObjectIds = params.itemIds.map(toId);

  await Promise.all([
    ItemVariant.deleteMany({ restaurantId: restaurantObjectId, itemId: { $in: itemObjectIds } }),
    ItemAddonGroup.deleteMany({ restaurantId: restaurantObjectId, itemId: { $in: itemObjectIds } }),
    ItemAddon.deleteMany({ restaurantId: restaurantObjectId, itemId: { $in: itemObjectIds } }),
    Combo.deleteMany({ restaurantId: restaurantObjectId, itemId: { $in: itemObjectIds } }),
    InventoryMapping.deleteMany({ restaurantId: restaurantObjectId, itemId: { $in: itemObjectIds } }),
    MenuItem.deleteMany({ restaurantId: restaurantObjectId, _id: { $in: itemObjectIds } })
  ]);
}

export async function deleteMenuDefinitionCascade(params: { restaurantId: string; menuId: string }) {
  await connectToDatabase();
  const restaurantObjectId = toId(params.restaurantId);
  const menuObjectId = toId(params.menuId);

  const items = await MenuItem.find({ restaurantId: restaurantObjectId, menuId: menuObjectId })
    .select({ _id: 1 })
    .lean();
  const itemIds = items.map((item: any) => item._id.toString());

  await deleteItemsCascade({ restaurantId: params.restaurantId, itemIds });

  await Promise.all([
    MenuCategory.deleteMany({ restaurantId: restaurantObjectId, menuId: menuObjectId }),
    Menu.deleteOne({ restaurantId: restaurantObjectId, _id: menuObjectId })
  ]);

  return { id: params.menuId };
}

export async function deleteMenuNodeCascade(params: { restaurantId: string; categoryId: string }) {
  await connectToDatabase();
  const restaurantObjectId = toId(params.restaurantId);
  const categoryObjectId = toId(params.categoryId);

  const node = await MenuCategory.findOne({ restaurantId: restaurantObjectId, _id: categoryObjectId }).lean();
  if (!node) {
    throw new Error("Category node not found.");
  }

  const descendantIds: Types.ObjectId[] = [categoryObjectId];
  if (node.nodeType === "category") {
    const subcats = await MenuCategory.find({
      restaurantId: restaurantObjectId,
      parentId: categoryObjectId
    })
      .select({ _id: 1 })
      .lean();
    descendantIds.push(...subcats.map((item: any) => item._id));
  }

  const items = await MenuItem.find({
    restaurantId: restaurantObjectId,
    $or: [
      { categoryId: { $in: descendantIds } },
      { subcategoryId: { $in: descendantIds } }
    ]
  })
    .select({ _id: 1 })
    .lean();
  const itemIds = items.map((item: any) => item._id.toString());

  await deleteItemsCascade({ restaurantId: params.restaurantId, itemIds });

  await MenuCategory.deleteMany({ restaurantId: restaurantObjectId, _id: { $in: descendantIds } });

  return { id: params.categoryId };
}
