import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models";

export async function getRestaurantWaConfig(restaurantId: string) {
  await connectToDatabase();
  const restaurant = await Restaurant.findOne({ _id: restaurantId }).select({ settings: 1, integrations: 1 }).lean();
  const wa: any =
    (restaurant as any)?.integrations?.whatsapp ??
    (restaurant as any)?.settings?.whatsapp ??
    {};

  return {
    token: wa.token ?? "",
    phoneNumberId: wa.phoneNumberId ?? "",
    verifyToken: wa.verifyToken ?? "",
    catalogId: wa.catalogId ?? ""
  };
}

