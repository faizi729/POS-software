"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the orders screen: Orders / Menu / Order — one surface, three zones. */
export default function OrdersLoading() {
  return (
    <main className="section-shell">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* LEFT — orders */}
          <section className="xl:sticky xl:top-6 xl:self-start">
            <div className="surface-card">
              <div className="border-b border-border-subtle bg-white p-5">
                <Skeleton className="h-7 w-28 rounded-xl" />
              </div>
              <div className="p-4">
                <Skeleton className="h-9 w-full rounded-xl" />
                <div className="mt-3 flex flex-wrap gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
                <div className="mt-3 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border-subtle bg-white p-4">
                      <Skeleton className="h-4 w-28 rounded-lg" />
                      <Skeleton className="mt-2 h-3 w-40 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CENTER — menu */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-6 w-16 rounded-lg" />
              <Skeleton className="h-8 w-12 rounded-full" />
            </div>

            <Skeleton className="h-12 w-full rounded-2xl" />

            <div className="surface-card p-4">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-full" />
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <Skeleton className="h-3 w-20 rounded-lg" />
                      <Skeleton className="h-5 w-40 rounded-lg" />
                    </div>
                    <Skeleton className="h-7 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RIGHT — order */}
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="surface-card overflow-hidden">
              <div className="border-b border-border-subtle bg-white p-5">
                <Skeleton className="h-6 w-28 rounded-xl" />
              </div>
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-11 w-full rounded-2xl" />
                  <Skeleton className="h-11 w-full rounded-2xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-11 w-full rounded-2xl" />
                  <Skeleton className="h-11 w-full rounded-2xl" />
                </div>
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-11 w-full rounded-2xl" />
                  <Skeleton className="h-11 w-full rounded-2xl" />
                </div>
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
