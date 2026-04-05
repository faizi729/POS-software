"use client";
import { Loader2 } from "lucide-react";

export default function AppLoading() {
	return (
		<main className="flex min-h-screen items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="label-text">Loading...</p>
			</div>
		</main>
	);
}

