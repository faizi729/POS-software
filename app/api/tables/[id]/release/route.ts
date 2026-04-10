import { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Table } from "@/models";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    return withAuth<RouteContext>(["owner", "manager", "cashier", "staff"], async (_req, ctx, session) => {
      await connectToDatabase();
      const { id } = await ctx.params;

      const table = await Table.findOneAndUpdate(
        { _id: id, restaurantId: session.restaurantId },
        { $set: { status: "cleaning", currentOrderId: undefined } },
        { new: true }
      ).lean();

      if (!table) {
        throw new Error("Table not found.");
      }

      return ok({
        id: String(table._id),
        number: table.number,
        status: table.status,
        currentOrderId: null,
        updatedAt: table.updatedAt?.toISOString?.() ?? undefined
      });
    })(request, context);
  } catch (error) {
    return handleRouteError(error);
  }
}
