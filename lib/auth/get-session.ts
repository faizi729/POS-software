export type AppSession = {
  userId: string;
  restaurantId: string;
  role: "owner" | "manager" | "cashier" | "staff";
  name: string;
};

export async function getSession(): Promise<AppSession> {
  // Prefer real session from JWT cookie when present
  try {
    const { cookies } = await import("next/headers");
    const { verifyAuthJwt } = await import("./jwt");
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      const payload = await verifyAuthJwt(token);
      return {
        userId: payload.userId,
        restaurantId: payload.restaurantId,
        role: payload.role,
        name: payload.name
      };
    }
  } catch {
    // fall through to seed for local/demo
  }

  const { ensureSeedData } = await import("@/server/bootstrap/seed");
  const { userId, restaurantId } = await ensureSeedData();

  return {
    userId,
    restaurantId,
    role: "owner",
    name: "Alex Kim"
  };
}
