import { NextRequest } from "next/server";

import { ok } from "@/lib/api/response";
import { cloneReceiptFromOcr } from "@/lib/ocr/receipt-clone-engine";

async function callOcrSpace(params: { apiKey: string; file: File }) {
  const form = new FormData();
  form.append("apikey", params.apiKey);
  form.append("language", "eng");
  form.append("isOverlayRequired", "false");
  form.append("scale", "true");
  form.append("OCREngine", "2");
  form.append("file", params.file, params.file.name);

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    throw new Error(`OCR.Space request failed with ${response.status}`);
  }

  const payload = (await response.json()) as any;
  const parsedText =
    payload?.ParsedResults?.[0]?.ParsedText ??
    payload?.ParsedResults?.map((r: any) => r?.ParsedText).join("\n") ??
    "";

  return { raw: payload, text: String(parsedText || "") };
}

function renderReceiptLayoutToHtml(params: {
  restaurantName: string;
  layout: ReturnType<typeof cloneReceiptFromOcr>["layout"];
}) {
  const { layout } = params;
  const sectionsHtml = layout.sections
    .map((section) => {
      if (section.type === "header" || section.type === "footer") {
        const align =
          section.alignment === "center"
            ? "center"
            : section.alignment === "right"
              ? "right"
              : "left";
        return `<div class="section ${section.type}" style="text-align:${align}">${section.lines
          .map((l) => `<div class="line">${escapeHtml(l)}</div>`)
          .join("")}</div>`;
      }
      if (section.type === "table") {
        return `<div class="section table">
          <table>
            <thead>
              <tr>
                <th style="text-align:left">Item</th>
                <th style="text-align:right">Qty</th>
                <th style="text-align:right">Price</th>
                <th style="text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${section.rows
                .map(
                  (r) => `<tr>
                    <td style="text-align:left">${escapeHtml(r.name)}</td>
                    <td style="text-align:right">${escapeHtml(r.qty)}</td>
                    <td style="text-align:right">${escapeHtml(r.price)}</td>
                    <td style="text-align:right">${escapeHtml(r.total)}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`;
      }
      if (section.type === "totals") {
        return `<div class="section totals">
          ${section.lines
            .map(
              (l) => `<div class="row"><span>${escapeHtml(l.label)}</span><span>${escapeHtml(l.value)}</span></div>`
            )
            .join("")}
        </div>`;
      }
      return "";
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt Demo</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; margin: 0; padding: 18px; color: #111; }
      .wrap { width: 80mm; margin: 0 auto; }
      .line { white-space: pre-wrap; }
      .section { margin: 10px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { font-size: 11px; color: #555; border-bottom: 1px solid #eee; padding-bottom: 6px; }
      td { padding: 6px 0; border-bottom: 1px solid #f2f2f2; vertical-align: top; }
      .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
      .totals .row:last-child { font-weight: 800; }
      @media print { body { padding: 0; } .wrap { margin: 0; } }
    </style>
  </head>
  <body>
    <div class="wrap">
      ${sectionsHtml}
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      return ok(
        {
          error:
            "OCR_SPACE_API_KEY is missing. Add it to your .env file, restart the dev server, then try again."
        },
        { status: 400 }
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return ok({ error: "Missing file (field name: file)." }, { status: 400 });
    }

    const ocr = await callOcrSpace({ apiKey, file });
    console.log("[bill/clone/upload] OCR TEXT\n", ocr.text);

    const result = cloneReceiptFromOcr({ rawText: ocr.text, currency: "INR" });
    const demoHtml = renderReceiptLayoutToHtml({
      restaurantName: result.structured.restaurant_name || "Restaurant",
      layout: result.layout
    });

    return ok({
      ocrText: ocr.text,
      structured: result.structured,
      layout: result.layout,
      demoHtml,
      warnings: result.debug.warnings
    });
  } catch (error) {
    console.error(error);
    return ok({ error: error instanceof Error ? error.message : "Clone request failed." }, { status: 400 });
  }
}

