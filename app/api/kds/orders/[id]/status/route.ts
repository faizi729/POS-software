import { NextRequest } from "next/server";
import { ok, fail, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
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
    return withAuth<RouteContext>(["owner", "manager", "staff"], async (request, context, session) => {
      const { id } = await context.params;
      const body = await request.json();
      const { status: newStatus } = statusUpdateSchema.parse(body);

      await connectToDatabase();

      // Single round-trip update with transition enforcement in the query.
      const restaurantId = new Types.ObjectId(session.restaurantId);
      const orderId = new Types.ObjectId(id);

      // Determine allowed previous statuses for the requested newStatus.
      const allowedPrev = Object.entries(VALID_TRANSITIONS)
        .filter(([, next]) => next.includes(newStatus))
        .map(([prev]) => prev);

      const updated = await Order.findOneAndUpdate(
        {
          _id: orderId,
          restaurantId,
          status: { $in: allowedPrev }
        },
        {
          $set: { status: newStatus },
          ...(newStatus === "completed" ? { $currentDate: { completedAt: true } } : {})
        },
        { new: true }
      )
        .select({ orderNumber: 1, status: 1, updatedAt: 1 })
        .lean();

      if (!updated) {
        // Either missing order OR invalid transition (most common: stale UI)
        return fail("Order not found or invalid status transition.", 404);
      }

      return ok({
        id: updated._id.toString(),
        orderNumber: updated.orderNumber,
        status: updated.status,
        updatedAt: (updated.updatedAt as unknown as Date)?.toISOString()
      });
    })(request, context);
  } catch (error) {
    return handleRouteError(error);
  }
}
