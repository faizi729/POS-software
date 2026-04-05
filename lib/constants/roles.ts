export const USER_ROLES = ["owner", "manager", "cashier", "staff"] as const;
export const ORDER_TYPES = ["dine_in", "takeaway"] as const;
export const ORDER_CHANNELS = ["pos", "web", "whatsapp"] as const;
export const ORDER_STATUSES = [
  "draft",
  "placed",
  "preparing",
  "ready",
  "completed",
  "cancelled"
] as const;
export const PAYMENT_METHODS = ["cash", "card", "upi", "wallet"] as const;
export const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"] as const;
export const PAYMENT_ORDER_STATUSES = ["unpaid", "partial", "paid", "refunded"] as const;

/* ──── Extension module constants ──── */
export const INGREDIENT_UNITS = ["kg", "g", "L", "ml", "pcs", "dozen", "bunch", "packet"] as const;
export const INVENTORY_LOG_TYPES = ["deduction", "restock", "adjustment", "wastage"] as const;
export const LOYALTY_TYPES = ["earn", "redeem", "adjust", "expire"] as const;
export const KDS_STATUSES = ["placed", "preparing", "ready"] as const;
