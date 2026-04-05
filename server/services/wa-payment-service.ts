/**
 * Razorpay payment link service for WhatsApp orders.
 * Creates payment links and verifies webhook signatures.
 */

import crypto from "crypto";
import { WA_CONFIG } from "@/lib/whatsapp/config";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function authHeader() {
  const creds = Buffer.from(
    `${WA_CONFIG.razorpayKeyId}:${WA_CONFIG.razorpayKeySecret}`
  ).toString("base64");
  return `Basic ${creds}`;
}

type CreatePaymentLinkParams = {
  amount: number; // in smallest currency unit (paise for INR)
  currency?: string;
  description: string;
  customerName: string;
  customerPhone: string;
  orderId?: string; // internal reference
  callbackUrl?: string;
};

export type PaymentLinkResult = {
  id: string;
  shortUrl: string;
  amount: number;
  status: string;
};

/**
 * Create a Razorpay payment link.
 * Returns { id, shortUrl } — send shortUrl to customer on WhatsApp.
 */
export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<PaymentLinkResult> {
  const body: Record<string, any> = {
    amount: Math.round(params.amount * 100), // rupees → paise
    currency: params.currency ?? "INR",
    description: params.description,
    customer: {
      name: params.customerName,
      contact: params.customerPhone,
    },
    notify: {
      sms: false,
      email: false,
      whatsapp: false, // We send our own WA message
    },
    reminder_enable: false,
    callback_url: params.callbackUrl ?? `${WA_CONFIG.appBaseUrl}/api/whatsapp/payment-callback`,
    callback_method: "get",
    notes: {
      source: "whatsapp",
      phone: params.customerPhone,
    },
  };

  if (params.orderId) {
    body.notes.orderId = params.orderId;
  }

  const res = await fetch(`${RAZORPAY_API}/payment_links`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[razorpay] create payment link failed:", res.status, text);
    throw new Error(`Razorpay error: ${res.status}`);
  }

  const data = await res.json();

  return {
    id: data.id,
    shortUrl: data.short_url,
    amount: data.amount / 100,
    status: data.status,
  };
}

/**
 * Verify Razorpay webhook signature.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", WA_CONFIG.razorpayWebhookSecret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Fetch payment link status from Razorpay.
 */
export async function getPaymentLinkStatus(
  linkId: string
): Promise<{ status: string; amountPaid: number }> {
  const res = await fetch(`${RAZORPAY_API}/payment_links/${linkId}`, {
    headers: { Authorization: authHeader() },
  });

  if (!res.ok) {
    throw new Error(`Razorpay fetch error: ${res.status}`);
  }

  const data = await res.json();

  return {
    status: data.status, // "created" | "paid" | "expired" | "cancelled"
    amountPaid: (data.amount_paid ?? 0) / 100,
  };
}
