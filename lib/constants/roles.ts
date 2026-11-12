export const USER_ROLES = ["owner", "manager", "cashier", "staff", "front_desk", "housekeeping"] as const;
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

/* ──── Product modules (per-tenant) ──── */
export const APP_MODULES = ["pos", "rooms", "banquet"] as const;
export type AppModule = (typeof APP_MODULES)[number];

/* ──── Hotel / Banquet ──── */
export const ROOM_STATUSES = ["available", "occupied", "dirty", "maintenance"] as const;
export const RESERVATION_STATUSES = [
  "tentative",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show"
] as const;
export const RESERVATION_SOURCES = ["walk_in", "phone", "ota", "website"] as const;
export const FOLIO_STATUSES = ["open", "settled"] as const;
export const FOLIO_CHARGE_TYPES = ["room", "fnb", "extra", "tax"] as const;
export const HOUSEKEEPING_STATUSES = ["pending", "in_progress", "done"] as const;
export const BOOKING_SLOTS = ["morning", "evening", "full_day"] as const;
export const BANQUET_STATUSES = ["tentative", "confirmed", "completed", "cancelled"] as const;
export const MEAL_PLANS = ["EP", "CP", "MAP", "AP"] as const;
export const MAINTENANCE_STATUSES = ["open", "in_progress", "done"] as const;
