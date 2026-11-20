/** Shimmer skeleton used by the hotel routes while their data loads. */
export function HotelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <main className="section-shell space-y-4">
      <div className="surface-card p-6">
        <div className="h-4 w-40 animate-shimmer rounded-lg bg-bg-surface" />
        <div className="mt-3 h-8 w-64 animate-shimmer rounded-xl bg-bg-surface" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="surface-card p-3">
            <div className="h-3 w-16 animate-shimmer rounded-md bg-bg-surface" />
            <div className="mt-2 h-6 w-20 animate-shimmer rounded-lg bg-bg-surface" />
          </div>
        ))}
      </div>

      <div className="surface-card space-y-3 p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-10 animate-shimmer rounded-xl bg-bg-surface" />
        ))}
      </div>
    </main>
  );
}
