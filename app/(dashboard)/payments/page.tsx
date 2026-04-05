import { PaymentsPageClient } from "@/components/payments/payments-page-client";
import { getSession } from "@/lib/auth/get-session";
import { getRestaurantBundle } from "@/server/repositories/mongo-repository";

export default async function PaymentsPage() {
  const session = await getSession();
  const data = await getRestaurantBundle(session.restaurantId);

  return <PaymentsPageClient payments={data.payments} orders={data.orders} />;
}
