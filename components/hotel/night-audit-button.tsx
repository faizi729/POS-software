"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

/** Closes the business date (posts missing room charges, locks the totals). */
export function NightAuditButton({ closed, date }: { closed: boolean; date: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        disabled={saving || closed}
        onClick={async () => {
          setSaving(true);
          setError(null);
          const response = await fetch("/api/hotel/night-audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date })
          });
          const data = await response.json().catch(() => ({}));
          setSaving(false);
          if (!response.ok) {
            setError(data?.error || "Could not close the date");
            return;
          }
          router.refresh();
        }}
      >
        {closed ? "Closed" : saving ? "Closing…" : "Close date"}
      </Button>
      {error ? <span className="text-sm font-semibold text-danger">{error}</span> : null}
    </div>
  );
}
