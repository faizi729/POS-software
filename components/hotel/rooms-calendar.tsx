"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils/format";

export type CalendarRoom = {
  id: string;
  number: string;
  floor: number;
  status: string;
  roomTypeName: string;
  baseRate: number;
};

export type CalendarReservation = {
  id: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  status: string;
  rate: number;
};

const DAY_MS = 86_400_000;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const addIsoDays = (iso: string, days: number) =>
  isoDate(new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * DAY_MS));

function buildDays(start: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(start.getTime() + index * DAY_MS);
    return {
      iso: isoDate(day),
      day: day.getUTCDate(),
      weekday: day.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" })
    };
  });
}

const statusTone: Record<string, string> = {
  tentative: "bg-amber-100 text-amber-900 border-amber-200",
  confirmed: "bg-accent-primary/10 text-accent-primary border-accent-primary/25",
  checked_in: "bg-emerald-100 text-emerald-900 border-emerald-200",
  checked_out: "bg-bg-surface text-text-muted border-border-subtle"
};

export function RoomsCalendar({
  rooms,
  reservations,
  currency,
  today
}: {
  rooms: CalendarRoom[];
  reservations: CalendarReservation[];
  currency: string;
  today: string;
}) {
  const router = useRouter();
  const [days, setDays] = useState(14);
  const [creating, setCreating] = useState<{ roomId: string; date: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dates = useMemo(() => buildDays(new Date(`${today}T00:00:00Z`), days), [today, days]);
  const selected = reservations.find((reservation) => reservation.id === selectedId) ?? null;

  const byRoom = useMemo(() => {
    const map = new Map<string, CalendarReservation[]>();
    for (const reservation of reservations) {
      const list = map.get(reservation.roomId) ?? [];
      list.push(reservation);
      map.set(reservation.roomId, list);
    }
    return map;
  }, [reservations]);

  const covers = (reservation: CalendarReservation, iso: string) =>
    reservation.checkIn <= iso && iso < reservation.checkOut;

  async function act(action: "check_in" | "check_out" | "cancel") {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/hotel/reservations/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data?.error || "Action failed");
    else {
      setSelectedId(null);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Rooms</h1>
        <div className="flex items-center gap-2">
          <select
            aria-label="Days"
            className="h-9 rounded-xl border border-border-subtle bg-white px-2.5 text-xs font-semibold text-text-primary outline-none"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={7}>7</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
          </select>
          <Button size="sm" onClick={() => setCreating({ roomId: rooms[0]?.id ?? "", date: today })}>
            New reservation
          </Button>
          <Button size="sm" variant="secondary" onClick={() => router.push("/housekeeping")}>
            Housekeeping
          </Button>
          <Button size="sm" variant="ghost" onClick={() => router.push("/rooms/setup")}>
            Setup
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <div className="surface-card overflow-x-auto p-0">
        <div
          className="min-w-max"
          style={{
            display: "grid",
            gridTemplateColumns: `160px repeat(${dates.length}, minmax(46px, 1fr))`
          }}
        >
          <div className="sticky left-0 z-10 border-b border-border-subtle bg-white px-3 py-2 text-xs font-semibold text-text-muted">
            Room
          </div>
          {dates.map((date) => (
            <div
              key={date.iso}
              className={`border-b border-l border-border-subtle px-1 py-2 text-center text-xs ${
                date.iso === today
                  ? "bg-accent-primary/10 font-semibold text-accent-primary"
                  : "text-text-muted"
              }`}
            >
              <div>{date.weekday}</div>
              <div className="text-sm text-text-primary">{date.day}</div>
            </div>
          ))}

          {rooms.map((room) => {
            const list = byRoom.get(room.id) ?? [];
            return (
              <div key={room.id} className="contents">
                <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-border-subtle bg-white px-3 py-2">
                  <span className="text-sm font-semibold text-text-primary">{room.number}</span>
                  <span className="truncate text-xs text-text-muted">{room.roomTypeName}</span>
                </div>
                {dates.map((date) => {
                  const stay = list.find((reservation) => covers(reservation, date.iso));
                  return (
                    <button
                      key={`${room.id}-${date.iso}`}
                      type="button"
                      onClick={() =>
                        stay ? setSelectedId(stay.id) : setCreating({ roomId: room.id, date: date.iso })
                      }
                      className="h-11 border-b border-l border-border-subtle bg-white p-0.5 text-left transition hover:bg-bg-surface"
                      aria-label={stay ? `${stay.guestName} ${date.iso}` : `Book ${room.number} ${date.iso}`}
                    >
                      {stay && stay.checkIn === date.iso ? (
                        <span
                          className={`flex h-full items-center rounded-md border px-1.5 text-[11px] font-semibold ${
                            statusTone[stay.status] ?? statusTone.confirmed
                          }`}
                        >
                          <span className="truncate">{stay.guestName}</span>
                        </span>
                      ) : stay ? (
                        <span
                          className={`block h-full rounded-md border ${
                            statusTone[stay.status] ?? statusTone.confirmed
                          }`}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-semibold text-text-primary">
              {selected.guestName} - Room {selected.roomNumber}
            </p>
            <p className="text-sm text-text-secondary">
              {selected.checkIn} - {selected.checkOut} - {selected.status.replace("_", " ")}
              {formatCurrency(selected.rate)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.status === "tentative" || selected.status === "confirmed" ? (
              <>
                <Button size="sm" disabled={saving} onClick={() => void act("check_in")}>
                  Check in
                </Button>
                <Button size="sm" variant="secondary" disabled={saving} onClick={() => void act("cancel")}>
                  Cancel
                </Button>
              </>
            ) : null}
            {selected.status === "checked_in" ? (
              <Button size="sm" disabled={saving} onClick={() => void act("check_out")}>
                Check out
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(creating)}
        title="New reservation"
        onClose={() => setCreating(null)}
        footer={
          <Button form="reservation-form" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Create"}
          </Button>
        }
      >
        {creating ? (
          <ReservationForm
            rooms={rooms}
            initialRoomId={creating.roomId}
            initialDate={creating.date}
            onSaving={setSaving}
            onError={setError}
            onDone={() => {
              setCreating(null);
              router.refresh();
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function ReservationForm({
  rooms,
  initialRoomId,
  initialDate,
  onSaving,
  onError,
  onDone
}: {
  rooms: CalendarRoom[];
  initialRoomId: string;
  initialDate: string;
  onSaving: (value: boolean) => void;
  onError: (value: string | null) => void;
  onDone: () => void;
}) {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [checkIn, setCheckIn] = useState(initialDate);
  const [checkOut, setCheckOut] = useState(addIsoDays(initialDate, 1));
  const [advance, setAdvance] = useState("0");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    onSaving(true);
    onError(null);
    const response = await fetch("/api/hotel/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        guest: { name, phone, idNumber },
        checkIn,
        checkOut,
        status: "confirmed",
        advancePaid: Number(advance) || 0
      })
    });
    const data = await response.json().catch(() => ({}));
    onSaving(false);
    if (!response.ok) {
      onError(data?.error || "Could not create reservation");
      return;
    }
    onDone();
  }

  return (
    <form id="reservation-form" className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
      <label className="space-y-1 text-sm sm:col-span-2">
        <span className="font-medium text-text-secondary">Room</span>
        <select
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={roomId}
          onChange={(event) => setRoomId(event.target.value)}
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.number} / {room.roomTypeName}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-text-secondary">Guest</span>
        <input
          required
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-text-secondary">Phone</span>
        <input
          required
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-text-secondary">ID number</span>
        <input
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={idNumber}
          onChange={(event) => setIdNumber(event.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-text-secondary">Advance</span>
        <input
          type="number"
          min={0}
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={advance}
          onChange={(event) => setAdvance(event.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-text-secondary">Check-in</span>
        <input
          type="date"
          required
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={checkIn}
          onChange={(event) => setCheckIn(event.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-text-secondary">Check-out</span>
        <input
          type="date"
          required
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={checkOut}
          onChange={(event) => setCheckOut(event.target.value)}
        />
      </label>
    </form>
  );
}

