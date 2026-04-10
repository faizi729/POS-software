export type SuperAdminSession = {
  platformUserId: string;
  role: "super_admin";
  email: string;
  name: string;
};

export async function getSuperAdminSession(): Promise<SuperAdminSession> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("sa_token")?.value;
  if (!token) throw new Error("Unauthorized");

  const { verifySuperAdminJwt } = await import("./super-admin-jwt");
  const payload = await verifySuperAdminJwt(token);
  return {
    platformUserId: payload.platformUserId,
    role: payload.role,
    email: payload.email,
    name: payload.name
  };
}

