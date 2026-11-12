"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

type RoomType = {
  id: string;
  name: string;
  maxOccupancy: number;
  amenities: string[];
  nightlyRate: number;
  total: number;
  tax: number;
  roomsLeft: number;
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
};

const iso = (date: Date) => date.toISOString().slice(0, 10);
const plusDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

export function BookingForm({ slug, hotel }: { slug: string; hotel: string }) {
  const [checkIn, setCheckIn] = useState(iso(plusDays(new Date(), 1)));
  const [checkOut, setCheckOut] = useState(iso(plusDays(new Date(), 3)));
  const [adults, setAdults] = useState("2");
  const [types, setTypes] = useState<RoomType[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const query = new URLSearchParams({ checkIn, checkOut, adults });
    const response = await fetch(`/api/public/${slug}/availability?${query.toString()}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Could not load rooms");
      setTypes([]);
      return;
    }
    const list: RoomType[] = data?.data?.roomTypes ?? [];
    setTypes(list);
    setSelected((current) => (list.some((type) => type.id === current) ? current : list[0]?.id ?? ""));
  }, [slug, checkIn, checkOut, adults]);

  useEffect(() => {
    void load();
  }, [load]);

  const room = types.find((type) => type.id === selected);

  async function pay(reservationId: string, orderId: string, keyId: string, amount: number) {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    await new Promise((resolve) => {
      script.onload = resolve;
      document.body.appendChild(script);
    });

    const Razorpay = (window as RazorpayWindow).Razorpay;
    if (!Razorpay) {
      setError("Payment could not start");
      return;
    }

    const checkout = new Razorpay({
      key: keyId,
      order_id: orderId,
      amount: Math.round(amount * 100),
      currency: "INR",
      name: hotel,
      prefill: { name, contact: phone, email },
      handler: async (response: Record<string, string>) => {
        const verified = await fetch(`/api/public/${slug}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservationId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
        });
        const data = await verified.json().catch(() => ({}));
        if (!verified.ok) {
          setError(data?.error || "Payment could not be confirmed");
          return;
        }
        setDone("Booking confirmed");
      }
    });
    checkout.open();
  }

  async function book() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/public/${slug}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomTypeId: selected,
        checkIn,
        checkOut,
        adults: Number(adults) || 2,
        children: 0,
        guest: { name: name.trim(), phone: phone.trim(), email: email.trim() }
      })
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data?.error || "Could not hold the room");
      return;
    }

    const payload = data?.data ?? {};
    if (payload.orderId && payload.keyId) {
      await pay(payload.reservationId, payload.orderId, payload.keyId, payload.amount ?? 0);
      return;
    }
    setDone("Request received");
  }
  // RENDER
  if (done) {
    return (
      <div className="surface-card p-6 text-center">
        <p className="text-lg font-semibold text-text-primary">{done}</p>
        <p className="mt-1 text-sm text-text-secondary">
          {hotel} · {checkIn} → {checkOut}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="surface-card flex flex-wrap items-end gap-2 p-4">
        <label className="text-sm">
          <span className="font-medium text-text-secondary">Check-in</span>
          <input
            type="date"
            className="mt-1 h-9 rounded-xl border border-border-subtle bg-white px-3 text-sm"
            value={checkIn}
            min={iso(new Date())}
            onChange={(event) => setCheckIn(event.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-text-secondary">Check-out</span>
          <input
            type="date"
            className="mt-1 h-9 rounded-xl border border-border-subtle bg-white px-3 text-sm"
            value={checkOut}
            min={checkIn}
            onChange={(event) => setCheckOut(event.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-text-secondary">Guests</span>
          <input
            type="number"
            min={1}
            max={12}
            className="mt-1 h-9 w-20 rounded-xl border border-border-subtle bg-white px-3 text-sm"
            value={adults}
            onChange={(event) => setAdults(event.target.value)}
          />
        </label>
      </section>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <section className="space-y-2">
        {types.length === 0 ? (
          <p className="surface-card p-4 text-sm text-text-muted">No rooms for those dates</p>
        ) : null}
        {types.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setSelected(type.id)}
            className={`surface-card flex w-full items-center justify-between p-4 text-left ${
              selected === type.id ? "ring-2 ring-text-primary" : ""
            }`}
          >
            <span>
              <span className="block font-medium text-text-primary">{type.name}</span>
              <span className="block text-xs text-text-muted">
                {type.maxOccupancy} guests{type.amenities.length ? ` · ${type.amenities.join(" · ")}` : ""}
              </span>
            </span>
            <span className="text-right">
              <span className="block font-semibold text-text-primary">{formatCurrency(type.total)}</span>
              <span className="block text-xs text-text-muted">{formatCurrency(type.nightlyRate)} / night</span>
            </span>
          </button>
        ))}
      </section>

      {room ? (
        <section className="surface-card space-y-3 p-4">
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="font-medium text-text-secondary">Name</span>
              <input
                className="mt-1 h-9 w-48 rounded-xl border border-border-subtle bg-white px-3 text-sm"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="font-medium text-text-secondary">Phone</span>
              <input
                className="mt-1 h-9 w-40 rounded-xl border border-border-subtle bg-white px-3 text-sm"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="font-medium text-text-secondary">Email</span>
              <input
                className="mt-1 h-9 w-56 rounded-xl border border-border-subtle bg-white px-3 text-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {formatCurrency(room.total)} incl. {formatCurrency(room.tax)} tax
            </p>
            <Button size="sm" disabled={busy || !name.trim() || phone.trim().length < 6} onClick={() => void book()}>
              {busy ? "Holding…" : "Book"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
