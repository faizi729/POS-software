"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function SuperAdminProtectedLoading() {
  return (
    <div className="space-y-6">
      <div className="surface-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-lg" />
            <Skeleton className="h-8 w-60 rounded-2xl" />
          </div>
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </div>
      </div>

      <div className="surface-card p-5">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-44 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border-subtle">
          <div className="grid grid-cols-4 gap-0 border-b border-border-subtle bg-bg-surface px-4 py-3">
            <Skeleton className="h-3 w-20 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-lg" />
            <Skeleton className="h-3 w-12 rounded-lg justify-self-end" />
          </div>
          <div className="divide-y divide-border-subtle">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 px-4 py-4">
                <Skeleton className="h-4 w-48 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-xl justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

