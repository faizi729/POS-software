/**
 * Guest messaging. Providers are optional: with no env keys everything is a
 * silent no-op and a booking never blocks on a message.
 *
 * WhatsApp Cloud API env: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, optional
 * WHATSAPP_API_VERSION (default v20.0). SMS env: SMS_API_URL, SMS_API_KEY,
 * SMS_SENDER.
 */
export type MessageKind =
  | "booking_confirmed"
  | "pre_arrival"
  | "payment_received"
  | "checkout_thanks";

const TEMPLATES: Record<MessageKind, (vars: Record<string, string>) => string> = {
  booking_confirmed: (v) =>
    `${v.hotel}: your booking ${v.reference ?? ""} is confirmed for ${v.dates ?? ""}. Reply here for anything.`,
  pre_arrival: (v) =>
    `${v.hotel}: see you on ${v.checkIn ?? ""}. Check-in from ${v.checkInTime ?? "14:00"}.`,
  payment_received: (v) =>
    `${v.hotel}: received ${v.amount ?? ""}. Thank you.`,
  checkout_thanks: (v) => `${v.hotel}: thanks for staying with us. Safe travels.`
};

export function messagingConfigured(): boolean {
  return Boolean(
    (process.env.WHATSAPP_TOKEN || "").trim() && (process.env.WHATSAPP_PHONE_ID || "").trim()
  ) || Boolean((process.env.SMS_API_URL || "").trim() && (process.env.SMS_API_KEY || "").trim());
}

async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  const token = (process.env.WHATSAPP_TOKEN || "").trim();
  const phoneId = (process.env.WHATSAPP_PHONE_ID || "").trim();
  const version = (process.env.WHATSAPP_API_VERSION || "v20.0").trim();
  if (!token || !phoneId) return false;

  const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/[^\d]/g, ""),
      type: "text",
      text: { body }
    }),
    cache: "no-store"
  });
  return response.ok;
}

async function sendSms(to: string, body: string): Promise<boolean> {
  const url = (process.env.SMS_API_URL || "").trim();
  const key = (process.env.SMS_API_KEY || "").trim();
  if (!url || !key) return false;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ sender: process.env.SMS_SENDER || "HOTEL", to, message: body }),
    cache: "no-store"
  });
  return response.ok;
}

/**
 * Fire-and-forget guest message. Never throws, never blocks a booking.
 * Returns false when no provider is configured or the send failed.
 */
export async function notifyGuest(params: {
  kind: MessageKind;
  to?: string | null;
  vars?: Record<string, string>;
}): Promise<boolean> {
  const to = (params.to || "").trim();
  if (!to || !messagingConfigured()) return false;

  const body = TEMPLATES[params.kind](params.vars ?? {});
  try {
    if (await sendWhatsApp(to, body)) return true;
    return await sendSms(to, body);
  } catch {
    return false;
  }
}
