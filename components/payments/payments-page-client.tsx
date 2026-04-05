"use client";

import { useMemo, useState } from "react";
import { CreditCard, Search, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";

type Payment = {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  reference?: string;
  paidAt?: string;
  createdAt?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  tokenNumber?: number;
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function isToday(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function PaymentsPageClient({ payments, orders }: { payments: Payment[]; orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);
  const [page, setPage] = useState(1);

  // Order lookup map
  const orderMap = useMemo(() => {
    const m = new Map<string, Order>();
    for (const o of orders) m.set(o.id, o);
    return m;
  }, [orders]);

  // Summary cards
  const todayPayments = useMemo(() => payments.filter((p) => isToday(p.paidAt ?? p.createdAt)), [payments]);
  const todayTotal = todayPayments.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const allTimeTotal = payments.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);

  const methodTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of todayPayments) {
      if (p.status !== "completed") continue;
      map.set(p.method, (map.get(p.method) ?? 0) + p.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [todayPayments]);

  // Unique methods for filter
  const allMethods = useMemo(() => [...new Set(payments.map((p) => p.method))], [payments]);

  // Filter
  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const order = orderMap.get(p.orderId);
        const orderNumber = order?.orderNumber?.toLowerCase() ?? "";
        const ref = (p.reference ?? "").toLowerCase();
        if (!orderNumber.includes(q) && !ref.includes(q) && !p.method.includes(q)) return false;
      }
      return true;
    });
  }, [payments, statusFilter, methodFilter, query, orderMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <p className="label-text">Today&apos;s collection</p>
              <CardTitle className="mt-3 text-2xl tracking-tight">{formatCurrency(todayTotal)}</CardTitle>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="success">{todayPayments.length} payment{todayPayments.length !== 1 ? "s" : ""}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <p className="label-text">All-time collected</p>
              <CardTitle className="mt-3 text-2xl tracking-tight">{formatCurrency(allTimeTotal)}</CardTitle>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-surface text-accent-primary">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="neutral">{payments.length} total</Badge>
          </CardContent>
        </Card>

        {methodTotals.slice(0, 2).map(([method, amount]) => (
          <Card key={method}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <p className="label-text capitalize">{method} today</p>
                <CardTitle className="mt-3 text-2xl tracking-tight">{formatCurrency(amount)}</CardTitle>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-surface text-text-secondary">
                <CreditCard className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Badge variant="neutral">
                {todayTotal > 0 ? Math.round((amount / todayTotal) * 100) : 0}% of today
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                className="h-11 rounded-2xl pl-11"
                placeholder="Search by order number or reference..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none capitalize"
                value={methodFilter}
                onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All methods</option>
                {allMethods.map((m) => (
                  <option key={m} value={m} className="capitalize">{m}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments table */}
      <Card>
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-text-secondary">
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((payment) => {
                  const order = orderMap.get(payment.orderId);
                  const dateStr = payment.paidAt ?? payment.createdAt;
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(order as any)?.tokenNumber ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              #{(order as any).tokenNumber}
                            </span>
                          ) : null}
                          <span className="font-semibold text-text-primary">
                            {order?.orderNumber ?? payment.orderId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{payment.method}</TableCell>
                      <TableCell className="text-right font-medium text-text-primary">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-text-secondary text-sm">{formatDate(dateStr)}</TableCell>
                      <TableCell className="text-text-secondary text-sm">{formatTime(dateStr)}</TableCell>
                      <TableCell className="text-xs text-text-muted">{payment.reference ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "completed" ? "success" : payment.status === "failed" ? "danger" : "warning"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary">View</span>
              <select
                className="h-9 rounded-xl border border-border-subtle bg-white px-3 text-xs font-semibold text-text-primary outline-none"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value) as 10 | 20 | 50); setPage(1); }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs text-text-secondary">per page</span>
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-end">
              <span className="text-xs text-text-secondary">
                Page {safePage} / {totalPages} · {filtered.length} payments
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="cursor-pointer rounded-xl border border-border-subtle bg-white px-3 py-2 text-xs font-semibold text-text-primary transition hover:bg-bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={safePage <= 1}
                  onClick={() => setPage((v) => Math.max(1, v - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-xl border border-border-subtle bg-white px-3 py-2 text-xs font-semibold text-text-primary transition hover:bg-bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
