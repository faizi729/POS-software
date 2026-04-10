import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { orderSchema } from "@/lib/validators/order";
import { Order, Restaurant } from "@/models";
import { createOrder, getRestaurantBundle } from "@/server/repositories/mongo-repository";
import { generateOrderNumber } from "@/server/services/order-number";
import { generateDailyToken } from "@/server/services/daily-token";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return withAuth<any>(["owner", "manager", "cashier", "staff"], async (req, _ctx, session) => {
    await connectToDatabase();

    const url = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
    const status = (url.searchParams.get("status") ?? "").trim();

    const query: any = { restaurantId: session.restaurantId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .select({
        orderNumber: 1,
        tokenNumber: 1,
        channel: 1,
        type: 1,
        status: 1,
        tableNo: 1,
        customer: 1,
        items: 1,
        pricing: 1,
        paymentStatus: 1,
        createdAt: 1,
        updatedAt: 1
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const serialized = orders.map((order: any) => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      tokenNumber: order.tokenNumber ?? 0,
      channel: order.channel,
      type: order.type,
      status: order.status,
      paymentStatus: order.paymentStatus,
      tableNo: order.tableNo ?? "",
      customer: { name: order.customer?.name ?? "", phone: order.customer?.phone ?? "" },
      items: (order.items ?? []).map((it: any) => ({
        nameSnapshot: it.nameSnapshot,
        priceSnapshot: it.priceSnapshot,
        quantity: it.quantity,
        notes: it.notes ?? "",
        lineTotal: it.lineTotal
      })),
      pricing: order.pricing,
      createdAt: order.createdAt?.toISOString?.() ?? undefined,
      updatedAt: order.updatedAt?.toISOString?.() ?? undefined
    }));

    const res = ok({ restaurantId: session.restaurantId, orders: serialized });
    (res as NextResponse).headers.set("Cache-Control", "private, no-store, max-age=0");
    return res;
  })(request, {} as any);
}

export async function POST(request: NextRequest) {
  return withAuth<any>(["owner", "manager", "cashier"], async (request, _ctx, session) => {
    const body = await request.json();

    await connectToDatabase();
    const restaurant = await Restaurant.findOne({ _id: session.restaurantId }).select("settings.orderPrefix").lean();
    const prefix = restaurant?.settings?.orderPrefix || "POS";

    const tokenNumber = await generateDailyToken(session.restaurantId);

    const payload = orderSchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      orderNumber: generateOrderNumber(prefix),
      createdBy: session.userId
    });

    const order = await createOrder({ ...payload, tokenNumber });
    return ok(order, { status: 201 });
  })(request, {} as any);
}
