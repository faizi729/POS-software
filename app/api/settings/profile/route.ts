import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models";

export async function GET(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (_req, _ctx, session) => {
    await connectToDatabase();
    const restaurant = await Restaurant.findOne({ _id: session.restaurantId })
      .select({
        name: 1,
        slug: 1,
        contact: 1,
        currency: 1,
        timezone: 1,
        "settings.orderPrefix": 1,
        "settings.serviceChargeEnabled": 1,
        "settings.openingTime": 1,
        "settings.closingTime": 1
      })
      .lean();

    if (!restaurant) {
      return ok({ error: "Restaurant not found." }, { status: 404 });
    }

    return ok({
      name: restaurant.name,
      slug: restaurant.slug,
      phone: restaurant.contact?.phone ?? "",
      email: restaurant.contact?.email ?? "",
      address: restaurant.contact?.address ?? "",
      currency: restaurant.currency ?? "INR",
      timezone: restaurant.timezone ?? "Asia/Kolkata",
      orderPrefix: restaurant.settings?.orderPrefix ?? "POS",
      serviceChargeEnabled: restaurant.settings?.serviceChargeEnabled ?? false,
      openingTime: restaurant.settings?.openingTime ?? "09:00",
      closingTime: restaurant.settings?.closingTime ?? "23:00"
    });
  })(request, {} as any);
}

export async function PATCH(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (request, _ctx, session) => {
    await connectToDatabase();

    const body = await request.json();
    const update: Record<string, any> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      update.name = body.name.trim();
    }
    if (typeof body.phone === "string") {
      update["contact.phone"] = body.phone.trim();
    }
    if (typeof body.email === "string") {
      update["contact.email"] = body.email.trim();
    }
    if (typeof body.address === "string") {
      update["contact.address"] = body.address.trim();
    }
    if (typeof body.orderPrefix === "string") {
      update["settings.orderPrefix"] = body.orderPrefix.trim().toUpperCase() || "POS";
    }
    if (typeof body.serviceChargeEnabled === "boolean") {
      update["settings.serviceChargeEnabled"] = body.serviceChargeEnabled;
    }
    if (typeof body.openingTime === "string") {
      update["settings.openingTime"] = body.openingTime.trim();
    }
    if (typeof body.closingTime === "string") {
      update["settings.closingTime"] = body.closingTime.trim();
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      session.restaurantId,
      { $set: update },
      { new: true }
    )
      .select({
        name: 1,
        slug: 1,
        contact: 1,
        "settings.orderPrefix": 1,
        "settings.serviceChargeEnabled": 1,
        "settings.openingTime": 1,
        "settings.closingTime": 1
      })
      .lean();

    if (!restaurant) {
      return ok({ error: "Restaurant not found." }, { status: 404 });
    }

    return ok({
      name: restaurant.name,
      slug: restaurant.slug,
      phone: restaurant.contact?.phone ?? "",
      email: restaurant.contact?.email ?? "",
      address: restaurant.contact?.address ?? "",
      orderPrefix: restaurant.settings?.orderPrefix ?? "POS",
      serviceChargeEnabled: restaurant.settings?.serviceChargeEnabled ?? false,
      openingTime: restaurant.settings?.openingTime ?? "09:00",
      closingTime: restaurant.settings?.closingTime ?? "23:00"
    });
  })(request, {} as any);
}
