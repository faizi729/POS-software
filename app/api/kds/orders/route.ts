import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models";
import { Types } from "mongoose";
import { NextResponse } from "next/server";

/**
 * GET /api/kds/orders
 * Returns active kitchen orders (placed, preparing, ready)
 * Used by KDS display for real-time polling
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    return withAuth<any>(["owner", "manager", "staff"], async (_req, _ctx, session) => {
      const restaurantId = new Types.ObjectId(session.restaurantId);

      // KDS is polled frequently; keep payload small + indexed sort + bounded limits.
      // Use the existing index: { restaurantId: 1, status: 1, createdAt: -1 }
      const orders = await Order.find({
        restaurantId,
        status: { $in: ["placed", "preparing", "ready"] }
      })
        .select({
          orderNumber: 1,
          tokenNumber: 1,
          channel: 1,
          type: 1,
          status: 1,
          tableNo: 1,
          customer: 1,
          items: 1,
          createdAt: 1,
          updatedAt: 1
        })
        .sort({ createdAt: -1 })
        .limit(180)
        .lean();

      const serialized = orders.map((order) => ({
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        tokenNumber: order.tokenNumber ?? 0,
        channel: order.channel,
        type: order.type,
        status: order.status,
        tableNo: order.tableNo ?? "",
        customer: {
          name: order.customer?.name ?? "",
          phone: order.customer?.phone ?? ""
        },
        items: order.items.map((item) => ({
          id: item._id?.toString(),
          name: item.nameSnapshot,
          quantity: item.quantity,
          notes: item.notes ?? ""
        })),
        createdAt: (order.createdAt as unknown as Date)?.toISOString(),
        updatedAt: (order.updatedAt as unknown as Date)?.toISOString()
      }));

      // Keep each column bounded so a busy kitchen doesn't degrade latency.
      // (Client can still paginate/scroll later if needed.)
      const placed = serialized.filter((o) => o.status === "placed").slice(0, 60);
      const preparing = serialized.filter((o) => o.status === "preparing").slice(0, 60);
      const ready = serialized.filter((o) => o.status === "ready").slice(0, 60);

      const res = ok({
        placed,
        preparing,
        ready,
        total: placed.length + preparing.length + ready.length,
        timestamp: new Date().toISOString()
      });
      // Never cache KDS responses at the edge/browser.
      (res as NextResponse).headers.set("Cache-Control", "private, no-store, max-age=0");
      return res;
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
