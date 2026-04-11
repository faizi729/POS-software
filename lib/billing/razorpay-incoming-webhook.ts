import { verifyWebhookSignature } from "@/server/services/wa-payment-service";
import { handlePaymentSuccess } from "@/server/services/wa-state-machine";
import { handleSaaSSubscriptionWebhookEvent } from "@/lib/billing/saas-subscription-webhook";

/**
 * Single entry for all Razorpay webhooks (payment links + SaaS subscriptions).
 * Point Razorpay Dashboard → Webhooks to either:
 *   {APP_BASE_URL}/api/whatsapp/razorpay-webhook
 *   {APP_BASE_URL}/api/billing/razorpay/webhook
 */
export async function processRazorpayWebhookPayload(rawBody: string, signature: string): Promise<{
  ok: boolean;
  status: number;
  message: string;
}> {
  let isValid = false;
  try {
    isValid = verifyWebhookSignature(rawBody, signature);
  } catch {
    isValid = false;
  }

  if (!isValid) {
    return { ok: false, status: 400, message: "Invalid signature" };
  }

  let event: { event?: string; payload?: unknown };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { ok: false, status: 400, message: "Invalid JSON" };
  }

  const eventType = event?.event || "";

  if (eventType === "payment_link.paid") {
    const paymentLink = (event as any)?.payload?.payment_link?.entity;
    const linkId = paymentLink?.id;
    if (linkId) {
      handlePaymentSuccess(linkId).catch((err) =>
        console.error("[razorpay-webhook] handlePaymentSuccess error:", err)
      );
    }
    return { ok: true, status: 200, message: "OK" };
  }

  if (eventType.startsWith("subscription.")) {
    await handleSaaSSubscriptionWebhookEvent(event as any).catch((err) =>
      console.error("[razorpay-webhook] SaaS subscription handler error:", err)
    );
    return { ok: true, status: 200, message: "OK" };
  }

  return { ok: true, status: 200, message: "OK" };
}
