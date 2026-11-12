import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { ModuleLauncher } from "@/components/layout/module-launcher";
import { getSession } from "@/lib/auth/get-session";
import { loadEnabledModules } from "@/lib/modules";
import { getDashboardData } from "@/server/queries/dashboard";

export default async function DashboardPage() {
  const session = await getSession();
  const [data, modules] = await Promise.all([
    getDashboardData(session.restaurantId),
    loadEnabledModules(session.restaurantId)
  ]);

  return (
    <div className="space-y-6">
      <ModuleLauncher modules={modules} />
      <DashboardOverview
        stats={data.stats}
        topItems={data.topItems}
        paymentMix={data.paymentMix}
        recentOrders={data.recentOrders}
        lastToken={data.lastToken}
        hourlySales={data.hourlySales}
        openingTime={data.openingTime}
        closingTime={data.closingTime}
        allTimeRevenue={data.allTimeRevenue}
        totalOrders={data.totalOrders}
      />
    </div>
  );
}
