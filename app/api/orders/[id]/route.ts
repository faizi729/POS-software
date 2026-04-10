import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
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
    .optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        nameSnapshot: z.string().min(1),
        priceSnapshot: z.number().min(0),
        quantity: z.number().int().min(1),
        notes: z.string().optional(),
        lineTotal: z.number().min(0)
      })
    )
    .optional(),
  pricing: z
    .object({
      subtotal: z.number().min(0),
      tax: z.number().min(0),
      serviceCharge: z.number().min(0),
      discount: z.number().min(0),
      grandTotal: z.number().min(0)
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
    const { id } = await context.params;
    // RBAC: cashier/staff can read orders, but only within tenant
    // NOTE: withAuth enforces session + tenant/subdomain match.
    const order = await withAuth<RouteContext>(["owner", "manager", "cashier", "staff"], async (_req, context, session) => {
      const { id } = await context.params;
      return ok(await getOrderById(id, session.restaurantId));
    })(_, context);

    return order;
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager", "cashier"], async (request, context, session) => {
    const { id } = await context.params;
    const body = await request.json();
    const payload = orderUpdateSchema.parse(body);
    const order = await updateOrder(id, session.restaurantId, payload);
    return ok(order);
  })(request, context);
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager"], async (_req, context, session) => {
    const { id } = await context.params;
    const result = await deleteOrder(id, session.restaurantId);
    return ok(result);
  })(_, context);
}
