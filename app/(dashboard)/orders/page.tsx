import { OrderScreenLive } from "@/components/orders/order-screen-live";
import { getSession } from "@/lib/auth/get-session";
import { getRestaurantBundle } from "@/server/repositories/mongo-repository";

export default async function OrdersPage() {
  const session = await getSession();
  const data = await getRestaurantBundle(session.restaurantId);

  return (
    <OrderScreenLive
      categories={data.categories}
      menuCatalog={data.menuItems}
      orders={data.orders}
      restaurant={data.restaurant}
    />
  );
}
