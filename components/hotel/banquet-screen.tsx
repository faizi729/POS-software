"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils/format";

export type BanquetHall = { id: string; name: string; capacity: number; baseRate: number };

export type BanquetRow = {
  id: string;
  hallId: string;
  date: string;
  slot: string;
  eventType: string;
  guestCount: number;
  status: string;
  totalAmount: number;
  advancePaid: number;
  balance: number;
  perPlate: number;
};

const DAY_MS = 86_400_000;
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const addIsoDays = (iso: string, days: number) =>
  isoDate(new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * DAY_MS));

const slotTone: Record<string, string> = {
  morning: "bg-amber-100 text-amber-900 border-amber-200",
  evening: "bg-accent-primary/10 text-accent-primary border-accent-primary/25",
  full_day: "bg-emerald-100 text-emerald-900 border-emerald-200"
};

export function BanquetScreen({
  halls,
  bookings,
  currency,
  today
}: {
  halls: BanquetHall[];
  bookings: BanquetRow[];
  currency: string;
  today: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState<{ hallId: string; date: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dates = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => {
        const day = new Date(new Date(`${today}T00:00:00Z`).getTime() + index * DAY_MS);
        return {
          iso: isoDate(day),
          day: day.getUTCDate(),
          weekday: day.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" })
        };
      }),
    [today]
  );

  const byHallDate = useMemo(() => {
    const map = new Map<string, BanquetRow[]>();
    for (const booking of bookings) {
      const key = `${booking.hallId}|${booking.date}`;
      const list = map.get(key) ?? [];
      list.push(booking);
      map.set(key, list);
    }
    return map;
  }, [bookings]);

  const selected = bookings.find((booking) => booking.id === selectedId) ?? null;

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
    setSelectedId(null);
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Banquet</h1>
        <Button size="sm" onClick={() => setCreating({ hallId: halls[0]?.id ?? "", date: today })}>
          New booking
        </Button>
      </div>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <div className="surface-card overflow-x-auto p-0">
        <div
          className="min-w-max"
          style={{ display: "grid", gridTemplateColumns: `160px repeat(${dates.length}, minmax(58px, 1fr))` }}
        >
          <div className="sticky left-0 z-10 border-b border-border-subtle bg-white px-3 py-2 text-xs font-semibold text-text-muted">
            Hall
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

          {halls.map((hall) => (
            <div key={hall.id} className="contents">
              <div className="sticky left-0 z-10 border-b border-border-subtle bg-white px-3 py-2">
                <p className="text-sm font-semibold text-text-primary">{hall.name}</p>
                <p className="text-xs text-text-muted">{hall.capacity} guests</p>
              </div>
              {dates.map((date) => {
                const list = byHallDate.get(`${hall.id}|${date.iso}`) ?? [];
                return (
                  <div
                    key={`${hall.id}-${date.iso}`}
                    className="flex min-h-11 flex-col gap-0.5 border-b border-l border-border-subtle bg-white p-0.5"
                  >
                    {list.map((booking) => (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() => setSelectedId(booking.id)}
                        title={`${booking.eventType} - ${booking.guestCount} guests`}
                        className={`truncate rounded-md border px-1 py-0.5 text-left text-[10px] font-semibold ${
                          slotTone[booking.slot] ?? slotTone.evening
                        }`}
                      >
                        {booking.slot === "full_day" ? "Full" : booking.slot === "morning" ? "AM" : "PM"}
                      </button>
                    ))}
                    {list.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setCreating({ hallId: hall.id, date: date.iso })}
                        className="h-full min-h-9 rounded-md text-[11px] text-text-muted transition hover:bg-bg-surface"
                        aria-label={`Book ${hall.name} ${date.iso}`}
                      >
                        +
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-semibold text-text-primary">
              {selected.eventType || "Event"} - {selected.guestCount} guests
            </p>
            <p className="text-sm text-text-secondary">
              {selected.date} - {selected.slot.replace("_", " ")} - {selected.status} -{" "}
              {formatCurrency(selected.totalAmount)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.status === "tentative" ? (
              <Button
                size="sm"
                disabled={saving}
                onClick={() =>
                  void send(`/api/hotel/banquet-bookings/${selected.id}`, "PATCH", { status: "confirmed" })
                }
              >
                Confirm
              </Button>
            ) : null}
            {selected.status !== "completed" ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={saving}
                onClick={() =>
                  void send(`/api/hotel/banquet-bookings/${selected.id}`, "PATCH", { status: "completed" })
                }
              >
                Complete
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                window.open(`/api/hotel/banquet-bookings/${selected.id}/quote`, "_blank", "noopener")
              }
            >
              Quote
            </Button>
            {selected.status !== "completed" ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={() =>
                  void send(`/api/hotel/banquet-bookings/${selected.id}`, "PATCH", { status: "cancelled" })
                }
              >
                Cancel
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}

      <Modal open={Boolean(creating)} title="New booking" onClose={() => setCreating(null)}>
        {creating ? (
          <BookingForm
            halls={halls}
            initialHallId={creating.hallId}
            initialDate={creating.date}
            currency={currency}
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

function BookingForm({
  halls,
  initialHallId,
  initialDate,
  currency,
  onSaving,
  onError,
  onDone
}: {
  halls: BanquetHall[];
  initialHallId: string;
  initialDate: string;
  currency: string;
  onSaving: (value: boolean) => void;
  onError: (value: string | null) => void;
  onDone: () => void;
}) {
  const [hallId, setHallId] = useState(initialHallId);
  const [date, setDate] = useState(initialDate);
  const [slot, setSlot] = useState("evening");
  const [eventType, setEventType] = useState("");
  const [guestCount, setGuestCount] = useState("100");
  const [perPlate, setPerPlate] = useState("0");
  const [advance, setAdvance] = useState("0");

  const hall = halls.find((item) => item.id === hallId);
  const estimate = (hall?.baseRate ?? 0) + (Number(perPlate) || 0) * (Number(guestCount) || 0);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    onSaving(true);
    onError(null);
    const response = await fetch("/api/hotel/banquet-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hallId,
        date,
        slot,
        eventType,
        guestCount: Number(guestCount) || 1,
        perPlate: Number(perPlate) || 0,
        advancePaid: Number(advance) || 0,
        status: "confirmed"
      })
    });
    const data = await response.json().catch(() => ({}));
    onSaving(false);
    if (!response.ok) {
      onError(data?.error || "Could not create booking");
      return;
    }
    onDone();
  }

  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
      <label className="space-y-1 text-sm sm:col-span-2">
        <span className="font-medium text-text-secondary">Hall</span>
        <select
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={hallId}
          onChange={(event) => setHallId(event.target.value)}
        >
          {halls.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} - {item.capacity} guests
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-text-secondary">Date</span>
        <input
          type="date"
          required
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-text-secondary">Slot</span>
        <select
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={slot}
          onChange={(event) => setSlot(event.target.value)}
        >
          <option value="morning">Morning</option>
          <option value="evening">Evening</option>
          <option value="full_day">Full day</option>
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-text-secondary">Event</span>
        <input
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={eventType}
          onChange={(event) => setEventType(event.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-text-secondary">Guests</span>
        <input
          type="number"
          min={1}
          required
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={guestCount}
          onChange={(event) => setGuestCount(event.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-text-secondary">Per plate</span>
        <input
          type="number"
          min={0}
          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
          value={perPlate}
          onChange={(event) => setPerPlate(event.target.value)}
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
      <p className="text-sm text-text-secondary sm:col-span-2">
        Total {formatCurrency(estimate)}
      </p>
      <button
        type="submit"
        className="h-10 rounded-xl bg-accent-primary px-4 text-sm font-semibold text-white sm:col-span-2"
      >
        Create booking
      </button>
    </form>
  );
}
