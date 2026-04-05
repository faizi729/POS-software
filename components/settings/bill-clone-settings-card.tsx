"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";

type CloneResponse = {
  success: boolean;
  data?: {
    ocrText: string;
    structured: any;
    layout: any;
    demoHtml: string;
    warnings?: string[];
    error?: string;
  };
  error?: string;
};

export function BillCloneSettingsCard({ restaurantName, restaurantId }: { restaurantName: string; restaurantId?: string }) {
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string>("");
  const [clone, setClone] = useState<null | {
    ocrText: string;
    structured: any;
    demoHtml: string;
    warnings: string[];
  }>(null);
  const [error, setError] = useState<string>("");
  const [showJson, setShowJson] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editStructured, setEditStructured] = useState<string>("");
  const [editLayout, setEditLayout] = useState<string>("");
  const [editError, setEditError] = useState<string>("");
  const [editTab, setEditTab] = useState<"visual" | "json">("visual");
  const [visualHeaderAlign, setVisualHeaderAlign] = useState<"left" | "center" | "right">("center");
  const [visualFooterAlign, setVisualFooterAlign] = useState<"left" | "center" | "right">("center");
  const [visualTotalsAlign, setVisualTotalsAlign] = useState<"left" | "center" | "right">("right");
  const [visualHeaderLines, setVisualHeaderLines] = useState<string>("");
  const [visualFooterLines, setVisualFooterLines] = useState<string>("");
  const [previewHtml, setPreviewHtml] = useState<string>("");

  const demoBlobUrl = useMemo(() => {
    if (!clone?.demoHtml) return "";
    const blob = new Blob([clone.demoHtml], { type: "text/html;charset=utf-8" });
    return URL.createObjectURL(blob);
  }, [clone?.demoHtml]);

  // Fetch existing saved template on mount (persistence across reloads)
  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/bill/clone/by-restaurant?restaurantId=${encodeURIComponent(restaurantId)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store"
        });
        const payload = (await res.json()) as { success: boolean; data?: any };
        if (!res.ok || !payload?.success || !payload?.data?.id) return;
        if (cancelled) return;
        setTemplateId(payload.data.id as string);
        setEditStructured(JSON.stringify(payload.data.structured ?? {}, null, 2));
        setEditLayout(JSON.stringify(payload.data.layout ?? {}, null, 2));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  // Minimal client-side HTML renderer (for saved template preview without re-upload)
  function renderReceiptLayoutToHtmlClient(params: { restaurantName: string; layout: any }) {
    const { layout } = params;
    const sections = Array.isArray(layout?.sections) ? layout.sections : [];

    // Replace stale Date/Bill No in preview
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" });
    const processHeaderLines = (lines: string[] = []) =>
      lines
        .map((line) => {
          if (/\bdate\b/i.test(line)) return `Date: ${dateStr}`;
          if (/\bbill\s*no\b/i.test(line)) return `Bill No. : BILL-XXXX`;
          return line;
        })
        .filter(Boolean) as string[];
    const sectionsHtml = sections
      .map((section: any) => {
        if (section.type === "header" || section.type === "footer") {
          const align = section.alignment === "center" ? "center" : section.alignment === "right" ? "right" : "left";
          const lines = section.type === "header" ? processHeaderLines(section.lines ?? []) : (section.lines ?? []);
          return `<div class="section ${section.type}" style="text-align:${align}">${lines
            .map((l: string) => formatStyledLine(escapeHtmlClient(l)))
            .join("")}</div>`;
        }
        if (section.type === "table") {
          return `<div class="section table">
            <table>
              <thead>
                <tr>
                  <th class="col-name" style="text-align:left">Item</th>
                  <th class="col-qty" style="text-align:right">Qty</th>
                  <th class="col-price" style="text-align:right">Price</th>
                  <th class="col-total" style="text-align:right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(section.rows ?? [])
                  .map(
                    (r: any) => `<tr>
                      <td class="col-name" style="text-align:left">${escapeHtmlClient(r.name ?? "")}</td>
                      <td class="col-qty" style="text-align:right">${escapeHtmlClient(r.qty ?? "")}</td>
                      <td class="col-price" style="text-align:right">${escapeHtmlClient(r.price ?? "")}</td>
                      <td class="col-total" style="text-align:right">${escapeHtmlClient(r.total ?? "")}</td>
                    </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>`;
        }
        if (section.type === "totals") {
          return `<div class="section totals">
            ${(section.lines ?? [])
              .map((l: any) => `<div class="row"><span>${formatStyledInline(escapeHtmlClient(l.label ?? ""))}</span><span>${formatStyledInline(escapeHtmlClient(l.value ?? ""))}</span></div>`)
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
      .line { white-space: pre-wrap; line-height: 1.35; }
      .line.rule { border-top: 1px dashed #bbb; margin: 6px 0; height: 0; }
      .small { font-size: 11px; }
      .big { font-size: 14px; font-weight: 700; }
      .section { margin: 10px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
      th { font-size: 11px; color: #555; border-bottom: 1px solid #eee; padding: 6px 0; }
      td { padding: 6px 0; border-bottom: 1px solid #f2f2f2; vertical-align: top; }
      td.col-name, th.col-name { width: 55%; }
      td.col-qty, th.col-qty { width: 10%; }
      td.col-price, th.col-price { width: 15%; }
      td.col-total, th.col-total { width: 20%; }
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

  function escapeHtmlClient(value: string) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // Allow limited inline styling using simple markers on the escaped string
  function formatStyledLine(escaped: string) {
    // whole-line markers
    if (/^\[hr\]$/i.test(escaped)) return `<div class="line rule"></div>`;
    const content = formatStyledInline(escaped.replaceAll(/\[br\]/gi, "<br/>"));
    return `<div class="line">${content}</div>`;
  }
  function formatStyledInline(escaped: string) {
    return escaped
      .replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/__([^_]+)__/g, "<u>$1</u>")
      .replace(/\[small\]([^[]+)\[\/small\]/gi, '<span class="small">$1</span>')
      .replace(/\[big\]([^[]+)\[\/big\]/gi, '<span class="big">$1</span>');
  }

  // Sync visual editor when opening modal / layout changes
  useEffect(() => {
    if (!editOpen) return;
    try {
      const parsed = JSON.parse(editLayout || "{}");
      const sections: any[] = Array.isArray(parsed?.sections) ? parsed.sections : [];
      const header = sections.find((s) => s?.type === "header") ?? { alignment: "center", lines: [] };
      const footer = sections.find((s) => s?.type === "footer") ?? { alignment: "center", lines: [] };
      const totals = sections.find((s) => s?.type === "totals") ?? { alignment: "right" };
      setVisualHeaderAlign((header.alignment as any) || "center");
      setVisualFooterAlign((footer.alignment as any) || "center");
      setVisualTotalsAlign((totals.alignment as any) || "right");
      setVisualHeaderLines((header.lines ?? []).join("\n"));
      setVisualFooterLines((footer.lines ?? []).join("\n"));
      setEditError("");
    } catch {
      setEditError("Invalid layout JSON. Switch to JSON to fix.");
    }
  }, [editOpen, editLayout]);

  function applyVisualToLayout() {
    try {
      const parsed = JSON.parse(editLayout || "{}");
      const sections: any[] = Array.isArray(parsed?.sections) ? [...parsed.sections] : [];
      const upsert = (type: string, patch: any) => {
        const idx = sections.findIndex((s) => s?.type === type);
        if (idx >= 0) sections[idx] = { ...sections[idx], ...patch };
        else sections.push({ type, ...patch });
      };
      upsert("header", { alignment: visualHeaderAlign, lines: visualHeaderLines.split("\n").map((s) => s.trim()).filter(Boolean) });
      upsert("footer", { alignment: visualFooterAlign, lines: visualFooterLines.split("\n").map((s) => s.trim()).filter(Boolean) });
      upsert("totals", { alignment: visualTotalsAlign });
      const next = { ...(parsed || {}), sections };
      const str = JSON.stringify(next, null, 2);
      setEditLayout(str);
      setEditError("");
      return next;
    } catch {
      setEditError("Could not apply visual changes. Please check JSON.");
      return null;
    }
  }

  // Compute a layout object for preview without mutating JSON (for live preview)
  function buildLayoutForPreview() {
    try {
      const parsed = JSON.parse(editLayout || "{}");
      if (editTab !== "visual") return parsed;
      const sections: any[] = Array.isArray(parsed?.sections) ? [...parsed.sections] : [];
      const upsert = (type: string, patch: any) => {
        const idx = sections.findIndex((s) => s?.type === type);
        if (idx >= 0) sections[idx] = { ...sections[idx], ...patch };
        else sections.push({ type, ...patch });
      };
      upsert("header", { alignment: visualHeaderAlign, lines: visualHeaderLines.split("\n").map((s) => s.trim()).filter(Boolean) });
      upsert("footer", { alignment: visualFooterAlign, lines: visualFooterLines.split("\n").map((s) => s.trim()).filter(Boolean) });
      upsert("totals", { alignment: visualTotalsAlign });
      return { ...(parsed || {}), sections };
    } catch {
      return null;
    }
  }

  // Live inline preview (debounced)
  useEffect(() => {
    if (!editOpen) return;
    const id = setTimeout(() => {
      const layoutObj = buildLayoutForPreview();
      if (!layoutObj) return;
      try {
        const html = renderReceiptLayoutToHtmlClient({ restaurantName, layout: layoutObj });
        setPreviewHtml(html);
      } catch {
        // ignore
      }
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen, editTab, editLayout, visualHeaderAlign, visualFooterAlign, visualTotalsAlign, visualHeaderLines, visualFooterLines, restaurantName]);

  function previewFromEditor() {
    const applied = editTab === "visual" ? applyVisualToLayout() : JSON.parse(editLayout || "{}");
    if (!applied) return;
    const html = renderReceiptLayoutToHtmlClient({
      restaurantName,
      layout: applied
    });
    setClone({
      ocrText: "",
      structured: JSON.parse(editStructured || "{}"),
      demoHtml: html,
      warnings: []
    });
    try {
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url || "", "_blank", "noopener,width=480,height=780");
      if (!win) {
        // Fallback: attempt inline iframe render by reusing existing demo behavior
        setTimeout(() => openDemo(), 0);
      }
    } catch {
      // ignore
    }
  }

  async function uploadAndClone(file: File) {
    setError("");
    setClone(null);
    setFileName(file.name);
    setTemplateId("");

    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("file", file, file.name);
        const res = await fetch("/api/bill/clone/upload", { method: "POST", body: form });
        const payload = (await res.json()) as CloneResponse;
        const data = payload?.data;

        if (!res.ok || !payload?.success || data?.error) {
          setError(data?.error ?? payload?.error ?? "Bill cloning failed.");
          return;
        }

        setClone({
          ocrText: String(data?.ocrText ?? ""),
          structured: data?.structured ?? {},
          demoHtml: String(data?.demoHtml ?? ""),
          warnings: (data?.warnings ?? []) as string[]
        });
        setEditStructured(JSON.stringify(data?.structured ?? {}, null, 2));
        setEditLayout(JSON.stringify(data?.layout ?? {}, null, 2));
      } catch (e) {
        console.error(e);
        setError("Bill cloning request failed.");
      }
    });
  }

  async function saveTemplate() {
    if (!restaurantId) {
      setError("Missing restaurant id. Cannot save template.");
      return;
    }
    if (!clone) return;
    try {
      const res = await fetch("/api/bill/clone/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          name: `${restaurantName} Receipt`,
          structured: clone.structured,
          layout: JSON.parse(editLayout || "null") ?? undefined
        })
      });
      const payload = (await res.json()) as { success: boolean; data?: { id?: string }; error?: string };
      if (!res.ok || !payload?.success || !payload?.data?.id) {
        setError(payload?.error ?? "Failed to save receipt template.");
        return;
      }
      setTemplateId(payload.data.id);
    } catch (e) {
      console.error(e);
      setError("Failed to save receipt template.");
    }
  }

  async function updateTemplate() {
    if (!templateId) return;
    try {
      const res = await fetch(`/api/bill/clone/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structured: JSON.parse(editStructured || "{}"),
          layout: JSON.parse(editLayout || "{}")
        })
      });
      const payload = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !payload?.success) {
        setError(payload?.error ?? "Failed to update template.");
        return;
      }
      setEditOpen(false);
    } catch (e) {
      console.error(e);
      setError("Failed to update template.");
    }
  }

  function openDemo() {
    if (!clone?.demoHtml) return;
    // Prefer opening via Blob URL to avoid about:blank rendering quirks
    const win = window.open(demoBlobUrl || "", "_blank", "noopener,width=480,height=780");
    if (win) return;

    // Popup blocked: render via hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      return;
    }
    doc.location.replace(demoBlobUrl || "about:blank");
  }

  return (
    <>
      <Card className="border border-border-subtle bg-bg-elevated">
        <CardHeader className="border-b border-border-subtle bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label-text">Settings</p>
              <CardTitle className="mt-2">Bill template cloning</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">
                Upload your existing bill (PDF/image). We’ll OCR it and reconstruct a receipt-style template you can preview and download.
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                Note: “99% accuracy” depends on OCR quality and bill print clarity. This MVP is best-effort + editable.
              </p>
            </div>
            <Badge variant="neutral">{restaurantName}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}

          {clone?.warnings?.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Warnings</p>
              <ul className="mt-2 list-disc pl-5">
                {clone.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-border-subtle bg-white px-4 py-3 text-sm font-semibold text-text-primary transition hover:bg-bg-surface">
              {isPending ? "Processing..." : "Upload PDF / Image"}
              <input
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                disabled={isPending}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  void uploadAndClone(f);
                  e.target.value = "";
                }}
              />
            </label>

            <div className="text-sm text-text-secondary">
              {fileName ? <span>Selected: <span className="font-semibold text-text-primary">{fileName}</span></span> : "No file selected"}
            </div>
          </div>

          {clone ? (
            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="secondary" className="h-11 rounded-2xl" onClick={openDemo}>
                Preview demo
              </Button>
              <Button
                variant="secondary"
                className="h-11 rounded-2xl"
                onClick={() => setShowJson(true)}
              >
                View extracted JSON
              </Button>
              <a
                href={demoBlobUrl}
                download={`receipt-demo-${Date.now()}.html`}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-border-subtle bg-white px-4 text-sm font-semibold text-text-primary transition hover:bg-bg-surface"
              >
                Download demo (HTML)
              </a>
              {restaurantId ? (
                <Button
                  variant="default"
                  className="h-11 rounded-2xl"
                  onClick={() => void saveTemplate()}
                  disabled={!!templateId}
                >
                  {templateId ? "Saved" : "Save as restaurant receipt"}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border-strong bg-bg-surface px-4 py-10 text-center text-sm text-text-secondary">
            {templateId
                ? (
                  <div className="space-y-3">
                    <div className="text-text-primary">A receipt template is already saved for this restaurant.</div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        className="h-11 rounded-2xl"
                        onClick={() => {
                          try {
                            const html = renderReceiptLayoutToHtmlClient({
                              restaurantName,
                              layout: JSON.parse(editLayout || "{}")
                            });
                            setClone({
                              ocrText: "",
                              structured: JSON.parse(editStructured || "{}"),
                              demoHtml: html,
                              warnings: []
                            });
                          } catch {
                            // ignore
                          }
                        }}
                      >
                        Preview saved template
                      </Button>
                      <Button variant="secondary" className="h-11 rounded-2xl" onClick={() => setEditOpen(true)}>
                        Edit receipt JSON
                      </Button>
                    </div>
                  </div>
                )
                : "Upload a bill to generate a cloned template preview."}
            </div>
          )}

          {templateId ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="success">Template saved</Badge>
              <Button variant="secondary" className="h-10 rounded-2xl" onClick={() => setEditOpen(true)}>
                Edit receipt JSON
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Modal open={showJson} onClose={() => setShowJson(false)} title="Extracted bill JSON">
        <div className="space-y-3">
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-3">
            <pre className="max-h-[420px] overflow-auto text-xs text-text-primary">
              {JSON.stringify(clone?.structured ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit receipt (advanced)">
        <div className="space-y-3">
          {editError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{editError}</div>
          ) : null}

          <div className="flex gap-2">
            <button
              className={["cursor-pointer rounded-xl px-3 py-1 text-sm font-semibold", editTab === "visual" ? "bg-text-primary text-white" : "bg-bg-surface text-text-secondary border border-border-subtle"].join(" ")}
              onClick={() => setEditTab("visual")}
              type="button"
            >
              Visual editor
            </button>
            <button
              className={["cursor-pointer rounded-xl px-3 py-1 text-sm font-semibold", editTab === "json" ? "bg-text-primary text-white" : "bg-bg-surface text-text-secondary border border-border-subtle"].join(" ")}
              onClick={() => setEditTab("json")}
              type="button"
            >
              JSON
            </button>
          </div>

          {editTab === "visual" ? (
            <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-3">
                <p className="mb-2 text-xs font-semibold text-text-secondary">Header lines (one per line)</p>
                <div className="mb-2 flex flex-wrap gap-2 text-xs">
                  <span className="text-text-secondary">Quick style:</span>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5 font-semibold" onClick={() => setVisualHeaderLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "**Bold text**")}>Bold</button>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5 italic" onClick={() => setVisualHeaderLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "_Italic text_")}>Italic</button>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5 underline" onClick={() => setVisualHeaderLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "__Underline__")}>Underline</button>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5" onClick={() => setVisualHeaderLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "[small]Small text[/small]")}>Small</button>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5 font-bold" onClick={() => setVisualHeaderLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "[big]Big text[/big]")}>Big</button>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5" onClick={() => setVisualHeaderLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "[hr]")}>Divider</button>
                </div>
                <textarea
                  className="h-40 w-full resize-none rounded-xl border border-border-subtle bg-white p-2 font-mono text-xs"
                  value={visualHeaderLines}
                  onChange={(e) => setVisualHeaderLines(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-text-secondary">Header align:</span>
                  <select className="rounded-lg border border-border-subtle bg-white px-2 py-1" value={visualHeaderAlign} onChange={(e) => setVisualHeaderAlign(e.target.value as any)}>
                    <option value="left">left</option>
                    <option value="center">center</option>
                    <option value="right">right</option>
                  </select>
                </div>
              </div>
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-3">
                <p className="mb-2 text-xs font-semibold text-text-secondary">Footer lines (one per line)</p>
                <div className="mb-2 flex flex-wrap gap-2 text-xs">
                  <span className="text-text-secondary">Quick style:</span>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5 font-semibold" onClick={() => setVisualFooterLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "**Bold text**")}>Bold</button>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5 italic" onClick={() => setVisualFooterLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "_Italic text_")}>Italic</button>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5 underline" onClick={() => setVisualFooterLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "__Underline__")}>Underline</button>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5" onClick={() => setVisualFooterLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "[small]Small text[/small]")}>Small</button>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5 font-bold" onClick={() => setVisualFooterLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "[big]Big text[/big]")}>Big</button>
                  <button type="button" className="rounded-md border border-border-subtle bg-white px-2 py-0.5" onClick={() => setVisualFooterLines((v) => v + (v.endsWith("\n") || v === "" ? "" : "\n") + "[hr]")}>Divider</button>
                </div>
                <textarea
                  className="h-40 w-full resize-none rounded-xl border border-border-subtle bg-white p-2 font-mono text-xs"
                  value={visualFooterLines}
                  onChange={(e) => setVisualFooterLines(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-text-secondary">Footer align:</span>
                  <select className="rounded-lg border border-border-subtle bg-white px-2 py-1" value={visualFooterAlign} onChange={(e) => setVisualFooterAlign(e.target.value as any)}>
                    <option value="left">left</option>
                    <option value="center">center</option>
                    <option value="right">right</option>
                  </select>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-text-secondary">Totals align:</span>
                  <select className="rounded-lg border border-border-subtle bg-white px-2 py-1" value={visualTotalsAlign} onChange={(e) => setVisualTotalsAlign(e.target.value as any)}>
                    <option value="left">left</option>
                    <option value="center">center</option>
                    <option value="right">right</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-2 rounded-2xl border border-border-subtle bg-bg-surface p-3">
                <p className="mb-2 text-xs font-semibold text-text-secondary">Live preview</p>
                <iframe
                  title="receipt-preview"
                  srcDoc={previewHtml}
                  className="h-[360px] w-full rounded-xl border border-border-subtle bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-3">
                <p className="mb-2 text-xs font-semibold text-text-secondary">structured</p>
                <textarea
                  className="h-72 w-full resize-none rounded-xl border border-border-subtle bg-white p-2 font-mono text-xs"
                  value={editStructured}
                  onChange={(e) => setEditStructured(e.target.value)}
                />
              </div>
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-3">
                <p className="mb-2 text-xs font-semibold text-text-secondary">layout</p>
                <textarea
                  className="h-72 w-full resize-none rounded-xl border border-border-subtle bg-white p-2 font-mono text-xs"
                  value={editLayout}
                  onChange={(e) => setEditLayout(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" className="h-10 rounded-2xl" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="h-10 rounded-2xl"
              onClick={() => {
                if (editTab === "visual") applyVisualToLayout();
                previewFromEditor();
              }}
            >
              Preview
            </Button>
            <Button
              variant="default"
              className="h-10 rounded-2xl"
              onClick={() => {
                if (editTab === "visual") applyVisualToLayout();
                void updateTemplate();
              }}
            >
              Save changes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

