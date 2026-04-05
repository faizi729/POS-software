"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  MessageCircle,
  Phone,
  ShoppingCart,
  CreditCard,
  RefreshCw,
  Upload,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ── types ── */

type WaSessionRow = {
  id: string;
  phone: string;
  state: string;
  cartItemCount: number;
  cartTotal: number;
  customerName: string;
  paymentStatus: string;
  orderId: string | null;
  updatedAt: string;
};

/* ── helpers ── */

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((d) => d.data);

const stateLabels: Record<string, { label: string; color: string }> = {
  START: { label: "Welcome", color: "bg-gray-500" },
  BROWSING: { label: "Browsing", color: "bg-blue-500" },
  ITEM_SELECTED: { label: "Item Selected", color: "bg-indigo-500" },
  ADDING_QUANTITY: { label: "Adding Qty", color: "bg-indigo-500" },
  CART_VIEW: { label: "Viewing Cart", color: "bg-purple-500" },
  CHECKOUT_NAME: { label: "Checkout", color: "bg-yellow-600" },
  CHECKOUT_ADDRESS: { label: "Checkout", color: "bg-yellow-600" },
  PAYMENT_PENDING: { label: "Payment Pending", color: "bg-orange-500" },
  ORDER_CONFIRMED: { label: "Confirmed ✓", color: "bg-green-600" },
};

const paymentBadge: Record<string, { label: string; color: string }> = {
  none: { label: "—", color: "" },
  pending: { label: "Pending", color: "text-orange-400" },
  success: { label: "Paid ✓", color: "text-green-400" },
  failed: { label: "Failed", color: "text-red-400" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── page ── */

export default function WhatsAppDashboard() {
  const {
    data: sessions,
    mutate,
    isLoading,
  } = useSWR<WaSessionRow[]>("/api/whatsapp/sessions", fetcher, {
    refreshInterval: 10_000,
  });

  const [syncing, setSyncing] = useState(false);

  const activeSessions =
    sessions?.filter(
      (s) => s.state !== "START" && s.state !== "ORDER_CONFIRMED"
    ).length ?? 0;

  const pendingPayments =
    sessions?.filter((s) => s.paymentStatus === "pending").length ?? 0;

  const confirmedOrders =
    sessions?.filter((s) => s.state === "ORDER_CONFIRMED").length ?? 0;

  async function handleCatalogSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/whatsapp/catalog-sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`Catalog synced! ${data.data.synced} items pushed.`);
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch {
      alert("Sync failed — check console.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="section-shell">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-7 w-7 text-green-500" />
          <h1 className="text-2xl font-bold text-text-primary">
            WhatsApp Orders
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => mutate()}
            className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm rounded-lg"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={handleCatalogSync}
            disabled={syncing}
            className="btn-primary flex items-center gap-2 px-3 py-2 text-sm rounded-lg disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {syncing ? "Syncing…" : "Sync Catalog"}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Sessions"
          value={sessions?.length ?? 0}
          icon={<MessageCircle className="h-5 w-5 text-green-500" />}
        />
        <StatCard
          label="Active Chats"
          value={activeSessions}
          icon={<Phone className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          label="Payment Pending"
          value={pendingPayments}
          icon={<CreditCard className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          label="Orders Confirmed"
          value={confirmedOrders}
          icon={<ShoppingCart className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* Sessions table */}
      <div className="surface-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <h2 className="font-semibold text-text-primary">Live Sessions</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-text-muted">Loading…</div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No WhatsApp sessions yet. Customers will appear here when they
            message your WhatsApp number.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted">
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">State</th>
                  <th className="text-right px-4 py-3 font-medium">Cart</th>
                  <th className="text-left px-4 py-3 font-medium">Payment</th>
                  <th className="text-left px-4 py-3 font-medium">Order</th>
                  <th className="text-right px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const sl = stateLabels[s.state] ?? {
                    label: s.state,
                    color: "bg-gray-600",
                  };
                  const pb = paymentBadge[s.paymentStatus] ?? paymentBadge.none;

                  return (
                    <tr
                      key={s.id}
                      className="border-b border-border-subtle hover:bg-bg-elevated/60 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-text-primary">
                        +{s.phone}
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        {s.customerName || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium text-white",
                            sl.color
                          )}
                        >
                          {sl.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-text-primary">
                        {s.cartItemCount > 0
                          ? `${s.cartItemCount} items · ₹${s.cartTotal}`
                          : "—"}
                      </td>
                      <td className={cn("px-4 py-3 font-medium", pb.color)}>
                        {pb.label}
                      </td>
                      <td className="px-4 py-3">
                        {s.orderId ? (
                          <a
                            href={`/orders`}
                            className="text-accent-primary hover:underline flex items-center gap-1"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-text-muted text-xs">
                        {s.updatedAt ? timeAgo(s.updatedAt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── stat card ── */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="surface-card rounded-xl p-4 flex items-center gap-4">
      <div className="p-2 rounded-lg bg-bg-elevated">{icon}</div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
}
