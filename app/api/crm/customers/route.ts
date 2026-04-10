import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { getCustomers } from "@/server/services/crm-service";
import { connectToDatabase } from "@/lib/db/connect";
import { Customer } from "@/models";
import { Types } from "mongoose";
import { z } from "zod";

const customerCreateSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  phone: z.string().min(1).max(30).trim(),
  email: z.string().email().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500).optional()
});

/**
 * GET /api/crm/customers
 * List customers with optional search and sort
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    return withAuth<any>(["owner", "manager"], async (_req, _ctx, session) => {
      const customers = await getCustomers(session.restaurantId, {
        search: searchParams.get("search") ?? undefined,
        sort: searchParams.get("sort") ?? undefined,
        limit: Number(searchParams.get("limit")) || 100
      });

      return ok(customers);
    })(request, {} as any);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/crm/customers
 * Manually add a customer
 */
export async function POST(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (request, _ctx, session) => {
    const body = await request.json();
    const payload = customerCreateSchema.parse(body);

    await connectToDatabase();

    const customer = await Customer.create({
      restaurantId: new Types.ObjectId(session.restaurantId),
      name: payload.name,
      phone: payload.phone,
      email: payload.email || undefined,
      tags: payload.tags ?? [],
      notes: payload.notes,
      firstVisitAt: new Date(),
      lastVisitAt: new Date()
    });

    return ok(
      {
        id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone
      },
      { status: 201 }
    );
  })(request, {} as any);
}
