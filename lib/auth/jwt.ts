import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET env var");
  }
  return encoder.encode(secret);
}

export type JwtPayload = {
  userId: string;
  restaurantId: string;
  role: "owner" | "manager" | "cashier" | "staff" | "front_desk" | "housekeeping";
  name: string;
};

export async function signAuthJwt(payload: JwtPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
  return token;
}

export async function verifyAuthJwt(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as JwtPayload;
}

/** Short-lived token after password check, before email OTP is verified. */
export async function signPendingTwoFactorJwt(payload: JwtPayload) {
  const token = await new SignJWT({
    userId: payload.userId,
    restaurantId: payload.restaurantId,
    role: payload.role,
    name: payload.name,
    typ: "2fa_pending"
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSecret());
  return token;
}

export async function verifyPendingTwoFactorJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  const p = payload as Record<string, unknown>;
  if (p.typ !== "2fa_pending") {
    throw new Error("Invalid two-factor token");
  }
  return {
    userId: String(p.userId),
    restaurantId: String(p.restaurantId),
    role: p.role as JwtPayload["role"],
    name: String(p.name ?? "")
  };
}

