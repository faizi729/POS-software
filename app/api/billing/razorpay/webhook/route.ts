/**
 * Alias webhook URL for Razorpay (same handler as /api/whatsapp/razorpay-webhook).
 * Use whichever path you prefer in the Razorpay Dashboard.
 */

import { NextRequest, NextResponse } from "next/server";

import { processRazorpayWebhookPayload } from "@/lib/billing/razorpay-incoming-webhook";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";

    const result = await processRazorpayWebhookPayload(rawBody, signature);
    return new NextResponse(result.message, { status: result.status });
  } catch (error) {
    console.error("[billing/razorpay-webhook] error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}
