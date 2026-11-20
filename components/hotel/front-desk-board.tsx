"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export type BoardReservation = {
  id: string;
  guestName: string;
  roomId: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  status: string;
  nights: number;
};

export type BoardRoom = { id: string; number: string; status: string };

type FreeRoom = { id: string; number: string; floor: number; roomTypeName: string; baseRate: number };

export function FrontDeskBoard({
  arrivals,
  departures,
  dirtyRooms
}: {
  arrivals: BoardReservation[];
  departures: BoardReservation[];
  dirtyRooms: BoardRoom[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<BoardReservation | null>(null);
  const [freeRooms, setFreeRooms] = useState<FreeRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  async function call(url: string, method: string, body?: unknown) {
    setError(null);
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Request failed");
      return false;
    }
    return true;
  }

  async function act(reservation: BoardReservation, action: "check_in" | "check_out") {
    setSaving(reservation.id);
    const done = await call(`/api/hotel/reservations/${reservation.id}`, "PATCH", { action });
    setSaving(null);
    if (done) router.refresh();
  }

  async function openAssign(reservation: BoardReservation) {
    setAssigning(reservation);
    setLoadingRooms(true);
    setFreeRooms([]);
    setError(null);
    const query = new URLSearchParams({
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      ignoreReservationId: reservation.id
    });
    const response = await fetch(`/api/hotel/rooms/available?${query.toString()}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    setLoadingRooms(false);
    if (!response.ok) {
      setError(data?.error || "Could not load rooms");
      return;
    }
    setFreeRooms(data?.data ?? []);
  }

  async function assign(room: FreeRoom) {
    if (!assigning) return;
    setSaving(assigning.id);
    const done = await call(`/api/hotel/reservations/${assigning.id}`, "PATCH", {
      action: "move",
      roomId: room.id
    });
    setSaving(null);
    if (done) {
      setAssigning(null);
      router.refresh();
    }
  }

  async function markClean(room: BoardRoom) {
    setSaving(room.id);
    const done = await call(`/api/hotel/rooms/${room.id}`, "PATCH", { status: "available" });
    setSaving(null);
    if (done) router.refresh();
  }
  // VIEW
  return (
    <div className="space-y-4">
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="surface-card p-4">
          <h2 className="text-sm font-semibold text-text-primary">Arrivals</h2>
          <ul className="mt-2 space-y-2">
            {arrivals.length === 0 ? <li className="py-4 text-sm text-text-muted">None left</li> : null}
            {arrivals.map((reservation) => (
              <li
                key={reservation.id}
                className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{reservation.guestName}</p>
                  <p className="text-xs text-text-muted">
                    {reservation.nights}n · Room {reservation.roomNumber || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={saving === reservation.id}
                    onClick={() => void openAssign(reservation)}
                  >
                    Assign
                  </Button>
                  <Button size="sm" disabled={saving === reservation.id} onClick={() => void act(reservation, "check_in")}>
                    Check in
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-4">
          <h2 className="text-sm font-semibold text-text-primary">Due out</h2>
          <ul className="mt-2 space-y-2">
            {departures.length === 0 ? <li className="py-4 text-sm text-text-muted">None today</li> : null}
            {departures.map((reservation) => (
              <li
                key={reservation.id}
                className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{reservation.guestName}</p>
                  <p className="text-xs text-text-muted">Room {reservation.roomNumber}</p>
                </div>
                <Button size="sm" disabled={saving === reservation.id} onClick={() => void act(reservation, "check_out")}>
                  Check out
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-4">
          <h2 className="text-sm font-semibold text-text-primary">Dirty rooms</h2>
          <ul className="mt-2 space-y-2">
            {dirtyRooms.length === 0 ? <li className="py-4 text-sm text-text-muted">All clean</li> : null}
            {dirtyRooms.map((room) => (
              <li key={room.id} className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2">
                <p className="text-sm font-medium text-text-primary">Room {room.number}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={saving === room.id}
                  onClick={() => void markClean(room)}
                >
                  Clean
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {assigning ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Assign room</h3>
              <button className="text-sm text-text-muted" onClick={() => setAssigning(null)}>
                Close
              </button>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {assigning.guestName} · {assigning.checkIn} → {assigning.checkOut}
            </p>
            <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {loadingRooms ? <li className="py-4 text-sm text-text-muted">Loading…</li> : null}
              {!loadingRooms && freeRooms.length === 0 ? (
                <li className="py-4 text-sm text-text-muted">No free room for those dates</li>
              ) : null}
              {freeRooms.map((room) => (
                <li key={room.id}>
                  <button
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-bg-surface"
                    disabled={saving === assigning.id}
                    onClick={() => void assign(room)}
                  >
                    <span className="font-medium text-text-primary">
                      {room.number} · {room.roomTypeName}
                    </span>
                    <span className="text-text-muted">Floor {room.floor}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
