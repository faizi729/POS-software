import { NextRequest } from "next/server";
import { ok, fail, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { getCustomerDetail, redeemLoyaltyPoints, generateWhatsAppLink, WHATSAPP_TEMPLATES } from "@/server/services/crm-service";
import { connectToDatabase } from "@/lib/db/connect";
import { Customer } from "@/models";
import { Types } from "mongoose";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/crm/customers/[id]
 * Get customer detail with loyalty history and recent orders
 */
export async function GET(_: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager"], async (_req, context, session) => {
    const { id } = await context.params;
    const detail = await getCustomerDetail(id, session.restaurantId);

    const whatsappLinks = {
      missYou: generateWhatsAppLink(
        detail.phone,
        WHATSAPP_TEMPLATES.missYou(detail.name, "our restaurant")
      ),
      loyaltyReward:
        detail.loyaltyPoints >= 100
          ? generateWhatsAppLink(
              detail.phone,
              WHATSAPP_TEMPLATES.loyaltyReward(detail.name, "our restaurant")
            )
          : null
    };

    return ok({ ...detail, whatsappLinks });
  })(_ as any, context);
}

const customerUpdateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500).optional()
});

const redeemSchema = z.object({
  action: z.literal("redeem"),
  points: z.number().positive(),
  description: z.string().max(200).optional()
});

/**
 * PATCH /api/crm/customers/[id]
 * Update customer or redeem loyalty points
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  return withAuth<RouteContext>(["owner", "manager"], async (request, context, session) => {
    const { id } = await context.params;
    const body = await request.json();

    if (body.action === "redeem") {
      const { points, description } = redeemSchema.parse(body);
      const result = await redeemLoyaltyPoints({
        customerId: id,
        restaurantId: session.restaurantId,
        points,
        description
      });
      return ok(result);
    }

    const payload = customerUpdateSchema.parse(body);
    await connectToDatabase();

    const customer = await Customer.findOne({
      _id: new Types.ObjectId(id),
      restaurantId: new Types.ObjectId(session.restaurantId)
    });

    if (!customer) return fail("Customer not found.", 404);

    if (payload.name) customer.name = payload.name;
    if (payload.email !== undefined) customer.email = payload.email || undefined;
    if (payload.tags) customer.tags = payload.tags;
    if (payload.notes !== undefined) customer.notes = payload.notes;

    await customer.save();

    return ok({
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone
    });
  })(request, context);
}
