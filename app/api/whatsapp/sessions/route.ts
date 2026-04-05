/**
 * WhatsApp sessions API — view active sessions from the dashboard.
 */

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { connectToDatabase } from "@/lib/db/connect";
import { WaSession } from "@/models";

export async function GET() {
  try {
    const session = await getSession();
    await connectToDatabase();

    const sessions = await WaSession.find({
      restaurantId: session.restaurantId,
    })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    const data = sessions.map((s) => ({
      id: s._id.toString(),
      phone: s.phone,
      state: s.state,
      cartItemCount: s.cart?.items?.length ?? 0,
      cartTotal: s.cart?.total ?? 0,
      customerName: s.customerName ?? "",
      paymentStatus: s.paymentStatus ?? "none",
      orderId: s.orderId?.toString() ?? null,
      updatedAt: (s as any).updatedAt?.toISOString(),
    }));

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
