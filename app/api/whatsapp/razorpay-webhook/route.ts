/**
 * Razorpay webhook for payment link status updates.
 *
 * When a payment link is paid, this webhook:
 * 1. Verifies the signature
 * 2. Calls handlePaymentSuccess which creates the POS order + sends WA confirmation
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/server/services/wa-payment-service";
import { handlePaymentSuccess } from "@/server/services/wa-state-machine";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";

    // 1. Verify signature
    let isValid = false;
    try {
      isValid = verifyWebhookSignature(rawBody, signature);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      console.warn("[razorpay-webhook] invalid signature");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    // 2. Parse event
    const event = JSON.parse(rawBody);
    const eventType = event?.event;

    console.log("[razorpay-webhook] received event:", eventType);

    // 3. Handle payment link paid
    if (eventType === "payment_link.paid") {
      const paymentLink = event?.payload?.payment_link?.entity;
      const linkId = paymentLink?.id;

      if (linkId) {
        // Process async — webhook must respond fast
        handlePaymentSuccess(linkId).catch((err) =>
          console.error("[razorpay-webhook] handlePaymentSuccess error:", err)
        );
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[razorpay-webhook] error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}
