import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models";
import { Types } from "mongoose";

/**
 * GET /api/kds/orders
 * Returns active kitchen orders (placed, preparing, ready)
 * Used by KDS display for real-time polling
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    await connectToDatabase();

    const restaurantId = new Types.ObjectId(session.restaurantId);

    // Get orders that are in kitchen-relevant statuses
    const orders = await Order.find({
      restaurantId,
      status: { $in: ["placed", "preparing", "ready"] }
    })
      .sort({ createdAt: 1 }) // oldest first (FIFO)
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

    // Organize by status
    const placed = serialized.filter((o) => o.status === "placed");
    const preparing = serialized.filter((o) => o.status === "preparing");
    const ready = serialized.filter((o) => o.status === "ready");

    return ok({
      placed,
      preparing,
      ready,
      total: serialized.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
