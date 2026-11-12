const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (value: number) => `₹${(Number(value) || 0).toFixed(2)}`;

export type BanquetDocumentInput = {
  kind: "quotation" | "invoice" | "run_sheet";
  restaurantName: string;
  hallName: string;
  date: string;
  slot: string;
  eventType: string;
  guestName: string;
  guestCount: number;
  hallRate: number;
  perPlate: number;
  items: Array<{ name: string; pricePerPlate: number }>;
  addOns: Array<{ name: string; amount: number }>;
  gstPercent: number;
  gst: number;
  total: number;
  paid: number;
  balance: number;
  documentNumber?: string;
  setupType?: string;
  startTime?: string;
  endTime?: string;
  staffNotes?: string;
};

/** 80mm printable quotation / invoice / run sheet for a banquet event. */
export function renderBanquetDocument(input: BanquetDocumentInput): string {
  const plateTotal = input.perPlate * input.guestCount;
  const title =
    input.kind === "invoice" ? "Invoice" : input.kind === "run_sheet" ? "Run sheet" : "Quotation";

  const body =
    input.kind === "run_sheet"
      ? `<div class="box">
    <div>${escapeHtml(input.date)} - ${escapeHtml(input.slot.replace("_", " "))}</div>
    <div>${escapeHtml(input.startTime || "--:--")} to ${escapeHtml(input.endTime || "--:--")}</div>
    <div>${escapeHtml(input.setupType || "Setup TBC")} - ${input.guestCount} guests</div>
    <div>${escapeHtml(input.guestName || "Guest")}</div>
  </div>
  <div class="box"><div>${escapeHtml(input.staffNotes || "")}</div></div>`
      : `<div class="box">
    <div>${escapeHtml(input.date)} - ${escapeHtml(input.slot.replace("_", " "))}</div>
    <div>${escapeHtml(input.eventType || "Event")} - ${input.guestCount} guests</div>
    <div>${escapeHtml(input.guestName || "Guest")}</div>
  </div>
  <table><tbody>
    <tr><td>Hall charges</td><td class="amt">${money(input.hallRate)}</td></tr>
    <tr><td>Menu (${input.guestCount} x ${money(input.perPlate)})</td><td class="amt">${money(plateTotal)}</td></tr>
    ${input.items
      .map((item) => `<tr><td>${escapeHtml(item.name)}</td><td class="amt">${money(item.pricePerPlate)}</td></tr>`)
      .join("")}
    ${input.addOns
      .map((row) => `<tr><td>${escapeHtml(row.name)}</td><td class="amt">${money(row.amount)}</td></tr>`)
      .join("")}
  </tbody></table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${money(input.total - input.gst)}</span></div>
    <div class="row"><span>GST ${input.gstPercent}%</span><span>${money(input.gst)}</span></div>
    <div class="row total"><span>Total</span><span>${money(input.total)}</span></div>
    <div class="row"><span>Paid</span><span>- ${money(input.paid)}</span></div>
    <div class="row total"><span>Balance</span><span>${money(input.balance)}</span></div>
  </div>`;

  return `<!doctype html><html><head><meta charset="utf-8">
<title>${title} ${escapeHtml(input.hallName)}</title>
<style>
  body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; margin: 0; padding: 18px; color: #111; }
  .wrap { width: 80mm; margin: 0 auto; }
  h1 { font-size: 15px; text-align: center; margin: 0 0 4px; letter-spacing: 0.04em; }
  .meta { font-size: 11px; text-align: center; color: #555; }
  .box { border-top: 1px dashed #bbb; border-bottom: 1px dashed #bbb; margin: 10px 0; padding: 8px 0; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  td { padding: 4px 0; border-bottom: 1px solid #f1f1f1; }
  .amt { text-align: right; white-space: nowrap; }
  .totals { margin-top: 10px; font-size: 11px; }
  .totals .row { display: flex; justify-content: space-between; padding: 2px 0; }
  .totals .row.total { border-top: 1px solid #111; margin-top: 6px; padding-top: 6px; font-weight: 700; font-size: 13px; }
  @media print { body { padding: 0; } .wrap { margin: 0; } }
</style></head>
<body><div class="wrap">
  <h1>${escapeHtml(input.restaurantName)}</h1>
  <div class="meta">${title} - ${escapeHtml(input.hallName)}${
    input.documentNumber ? ` - ${escapeHtml(input.documentNumber)}` : ""
  }</div>
  ${body}
</div></body></html>`;
}
