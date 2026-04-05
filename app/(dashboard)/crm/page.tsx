"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  Star,
  Phone,
  MessageCircle,
  Gift,
  TrendingUp,
  Calendar,
  ExternalLink,
  X,
  RefreshCw,
  Crown,
  Heart,
  ArrowRight,
  Award,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ──────── Types ──────── */

type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisitAt?: string;
  firstVisitAt?: string;
  loyaltyPoints: number;
  tags: string[];
  notes?: string;
};

type LoyaltyEntry = {
  id: string;
  type: string;
  points: number;
  balance: number;
  description: string;
  createdAt: string;
};

type OrderEntry = {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  type: string;
  itemCount: number;
  createdAt: string;
};

type CustomerDetail = CustomerSummary & {
  loyaltyHistory: LoyaltyEntry[];
  recentOrders: OrderEntry[];
  whatsappLinks: { missYou: string; loyaltyReward: string | null };
};

/* ──────── Main Page ──────── */

export default function CRMPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", email: "" });

  // Redeem state
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [showRedeem, setShowRedeem] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sort) params.set("sort", sort);
      const res = await fetch(`/api/crm/customers?${params}`);
      const json = await res.json();
      if (json.success) setCustomers(json.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search, sort]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedId(id);
    try {
      const res = await fetch(`/api/crm/customers/${id}`);
      const json = await res.json();
      if (json.success) setDetail(json.data);
    } catch {
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.phone.trim()) return;
    try {
      await fetch("/api/crm/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm)
      });
      setShowAddForm(false);
      setAddForm({ name: "", phone: "", email: "" });
      await fetchCustomers();
    } catch {}
  };

  const handleRedeem = async () => {
    if (!selectedId || redeemPoints <= 0) return;
    try {
      await fetch(`/api/crm/customers/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", points: redeemPoints })
      });
      setShowRedeem(false);
      setRedeemPoints(0);
      await fetchDetail(selectedId);
      await fetchCustomers();
    } catch {}
  };

  const totalCustomers = customers.length;
  const totalLoyalty = customers.reduce((s, c) => s + c.loyaltyPoints, 0);
  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgVisits =
    totalCustomers > 0
      ? Math.round(customers.reduce((s, c) => s + c.totalVisits, 0) / totalCustomers)
      : 0;

  return (
    <>
      {/* Header */}
      <div className="surface-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">CRM & Loyalty</h2>
            <p className="text-sm text-text-muted">
              {totalCustomers} customers · {totalLoyalty.toLocaleString("en-IN")} total loyalty
              points
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchCustomers();
            }}
            className="flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-primary-hover"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Total Customers",
            value: totalCustomers,
            icon: Users,
            color: "text-violet-500",
            bg: "bg-violet-500/10"
          },
          {
            label: "Total Revenue",
            value: `₹${totalSpent.toLocaleString("en-IN")}`,
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
          },
          {
            label: "Loyalty Points",
            value: totalLoyalty.toLocaleString("en-IN"),
            icon: Award,
            color: "text-amber-500",
            bg: "bg-amber-500/10"
          },
          {
            label: "Avg Visits",
            value: avgVisits,
            icon: Calendar,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
          }
        ].map((stat) => (
          <div key={stat.label} className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  stat.bg
                )}
              >
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: List + Detail */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Customer List */}
        <div className="lg:col-span-2 surface-card overflow-hidden">
          {/* Search + Sort */}
          <div className="border-b border-border-subtle p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-1">
              {[
                { key: "recent", label: "Recent" },
                { key: "spent", label: "Top Spend" },
                { key: "points", label: "Points" }
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    sort === s.key
                      ? "bg-accent-primary text-white"
                      : "text-text-muted hover:bg-bg-surface hover:text-text-secondary"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer List */}
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : customers.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-muted">
                No customers yet. They&apos;ll appear here after orders are paid.
              </div>
            ) : (
              customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => fetchDetail(c.id)}
                  className={cn(
                    "flex w-full items-center justify-between border-b border-border-subtle px-4 py-3 text-left transition-colors hover:bg-bg-surface",
                    selectedId === c.id && "bg-bg-surface"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-500">
                      {c.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{c.name}</p>
                      <p className="text-xs text-text-muted">{c.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-text-primary">
                        {c.loyaltyPoints} pts
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {c.totalVisits} visit{c.totalVisits !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Customer Detail */}
        <div className="lg:col-span-3 surface-card overflow-hidden">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="h-12 w-12 text-text-muted/30 mb-4" />
              <p className="text-sm text-text-muted">Select a customer to view details</p>
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          ) : detail ? (
            <div className="p-5 space-y-6">
              {/* Customer Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white">
                    {detail.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{detail.name}</h3>
                    <p className="text-sm text-text-muted">{detail.phone}</p>
                    {detail.email && (
                      <p className="text-xs text-text-muted">{detail.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {detail.whatsappLinks.missYou && (
                    <a
                      href={detail.whatsappLinks.missYou}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-400"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  )}
                  <a
                    href={`tel:${detail.phone}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-colors hover:bg-bg-surface"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Visits", value: detail.totalVisits, icon: Calendar },
                  {
                    label: "Total Spent",
                    value: `₹${detail.totalSpent.toLocaleString("en-IN")}`,
                    icon: TrendingUp
                  },
                  { label: "Points", value: detail.loyaltyPoints, icon: Star },
                  {
                    label: "Last Visit",
                    value: detail.lastVisitAt
                      ? new Date(detail.lastVisitAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short"
                        })
                      : "N/A",
                    icon: Calendar
                  }
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-border-subtle p-3 text-center"
                  >
                    <p className="text-lg font-bold text-text-primary">{s.value}</p>
                    <p className="text-[10px] text-text-muted">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Loyalty Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Gift className="h-4 w-4 text-amber-500" />
                    Loyalty Points
                  </h4>
                  {detail.loyaltyPoints > 0 && (
                    <button
                      onClick={() => setShowRedeem(true)}
                      className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-amber-400"
                    >
                      <Gift className="h-3 w-3" />
                      Redeem
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {detail.loyaltyHistory.length === 0 ? (
                    <p className="text-sm text-text-muted py-4 text-center">
                      No loyalty history yet.
                    </p>
                  ) : (
                    detail.loyaltyHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded",
                              entry.type === "earn"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                            )}
                          >
                            {entry.type === "earn" ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <Gift className="h-3 w-3" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-text-primary">
                              {entry.description}
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {entry.createdAt &&
                                new Date(entry.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-mono font-semibold",
                            entry.points > 0 ? "text-emerald-500" : "text-red-400"
                          )}
                        >
                          {entry.points > 0 ? "+" : ""}
                          {entry.points}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-400" />
                  Recent Orders
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {detail.recentOrders.length === 0 ? (
                    <p className="text-sm text-text-muted py-4 text-center">No orders yet.</p>
                  ) : (
                    detail.recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {order.orderNumber}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {order.itemCount} items ·{" "}
                            {order.type === "takeaway" ? "Takeaway" : "Dine-in"} ·{" "}
                            {order.createdAt &&
                              new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short"
                              })}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-text-primary">
                          ₹{order.grandTotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowAddForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-bg-elevated p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">Add Customer</h3>
              <button onClick={() => setShowAddForm(false)}>
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-text mb-1 block">Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="label-text mb-1 block">Phone *</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="label-text mb-1 block">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  placeholder="Optional"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!addForm.name.trim() || !addForm.phone.trim()}
                className="w-full rounded-xl bg-accent-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redeem Modal */}
      {showRedeem && detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowRedeem(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-bg-elevated p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">Redeem Points</h3>
              <button onClick={() => setShowRedeem(false)}>
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>
            <p className="text-sm text-text-muted mb-1">
              {detail.name} · Available: {detail.loyaltyPoints} pts
            </p>
            <p className="text-xs text-text-muted mb-4">1 point = ₹1 discount</p>
            <div className="mb-4">
              <label className="label-text mb-1 block">Points to Redeem</label>
              <input
                type="number"
                min={1}
                max={detail.loyaltyPoints}
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(Number(e.target.value))}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
              />
            </div>
            <button
              onClick={handleRedeem}
              disabled={redeemPoints <= 0 || redeemPoints > detail.loyaltyPoints}
              className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              Redeem {redeemPoints > 0 ? `${redeemPoints} pts (₹${redeemPoints} off)` : ""}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
