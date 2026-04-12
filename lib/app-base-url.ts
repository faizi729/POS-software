/** Public site URL for links in emails (reset password, etc.). */
export function getAppBaseUrl(): string {
  return (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}
