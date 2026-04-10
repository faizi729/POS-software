import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";
import { ReceiptTemplate } from "@/models";
import { withAuth } from "@/lib/auth/with-auth";
import { Types } from "mongoose";

export async function GET(_req: NextRequest, context: any) {
  return withAuth<any>(["owner", "manager"], async (_req, context, session) => {
    await connectToDatabase();
    const id = context?.params?.id ?? "";
    if (!Types.ObjectId.isValid(id)) return ok({ error: "Invalid id" }, { status: 404 });
    const doc = await ReceiptTemplate.findOne({ _id: id, restaurantId: session.restaurantId }).lean();
    if (!doc) return ok({ error: "Not found" }, { status: 404 });
    return ok({
      id: String(doc._id),
      restaurantId: String(doc.restaurantId),
      name: doc.name,
      structured: doc.structured,
      layout: doc.layout,
      updatedAt: doc.updatedAt
    });
  })(_req, context);
}

export async function PUT(request: NextRequest, context: any) {
  return withAuth<any>(["owner", "manager"], async (request, context, session) => {
    await connectToDatabase();
    const id = context?.params?.id ?? "";
    if (!Types.ObjectId.isValid(id)) return ok({ error: "Invalid id" }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const updates: any = {};
    if (body && typeof body === "object") {
      if ("name" in body && typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
      if ("structured" in body) updates.structured = body.structured;
      if ("layout" in body) updates.layout = body.layout;
    }
    const doc = await ReceiptTemplate.findOneAndUpdate(
      { _id: id, restaurantId: session.restaurantId },
      { $set: updates },
      { new: true }
    ).lean();
    if (!doc) return ok({ error: "Not found" }, { status: 404 });
    return ok({ id: String(doc._id) });
  })(request, context);
}

