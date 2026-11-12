import { NextRequest } from "next/server";

import { ok } from "@/lib/api/response";
import { cloneReceiptFromOcr } from "@/lib/ocr/receipt-clone-engine";
import { extractReceiptTemplateWithAi } from "@/lib/ocr/receipt-ai-template";
import { activeChatModel } from "@/lib/ai/chat-json";
import { isOcrConfigured, ocrDocumentFile, ocrMissingKeyMessage } from "@/lib/ocr/document-ocr";
import { validateUploads } from "@/lib/middleware/upload-validate";
import { fail } from "@/lib/api/response";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";
import { assertRole, requireSession } from "@/lib/auth/guards";

/** Sarvam Vision jobs are async (create -> poll -> results); allow a long run. */
export const maxDuration = 120;

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
    const session = await requireSession();
    assertRole(session, ["owner", "manager", "cashier"]);

    const rl = await rateLimit({
      request,
      keyParts: ["ocr-receipt-clone", session.restaurantId, getClientIp(request)],
      limit: 30,
      windowMs: 60_000,
      onHit: () => console.warn("[rate-limit] /api/bill/clone/upload")
    });
    if (!rl.ok) return fail("Too many requests. Try again soon.", 429);

    if (!isOcrConfigured()) {
      return ok({ error: ocrMissingKeyMessage() }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return ok({ error: "Missing file (field name: file)." }, { status: 400 });
    }

    const valid = validateUploads({ files: [file], maxFiles: 1, maxBytesPerFile: 5 * 1024 * 1024 });
    if (!valid.ok) return fail(valid.error, 400);

    // OCR: Sarvam Vision (preferred) -> OCR.Space fallback.
    const ocr = await ocrDocumentFile({ file });

    // Template: Sarvam AI extraction first, deterministic rule engine as fallback.
    const ruleResult = cloneReceiptFromOcr({ rawText: ocr.text, currency: "INR" });
    const aiTemplate = await extractReceiptTemplateWithAi({ rawText: ocr.text, currency: "INR" }).catch(
      () => null
    );
    const result = aiTemplate?.result ?? ruleResult;

    const demoHtml = renderReceiptLayoutToHtml({
      restaurantName: result.structured.restaurant_name || "Restaurant",
      layout: result.layout
    });

    return ok({
      ocrText: ocr.text,
      ocrMarkdown: ocr.markdown ?? "",
      ocrProvider: ocr.provider,
      structured: result.structured,
      layout: result.layout,
      demoHtml,
      ai: { used: Boolean(aiTemplate), provider: aiTemplate?.provider ?? null, model: activeChatModel("bill") },
      warnings: [...ocr.warnings, ...result.debug.warnings]
    });
  } catch (error) {
    console.error(error);
    return ok({ error: error instanceof Error ? error.message : "Clone request failed." }, { status: 400 });
  }
}

