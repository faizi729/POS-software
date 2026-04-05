import { SettingsPageClient } from "@/components/settings/settings-page";
import { getSession } from "@/lib/auth/get-session";
import { getRestaurantBundle } from "@/server/repositories/mongo-repository";

export default async function SettingsPage() {
  const session = await getSession();
  const data = await getRestaurantBundle(session.restaurantId);

  return <SettingsPageClient restaurant={data.restaurant} />;
}

