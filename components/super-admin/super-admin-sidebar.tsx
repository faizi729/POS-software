"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  LayoutGrid,
  Link2,
  ScrollText,
  Settings,
  Shield,
  Users,
  Zap
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useUiStore } from "@/store/ui-store";

const NAV: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/super-admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/super-admin/billing", label: "Plans & billing", icon: CreditCard },
  { href: "/super-admin/usage", label: "Usage", icon: Zap },
  { href: "/super-admin/integrations", label: "Integrations", icon: Link2 },
  { href: "/super-admin/settings", label: "Global settings", icon: Settings },
  { href: "/super-admin/monitoring", label: "Monitoring", icon: Activity },
  { href: "/super-admin/audit", label: "Audit log", icon: ScrollText },
  { href: "/super-admin/security", label: "Security & roles", icon: Shield },
  { href: "/super-admin/users", label: "Platform users", icon: Users },
  { href: "/super-admin/analytics", label: "Analytics", icon: BarChart3 }
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const startRouteLoading = useUiStore((s) => s.startRouteLoading);

  return (
    <nav className="flex max-h-[calc(100vh-8rem)] flex-col gap-0.5 overflow-y-auto pr-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/super-admin" && pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href as Parameters<typeof Link>[0]["href"]}
            onClick={() => startRouteLoading()}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
              active
                ? "bg-[rgba(15,118,110,0.12)] text-accent-primary"
                : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
