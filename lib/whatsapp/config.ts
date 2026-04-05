/**
 * WhatsApp Cloud API configuration.
 *
 * Required env vars:
 *   WHATSAPP_TOKEN          – Permanent access token from Meta
 *   WHATSAPP_PHONE_ID       – Phone number ID from Meta Business
 *   WHATSAPP_VERIFY_TOKEN   – Your chosen webhook verify token
 *   WHATSAPP_CATALOG_ID     – Your WhatsApp Business Catalog ID
 *   WHATSAPP_RESTAURANT_ID  – The ObjectId of the restaurant this WA number belongs to
 *   RAZORPAY_KEY_ID         – Razorpay key id
 *   RAZORPAY_KEY_SECRET     – Razorpay key secret
 *   RAZORPAY_WEBHOOK_SECRET – Razorpay webhook secret for signature verification
 *   APP_BASE_URL            – Public base URL, e.g. https://yourpos.com
 */

function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export const WA_CONFIG = {
  /** Meta Cloud API base */
  apiBase: "https://graph.facebook.com/v21.0",

  /** Auth token for Cloud API */
  get token() {
    return env("WHATSAPP_TOKEN");
  },

  /** Phone number ID (NOT the phone number itself) */
  get phoneNumberId() {
    return env("WHATSAPP_PHONE_ID");
  },

  /** Webhook verification token */
  get verifyToken() {
    return env("WHATSAPP_VERIFY_TOKEN");
  },

  /** WhatsApp catalog ID */
  get catalogId() {
    return env("WHATSAPP_CATALOG_ID", "");
  },

  /** The restaurant this WA number belongs to */
  get restaurantId() {
    return env("WHATSAPP_RESTAURANT_ID");
  },

  /** Razorpay */
  get razorpayKeyId() {
    return env("RAZORPAY_KEY_ID");
  },
  get razorpayKeySecret() {
    return env("RAZORPAY_KEY_SECRET");
  },
  get razorpayWebhookSecret() {
    return env("RAZORPAY_WEBHOOK_SECRET");
  },

  /** Public URL for callbacks */
  get appBaseUrl() {
    return env("APP_BASE_URL", "http://localhost:3000");
  },

  /** Session TTL in hours — stale sessions auto-expire */
  sessionTtlHours: 24,
} as const;

/** Conversation states */
export const WA_STATES = {
  START: "START",
  BROWSING: "BROWSING",
  ITEM_SELECTED: "ITEM_SELECTED",
  ADDING_QUANTITY: "ADDING_QUANTITY",
  CART_VIEW: "CART_VIEW",
  CHECKOUT_NAME: "CHECKOUT_NAME",
  CHECKOUT_ADDRESS: "CHECKOUT_ADDRESS",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
} as const;

export type WaState = (typeof WA_STATES)[keyof typeof WA_STATES];
