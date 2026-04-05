/**
 * WhatsApp Cloud API webhook.
 *
 * GET  → Webhook verification (Meta challenge)
 * POST → Incoming messages (text, buttons, list, product, order)
 */

import { NextRequest, NextResponse } from "next/server";
import { WA_CONFIG } from "@/lib/whatsapp/config";
import { markRead } from "@/lib/whatsapp/client";
import {
  handleIncomingMessage,
  type IncomingMessage,
} from "@/server/services/wa-state-machine";

/* ─── GET: Meta webhook verification ─── */

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === WA_CONFIG.verifyToken) {
    console.log("[whatsapp] webhook verified ✓");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[whatsapp] webhook verification failed");
  return new NextResponse("Forbidden", { status: 403 });
}

/* ─── POST: Incoming messages ─── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // WhatsApp sends notifications even for status updates.
    // We only care about "messages" entries.
    const entries = body?.entry ?? [];

    for (const entry of entries) {
      const changes = entry?.changes ?? [];

      for (const change of changes) {
        const value = change?.value;
        if (!value || value.messaging_product !== "whatsapp") continue;

        const messages = value.messages ?? [];

        for (const raw of messages) {
          const parsed = parseMessage(raw);
          if (!parsed) continue;

          // Mark as read immediately (non-blocking)
          markRead(parsed.messageId).catch(() => {});

          // Handle in background — webhook must respond fast
          handleIncomingMessage(parsed).catch((err) =>
            console.error("[whatsapp] message handler error:", err)
          );
        }
      }
    }

    // Always return 200 to Meta (even on errors — otherwise they retry)
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[whatsapp] webhook POST error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}

/* ─── Message parser ─── */

function parseMessage(raw: any): IncomingMessage | null {
  if (!raw || !raw.from) return null;

  const base: IncomingMessage = {
    from: raw.from,
    messageId: raw.id ?? "",
    type: "unknown",
  };

  const msgType = raw.type;

  // 1. Text message
  if (msgType === "text" && raw.text?.body) {
    return {
      ...base,
      type: "text",
      text: raw.text.body,
    };
  }

  // 2. Interactive: button reply
  if (msgType === "interactive" && raw.interactive?.type === "button_reply") {
    return {
      ...base,
      type: "interactive",
      buttonReplyId: raw.interactive.button_reply?.id,
      text: raw.interactive.button_reply?.title,
    };
  }

  // 3. Interactive: list reply
  if (msgType === "interactive" && raw.interactive?.type === "list_reply") {
    return {
      ...base,
      type: "interactive",
      listReplyId: raw.interactive.list_reply?.id,
      text: raw.interactive.list_reply?.title,
    };
  }

  // 4. Interactive: product (from catalog)
  if (
    msgType === "interactive" &&
    raw.interactive?.type === "product_list" &&
    raw.interactive?.product_list_reply
  ) {
    return {
      ...base,
      type: "interactive",
      productIds: [raw.interactive.product_list_reply.product_retailer_id],
    };
  }

  // 5. Order message (user selected products from catalog)
  if (msgType === "order" && raw.order?.product_items) {
    const productIds = raw.order.product_items.map(
      (p: any) => p.product_retailer_id
    );
    return {
      ...base,
      type: "order",
      productIds,
    };
  }

  // 6. Single product message
  if (msgType === "interactive" && raw.interactive?.type === "product") {
    // Some clients send product as interactive
    const retailerId =
      raw.interactive?.product?.product_retailer_id ??
      raw.interactive?.action?.product_retailer_id;
    if (retailerId) {
      return {
        ...base,
        type: "interactive",
        productIds: [retailerId],
      };
    }
  }

  // Unknown type
  return {
    ...base,
    type: "unknown",
    text: raw.text?.body ?? raw.caption ?? "",
  };
}
