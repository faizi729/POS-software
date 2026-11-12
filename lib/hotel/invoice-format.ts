/** Pure invoice-number formatting (no imports) — unit-testable. */

/** Indian financial year containing `date` (Apr–Mar), e.g. 12 Nov 2026 → "2026-27". */
export function financialYear(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export function formatInvoiceNumber(prefix: string, fy: string, seq: number): string {
  return `${prefix}/${fy}/${String(Math.max(1, Math.round(seq))).padStart(5, "0")}`;
}
