import { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Table } from "@/models";

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "cashier", "staff"], async (_req, _ctx, session) => {
      await connectToDatabase();
      const tables = await Table.find({ restaurantId: session.restaurantId })
        .populate({
          path: "currentOrderId",
          select: "orderNumber tokenNumber status paymentStatus pricing.grandTotal"
        })
        .sort({ number: 1 })
        .lean();

      const serialized = tables.map((table) => ({
        id: String(table._id),
        number: table.number,
        label: table.label ?? "",
        capacity: Number(table.capacity ?? 4),
        status: table.status,
        section: table.section ?? "",
        currentOrderId: table.currentOrderId
          ? {
              id: String(table.currentOrderId._id),
              orderNumber: table.currentOrderId.orderNumber,
              tokenNumber: table.currentOrderId.tokenNumber ?? 0,
              status: table.currentOrderId.status,
              paymentStatus: table.currentOrderId.paymentStatus,
              pricing: {
                grandTotal: Number(table.currentOrderId?.pricing?.grandTotal ?? 0)
              }
            }
          : null,
        position: table.position
          ? {
              x: typeof table.position.x === "number" ? table.position.x : 0,
              y: typeof table.position.y === "number" ? table.position.y : 0
            }
          : null,
        createdAt: table.createdAt?.toISOString?.() ?? undefined,
        updatedAt: table.updatedAt?.toISOString?.() ?? undefined
      }));

      return ok(serialized);
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "cashier"], async (req, _ctx, session) => {
      await connectToDatabase();
      const body = (await req.json()) as {
        number: string;
        label?: string;
        capacity?: number;
        section?: string;
      };

      const table = await Table.create({
        restaurantId: session.restaurantId,
        number: String(body.number ?? "").trim(),
        label: String(body.label ?? "").trim() || undefined,
        capacity: Number(body.capacity ?? 4),
        section: String(body.section ?? "").trim() || undefined
      });

      return ok({
        id: String(table._id),
        number: table.number,
        label: table.label ?? "",
        capacity: Number(table.capacity ?? 4),
        status: table.status,
        section: table.section ?? "",
        currentOrderId: null,
        position: table.position ?? null,
        createdAt: table.createdAt?.toISOString?.(),
        updatedAt: table.updatedAt?.toISOString?.()
      });
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}
