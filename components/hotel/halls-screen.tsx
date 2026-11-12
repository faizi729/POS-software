"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

export type HallRow = { id: string; name: string; capacity: number; baseRate: number };

export function HallsScreen({ halls }: { halls: HallRow[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [rate, setRate] = useState("0");

  async function send(url: string, method: string, body?: unknown) {
    setSaving(true);
    setError(null);
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data?.error || "Request failed");
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-text-primary">Halls</h1>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <section className="surface-card p-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Hall</span>
            <input
              className="mt-1 h-9 w-40 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Capacity</span>
            <input
              type="number"
              min={1}
              className="mt-1 h-9 w-24 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Rate</span>
            <input
              type="number"
              min={0}
              className="mt-1 h-9 w-28 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
            />
          </label>
          <Button
            size="sm"
            disabled={saving || !name.trim()}
            onClick={async () => {
              const done = await send("/api/hotel/halls", "POST", {
                name: name.trim(),
                capacity: Number(capacity) || 1,
                baseRate: Number(rate) || 0
              });
              if (done) setName("");
            }}
          >
            Add hall
          </Button>
        </div>

        <table className="mt-4 w-full text-sm">
          <tbody>
            {halls.length === 0 ? (
              <tr>
                <td className="py-6 text-center text-text-muted" colSpan={4}>
                  No halls
                </td>
              </tr>
            ) : null}
            {halls.map((hall) => (
              <tr key={hall.id} className="border-t border-border-subtle">
                <td className="py-2 font-medium text-text-primary">{hall.name}</td>
                <td className="py-2 text-text-secondary">{hall.capacity} guests</td>
                <td className="py-2 text-text-secondary">{formatCurrency(hall.baseRate)}</td>
                <td className="py-2 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={saving}
                    onClick={() => void send(`/api/hotel/halls?id=${hall.id}`, "DELETE")}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
