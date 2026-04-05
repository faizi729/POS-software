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

export async function ensureMenuEngineSeed(restaurantId: string) {
  const menuCount = await Menu.countDocuments({ restaurantId });

  if (menuCount > 0) {
    return;
  }

  const categories = await MenuCategory.find({ restaurantId, isActive: true }).sort({ sortOrder: 1 });
  const items = await MenuItem.find({ restaurantId, isActive: true }).sort({ sortOrder: 1 });

  const menu = await Menu.create({
    restaurantId,
    name: "Main Menu",
    slug: "main-menu",
    description: "Primary service menu powering POS, QR ordering, and web channels.",
    channels: ["pos", "website", "qr"],
    outletIds: ["main-outlet", "pickup-counter"],
    dayParts: ["all_day"],
    serviceModes: ["dine_in", "takeaway", "delivery"],
    isDefault: true,
    isActive: true,
    sortOrder: 1
  });

  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const mains = categoryBySlug.get("mains") ?? categories[0];
  const drinks = categoryBySlug.get("drinks") ?? categories[1];
  const sides = categoryBySlug.get("sides") ?? categories[2];
  const desserts = categoryBySlug.get("desserts") ?? categories[3];

  for (const category of categories) {
    category.menuId = menu._id;
    category.parentId = undefined;
    category.nodeType = "category";
    category.level = 0;
    category.path = [category.name];
    category.channels = ["pos", "website", "qr"];
    category.dayParts = ["all_day"];
    category.outletIds = ["main-outlet"];
    await category.save();
  }

  const subcategoriesToCreate = [
    mains
      ? {
          restaurantId,
          menuId: menu._id,
          parentId: mains._id,
          name: "Chef Specials",
          slug: "chef-specials",
          nodeType: "subcategory",
          level: 1,
          path: ["Mains", "Chef Specials"],
          channels: ["pos", "website", "qr"],
          dayParts: ["lunch", "dinner"],
          outletIds: ["main-outlet"],
          sortOrder: 1,
          isActive: true
        }
      : null,
    drinks
      ? {
          restaurantId,
          menuId: menu._id,
          parentId: drinks._id,
          name: "Signature Brews",
          slug: "signature-brews",
          nodeType: "subcategory",
          level: 1,
          path: ["Drinks", "Signature Brews"],
          channels: ["pos", "website", "qr"],
          dayParts: ["breakfast", "lunch", "all_day"],
          outletIds: ["main-outlet", "pickup-counter"],
          sortOrder: 1,
          isActive: true
        }
      : null,
    sides
      ? {
          restaurantId,
          menuId: menu._id,
          parentId: sides._id,
          name: "Shareables",
          slug: "shareables",
          nodeType: "subcategory",
          level: 1,
          path: ["Sides", "Shareables"],
          channels: ["pos", "website"],
          dayParts: ["lunch", "dinner"],
          outletIds: ["main-outlet"],
          sortOrder: 1,
          isActive: true
        }
      : null,
    desserts
      ? {
          restaurantId,
          menuId: menu._id,
          parentId: desserts._id,
          name: "Counter Desserts",
          slug: "counter-desserts",
          nodeType: "subcategory",
          level: 1,
          path: ["Desserts", "Counter Desserts"],
          channels: ["pos", "qr"],
          dayParts: ["all_day"],
          outletIds: ["main-outlet"],
          sortOrder: 1,
          isActive: true
        }
      : null
  ].filter(Boolean);

  const createdSubcategories = subcategoriesToCreate.length
    ? await MenuCategory.insertMany(subcategoriesToCreate)
    : [];
  const subcategoryBySlug = new Map(createdSubcategories.map((category) => [category.slug, category]));

  const itemBySlug = new Map(items.map((item) => [item.slug, item]));

  for (const item of items) {
    item.menuId = menu._id;
    item.channels = ["pos", "website", "qr"];
    item.dayParts = ["all_day"];
    item.outletIds = ["main-outlet"];
    item.prepTimeMinutes = item.prepTimeMinutes ?? 12;
    item.pricingMode = "base";
    item.dietary = item.slug.includes("cold-brew") ? "vegan" : "non_veg";
    item.autoDisableOnOutOfStock = true;
    item.metadata = {
      bestSellerScore: item.slug.includes("chicken") ? 92 : item.slug.includes("cold-brew") ? 78 : 46,
      lowPerformerScore: item.slug.includes("yuzu") ? 60 : 20,
      suggestedComboScore: item.slug.includes("fries") ? 85 : 45
    };

    if (item.slug === "charred-chicken-bowl" && subcategoryBySlug.get("chef-specials")) {
      item.subcategoryId = subcategoryBySlug.get("chef-specials")!._id;
      item.tags = ["Best seller", "Lunch hero"];
    }

    if (item.slug === "brown-butter-pasta" && subcategoryBySlug.get("chef-specials")) {
      item.subcategoryId = subcategoryBySlug.get("chef-specials")!._id;
      item.tags = ["Dinner pick"];
    }

    if (item.slug === "citrus-cold-brew" && subcategoryBySlug.get("signature-brews")) {
      item.subcategoryId = subcategoryBySlug.get("signature-brews")!._id;
      item.tags = ["Brew bar"];
      item.pricingMode = "variant";
      item.dietary = "vegan";
      item.prepTimeMinutes = 4;
    }

    if (item.slug === "smoked-truffle-fries" && subcategoryBySlug.get("shareables")) {
      item.subcategoryId = subcategoryBySlug.get("shareables")!._id;
      item.tags = ["Upsell"];
    }

    if (item.slug === "yuzu-cheesecake" && subcategoryBySlug.get("counter-desserts")) {
      item.subcategoryId = subcategoryBySlug.get("counter-desserts")!._id;
      item.tags = ["Dessert"];
      item.dietary = "veg";
    }

    await item.save();
  }

  const existingCombo = await MenuItem.findOne({ restaurantId, slug: "lunch-power-combo" });
  let comboItem = existingCombo;

  if (!comboItem && mains) {
    comboItem = await MenuItem.create({
      restaurantId,
      menuId: menu._id,
      categoryId: mains._id,
      subcategoryId: subcategoryBySlug.get("chef-specials")?._id,
      name: "Lunch Power Combo",
      slug: "lunch-power-combo",
      sku: "CMB-501",
      description: "Chicken bowl + fries + cold brew with a bundle price.",
      itemType: "combo",
      dietary: "non_veg",
      pricingMode: "base",
      price: 29,
      taxRate: 8,
      prepTimeMinutes: 14,
      isAvailable: true,
      isActive: true,
      autoDisableOnOutOfStock: true,
      dayParts: ["lunch", "dinner"],
      channels: ["pos", "website", "qr"],
      outletIds: ["main-outlet"],
      tags: ["Combo", "Upsell"],
      prepStation: "Kitchen",
      metadata: {
        bestSellerScore: 70,
        lowPerformerScore: 10,
        suggestedComboScore: 96
      },
      sortOrder: items.length + 1
    });
  }

  const coldBrew = itemBySlug.get("citrus-cold-brew");
  if (coldBrew) {
    await ItemVariant.insertMany([
      {
        restaurantId,
        itemId: coldBrew._id,
        groupName: "Size",
        optionName: "Small",
        variantType: "size",
        priceDelta: 0,
        absolutePrice: 6,
        sku: "D-301-S",
        prepTimeOverride: 4,
        sortOrder: 1,
        isDefault: true,
        isActive: true
      },
      {
        restaurantId,
        itemId: coldBrew._id,
        groupName: "Size",
        optionName: "Medium",
        variantType: "size",
        priceDelta: 2,
        absolutePrice: 8,
        sku: "D-301-M",
        prepTimeOverride: 5,
        sortOrder: 2,
        isDefault: false,
        isActive: true
      },
      {
        restaurantId,
        itemId: coldBrew._id,
        groupName: "Sugar Level",
        optionName: "Low",
        variantType: "custom",
        priceDelta: 0,
        sortOrder: 3,
        isDefault: true,
        isActive: true
      },
      {
        restaurantId,
        itemId: coldBrew._id,
        groupName: "Sugar Level",
        optionName: "Regular",
        variantType: "custom",
        priceDelta: 0,
        sortOrder: 4,
        isDefault: false,
        isActive: true
      }
    ]);
  }

  const fries = itemBySlug.get("smoked-truffle-fries");
  if (fries) {
    const dipsGroup = await ItemAddonGroup.create({
      restaurantId,
      itemId: fries._id,
      name: "Choose your dip",
      selectionType: "single",
      minSelect: 0,
      maxSelect: 1,
      required: false,
      sortOrder: 1,
      isActive: true
    });

    await ItemAddon.insertMany([
      {
        restaurantId,
        itemId: fries._id,
        addonGroupId: dipsGroup._id,
        name: "Black garlic aioli",
        price: 0,
        sortOrder: 1,
        isActive: true
      },
      {
        restaurantId,
        itemId: fries._id,
        addonGroupId: dipsGroup._id,
        name: "Smoked chilli mayo",
        price: 1.5,
        sortOrder: 2,
        isActive: true
      }
    ]);
  }

  const chickenBowl = itemBySlug.get("charred-chicken-bowl");
  if (chickenBowl) {
    const toppingsGroup = await ItemAddonGroup.create({
      restaurantId,
      itemId: chickenBowl._id,
      name: "Boosters",
      selectionType: "multi",
      minSelect: 0,
      maxSelect: 2,
      required: false,
      sortOrder: 1,
      isActive: true
    });

    await ItemAddon.insertMany([
      {
        restaurantId,
        itemId: chickenBowl._id,
        addonGroupId: toppingsGroup._id,
        name: "Extra avocado",
        price: 3,
        sortOrder: 1,
        isActive: true
      },
      {
        restaurantId,
        itemId: chickenBowl._id,
        addonGroupId: toppingsGroup._id,
        name: "Double protein",
        price: 5,
        sortOrder: 2,
        isActive: true
      }
    ]);

    await InventoryMapping.insertMany([
      {
        restaurantId,
        itemId: chickenBowl._id,
        ingredientName: "Chicken breast",
        stockUnit: "g",
        quantityRequired: 180,
        wasteFactor: 0.05,
        reorderThreshold: 1500,
        isActive: true
      },
      {
        restaurantId,
        itemId: chickenBowl._id,
        ingredientName: "Herb rice",
        stockUnit: "g",
        quantityRequired: 220,
        wasteFactor: 0.03,
        reorderThreshold: 2000,
        isActive: true
      }
    ]);
  }

  if (comboItem && chickenBowl && fries && coldBrew) {
    await Combo.create({
      restaurantId,
      itemId: comboItem._id,
      name: "Lunch Power Combo",
      comboType: "fixed",
      discountedPrice: 29,
      upsellTargetItemIds: [chickenBowl._id, fries._id],
      components: [
        {
          slotName: "Main",
          itemIds: [chickenBowl._id],
          minSelect: 1,
          maxSelect: 1
        },
        {
          slotName: "Side",
          itemIds: [fries._id],
          minSelect: 1,
          maxSelect: 1
        },
        {
          slotName: "Drink",
          itemIds: [coldBrew._id],
          minSelect: 1,
          maxSelect: 1
        }
      ],
      isActive: true
    });
  }
}
