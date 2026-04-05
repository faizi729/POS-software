import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { ORDER_STATUSES, ORDER_TYPES, PAYMENT_ORDER_STATUSES } from "@/lib/constants/roles";
import { deleteOrder, getOrderById, updateOrder } from "@/server/repositories/mongo-repository";
import { z } from "zod";

const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_ORDER_STATUSES).optional(),
  tableNo: z.string().max(20).optional(),
  type: z.enum(ORDER_TYPES).optional(),
  customer: z
    .object({
      name: z.string().max(80).optional(),
      phone: z.string().max(30).optional()
    })
    .optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    const { id } = await context.params;
    const order = await getOrderById(id, session.restaurantId);

    return ok(order);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    const { id } = await context.params;
    const body = await request.json();
    const payload = orderUpdateSchema.parse(body);
    const order = await updateOrder(id, session.restaurantId, payload);

    return ok(order);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    const { id } = await context.params;
    const result = await deleteOrder(id, session.restaurantId);

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
