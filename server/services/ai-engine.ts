import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Order, Payment, Customer, Ingredient, MenuItem } from "@/models";

function oid(id: string) {
  return new Types.ObjectId(id);
}

export type AISuggestion = {
  id: string;
  category: "revenue" | "inventory" | "customers" | "operations";
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  message: string;
  action?: string;
};

/**
 * AI Decision Engine — Rule-based analysis.
 * Reads from orders, inventory, and customers to generate actionable suggestions.
 */
export async function generateSuggestions(restaurantId: string): Promise<AISuggestion[]> {
  await connectToDatabase();

  const rid = oid(restaurantId);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    recentOrders,
    allIngredients,
    allCustomers,
    allMenuItems,
    recentPayments
  ] = await Promise.all([
    Order.find({
      restaurantId: rid,
      createdAt: { $gte: thirtyDaysAgo }
    }).lean(),
    Ingredient.find({ restaurantId: rid, isActive: true }).lean(),
    Customer.find({ restaurantId: rid, isActive: true }).lean(),
    MenuItem.find({ restaurantId: rid, isActive: true }).lean(),
    Payment.find({
      restaurantId: rid,
      status: "completed",
      paidAt: { $gte: thirtyDaysAgo }
    }).lean()
  ]);

  const suggestions: AISuggestion[] = [];
  let idCounter = 0;
  const nextId = () => `ai-${++idCounter}`;

  // ═══════════════════════════════════════════
  // 1. INVENTORY ANALYSIS
  // ═══════════════════════════════════════════

  // 1a. Critical low stock (at or below 0)
  const outOfStock = allIngredients.filter((i) => i.currentStock <= 0);
  if (outOfStock.length > 0) {
    suggestions.push({
      id: nextId(),
      category: "inventory",
      severity: "critical",
      title: "Out of Stock Items",
      message: `${outOfStock.length} ingredient(s) are completely out of stock: ${outOfStock.map((i) => i.name).join(", ")}. This may affect menu availability.`,
      action: "Restock immediately via Inventory → Ingredients"
    });
  }

  // 1b. Low stock warnings
  const lowStock = allIngredients.filter(
    (i) => i.currentStock > 0 && i.currentStock <= i.reorderLevel
  );
  if (lowStock.length > 0) {
    suggestions.push({
      id: nextId(),
      category: "inventory",
      severity: "warning",
      title: "Low Stock Alert",
      message: `${lowStock.length} ingredient(s) below reorder level: ${lowStock.map((i) => `${i.name} (${i.currentStock} ${i.unit} left)`).slice(0, 5).join(", ")}${lowStock.length > 5 ? ` and ${lowStock.length - 5} more` : ""}.`,
      action: "Review and restock via Inventory"
    });
  }

  // ═══════════════════════════════════════════
  // 2. REVENUE ANALYSIS
  // ═══════════════════════════════════════════

  // 2a. Low-margin / low-performing items
  const completedOrders = recentOrders.filter((o) => o.status !== "cancelled");
  const itemRevenue = new Map<string, { name: string; revenue: number; qty: number }>();
  for (const o of completedOrders) {
    for (const item of o.items) {
      const key = item.menuItemId.toString();
      const existing = itemRevenue.get(key) ?? { name: item.nameSnapshot, revenue: 0, qty: 0 };
      existing.revenue += item.lineTotal;
      existing.qty += item.quantity;
      itemRevenue.set(key, existing);
    }
  }

  // Find menu items that haven't been ordered in last 30 days
  const orderedIds = new Set(itemRevenue.keys());
  const neverOrdered = allMenuItems.filter(
    (mi) => mi.isAvailable && !orderedIds.has(mi._id.toString())
  );

  if (neverOrdered.length > 0) {
    suggestions.push({
      id: nextId(),
      category: "revenue",
      severity: "warning",
      title: "Unordered Menu Items (30 days)",
      message: `${neverOrdered.length} available menu item(s) had zero orders in the last 30 days: ${neverOrdered.map((i) => i.name).slice(0, 5).join(", ")}${neverOrdered.length > 5 ? ` and ${neverOrdered.length - 5} more` : ""}. Consider removing or repositioning them.`,
      action: "Review menu items in Menu section"
    });
  }

  // 2b. Top performers
  const sortedByRevenue = [...itemRevenue.values()].sort((a, b) => b.revenue - a.revenue);
  if (sortedByRevenue.length >= 3) {
    const top3 = sortedByRevenue.slice(0, 3);
    suggestions.push({
      id: nextId(),
      category: "revenue",
      severity: "positive",
      title: "Top Revenue Items (30 days)",
      message: `Your best performers: ${top3.map((i) => `${i.name} (₹${i.revenue.toLocaleString("en-IN")} from ${i.qty} orders)`).join(", ")}. Consider promoting these further.`
    });
  }

  // 2c. Revenue trend (week over week)
  const thisWeekOrders = completedOrders.filter(
    (o) => new Date((o as any).createdAt) >= sevenDaysAgo
  );
  const lastWeekStart = new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekOrders = completedOrders.filter((o) => {
    const d = new Date((o as any).createdAt);
    return d >= lastWeekStart && d < sevenDaysAgo;
  });

  const thisWeekRevenue = thisWeekOrders.reduce((s, o) => s + (o.pricing?.grandTotal ?? 0), 0);
  const lastWeekRevenue = lastWeekOrders.reduce((s, o) => s + (o.pricing?.grandTotal ?? 0), 0);

  if (lastWeekRevenue > 0) {
    const change = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
    if (change <= -15) {
      suggestions.push({
        id: nextId(),
        category: "revenue",
        severity: "warning",
        title: "Revenue Declining",
        message: `Revenue dropped ${Math.abs(Math.round(change))}% this week vs last week (₹${thisWeekRevenue.toLocaleString("en-IN")} vs ₹${lastWeekRevenue.toLocaleString("en-IN")}). Check for operational issues or run a promotion.`,
        action: "Review Reports for detailed trends"
      });
    } else if (change >= 15) {
      suggestions.push({
        id: nextId(),
        category: "revenue",
        severity: "positive",
        title: "Revenue Growing",
        message: `Revenue grew ${Math.round(change)}% this week vs last week (₹${thisWeekRevenue.toLocaleString("en-IN")} vs ₹${lastWeekRevenue.toLocaleString("en-IN")}). Great momentum!`
      });
    }
  }

  // 2d. Average order value analysis
  if (thisWeekOrders.length > 0 && lastWeekOrders.length > 0) {
    const thisWeekAOV = thisWeekRevenue / thisWeekOrders.length;
    const lastWeekAOV = lastWeekRevenue / lastWeekOrders.length;
    if (lastWeekAOV > 0) {
      const aovChange = ((thisWeekAOV - lastWeekAOV) / lastWeekAOV) * 100;
      if (aovChange <= -10) {
        suggestions.push({
          id: nextId(),
          category: "revenue",
          severity: "info",
          title: "Average Order Value Dipping",
          message: `AOV dropped ${Math.abs(Math.round(aovChange))}% (₹${Math.round(thisWeekAOV)} vs ₹${Math.round(lastWeekAOV)}). Consider upselling or adding combos.`,
          action: "Add combos or increase suggested items"
        });
      }
    }
  }

  // ═══════════════════════════════════════════
  // 3. CUSTOMER ANALYSIS
  // ═══════════════════════════════════════════

  // 3a. Inactive customers (no visit in 60+ days)
  const inactiveCustomers = allCustomers.filter((c) => {
    if (!c.lastVisitAt) return false;
    return c.lastVisitAt < sixtyDaysAgo;
  });

  if (inactiveCustomers.length > 0) {
    const highValue = inactiveCustomers.filter((c) => c.totalSpent > 2000);
    suggestions.push({
      id: nextId(),
      category: "customers",
      severity: highValue.length > 0 ? "warning" : "info",
      title: "Inactive Customers",
      message: `${inactiveCustomers.length} customer(s) haven't visited in 60+ days.${highValue.length > 0 ? ` ${highValue.length} of them are high-value (spent ₹2000+). Consider a re-engagement campaign.` : ""}`,
      action: "Send WhatsApp messages via CRM"
    });
  }

  // 3b. Loyalty redemption opportunity
  const readyToRedeem = allCustomers.filter((c) => c.loyaltyPoints >= 100);
  if (readyToRedeem.length > 0) {
    suggestions.push({
      id: nextId(),
      category: "customers",
      severity: "info",
      title: "Loyalty Rewards Ready",
      message: `${readyToRedeem.length} customer(s) have 100+ loyalty points ready to redeem. Remind them to claim their reward!`,
      action: "Review in CRM → Customers"
    });
  }

  // 3c. New customer trend
  const newThisWeek = allCustomers.filter(
    (c) => c.firstVisitAt && c.firstVisitAt >= sevenDaysAgo
  );
  if (newThisWeek.length > 0) {
    suggestions.push({
      id: nextId(),
      category: "customers",
      severity: "positive",
      title: "New Customers This Week",
      message: `${newThisWeek.length} new customer(s) added this week. Welcome campaigns can improve retention.`
    });
  }

  // ═══════════════════════════════════════════
  // 4. OPERATIONS ANALYSIS
  // ═══════════════════════════════════════════

  // 4a. Cancellation rate
  const thisWeekCancelled = recentOrders.filter(
    (o) => o.status === "cancelled" && new Date((o as any).createdAt) >= sevenDaysAgo
  );
  const thisWeekTotal = recentOrders.filter(
    (o) => new Date((o as any).createdAt) >= sevenDaysAgo
  );

  if (thisWeekTotal.length > 0) {
    const cancelRate = (thisWeekCancelled.length / thisWeekTotal.length) * 100;
    if (cancelRate > 5) {
      suggestions.push({
        id: nextId(),
        category: "operations",
        severity: cancelRate > 15 ? "critical" : "warning",
        title: "High Cancellation Rate",
        message: `${Math.round(cancelRate)}% of orders were cancelled this week (${thisWeekCancelled.length} of ${thisWeekTotal.length}). Investigate causes — kitchen delays? Stock issues?`,
        action: "Check order history for patterns"
      });
    }
  }

  // 4b. Payment collection
  const unpaidOrders = recentOrders.filter(
    (o) =>
      o.status === "completed" &&
      o.paymentStatus === "unpaid" &&
      new Date((o as any).createdAt) >= sevenDaysAgo
  );
  if (unpaidOrders.length > 0) {
    const unpaidTotal = unpaidOrders.reduce((s, o) => s + (o.pricing?.grandTotal ?? 0), 0);
    suggestions.push({
      id: nextId(),
      category: "operations",
      severity: "warning",
      title: "Uncollected Payments",
      message: `${unpaidOrders.length} completed order(s) worth ₹${unpaidTotal.toLocaleString("en-IN")} haven't been paid this week.`,
      action: "Review unpaid orders in Orders section"
    });
  }

  // 4c. Peak hours insight
  const hourMap = new Map<number, number>();
  for (const o of thisWeekOrders) {
    const hr = new Date((o as any).createdAt).getHours();
    hourMap.set(hr, (hourMap.get(hr) ?? 0) + 1);
  }
  if (hourMap.size > 0) {
    let peakHour = 0;
    let peakCount = 0;
    for (const [hr, cnt] of hourMap) {
      if (cnt > peakCount) {
        peakHour = hr;
        peakCount = cnt;
      }
    }
    const ampm = peakHour >= 12 ? "PM" : "AM";
    const hr12 = peakHour === 0 ? 12 : peakHour > 12 ? peakHour - 12 : peakHour;
    suggestions.push({
      id: nextId(),
      category: "operations",
      severity: "info",
      title: "Peak Hour This Week",
      message: `Your busiest hour this week was ${hr12}:00 ${ampm} with ${peakCount} orders. Ensure staffing is optimized for this slot.`
    });
  }

  // Sort: critical > warning > info > positive
  const severityOrder = { critical: 0, warning: 1, info: 2, positive: 3 };
  suggestions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return suggestions;
}
