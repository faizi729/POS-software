"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function SuperAdminLoading() {
  return (
    <main className="section-shell">
      <div className="mx-auto max-w-4xl">
        <div className="surface-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded-lg" />
              <Skeleton className="h-9 w-64 rounded-2xl" />
            </div>
            <Skeleton className="h-10 w-32 rounded-2xl" />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
                <Skeleton className="h-4 w-40 rounded-lg" />
                <Skeleton className="mt-2 h-3 w-56 rounded-lg" />
                <Skeleton className="mt-4 h-10 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

