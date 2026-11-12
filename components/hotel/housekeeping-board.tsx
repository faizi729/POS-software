"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export type BoardTask = {
  id: string;
  roomNumber: string;
  roomStatus: string;
  status: string;
  assignee: string;
  note: string;
  createdAt: string;
};

export type DirtyRoom = { id: string; number: string };

const statusLabel: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done"
};

export function HousekeepingBoard({
  tasks,
  dirtyRooms
}: {
  tasks: BoardTask[];
  dirtyRooms: DirtyRoom[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(id: string, status: string) {
    setBusy(id);
    setError(null);
    const response = await fetch(`/api/hotel/housekeeping/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) setError(data?.error || "Update failed");
    else router.refresh();
  }

  async function create(roomId: string) {
    setBusy(roomId);
    setError(null);
    const response = await fetch("/api/hotel/housekeeping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId })
    });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) setError(data?.error || "Could not create task");
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Housekeeping</h1>
        <Button variant="secondary" size="sm" onClick={() => router.push("/rooms")}>
          Calendar
        </Button>
      </div>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      {dirtyRooms.length ? (
        <section className="surface-card p-4">
          <p className="text-sm font-semibold text-text-primary">Dirty rooms</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dirtyRooms.map((room) => (
              <Button
                key={room.id}
                size="sm"
                variant="secondary"
                disabled={busy === room.id}
                onClick={() => void create(room.id)}
              >
                {room.number}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="surface-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs text-text-muted">
              <th className="px-4 py-2 font-semibold">Room</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold">Assignee</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={4}>
                  No tasks
                </td>
              </tr>
            ) : null}
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-border-subtle">
                <td className="px-4 py-2 font-medium text-text-primary">{task.roomNumber}</td>
                <td className="px-4 py-2 text-text-secondary">{statusLabel[task.status] ?? task.status}</td>
                <td className="px-4 py-2 text-text-muted">{task.assignee || "-"}</td>
                <td className="px-4 py-2 text-right">
                  {task.status === "pending" ? (
                    <Button size="sm" disabled={busy === task.id} onClick={() => void patch(task.id, "in_progress")}>
                      Start
                    </Button>
                  ) : null}
                  {task.status !== "done" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="ml-2"
                      disabled={busy === task.id}
                      onClick={() => void patch(task.id, "done")}
                    >
                      Done
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
