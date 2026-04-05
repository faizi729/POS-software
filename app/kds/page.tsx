"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChefHat,
  Clock,
  ArrowRight,
  CheckCircle2,
  Flame,
  UtensilsCrossed,
  Bell,
  RefreshCw,
  Maximize,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ──────── Types ──────── */

type KDSOrderItem = {
  id: string;
  name: string;
  quantity: number;
  notes: string;
};

type KDSOrder = {
  id: string;
  orderNumber: string;
  tokenNumber: number;
  channel: string;
  type: string;
  status: string;
  tableNo: string;
  customer: { name: string; phone: string };
  items: KDSOrderItem[];
  createdAt: string;
  updatedAt: string;
};

type KDSData = {
  placed: KDSOrder[];
  preparing: KDSOrder[];
  ready: KDSOrder[];
  total: number;
  timestamp: string;
};

/* ──────── Constants ──────── */

const POLL_INTERVAL = 3000; // 3 seconds

const STATUS_CONFIG = {
  placed: {
    label: "New Orders",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    headerBg: "bg-blue-500/20",
    icon: Bell,
    nextStatus: "preparing",
    nextLabel: "Start Preparing",
    nextIcon: Flame
  },
  preparing: {
    label: "Preparing",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    headerBg: "bg-amber-500/20",
    icon: Flame,
    nextStatus: "ready",
    nextLabel: "Mark Ready",
    nextIcon: CheckCircle2
  },
  ready: {
    label: "Ready to Serve",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    headerBg: "bg-emerald-500/20",
    icon: UtensilsCrossed,
    nextStatus: "completed",
    nextLabel: "Served",
    nextIcon: CheckCircle2
  }
} as const;

/* ──────── Timer component ──────── */

function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const start = new Date(createdAt).getTime();
      const diff = Math.floor((Date.now() - start) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(`${mins}:${secs.toString().padStart(2, "0")}`);
      setIsUrgent(mins >= 15);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-mono tabular-nums",
        isUrgent ? "text-red-400 animate-pulse" : "text-zinc-400"
      )}
    >
      <Clock className="h-3 w-3" />
      {elapsed}
    </span>
  );
}

/* ──────── Order Card ──────── */

function OrderCard({
  order,
  statusKey,
  onAdvance,
  updating
}: {
  order: KDSOrder;
  statusKey: keyof typeof STATUS_CONFIG;
  onAdvance: (id: string, nextStatus: string) => void;
  updating: string | null;
}) {
  const config = STATUS_CONFIG[statusKey];
  const isUpdating = updating === order.id;

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-sm transition-all duration-200",
        config.borderColor,
        config.bgColor,
        isUpdating && "opacity-50 scale-95"
      )}
    >
      {/* Card Header */}
      <div className={cn("flex items-center justify-between rounded-t-xl px-4 py-3", config.headerBg)}>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-white">
            #{order.tokenNumber || order.orderNumber.split("-").pop()}
          </span>
          {order.tableNo && (
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-white">
              T-{order.tableNo}
            </span>
          )}
          <span className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
            order.type === "takeaway"
              ? "bg-purple-500/30 text-purple-300"
              : "bg-white/10 text-white/70"
          )}>
            {order.type === "takeaway" ? "Takeaway" : "Dine In"}
          </span>
        </div>
        <ElapsedTimer createdAt={order.createdAt} />
      </div>

      {/* Items */}
      <div className="space-y-1 px-4 py-3">
        {order.items.map((item, idx) => (
          <div key={item.id || idx} className="flex items-start gap-2">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white">
              {item.quantity}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{item.name}</p>
              {item.notes && (
                <p className="text-xs text-amber-400 mt-0.5">⚠ {item.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Customer */}
      {order.customer.name && (
        <div className="px-4 pb-2">
          <p className="text-xs text-zinc-500">
            {order.customer.name}
            {order.customer.phone && ` · ${order.customer.phone}`}
          </p>
        </div>
      )}

      {/* Action Button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => onAdvance(order.id, config.nextStatus)}
          disabled={isUpdating}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition-all",
            statusKey === "placed" && "bg-amber-500 text-black hover:bg-amber-400",
            statusKey === "preparing" && "bg-emerald-500 text-white hover:bg-emerald-400",
            statusKey === "ready" && "bg-blue-500 text-white hover:bg-blue-400",
            isUpdating && "opacity-50 cursor-not-allowed"
          )}
        >
          <config.nextIcon className="h-4 w-4" />
          {config.nextLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ──────── Status Column ──────── */

function StatusColumn({
  statusKey,
  orders,
  onAdvance,
  updating
}: {
  statusKey: keyof typeof STATUS_CONFIG;
  orders: KDSOrder[];
  onAdvance: (id: string, nextStatus: string) => void;
  updating: string | null;
}) {
  const config = STATUS_CONFIG[statusKey];
  const Icon = config.icon;

  return (
    <div className="flex flex-1 flex-col min-w-[320px] max-w-[480px]">
      {/* Column Header */}
      <div className={cn("flex items-center justify-between rounded-t-xl px-4 py-3 mb-3", config.headerBg)}>
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", config.color)} />
          <h2 className={cn("text-lg font-bold", config.color)}>{config.label}</h2>
        </div>
        <span className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
          config.bgColor, config.color
        )}>
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto px-1 pb-4 no-scrollbar">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 py-12 text-center">
            <Icon className="h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-sm text-zinc-600">No orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              statusKey={statusKey}
              onAdvance={onAdvance}
              updating={updating}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ──────── Main KDS Page ──────── */

export default function KDSPage() {
  const [data, setData] = useState<KDSData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/kds/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const json = await res.json();
      const newData = json.data as KDSData;

      // Check for new orders (sound notification)
      if (soundEnabled && data && newData.placed.length > data.placed.length) {
        playNotification();
      }

      setData(newData);
      setLastOrderCount(newData.total);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setIsConnected(false);
      setError("Connection lost. Retrying...");
    }
  }, [data, soundEnabled]);

  // Simple notification sound (web audio API)
  const playNotification = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }, []);

  // Polling
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Re-fetch on window focus
  useEffect(() => {
    const handleFocus = () => fetchOrders();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchOrders]);

  // Advance order status
  const handleAdvance = async (orderId: string, nextStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/kds/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update status");
      }

      // Immediately re-fetch to update display
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdating(null);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const currentTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden text-white">
      {/* Top Bar */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Kitchen Display</h1>
            <p className="text-xs text-zinc-500">{currentTime} · {data?.total ?? 0} active orders</p>
          </div>
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-red-400 animate-pulse">{error}</span>
          )}

          <div className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
            isConnected
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          )}>
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? "Live" : "Offline"}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            title={soundEnabled ? "Mute" : "Unmute"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            onClick={fetchOrders}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            title="Fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content — 3 Columns */}
      <main className="flex flex-1 gap-4 overflow-hidden p-4">
        {data ? (
          <>
            <StatusColumn
              statusKey="placed"
              orders={data.placed}
              onAdvance={handleAdvance}
              updating={updating}
            />
            <StatusColumn
              statusKey="preparing"
              orders={data.preparing}
              onAdvance={handleAdvance}
              updating={updating}
            />
            <StatusColumn
              statusKey="ready"
              orders={data.ready}
              onAdvance={handleAdvance}
              updating={updating}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-zinc-600" />
              <p className="mt-4 text-sm text-zinc-500">Loading kitchen orders...</p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Status Bar */}
      <footer className="flex flex-shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-900/80 px-6 py-2 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex h-2 w-2 rounded-full bg-blue-500" />
            New: {data?.placed.length ?? 0}
          </span>
          <span className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex h-2 w-2 rounded-full bg-amber-500" />
            Preparing: {data?.preparing.length ?? 0}
          </span>
          <span className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            Ready: {data?.ready.length ?? 0}
          </span>
        </div>
        <span className="text-xs text-zinc-600">
          Auto-refresh: {POLL_INTERVAL / 1000}s
        </span>
      </footer>
    </div>
  );
}
