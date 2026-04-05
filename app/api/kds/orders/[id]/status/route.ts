import { NextRequest } from "next/server";
import { ok, fail, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models";
import { Types } from "mongoose";
import { z } from "zod";

const statusUpdateSchema = z.object({
  status: z.enum(["placed", "preparing", "ready", "completed"])
});

// Valid status transitions for KDS
const VALID_TRANSITIONS: Record<string, string[]> = {
  placed: ["preparing"],
  preparing: ["ready"],
  ready: ["completed"]
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/kds/orders/[id]/status
 * Update order status from KDS (kitchen staff)
 * Enforces valid status transitions
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    const { id } = await context.params;
    const body = await request.json();
    const { status: newStatus } = statusUpdateSchema.parse(body);

    await connectToDatabase();

    const order = await Order.findOne({
      _id: new Types.ObjectId(id),
      restaurantId: new Types.ObjectId(session.restaurantId)
    });

    if (!order) {
      return fail("Order not found.", 404);
    }

    // Validate transition
    const validNext = VALID_TRANSITIONS[order.status as string];
    if (!validNext || !validNext.includes(newStatus)) {
      return fail(
        `Cannot transition from "${order.status}" to "${newStatus}". Valid: ${validNext?.join(", ") ?? "none"}`,
        400
      );
    }

    order.status = newStatus as any;

    if (newStatus === "completed") {
      order.completedAt = new Date();
    }

    await order.save();

    return ok({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      updatedAt: (order.updatedAt as unknown as Date)?.toISOString()
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
