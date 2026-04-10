import { NextRequest } from "next/server";
import { z } from "zod";

import { ok, handleRouteError } from "@/lib/api/response";
import { assertRole, requireSession } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models";

const schema = z.object({
  token: z.string().trim().optional(),
  phoneNumberId: z.string().trim().optional(),
  verifyToken: z.string().trim().optional(),
  catalogId: z.string().trim().optional()
});

export async function GET() {
  try {
    const session = await requireSession();
    assertRole(session, ["owner", "manager"]);
    await connectToDatabase();
    const restaurant = await Restaurant.findOne({ _id: session.restaurantId })
      .select({ integrations: 1, settings: 1 })
      .lean();
    if (!restaurant) return ok({ error: "Restaurant not found." }, { status: 404 });

    const wa: any =
      (restaurant as any).integrations?.whatsapp ??
      (restaurant as any).settings?.whatsapp ??
      {};
    return ok({
      token: wa.token ?? "",
      phoneNumberId: wa.phoneNumberId ?? "",
      verifyToken: wa.verifyToken ?? "",
      catalogId: wa.catalogId ?? ""
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    assertRole(session, ["owner", "manager"]);
    await connectToDatabase();
    const body = await request.json();
    const payload = schema.parse(body);

    const update: any = {};
    if (typeof payload.token === "string") update["integrations.whatsapp.token"] = payload.token;
    if (typeof payload.phoneNumberId === "string") update["integrations.whatsapp.phoneNumberId"] = payload.phoneNumberId;
    if (typeof payload.verifyToken === "string") update["integrations.whatsapp.verifyToken"] = payload.verifyToken;
    if (typeof payload.catalogId === "string") update["integrations.whatsapp.catalogId"] = payload.catalogId;

    const restaurant = await Restaurant.findOneAndUpdate({ _id: session.restaurantId }, { $set: update }, { new: true })
      .select({ integrations: 1, settings: 1 })
      .lean();
    if (!restaurant) return ok({ error: "Restaurant not found." }, { status: 404 });

    const wa: any =
      (restaurant as any).integrations?.whatsapp ??
      (restaurant as any).settings?.whatsapp ??
      {};
    return ok({
      token: wa.token ?? "",
      phoneNumberId: wa.phoneNumberId ?? "",
      verifyToken: wa.verifyToken ?? "",
      catalogId: wa.catalogId ?? ""
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

