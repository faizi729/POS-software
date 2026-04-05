export type ImportedMenu = {
  menuName?: string;
  categories: Array<{
    name: string;
    items: Array<{
      name: string;
      price: number;
      variants?: Array<{
        groupName: string;
        optionName: string;
        variantType: "size" | "quantity" | "custom";
        absolutePrice: number;
      }>;
      addonGroups?: Array<{
        name: string;
        selectionType: "single" | "multi";
        addons: Array<{ name: string; price: number }>;
      }>;
    }>;
  }>;
};

type ParserOptions = {
  defaultMenuName?: string;
};

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").replace(/•/g, " ").trim();
}

function hasAlphabet(value: string) {
  return /[A-Za-z]/.test(value);
}

function isOnlySymbols(value: string) {
  const cleaned = value.replace(/\s+/g, "");
  if (!cleaned) return true;
  return /^[\.\-–—·••:;,_|/\\()\[\]{}'"`~!@#$%^&*+=<>?]+$/.test(cleaned);
}

function isValidItemName(name: string) {
  const cleaned = cleanLine(name);
  if (cleaned.length < 2) return false;
  if (!hasAlphabet(cleaned)) return false;
  if (isOnlySymbols(cleaned)) return false;
  return true;
}

function isValidPrice(price: number) {
  // POS guardrails: reject weird OCR garbage and zeroes.
  return Number.isFinite(price) && price >= 20 && price <= 2000;
}

function isLikelyCategory(line: string) {
  // Stricter category detector for multi-block menus.
  // A line is a category if:
  // - Mostly uppercase, OR
  // - Not numbered AND not containing a price (header-ish)
  // And it passes safety filters (no offers/footers).
  if (!line) return false;
  const cleaned = cleanLine(line.replace(/:$/, ""));
  if (cleaned.length < 2 || cleaned.length > 40) return false;
  if (/^\d+\.\s/.test(cleaned)) return false;
  if (parseTrailingPriceFromLine(cleaned) != null) return false;
  if (/\d/.test(cleaned)) return false; // reject offers like "BUY 1 GET 1"
  if (!hasAlphabet(cleaned)) return false;
  if (isOnlySymbols(cleaned)) return false;

  const blacklist = [
    "FREE",
    "DELIVERY",
    "T&C",
    "T & C",
    "TERMS",
    "CONDITIONS",
    "ABOVE",
    "BELOW",
    "NOTE",
    "OFFER",
    "OFFERS",
    "ONLY",
    "APPLICABLE",
    "TAX",
    "GST",
    "SERVICE",
    "CHARGES"
  ];
  const upperLine = cleaned.toUpperCase();
  if (blacklist.some((word) => upperLine.includes(word))) return false;

  const letters = cleaned.replace(/[^A-Za-z]/g, "");
  const upperLetters = cleaned.replace(/[^A-Z]/g, "");
  const upperRatio = letters.length ? upperLetters.length / letters.length : 0;

  // Mostly uppercase is a strong category signal
  if (upperRatio >= 0.8) return true;

  // Otherwise: header-ish short line with no numbering and no price.
  return cleaned.length <= 26;
}

function extractAllPricesFromLine(line: string) {
  // Strong normalization:
  // Accept patterns like:
  // "· 70.00", "$ 90.00", "7 80.00", "₴ 200.00", "·50.00"
  // Rule: take LAST valid number in the line, ignore everything else.
  const normalized = line
    .replace(/[,]/g, " ")
    .replace(/[^\d.\s]/g, " "); // drop currency/bullets/symbols but keep digits/dot/space
  const matches = normalized.match(/\d{1,5}(?:\.\d{1,2})?/g) ?? [];
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const price = Number(matches[i]);
    if (Number.isFinite(price) && isValidPrice(price)) {
      return [price];
    }
  }
  return [];
}

function parseTrailingPriceFromLine(line: string) {
  // Supports: "Pizza 99", "Pizza ..... 99.00", "₹99", "99/-"
  // Rule: take LAST numeric token in the line and validate range.
  const normalized = line
    .replace(/[,]/g, " ")
    .replace(/[^\d.\s]/g, " ");
  const matches = normalized.match(/\d{1,5}(?:\.\d{1,2})?/g) ?? [];
  if (matches.length === 0) return null;
  const price = Number(matches[matches.length - 1]);
  if (!Number.isFinite(price) || !isValidPrice(price)) return null;
  return price;
}

function stripTrailingPrice(line: string) {
  return cleanLine(line.replace(/[₹$]/g, "").replace(/(?:\d{1,5}(?:\.\d{1,2})?)\s*(?:\/-)?\s*$/, ""));
}

function stripTrailingNoiseNumberIfNotPrice(value: string) {
  // Fix OCR noise like: "Chicken maxican cheese garlic bread 7"
  // If trailing number is NOT a valid price, remove it from the name.
  const cleaned = cleanLine(value);
  const match = cleaned.match(/^(.*?)(\d{1,3})\s*$/);
  if (!match) return cleaned;
  const candidate = Number(match[2]);
  if (Number.isFinite(candidate) && isValidPrice(candidate)) {
    return cleaned;
  }
  return cleanLine(match[1]);
}

function parseVariantLine(line: string) {
  // Examples:
  // "Small 99"
  // "- Medium 149"
  // "Cheese Burst 199"
  const price = parseTrailingPriceFromLine(line);
  if (price == null) return null;
  if (!isValidPrice(price)) return null;
  const name = stripTrailingPrice(line).replace(/^[-–•]\s*/, "").trim();
  if (!isValidItemName(name)) return null;
  return { optionName: name, absolutePrice: price };
}

function parseNumberedItemLine(line: string) {
  // Requirement: detect numbering pattern /^\d+\.\s/
  const match = line.match(/^\s*(\d+)\.\s+(.+?)\s*$/);
  if (!match) return null;
  const rawName = stripTrailingNoiseNumberIfNotPrice(cleanLine(match[2]));
  if (!isValidItemName(rawName)) return null;
  // Inline trailing price inside numbered line.
  const inlinePrice = parseTrailingPriceFromLine(rawName);
  const name = inlinePrice != null ? stripTrailingPrice(rawName) : rawName;
  if (!isValidItemName(name)) return null;
  return { name, inlinePrice };
}

function looksLikeStandalonePriceLine(line: string) {
  // If line has no letters and has at least one valid price token, treat it as price-only.
  if (hasAlphabet(line)) return false;
  const prices = extractAllPricesFromLine(line);
  return prices.length > 0;
}

export function parseMenuFromOcrText(rawText: string, options: ParserOptions = {}): ImportedMenu {
  const lines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line && line.length > 1);

  const menu: ImportedMenu = {
    menuName: options.defaultMenuName,
    categories: []
  };

  // Global sequential mapping for column-based menus:
  // Traverse OCR text in order, track currentCategory, extract all items globally,
  // extract all prices globally (from price-only lines), then map items[i] -> prices[i].
  type GlobalItem = { name: string; categoryName: string; inlinePrice?: number };

  const items: GlobalItem[] = [];
  const prices: number[] = [];

  let currentCategoryName = "Uncategorized";
  let pendingCategory: string | null = null;

  for (const line of lines) {
    if (isOnlySymbols(line)) continue;

    // Multi-line category fix: consecutive category-like lines -> keep the latter.
    if (isLikelyCategory(line)) {
      pendingCategory = cleanLine(line.replace(/:$/, ""));
      continue;
    }

    if (pendingCategory) {
      currentCategoryName = pendingCategory;
      pendingCategory = null;
    }

    // Item extraction (global)
    const numbered = parseNumberedItemLine(line);
    if (numbered) {
      items.push({
        name: numbered.name,
        categoryName: currentCategoryName,
        inlinePrice: numbered.inlinePrice ?? undefined
      });
      continue;
    }

    // Inline price support for mixed formats (even without numbering)
    const trailingPrice = parseTrailingPriceFromLine(line);
    if (trailingPrice != null) {
      const maybeName = stripTrailingNoiseNumberIfNotPrice(stripTrailingPrice(line));
      if (isValidItemName(maybeName)) {
        items.push({ name: maybeName, categoryName: currentCategoryName, inlinePrice: trailingPrice });
        continue;
      }
    }

    // Price extraction (global)
    // IMPORTANT: only take prices from lines without letters so inline item prices aren't duplicated.
    if (looksLikeStandalonePriceLine(line)) {
      prices.push(...extractAllPricesFromLine(line));
    }
  }

  if (pendingCategory) {
    currentCategoryName = pendingCategory;
    pendingCategory = null;
  }

  const itemsNeedingPrice = items.filter((item) => item.inlinePrice == null);
  const inlineCount = items.length - itemsNeedingPrice.length;
  const mappedCount = Math.min(itemsNeedingPrice.length, prices.length);

  console.log("[ocr/parser] global extraction", {
    itemsFound: items.length,
    inlinePriced: inlineCount,
    pricesFound: prices.length,
    itemsNeedingPrice: itemsNeedingPrice.length,
    mappedItems: inlineCount + mappedCount
  });

  if (items.length !== inlineCount + prices.length) {
    console.log("[ocr/parser] global mismatch", {
      items: items.length,
      inline: inlineCount,
      prices: prices.length,
      willMap: mappedCount
    });
  }

  const itemsByCategory = new Map<string, ImportedMenu["categories"][number]["items"]>();
  let priceIndex = 0;

  for (const item of items) {
    if (!isValidItemName(item.name)) continue;
    const effectivePrice =
      item.inlinePrice != null ? item.inlinePrice : prices[priceIndex++];
    if (!isValidPrice(effectivePrice)) continue;
    const bucket = itemsByCategory.get(item.categoryName) ?? [];
    bucket.push({ name: item.name, price: effectivePrice, variants: undefined, addonGroups: undefined });
    itemsByCategory.set(item.categoryName, bucket);
  }

  for (const [categoryName, categoryItems] of itemsByCategory.entries()) {
    if (!categoryItems.length) continue;
    menu.categories.push({ name: categoryName, items: categoryItems });
  }

  // Cleanup: remove empty categories
  menu.categories = menu.categories.filter((category) => category.items.length > 0);
  if (menu.categories.length === 0) {
    menu.categories = [{ name: "Imported", items: [] }];
  }

  // High-level debug info
  const totalItems = menu.categories.reduce((sum, category) => sum + category.items.length, 0);
  console.log("[ocr/parser] extracted result", {
    categories: menu.categories.length,
    items: totalItems
  });

  return menu;
}

