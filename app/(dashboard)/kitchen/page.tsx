"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChefHat,
  ExternalLink,
  Clock,
  Flame,
  UtensilsCrossed,
  Bell,
  RefreshCw,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type KDSOrder = {
  id: string;
  orderNumber: string;
  tokenNumber: number;
  type: string;
  status: string;
  tableNo: string;
  items: Array<{ name: string; quantity: number; notes: string }>;
  createdAt: string;
};

type KDSData = {
  placed: KDSOrder[];
  preparing: KDSOrder[];
  ready: KDSOrder[];
  total: number;
};

function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      const mins = Math.floor(diff / 60);
      setElapsed(mins < 1 ? "Just now" : `${mins}m`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return <span className="text-xs text-text-muted">{elapsed}</span>;
}

export default function KitchenPage() {
  const [data, setData] = useState<KDSData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/kds/orders");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvance = async (orderId: string, nextStatus: string) => {
    try {
      await fetch(`/api/kds/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      await fetchData();
    } catch {
      // Ignore errors
    }
  };

  const stats = [
    {
      label: "New Orders",
      count: data?.placed.length ?? 0,
      icon: Bell,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      label: "Preparing",
      count: data?.preparing.length ?? 0,
      icon: Flame,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      label: "Ready",
      count: data?.ready.length ?? 0,
      icon: UtensilsCrossed,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      label: "Total Active",
      count: data?.total ?? 0,
      icon: ChefHat,
      color: "text-violet-500",
      bg: "bg-violet-500/10"
    }
  ];

  return (
    <>
      {/* Header */}
      <div className="surface-card flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Kitchen Display</h2>
            <p className="text-sm text-text-muted">Monitor and manage kitchen orders in real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <Link
            href="/kds"
            target="_blank"
            className="flex items-center gap-2 rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-primary-hover"
          >
            <ExternalLink className="h-4 w-4" />
            Launch Fullscreen KDS
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.count}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Queue */}
      {loading ? (
        <div className="surface-card flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* New Orders */}
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle bg-blue-500/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-bold text-blue-500">New Orders</span>
              </div>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-500">
                {data?.placed.length ?? 0}
              </span>
            </div>
            <div className="space-y-3 p-4">
              {data?.placed.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-muted">No new orders</p>
              ) : (
                data?.placed.map((order) => (
                  <div key={order.id} className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-bold text-text-primary">
                        #{order.tokenNumber || order.orderNumber.split("-").pop()}
                      </span>
                      <div className="flex items-center gap-2">
                        {order.tableNo && (
                          <span className="text-xs text-text-muted">T-{order.tableNo}</span>
                        )}
                        <ElapsedBadge createdAt={order.createdAt} />
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-bg-surface text-xs font-bold text-text-primary">
                            {item.quantity}
                          </span>
                          <span className="text-text-secondary">{item.name}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleAdvance(order.id, "preparing")}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black transition-colors hover:bg-amber-400"
                    >
                      <Flame className="h-3.5 w-3.5" />
                      Start Preparing
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Preparing */}
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle bg-amber-500/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-500">Preparing</span>
              </div>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-500">
                {data?.preparing.length ?? 0}
              </span>
            </div>
            <div className="space-y-3 p-4">
              {data?.preparing.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-muted">No orders preparing</p>
              ) : (
                data?.preparing.map((order) => (
                  <div key={order.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-bold text-text-primary">
                        #{order.tokenNumber || order.orderNumber.split("-").pop()}
                      </span>
                      <div className="flex items-center gap-2">
                        {order.tableNo && (
                          <span className="text-xs text-text-muted">T-{order.tableNo}</span>
                        )}
                        <ElapsedBadge createdAt={order.createdAt} />
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-bg-surface text-xs font-bold text-text-primary">
                            {item.quantity}
                          </span>
                          <span className="text-text-secondary">{item.name}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleAdvance(order.id, "ready")}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-400"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Ready
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ready */}
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle bg-emerald-500/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-500">Ready to Serve</span>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-500">
                {data?.ready.length ?? 0}
              </span>
            </div>
            <div className="space-y-3 p-4">
              {data?.ready.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-muted">No orders ready</p>
              ) : (
                data?.ready.map((order) => (
                  <div key={order.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-bold text-text-primary">
                        #{order.tokenNumber || order.orderNumber.split("-").pop()}
                      </span>
                      <div className="flex items-center gap-2">
                        {order.tableNo && (
                          <span className="text-xs text-text-muted">T-{order.tableNo}</span>
                        )}
                        <ElapsedBadge createdAt={order.createdAt} />
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-bg-surface text-xs font-bold text-text-primary">
                            {item.quantity}
                          </span>
                          <span className="text-text-secondary">{item.name}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleAdvance(order.id, "completed")}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-400"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Served
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
