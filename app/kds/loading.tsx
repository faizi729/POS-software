"use client";

export default function KdsLoading() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-white/10" />
            <div className="h-8 w-56 rounded bg-white/10" />
          </div>
          <div className="h-10 w-36 rounded bg-white/10" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded bg-white/10" />
                  <div className="h-5 w-44 rounded bg-white/10" />
                </div>
                <div className="h-6 w-16 rounded-full bg-white/10" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-white/10" />
                <div className="h-3 w-5/6 rounded bg-white/10" />
                <div className="h-3 w-4/6 rounded bg-white/10" />
              </div>
              <div className="mt-5 h-10 w-full rounded-xl bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

