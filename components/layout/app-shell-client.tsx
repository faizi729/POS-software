"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Brain,
  ChefHat,
  ChevronRight,
  CreditCard,
  LayoutTemplate,
  LogOut,
  Menu,
  MenuSquare,
  MessageCircle,
  Package,
  PieChart,
  ReceiptText,
  Settings,
  Store,
  Users,
  X
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useUiStore } from "@/store/ui-store";

type NavHref =
  | "/dashboard"
  | "/orders"
  | "/kitchen"
  | "/menu"
  | "/inventory"
  | "/payments"
  | "/crm"
  | "/insights"
  | "/whatsapp"
  | "/reports"
  | "/templates";

type NavigationItem = {
  href: NavHref;
  label: string;
  badge: string;
};

const icons: Record<NavHref, React.ComponentType<{ className?: string }>> = {
  "/dashboard": BarChart3,
  "/orders": ReceiptText,
  "/kitchen": ChefHat,
  "/menu": MenuSquare,
  "/inventory": Package,
  "/payments": CreditCard,
  "/crm": Users,
  "/insights": Brain,
  "/whatsapp": MessageCircle,
  "/reports": PieChart,
  "/templates": LayoutTemplate,
};

function NavLinks({
  navigation,
  pathname,
  onNavigate
}: {
  navigation: readonly NavigationItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const startRouteLoading = useUiStore((s) => s.startRouteLoading);
  return (
    <nav className="space-y-2">
      {navigation.map(({ href, label, badge }) => {
        const isActive = pathname === href;
        const Icon = icons[href];

        return (
          <Link
            key={href}
            href={href}
            onClick={() => {
              if (!isActive) startRouteLoading();
              onNavigate?.();
            }}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
              isActive
                ? "bg-accent-primary text-white shadow-[0_10px_24px_rgba(15,118,110,0.22)]"
                : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
            )}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                isActive ? "bg-white/16 text-white" : "bg-bg-surface text-text-primary"
              )}
            >
              {badge}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShellClient({
  children,
  navigation,
  restaurantName,
  restaurantSlug,
  userName,
  userRole
}: {
  children: React.ReactNode;
  navigation: readonly NavigationItem[];
  restaurantName: string;
  restaurantSlug: string;
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const startRouteLoading = useUiStore((s) => s.startRouteLoading);

  return (
    <div className="min-h-screen">
      <div className="section-shell">
        {isDrawerOpen ? (
          <div
            className="fixed inset-0 z-50 bg-[rgba(28,26,23,0.4)] backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          >
            <div className="ml-auto flex h-full w-full max-w-[320px] flex-col bg-bg-elevated p-4 shadow-[0_20px_60px_rgba(28,26,23,0.2)]">
              {/* stop propagation so clicks inside the drawer don't close it */}
              <div onClick={(e) => e.stopPropagation()} className="flex h-full flex-col">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="label-text">Navigation</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-xl border border-border-subtle bg-white shadow-soft">
                      <Image src="/logo.png" alt="Rasoio" width={20} height={20} className="select-none" />
                    </span>
                    <h3 className="leading-none">{restaurantName}</h3>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto">
                <NavLinks
                  navigation={navigation}
                  pathname={pathname}
                  onNavigate={() => setIsDrawerOpen(false)}
                />

                <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
                  <p className="label-text">Workspace</p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">{restaurantSlug}</p>
                  <p className="mt-1">Settings and account controls stay one tap away.</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border-subtle pt-4">
                <Link
                  href="/settings"
                  onClick={() => {
                    startRouteLoading();
                    setIsDrawerOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-text-secondary transition hover:bg-bg-surface hover:text-text-primary"
                >
                  <span className="flex items-center gap-3">
                    <Settings className="h-4 w-4" />
                    Settings
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-text-secondary transition hover:bg-bg-surface hover:text-text-primary"
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                    } catch {}
                    window.location.href = "/login";
                  }}
                >
                  <span className="flex items-center gap-3">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6">
          <main className="space-y-6">
            <header className="surface-card flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
              <div className="flex items-start gap-3">
                <div className="grid size-11 place-items-center rounded-2xl border border-border-subtle bg-bg-elevated shadow-soft">
                  <Image
                    src="/logo.png"
                    alt="Rasoio"
                    width={28}
                    height={28}
                    className="select-none"
                    priority
                  />
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setIsDrawerOpen(true)}
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <p className="label-text">{restaurantName}</p>
                  <h1 className="mt-1">Operations hub</h1>
                  <p className="mt-1">
                    {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                    {" · "}Fast service flow, menu control, and same-day visibility.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 min-w-11 items-center justify-center rounded-full border border-border-subtle bg-bg-surface px-3 text-sm font-semibold text-text-primary">
                  {userName
                    .split(" ")
                    .map((item) => item[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              </div>
            </header>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
