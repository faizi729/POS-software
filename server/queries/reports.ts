import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Order, Payment } from "@/models";

/* ─────────────────────── helpers ─────────────────────── */

function oid(id: string) {
  return new Types.ObjectId(id);
}

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // "2026-04-03" (local day)
}

function monthKey(d: Date) {
  const m = d.getMonth() + 1;
  return `${d.getFullYear()}-${m < 10 ? `0${m}` : m}`; // "2026-04"
}

/* ─────────────────────── SALES REPORT ─────────────────────── */

export type SalesReportResult = {
  totalRevenue: number;
  totalTax: number;
  orderCount: number;
  cancelledCount: number;
  avgOrderValue: number;
  discountTotal: number;
  dailySales: { date: string; revenue: number; orders: number; tax: number }[];
  channelBreakdown: { channel: string; revenue: number; orders: number }[];
  paymentBreakdown: { method: string; total: number; count: number }[];
};

export async function getSalesReport(params: {
  restaurantId: string;
  startDate: Date;
  endDate: Date;
  paymentMethod?: string;
}): Promise<SalesReportResult> {
  await connectToDatabase();
  const rid = oid(params.restaurantId);

  // ── fetch orders in range ──
  const orders = await Order.find({
    restaurantId: rid,
    createdAt: { $gte: params.startDate, $lte: params.endDate }
  })
    .select({
      status: 1,
      type: 1,
      pricing: 1,
      createdAt: 1
    })
    .lean();

  // ── optionally filter by payment method ──
  let filteredOrders = orders;
  if (params.paymentMethod && params.paymentMethod !== "all") {
    const payments = await Payment.find({
      restaurantId: rid,
      method: params.paymentMethod,
      status: "completed",
      paidAt: { $gte: params.startDate, $lte: params.endDate }
    })
      .select({ orderId: 1 })
      .lean();
    const paidIds = new Set(payments.map((p) => p.orderId.toString()));
    filteredOrders = orders.filter((o) => paidIds.has((o as any)._id.toString()));
  }

  const completed = filteredOrders.filter((o) => o.status !== "cancelled");
  const cancelled = filteredOrders.filter((o) => o.status === "cancelled");

  const totalRevenue = completed.reduce((s, o) => s + (o.pricing?.grandTotal ?? 0), 0);
  const totalTax = completed.reduce((s, o) => s + (o.pricing?.tax ?? 0), 0);
  const discountTotal = completed.reduce((s, o) => s + (o.pricing?.discount ?? 0), 0);
  const orderCount = completed.length;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  // ── daily sales ──
  const dailyMap = new Map<string, { date: string; revenue: number; orders: number; tax: number }>();
  for (const o of completed) {
    const dk = dayKey(o.createdAt as unknown as Date);
    const e = dailyMap.get(dk) ?? { date: dk, revenue: 0, orders: 0, tax: 0 };
    e.revenue += o.pricing?.grandTotal ?? 0;
    e.orders += 1;
    e.tax += o.pricing?.tax ?? 0;
    dailyMap.set(dk, e);
  }

  // ── channel (dine_in / takeaway) ──
  const channelMap = new Map<string, { channel: string; revenue: number; orders: number }>();
  for (const o of completed) {
    const ch = (o.type as string) ?? "dine_in";
    const e = channelMap.get(ch) ?? { channel: ch, revenue: 0, orders: 0 };
    e.revenue += o.pricing?.grandTotal ?? 0;
    e.orders += 1;
    channelMap.set(ch, e);
  }

  // ── payment method breakdown (via aggregation) ──
  const paymentAgg = await Payment.aggregate([
    {
      $match: {
        restaurantId: rid,
        status: "completed",
        paidAt: { $gte: params.startDate, $lte: params.endDate }
      }
    },
    { $group: { _id: "$method", total: { $sum: "$amount" }, count: { $sum: 1 } } }
  ]);

  return {
    totalRevenue,
    totalTax,
    orderCount,
    cancelledCount: cancelled.length,
    avgOrderValue,
    discountTotal,
    dailySales: [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    channelBreakdown: [...channelMap.values()],
    paymentBreakdown: paymentAgg.map((p) => ({ method: p._id, total: p.total, count: p.count }))
  };
}

/* ─────────────────────── TAX REPORT ─────────────────────── */

export type TaxMonthRow = {
  month: string; // "2026-04"
  label: string; // "Apr 2026"
  totalSales: number;
  taxableAmount: number;
  taxPercent: number;
  totalTax: number;
  orderCount: number;
};

export type TaxReportResult = {
  months: TaxMonthRow[];
  grandTotalSales: number;
  grandTotalTax: number;
};

export async function getTaxReport(params: {
  restaurantId: string;
  year?: number;
}): Promise<TaxReportResult> {
  await connectToDatabase();
  const rid = oid(params.restaurantId);

  const year = params.year ?? new Date().getFullYear();
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  const orders = await Order.find({
    restaurantId: rid,
    status: { $ne: "cancelled" },
    createdAt: { $gte: startDate, $lte: endDate }
  })
    .select({ pricing: 1, createdAt: 1 })
    .lean();

  const monthMap = new Map<string, TaxMonthRow>();

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (const o of orders) {
    const d = o.createdAt as unknown as Date;
    const mk = monthKey(d);
    const existing = monthMap.get(mk) ?? {
      month: mk,
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      totalSales: 0,
      taxableAmount: 0,
      taxPercent: 0,
      totalTax: 0,
      orderCount: 0
    };
    existing.totalSales += o.pricing?.grandTotal ?? 0;
    existing.taxableAmount += o.pricing?.subtotal ?? 0;
    existing.totalTax += o.pricing?.tax ?? 0;
    existing.orderCount += 1;
    monthMap.set(mk, existing);
  }

  const months = [...monthMap.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({
      ...m,
      taxPercent: m.taxableAmount > 0 ? Number(((m.totalTax / m.taxableAmount) * 100).toFixed(2)) : 0
    }));

  return {
    months,
    grandTotalSales: months.reduce((s, m) => s + m.totalSales, 0),
    grandTotalTax: months.reduce((s, m) => s + m.totalTax, 0)
  };
}

/* ─────────────────────── ITEM PERFORMANCE ─────────────────────── */

export type ItemPerformanceRow = {
  name: string;
  qtySold: number;
  revenue: number;
  avgPrice: number;
};

export type ItemPerformanceResult = {
  items: ItemPerformanceRow[];
  totalQty: number;
  totalRevenue: number;
};

export async function getItemPerformance(params: {
  restaurantId: string;
  startDate: Date;
  endDate: Date;
  sort?: "qty" | "revenue";
}): Promise<ItemPerformanceResult> {
  await connectToDatabase();
  const rid = oid(params.restaurantId);

  const orders = await Order.find({
    restaurantId: rid,
    status: { $ne: "cancelled" },
    createdAt: { $gte: params.startDate, $lte: params.endDate }
  })
    .select({ items: 1 })
    .lean();

  const itemMap = new Map<string, ItemPerformanceRow>();

  for (const o of orders) {
    for (const item of o.items) {
      const name = item.nameSnapshot;
      const e = itemMap.get(name) ?? { name, qtySold: 0, revenue: 0, avgPrice: 0 };
      e.qtySold += item.quantity;
      e.revenue += item.lineTotal;
      itemMap.set(name, e);
    }
  }

  const sortField = params.sort === "revenue" ? "revenue" : "qtySold";
  const items = [...itemMap.values()]
    .map((i) => ({ ...i, avgPrice: i.qtySold > 0 ? i.revenue / i.qtySold : 0 }))
    .sort((a, b) => b[sortField] - a[sortField]);

  return {
    items,
    totalQty: items.reduce((s, i) => s + i.qtySold, 0),
    totalRevenue: items.reduce((s, i) => s + i.revenue, 0)
  };
}

/* ─────────────────────── HOURLY HEATMAP ─────────────────────── */

export type HeatmapCell = {
  date: string;   // "2026-04-01"
  hour: number;   // 0-23
  totalSales: number;
  orderCount: number;
};

export type HeatmapResult = {
  cells: HeatmapCell[];
  dates: string[];   // sorted unique dates
  maxSales: number;
  maxOrders: number;
};

export async function getHeatmapData(params: {
  restaurantId: string;
  days?: number; // default 7
}): Promise<HeatmapResult> {
  await connectToDatabase();
  const rid = oid(params.restaurantId);
  const days = params.days ?? 7;

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const orders = await Order.find({
    restaurantId: rid,
    status: { $ne: "cancelled" },
    createdAt: { $gte: startDate, $lte: endDate }
  })
    .select({ createdAt: 1, "pricing.grandTotal": 1, pricing: 1 })
    .lean();

  // bucket: "date|hour" → cell
  const map = new Map<string, HeatmapCell>();
  const dateSet = new Set<string>();

  for (const o of orders) {
    const d = new Date(o.createdAt as unknown as Date);
    const dk = dayKey(d);
    const hr = d.getHours();
    const key = `${dk}|${hr}`;
    dateSet.add(dk);

    const existing = map.get(key) ?? { date: dk, hour: hr, totalSales: 0, orderCount: 0 };
    existing.totalSales += o.pricing?.grandTotal ?? 0;
    existing.orderCount += 1;
    map.set(key, existing);
  }

  const cells = [...map.values()];
  const dates = [...dateSet].sort();
  const maxSales = cells.reduce((m, c) => Math.max(m, c.totalSales), 0);
  const maxOrders = cells.reduce((m, c) => Math.max(m, c.orderCount), 0);

  return { cells, dates, maxSales, maxOrders };
}

/* ─────────────────────── SMART INSIGHTS ─────────────────────── */

export type Insight = {
  type: "warning" | "success" | "info";
  message: string;
  priority: "high" | "medium" | "low";
};

export type InsightsResult = {
  insights: Insight[];
  generatedAt: string;
};

// simple in-memory cache (5 min TTL)
let insightsCache: { key: string; data: InsightsResult; ts: number } | null = null;
const INSIGHTS_TTL = 5 * 60 * 1000; // 5 minutes

export async function getSmartInsights(params: {
  restaurantId: string;
}): Promise<InsightsResult> {
  const cacheKey = params.restaurantId;
  if (insightsCache && insightsCache.key === cacheKey && Date.now() - insightsCache.ts < INSIGHTS_TTL) {
    return insightsCache.data;
  }

  await connectToDatabase();
  const rid = oid(params.restaurantId);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayStart.getTime() - 1);

  // Fetch today + yesterday orders in one go
  const recentOrders = await Order.find({
    restaurantId: rid,
    createdAt: { $gte: yesterdayStart, $lte: todayEnd }
  })
    .select({ createdAt: 1, status: 1, type: 1, pricing: 1, items: 1 })
    .lean();

  const todayOrders = recentOrders.filter(
    (o) => new Date(o.createdAt as unknown as Date) >= todayStart
  );
  const yesterdayOrders = recentOrders.filter(
    (o) => {
      const d = new Date(o.createdAt as unknown as Date);
      return d >= yesterdayStart && d <= yesterdayEnd;
    }
  );

  const todayCompleted = todayOrders.filter((o) => o.status !== "cancelled");
  const yesterdayCompleted = yesterdayOrders.filter((o) => o.status !== "cancelled");

  const todaySales = todayCompleted.reduce((s, o) => s + (o.pricing?.grandTotal ?? 0), 0);
  const yesterdaySales = yesterdayCompleted.reduce((s, o) => s + (o.pricing?.grandTotal ?? 0), 0);
  const todayOrderCount = todayCompleted.length;
  const yesterdayOrderCount = yesterdayCompleted.length;
  const todayCancelled = todayOrders.filter((o) => o.status === "cancelled").length;

  const insights: Insight[] = [];

  // ─── 1. Sales Drop / Growth Detection ───
  if (yesterdaySales > 0) {
    const changePercent = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
    if (changePercent <= -10) {
      insights.push({
        type: "warning",
        message: `Sales dropped ${Math.abs(Math.round(changePercent))}% compared to yesterday (${formatINR(yesterdaySales)} → ${formatINR(todaySales)})`,
        priority: changePercent <= -25 ? "high" : "medium"
      });
    } else if (changePercent >= 15) {
      insights.push({
        type: "success",
        message: `Sales grew ${Math.round(changePercent)}% compared to yesterday! (${formatINR(yesterdaySales)} → ${formatINR(todaySales)})`,
        priority: "medium"
      });
    }
  }

  // ─── 2. Order Count Drop ───
  if (yesterdayOrderCount > 0) {
    const orderChange = ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100;
    if (orderChange <= -20) {
      insights.push({
        type: "warning",
        message: `Order count dropped ${Math.abs(Math.round(orderChange))}% today (${yesterdayOrderCount} → ${todayOrderCount} orders)`,
        priority: "high"
      });
    }
  }

  // ─── 3. Top Item Detection ───
  const itemCount = new Map<string, number>();
  for (const o of todayCompleted) {
    for (const item of o.items) {
      const name = item.nameSnapshot;
      itemCount.set(name, (itemCount.get(name) ?? 0) + item.quantity);
    }
  }
  if (itemCount.size > 0) {
    let topItem = "";
    let topQty = 0;
    for (const [name, qty] of itemCount) {
      if (qty > topQty) {
        topItem = name;
        topQty = qty;
      }
    }
    insights.push({
      type: "success",
      message: `${topItem} is your top-selling item today (${topQty} sold)`,
      priority: "medium"
    });
  }

  // ─── 4. High Cancellation Alert ───
  if (todayOrders.length > 0) {
    const cancellationRate = (todayCancelled / todayOrders.length) * 100;
    if (cancellationRate > 5) {
      insights.push({
        type: "warning",
        message: `High cancellation rate today: ${Math.round(cancellationRate)}% (${todayCancelled} of ${todayOrders.length} orders cancelled)`,
        priority: "high"
      });
    }
  }

  // ─── 5. Channel Shift ───
  const dineInCount = todayCompleted.filter((o) => o.type === "dine_in").length;
  const takeawayCount = todayCompleted.filter((o) => o.type === "takeaway").length;
  if (todayCompleted.length > 3 && takeawayCount > dineInCount) {
    insights.push({
      type: "info",
      message: `Takeaway orders (${takeawayCount}) are exceeding dine-in (${dineInCount}) today`,
      priority: "low"
    });
  }

  // ─── 6. Peak Hour Insight ───
  const hourlyMap = new Map<number, number>();
  for (const o of todayCompleted) {
    const hr = new Date(o.createdAt as unknown as Date).getHours();
    hourlyMap.set(hr, (hourlyMap.get(hr) ?? 0) + 1);
  }
  if (hourlyMap.size > 0) {
    let peakHour = 0;
    let peakCount = 0;
    for (const [hr, cnt] of hourlyMap) {
      if (cnt > peakCount) {
        peakHour = hr;
        peakCount = cnt;
      }
    }
    const ampm = peakHour >= 12 ? "PM" : "AM";
    const hr12 = peakHour === 0 ? 12 : peakHour > 12 ? peakHour - 12 : peakHour;
    insights.push({
      type: "info",
      message: `Peak hour today: ${hr12} ${ampm} (${peakCount} orders)`,
      priority: "low"
    });
  }

  // ─── 7. No orders yet today ───
  if (todayOrderCount === 0 && now.getHours() >= 10) {
    insights.push({
      type: "warning",
      message: "No orders received today yet!",
      priority: "high"
    });
  }

  // Sort: high → medium → low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const result: InsightsResult = {
    insights,
    generatedAt: now.toISOString()
  };

  // Cache it
  insightsCache = { key: cacheKey, data: result, ts: Date.now() };
  return result;
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
