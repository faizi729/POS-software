import { NextRequest } from "next/server";
import crypto from "crypto";

import { ok, handleRouteError } from "@/lib/api/response";
import { assertRole, requireSession } from "@/lib/auth/guards";
import { slugify } from "@/lib/utils/slugify";
import { type ImportedMenu } from "@/lib/ocr/menu-import-parser";
import { extractMenuHybrid } from "@/lib/ocr/menu-extraction-engine";
import { activeChatModel, activeChatProvider, chatJson } from "@/lib/ai/chat-json";
import { isOcrConfigured, ocrDocumentFile, ocrMissingKeyMessage } from "@/lib/ocr/document-ocr";
import { validateUploads } from "@/lib/middleware/upload-validate";
import { fail } from "@/lib/api/response";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";
import {
  createAdvancedMenuItem,
  createMenuDefinition,
  createMenuNode,
  getMenuBuilderWorkspace
} from "@/server/repositories/menu-builder-repository";
import { MenuCategory, MenuItem } from "@/models";

/** Sarvam Vision jobs are async (create -> poll -> results); allow a long run. */
export const maxDuration = 120;

function isValidItemName(name: string) {
  const cleaned = String(name ?? "").replace(/\s+/g, " ").trim();
  if (cleaned.length < 2) return false;
  if (!/[A-Za-z]/.test(cleaned)) return false;
  const noSpace = cleaned.replace(/\s+/g, "");
  if (!noSpace) return false;
  if (/^[\.\-–—·••:;,_|/\\()\[\]{}'"`~!@#$%^&*+=<>?]+$/.test(noSpace)) return false;
  return true;
}

function isValidPrice(price: number) {
  return Number.isFinite(price) && price >= 20 && price <= 2000;
}

function normalizeCategoryName(name: string) {
  const cleaned = String(name ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Uncategorized";
  const slug = slugify(cleaned);
  const generic = new Set(["imported", "general", "others", "other"]);
  if (generic.has(slug)) return "Uncategorized";
  return cleaned;
}

function normalizeCategorySlug(name: string) {
  return slugify(normalizeCategoryName(name));
}

function shortId(length = 4) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

function buildSku(params: { categoryName: string; itemName: string }) {
  const category = slugify(params.categoryName || "item");
  const item = slugify(params.itemName || "item");
  const base = `${category}-${item}`;
  const suffix = shortId(4);
  // MenuItem.sku max is 40 chars. Keep a buffer for "-" and suffix.
  const maxBaseLen = 40 - (suffix.length + 1);
  const trimmedBase = base.length > maxBaseLen ? base.slice(0, maxBaseLen).replace(/-+$/g, "") : base;
  return `${trimmedBase}-${suffix}`;
}

async function generateUniqueSku(params: { restaurantId: string; categoryName: string; itemName: string }) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const sku = buildSku({ categoryName: params.categoryName, itemName: params.itemName });
    // eslint-disable-next-line no-await-in-loop
    const exists = await MenuItem.exists({ restaurantId: params.restaurantId as any, sku });
    if (!exists) {
      return sku;
    }
  }
  return `${slugify(params.categoryName || "item")}-${slugify(params.itemName || "item")}-${Date.now()}`.slice(0, 40);
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    assertRole(session, ["owner", "manager"]);

    const rl = await rateLimit({
      request,
      keyParts: ["ocr-menu-single", session.restaurantId, getClientIp(request)],
      limit: 30,
      windowMs: 60_000,
      onHit: () => console.warn("[rate-limit] /api/menu/ocr/import")
    });
    if (!rl.ok) return fail("Too many requests. Try again soon.", 429);

    const aiProvider = activeChatProvider();
    const aiModel = activeChatModel("menu");

    if (!isOcrConfigured()) {
      return ok({ error: ocrMissingKeyMessage() }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("image");
    const menuName = String(form.get("menuName") || "Imported Menu").trim() || "Imported Menu";

    if (!file || !(file instanceof File)) {
      return ok({ error: "Missing image file (field name: image)." }, { status: 400 });
    }

    const valid = validateUploads({ files: [file], maxFiles: 1, maxBytesPerFile: 5 * 1024 * 1024 });
    if (!valid.ok) return fail(valid.error, 400);

    const ocr = await ocrDocumentFile({ file });
    console.log(`[menu/ocr/import] OCR (${ocr.provider}) TEXT BEFORE PARSE\n`, ocr.text);
    const { menu: imported, log } = await extractMenuHybrid({
      rawOcrText: ocr.text,
      menuName,
      ai: aiProvider === "none" ? undefined : { chatJson, provider: aiProvider, model: aiModel }
    });
    console.log("[menu/ocr/import] extraction log", log);

    // SAFETY: if any legacy items accidentally stored sku=null, it will break the unique sparse index.
    // Unset it before we insert new imported items.
    await MenuItem.updateMany(
      { restaurantId: session.restaurantId as any, sku: null },
      { $unset: { sku: "" } }
    );

    // Create a new menu definition (always) to avoid merging mistakes.
    const currentWorkspace = await getMenuBuilderWorkspace(session.restaurantId);
    const baseSlug = slugify(imported.menuName || menuName || "imported-menu");
    const uniqueSlug = `${baseSlug}-${Date.now()}`;
    const createdMenu = await createMenuDefinition({
      restaurantId: session.restaurantId,
      name: imported.menuName || menuName,
      slug: uniqueSlug,
      description: "Imported from image via OCR",
      channels: ["pos"],
      outletIds: [],
      dayParts: ["all_day"],
      serviceModes: ["dine_in", "takeaway"],
      isDefault: currentWorkspace.tree.length === 0,
      isActive: true,
      sortOrder: currentWorkspace.tree.length + 1
    });

    let createdCategoryCount = 0;
    let createdItemCount = 0;
    let createdVariantCount = 0;
    let createdAddonGroupCount = 0;

    // Category cache (during this import): categorySlug -> categoryId
    const categoryMap = new Map<string, string>();

    for (const category of imported.categories) {
      const normalizedCategoryName = normalizeCategoryName(category.name);
      const categorySlug = normalizeCategorySlug(category.name);

      let categoryId = categoryMap.get(categorySlug);

      if (!categoryId) {
        const existing = await MenuCategory.findOne({
          restaurantId: session.restaurantId as any,
          menuId: createdMenu.id as any,
          slug: categorySlug,
          $or: [{ parentId: { $exists: false } }, { parentId: null }]
        })
          .select({ _id: 1 })
          .lean();

        if (existing?._id) {
          categoryId = existing._id.toString();
        } else {
          const createdCategory = await createMenuNode({
            restaurantId: session.restaurantId,
            menuId: createdMenu.id,
            parentId: undefined,
            name: normalizedCategoryName,
            slug: categorySlug,
            nodeType: "category",
            level: 0,
            path: [normalizedCategoryName],
            channels: ["pos"],
            dayParts: ["all_day"],
            outletIds: [],
            sortOrder: createdCategoryCount + 1,
            isActive: true
          });
          createdCategoryCount += 1;
          categoryId = createdCategory.id;
        }

        if (!categoryId) {
          throw new Error(`Failed to resolve categoryId for category "${normalizedCategoryName}".`);
        }
        categoryMap.set(categorySlug, categoryId);
      }

      for (const item of category.items) {
        // Final safety gate before DB insert.
        if (!isValidItemName(item.name)) {
          continue;
        }

        const variants =
          item.variants?.map((variant, index) => {
            createdVariantCount += 1;
            return {
              groupName: variant.groupName,
              optionName: variant.optionName,
              variantType: variant.variantType,
              absolutePrice: variant.absolutePrice,
              priceDelta: 0,
              sortOrder: index + 1,
              isDefault: index === 0,
              isActive: true
            };
          }) ?? [];

        const addonGroups =
          item.addonGroups?.map((group, index) => {
            createdAddonGroupCount += 1;
            return {
              name: group.name,
              selectionType: group.selectionType,
              minSelect: 0,
              maxSelect: group.selectionType === "single" ? 1 : 5,
              required: false,
              sortOrder: index + 1,
              isActive: true,
              addons: group.addons.map((addon, addonIndex) => ({
                name: addon.name,
                price: addon.price,
                sortOrder: addonIndex + 1,
                isActive: true
              }))
            };
          }) ?? [];

        const basePrice = item.price ?? variants[0]?.absolutePrice ?? 0;

        const hasValidVariant = variants.some(
          (variant) => typeof variant.absolutePrice === "number" && isValidPrice(variant.absolutePrice)
        );
        const hasValidBasePrice = isValidPrice(basePrice);

        // Only insert items with a valid base price OR at least one valid variant price.
        if (!hasValidBasePrice && !hasValidVariant) {
          continue;
        }

        const sku = await generateUniqueSku({
          restaurantId: session.restaurantId,
          categoryName: normalizedCategoryName,
          itemName: item.name
        });

        if (!categoryId) {
          continue;
        }

        await createAdvancedMenuItem({
          restaurantId: session.restaurantId,
          menuId: createdMenu.id,
          categoryId,
          subcategoryId: undefined,
          name: item.name,
          slug: slugify(item.name),
          sku,
          itemType: "standard",
          dietary: "none",
          pricingMode: variants.length ? "variant" : "base",
          price: hasValidBasePrice ? basePrice : variants.find((v) => isValidPrice(v.absolutePrice ?? 0))?.absolutePrice ?? 0,
          taxRate: 0,
          prepTimeMinutes: 10,
          isAvailable: true,
          isActive: true,
          autoDisableOnOutOfStock: false,
          dayParts: ["all_day"],
          channels: ["pos"],
          outletIds: [],
          tags: [],
          metadata: {
            bestSellerScore: 0,
            lowPerformerScore: 0,
            suggestedComboScore: 0
          },
          sortOrder: createdItemCount + 1,
          variants: variants.filter((v) => isValidItemName(v.optionName) && isValidPrice(v.absolutePrice ?? 0)),
          addonGroups: addonGroups
            .map((group) => ({
              ...group,
              addons: group.addons.filter((addon) => isValidItemName(addon.name) && isValidPrice(addon.price))
            }))
            .filter((group) => group.addons.length > 0),
          inventoryMappings: []
        });

        createdItemCount += 1;
      }
    }

    const nextWorkspace = await getMenuBuilderWorkspace(session.restaurantId);

    return ok({
      menuId: createdMenu.id,
      menuName: createdMenu.name,
      parsedTextPreview: ocr.text.slice(0, 1200),
      created: {
        categories: createdCategoryCount,
        items: createdItemCount,
        variants: createdVariantCount,
        addonGroups: createdAddonGroupCount
      },
      ai: {
        enabled: aiProvider !== "none",
        provider: aiProvider,
        model: aiModel
      },
      ocr: {
        provider: ocr.provider,
        warnings: ocr.warnings,
        jobId: ocr.jobId ?? null
      },
      workspace: nextWorkspace
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

