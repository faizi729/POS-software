"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Download, Search, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils/format";
import { useOrderStore } from "@/store/order-store";
import { AnimatedNumber } from "@/components/utils/animated-number";
import { toast } from "@/lib/toast";
import { motionTokens } from "@/lib/motion";

/** Returns a human-readable relative time string like "2 min ago".
 * Provide nowTs to avoid SSR/client mismatch; when null/undefined, return empty string. */
function timeAgo(dateStr?: string, nowTs?: number | null): string {
  if (!dateStr) return "";
  if (nowTs == null) return "";
  const now = nowTs;
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;

  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

type OrderMenuItem = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  tags: string[];
  isAvailable: boolean;
  pricingMode?: "base" | "variant";
  variants?: Array<{
    id: string;
    itemId: string;
    groupName: string;
    optionName: string;
    variantType: string;
    priceDelta: number;
    absolutePrice?: number;
    isDefault?: boolean;
    sortOrder?: number;
  }>;
  addonGroups?: Array<{
    id: string;
    itemId: string;
    name: string;
    selectionType: string;
    addons: Array<{ id: string; addonGroupId: string; name: string; price: number }>;
  }>;
};

type OrderCategory = {
  id: string;
  name: string;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  tokenNumber?: number;
  status: string;
  paymentStatus: string;
  tableNo?: string;
  type?: string;
  customer?: { name?: string; phone?: string };
  items?: Array<{
    nameSnapshot: string;
    priceSnapshot: number;
    quantity: number;
    notes?: string;
    lineTotal: number;
  }>;
  pricing?: {
    subtotal: number;
    tax: number;
    serviceCharge: number;
    discount: number;
    grandTotal: number;
  };
  createdAt?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildBillHtml(params: {
  restaurantName: string;
  orderLabel: string;
  items: Array<{ name: string; quantity: number; price: number; notes?: string }>;
  subtotal: number;
  tax: number;
  total: number;
}) {
  const now = new Date();
  const rows = params.items
    .map((item) => {
      const lineTotal = item.price * item.quantity;
      return `
        <tr>
          <td class="name">
            <div class="title">${escapeHtml(item.name)}</div>
            ${item.notes ? `<div class="notes">${escapeHtml(item.notes)}</div>` : ""}
          </td>
          <td class="qty">${item.quantity}</td>
          <td class="price">${item.price.toFixed(2)}</td>
          <td class="total">${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bill</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; padding: 24px; color: #111; display:flex; justify-content:center; }
      .wrap { max-width: 360px; margin: 0 auto; }
      .header { text-align: center; }
      .header h1 { font-size: 18px; margin: 0; }
      .header p { margin: 6px 0 0; font-size: 12px; color: #555; }
      .meta { margin-top: 14px; font-size: 12px; color: #333; display: flex; justify-content: space-between; gap: 12px; }
      .divider { border-top: 1px dashed #bbb; margin: 14px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: left; font-size: 11px; color: #555; padding: 6px 0; border-bottom: 1px solid #eee; }
      td { padding: 8px 0; vertical-align: top; border-bottom: 1px solid #f2f2f2; }
      td.qty, td.price, td.total { text-align: right; white-space: nowrap; }
      .title { font-weight: 600; }
      .notes { margin-top: 2px; color: #666; font-size: 11px; }
      .totals { margin-top: 12px; font-size: 12px; }
      .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
      .totals .grand { font-weight: 800; font-size: 14px; }
      .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #666; }
      @media print {
        body { padding: 0; display:flex; justify-content:center; }
        .wrap { max-width: none; width: 80mm; margin: 0 auto; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <h1>${escapeHtml(params.restaurantName || "Restaurant")}</h1>
        <p>${escapeHtml(params.orderLabel)}</p>
      </div>
      <div class="meta">
        <div>${escapeHtml(now.toLocaleDateString())}</div>
        <div>${escapeHtml(now.toLocaleTimeString())}</div>
      </div>
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:right;">Qty</th>
            <th style="text-align:right;">Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${params.subtotal.toFixed(2)}</span></div>
        <div class="row"><span>Tax</span><span>${params.tax.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="row grand"><span>Total</span><span>${params.total.toFixed(2)}</span></div>
      </div>
      <div class="footer">Thank you</div>
    </div>
    <script>
      window.focus();
      window.print();
    </script>
  </body>
</html>`;
}

function buildInvoiceHtml(params: {
  restaurantName: string;
  gstin?: string;
  order: RecentOrder;
}) {
  const { order } = params;
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const token = order.tokenNumber ?? 0;
  const items = order.items ?? [];
  const pricing = order.pricing ?? { subtotal: 0, tax: 0, serviceCharge: 0, discount: 0, grandTotal: 0 };

  const rows = items
    .map((item, idx) => {
      return `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${idx + 1}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;">
            ${escapeHtml(item.nameSnapshot)}
            ${item.notes ? `<br/><span style="color:#888;font-size:11px;">${escapeHtml(item.notes)}</span>` : ""}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">₹${item.priceSnapshot.toFixed(2)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">₹${item.lineTotal.toFixed(2)}</td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice - ${escapeHtml(order.orderNumber)}</title>
  <style>
    :root{color-scheme:light}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#111;padding:20px;background:#fff;display:flex;justify-content:center}
    .invoice{max-width:600px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden}
    .inv-header{background:#1a1a2e;color:#fff;padding:24px 28px}
    .inv-header h1{font-size:22px;margin-bottom:4px}
    .inv-header p{font-size:12px;opacity:.85}
    .inv-meta{display:flex;justify-content:space-between;padding:16px 28px;background:#f8f8fa;border-bottom:1px solid #eee;font-size:13px}
    .inv-meta .col{display:flex;flex-direction:column;gap:4px}
    .inv-meta .label{color:#777;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
    .inv-meta .value{font-weight:600;color:#222}
    .inv-body{padding:20px 28px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    thead th{text-align:left;padding:8px;background:#f4f4f7;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.4px}
    thead th:first-child{text-align:center;width:40px}
    thead th:nth-child(3){text-align:center;width:50px}
    thead th:nth-child(4),thead th:nth-child(5){text-align:right}
    .inv-totals{margin-top:16px;border-top:2px solid #eee;padding-top:12px}
    .inv-totals .row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}
    .inv-totals .row.grand{font-size:16px;font-weight:800;border-top:2px solid #222;margin-top:8px;padding-top:10px}
    .inv-footer{text-align:center;padding:16px 28px;background:#f8f8fa;border-top:1px solid #eee;font-size:11px;color:#888}
    .token-badge{display:inline-block;background:#e8f5e9;color:#2e7d32;font-weight:700;padding:4px 12px;border-radius:20px;font-size:14px}
    @media print{
      body{padding:0;display:flex;justify-content:center}
      .invoice{border:none;border-radius:0;max-width:none;width:80mm;margin:0 auto}
      .no-print{display:none!important}
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:16px">
    <button onclick="window.print()" style="padding:10px 24px;background:#1a1a2e;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600">🖨️ Print Invoice</button>
  </div>
  <div class="invoice">
    <div class="inv-header">
      <h1>${escapeHtml(params.restaurantName || "Restaurant")}</h1>
      ${params.gstin ? `<p>GSTIN: ${escapeHtml(params.gstin)}</p>` : ""}
      <p>Tax Invoice</p>
    </div>
    <div class="inv-meta">
      <div class="col">
        <span class="label">Invoice No.</span>
        <span class="value">${escapeHtml(order.orderNumber)}</span>
      </div>
      <div class="col">
        <span class="label">Token</span>
        <span class="token-badge">#${token}</span>
      </div>
      <div class="col">
        <span class="label">Date</span>
        <span class="value">${escapeHtml(orderDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }))}</span>
      </div>
      <div class="col">
        <span class="label">Time</span>
        <span class="value">${escapeHtml(orderDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }))}</span>
      </div>
    </div>
    <div class="inv-meta" style="border-bottom:none;padding-bottom:0">
      <div class="col">
        <span class="label">Type</span>
        <span class="value" style="text-transform:capitalize">${(order.type ?? "dine_in").replaceAll("_", " ")}${order.tableNo ? ` • Table ${escapeHtml(order.tableNo)}` : ""}</span>
      </div>
      <div class="col">
        <span class="label">Customer</span>
        <span class="value">${escapeHtml(order.customer?.name || "Walk-in")}</span>
      </div>
      <div class="col">
        <span class="label">Payment</span>
        <span class="value" style="text-transform:capitalize">${escapeHtml(order.paymentStatus)}</span>
      </div>
    </div>
    <div class="inv-body">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="inv-totals">
        <div class="row"><span>Subtotal</span><span>₹${pricing.subtotal.toFixed(2)}</span></div>
        ${pricing.tax > 0 ? `<div class="row"><span>Tax (GST)</span><span>₹${pricing.tax.toFixed(2)}</span></div>` : ""}
        ${pricing.serviceCharge > 0 ? `<div class="row"><span>Service Charge</span><span>₹${pricing.serviceCharge.toFixed(2)}</span></div>` : ""}
        ${pricing.discount > 0 ? `<div class="row"><span>Discount</span><span>-₹${pricing.discount.toFixed(2)}</span></div>` : ""}
        <div class="row grand"><span>Grand Total</span><span>₹${pricing.grandTotal.toFixed(2)}</span></div>
      </div>
    </div>
    <div class="inv-footer">
      Thank you for your visit! This is a computer-generated invoice.
    </div>
  </div>
</body>
</html>`;
}

async function fetchRestaurantReceiptTemplate(restaurantId?: string) {
  if (!restaurantId) return null;
  try {
    const res = await fetch(`/api/bill/clone/by-restaurant?restaurantId=${encodeURIComponent(restaurantId)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    const payload = (await res.json()) as { success: boolean; data?: any };
    if (!res.ok || !payload?.success) return null;
    return payload.data ?? null;
  } catch {
    return null;
  }
}

function renderClonedReceiptHtml(params: {
  layout: any;
  order: RecentOrder;
  restaurantName: string;
  centerAlignAll?: boolean;
}) {
  try {
    const { layout, order, restaurantName, centerAlignAll = true } = params;
    const items = order.items ?? [];
    const pricing =
      order.pricing ?? { subtotal: 0, tax: 0, serviceCharge: 0, discount: 0, grandTotal: 0 };
    const sections: any[] = Array.isArray(layout?.sections) ? layout.sections : [];

    // Build table using layout columns (align + headers) but inject live rows
    const tableSection = sections.find((s) => s?.type === "table");
    const columns: Array<{ key: "name" | "qty" | "price" | "total"; align: "left" | "right" }> =
      Array.isArray(tableSection?.columns)
        ? tableSection.columns.map((c: any) => ({
            key: c.key,
            align: c.align === "right" ? "right" : "left"
          }))
        : [
            { key: "name", align: "left" },
            { key: "qty", align: "right" },
            { key: "price", align: "right" },
            { key: "total", align: "right" }
          ];

    const headerRow = `
      <tr>
        <th style="text-align:${columns[0].align}">Item</th>
        <th style="text-align:${columns[1].align}">Qty</th>
        <th style="text-align:${columns[2].align}">Price</th>
        <th style="text-align:${columns[3].align}">Total</th>
      </tr>`;

    const tableHtml = `
      <div class="section table">
        <table>
          <thead>${headerRow}</thead>
          <tbody>
            ${items
              .map(
                (it) => `<tr>
                  <td style="text-align:${columns[0].align}">${escapeHtml(it.nameSnapshot)}</td>
                  <td style="text-align:${columns[1].align}">${it.quantity}</td>
                  <td style="text-align:${columns[2].align}">₹${it.priceSnapshot.toFixed(2)}</td>
                  <td style="text-align:${columns[3].align}">₹${it.lineTotal.toFixed(2)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;

    const headerSection = sections.find((s) => s?.type === "header");
    const footerSection = sections.find((s) => s?.type === "footer");

    function sectionAlign(
      cls: string,
      alignment: "left" | "center" | "right" | undefined,
      lines: string[] = []
    ) {
      const align = centerAlignAll
        ? "center"
        : alignment === "center"
          ? "center"
          : alignment === "right"
            ? "right"
            : "left";
      return `<div class="section ${cls}" style="text-align:${align}">${lines
        .map((l) => formatStyledLine(escapeHtml(l)))
        .join("")}</div>`;
    }

    // Replace Date/Bill No in header with live values (avoid copying OCR'ed ones)
    const dateLineRegex = /\bdate\b/i;
    const billNoRegex = /\bbill\s*no\b/i;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const billNo = order.orderNumber ?? "";

    const processedHeaderLines =
      headerSection?.lines?.map((line: string) => {
        if (dateLineRegex.test(line)) return `Date: ${dateStr}`;
        if (billNoRegex.test(line)) return billNo ? `Bill No. : ${billNo}` : "";
        return line;
      }).filter((l: string) => l !== "") ?? [restaurantName];

    const headerHtml = sectionAlign(
      "header",
      headerSection?.alignment ?? "center",
      processedHeaderLines
    );

    const totalsHtml = `
      <div class="section totals" style="text-align:${centerAlignAll ? "center" : "right"}">
        <div class="row"><span>Subtotal</span><span>₹${pricing.subtotal.toFixed(2)}</span></div>
        ${pricing.tax > 0 ? `<div class="row"><span>Tax (GST)</span><span>₹${pricing.tax.toFixed(2)}</span></div>` : ""}
        ${pricing.serviceCharge > 0 ? `<div class="row"><span>Service Charge</span><span>₹${pricing.serviceCharge.toFixed(2)}</span></div>` : ""}
        ${pricing.discount > 0 ? `<div class="row"><span>Discount</span><span>-₹${pricing.discount.toFixed(2)}</span></div>` : ""}
        <div class="row"><span>Total</span><span>₹${pricing.grandTotal.toFixed(2)}</span></div>
      </div>`;

    const footerHtml = footerSection
      ? sectionAlign("footer", footerSection.alignment, footerSection.lines)
      : "";

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; margin: 0; padding: 18px; color: #111; display:flex; justify-content:center; }
      .wrap { width: 80mm; margin: 0 auto; }
      .line { white-space: pre-wrap; }
      .line.rule { border-top: 1px dashed #bbb; margin: 6px 0; height: 0; }
      .small { font-size: 11px; }
      .big { font-size: 14px; font-weight: 700; }
      .section { margin: 10px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { font-size: 11px; color: #555; border-bottom: 1px solid #eee; padding-bottom: 6px; }
      td { padding: 6px 0; border-bottom: 1px solid #f2f2f2; vertical-align: top; }
      .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
      .totals .row:last-child { font-weight: 800; }
      @media print { body { padding: 0; display:flex; justify-content:center; } .wrap { margin: 0 auto !important; } }
    </style>
  </head>
  <body>
    <div class="wrap">
      ${headerHtml}
      ${tableHtml}
      ${totalsHtml}
      ${footerHtml}
    </div>
    <script>window.addEventListener('load',function(){try{window.focus();window.print();}catch(_){} setTimeout(()=>window.close(), 300);});</script>
  </body>
</html>`;
  } catch {
    return "";
  }
}

function formatStyledLine(escaped: string) {
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

async function printInvoice(order: RecentOrder, restaurantName: string, gstin?: string, restaurantId?: string) {
  // Try restaurant-specific cloned receipt first
  let html: string | null = null;
  try {
    const template = await fetchRestaurantReceiptTemplate(restaurantId);
    if (template?.layout) {
      html = renderClonedReceiptHtml({ layout: template.layout, order, restaurantName, centerAlignAll: true });
      if (!html) throw new Error("template-render-failed");
    } else {
      html = buildInvoiceHtml({ restaurantName, gstin, order });
    }
  } catch {
    html = buildInvoiceHtml({ restaurantName, gstin, order });
  }
  const w = window.open("", "_blank", "noopener,width=760,height=900");
  if (w) {
    w.document.open();
    // Inject auto-print on load
    const autoPrintHtml = html.replace(
      "</body>",
      `<script>window.addEventListener('load',function(){try{window.focus();window.print();}catch(_){} setTimeout(()=>window.close(), 300);});</script></body>`
    );
    w.document.write(autoPrintHtml);
    w.document.close();
    return;
  }
  // Popup blocked: print via hidden iframe
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
  const autoPrintHtml = html.replace(
    "</body>",
    `<script>window.addEventListener('load',function(){try{window.focus();window.print();}catch(_){} setTimeout(()=>window.close(), 300);});</script></body>`
  );
  doc.open();
  doc.write(autoPrintHtml);
  doc.close();
  const cw = iframe.contentWindow;
  if (!cw) {
    iframe.remove();
    return;
  }
  cw.focus();
  cw.print();
  setTimeout(() => iframe.remove(), 500);
}

export function OrderScreenLive({
  menuCatalog,
  categories,
  orders,
  restaurant
}: {
  menuCatalog: OrderMenuItem[];
  categories: OrderCategory[];
  orders: RecentOrder[];
  restaurant: {
    id?: string;
    name?: string;
    settings?: {
      taxMode: "inclusive" | "exclusive";
      gstEnabled: boolean;
      gstRatePercent: number;
      gstin?: string;
    };
  } | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [liveOrders, setLiveOrders] = useState<RecentOrder[]>(orders);
  const [nowTs, setNowTs] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [lastAddedKey, setLastAddedKey] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [itemsPageSize, setItemsPageSize] = useState<10 | 20 | 50>(10);
  const [itemsPage, setItemsPage] = useState(1);
  const [tableNo, setTableNo] = useState("04");
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [checkoutPaymentStatus, setCheckoutPaymentStatus] = useState<"paid" | "unpaid">("paid");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingTableNo, setEditingTableNo] = useState("");
  const [editingStatus, setEditingStatus] = useState("draft");
  const [editingPaymentStatus, setEditingPaymentStatus] = useState("unpaid");
  // Defer "now" to client after mount to avoid SSR hydration mismatch
  useEffect(() => {
    setNowTs(Date.now());
    const id = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const { items, addItem, incrementItem, decrementItem, subtotal, tax, total, reset, setTaxConfig } =
    useOrderStore();
  function restoreCartItem(entry: (typeof items)[number], qty: number) {
    const base = {
      key: entry.key,
      menuItemId: entry.menuItemId,
      variantId: entry.variantId,
      name: entry.name,
      price: entry.price,
      notes: entry.notes ?? ""
    };
    for (let i = 0; i < Math.max(1, qty); i += 1) {
      addItem(base);
    }
  }
  const [cartPulse, setCartPulse] = useState(0);
  const prevCartSigRef = useRef<string>("");
  const [selectedCartKey, setSelectedCartKey] = useState<string | null>(null);

  // Pulse the cart on any cart change (add/remove/qty)
  useEffect(() => {
    const sig = items.map((i) => `${i.key}:${i.quantity}`).join("|");
    if (prevCartSigRef.current !== "" && sig !== prevCartSigRef.current) {
      setCartPulse((v) => v + 1);
    }
    prevCartSigRef.current = sig;
  }, [items, prevCartSigRef]);

  // Tick every 30s so relative times stay fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((v) => v + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const settings = restaurant?.settings;
    if (!settings) return;
    setTaxConfig({
      taxMode: settings.taxMode ?? "exclusive",
      gstEnabled: Boolean(settings.gstEnabled),
      gstRatePercent: Number(settings.gstRatePercent ?? 0)
    });
  }, [restaurant?.settings, setTaxConfig]);
  // ── Live updates: poll orders so KDS status changes reflect here ──
  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json?.data?.orders) {
          setLiveOrders(json.data.orders as RecentOrder[]);
        }
      } catch {
        // ignore transient errors
      }
    }
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    const onFocus = () => fetchOrders();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);


  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantTargetItem, setVariantTargetItem] = useState<OrderMenuItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  const filteredItems = useMemo(() => {
    return menuCatalog.filter((item) => {
      const categoryName = categories.find((category) => category.id === item.categoryId)?.name;
      const matchesCategory = activeCategory === "All" || categoryName === activeCategory;
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());

      return item.isAvailable && matchesCategory && matchesQuery;
    });
  }, [activeCategory, categories, menuCatalog, query]);

  const isAllCategory = activeCategory === "All";

  // reset paging when the relevant filters change (only matters for All)
  useEffect(() => {
    if (!isAllCategory) return;
    setItemsPage(1);
  }, [isAllCategory, itemsPageSize, query]);

  const itemsTotal = filteredItems.length;
  const itemsTotalPages = isAllCategory ? Math.max(1, Math.ceil(itemsTotal / itemsPageSize)) : 1;
  const itemsPageSafe = isAllCategory ? Math.min(itemsPage, itemsTotalPages) : 1;
  const itemsStartIndex = (itemsPageSafe - 1) * itemsPageSize;
  const visibleItems = useMemo(() => {
    if (!isAllCategory) return filteredItems;
    return filteredItems.slice(itemsStartIndex, itemsStartIndex + itemsPageSize);
  }, [filteredItems, isAllCategory, itemsPageSize, itemsStartIndex]);

  // Power-user shortcuts (POS)
  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return tag === "input" || tag === "textarea" || (el as any).isContentEditable;
    }

    function onKeyDown(e: KeyboardEvent) {
      // "/" -> focus menu search
      if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // Ctrl/Cmd + Enter -> checkout
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        void placeOrderAndPayment();
        return;
      }

      // Enter -> add first visible item (when not typing)
      if (e.key === "Enter" && !isTypingTarget(e.target)) {
        if (visibleItems[0]) {
          e.preventDefault();
          const first = visibleItems[0];
          if (first.variants?.length) openVariantChooser(first);
          else {
            setLastAddedKey(first.id);
            addItem({ key: first.id, menuItemId: first.id, name: first.name, price: first.price, notes: "" });
            toast.success("Added to cart", { message: first.name, durationMs: 2200 });
          }
        }
        return;
      }

      // +/- -> adjust quantity for selected cart item
      if ((e.key === "+" || e.key === "=" || e.key === "-") && !isTypingTarget(e.target)) {
        if (!selectedCartKey) return;
        e.preventDefault();
        if (e.key === "-") decrementItem(selectedCartKey);
        else incrementItem(selectedCartKey);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addItem, decrementItem, incrementItem, placeOrderAndPayment, selectedCartKey, visibleItems]);

  // Indicate which items are already in the cart
  const itemsInCart = useMemo(() => {
    const set = new Set<string>();
    for (const entry of items) {
      if (entry.menuItemId) set.add(entry.menuItemId);
    }
    return set;
  }, [items]);

  function getEffectivePrice(item: OrderMenuItem, variantId?: string) {
    if (!variantId || !item.variants?.length) {
      return item.price;
    }
    const variant = item.variants.find((entry) => entry.id === variantId);
    if (!variant) {
      return item.price;
    }
    if (typeof variant.absolutePrice === "number") {
      return variant.absolutePrice;
    }
    // Our builder UI captures "variant price" (absolute) more often than "price delta".
    // If the item is in variant pricing mode, treat priceDelta as absolutePrice when absolutePrice isn't provided.
    if (item.pricingMode === "variant") {
      return typeof variant.priceDelta === "number" && variant.priceDelta > 0 ? variant.priceDelta : item.price;
    }
    return item.price + (variant.priceDelta ?? 0);
  }

  function openVariantChooser(item: OrderMenuItem) {
    const variants = (item.variants ?? []).filter((entry) => entry);
    if (variants.length === 0) {
      setLastAddedKey(item.id);
      addItem({ key: item.id, menuItemId: item.id, name: item.name, price: item.price, notes: "" });
      toast.success("Added to cart", { message: item.name, durationMs: 2200 });
      return;
    }

    const defaultVariant =
      variants.find((entry) => entry.isDefault) ?? variants.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];

    setVariantTargetItem(item);
    setSelectedVariantId(defaultVariant?.id ?? variants[0]?.id ?? "");
    setVariantModalOpen(true);
  }

  function confirmVariantSelection() {
    if (!variantTargetItem) {
      setVariantModalOpen(false);
      return;
    }
    const variant = variantTargetItem.variants?.find((entry) => entry.id === selectedVariantId);
    const effectivePrice = getEffectivePrice(variantTargetItem, selectedVariantId);
    const displayName = variant ? `${variantTargetItem.name} (${variant.optionName})` : variantTargetItem.name;
    const notes = variant ? `Variant: ${variant.groupName} - ${variant.optionName}` : "";
    const key = variant ? `${variantTargetItem.id}::${variant.id}` : variantTargetItem.id;

    addItem({
      key,
      menuItemId: variantTargetItem.id,
      variantId: variant?.id,
      name: displayName,
      price: effectivePrice,
      notes
    });
    setLastAddedKey(key);
    toast.success("Added to cart", { message: displayName, durationMs: 2200 });

    setVariantModalOpen(false);
    setVariantTargetItem(null);
    setSelectedVariantId("");
  }

  async function printBill() {
    if (items.length === 0) {
      return;
    }
    const orderLabel =
      orderType === "dine_in" ? `Walk-in • Table ${tableNo}` : "Walk-in • Takeaway";

    // Try to use saved restaurant receipt template for the cart as well
    let html: string;
    try {
      const template = await fetchRestaurantReceiptTemplate((restaurant as any)?.id || (restaurant as any)?._id);
      if (template?.layout) {
        const pseudoOrder: RecentOrder = {
          id: "cart-preview",
          orderNumber: "CART",
          status: "draft",
          paymentStatus: checkoutPaymentStatus,
          type: orderType,
          tableNo,
          items: items.map((item) => ({
            nameSnapshot: item.name,
            priceSnapshot: item.price,
            quantity: item.quantity,
            notes: item.notes,
            lineTotal: item.price * item.quantity
          })),
          pricing: {
            subtotal,
            tax,
            serviceCharge: 0,
            discount: 0,
            grandTotal: total
          },
          createdAt: new Date().toISOString()
        };
        html = renderClonedReceiptHtml({
          layout: template.layout,
          order: pseudoOrder,
          restaurantName: restaurant?.name ?? "Rasoio",
          centerAlignAll: true
        });
        if (!html) {
          throw new Error("template-render-failed");
        }
      } else {
        html = buildBillHtml({
          restaurantName: restaurant?.name ?? "Rasoio",
          orderLabel,
          items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes
          })),
          subtotal,
          tax,
          total
        });
      }
    } catch {
      html = buildBillHtml({
        restaurantName: restaurant?.name ?? "Rasoio",
        orderLabel,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        })),
        subtotal,
        tax,
        total
      });
    }

    // Prefer a popup window (best for receipt printers), fallback to an iframe if blocked.
    const w = window.open("", "_blank", "noopener,width=420,height=720");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();

      // Some browsers need an explicit print call after the document finishes loading.
      w.onload = () => {
        try {
          w.focus();
          w.print();
          w.close();
        } catch {
          // ignore
        }
      };
      return;
    }

    // Popup blocked: print via hidden iframe.
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
    doc.open();
    doc.write(html);
    doc.close();

    const cw = iframe.contentWindow;
    if (!cw) {
      iframe.remove();
      return;
    }
    cw.focus();
    cw.print();
    setTimeout(() => iframe.remove(), 500);
  }

  async function placeOrderAndPayment() {
    if (!items.length) {
      return;
    }

    try {
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "pos",
          type: orderType,
          status: "draft",
          tableNo: orderType === "dine_in" ? tableNo : "",
          customer: { name: "Walk-in", phone: "" },
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            nameSnapshot: item.name,
            priceSnapshot: item.price,
            quantity: item.quantity,
            notes: item.notes,
            lineTotal: item.price * item.quantity
          })),
          pricing: {
            subtotal,
            tax,
            serviceCharge: 0,
            discount: 0,
            grandTotal: total
          },
          paymentStatus: checkoutPaymentStatus
        })
      });

      if (!orderResponse.ok) {
        const payload = await orderResponse.json().catch(() => ({} as any));
        throw new Error(payload?.error || "Failed to create order");
      }

      const orderPayload = (await orderResponse.json()) as { data: { id: string } };

      // By default, immediately submit the order to "placed"
      const submitRes = await fetch(`/api/orders/${orderPayload.data.id}/submit`, { method: "POST" });
      if (!submitRes.ok) {
        throw new Error("Order created but submit failed");
      }

      if (checkoutPaymentStatus === "paid") {
        const payRes = await fetch(`/api/orders/${orderPayload.data.id}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            method: paymentMethod,
            status: "completed",
            reference: `POS-${Date.now()}`,
            orderId: orderPayload.data.id
          })
        });
        if (!payRes.ok) {
          throw new Error("Payment failed");
        }
      }

      toast.success("Order placed", {
        message: checkoutPaymentStatus === "paid" ? "Payment captured" : "Saved as unpaid",
        durationMs: 2600
      });

      reset();
      // Refresh list without full route reload
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const json = await res.json();
        if (json?.data?.orders) {
          setLiveOrders(json.data.orders as RecentOrder[]);
        } else {
          startTransition(() => router.refresh());
        }
      } catch {
        startTransition(() => router.refresh());
      }
    } catch (err: any) {
      toast.error("Couldn’t place order", { message: err?.message || "Try again", durationMs: 3400 });
    }
  }

  async function saveOrder(orderId: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNo: editingTableNo,
          status: editingStatus,
          paymentStatus: editingPaymentStatus
        })
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Order updated", { durationMs: 2200 });
    } catch (err: any) {
      toast.error("Couldn’t update order", { message: err?.message || "Try again", durationMs: 3400 });
    }

    setEditingOrderId(null);
    setEditingTableNo("");
    setEditingStatus("draft");
    setEditingPaymentStatus("unpaid");
    startTransition(() => router.refresh());
  }

  async function removeOrder(orderId: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.info("Order deleted", { durationMs: 2400 });
    } catch (err: any) {
      toast.error("Couldn’t delete order", { message: err?.message || "Try again", durationMs: 3400 });
    }
    if (editingOrderId === orderId) {
      setEditingOrderId(null);
      setEditingTableNo("");
      setEditingPaymentStatus("unpaid");
    }
    startTransition(() => router.refresh());
  }

  const filteredOrders = useMemo(() => {
    return liveOrders.filter((o) => {
      if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
      if (orderSearch) {
        const q = orderSearch.toLowerCase();
        const matchOrder = o.orderNumber.toLowerCase().includes(q);
        const matchToken = o.tokenNumber ? `#${o.tokenNumber}`.includes(q) : false;
        const matchTable = (o.tableNo ?? "").toLowerCase().includes(q);
        if (!matchOrder && !matchToken && !matchTable) return false;
      }
      return true;
    });
  }, [liveOrders, orderStatusFilter, orderSearch]);

  function beginOrderEdit(order: RecentOrder) {
    setEditingOrderId(order.id);
    setEditingTableNo(order.tableNo ?? "");
    setEditingStatus(order.status);
    setEditingPaymentStatus(order.paymentStatus);
  }

  return (
    <>
    <div className="space-y-6">
      <div className="grid gap-6 xl:items-start xl:grid-cols-[0.85fr_1.6fr_0.95fr]">
        {/* LEFT: Orders list */}
        <section className="xl:sticky xl:top-6 xl:self-start">
          <Card className="border border-border-subtle bg-bg-elevated">
            <CardHeader className="border-b border-border-subtle bg-white">
              <div className="flex items-center justify-between gap-3">
            <div>
                  <p className="label-text">Orders list</p>
                  <CardTitle className="mt-2">Active orders</CardTitle>
                </div>
                <Link href="/orders" className="text-sm font-semibold text-accent-primary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Search + filter */}
              <div className="mb-3 flex flex-col gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                  <input
                    className="h-9 w-full rounded-xl border border-border-subtle bg-white pl-9 pr-3 text-xs text-text-primary outline-none placeholder:text-text-muted"
                    placeholder="Search order, token, table..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {["all", "draft", "placed", "preparing", "ready", "completed", "cancelled"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOrderStatusFilter(s)}
                      className={[
                        "cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition",
                        orderStatusFilter === s
                          ? "bg-text-primary text-white"
                          : "bg-bg-surface text-text-secondary hover:bg-border-subtle"
                      ].join(" ")}
                    >
                      {s === "all" ? `All (${liveOrders.length})` : s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredOrders.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-secondary">No orders match your filters.</p>
                ) : null}
                {filteredOrders.slice(0, 20).map((order) => {
                  const ago = timeAgo(order.createdAt, nowTs);
                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-border-subtle bg-white px-4 py-3 transition hover:border-border-strong"
                    >
                      {/* Header row: token + order number + time ago */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {order.tokenNumber ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                #{order.tokenNumber}
                              </span>
                            ) : null}
                            <p className="truncate text-sm font-semibold text-text-primary">{order.orderNumber}</p>
                          </div>
                          <p className="mt-1 truncate text-xs capitalize text-text-secondary">
                            {(order.type ?? "dine_in").replaceAll("_", " ")}
                            {order.tableNo ? ` • Table ${order.tableNo}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"}>{order.paymentStatus}</Badge>
                          {ago ? (
                            <span className="flex items-center gap-1 text-[11px] text-text-muted">
                              <Clock className="h-3 w-3" />
                              {ago}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-text-primary">
                          {formatCurrency(order.pricing?.grandTotal ?? 0)}
                        </p>
                        <Badge variant={order.status === "completed" ? "success" : order.status === "cancelled" ? "danger" : "neutral"}>
                          {order.status}
                        </Badge>
                      </div>
                      {/* Actions */}
                      <div className="mt-2 flex items-center gap-2 border-t border-border-subtle pt-2">
                        <button
                          type="button"
                          onClick={() => beginOrderEdit(order)}
                          className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-gray-100 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void printInvoice(
                              order,
                              restaurant?.name ?? "Restaurant",
                              restaurant?.settings?.gstin,
                              (restaurant as any)?.id || (restaurant as any)?._id
                            )
                          }
                          className="cursor-pointer flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-accent-primary hover:bg-blue-50 transition"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Invoice
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CENTER: Menu list */}
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label-text">Menu list</p>
              <h2 className="mt-2 text-[1.9rem] leading-9 tracking-[-0.04em] text-text-primary">Build an order</h2>
            </div>
            <div className="hidden items-center gap-2 rounded-2xl border border-border-subtle bg-bg-elevated p-2 md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-surface text-text-primary">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <p className="label-text">Cart</p>
                <p className="font-semibold text-text-primary">
                  {items.reduce((sum, item) => sum + item.quantity, 0)} items
                </p>
              </div>
            </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  className="h-12 rounded-2xl bg-white pl-11"
                  placeholder="Search menu... (press /)"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  ref={searchRef}
                />
              </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border-subtle bg-bg-elevated p-2 md:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-surface text-text-primary">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <p className="label-text">Cart</p>
                  <p className="font-semibold text-text-primary">
                    {items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </p>
                </div>
              </div>
            </div>

          <Card className="border border-border-subtle bg-bg-elevated">
            <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              {[
                "All",
                ...Array.from(
                  new Set(
                    categories
                      .map((item) => item.name)
                      .filter((name) => typeof name === "string" && name.trim() !== "")
                  )
                )
              ].map((tab) => {
                const active = activeCategory === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveCategory(tab)}
                    className={[
                      "relative isolate cursor-pointer rounded-full px-4 py-2 text-sm font-semibold outline-none transition-[transform,color,border-color,background-color,box-shadow] duration-200 ease-out",
                      "focus-visible:ring-4 focus-visible:ring-accent-primary/12",
                      active
                        ? "text-white"
                        : "border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-strong hover:text-text-primary hover:bg-white"
                    ].join(" ")}
                  >
                    {active ? (
                      <motion.span
                        layoutId="posActiveCategoryPill"
                        className="absolute inset-0 -z-10 rounded-full bg-text-primary shadow-[0_10px_26px_rgba(28,26,23,0.14)]"
                        transition={{ duration: motionTokens.durations.slow, ease: motionTokens.easing }}
                      />
                    ) : null}
                    {tab}
                  </button>
                );
              })}
            </div>

              {isAllCategory ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-secondary">View</span>
                    <select
                      className="h-9 rounded-xl border border-border-subtle bg-white px-3 text-xs font-semibold text-text-primary outline-none"
                      value={itemsPageSize}
                      onChange={(e) => setItemsPageSize(Number(e.target.value) as 10 | 20 | 50)}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-xs text-text-secondary">per page</span>
          </div>

                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <div className="text-xs text-text-secondary">
                      Page {itemsPageSafe} / {itemsTotalPages} · {itemsTotal} items
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="cursor-pointer rounded-xl border border-border-subtle bg-white px-3 py-2 text-xs font-semibold text-text-primary transition hover:bg-bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={itemsPageSafe <= 1}
                        onClick={() => setItemsPage((value) => Math.max(1, value - 1))}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer rounded-xl border border-border-subtle bg-white px-3 py-2 text-xs font-semibold text-text-primary transition hover:bg-bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={itemsPageSafe >= itemsTotalPages}
                        onClick={() => setItemsPage((value) => Math.min(itemsTotalPages, value + 1))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.variants?.length) {
                    openVariantChooser(item);
                    return;
                  }
                  setLastAddedKey(item.id);
                  addItem({ key: item.id, menuItemId: item.id, name: item.name, price: item.price, notes: "" });
                  toast.success("Added to cart", { message: item.name, durationMs: 2200 });
                }}
                className={[
                  "group relative cursor-pointer overflow-hidden rounded-[24px] border p-5 text-left shadow-soft transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out will-change-transform active:scale-[0.99]",
                  itemsInCart.has(item.id)
                    ? "border-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20"
                    : "border-border-subtle bg-bg-elevated hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_16px_42px_rgba(28,26,23,0.10)]"
                ].join(" ")}
              >
                <AnimatePresence>
                  {lastAddedKey === item.id ? (
                    <motion.div
                      key="flash"
                      className="pointer-events-none absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: motionTokens.durations.normal, ease: motionTokens.easing }}
                      onAnimationComplete={() => setLastAddedKey(null)}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_55%)]" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="neutral">{item.tags[0] ?? "Menu item"}</Badge>
                    <h3 className="mt-4 text-[1.25rem] leading-8 tracking-[-0.03em]">{item.name}</h3>
                    {item.variants?.length ? (
                      <p className="mt-2 text-sm text-text-secondary">
                        {item.variants.length} variants available
                      </p>
                    ) : null}
                  </div>
                  <div
                    className={[
                      "rounded-full border px-3 py-1 text-sm font-semibold",
                      itemsInCart.has(item.id)
                        ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                        : "border-border-subtle bg-white text-text-primary"
                    ].join(" ")}
                  >
                    {formatCurrency(item.price)}
                  </div>
                </div>
                <div
                  className={[
                    "mt-8 flex items-center justify-between rounded-2xl px-4 py-3",
                    itemsInCart.has(item.id) ? "bg-accent-primary/10" : "bg-bg-surface"
                  ].join(" ")}
                >
                  <p className={itemsInCart.has(item.id) ? "text-accent-primary font-semibold" : undefined}>
                    {itemsInCart.has(item.id) ? "Added to cart" : "Tap once to add"}
                  </p>
                  <span className="text-sm font-semibold text-accent-primary">
                    {itemsInCart.has(item.id) ? "Add more" : "Add item"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* RIGHT: Order details */}
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <motion.div
            key={cartPulse}
            initial={{ boxShadow: "0 24px 70px rgba(28,26,23,0.10)" }}
            animate={{
              boxShadow: [
                "0 24px 70px rgba(28,26,23,0.10)",
                "0 30px 86px rgba(15,118,110,0.18)",
                "0 24px 70px rgba(28,26,23,0.10)"
              ]
            }}
            transition={{ duration: motionTokens.durations.slow, ease: motionTokens.easing }}
            className="rounded-2xl"
          >
          <Card className="overflow-hidden border border-border-subtle bg-bg-elevated">
            <CardHeader className="border-b border-border-subtle bg-white">
              <p className="label-text">Order details</p>
              <CardTitle className="mt-2 text-[1.7rem] leading-9 tracking-[-0.04em] text-text-primary">
                Walk-in | {orderType === "dine_in" ? `Table ${tableNo}` : "Takeaway"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="h-11 rounded-2xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                  value={orderType}
                  onChange={(event) => setOrderType(event.target.value as "dine_in" | "takeaway")}
                >
                  <option value="dine_in">Dine in</option>
                  <option value="takeaway">Takeaway</option>
                </select>
                {orderType === "dine_in" ? (
                  <Input
                    className="h-11 rounded-2xl"
                    value={tableNo}
                    onChange={(event) => setTableNo(event.target.value)}
                    placeholder="Table"
                  />
                ) : (
                  <div className="flex h-10 items-center rounded-xl border border-border-subtle bg-bg-surface px-4 text-sm text-text-secondary">
                    No table needed
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  className="h-11 rounded-2xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                  value={checkoutPaymentStatus}
                  onChange={(event) =>
                    setCheckoutPaymentStatus(event.target.value as "paid" | "unpaid")
                  }
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
                {checkoutPaymentStatus === "paid" ? (
                  <select
                    className="h-11 rounded-2xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="wallet">Wallet</option>
                  </select>
                ) : (
                  <div className="flex h-10 items-center rounded-xl border border-border-subtle bg-bg-surface px-4 text-sm text-text-secondary">
                    Payment will be collected later
                  </div>
                )}
              </div>

              <div className="space-y-3 xl:max-h-[320px] xl:overflow-y-auto xl:pr-1">
                {items.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-border-strong bg-bg-surface px-4 py-8 text-center">
                    <p className="font-semibold text-text-primary">No items added yet</p>
                    <p className="mt-1 text-text-secondary">
                      Select products on the left to start this order.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false} mode="popLayout">
                    {items.map((item) => (
                      <motion.div
                        key={item.key}
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98, height: 0, marginTop: 0 }}
                        transition={{ duration: motionTokens.durations.normal, ease: motionTokens.easing }}
                        onClick={() => setSelectedCartKey(item.key)}
                        className={[
                          "rounded-[22px] border bg-white p-4 shadow-[0_10px_26px_rgba(28,26,23,0.06)] transition-[border-color,box-shadow] duration-200",
                          selectedCartKey === item.key
                            ? "border-accent-primary/55 shadow-[0_18px_52px_rgba(15,118,110,0.12)]"
                            : "border-border-subtle hover:border-border-strong"
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-text-primary">{item.name}</p>
                            <p className="text-text-secondary">
                              <AnimatedNumber
                                value={item.price}
                                format={(n) => formatCurrency(n)}
                                durationMs={140}
                                className="tabular-nums"
                              />{" "}
                              each
                            </p>
                            {item.notes ? <p className="mt-1 text-xs text-text-muted">{item.notes}</p> : null}
                          </div>
                          <AnimatedNumber
                            value={item.price * item.quantity}
                            format={(n) => formatCurrency(n)}
                            durationMs={160}
                            className="font-semibold text-text-primary tabular-nums"
                          />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full"
                            onClick={() => {
                              setSelectedCartKey(item.key);
                              const willRemove = item.quantity <= 1;
                              decrementItem(item.key);
                              if (willRemove) {
                                toast.info("Removed from cart", {
                                  message: item.name,
                                  durationMs: 3200,
                                  action: {
                                    label: "Undo",
                                    onClick: () => restoreCartItem(item, 1)
                                  }
                                });
                              } else {
                                toast.info("Quantity updated", { message: item.name, durationMs: 2000 });
                              }
                            }}
                            aria-label={`Decrease ${item.name}`}
                          >
                            -
                          </Button>
                          <div className="relative flex h-9 min-w-12 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-bg-surface px-3 text-sm font-semibold text-text-primary">
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.span
                                key={item.quantity}
                                initial={{ y: -8, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 8, opacity: 0 }}
                                transition={{ duration: motionTokens.durations.fast, ease: motionTokens.easing }}
                              >
                                {item.quantity}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="rounded-full"
                            onClick={() => {
                              setSelectedCartKey(item.key);
                              incrementItem(item.key);
                              toast.info("Quantity updated", { message: item.name, durationMs: 2000 });
                            }}
                            aria-label={`Increase ${item.name}`}
                          >
                            +
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              <div className="rounded-[22px] border border-border-subtle bg-bg-surface p-4">
                <div className="flex items-center justify-between text-sm text-text-secondary">
                  <span>Subtotal</span>
                  <AnimatedNumber
                    value={subtotal}
                    format={(n) => formatCurrency(n)}
                    durationMs={180}
                    className="font-medium text-text-primary tabular-nums"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-text-secondary">
                  <span>Tax</span>
                  <AnimatedNumber
                    value={tax}
                    format={(n) => formatCurrency(n)}
                    durationMs={180}
                    className="font-medium text-text-primary tabular-nums"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-4">
                  <span className="text-base font-semibold text-text-primary">Total</span>
                  <AnimatedNumber
                    value={total}
                    format={(n) => formatCurrency(n)}
                    durationMs={220}
                    className="text-xl font-bold tracking-[-0.02em] text-text-primary tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="h-11 rounded-2xl" onClick={() => reset()}>
                  Clear cart
                </Button>
                <Button
                  className="h-11 rounded-2xl bg-accent-primary hover:bg-accent-primary-hover"
                  disabled={isPending || items.length === 0}
                  onClick={placeOrderAndPayment}
                >
                  {checkoutPaymentStatus === "paid" ? "Charge order" : "Save unpaid order"}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button variant="secondary" className="h-11 rounded-2xl" disabled={items.length === 0} onClick={printBill}>
                  Print bill
                </Button>
              </div>

              <div className="rounded-[22px] border border-border-subtle bg-bg-surface p-4">
                <p className="label-text">Recent order activity</p>
                <div className="mt-3 space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {order.tokenNumber ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              #{order.tokenNumber}
                            </span>
                          ) : null}
                        <p className="font-semibold text-text-primary">{order.orderNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                        <p className="capitalize text-text-secondary">{order.status}</p>
                          {order.createdAt ? (
                            <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                              <Clock className="h-2.5 w-2.5" />
                              {timeAgo(order.createdAt)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"}>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </aside>
      </div>

                    </div>

      {/* Edit order modal */}
      <Modal
        open={editingOrderId !== null}
        title="Edit order"
        description={editingOrderId ? `Update status, table, or payment for this order.` : undefined}
        onClose={() => {
          setEditingOrderId(null);
          setEditingTableNo("");
          setEditingStatus("draft");
          setEditingPaymentStatus("unpaid");
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingOrderId(null);
                setEditingTableNo("");
                setEditingStatus("draft");
                setEditingPaymentStatus("unpaid");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              onClick={() => {
                if (editingOrderId && confirm("Delete this order?")) {
                  removeOrder(editingOrderId);
                }
              }}
            >
              Delete
            </Button>
            <Button onClick={() => editingOrderId && saveOrder(editingOrderId)}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">Status</label>
                          <select
              className="h-11 w-full rounded-2xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                            value={editingStatus}
              onChange={(e) => setEditingStatus(e.target.value)}
                          >
                            <option value="draft">Draft</option>
                            <option value="placed">Placed</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">Table No.</label>
            <Input
              className="h-11 rounded-2xl"
              value={editingTableNo}
              onChange={(e) => setEditingTableNo(e.target.value)}
              placeholder="e.g. 04"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">Payment status</label>
                          <select
              className="h-11 w-full rounded-2xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                            value={editingPaymentStatus}
              onChange={(e) => setEditingPaymentStatus(e.target.value)}
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                            <option value="refunded">Refunded</option>
                          </select>
          </div>
        </div>
      </Modal>

      <Modal
      open={variantModalOpen}
      title="Choose a variant"
      description={variantTargetItem ? `Select a variant for ${variantTargetItem.name}` : undefined}
      onClose={() => {
        setVariantModalOpen(false);
        setVariantTargetItem(null);
        setSelectedVariantId("");
      }}
      footer={
        <>
                          <Button
            variant="secondary"
                            onClick={() => {
              setVariantModalOpen(false);
              setVariantTargetItem(null);
              setSelectedVariantId("");
                            }}
                          >
                            Cancel
                          </Button>
          <Button onClick={confirmVariantSelection} disabled={!selectedVariantId}>
            Add to cart
                          </Button>
                        </>
      }
    >
      {variantTargetItem?.variants?.length ? (
        <div className="space-y-3">
          {variantTargetItem.variants
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((variant) => {
              const effectivePrice = getEffectivePrice(variantTargetItem, variant.id);
              return (
                <label
                  key={variant.id}
                  className={[
                    "flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3",
                    selectedVariantId === variant.id
                      ? "border-border-strong bg-bg-surface"
                      : "border-border-subtle bg-white hover:bg-bg-surface"
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="variant"
                      checked={selectedVariantId === variant.id}
                      onChange={() => setSelectedVariantId(variant.id)}
                    />
                    <div>
                      <p className="font-semibold text-text-primary">
                        {variant.groupName}: {variant.optionName}
                      </p>
                      <p className="text-sm text-text-secondary">{variant.variantType}</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-text-primary">
                    {formatCurrency(effectivePrice)}
                </div>
                </label>
              );
            })}
            </div>
      ) : (
        <p className="text-sm text-text-secondary">No variants available.</p>
      )}
      </Modal>
    </>
  );
}
