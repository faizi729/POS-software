"use client";

import Link from "next/link";

import { useUiStore } from "@/store/ui-store";

export function SuperAdminSideLink({
  href,
  icon: Icon,
  label
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  const startRouteLoading = useUiStore((s) => s.startRouteLoading);
  return (
    <Link
      href={href as Parameters<typeof Link>[0]["href"]}
      onClick={() => startRouteLoading()}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary transition hover:bg-bg-surface hover:text-text-primary"
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

