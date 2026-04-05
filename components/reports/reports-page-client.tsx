"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  CreditCard,
  Download,
  FileText,
  Flame,
  Info,
  Printer,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";

/* ─── Types ─── */

type SalesReport = {
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

type TaxReport = {
  months: {
    month: string;
    label: string;
    totalSales: number;
    taxableAmount: number;
    taxPercent: number;
    totalTax: number;
    orderCount: number;
  }[];
  grandTotalSales: number;
  grandTotalTax: number;
};

type ItemsReport = {
  items: { name: string; qtySold: number; revenue: number; avgPrice: number }[];
  totalQty: number;
  totalRevenue: number;
};

type HeatmapCell = {
  date: string;
  hour: number;
  totalSales: number;
  orderCount: number;
};

type HeatmapReport = {
  cells: HeatmapCell[];
  dates: string[];
  maxSales: number;
  maxOrders: number;
};

type Insight = {
  type: "warning" | "success" | "info";
  message: string;
  priority: "high" | "medium" | "low";
};

type InsightsReport = {
  insights: Insight[];
  generatedAt: string;
};

/* ─── Helpers ─── */

const PIE_COLORS = ["#0f766e", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function presetRange(preset: string): { start: string; end: string } {
  const now = new Date();
  const end = toDateStr(now);
  if (preset === "today") return { start: end, end };
  if (preset === "week") {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    return { start: toDateStr(s), end };
  }
  if (preset === "month") {
    return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, end };
  }
  // last 30 days
  const s = new Date(now);
  s.setDate(s.getDate() - 29);
  return { start: toDateStr(s), end };
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function shortDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/* ─── Component ─── */

type Tab = "overview" | "sales" | "tax" | "items" | "heatmap";

export function ReportsPageClient() {
  const [tab, setTab] = useState<Tab>("overview");
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [taxData, setTaxData] = useState<TaxReport | null>(null);
  const [itemsData, setItemsData] = useState<ItemsReport | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapReport | null>(null);
  const [insightsData, setInsightsData] = useState<InsightsReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const defaultRange = presetRange("30days");
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [itemSort, setItemSort] = useState<"qty" | "revenue">("qty");
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());

  // ── Fetch Sales ──
  const fetchSales = useCallback(async (start?: string, end?: string, method?: string) => {
    setLoading(true);
    try {
      const s = start ?? startDate;
      const e = end ?? endDate;
      const m = method ?? paymentMethod;
      const params = new URLSearchParams({ start: s, end: e });
      if (m && m !== "all") params.set("method", m);
      const res = await fetch(`/api/reports/sales?${params}`);
      const json = (await res.json()) as { data: SalesReport };
      setSalesData(json.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, paymentMethod]);

  // ── Fetch Tax ──
  async function fetchTax(year?: number) {
    setLoading(true);
    try {
      const y = year ?? taxYear;
      const res = await fetch(`/api/reports/tax?year=${y}`);
      const json = (await res.json()) as { data: TaxReport };
      setTaxData(json.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch Items ──
  async function fetchItems(sort?: "qty" | "revenue") {
    setLoading(true);
    try {
      const s = sort ?? itemSort;
      const params = new URLSearchParams({ start: startDate, end: endDate, sort: s });
      const res = await fetch(`/api/reports/items?${params}`);
      const json = (await res.json()) as { data: ItemsReport };
      setItemsData(json.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch Heatmap ──
  async function fetchHeatmap(days?: number) {
    setLoading(true);
    try {
      const d = days ?? 7;
      const res = await fetch(`/api/reports/heatmap?days=${d}`);
      const json = (await res.json()) as { data: HeatmapReport };
      setHeatmapData(json.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch Insights ──
  async function fetchInsights() {
    try {
      const res = await fetch("/api/reports/insights");
      const json = (await res.json()) as { data: InsightsReport };
      setInsightsData(json.data);
    } catch {
      /* ignore */
    }
  }

  // Load data on mount & tab change
  useEffect(() => {
    if (tab === "overview" || tab === "sales") fetchSales();
    if (tab === "overview") fetchInsights();
    if (tab === "tax") fetchTax();
    if (tab === "items") fetchItems();
    if (tab === "heatmap") fetchHeatmap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Auto-refresh every 30s on overview
  useEffect(() => {
    if (tab !== "overview") return;
    const iv = setInterval(() => {
      fetchSales();
      fetchInsights();
    }, 30_000);
    return () => clearInterval(iv);
  }, [tab, fetchSales]);

  function applyPreset(preset: string) {
    const { start, end } = presetRange(preset);
    setStartDate(start);
    setEndDate(end);
    fetchSales(start, end);
  }

  // ── Tab definitions ──
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "heatmap", label: "Heatmap", icon: <Flame className="h-4 w-4" /> },
    { key: "sales", label: "Sales Report", icon: <TrendingUp className="h-4 w-4" /> },
    { key: "tax", label: "Tax Report", icon: <FileText className="h-4 w-4" /> },
    { key: "items", label: "Item Performance", icon: <ShoppingBag className="h-4 w-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="label-text">Reports &amp; Analytics</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">Business insights</h2>
        </div>
        {loading ? (
          <Badge variant="warning">Loading...</Badge>
        ) : (
          <Badge variant="success">Live</Badge>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border-subtle bg-bg-elevated p-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              "cursor-pointer flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              tab === t.key
                ? "bg-text-primary text-white shadow-sm"
                : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
            ].join(" ")}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════ OVERVIEW TAB ═══════════ */}
      {tab === "overview" && salesData ? (
        <OverviewTab data={salesData} insights={insightsData} onPreset={applyPreset} />
      ) : null}
      {tab === "overview" && !salesData && !loading ? (
        <p className="py-12 text-center text-text-secondary">No data available.</p>
      ) : null}

      {/* ═══════════ HEATMAP TAB ═══════════ */}
      {tab === "heatmap" ? (
        <HeatmapTab data={heatmapData} onRefresh={fetchHeatmap} />
      ) : null}

      {/* ═══════════ SALES TAB ═══════════ */}
      {tab === "sales" ? (
        <SalesTab
          data={salesData}
          startDate={startDate}
          endDate={endDate}
          paymentMethod={paymentMethod}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setPaymentMethod={setPaymentMethod}
          onApply={() => fetchSales()}
        />
      ) : null}

      {/* ═══════════ TAX TAB ═══════════ */}
      {tab === "tax" ? (
        <TaxTab data={taxData} year={taxYear} setYear={setTaxYear} onApply={() => fetchTax()} />
      ) : null}

      {/* ═══════════ ITEMS TAB ═══════════ */}
      {tab === "items" ? (
        <ItemsTab
          data={itemsData}
          sort={itemSort}
          setSort={(s) => {
            setItemSort(s);
            fetchItems(s);
          }}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          onApply={() => fetchItems()}
        />
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ═══════════════════════════════════════════════════════════════════ */

function OverviewTab({ data, insights, onPreset }: { data: SalesReport; insights: InsightsReport | null; onPreset: (preset: string) => void }) {
  const chartData = data.dailySales.map((d) => ({
    ...d,
    label: shortDate(d.date),
    revenue: Number(d.revenue.toFixed(2))
  }));

  const channelData = data.channelBreakdown.map((c) => ({
    name: c.channel.replace("_", " "),
    value: c.revenue
  }));

  const paymentData = data.paymentBreakdown.map((p) => ({
    name: p.method,
    value: p.total
  }));

  return (
    <div className="space-y-6">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "today", label: "Today" },
          { key: "week", label: "This Week" },
          { key: "month", label: "This Month" },
          { key: "30days", label: "Last 30 Days" }
        ].map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onPreset(p.key)}
            className="cursor-pointer rounded-xl border border-border-subtle bg-white px-4 py-2 text-xs font-semibold text-text-primary transition hover:bg-bg-surface"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          delta={`${data.orderCount} orders`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="Total Orders"
          value={String(data.orderCount)}
          delta={`${data.cancelledCount} cancelled`}
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(data.avgOrderValue)}
          delta={`Tax: ${formatCurrency(data.totalTax)}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Top Paying Method"
          value={data.paymentBreakdown[0]?.method ?? "—"}
          delta={data.paymentBreakdown[0] ? formatCurrency(data.paymentBreakdown[0].total) : "—"}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Sales over time */}
        <Card>
          <CardHeader>
            <p className="label-text">Revenue trend</p>
            <CardTitle className="mt-2">Sales over time</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #eee" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0f766e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-text-secondary">No sales data in this range.</p>
            )}
          </CardContent>
        </Card>

        {/* Orders per day bar */}
        <Card>
          <CardHeader>
            <p className="label-text">Order volume</p>
            <CardTitle className="mt-2">Daily orders</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: 12, border: "1px solid #eee" }} />
                  <Bar dataKey="orders" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-text-secondary">No order data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pie charts row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Payment method pie */}
        <Card>
          <CardHeader>
            <p className="label-text">Payment split</p>
            <CardTitle className="mt-2">By payment method</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {paymentData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-text-secondary">No payment data.</p>
            )}
          </CardContent>
        </Card>

        {/* Channel split pie */}
        <Card>
          <CardHeader>
            <p className="label-text">Channel split</p>
            <CardTitle className="mt-2">Dine-in vs Takeaway</CardTitle>
          </CardHeader>
          <CardContent>
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {channelData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[(idx + 2) % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-text-secondary">No channel data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Smart Insights Panel ── */}
      {insights && insights.insights.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <div>
              <p className="label-text">Smart Insights</p>
              <CardTitle className="mt-1">AI-powered observations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {insights.insights.map((ins, idx) => (
                <InsightCard key={idx} insight={ins} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   INSIGHT CARD
   ═══════════════════════════════════════════════════════════════════ */

function InsightCard({ insight }: { insight: Insight }) {
  const config = {
    warning: {
      icon: <AlertTriangle className="h-5 w-5" />,
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-600",
      textColor: "text-amber-900"
    },
    success: {
      icon: <CheckCircle className="h-5 w-5" />,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-900"
    },
    info: {
      icon: <Info className="h-5 w-5" />,
      bg: "bg-sky-50",
      border: "border-sky-200",
      iconColor: "text-sky-600",
      textColor: "text-sky-900"
    }
  }[insight.type];

  const priorityBadge = {
    high: <Badge variant="warning">High</Badge>,
    medium: <Badge variant="neutral">Medium</Badge>,
    low: <Badge variant="success">Low</Badge>
  }[insight.priority];

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${config.bg} ${config.border}`}>
      <div className={`mt-0.5 shrink-0 ${config.iconColor}`}>{config.icon}</div>
      <div className="flex-1 space-y-1">
        <p className={`text-sm font-medium leading-snug ${config.textColor}`}>{insight.message}</p>
        <div>{priorityBadge}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HEATMAP TAB
   ═══════════════════════════════════════════════════════════════════ */

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_LABELS = HOURS.map((h) => {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
});

function HeatmapTab({ data, onRefresh }: { data: HeatmapReport | null; onRefresh: (days?: number) => void }) {
  const [metric, setMetric] = useState<"sales" | "orders">("sales");
  const [days, setDays] = useState(7);

  // Build the grid: rows = dates, cols = hours
  const grid = useMemo(() => {
    if (!data) return [];
    const cellMap = new Map<string, HeatmapCell>();
    for (const c of data.cells) {
      cellMap.set(`${c.date}|${c.hour}`, c);
    }

    return data.dates.map((date) => ({
      date,
      label: new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" }),
      hours: HOURS.map((h) => {
        const cell = cellMap.get(`${date}|${h}`);
        return {
          hour: h,
          value: cell ? (metric === "sales" ? cell.totalSales : cell.orderCount) : 0,
          sales: cell?.totalSales ?? 0,
          orders: cell?.orderCount ?? 0
        };
      })
    }));
  }, [data, metric]);

  const maxValue = useMemo(() => {
    if (!data) return 1;
    return metric === "sales" ? Math.max(data.maxSales, 1) : Math.max(data.maxOrders, 1);
  }, [data, metric]);

  function cellColor(value: number) {
    if (value === 0) return "bg-gray-50";
    const intensity = Math.min(value / maxValue, 1);
    if (intensity < 0.2) return "bg-emerald-100";
    if (intensity < 0.4) return "bg-emerald-200";
    if (intensity < 0.6) return "bg-emerald-400";
    if (intensity < 0.8) return "bg-emerald-500 text-white";
    return "bg-emerald-700 text-white";
  }

  function cellTooltip(h: { hour: number; sales: number; orders: number }) {
    return `${HOUR_LABELS[h.hour]}\nSales: ${formatCurrency(h.sales)}\nOrders: ${h.orders}`;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-secondary">Metric</p>
              <div className="flex rounded-xl border border-border-subtle bg-white">
                <button
                  type="button"
                  onClick={() => setMetric("sales")}
                  className={`cursor-pointer rounded-l-xl px-4 py-2 text-sm font-semibold transition ${
                    metric === "sales"
                      ? "bg-text-primary text-white"
                      : "text-text-secondary hover:bg-bg-surface"
                  }`}
                >
                  Sales Amount
                </button>
                <button
                  type="button"
                  onClick={() => setMetric("orders")}
                  className={`cursor-pointer rounded-r-xl px-4 py-2 text-sm font-semibold transition ${
                    metric === "orders"
                      ? "bg-text-primary text-white"
                      : "text-text-secondary hover:bg-bg-surface"
                  }`}
                >
                  Order Count
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-secondary">Period</p>
              <select
                className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                value={days}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setDays(d);
                  onRefresh(d);
                }}
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <p className="label-text">Hourly Sales Heatmap</p>
              <CardTitle className="mt-1">
                {metric === "sales" ? "Revenue" : "Orders"} by hour — last {days} days
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!data || grid.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-secondary">No data for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Hour labels row */}
                <div className="mb-1 flex">
                  <div className="w-28 shrink-0" />
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="flex-1 text-center text-[10px] font-medium text-text-secondary"
                    >
                      {h % 3 === 0 ? HOUR_LABELS[h] : ""}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                {grid.map((row) => (
                  <div key={row.date} className="mb-1 flex items-center">
                    <div className="w-28 shrink-0 pr-2 text-right text-xs font-medium text-text-secondary">
                      {row.label}
                    </div>
                    {row.hours.map((h) => (
                      <div
                        key={h.hour}
                        className={`mx-px flex-1 rounded-sm ${cellColor(h.value)}`}
                        style={{ aspectRatio: "1", minHeight: 20 }}
                        title={cellTooltip(h)}
                      >
                        <div className="flex h-full items-center justify-center text-[9px] font-bold leading-none">
                          {h.value > 0
                            ? metric === "sales"
                              ? `₹${Math.round(h.value)}`
                              : h.value
                            : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Legend */}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <span className="text-xs text-text-secondary">Low</span>
                  {["bg-gray-50", "bg-emerald-100", "bg-emerald-200", "bg-emerald-400", "bg-emerald-500", "bg-emerald-700"].map(
                    (c) => (
                      <div key={c} className={`h-4 w-6 rounded-sm ${c}`} />
                    )
                  )}
                  <span className="text-xs text-text-secondary">High</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SALES TAB
   ═══════════════════════════════════════════════════════════════════ */

function SalesTab({
  data,
  startDate,
  endDate,
  paymentMethod,
  setStartDate,
  setEndDate,
  setPaymentMethod,
  onApply
}: {
  data: SalesReport | null;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  setPaymentMethod: (v: string) => void;
  onApply: () => void;
}) {
  function exportCsv() {
    if (!data) return;
    const headers = ["Date", "Revenue", "Orders", "Tax"];
    const rows = data.dailySales.map((d) => [d.date, d.revenue.toFixed(2), String(d.orders), d.tax.toFixed(2)]);
    downloadCsv(`sales-report-${startDate}-to-${endDate}.csv`, headers, rows);
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-text-secondary">Start date</p>
                <input
                  type="date"
                  className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-text-secondary">End date</p>
                <input
                  type="date"
                  className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-text-secondary">Payment method</p>
                <select
                  className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none capitalize"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>
              <Button onClick={onApply} className="h-10 bg-accent-primary hover:bg-accent-primary-hover">
                Apply
              </Button>
            </div>
            <Button variant="secondary" className="h-10" onClick={exportCsv} disabled={!data}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Revenue" value={formatCurrency(data.totalRevenue)} delta={`${data.orderCount} orders`} icon={<Wallet className="h-5 w-5" />} />
            <StatCard title="Cancelled" value={String(data.cancelledCount)} delta="cancelled orders" icon={<ShoppingBag className="h-5 w-5" />} />
            <StatCard title="Discounts" value={formatCurrency(data.discountTotal)} delta="total applied" icon={<CreditCard className="h-5 w-5" />} />
            <StatCard title="Avg Order Value" value={formatCurrency(data.avgOrderValue)} delta={`Tax: ${formatCurrency(data.totalTax)}`} icon={<TrendingUp className="h-5 w-5" />} />
          </div>

          {/* Daily sales table */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.dailySales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-text-secondary">
                        No sales in this date range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.dailySales.map((d) => (
                      <TableRow key={d.date}>
                        <TableCell className="font-semibold text-text-primary">{shortDate(d.date)}</TableCell>
                        <TableCell className="text-right font-medium text-text-primary">{formatCurrency(d.revenue)}</TableCell>
                        <TableCell className="text-right">{d.orders}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.tax)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAX TAB
   ═══════════════════════════════════════════════════════════════════ */

function TaxTab({
  data,
  year,
  setYear,
  onApply
}: {
  data: TaxReport | null;
  year: number;
  setYear: (y: number) => void;
  onApply: () => void;
}) {
  function exportCsv() {
    if (!data) return;
    const headers = ["Month", "Total Sales", "Taxable Amount", "Tax %", "Total Tax", "Orders"];
    const rows = data.months.map((m) => [
      m.label,
      m.totalSales.toFixed(2),
      m.taxableAmount.toFixed(2),
      String(m.taxPercent),
      m.totalTax.toFixed(2),
      String(m.orderCount)
    ]);
    downloadCsv(`tax-report-${year}.csv`, headers, rows);
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-secondary">Financial Year</p>
              <select
                className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                value={year}
                onChange={(e) => {
                  setYear(Number(e.target.value));
                }}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={onApply} className="h-10 bg-accent-primary hover:bg-accent-primary-hover">
              Generate
            </Button>
            <Button variant="secondary" className="h-10" onClick={exportCsv} disabled={!data}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="secondary" className="h-10" onClick={printReport} disabled={!data}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total Sales"
              value={formatCurrency(data.grandTotalSales)}
              delta={`${data.months.reduce((s, m) => s + m.orderCount, 0)} orders`}
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatCard
              title="Total Tax Collected"
              value={formatCurrency(data.grandTotalTax)}
              delta={`${data.months.length} months`}
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              title="Effective Tax Rate"
              value={
                data.grandTotalSales > 0
                  ? `${((data.grandTotalTax / (data.grandTotalSales - data.grandTotalTax)) * 100).toFixed(2)}%`
                  : "0%"
              }
              delta="avg across all months"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>

          {/* Monthly breakdown */}
          <Card className="print-area">
            <CardHeader>
              <CardTitle>Monthly Tax Breakdown — {year}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Taxable Amt</TableHead>
                    <TableHead className="text-right">Tax %</TableHead>
                    <TableHead className="text-right">Total Tax</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.months.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-text-secondary">
                        No tax data for {year}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.months.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell className="font-semibold text-text-primary">{m.label}</TableCell>
                        <TableCell className="text-right font-medium text-text-primary">{formatCurrency(m.totalSales)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.taxableAmount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="neutral">{m.taxPercent}%</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-text-primary">{formatCurrency(m.totalTax)}</TableCell>
                        <TableCell className="text-right">{m.orderCount}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {data.months.length > 0 ? (
                    <TableRow>
                      <TableCell className="font-bold text-text-primary">TOTAL</TableCell>
                      <TableCell className="text-right font-bold text-text-primary">{formatCurrency(data.grandTotalSales)}</TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell className="text-right font-bold text-text-primary">{formatCurrency(data.grandTotalTax)}</TableCell>
                      <TableCell className="text-right font-bold text-text-primary">
                        {data.months.reduce((s, m) => s + m.orderCount, 0)}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ITEMS TAB
   ═══════════════════════════════════════════════════════════════════ */

function ItemsTab({
  data,
  sort,
  setSort,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onApply
}: {
  data: ItemsReport | null;
  sort: "qty" | "revenue";
  setSort: (s: "qty" | "revenue") => void;
  startDate: string;
  endDate: string;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  onApply: () => void;
}) {
  function exportCsv() {
    if (!data) return;
    const headers = ["#", "Item Name", "Qty Sold", "Revenue", "Avg Price"];
    const rows = data.items.map((item, idx) => [
      String(idx + 1),
      item.name,
      String(item.qtySold),
      item.revenue.toFixed(2),
      item.avgPrice.toFixed(2)
    ]);
    downloadCsv(`item-performance-${startDate}-to-${endDate}.csv`, headers, rows);
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-text-secondary">Start date</p>
                <input
                  type="date"
                  className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-text-secondary">End date</p>
                <input
                  type="date"
                  className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-text-secondary">Sort by</p>
                <select
                  className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "qty" | "revenue")}
                >
                  <option value="qty">Quantity sold</option>
                  <option value="revenue">Revenue</option>
                </select>
              </div>
              <Button onClick={onApply} className="h-10 bg-accent-primary hover:bg-accent-primary-hover">
                Apply
              </Button>
            </div>
            <Button variant="secondary" className="h-10" onClick={exportCsv} disabled={!data}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total Items Sold"
              value={String(data.totalQty)}
              delta={`${data.items.length} unique items`}
              icon={<ShoppingBag className="h-5 w-5" />}
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(data.totalRevenue)}
              delta="from items"
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatCard
              title="#1 Best Seller"
              value={data.items[0]?.name ?? "—"}
              delta={data.items[0] ? `${data.items[0].qtySold} sold` : "—"}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>

          {/* Bar chart: Top 10 items */}
          {data.items.length > 0 ? (
            <Card>
              <CardHeader>
                <p className="label-text">Item performance</p>
                <CardTitle className="mt-2">Top 10 items by {sort === "qty" ? "quantity" : "revenue"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.items.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 11 }}
                    />
                    <RechartsTooltip
                      formatter={(value, name) =>
                        name === "revenue"
                          ? [formatCurrency(Number(value ?? 0)), "Revenue"]
                          : [Number(value ?? 0), "Qty Sold"]
                      }
                      contentStyle={{ borderRadius: 12, border: "1px solid #eee" }}
                    />
                    <Bar
                      dataKey={sort === "qty" ? "qtySold" : "revenue"}
                      fill="#0f766e"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : null}

          {/* Full table */}
          <Card>
            <CardHeader>
              <CardTitle>All Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-text-secondary">
                        No item sales data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((item, idx) => (
                      <TableRow key={item.name}>
                        <TableCell>
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-primary/10 text-xs font-bold text-accent-primary">
                            {idx + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-text-primary">{item.name}</TableCell>
                        <TableCell className="text-right">{item.qtySold}</TableCell>
                        <TableCell className="text-right font-medium text-text-primary">{formatCurrency(item.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.avgPrice)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REUSABLE STAT CARD
   ═══════════════════════════════════════════════════════════════════ */

function StatCard({
  title,
  value,
  delta,
  icon
}: {
  title: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <p className="label-text">{title}</p>
          <CardTitle className="mt-3 text-[1.6rem] leading-9 tracking-[-0.03em]">{value}</CardTitle>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-surface text-accent-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Badge variant="neutral">{delta}</Badge>
      </CardContent>
    </Card>
  );
}
