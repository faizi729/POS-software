"use client";

import { ArrowRight, ArrowUpRight, Clock, CreditCard, Hash, ShoppingBag, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";

type DashboardStat = {
  title: string;
  value: string;
  delta: string;
  icon: string;
};

const icons = {
  wallet: Wallet,
  "shopping-bag": ShoppingBag,
  "arrow-up-right": ArrowUpRight,
  "credit-card": CreditCard
} as const;

type DashboardOverviewProps = {
  stats: DashboardStat[];
  topItems: { name: string; sold: number }[];
  paymentMix: { method: string; amount: number; share: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    tokenNumber?: number;
    status: string;
    paymentStatus: string;
    pricing: { grandTotal: number };
    createdAt?: string;
  }[];
  lastToken: number;
  hourlySales: number[];
  openingTime: string;
  closingTime: string;
  allTimeRevenue: number;
  totalOrders: number;
};

function parseHHmm(value: string, fallback: { hh: number; mm: number }) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!m) return fallback;
  const hh = Math.max(0, Math.min(23, Number(m[1] ?? fallback.hh)));
  const mm = Math.max(0, Math.min(59, Number(m[2] ?? fallback.mm)));
  return { hh, mm };
}

function formatHourLabel(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const isPm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${isPm ? "p" : "a"}`;
}

function buildBusinessHours(openingTime: string, closingTime: string) {
  const open = parseHHmm(openingTime, { hh: 9, mm: 0 });
  const close = parseHHmm(closingTime, { hh: 23, mm: 0 });

  const startHour = open.hh; // floor by nature
  // ceil close hour if there are minutes (e.g. 22:30 should include 23)
  const endHour = close.mm > 0 ? (close.hh + 1) % 24 : close.hh;

  const hours: number[] = [];
  let h = startHour;
  hours.push(h);
  // handle overnight (e.g. 18:00 → 02:00), guard max 24 points
  while (hours.length < 24 && h !== endHour) {
    h = (h + 1) % 24;
    hours.push(h);
  }
  return hours;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (diffMs < 0) return "just now";
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function DashboardOverview({
  stats,
  topItems,
  paymentMix,
  recentOrders,
  lastToken,
  hourlySales,
  openingTime,
  closingTime,
  allTimeRevenue,
  totalOrders
}: DashboardOverviewProps) {
  const today = new Date();
  const todayFormatted = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const chartHours = buildBusinessHours(openingTime, closingTime);
  const series = chartHours.map((hour) => ({
    hour,
    label: formatHourLabel(hour),
    revenue: hourlySales[hour] ?? 0
  }));

  return (
    <div className="space-y-6">
      {/* Today header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">{todayFormatted}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">Today&apos;s Overview</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border-subtle bg-bg-elevated px-4 py-2">
            <Hash className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Last token</p>
              <p className="text-lg font-bold text-emerald-700">#{lastToken || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border-subtle bg-bg-elevated px-4 py-2">
            <Wallet className="h-4 w-4 text-accent-primary" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">All-time</p>
              <p className="text-lg font-bold text-text-primary">{formatCurrency(allTimeRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, delta, icon }) => {
          const Icon = icons[icon as keyof typeof icons] ?? Wallet;

          return (
            <Card key={title}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <p className="label-text">{title}</p>
                  <CardTitle className="mt-3 text-[1.75rem] leading-9 tracking-[-0.03em]">
                    {value}
                  </CardTitle>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-surface text-accent-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="success">{delta}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Hourly sales chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <p className="label-text">Hourly sales</p>
              <CardTitle className="mt-2">Revenue by hour today</CardTitle>
            </div>
            <Badge variant="neutral">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] rounded-2xl bg-[linear-gradient(180deg,#fff,rgba(246,243,238,0.96))] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={44}
                    tickFormatter={(v) => {
                      const n = Number(v ?? 0);
                      if (Number.isNaN(n)) return "";
                      if (Math.abs(n) >= 100000) return `${Math.round(n / 1000)}k`;
                      if (Math.abs(n) >= 1000) return `${Math.round(n / 100) / 10}k`;
                      return String(Math.round(n));
                    }}
                  />
                  <RechartsTooltip
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
                    labelFormatter={(label) => `Hour: ${label}`}
                    contentStyle={{ borderRadius: 12, border: "1px solid #eee" }}
                  />
                  <Bar dataKey="revenue" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {/* Top movers */}
          <Card>
            <CardHeader>
              <p className="label-text">Top movers</p>
              <CardTitle className="mt-2">Best-selling items today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topItems.length === 0 ? (
                <p className="text-sm text-text-secondary">No items sold today yet.</p>
              ) : (
                topItems.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary/10 text-xs font-bold text-accent-primary">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-text-primary">{item.name}</p>
                        <p className="text-xs text-text-secondary">{item.sold} sold</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-muted" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Payment mix */}
          <Card>
            <CardHeader>
              <p className="label-text">Payment mix</p>
              <CardTitle className="mt-2">Today&apos;s tender breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMix.length === 0 ? (
                <p className="text-sm text-text-secondary">No payments recorded today.</p>
              ) : (
                paymentMix.map((item) => (
                  <div key={item.method} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-text-primary">
                      <span className="capitalize">{item.method}</span>
                      <span>{formatCurrency(item.amount)} ({item.share}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-surface">
                      <div
                        className="h-2 rounded-full bg-accent-secondary"
                        style={{ width: `${item.share}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent orders with token + time */}
          <Card>
            <CardHeader>
              <p className="label-text">Recent orders</p>
              <CardTitle className="mt-2">Today&apos;s activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-text-secondary">No orders placed today yet.</p>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {order.tokenNumber ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            #{order.tokenNumber}
                          </span>
                        ) : null}
                        <p className="font-semibold text-text-primary">{order.orderNumber}</p>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="capitalize text-xs text-text-secondary">{order.status}</span>
                        {order.createdAt ? (
                          <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(order.createdAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text-primary">
                        {formatCurrency(order.pricing.grandTotal)}
                      </p>
                      <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"}>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
