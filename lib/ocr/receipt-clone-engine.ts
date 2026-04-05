export type ReceiptOcrWord = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence?: number;
};

export type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
  total: number;
  confidence: number; // 0..1 heuristic
  sourceLine?: string;
};

export type ReceiptTaxes = {
  cgst: number;
  sgst: number;
  gst: number;
};

export type ReceiptStructured = {
  restaurant_name: string;
  gst_number: string;
  address: string;
  date: string; // ISO-ish when possible, else raw
  bill_number: string;
  items: ReceiptItem[];
  subtotal: number;
  taxes: ReceiptTaxes;
  grand_total: number;
  currency: "INR" | "UNKNOWN";
};

export type ReceiptLayoutSection =
  | { type: "header"; alignment: "left" | "center" | "right"; lines: string[] }
  | {
      type: "table";
      columns: Array<{ key: "name" | "qty" | "price" | "total"; align: "left" | "right"; widthChars: number }>;
      rows: Array<{ name: string; qty: string; price: string; total: string; raw?: string }>;
    }
  | { type: "totals"; alignment: "right"; lines: Array<{ label: string; value: string; key?: string }> }
  | { type: "footer"; alignment: "center" | "left" | "right"; lines: string[] };

export type ReceiptLayoutModel = {
  widthMm: 80;
  fontFamily: "monospace" | "sans";
  sections: ReceiptLayoutSection[];
};

export type ReceiptCloneResult = {
  structured: ReceiptStructured;
  layout: ReceiptLayoutModel;
  debug: {
    rawTextPreview: string;
    cleanedLines: string[];
    headerLines: string[];
    itemLines: string[];
    totalsLines: string[];
    footerLines: string[];
    warnings: string[];
  };
};

export type ReceiptCloneInput = {
  rawText: string;
  words?: ReceiptOcrWord[]; // optional for future spatial grouping
  currency?: "INR";
};

const KEYWORDS = {
  total: [/grand\s*total/i, /\bnet\s*amount\b/i, /\btotal\b/i, /\bbill\s*total\b/i],
  subtotal: [/\bsub\s*total\b/i, /\bsubtotal\b/i],
  cgst: [/\bcgst\b/i],
  sgst: [/\bsgst\b/i],
  gst: [/\bgst\b/i, /\bvat\b/i],
  itemHeader: [/\bitem\b/i, /\bparticulars\b/i, /\bqty\b/i, /\brate\b/i, /\bamount\b/i]
};

// Lines that should never be treated as items even if they contain numbers
const FORBIDDEN_ITEM_RE: RegExp[] = [
  /\bgst\s*no\b/i,
  /\bgstin\b/i,
  /\bcgst\b/i,
  /\bsgst\b/i,
  /\bgst\b/i,
  /\bfssai\b/i,
  /\bphone\b/i,
  /\bph[:.]?/i,
  /\bmob[:.]?/i,
  /\bmobile\b/i,
  /\bdate\b/i,
  /\bbill\s*(no|#|number)?\b/i,
  /\bcash\s*memo\b/i,
  /\bserver\b/i,
  /\btable\b/i,
  /\bpax\b/i,
  /\baddress\b/i,
  /\bshop\s*no\b/i,
  /\broad\b/i, // catches road/rd
  /\brd\b/i,
  /\bst(reet)?\b/i,
  /\bsector\b/i,
  /\bplot\b/i,
  /\bnear\b/i,
  /\bmumbai\b/i,
  /\bbandra\b/i,
  /\bpin\b/i
];

function cleanOcrText(raw: string) {
  // Keep line structure; normalize common OCR artifacts.
  const normalized = raw
    .replaceAll(/\u00A0/g, " ")
    .replaceAll(/[|]/g, " ")
    .replaceAll(/[₹]/g, "₹")
    .replaceAll(/[“”]/g, '"')
    .replaceAll(/[‘’]/g, "'")
    .replaceAll(/[•·]/g, "·")
    .replaceAll(/\t/g, " ")
    .replaceAll(/\r\n/g, "\n")
    .replaceAll(/\r/g, "\n");

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.replaceAll(/\s{2,}/g, " "))
    .filter((line) => line.length > 0);

  return { normalized, lines };
}

function fixOcrCommonMistakes(line: string) {
  // Conservative fixes: only inside numeric-ish tokens.
  return line
    .replaceAll(/\bRs\.?\b/gi, "₹")
    .replaceAll(/\bINR\b/gi, "₹")
    .replaceAll(/[?]/g, "₹");
}

function joinBrokenNumberSpaces(value: string) {
  // "1 0 0" => "100", "2 0 0 . 0 0" => "200.00"
  return value.replaceAll(/(\d)\s+(\d)/g, "$1$2").replaceAll(/(\d)\s+\.\s+(\d)/g, "$1.$2");
}

function extractGstin(lines: string[]) {
  // Indian GSTIN: 15 chars: 2 digits + 10 PAN + 1 entity + Z + 1 checksum
  const gstinRegex = /\b(\d{2}[A-Z]{5}\d{4}[A-Z]\dZ[A-Z0-9])\b/i;
  for (const line of lines) {
    const m = line.toUpperCase().match(gstinRegex);
    if (m?.[1]) return m[1];
  }
  return "";
}

function extractDateTime(lines: string[]) {
  // Common receipt patterns; keep raw if unclear.
  const patterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b(?:\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?))?/i,
    /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b(?:\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?))?/i
  ];
  for (const line of lines) {
    for (const re of patterns) {
      const m = line.match(re);
      if (m?.[1]) {
        const date = m[1];
        const time = m[2] ? m[2].replaceAll(/\s+/g, " ").trim() : "";
        return time ? `${date} ${time}` : date;
      }
    }
  }
  return "";
}

function extractBillNumber(lines: string[]) {
  const patterns = [
    /\b(bill|inv|invoice)\s*(no|#|number)?\s*[:\-]?\s*([A-Z0-9\-\/]{3,})\b/i,
    /\b(kot|token)\s*(no|#)?\s*[:\-]?\s*([A-Z0-9\-\/]{2,})\b/i
  ];
  for (const line of lines) {
    for (const re of patterns) {
      const m = line.match(re);
      if (m?.[3]) return m[3];
    }
  }
  return "";
}

function extractMoneyCandidates(line: string) {
  // return list of numeric amounts found in the line, right-to-left preference
  const cleaned = joinBrokenNumberSpaces(
    line
      .replaceAll(/[₹,]/g, " ")
      .replaceAll(/(rs\.?)/gi, " ")
      .replaceAll(/[^\d.\s]/g, " ")
      .replaceAll(/\s{2,}/g, " ")
      .trim()
  );
  const matches = cleaned.match(/\d+(?:\.\d{1,2})?/g) ?? [];
  const values = matches
    .map((m) => Number(m))
    .filter((n) => Number.isFinite(n))
    .filter((n) => n >= 0)
    // Ignore obviously wrong OCR captures like phone numbers; keep realistic bill amounts
    .filter((n) => n < 1_000_000);
  return values;
}

function pickBestTotal(lines: string[]) {
  // Prefer lines with TOTAL keywords; choose max value.
  let best = 0;
  for (const line of lines) {
    const hasTotalKeyword = KEYWORDS.total.some((re) => re.test(line));
    if (!hasTotalKeyword) continue;
    const values = extractMoneyCandidates(line);
    for (const v of values) best = Math.max(best, v);
  }
  if (best > 0) return best;
  // fallback: max value in entire receipt
  for (const line of lines) {
    const values = extractMoneyCandidates(line);
    for (const v of values) best = Math.max(best, v);
  }
  return best;
}

function extractSubtotal(lines: string[]) {
  for (const line of lines) {
    if (!KEYWORDS.subtotal.some((re) => re.test(line))) continue;
    const values = extractMoneyCandidates(line);
    const last = values.at(-1);
    if (typeof last === "number") return last;
  }
  return 0;
}

function extractTaxes(lines: string[]) {
  const result: ReceiptTaxes = { cgst: 0, sgst: 0, gst: 0 };

  for (const line of lines) {
    const values = extractMoneyCandidates(line);
    const last = values.at(-1) ?? 0;
    if (KEYWORDS.cgst.some((re) => re.test(line))) result.cgst = Math.max(result.cgst, last);
    if (KEYWORDS.sgst.some((re) => re.test(line))) result.sgst = Math.max(result.sgst, last);
    if (KEYWORDS.gst.some((re) => re.test(line)) && !KEYWORDS.cgst.some((re) => re.test(line)) && !KEYWORDS.sgst.some((re) => re.test(line))) {
      // combined GST line
      result.gst = Math.max(result.gst, last);
    }
  }

  return result;
}

function looksLikeItemHeader(line: string) {
  const hits = KEYWORDS.itemHeader.filter((re) => re.test(line)).length;
  return hits >= 2 || /\bqty\b/i.test(line);
}

function scoreAsItemLine(line: string) {
  // Heuristic: has at least one amount at end and has letters.
  const values = extractMoneyCandidates(line);
  const hasLetters = /[A-Z]/i.test(line);
  const endsWithNumber = /\d(?:\.\d{1,2})?\s*$/.test(joinBrokenNumberSpaces(line));
  const penaltyKeywords =
    [...KEYWORDS.total, ...KEYWORDS.subtotal, ...KEYWORDS.cgst, ...KEYWORDS.sgst, ...KEYWORDS.gst].some((re) =>
      re.test(line)
    ) || FORBIDDEN_ITEM_RE.some((re) => re.test(line));
  let score = 0;
  if (hasLetters) score += 0.35;
  if (values.length >= 1) score += 0.35;
  if (endsWithNumber) score += 0.25;
  if (penaltyKeywords) score -= 0.5;
  if (looksLikeItemHeader(line)) score -= 0.4;
  return score;
}

function parseItemLine(line: string): ReceiptItem | null {
  // Hard filter: forbidden phrases are never items
  if (FORBIDDEN_ITEM_RE.some((re) => re.test(line))) return null;

  const fixed = fixOcrCommonMistakes(line);
  const compact = joinBrokenNumberSpaces(fixed);
  const money = extractMoneyCandidates(compact);

  // Require at least 2 numeric values to reduce false positives on header/address lines
  if (money.length < 2) return null;

  // Try pattern with qty + rate + amount: "<name> <qty> <rate> <amount>"
  // We take the last number as total/amount, and if there are 2+ numbers, use the second last as price (rate).
  const total = money.at(-1) ?? 0;
  const price = money.length >= 2 ? (money.at(-2) ?? total) : total;

  // Sanity check: reject obviously wrong totals (phone/date/pincode magnitude)
  if (total > 10000) return null;

  // Qty: often a small integer in the remaining numbers
  let qty = 1;
  if (money.length >= 3) {
    const candidates = money.slice(0, -2).filter((n) => Number.isFinite(n) && n > 0 && n <= 50);
    const intish = candidates.find((n) => Number.isInteger(n)) ?? candidates[0];
    if (intish) qty = Math.max(1, Math.round(intish));
  } else if (money.length === 2) {
    // could be qty + amount, or rate + amount. If the first is small integer, treat as qty.
    const first = money[0];
    if (Number.isInteger(first) && first > 0 && first <= 50 && total >= first) {
      qty = first;
    }
  }

  // Extract name by removing trailing numeric tokens and separators
  const name = compact
    .replaceAll(/[₹]/g, " ")
    .replaceAll(/\s{2,}/g, " ")
    .trim()
    .replaceAll(/\d+(?:\.\d{1,2})?/g, " ")
    .replaceAll(/\s{2,}/g, " ")
    .trim()
    .replaceAll(/[-–—]+$/g, "")
    .trim();

  if (name.length < 2 || !/[A-Z]/i.test(name)) return null;

  // Additional guard: if name itself contains forbidden hints, skip
  if (FORBIDDEN_ITEM_RE.some((re) => re.test(name))) return null;

  // Heuristic ranges to avoid misreads: unit price should be reasonable
  if (!(price > 0 && price <= 5000)) return null;

  // If total not provided (some receipts show only amount), set total = price * qty when it makes sense
  const computedTotal = Number((price * qty).toFixed(2));
  const finalTotal = total > 0 ? total : computedTotal;

  const confidence =
    0.4 +
    (money.length >= 2 ? 0.2 : 0) +
    (qty !== 1 ? 0.15 : 0.05) +
    (finalTotal > 0 ? 0.15 : 0);

  return {
    name,
    qty,
    price: Number(price.toFixed(2)),
    total: Number(finalTotal.toFixed(2)),
    confidence: Math.max(0, Math.min(1, confidence)),
    sourceLine: line
  };
}

function splitSections(lines: string[]) {
  const warnings: string[] = [];

  // Find an item-header line index; if missing, approximate by first "good" item line.
  let headerIdx = lines.findIndex((l) => looksLikeItemHeader(l));
  if (headerIdx === -1) {
    headerIdx = lines.findIndex((l) => scoreAsItemLine(l) >= 0.65);
  }
  if (headerIdx === -1) headerIdx = Math.min(6, lines.length);

  // Find totals start: first line with subtotal/tax/total keyword AFTER headerIdx
  let totalsIdx = -1;
  for (let i = headerIdx; i < lines.length; i++) {
    const l = lines[i];
    if (
      KEYWORDS.subtotal.some((re) => re.test(l)) ||
      KEYWORDS.total.some((re) => re.test(l)) ||
      KEYWORDS.cgst.some((re) => re.test(l)) ||
      KEYWORDS.sgst.some((re) => re.test(l)) ||
      (KEYWORDS.gst.some((re) => re.test(l)) && extractMoneyCandidates(l).length > 0)
    ) {
      totalsIdx = i;
      break;
    }
  }
  if (totalsIdx === -1) {
    // fallback: last 25% of receipt
    totalsIdx = Math.max(headerIdx + 1, Math.floor(lines.length * 0.75));
    warnings.push("Could not find totals section reliably; used fallback split.");
  }

  const headerLines = lines.slice(0, headerIdx).slice(0, 12);
  const itemLines = lines.slice(headerIdx, totalsIdx);
  const totalsLines = lines.slice(totalsIdx, Math.min(lines.length, totalsIdx + 12));
  const footerLines = lines.slice(Math.min(lines.length, totalsIdx + 12));

  return { headerLines, itemLines, totalsLines, footerLines, warnings };
}

function guessRestaurantName(headerLines: string[]) {
  // Use first non-generic line that contains letters and isn't "TAX INVOICE" etc.
  const blacklist = [/tax\s*invoice/i, /invoice/i, /bill/i, /gst/i, /phone/i, /mob/i];
  for (const line of headerLines) {
    if (blacklist.some((re) => re.test(line))) continue;
    if (!/[A-Z]/i.test(line)) continue;
    const short = line.replaceAll(/[^a-zA-Z0-9 &.'-]/g, "").trim();
    if (short.length >= 3 && short.length <= 40) return short;
  }
  return headerLines[0] ?? "";
}

function guessAddress(headerLines: string[]) {
  const addressHints = [/road/i, /\brd\b/i, /street/i, /\bst\b/i, /sector/i, /plot/i, /near/i, /india/i, /\bpin\b/i, /\d{6}/];
  const candidates = headerLines.filter((l) => addressHints.some((re) => re.test(l)));
  return candidates.slice(0, 3).join(", ");
}

function formatMoney(n: number) {
  return `₹${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
}

export function cloneReceiptFromOcr(input: ReceiptCloneInput): ReceiptCloneResult {
  const currency: ReceiptStructured["currency"] = input.currency ?? "INR";
  const { lines } = cleanOcrText(input.rawText);

  // Fix OCR mistakes line-by-line
  const cleanedLines = lines.map(fixOcrCommonMistakes);

  const { headerLines, itemLines, totalsLines, footerLines, warnings } = splitSections(cleanedLines);

  // Items: score + parse
  const parsedItems: ReceiptItem[] = [];
  for (const line of itemLines) {
    const score = scoreAsItemLine(line);
    if (score < 0.55) continue;
    const item = parseItemLine(line);
    if (!item) continue;
    parsedItems.push(item);
  }

  // De-dup consecutive duplicates (common OCR repeats)
  const items: ReceiptItem[] = [];
  for (const item of parsedItems) {
    const prev = items.at(-1);
    if (prev && prev.name.toLowerCase() === item.name.toLowerCase() && prev.total === item.total) continue;
    items.push(item);
  }

  const gst_number = extractGstin(cleanedLines);
  const date = extractDateTime(cleanedLines);
  const bill_number = extractBillNumber(cleanedLines);
  let subtotal = extractSubtotal(totalsLines.length ? totalsLines : cleanedLines);
  const taxes = extractTaxes(totalsLines.length ? totalsLines : cleanedLines);
  let grand_total = pickBestTotal(totalsLines.length ? totalsLines : cleanedLines);

  // ── Reconciliation: prefer computed sums over noisy OCR numbers ──
  const itemsComputedSubtotal = Number(
    items.reduce((sum, it) => sum + (Number.isFinite(it.total) ? it.total : it.price * it.qty), 0).toFixed(2)
  );
  const taxesSum = Number((taxes.cgst + taxes.sgst + taxes.gst).toFixed(2));

  // If subtotal looks missing or far from items sum, replace with items sum
  const subtotalTooSmall = subtotal === 0 || subtotal < itemsComputedSubtotal * 0.5;
  const subtotalTooLarge = subtotal > itemsComputedSubtotal * 1.5;
  if (subtotalTooSmall || subtotalTooLarge) {
    subtotal = itemsComputedSubtotal;
  }

  // If total looks off (e.g., captured phone number), clamp to items + taxes
  const computedTotal = Number((itemsComputedSubtotal + taxesSum).toFixed(2));
  const totalTooSmall = grand_total === 0 || grand_total < itemsComputedSubtotal * 0.5;
  const totalTooLarge = grand_total > itemsComputedSubtotal * 3;
  if (totalTooSmall || totalTooLarge) {
    grand_total = Math.max(computedTotal, itemsComputedSubtotal);
  }

  const restaurant_name = guessRestaurantName(headerLines);
  const address = guessAddress(headerLines);

  const structured: ReceiptStructured = {
    restaurant_name,
    gst_number,
    address,
    date,
    bill_number,
    items,
    subtotal: Number(subtotal.toFixed(2)),
    taxes: {
      cgst: Number(taxes.cgst.toFixed(2)),
      sgst: Number(taxes.sgst.toFixed(2)),
      gst: Number(taxes.gst.toFixed(2))
    },
    grand_total: Number(grand_total.toFixed(2)),
    currency
  };

  const layout: ReceiptLayoutModel = {
    widthMm: 80,
    fontFamily: "monospace",
    sections: [
      { type: "header", alignment: "center", lines: headerLines.slice(0, 10) },
      {
        type: "table",
        columns: [
          { key: "name", align: "left", widthChars: 20 },
          { key: "qty", align: "right", widthChars: 4 },
          { key: "price", align: "right", widthChars: 8 },
          { key: "total", align: "right", widthChars: 8 }
        ],
        rows: items.slice(0, 50).map((item) => ({
          name: item.name,
          qty: String(item.qty),
          price: formatMoney(item.price),
          total: formatMoney(item.total),
          raw: item.sourceLine
        }))
      },
      {
        type: "totals",
        alignment: "right",
        lines: [
          { key: "subtotal", label: "Subtotal", value: formatMoney(structured.subtotal) },
          taxes.cgst ? { key: "cgst", label: "CGST", value: formatMoney(structured.taxes.cgst) } : null,
          taxes.sgst ? { key: "sgst", label: "SGST", value: formatMoney(structured.taxes.sgst) } : null,
          taxes.gst ? { key: "gst", label: "GST", value: formatMoney(structured.taxes.gst) } : null,
          { key: "grand_total", label: "Total", value: formatMoney(structured.grand_total) }
        ].filter(Boolean) as Array<{ label: string; value: string; key?: string }>
      },
      { type: "footer", alignment: "center", lines: footerLines.slice(0, 10) }
    ]
  };

  return {
    structured,
    layout,
    debug: {
      rawTextPreview: input.rawText.slice(0, 4000),
      cleanedLines,
      headerLines,
      itemLines,
      totalsLines,
      footerLines,
      warnings
    }
  };
}

