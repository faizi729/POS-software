"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="section-shell">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-lg" />
            <Skeleton className="h-9 w-64 rounded-2xl" />
          </div>
          <Skeleton className="h-10 w-36 rounded-2xl" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface-card p-5">
              <Skeleton className="h-3 w-24 rounded-lg" />
              <Skeleton className="mt-3 h-7 w-32 rounded-xl" />
              <Skeleton className="mt-4 h-10 w-full rounded-2xl" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="surface-card p-5">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-44 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-52 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-5">
            <Skeleton className="h-4 w-40 rounded-lg" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36 rounded-lg" />
                      <Skeleton className="h-3 w-24 rounded-lg" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

