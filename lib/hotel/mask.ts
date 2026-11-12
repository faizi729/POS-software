/** Only owner/manager see full ID numbers and guest contact details. */
export function canSeePii(role: string): boolean {
  return role === "owner" || role === "manager";
}

/** Keeps the last 4 characters, masks the rest: "ABCD1234Z" → "*****234Z". */
export function maskIdNumber(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.length <= 4) return "*".repeat(raw.length);
  return `${"*".repeat(Math.min(12, raw.length - 4))}${raw.slice(-4)}`;
}

/** Masks a phone but keeps the last 4 digits: "9800000001" → "******0001". */
export function maskPhone(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.length <= 4) return "*".repeat(raw.length);
  return `${"*".repeat(Math.min(10, raw.length - 4))}${raw.slice(-4)}`;
}
