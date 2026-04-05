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
  role: "owner" | "manager" | "cashier" | "staff";
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

