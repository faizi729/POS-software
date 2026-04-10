"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <main className="section-shell">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="surface-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded-lg" />
              <Skeleton className="h-9 w-72 rounded-2xl" />
              <Skeleton className="h-4 w-[min(520px,90vw)] rounded-xl" />
            </div>
            <Skeleton className="h-11 w-40 rounded-2xl" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="surface-card p-6">
            <Skeleton className="h-4 w-44 rounded-lg" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
                  <Skeleton className="h-4 w-56 rounded-lg" />
                  <Skeleton className="mt-2 h-3 w-72 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6">
            <Skeleton className="h-4 w-36 rounded-lg" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-11 w-full rounded-2xl" />
              <Skeleton className="h-11 w-full rounded-2xl" />
              <Skeleton className="h-11 w-full rounded-2xl" />
              <Skeleton className="mt-2 h-12 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

