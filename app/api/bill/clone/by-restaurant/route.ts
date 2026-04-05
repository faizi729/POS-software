import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";
import { ReceiptTemplate } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    if (!restaurantId) {
      return ok({ error: "restaurantId is required" }, { status: 400 });
    }
    const doc = await ReceiptTemplate.findOne({ restaurantId }).sort({ updatedAt: -1 }).lean();
    if (!doc) {
      return ok({ error: "Not found" }, { status: 404 });
    }
    return ok({ id: String(doc._id), restaurantId: String(doc.restaurantId), name: doc.name, structured: doc.structured, layout: doc.layout, updatedAt: doc.updatedAt });
  } catch (error) {
    return handleRouteError(error);
  }
}

