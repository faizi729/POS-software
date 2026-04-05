import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getSession } from "@/lib/auth/get-session";
import { getDashboardData } from "@/server/queries/dashboard";

export default async function DashboardPage() {
  const session = await getSession();
  const data = await getDashboardData(session.restaurantId);

  return (
    <DashboardOverview
      stats={data.stats}
      topItems={data.topItems}
      paymentMix={data.paymentMix}
      recentOrders={data.recentOrders}
      lastToken={data.lastToken}
      hourlySales={data.hourlySales}
      allTimeRevenue={data.allTimeRevenue}
      totalOrders={data.totalOrders}
    />
  );
}
