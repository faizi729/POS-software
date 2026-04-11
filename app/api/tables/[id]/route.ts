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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    return withAuth<RouteContext>(["owner", "manager", "cashier"], async (req, ctx, session) => {
      await connectToDatabase();
      const { id } = await ctx.params;
      const body = (await req.json()) as {
        status?: "available" | "occupied" | "reserved" | "cleaning";
        currentOrderId?: string | null;
        label?: string;
        capacity?: number;
        section?: string;
        position?: { x: number; y: number } | null;
        number?: string;
      };

      const update: Record<string, unknown> = {};
      if (typeof body.number === "string") update.number = body.number.trim();
      if (typeof body.status === "string") update.status = body.status;
      if (typeof body.label === "string") update.label = body.label.trim() || undefined;
      if (typeof body.capacity === "number") update.capacity = body.capacity;
      if (typeof body.section === "string") update.section = body.section.trim() || undefined;
      if (typeof body.currentOrderId !== "undefined") {
        update.currentOrderId = body.currentOrderId || undefined;
      }
      if (typeof body.position !== "undefined") {
        update.position = body.position ?? undefined;
      }

      const table = await Table.findOneAndUpdate(
        { _id: id, restaurantId: session.restaurantId },
        { $set: update },
        { new: true }
      )
        .populate({
          path: "currentOrderId",
          select: "orderNumber tokenNumber status paymentStatus pricing.grandTotal"
        })
        .lean();

      if (!table) {
        throw new Error("Table not found.");
      }
      type PopulatedOrderLean = {
        _id: unknown;
        orderNumber: string;
        tokenNumber?: number;
        status: string;
        paymentStatus: string;
        pricing?: { grandTotal?: number };
      };
      const co = table.currentOrderId;
      const current =
        co && typeof co === "object" && "orderNumber" in co
          ? (co as unknown as PopulatedOrderLean)
          : null;

      return ok({
        id: String(table._id),
        number: table.number,
        label: table.label ?? "",
        capacity: Number(table.capacity ?? 4),
        status: table.status,
        section: table.section ?? "",
        currentOrderId: current
          ? {
              id: String(current._id as { toString(): string } | string),
              orderNumber: current.orderNumber,
              tokenNumber: current.tokenNumber ?? 0,
              status: current.status,
              paymentStatus: current.paymentStatus,
              pricing: {
                grandTotal: Number(current?.pricing?.grandTotal ?? 0)
              }
            }
          : null,
        position: table.position ?? null,
        createdAt: table.createdAt?.toISOString?.() ?? undefined,
        updatedAt: table.updatedAt?.toISOString?.() ?? undefined
      });
    })(request, context);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    return withAuth<RouteContext>(["owner", "manager", "cashier"], async (_req, ctx, session) => {
      await connectToDatabase();
      const { id } = await ctx.params;

      const deleted = await Table.findOneAndDelete({ _id: id, restaurantId: session.restaurantId }).lean();
      if (!deleted) {
        throw new Error("Table not found.");
      }

      return ok({ id });
    })(request, context);
  } catch (error) {
    return handleRouteError(error);
  }
}
