import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { paymentSchema } from "@/lib/validators/order";
import { connectToDatabase } from "@/lib/db/connect";
import { Payment } from "@/models";
import { createPayment } from "@/server/repositories/mongo-repository";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return withAuth<any>(["owner", "manager", "cashier"], async (req, _ctx, session) => {
    await connectToDatabase();
    const url = new URL(req.url);
    const limit = Math.min(300, Math.max(1, Number(url.searchParams.get("limit") ?? 120)));
    const status = (url.searchParams.get("status") ?? "").trim();

    const query: any = { restaurantId: session.restaurantId };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .select({
        orderId: 1,
        amount: 1,
        method: 1,
        status: 1,
        reference: 1,
        receivedBy: 1,
        paidAt: 1,
        createdAt: 1,
        updatedAt: 1
      })
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const serialized = payments.map((p: any) => ({
      id: p._id.toString(),
      restaurantId: String(p.restaurantId),
      orderId: String(p.orderId),
      amount: p.amount,
      method: p.method,
      status: p.status,
      reference: p.reference ?? "",
      receivedBy: String(p.receivedBy),
      paidAt: p.paidAt?.toISOString?.(),
      createdAt: p.createdAt?.toISOString?.(),
      updatedAt: p.updatedAt?.toISOString?.()
    }));

    const res = ok({ restaurantId: session.restaurantId, payments: serialized });
    (res as NextResponse).headers.set("Cache-Control", "private, no-store, max-age=0");
    return res;
  })(request, {} as any);
}

export async function POST(request: NextRequest) {
  return withAuth<any>(["owner", "manager", "cashier"], async (request, _ctx, session) => {
    const body = await request.json();
    const payload = paymentSchema.parse({
      ...body,
      restaurantId: session.restaurantId,
      receivedBy: session.userId
    });
    const payment = await createPayment({ ...payload, paidAt: new Date().toISOString() });
    return ok(payment, { status: 201 });
  })(request, {} as any);
}
