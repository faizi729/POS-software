export function derivePaymentStatus(paidAmount: number, grandTotal: number) {
  if (paidAmount <= 0) {
    return "unpaid" as const;
  }

  if (paidAmount >= grandTotal) {
    return "paid" as const;
  }

  return "partial" as const;
}
