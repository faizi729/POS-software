"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="surface-card p-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-lg" />
            <Skeleton className="h-8 w-56 rounded-2xl" />
            <Skeleton className="h-4 w-72 rounded-xl" />
          </div>

          <div className="mt-6 space-y-3">
            <Skeleton className="h-11 w-full rounded-2xl" />
            <Skeleton className="h-11 w-full rounded-2xl" />
            <Skeleton className="h-11 w-full rounded-2xl" />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  );
}

