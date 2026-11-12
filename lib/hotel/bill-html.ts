/** Bill totals in rupees (already converted from paise for rendering). */
export type FolioBillSummary = { room: number; fnb: number; extra: number; tax: number; total: number };

export type FolioBillInput = {
  restaurantName: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  invoiceNumber?: string;
  charges: Array<{ type: string; description?: string; amount: number; postedAt: string }>;
  summary: FolioBillSummary;
  advancePaid?: number;
  currency?: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const money = (value: number) => value.toFixed(2);

/**
 * Consolidated folio bill for a stay, rendered in the same 80mm receipt style
 * as the cloned POS bill template (monospace, sectioned, totals right-aligned).
 */
export function renderFolioBillHtml(input: FolioBillInput) {
  const balance = Math.max(0, input.summary.total - (input.advancePaid ?? 0));

  const rows = input.charges
    .map(
      (charge) => `<tr>
        <td class="desc">
          <span>${escapeHtml(charge.description || charge.type)}</span>
          <small>${escapeHtml(charge.postedAt)}</small>
        </td>
        <td class="amt">${money(charge.amount)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" />
<title>Folio ${escapeHtml(input.roomNumber)}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; margin: 0; padding: 18px; color: #111; }
  .wrap { width: 80mm; margin: 0 auto; }
  h1 { font-size: 15px; text-align: center; margin: 0 0 4px; letter-spacing: 0.04em; }
  .meta { font-size: 11px; text-align: center; color: #555; }
  .box { border-top: 1px dashed #bbb; border-bottom: 1px dashed #bbb; margin: 10px 0; padding: 8px 0; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  td { padding: 4px 0; border-bottom: 1px solid #f1f1f1; vertical-align: top; }
  .desc small { display: block; color: #888; font-size: 9px; }
  .amt { text-align: right; white-space: nowrap; }
  .totals { margin-top: 10px; font-size: 11px; }
  .totals .row { display: flex; justify-content: space-between; padding: 2px 0; }
  .totals .row.total { border-top: 1px solid #111; margin-top: 6px; padding-top: 6px; font-weight: 700; font-size: 13px; }
  .footer { text-align: center; font-size: 10px; color: #666; margin-top: 12px; }
  @media print { body { padding: 0; } .wrap { margin: 0; } }
</style></head>
<body><div class="wrap">
  <h1>${escapeHtml(input.restaurantName)}</h1>
  <div class="meta">Folio - Room ${escapeHtml(input.roomNumber)}${
    input.invoiceNumber ? ` - ${escapeHtml(input.invoiceNumber)}` : ""
  }</div>
  <div class="box">
    <div>${escapeHtml(input.guestName)}</div>
    <div>${escapeHtml(input.checkIn)} to ${escapeHtml(input.checkOut)}</div>
  </div>
  <table><tbody>${rows}</tbody></table>
  <div class="totals">
    <div class="row"><span>Room</span><span>${money(input.summary.room)}</span></div>
    <div class="row"><span>Food &amp; beverage</span><span>${money(input.summary.fnb)}</span></div>
    <div class="row"><span>Extras</span><span>${money(input.summary.extra)}</span></div>
    <div class="row"><span>GST</span><span>${money(input.summary.tax)}</span></div>
    <div class="row total"><span>Total</span><span>${money(input.summary.total)}</span></div>
    ${
      input.advancePaid
        ? `<div class="row"><span>Advance</span><span>- ${money(input.advancePaid)}</span></div>
           <div class="row total"><span>Balance</span><span>${money(balance)}</span></div>`
        : ""
    }
  </div>
  <div class="footer">Thank you</div>
</div></body></html>`;
}

export type BookingQuoteInput = {
  restaurantName: string;
  hallName: string;
  date: string;
  slot: string;
  eventType?: string;
  guestCount: number;
  perPlate: number;
  hallRate: number;
  packageItems?: Array<{ name: string; pricePerPlate: number }>;
  advancePaid: number;
  totalAmount: number;
  balance: number;
};

/** Banquet quotation in the same 80mm receipt style as the folio bill. */
export function renderBookingQuoteHtml(input: BookingQuoteInput) {
  const plateTotal = input.perPlate * input.guestCount;
  const items = (input.packageItems ?? [])
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.name)}</td><td class="amt">${money(item.pricePerPlate)} / plate</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" />
<title>Quotation ${escapeHtml(input.hallName)}</title>
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
  <div class="meta">Quotation - ${escapeHtml(input.hallName)}</div>
  <div class="box">
    <div>${escapeHtml(input.date)} - ${escapeHtml(input.slot.replace("_", " "))}</div>
    <div>${escapeHtml(input.eventType || "Event")} - ${input.guestCount} guests</div>
  </div>
  <table><tbody>
    <tr><td>Hall charges</td><td class="amt">${money(input.hallRate)}</td></tr>
    <tr><td>Menu (${input.guestCount} x ${money(input.perPlate)})</td><td class="amt">${money(plateTotal)}</td></tr>
    ${items}
  </tbody></table>
  <div class="totals">
    <div class="row total"><span>Total</span><span>${money(input.totalAmount)}</span></div>
    <div class="row"><span>Advance</span><span>- ${money(input.advancePaid)}</span></div>
    <div class="row total"><span>Balance</span><span>${money(input.balance)}</span></div>
  </div>
</div></body></html>`;
}
