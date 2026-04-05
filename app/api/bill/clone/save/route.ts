import { NextRequest } from "next/server";
import { z } from "zod";

import { ok, handleRouteError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";
import { ReceiptTemplate } from "@/models";

const saveSchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(1).default("Default Receipt"),
  structured: z.any(),
  layout: z.any()
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const payload = saveSchema.parse(body);

    const doc = await ReceiptTemplate.create({
      restaurantId: payload.restaurantId,
      name: payload.name,
      structured: payload.structured,
      layout: payload.layout
    });

    return ok({ id: String(doc._id) });
  } catch (error) {
    return handleRouteError(error);
  }
}

