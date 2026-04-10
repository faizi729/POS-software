/**
 * WhatsApp sessions API — view active sessions from the dashboard.
 */

import { ok, handleRouteError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { WaSession } from "@/models";

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager"], async (_req, _ctx, session) => {
      await connectToDatabase();
      const sessions = await WaSession.find({ restaurantId: session.restaurantId })
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
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
