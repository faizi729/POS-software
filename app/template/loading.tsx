"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function TemplateLoading() {
  return (
    <main className="section-shell">
      <div className="surface-card overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-3 w-28 rounded-lg" />
              <Skeleton className="h-10 w-[min(560px,90vw)] rounded-2xl" />
              <Skeleton className="h-4 w-[min(520px,88vw)] rounded-xl" />
              <Skeleton className="h-4 w-[min(440px,82vw)] rounded-xl" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-32 rounded-2xl" />
              <Skeleton className="h-11 w-40 rounded-2xl" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 border-t border-border-subtle bg-bg-surface p-6 md:grid-cols-3 md:p-8">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="mt-4 h-4 w-32 rounded-lg" />
              <Skeleton className="mt-2 h-3 w-48 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

