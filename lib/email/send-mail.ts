import nodemailer from "nodemailer";

export function isMailConfigured(): boolean {
  const host = (process.env.SMTP_HOST || "").trim();
  const from = (process.env.SMTP_FROM || "").trim();
  return Boolean(host && from);
}

export type SendMailResult = { ok: true; skipped?: false } | { ok: true; skipped: true };

const SMTP_TIMEOUT_MS = 25_000;

/**
 * Sends email via SMTP. If SMTP_HOST / SMTP_FROM are missing, logs and returns skipped (no throw).
 */
export async function sendMail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<SendMailResult> {
  if (!isMailConfigured()) {
    console.warn("[mail] SMTP not configured (set SMTP_HOST, SMTP_FROM); skipping:", params.subject, "→", params.to);
    return { ok: true, skipped: true };
  }

  const port = Number(process.env.SMTP_PORT || "587");
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
  const tlsFlag = (process.env.SMTP_REQUIRE_TLS || "").trim().toLowerCase();
  const requireTLS =
    tlsFlag === "true" || (tlsFlag !== "false" && !secure && port === 587);
  const smtpDebug = String(process.env.SMTP_DEBUG || "").trim() === "1";

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port,
    secure,
    auth: user ? { user, pass } : undefined,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: 15_000,
    socketTimeout: SMTP_TIMEOUT_MS,
    // Most providers use STARTTLS on 587; set SMTP_REQUIRE_TLS=false for odd servers.
    ...(requireTLS ? { requireTLS: true } : {}),
    ...(smtpDebug ? { debug: true, logger: true } : {})
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM!.trim(),
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html ?? `<pre style="font-family:system-ui">${escapeHtml(params.text)}</pre>`
    });
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; response?: string; responseCode?: number };
    console.error("[mail] send failed:", e?.message || err, {
      code: e?.code,
      responseCode: e?.responseCode,
      response: e?.response
    });
    throw err;
  }

  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
