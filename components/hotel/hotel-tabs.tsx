"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

type TabHref = "/hotel" | "/rooms" | "/housekeeping" | "/banquet";

type Tab = { href: TabHref; label: string; match: (path: string) => boolean };

export function HotelTabs({ modules }: { modules: string[] }) {
  const pathname = usePathname();
  const rooms = modules.includes("rooms");
  const banquet = modules.includes("banquet");

  const overview: Tab = { href: "/hotel", label: "Overview", match: (path) => path === "/hotel" };
  const roomsTabs: Tab[] = rooms
    ? [
        {
          href: "/rooms",
          label: "Rooms",
          match: (path) => path.startsWith("/rooms") && !path.includes("setup")
        },
        { href: "/housekeeping", label: "Housekeeping", match: (path) => path.startsWith("/housekeeping") }
      ]
    : [];
  const banquetTabs: Tab[] = banquet
    ? [{ href: "/banquet", label: "Banquet", match: (path) => path.startsWith("/banquet") }]
    : [];

  const tabs: Tab[] = [overview, ...roomsTabs, ...banquetTabs];

  return (
    <nav className="mb-4 flex flex-wrap gap-1">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-text-primary text-white"
                : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
