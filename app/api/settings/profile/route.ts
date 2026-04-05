import { NextRequest } from "next/server";

import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models";

export async function GET() {
  try {
    const session = await getSession();
    await connectToDatabase();
    const restaurant = await Restaurant.findById(session.restaurantId).lean();

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
      serviceChargeEnabled: restaurant.settings?.serviceChargeEnabled ?? false
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
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

    const restaurant = await Restaurant.findByIdAndUpdate(
      session.restaurantId,
      { $set: update },
      { new: true }
    ).lean();

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
      serviceChargeEnabled: restaurant.settings?.serviceChargeEnabled ?? false
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
