"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
	return (
		<main className="section-shell">
			<div className="mx-auto max-w-3xl">
				<div className="surface-card p-6">
					<div className="flex items-center justify-between gap-4">
						<div className="space-y-2">
							<Skeleton className="h-4 w-40 rounded-lg" />
							<Skeleton className="h-7 w-64 rounded-xl" />
						</div>
						<Skeleton className="h-10 w-28 rounded-xl" />
					</div>
					<div className="mt-6 grid gap-3 md:grid-cols-2">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
								<div className="flex items-start justify-between gap-4">
									<div className="space-y-2">
										<Skeleton className="h-4 w-20 rounded-lg" />
										<Skeleton className="h-5 w-48 rounded-lg" />
									</div>
									<Skeleton className="h-6 w-16 rounded-full" />
								</div>
								<Skeleton className="mt-4 h-10 w-full rounded-2xl" />
							</div>
						))}
					</div>
				</div>
			</div>
		</main>
	);
}

