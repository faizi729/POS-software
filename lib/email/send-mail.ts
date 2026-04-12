import nodemailer from "nodemailer";

export function isMailConfigured(): boolean {
  const host = (process.env.SMTP_HOST || "").trim();
  const from = (process.env.SMTP_FROM || "").trim();
  return Boolean(host && from);
}

export type SendMailResult = { ok: true; skipped?: false } | { ok: true; skipped: true };

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

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port,
    secure,
    auth: user ? { user, pass } : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM!.trim(),
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html ?? `<pre style="font-family:system-ui">${escapeHtml(params.text)}</pre>`
  });

  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
