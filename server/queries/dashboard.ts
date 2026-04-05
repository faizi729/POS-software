import { getRestaurantBundle } from "@/server/repositories/mongo-repository";
import { formatCurrency } from "@/lib/utils/format";

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Build hourly sales array (indices 0-23, each = total revenue in that hour) */
function hourlyRevenue(payments: Array<{ amount: number; paidAt?: string; status: string }>) {
  const hours = new Array(24).fill(0);
  for (const p of payments) {
    if (p.status !== "completed" || !p.paidAt) continue;
    const d = new Date(p.paidAt);
    if (!isToday(p.paidAt)) continue;
    hours[d.getHours()] += p.amount;
  }
  return hours;
}

export async function getDashboardData(restaurantId: string) {
  const { orders, payments, menuItems } = await getRestaurantBundle(restaurantId);

  // ---- TODAY filters ----
  const todayOrders = orders.filter((o) => isToday(o.createdAt));
  const todayPayments = payments.filter((p) => isToday(p.paidAt ?? p.createdAt));

  const revenueToday = todayPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const ordersToday = todayOrders.length;
  const avgTicket = ordersToday ? revenueToday / ordersToday : 0;
  const paidOrders = todayOrders.filter((o) => o.paymentStatus === "paid").length;

  // ---- All-time totals for comparison ----
  const revenueAllTime = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  // ---- Payment mix (today) ----
  const paymentMixMap = new Map<string, number>();
  for (const p of todayPayments) {
    if (p.status !== "completed") continue;
    paymentMixMap.set(p.method, (paymentMixMap.get(p.method) ?? 0) + p.amount);
  }

  // ---- Top items (today) ----
  const itemCountMap = new Map<string, number>();
  for (const order of todayOrders) {
    for (const item of order.items) {
      itemCountMap.set(item.nameSnapshot, (itemCountMap.get(item.nameSnapshot) ?? 0) + item.quantity);
    }
  }

  const topItems = [...itemCountMap.entries()]
    .map(([name, sold]) => ({ name, sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const paymentMix = [...paymentMixMap.entries()].map(([method, amount]) => ({
    method,
    amount,
    share: revenueToday ? Math.round((amount / revenueToday) * 100) : 0
  }));

  // ---- Today's last token ----
  const todayTokens = todayOrders.map((o) => (o as any).tokenNumber ?? 0).filter((t: number) => t > 0);
  const lastToken = todayTokens.length ? Math.max(...todayTokens) : 0;

  // ---- Hourly sales chart ----
  const hourlySales = hourlyRevenue(payments as any);

  return {
    stats: [
      {
        title: "Revenue today",
        value: formatCurrency(revenueToday),
        delta: `${todayPayments.filter((p) => p.status === "completed").length} payments`,
        icon: "wallet"
      },
      {
        title: "Orders today",
        value: String(ordersToday),
        delta: `${todayOrders.filter((o) => o.status !== "cancelled").length} active`,
        icon: "shopping-bag"
      },
      {
        title: "Average ticket",
        value: formatCurrency(avgTicket),
        delta: `${menuItems.length} menu items`,
        icon: "arrow-up-right"
      },
      {
        title: "Paid orders",
        value: `${ordersToday ? Math.round((paidOrders / ordersToday) * 100) : 0}%`,
        delta: `${paidOrders} / ${ordersToday}`,
        icon: "credit-card"
      }
    ],
    topItems,
    paymentMix,
    recentOrders: todayOrders.slice(0, 5),
    lastToken,
    hourlySales,
    allTimeRevenue: revenueAllTime,
    totalOrders: orders.length
  };
}
