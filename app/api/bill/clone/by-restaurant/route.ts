import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";
import { ReceiptTemplate } from "@/models";
import { withAuth } from "@/lib/auth/with-auth";

export async function GET(request: NextRequest) {
  return withAuth<any>(["owner", "manager", "cashier", "staff"], async (_req, _ctx, session) => {
    await connectToDatabase();
    const doc = await ReceiptTemplate.findOne({ restaurantId: session.restaurantId })
      .sort({ updatedAt: -1 })
      .lean();
    if (!doc) {
      return ok({ error: "Not found" }, { status: 404 });
    }
    return ok({
      id: String(doc._id),
      restaurantId: String(doc.restaurantId),
      name: doc.name,
      structured: doc.structured,
      layout: doc.layout,
      updatedAt: doc.updatedAt
    });
  })(request, {} as any);
}

