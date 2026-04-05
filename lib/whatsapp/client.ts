/**
 * WhatsApp Cloud API client.
 * Wraps the Meta Graph API for sending messages, buttons, lists, and catalog products.
 */

import { WA_CONFIG } from "./config";

const API = `${WA_CONFIG.apiBase}/${WA_CONFIG.phoneNumberId}/messages`;

async function send(body: Record<string, any>) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WA_CONFIG.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[wa-client] send failed:", res.status, text);
    throw new Error(`WhatsApp API error: ${res.status}`);
  }

  return res.json();
}

/* ─── Simple text ─── */

export async function sendText(to: string, text: string) {
  return send({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  });
}

/* ─── Reply buttons (max 3) ─── */

type ReplyButton = { id: string; title: string };

export async function sendButtons(
  to: string,
  bodyText: string,
  buttons: ReplyButton[],
  headerText?: string
) {
  const action: any = {
    buttons: buttons.slice(0, 3).map((b) => ({
      type: "reply",
      reply: { id: b.id, title: b.title.slice(0, 20) },
    })),
  };

  const message: any = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action,
    },
  };

  if (headerText) {
    message.interactive.header = { type: "text", text: headerText };
  }

  return send(message);
}

/* ─── List message (max 10 rows per section, 10 sections) ─── */

type ListRow = { id: string; title: string; description?: string };
type ListSection = { title: string; rows: ListRow[] };

export async function sendList(
  to: string,
  bodyText: string,
  buttonLabel: string,
  sections: ListSection[],
  headerText?: string
) {
  const message: any = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonLabel.slice(0, 20),
        sections: sections.map((s) => ({
          title: s.title.slice(0, 24),
          rows: s.rows.slice(0, 10).map((r) => ({
            id: r.id.slice(0, 200),
            title: r.title.slice(0, 24),
            description: r.description?.slice(0, 72),
          })),
        })),
      },
    },
  };

  if (headerText) {
    message.interactive.header = { type: "text", text: headerText };
  }

  return send(message);
}

/* ─── Single product message (from catalog) ─── */

export async function sendProduct(
  to: string,
  catalogId: string,
  productRetailerId: string,
  bodyText?: string
) {
  return send({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "product",
      body: bodyText ? { text: bodyText } : undefined,
      action: {
        catalog_id: catalogId,
        product_retailer_id: productRetailerId,
      },
    },
  });
}

/* ─── Multi-product message (from catalog) ─── */

type ProductSection = {
  title: string;
  productRetailerIds: string[];
};

export async function sendProductList(
  to: string,
  catalogId: string,
  headerText: string,
  bodyText: string,
  sections: ProductSection[]
) {
  return send({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "product_list",
      header: { type: "text", text: headerText },
      body: { text: bodyText },
      action: {
        catalog_id: catalogId,
        sections: sections.map((s) => ({
          title: s.title.slice(0, 24),
          product_items: s.productRetailerIds.map((id) => ({
            product_retailer_id: id,
          })),
        })),
      },
    },
  });
}

/* ─── Mark message as read ─── */

export async function markRead(messageId: string) {
  return send({
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}
