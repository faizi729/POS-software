import { getAppBaseUrl } from "@/lib/app-base-url";

export function buildWelcomeEmail(params: {
  restaurantName: string;
  slug: string;
  twoFactorEnabled: boolean;
}): { subject: string; text: string; html: string } {
  const base = getAppBaseUrl();
  const subject = `Your workspace “${params.restaurantName}” is ready`;
  const tfNote = params.twoFactorEnabled
    ? "Email sign-in codes (two-factor) are enabled. You will receive a code by email when you log in."
    : "Email sign-in codes are off until SMTP is configured or you enable them for your account.";
  const lines = [
    `Welcome — ${params.restaurantName} is set up.`,
    ``,
    `Workspace slug: ${params.slug}`,
    `Sign in: ${base}/login`,
    ``,
    tfNote
  ];
  const text = lines.join("\n");
  const html = `<p>Welcome — <strong>${escapeHtml(params.restaurantName)}</strong> is set up.</p>
<p>Workspace slug: <code>${escapeHtml(params.slug)}</code><br/>
<a href="${escapeHtml(`${base}/login`)}">Sign in</a></p>
<p>${escapeHtml(tfNote)}</p>`;
  return { subject, text, html };
}

export function buildLoginOtpEmail(code: string): { subject: string; text: string; html: string } {
  const subject = "Your sign-in code";
  const text = `Your sign-in code is: ${code}\n\nIt expires in 10 minutes. If you did not try to sign in, ignore this email.`;
  const html = `<p>Your sign-in code is:</p><p style="font-size:1.5rem;font-weight:700;letter-spacing:0.2em">${escapeHtml(code)}</p><p>It expires in 10 minutes.</p><p>If you did not try to sign in, ignore this email.</p>`;
  return { subject, text, html };
}

export function buildPasswordResetEmail(resetUrl: string): { subject: string; text: string; html: string } {
  const subject = "Reset your password";
  const text = `Reset your password using this link (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `<p>Reset your password using the link below (expires in 1 hour):</p><p><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p><p>If you did not request this, ignore this email.</p>`;
  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
