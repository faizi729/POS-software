import { SignJWT, jwtVerify } from "jose";

import type { PlatformRole } from "./platform-role";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET env var");
  return encoder.encode(secret);
}

export type SuperAdminJwtPayload = {
  platformUserId: string;
  role: PlatformRole;
  email: string;
  name: string;
};

export async function signSuperAdminJwt(payload: SuperAdminJwtPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret());
}

export async function verifySuperAdminJwt(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as SuperAdminJwtPayload;
}

