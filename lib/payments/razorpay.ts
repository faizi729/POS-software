import crypto from "node:crypto";

/**
 * Razorpay REST client (no SDK). Env:
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
 * Without keys, public booking still works as a pay-at-hotel request.
 */
const KEY_ID = () => (process.env.RAZORPAY_KEY_ID || "").trim();
const KEY_SECRET = () => (process.env.RAZORPAY_KEY_SECRET || "").trim();
const WEBHOOK_SECRET = () => (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();

export function razorpayConfigured(): boolean {
  return Boolean(KEY_ID() && KEY_SECRET());
}

export function razorpayKeyId(): string {
  return KEY_ID();
}

export type RazorpayOrder = { id: string; amount: number; currency: string; status: string };

/** Amount in paise. */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!razorpayConfigured()) throw new Error("Razorpay is not configured");
  const auth = Buffer.from(`${KEY_ID()}:${KEY_SECRET()}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: Math.round(params.amountPaise),
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes ?? {}
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Razorpay order failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return (await response.json()) as RazorpayOrder;
}

/** Checkout.js success handler → `razorpay_signature` = HMAC(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!razorpayConfigured()) return false;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET())
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, params.signature);
}

/** Webhook: HMAC-SHA256 over the raw request body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = WEBHOOK_SECRET();
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a ?? "", "utf8");
  const right = Buffer.from(b ?? "", "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
