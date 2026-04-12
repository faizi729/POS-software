import crypto from "crypto";

export function randomResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}
