import { MenuOperatingEnginePage } from "@/components/menu/menu-operating-engine-page";
import { getSession } from "@/lib/auth/get-session";
import { getRestaurantBundle } from "@/server/repositories/mongo-repository";
import { getMenuBuilderWorkspace } from "@/server/repositories/menu-builder-repository";

export default async function MenuPage() {
  const session = await getSession();
  const [data, builder] = await Promise.all([
    getRestaurantBundle(session.restaurantId),
    getMenuBuilderWorkspace(session.restaurantId)
  ]);

  return <MenuOperatingEnginePage categories={data.categories} items={data.menuItems} builder={builder} />;
}
