import { z } from "zod";

import { activeChatProvider, chatJson } from "@/lib/ai/chat-json";
import type {
  ReceiptCloneResult,
  ReceiptLayoutModel,
  ReceiptStructured
} from "@/lib/ocr/receipt-clone-engine";

type TableColumn = { key: "name" | "qty" | "price" | "total"; align: "left" | "right"; widthChars: number };

const DEFAULT_COLUMNS: TableColumn[] = [
  { key: "name", align: "left", widthChars: 18 },
  { key: "qty", align: "right", widthChars: 4 },
  { key: "price", align: "right", widthChars: 8 },
  { key: "total", align: "right", widthChars: 9 }
];

const itemSchema = z.object({
  name: z.string().min(1),
  qty: z.coerce.number().default(1),
  price: z.coerce.number().default(0),
  total: z.coerce.number().default(0)
});

const structuredSchema = z.object({
  restaurant_name: z.string().default(""),
  gst_number: z.string().default(""),
  address: z.string().default(""),
  date: z.string().default(""),
  bill_number: z.string().default(""),
  items: z.array(itemSchema).default([]),
  subtotal: z.coerce.number().default(0),
  taxes: z
    .object({
      cgst: z.coerce.number().default(0),
      sgst: z.coerce.number().default(0),
      gst: z.coerce.number().default(0)
    })
    .default({ cgst: 0, sgst: 0, gst: 0 }),
  grand_total: z.coerce.number().default(0)
});

const sectionSchema = z.union([
  z.object({
    type: z.literal("header"),
    alignment: z.enum(["left", "center", "right"]).default("center"),
    lines: z.array(z.string()).default([])
  }),
  z.object({
    type: z.literal("footer"),
    alignment: z.enum(["left", "center", "right"]).default("center"),
    lines: z.array(z.string()).default([])
  }),
  z.object({
    type: z.literal("table"),
    columns: z
      .array(
        z.object({
          key: z.enum(["name", "qty", "price", "total"]),
          align: z.enum(["left", "right"]).default("left"),
          widthChars: z.coerce.number().default(10)
        })
      )
      .default(DEFAULT_COLUMNS),
    rows: z
      .array(
        z.object({
          name: z.string().default(""),
          qty: z.string().default(""),
          price: z.string().default(""),
          total: z.string().default(""),
          raw: z.string().optional()
        })
      )
      .default([])
  }),
  z.object({
    type: z.literal("totals"),
    alignment: z.literal("right").default("right"),
    lines: z
      .array(z.object({ label: z.string(), value: z.string(), key: z.string().optional() }))
      .default([])
  })
]);

const aiTemplateSchema = z.object({
  structured: structuredSchema,
  layout: z
    .object({
      sections: z.array(sectionSchema).default([])
    })
    .default({ sections: [] })
});

export type ReceiptAiTemplate = {
  result: ReceiptCloneResult;
  provider: string;
};

function buildPrompt(rawText: string, currency: string) {
  return `You convert a photographed/printed restaurant bill (receipt) into a reusable template.

Return STRICT JSON only, matching exactly this shape:
{
  "structured": {
    "restaurant_name": "",
    "gst_number": "",
    "address": "",
    "date": "",
    "bill_number": "",
    "items": [{ "name": "", "qty": 1, "price": 0, "total": 0 }],
    "subtotal": 0,
    "taxes": { "cgst": 0, "sgst": 0, "gst": 0 },
    "grand_total": 0
  },
  "layout": {
    "sections": [
      { "type": "header", "alignment": "center", "lines": ["Restaurant name", "Address", "GSTIN: ..."] },
      { "type": "table", "columns": [{"key":"name","align":"left","widthChars":18},{"key":"qty","align":"right","widthChars":4},{"key":"price","align":"right","widthChars":8},{"key":"total","align":"right","widthChars":9}], "rows": [{"name":"","qty":"","price":"","total":""}] },
      { "type": "totals", "alignment": "right", "lines": [{"label":"Subtotal","value":""},{"label":"Grand Total","value":""}] },
      { "type": "footer", "alignment": "center", "lines": ["Thank you, visit again"] }
    ]
  }
}

Rules:
- Keep ONLY real bill structure. Never invent items or prices.
- Numbers must be plain numbers (no currency symbols, no thousands separators).
- qty defaults to 1 when the bill does not print quantity.
- Put GST/CGST/SGST/VAT lines in "taxes" and repeat them in the totals section.
- Copy header/footer wording verbatim from the bill (typos included) so the template looks familiar.
- Currency is ${currency}.
- If a field is not visible, use "" or 0.

BILL TEXT:
"""
${rawText}
"""`;
}

function round2(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function toLayout(sections: z.infer<typeof sectionSchema>[]): ReceiptLayoutModel {
  const mapped: ReceiptLayoutModel["sections"] = sections.map((section) => {
    if (section.type === "header" || section.type === "footer") {
      return {
        type: section.type,
        alignment: section.alignment,
        lines: section.lines.map((line) => String(line).trim()).filter(Boolean)
      };
    }
    if (section.type === "table") {
      const columns = section.columns.length ? section.columns : DEFAULT_COLUMNS;
      return {
        type: "table" as const,
        columns: columns.map((column) => ({
          key: column.key,
          align: column.align,
          widthChars: Math.min(30, Math.max(4, Math.round(column.widthChars) || 10))
        })),
        rows: section.rows.map((row) => ({
          name: row.name ?? "",
          qty: row.qty ?? "",
          price: row.price ?? "",
          total: row.total ?? "",
          raw: row.raw
        }))
      };
    }
    return {
      type: "totals" as const,
      alignment: "right" as const,
      lines: section.lines.map((line) => ({ label: line.label, value: line.value, key: line.key }))
    };
  });

  return { widthMm: 80, fontFamily: "monospace", sections: mapped };
}

function buildFallbackSections(structured: ReceiptStructured): ReceiptLayoutModel["sections"] {
  const header = [
    structured.restaurant_name,
    structured.address,
    structured.gst_number ? `GSTIN: ${structured.gst_number}` : ""
  ]
    .map((line) => line.trim())
    .filter(Boolean);

  return [
    { type: "header", alignment: "center", lines: header },
    {
      type: "table",
      columns: DEFAULT_COLUMNS,
      rows: structured.items.map((item) => ({
        name: item.name,
        qty: String(item.qty),
        price: item.price.toFixed(2),
        total: item.total.toFixed(2)
      }))
    },
    {
      type: "totals",
      alignment: "right",
      lines: [
        { label: "Subtotal", value: structured.subtotal.toFixed(2), key: "subtotal" },
        ...(structured.taxes.cgst ? [{ label: "CGST", value: structured.taxes.cgst.toFixed(2), key: "cgst" }] : []),
        ...(structured.taxes.sgst ? [{ label: "SGST", value: structured.taxes.sgst.toFixed(2), key: "sgst" }] : []),
        ...(structured.taxes.gst ? [{ label: "GST", value: structured.taxes.gst.toFixed(2), key: "gst" }] : []),
        { label: "Grand Total", value: structured.grand_total.toFixed(2), key: "grand_total" }
      ]
    }
  ];
}

/**
 * AI bill-template extraction (Sarvam chat, OpenRouter fallback).
 * Returns null when no provider is configured or the model output is unusable,
 * so callers can fall back to the deterministic rule engine.
 */
export async function extractReceiptTemplateWithAi(params: {
  rawText: string;
  currency?: string;
  timeoutMs?: number;
}): Promise<ReceiptAiTemplate | null> {
  const provider = activeChatProvider();
  if (provider === "none") return null;

  const text = params.rawText.trim();
  if (text.length < 25) return null;

  try {
    const raw = await chatJson<unknown>({
      messages: [
        { role: "system", content: "You are a receipt digitisation engine. Return STRICT JSON only, no prose." },
        { role: "user", content: buildPrompt(text.slice(0, 12_000), params.currency || "INR") }
      ],
      task: "bill",
      maxTokens: 2400,
      temperature: 0.1,
      timeoutMs: params.timeoutMs ?? 60_000,
      retries: 1
    });

    const parsed = aiTemplateSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn("[receipt-ai] model output did not match schema:", parsed.error.issues.slice(0, 3));
      return null;
    }

    const { structured, layout } = parsed.data;

    const items: ReceiptStructured["items"] = structured.items
      .map((item) => {
        const qty = Number.isFinite(item.qty) && item.qty > 0 ? item.qty : 1;
        const price = Number.isFinite(item.price) ? item.price : 0;
        const total = Number.isFinite(item.total) && item.total > 0 ? item.total : price * qty;
        return {
          name: String(item.name).replace(/\s+/g, " ").trim(),
          qty,
          price: round2(price),
          total: round2(total),
          confidence: 0.9
        };
      })
      .filter((item) => item.name.length >= 2);

    if (items.length === 0) return null;

    const subtotal =
      structured.subtotal > 0 ? structured.subtotal : items.reduce((sum, item) => sum + item.total, 0);
    const taxTotal = structured.taxes.cgst + structured.taxes.sgst + structured.taxes.gst;
    const grandTotal = structured.grand_total > 0 ? structured.grand_total : subtotal + taxTotal;

    const finalStructured: ReceiptStructured = {
      restaurant_name: structured.restaurant_name.trim(),
      gst_number: structured.gst_number.trim(),
      address: structured.address.trim(),
      date: structured.date.trim(),
      bill_number: structured.bill_number.trim(),
      items,
      subtotal: round2(subtotal),
      taxes: {
        cgst: round2(structured.taxes.cgst),
        sgst: round2(structured.taxes.sgst),
        gst: round2(structured.taxes.gst)
      },
      grand_total: round2(grandTotal),
      currency: "INR"
    };

    const layoutModel = toLayout(layout.sections);
    const sections = layoutModel.sections.length
      ? layoutModel.sections
      : buildFallbackSections(finalStructured);

    const cleanLines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 200);

    const pickLines = (type: "header" | "footer" | "totals") =>
      sections
        .filter((section) => section.type === type)
        .flatMap((section) =>
          "lines" in section
            ? section.lines.map((line) => (typeof line === "string" ? line : `${line.label}: ${line.value}`))
            : []
        );

    return {
      provider,
      result: {
        structured: finalStructured,
        layout: { ...layoutModel, sections },
        debug: {
          rawTextPreview: text.slice(0, 600),
          cleanedLines: cleanLines,
          headerLines: pickLines("header"),
          itemLines: items.map((item) => `${item.name} x${item.qty} = ${item.total}`),
          totalsLines: pickLines("totals"),
          footerLines: pickLines("footer"),
          warnings: [`Bill template generated by ${provider}.`]
        }
      }
    };
  } catch (error) {
    console.warn("[receipt-ai] failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
