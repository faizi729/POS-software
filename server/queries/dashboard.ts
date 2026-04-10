import { formatCurrency } from "@/lib/utils/format";
import { connectToDatabase } from "@/lib/db/connect";
import { Order, Payment, Restaurant, MenuItem } from "@/models";
import { Types } from "mongoose";

function todayRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function getDashboardData(restaurantId: string) {
  await connectToDatabase();
  const rid = new Types.ObjectId(restaurantId);
  const { start, end } = todayRange();

  const [
    restaurant,
    menuItemCount,
    revenueTodayAgg,
    paymentsTodayCountAgg,
    ordersTodayAgg,
    paidOrdersAgg,
    revenueAllTimeAgg,
    totalOrders,
    topItemsAgg,
    paymentMixAgg,
    hourlyAgg,
    recentOrders
  ] = await Promise.all([
    Restaurant.findById(rid).select({ "settings.openingTime": 1, "settings.closingTime": 1 }).lean(),
    MenuItem.countDocuments({ restaurantId: rid, isActive: true }),
    Payment.aggregate([
      { $match: { restaurantId: rid, status: "completed", paidAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Payment.aggregate([
      { $match: { restaurantId: rid, status: "completed", paidAt: { $gte: start, $lt: end } } },
      { $count: "count" }
    ]),
    Order.aggregate([
      { $match: { restaurantId: rid, createdAt: { $gte: start, $lt: end } } },
      { $count: "count" }
    ]),
    Order.aggregate([
      { $match: { restaurantId: rid, createdAt: { $gte: start, $lt: end }, paymentStatus: "paid" } },
      { $count: "count" }
    ]),
    Payment.aggregate([
      { $match: { restaurantId: rid, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Order.countDocuments({ restaurantId: rid }),
    Order.aggregate([
      { $match: { restaurantId: rid, createdAt: { $gte: start, $lt: end } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.nameSnapshot", sold: { $sum: "$items.quantity" } } },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, name: "$_id", sold: 1 } }
    ]),
    Payment.aggregate([
      { $match: { restaurantId: rid, status: "completed", paidAt: { $gte: start, $lt: end } } },
      { $group: { _id: "$method", amount: { $sum: "$amount" } } },
      { $sort: { amount: -1 } },
      { $project: { _id: 0, method: "$_id", amount: 1 } }
    ]),
    Payment.aggregate([
      { $match: { restaurantId: rid, status: "completed", paidAt: { $gte: start, $lt: end } } },
      { $project: { hour: { $hour: "$paidAt" }, amount: 1 } },
      { $group: { _id: "$hour", total: { $sum: "$amount" } } }
    ]),
    Order.find({ restaurantId: rid, createdAt: { $gte: start, $lt: end } })
      .select({ orderNumber: 1, tokenNumber: 1, status: 1, paymentStatus: 1, type: 1, tableNo: 1, createdAt: 1, pricing: 1, items: 1 })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ]);

  const revenueToday = Number(revenueTodayAgg?.[0]?.total ?? 0);
  const completedPaymentsToday = Number(paymentsTodayCountAgg?.[0]?.count ?? 0);
  const ordersToday = Number(ordersTodayAgg?.[0]?.count ?? 0);
  const paidOrders = Number(paidOrdersAgg?.[0]?.count ?? 0);
  const avgTicket = ordersToday ? revenueToday / ordersToday : 0;
  const allTimeRevenue = Number(revenueAllTimeAgg?.[0]?.total ?? 0);

  const hourlySales = new Array(24).fill(0);
  for (const row of hourlyAgg as any[]) {
    const h = Number(row?._id);
    if (Number.isFinite(h) && h >= 0 && h <= 23) hourlySales[h] = Number(row.total ?? 0);
  }

  const paymentMix = (paymentMixAgg as any[]).map((p) => ({
    method: p.method,
    amount: p.amount,
    share: revenueToday ? Math.round((p.amount / revenueToday) * 100) : 0
  }));

  const lastToken = Math.max(0, ...(recentOrders.map((o: any) => Number(o.tokenNumber ?? 0)).filter((t: number) => t > 0)));

  return {
    stats: [
      {
        title: "Revenue today",
        value: formatCurrency(revenueToday),
        delta: `${completedPaymentsToday} payments`,
        icon: "wallet"
      },
      {
        title: "Orders today",
        value: String(ordersToday),
        delta: `${ordersToday} total`,
        icon: "shopping-bag"
      },
      {
        title: "Average ticket",
        value: formatCurrency(avgTicket),
        delta: `${menuItemCount} menu items`,
        icon: "arrow-up-right"
      },
      {
        title: "Paid orders",
        value: `${ordersToday ? Math.round((paidOrders / ordersToday) * 100) : 0}%`,
        delta: `${paidOrders} / ${ordersToday}`,
        icon: "credit-card"
      }
    ],
    topItems: topItemsAgg as any[],
    paymentMix,
    recentOrders: recentOrders.map((o: any) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      tokenNumber: o.tokenNumber ?? 0,
      status: o.status,
      paymentStatus: o.paymentStatus,
      type: o.type,
      tableNo: o.tableNo ?? "",
      createdAt: o.createdAt?.toISOString?.(),
      pricing: o.pricing,
      items: (o.items ?? []).map((it: any) => ({
        nameSnapshot: it.nameSnapshot,
        quantity: it.quantity,
        lineTotal: it.lineTotal
      }))
    })),
    lastToken: Number.isFinite(lastToken) ? lastToken : 0,
    hourlySales,
    openingTime: (restaurant as any)?.settings?.openingTime ?? "09:00",
    closingTime: (restaurant as any)?.settings?.closingTime ?? "23:00",
    allTimeRevenue,
    totalOrders
  };
}
