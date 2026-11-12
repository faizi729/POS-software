"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export type MaintenanceRow = {
  id: string;
  roomId: string;
  roomNumber: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assignee: string;
  openedAt: string;
};

export function MaintenanceScreen({
  tickets,
  rooms
}: {
  tickets: MaintenanceRow[];
  rooms: Array<{ id: string; number: string; status: string }>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");

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
      <h1 className="text-xl font-semibold text-text-primary">Maintenance</h1>
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <section className="surface-card p-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Room</span>
            <select
              className="mt-1 h-9 w-28 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.number}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Issue</span>
            <input
              className="mt-1 h-9 w-64 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Priority</span>
            <select
              className="mt-1 h-9 w-28 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              {["low", "medium", "high"].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            disabled={saving || !title.trim() || !roomId}
            onClick={async () => {
              const done = await send("/api/hotel/maintenance", "POST", {
                roomId,
                title: title.trim(),
                priority
              });
              if (done) setTitle("");
            }}
          >
            Open ticket
          </Button>
        </div>

        <table className="mt-4 w-full text-sm">
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td className="py-6 text-center text-text-muted" colSpan={4}>
                  No open tickets
                </td>
              </tr>
            ) : null}
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-t border-border-subtle">
                <td className="py-2 font-medium text-text-primary">{ticket.roomNumber}</td>
                <td className="py-2 text-text-secondary">
                  {ticket.title}
                  <span className="ml-2 text-xs uppercase tracking-wide text-text-muted">{ticket.priority}</span>
                </td>
                <td className="py-2 text-text-secondary">{ticket.status.replace("_", " ")}</td>
                <td className="py-2 text-right">
                  {ticket.status === "done" ? null : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={saving}
                      onClick={() =>
                        void send(`/api/hotel/maintenance/${ticket.id}`, "PATCH", {
                          status: ticket.status === "open" ? "in_progress" : "done"
                        })
                      }
                    >
                      {ticket.status === "open" ? "Start" : "Done"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
