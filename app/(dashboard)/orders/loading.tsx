"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <main className="section-shell">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.6fr_0.95fr]">
          {/* LEFT */}
          <section className="xl:sticky xl:top-6 xl:self-start">
            <div className="surface-card">
              <div className="border-b border-border-subtle bg-white p-5">
                <Skeleton className="h-3 w-24 rounded-lg" />
                <Skeleton className="mt-2 h-7 w-40 rounded-xl" />
              </div>
              <div className="p-5">
                <Skeleton className="h-9 w-full rounded-2xl" />
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border-subtle bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-28 rounded-lg" />
                          <Skeleton className="h-3 w-44 rounded-lg" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Skeleton className="h-4 w-20 rounded-lg" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CENTER */}
          <section className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 rounded-lg" />
                <Skeleton className="h-9 w-56 rounded-2xl" />
              </div>
              <Skeleton className="hidden h-12 w-36 rounded-2xl md:block" />
            </div>

            <Skeleton className="h-12 w-full rounded-2xl" />

            <div className="surface-card p-4">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-28 rounded-full" />
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-[24px] border border-border-subtle bg-bg-elevated p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="h-6 w-44 rounded-xl" />
                      <Skeleton className="h-4 w-36 rounded-lg" />
                    </div>
                    <Skeleton className="h-7 w-20 rounded-full" />
                  </div>
                  <Skeleton className="mt-8 h-12 w-full rounded-2xl" />
                </div>
              ))}
            </div>
          </section>

          {/* RIGHT */}
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="surface-card overflow-hidden">
              <div className="border-b border-border-subtle bg-white p-5">
                <Skeleton className="h-3 w-24 rounded-lg" />
                <Skeleton className="mt-2 h-8 w-52 rounded-2xl" />
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-11 w-full rounded-2xl" />
                  <Skeleton className="h-11 w-full rounded-2xl" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-[22px] border border-border-subtle bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40 rounded-lg" />
                          <Skeleton className="h-3 w-28 rounded-lg" />
                        </div>
                        <Skeleton className="h-4 w-16 rounded-lg" />
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-12 rounded-full" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
                <Skeleton className="h-36 w-full rounded-[22px]" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-11 w-full rounded-2xl" />
                  <Skeleton className="h-11 w-full rounded-2xl" />
                </div>
                <Skeleton className="h-11 w-full rounded-2xl" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

